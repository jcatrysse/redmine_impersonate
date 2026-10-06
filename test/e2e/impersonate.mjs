// Impersonate: the link on a user's profile and edit page, logging in as that user, the bar,
// Cancel, and the refusals (no admin, self, locked user, unknown user, nested impersonation).
import { e2e } from '../../.codex/e2e/lib.mjs';

const t = await e2e('impersonate');
const BAR = '#impersonation-bar';

async function userId(login) {
  await t.go('/users?set_filter=1&f[]=status&op[status]=*&f[]=name&op[name]=~&v[name][]=' + login);
  const href = await t.page.locator('td.login a', { hasText: new RegExp(`^${login}$`) }).first().getAttribute('href', { timeout: 3000 }).catch(() => null);
  return href ? href.match(/\/users\/(\d+)/)[1] : null;
}
const check = (cond, msg) => { if (!cond) t.problems.push(msg); };

// --- admin: link on the profile and the edit page
await t.login('admin');
const reporterId = await userId('reporter');
const managerId = await userId('manager');
const lockedId = await userId('locked');
check(reporterId && managerId, 'seeded users not found');

await t.go(`/users/${reporterId}`);
check(await t.page.locator('#content > .contextual > #impersonate').count() === 1, 'profile: link not in the contextual menu');
check(await t.page.locator('#impersonate svg').count() === 1, 'profile: link has no SVG icon');
await t.shot('profile-link', 'Admin sees "Impersonate" with an icon next to Edit on a user profile');

await t.go(`/users/${reporterId}/edit`);
check(await t.page.locator('#impersonate').count() === 1, 'edit: link missing');
await t.shot('edit-link', 'The link is also on the edit page');

const adminLink = await t.page.goto(t.BASE + '/users/1'); await t.settle();
check(await t.page.locator('#impersonate').count() === 0, 'own profile shows the link');
await t.shot('own-profile', 'On the own profile there is no Impersonate link');

if (lockedId) {
  await t.go(`/users/${lockedId}`);
  check(await t.page.locator('#impersonate').count() === 0, 'locked user shows the link');
  await t.shot('locked-profile', 'A locked user cannot be impersonated: no link');
}

// --- impersonate
await t.go(`/users/${reporterId}`);
await t.page.click('#impersonate');
await t.settle();
if (await t.page.locator('#sudo_password').count()) await t.shot('sudo', 'Sudo mode asks for the admin password before impersonating');
await t.sudo();
await t.settle();
t.check('impersonate');
check(await t.page.locator(BAR).count() === 1, 'impersonation bar missing after Impersonate');
check((await t.page.locator('#account .user-login').textContent()).includes('@reporter'), 'not logged in as reporter');
await t.shot('impersonating', 'Logged in as reporter: red bar with Cancel, user menu shows reporter');

await t.go('/admin', { status: 403 });
await t.shot('no-admin-while-impersonating', 'While impersonating, admin pages are refused (reporter is no admin)');

// a non-admin has no link, and nested impersonation by POST is refused
const csrf = await t.page.locator('meta[name=csrf-token]').getAttribute('content');
const res = await t.page.request.post(t.BASE + '/admin/impersonation', { form: { user_id: managerId, authenticity_token: csrf, sudo_password: 'Redmine7Test!' } });
check(res.status() === 403, `nested POST as non-admin: HTTP ${res.status()}, expected 403`);
await t.go('/my/page');
check((await t.page.locator('#account .user-login').textContent()).includes('@reporter'), 'nested POST changed the user');
await t.shot('nested-refused', 'A second impersonation from inside is refused, still reporter');

// --- cancel
await t.page.click(`${BAR} a`);
await t.settle();
t.check('cancel');
check(await t.page.locator(BAR).count() === 0, 'bar still shown after Cancel');
check((await t.page.locator('#account .user-login').textContent()).includes('@admin'), 'not back as admin');
await t.shot('cancelled', 'After Cancel: back as admin, no bar');
await t.go('/admin');

// --- failure paths as admin
await t.go('/users/999999/edit', { status: 404 });
const csrf2 = await t.page.locator('meta[name=csrf-token]').getAttribute('content');
if (lockedId) {
  const r = await t.page.request.post(t.BASE + '/admin/impersonation', { form: { user_id: lockedId, authenticity_token: csrf2, sudo_password: 'Redmine7Test!' } });
  check(r.status() === 404, `locked user POST: HTTP ${r.status()}, expected 404`);
}
const r2 = await t.page.request.post(t.BASE + '/admin/impersonation', { form: { user_id: 999999, authenticity_token: csrf2, sudo_password: 'Redmine7Test!' } });
check(r2.status() === 404, `unknown user POST: HTTP ${r2.status()}, expected 404`);
await t.go('/my/page');
check((await t.page.locator('#account .user-login').textContent()).includes('@admin'), 'failed impersonation changed the session');
await t.shot('failures-keep-admin', 'Impersonating a locked or unknown user fails with 404 and the admin session stays');

// --- private project stays invisible when impersonating the outsider
const outsiderId = await userId('outsider');
await t.go(`/users/${outsiderId}`);
await t.page.click('#impersonate'); await t.settle();
check(await t.page.locator('#sudo_password').count() === 1, 'no sudo prompt after a fresh session');
await t.shot('sudo', 'After Cancel the session is new, so sudo mode asks for the admin password again');
await t.sudo(); await t.settle();
await t.go('/projects/e2e-private', { status: 403 });
await t.shot('outsider-private', 'Impersonating outsider: the private project is refused');
await t.go('/projects/e2e-project');
await t.shot('outsider-public', 'The public project is visible, bar present');
await t.page.click(`${BAR} a`); await t.settle();

// --- not logged in
await t.anonymous();
const a = await t.page.request.post(t.BASE + '/admin/impersonation', { form: { user_id: reporterId }, maxRedirects: 0 });
check([302, 403, 422].includes(a.status()), `anonymous POST: HTTP ${a.status()}`);
await t.go(`/users/${reporterId}`);
check(await t.page.locator('#impersonate').count() === 0, 'anonymous sees the link');
await t.shot('anonymous', 'Anonymous: no link');

// --- manager (no admin)
await t.login('manager');
await t.go(`/users/${reporterId}`);
check(await t.page.locator('#impersonate').count() === 0, 'manager sees the link');
await t.shot('manager', 'A project manager without admin rights gets no link');

await t.done();
