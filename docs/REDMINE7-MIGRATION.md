# Redmine 7 migration: redmine_impersonate

Start a Claude Code (or Codex) session on this repository, branch `redmine70-migration`, with:

> Read CLAUDE.md and docs/REDMINE7-MIGRATION.md, then carry out the Redmine 7 migration of this
> plugin as described there, on branch redmine70-migration. That includes the plugin's tests on
> PostgreSQL and MariaDB, every function exercised end to end on a real running Redmine in a
> browser (with and without permissions, failure paths included) with screenshots you looked at,
> and an OpenAI review of the diff when OPENAI_API_KEY is set. Report to me in Dutch at the end.

This file is the plan and the memory of that work. Update it as you go: verdicts, results,
what is left. Written 2026-10-06 from a measured analysis (report at the bottom).

## Status

| | |
|---|---|
| Plugin id | `redmine_impersonate` |
| GEOxyz runs today | `master` |
| Upstream | nounder/redmine_impersonate master @ 925179f (2024-05-20) |
| Runs on Redmine 7 as is | JA (after the test helper fix `1494093`) |
| Upstream sync | UPSTREAM DOOD |
| After sync | n.v.t. |
| Complexity (1 trivial .. 5 rewrite) | 1 |
| Measured on | Redmine 7.0.1 (7.0-stable-GEOxyz + latest 7.0-stable), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16 and MariaDB 10.11 |
| Branch head when this file was written | `677a124` |

## Already on this branch

- `1494093` Silence deprecations through Rails.application.deprecators on Rails 7.1+
- `5cfa1a7` Impersonate link with a Redmine 7 SVG icon (`sprite_icon`; CSS icon class kept for older versions), with a test
- `457f3bb` End-to-end scenario `test/e2e/impersonate.mjs`, seed `test/e2e/seed.rb`, screenshots in `docs/e2e/`

## Result of the migration session (2026-10-06, Redmine 7.0.1 `7.0-stable-GEOxyz`, Rails 8.1, Ruby 3.3.6)

| | PostgreSQL 16.15 | MariaDB 10.11.14 |
|---|---|---|
| Baseline minitest (before changes) | 10 runs, 28 assertions, 0 failures | 10 runs, 28 assertions, 0 failures |
| minitest after changes | 11 runs, 33 assertions, 0 failures, 0 errors, 0 skips | 11 runs, 33 assertions, 0 failures, 0 errors, 0 skips |
| e2e (production mode): smoke / core / impersonate | 10 / 6 / 14 screenshots, 0 problems | 10 / 6 / 14 screenshots, 0 problems (output in a temp dir, same pictures) |

- The new test (`impersonate link has an icon`) fails without the hook change (1 failure seen), passes with it.
- Migrations: the plugin has none. Boot and eager load are exercised by the production-mode server.
- Redmine 5.1: not run, the 5.1 core needs Ruby < 3.3 and only 3.3.6 is available here. The change is guarded with `respond_to?(:sprite_icon)` and keeps the old `icon icon-user` class, so it should behave as before on 5.1/6.1. Unverified.
- Together with other GEOxyz plugins: not run in this session (no other plugin checkout; the plugin touches only its own hook and controller).
- OpenAI review (`gpt-5`, `docs/reviews/openai-2026-10-06-457f3bb.md`): no findings. My own adversarial read of the diff found nothing further.
- Webhooks (Redmine 7): the plugin does not hide, add or change issue data, so nothing to make consistent. Note: a webhook fires as the acting user, so while impersonating it is the impersonated user's webhook rules that apply.
- Not testable here: real 2FA devices (the 2FA path is covered by the existing integration test `impersonating user requiring twofa works`), LDAP/SSO.

## Work list for the migration session

In this order: things that break, security, the GEOxyz changes, the open items, then the checks.

**Open items from the analysis** (Dutch; where they conflict with a decision or a priority item above, those win)

1. Cosmetic: impersonate link has no SVG icon on Redmine 7 - DONE in `5cfa1a7`, e2e `impersonate-profile-link.png`
2. Known interplay with redmine_stealth: toggling stealth while impersonating changes the impersonated user's preference - DEFERRED, not fixed: redmine_stealth is not in this repo and impersonation by definition acts as that user, so the preference of the impersonated user is what is written. Workaround: toggle stealth after Cancel. Recorded under "Open questions for Jan".

**Checks**

3. (DONE on 7.0-stable-GEOxyz, PostgreSQL and MariaDB; 5.1 not run, see result) Run the plugin's whole test suite on Redmine 7.0-stable-GEOxyz with PostgreSQL AND MariaDB, and once on 5.1-stable if the branch is meant to stay 5.1-compatible.
4. (DONE, nothing needed) Check Redmine 7 webhooks against this plugin (see "Rules"), and note the result here even if nothing is needed.
5. (DONE, see inventory) Verify every feature of the plugin by hand on a running Redmine 7 (screenshots).

## GEOxyz changes to review or re-apply

These GEOxyz commits are on the branch GEOxyz runs today and therefore on this branch. Review each one against the code it now sits on (upstream merges and Redmine 7 core): drop it if upstream or core now does the same, rewrite it if it is not up to the quality rules below (tests, I18n, security, portability), keep it otherwise. Record the verdict per commit in this file.

| commit | date | subject |
|---|---|---|
| `845446c` | 2025-09-14 | Patch: fix impersonation issue with 2FA |

Verdict `845446c`: KEEP. The session deletes `must_activate_twofa` after `start_user_session`; Redmine 7 core does not do this for an impersonated session (the existing test `impersonating user requiring twofa works` asserts it and passes on 7.0). Code, README note and test are fine as they are.

## After the upgrade (production)

Actions the person doing the upgrade must take, or know about, for this plugin:

- None. No migrations, no settings, no data fixes. Sudo mode (on by default in Redmine 7) asks the admin for the password when starting an impersonation, and again after Cancel because the session is renewed; this is expected.

## Inventory of functions

| function | how a user reaches it | scenario | screenshot |
|---|---|---|---|
| Impersonate link on profile | admin, /users/:id | `test/e2e/impersonate.mjs` | `docs/e2e/impersonate-profile-link.png` |
| Impersonate link on edit page | admin, /users/:id/edit | same | `impersonate-edit-link.png` |
| No link: own profile, locked user, anonymous, non-admin manager | same pages | same | `impersonate-own-profile.png`, `-locked-profile.png`, `-anonymous.png`, `-manager.png` |
| Start impersonation (POST /admin/impersonation, sudo mode) | click the link | same | `impersonate-sudo.png`, `impersonate-impersonating.png` |
| Impersonation bar and Cancel (DELETE /admin/impersonation) | red bar on every page | same | `impersonate-impersonating.png`, `impersonate-cancelled.png` |
| Impersonated user keeps own permissions (no admin, private project hidden) | while impersonating | same | `impersonate-no-admin-while-impersonating.png`, `-outsider-private.png`, `-outsider-public.png` |
| Refusals: nested POST as non-admin 403, locked or unknown user 404, session stays admin | POST | same | `impersonate-nested-refused.png`, `-failures-keep-admin.png` |
| 2FA activation skipped for the impersonated user | integration test only (needs a real 2FA setup) | `test/integration/impersonation_test.rb` | n.a. |
| Hook on the people plugin page (`view_people_show_details_bottom`) | redmine_people only | not testable, plugin not installed | n.a. |
| Mail, REST API, rake, cron, macros, settings | none exist | n.a. | n.a. |

## Open questions for Jan

1. redmine_stealth interplay (toggle while impersonating changes the impersonated user's preference). Options: (a) leave as is and tell admins to toggle after Cancel (chosen, no behaviour lost); (b) have the plugin block preference writes of the real admin's stealth while impersonating, which needs a change in redmine_stealth. Recommendation: (a).
2. Redmine 5.1 and the other GEOxyz plugins in combination were not run here (Ruby 3.3 only, no other plugin checkouts). Run the manual GitHub workflow with 5.1-stable if the branch must stay 5.1-compatible.

## How to test

```sh
./.codex/redmine_clone.sh 7.0-stable-GEOxyz      # or 5.1-stable / 6.1-stable / 7.0-stable
./.codex/test_setup.sh                                 # RMP_DB=mariadb for MariaDB, RMP_PROVISION_DB=0 if a server runs
./.codex/test_plugin.sh                                # minitest + rspec of this plugin
```

```sh
./.codex/start_server.sh       # real Redmine (production mode) with this plugin, seeded users and projects
./.codex/e2e.sh                # browser: smoke over the plugin's pages, core issue flows, test/e2e/*.mjs
./.codex/openai_review.sh      # independent OpenAI review of the diff, only when OPENAI_API_KEY is set
```
Write one scenario per function in `test/e2e/<function>.mjs` (example at the top of
`.codex/e2e/lib.mjs`); screenshots and a table per scenario land in `docs/e2e/`. Users:
`admin`, `manager` (every permission), `reporter` (no plugin permissions), `outsider` (no
membership); password `Redmine7Test!`. Needs Node with Playwright and Chromium
(`npm install -g playwright && npx playwright install --with-deps chromium`).

On GitHub the same runs by hand only: Actions > "Redmine tests (manual)" > Run workflow (tick
"e2e" for the browser run; screenshots come back as an artifact).

The coordinator's harness (`plugin-check.sh` in the migration kit, kept outside this repo) adds a
browser smoke test of every page the plugin adds and runs all GEOxyz plugins together; the
results quoted in the analysis come from it.

## How the migration session works (same for every plugin)

1. **Start**: `git fetch && git checkout redmine70-migration && git pull`. Read this whole file,
   including the analysis report at the bottom. Do not reopen decisions recorded here.
2. **Baseline, before you change anything**:
   - the plugin's tests on Redmine 7.0-stable-GEOxyz with PostgreSQL and with MariaDB;
   - a real running Redmine with this plugin (`./.codex/start_server.sh`) and the browser run
     (`./.codex/e2e.sh`: smoke over every page the plugin adds, plus the core issue flows).
   Write the numbers here. Something already broken now is a finding, not your regression.
3. **Inventory of functions**: list every function of the plugin in this file, in a table
   "function | how a user reaches it | scenario | screenshot". Take them from the README,
   `init.rb` (permissions, menus, settings, project modules), routes, hooks and view
   overrides, macros, mail handling, API endpoints, rake tasks and cron jobs. This table is the
   coverage list for step 8; a function that is not in it will not be tested.
4. **GEOxyz changes**: go through the table above, one item at a time. Each kept or re-made change
   is its own commit with a test that proves it. Record the verdict in the table.
5. **Work list**: then the numbered list, in order. One concern per commit.
6. **Portability**: everything must run on Redmine's supported databases (PostgreSQL,
   MySQL/MariaDB; SQLite where the plugin already supports it). Migrations must be reversible and
   are run down and up on PostgreSQL and MariaDB.
7. **Together**: run with the other GEOxyz plugins installed (the migration kit's harness, or
   `RMP_EXTRA_PLUGINS`). A failure that only appears in combination is a finding to record here.
8. **End to end, visually, every function**: on the real Redmine from `start_server.sh`
   (production mode, the way GEOxyz runs it), write one scenario per function in
   `test/e2e/<function>.mjs` with `.codex/e2e/lib.mjs` and run them with `./.codex/e2e.sh`.
   - Each function as the users that matter: `admin`, `manager` (every permission, the
     plugin's included), `reporter` (member without the plugin's permissions), `outsider`
     (no membership, private project must stay invisible).
   - The failure paths too: setting off, permission absent, empty state, invalid input, the
     value that used to raise. A refusal that is shown is evidence as much as a success.
   - One screenshot per function and per path, with a caption saying what it proves. Open
     every screenshot and look at it: a picture nobody looked at proves nothing. Commit them
     in `docs/e2e/` and list them in the inventory table.
   - Functions without a page (mail in and out, REST API, rake tasks, cron, webhooks): exercise
     them against the same running instance (mails land in `redmine/tmp/mails`, `t.mails()`
     reads them; API through `t.page.request`) and record command and result.
   - Before pictures where behaviour or layout changes: the branch GEOxyz runs today, on
     Redmine 5.1, same scenarios, `RMP_E2E_OUT=docs/e2e/before`.
   - Run the whole e2e set once on MariaDB as well (`RMP_DB=mariadb`, then `start_server.sh --reset`).
9. **Independent review**: first your own, adversarial: re-read the whole diff as if someone
   else wrote it and you are paid to reject it. Then, **when `OPENAI_API_KEY` is set in the
   session**, `./.codex/openai_review.sh`: it sends the diff of this branch to an OpenAI model
   and writes `docs/reviews/openai-<date>-<sha>.md`. Every finding gets a `Resolution:` line
   there (fixed in <commit>, with a test, or why not). Fix, re-run the tests and the e2e set,
   and run the review again until it has nothing new that you accept. Without the key: write
   "OpenAI review: skipped, no OPENAI_API_KEY" in the report; never send code anywhere else.
10. **After the upgrade**: anything the production upgrade must do for this plugin (data fixes,
    settings, cron, files, removed features) goes into the section "After the upgrade".
11. **Finish**: update "Status", the inventory and the work list in this file, push
    `redmine70-migration`, and report: what changed, test numbers on both databases, e2e
    numbers (scenarios, screenshots, problems), the review result, what is left, what needs Jan.

### Stop and ask Jan when
- a GEOxyz change would be lost or behave differently for users;
- a new gem, a new setting with user impact, or a schema change not required by Redmine 7 seems needed;
- the change would send data to an external service (the OpenAI review of the code diff is the
  one exception Jan approved, and only when the key is present);
- upstream and GEOxyz disagree on behaviour and both are defensible.

## Rules

- **Target**: Redmine 7.0-stable-GEOxyz (https://github.com/jcatrysse/redmine), Rails 8.1, Ruby 3.3+.
  Core sources for comparison: branches `5.1-stable`, `6.1-stable`, `7.0-stable`, `7.0-stable-GEOxyz`.
- **Evidence**: never report a test, lint, browser check or review as passed without having seen
  it. Quote the summary lines; list the screenshots. "Should work" is not a result, and a green
  test suite is not proof that a feature works in the browser.
- **Tests**: never skip, delete or weaken a test. A test that encodes Redmine 5 markup or
  behaviour is updated to Redmine 7, with the reason in the commit. Every fix gets a test that
  fails without it.
- **Minimal diffs** in the plugin's own style. No reformatting, no unrelated refactoring.
  Something wrong elsewhere: write it down here, do not fix it in passing.
- **Security**: authorization on every action and entry point; `safe_attributes`, never
  `to_unsafe_hash` into `update`; no SQL built from params; no secrets in logs; no `html_safe` on
  user input.
- **Webhooks (new in Redmine 7)**: core sends issue payloads (core `issues/show.api.rsb`, rendered
  as the webhook owner) to webhook endpoints, past plugin hooks and controller patches. If the
  plugin hides, adds or changes issue data, make webhooks consistent with that or record why not.
- **Redmine 7 conventions**: SVG icons through `sprite_icon` (the `icon icon-*` CSS is gone),
  Propshaft assets under `assets/` (`/assets/plugin_assets/<id>/...`), the new header and user menu,
  `ContextMenus::*Controller`, Loofah-based text formatting, Chart.js as an ES module, sudo mode
  (on by default: `t.sudo()` in a scenario). The breaker list is in the migration kit's CHECKLIST.md.
- **Locales**: keep the locales the plugin ships in sync; translate a new key by matching the
  closest existing key in the same file, not from scratch; do not add new languages.
- **5.1 compatibility**: prefer fixes that also run on Redmine 5.1 so they can be merged early;
  say so when a fix cannot.
- **Git**: work on `redmine70-migration` only; never push to the default branch; never force-push
  a branch someone else uses. Descriptive commit messages (what and why). Push after every
  commit, together with the updated status in this file: a cloud session can stop at a usage
  limit, and work that is not pushed is lost with its container.
- **GitHub Actions**: manual only (`workflow_dispatch`). Do not add push, pull_request or schedule
  triggers.

## Definition of done

- All items of the work list are done or explicitly deferred with a reason, in this file.
- The plugin's tests are green on Redmine 7.0-stable-GEOxyz with PostgreSQL and MariaDB
  (numbers in this file); boot, production-like eager load, migrations up/down OK.
- Every function in the inventory exercised end to end on a real running Redmine, with and
  without permissions and on its failure paths; `./.codex/e2e.sh` green; screenshots looked at,
  committed in `docs/e2e/` and listed.
- Review done: your own, and the OpenAI review when the key is present, every finding resolved
  in `docs/reviews/`.
- No new failure when run together with the other GEOxyz plugins.
- "After the upgrade" lists every action production needs; "Status" is current.


## Analysis report (2026-10-06, Dutch)

# redmine_impersonate
- Gebruikte branch: master @ 845446c (2025-09-14) - plugin id redmine_impersonate, versie 2.0.0
- Upstream: nounder/redmine_impersonate (voorheen rgtk) - upstream HEAD master @ 925179f (2024-05-20)
- Fork t.o.v. upstream: 1 eigen commit (845446c "fix impersonation issue with 2FA"), 0 upstream-commits ontbreken
- Andere relevante branches: upstream redmine-3.x (2019), redmine-2.x (2017) - oud. Geen Redmine 6/7-branch.
- Geen Gemfile, geen migraties. Tests: 10 integratietests.

## 1. Werkt out of the box op Redmine 7?   DEELS
- Harness (results/1006-085135-...): OK boot, eager load, migraties, smoke 60/60.
- `FAIL minitest`: test/test_helper.rb:20 `ActiveSupport::Deprecation.behavior = :silence` -> NoMethodError (singleton-API weg in Rails 7.2). Alleen de testsuite; de plugin zelf werkt.

## 2. Upstream sync?   UPSTREAM DOOD
- Laatste upstream-commit 2024-05-20 (README); fork bevat alles. Niets te synchroniseren.

## 3. Werkt na sync op Redmine 7?   n.v.t.

## 4. Complexiteit en blokkers   score 1
- Blokkers:
  - test/test_helper.rb:20 - deprecations stilzetten via `Rails.application.deprecators` (oude call blijft voor oudere Rails) - gefixt in 1494093. Daarna 10 runs, 0 failures.
- Header-redesign (#43937, #31353): raakt de plugin niet. De plugin injecteert niets in `#top-menu`/`#account`. Live geverifieerd:
  - Link "Impersonate" wordt via inline jQuery naar `#content > .contextual` verplaatst op /users/:id en /users/:id/edit (werkt).
  - Impersonatiebalk (`#impersonation-bar`) staat bovenaan de pagina, boven de nieuwe navigatiebalk; de dropdown toont de geïmpersoneerde gebruiker; "Cancel" zet terug naar admin.
- Stille breuken:
  - Link heeft geen SVG-icoon (naast "Edit" mét icoon) - cosmetisch.
  - De balk komt uit `view_layouts_base_html_head`, dus een `<div>` in `<head>`; de browser verplaatst hem naar `<body>`. Ongeldige HTML, werkt (pre-existing).
  - Sudo-modus staat in 7.0 standaard aan voor nieuwe installaties (#44052); `require_sudo_mode :create` kan dan om het wachtwoord vragen (gewenst gedrag).
- Conflicten: met redmine_stealth - wie stealth omschakelt tijdens impersonatie, zet de voorkeur van de *geïmpersoneerde* gebruiker (live: dev=true bleef na Cancel, tot dev's volgende login).
- Overlap met Redmine 7 core: geen.
- Open werk voor ansif: niets dringends; eventueel `sprite_icon` voor de link.

## Branch redmine70-migration
- Basis: origin/master @ 845446c
- Commits: 1494093 Silence deprecations through Rails.application.deprecators on Rails 7.1+
- Eindresultaat harness (results/1006-093552-s3-redmine_impersonate_redmine70-migration): OK bundle, boot, eager load, migraties dev+test, OK minitest 10 runs, 28 assertions, 0 failures, 0 errors, OK smoke 60/60. (Run 1006-093233 is ongeldig: bleef hangen op een achtergebleven puma, zie eindbericht.)
- Rollback migraties: n.v.t.

