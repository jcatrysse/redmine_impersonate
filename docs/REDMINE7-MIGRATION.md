# Redmine 7 migration: redmine_impersonate

Start a Claude Code (or Codex) session on this repository, branch `redmine70-migration`, with:

> Read CLAUDE.md and docs/REDMINE7-MIGRATION.md, then carry out the Redmine 7 migration of this
> plugin as described there, on branch redmine70-migration. Report to me in Dutch at the end.

This file is the plan and the memory of that work. Update it as you go: verdicts, results,
what is left. Written 2026-10-06 from a measured analysis (report at the bottom).

## Status

| | |
|---|---|
| Plugin id | `redmine_impersonate` |
| GEOxyz runs today | `master` |
| Upstream | nounder/redmine_impersonate master @ 925179f (2024-05-20) |
| Runs on Redmine 7 as is | DEELS |
| Upstream sync | UPSTREAM DOOD |
| After sync | n.v.t. |
| Complexity (1 trivial .. 5 rewrite) | 1 |
| Measured on | Redmine 7.0.1 (7.0-stable-GEOxyz + latest 7.0-stable), Rails 8.1.3.1, Ruby 3.3.6, PostgreSQL 16 and MariaDB 10.11 |
| Branch head when this file was written | `1494093` |

## Already on this branch

- `1494093` Silence deprecations through Rails.application.deprecators on Rails 7.1+

## Work list for the migration session

In this order: things that break, security, the GEOxyz changes, the open items, then the checks.

**Open items from the analysis** (Dutch; where they repeat a priority item, the priority item wins)

1. Cosmetic: impersonate link has no SVG icon on Redmine 7
2. Known interplay with redmine_stealth: toggling stealth while impersonating changes the impersonated user's preference

**Checks**

3. Run the plugin's whole test suite on Redmine 7.0-stable-GEOxyz with PostgreSQL AND MariaDB, and once on 5.1-stable if the branch is meant to stay 5.1-compatible.
4. Check Redmine 7 webhooks against this plugin (see "Rules"), and note the result here even if nothing is needed.
5. Verify every feature of the plugin by hand on a running Redmine 7 (screenshots).

## GEOxyz changes to review or re-apply

These GEOxyz commits are on the branch GEOxyz runs today and therefore on this branch. Review each one against the code it now sits on (upstream merges and Redmine 7 core): drop it if upstream or core now does the same, rewrite it if it is not up to the quality rules below (tests, I18n, security, portability), keep it otherwise. Record the verdict per commit in this file.

| commit | date | subject |
|---|---|---|
| `845446c` | 2025-09-14 | Patch: fix impersonation issue with 2FA |

## After the upgrade (production)

Actions the person doing the upgrade must take, or know about, for this plugin:

- None known. Add here what the session finds.

## How to test

```sh
./.codex/redmine_clone.sh 7.0-stable-GEOxyz      # or 5.1-stable / 6.1-stable / 7.0-stable
./.codex/test_setup.sh                                 # RMP_DB=mariadb for MariaDB, RMP_PROVISION_DB=0 if a server runs
./.codex/test_plugin.sh                                # minitest + rspec of this plugin
```
On GitHub the same runs by hand only: Actions > "Redmine tests (manual)" > Run workflow.

The coordinator's harness (`plugin-check.sh` in the migration kit, kept outside this repo) adds a
browser smoke test of every page the plugin adds and runs all GEOxyz plugins together; the
results quoted in the analysis come from it.

## How the migration session works (same for every plugin)

1. **Start**: `git fetch && git checkout redmine70-migration && git pull`. Read this whole file,
   including the analysis report at the bottom. Do not reopen decisions recorded here.
2. **Baseline**: set up Redmine 7.0-stable-GEOxyz and run the plugin's tests on PostgreSQL and
   on MariaDB (see "How to test"). Write the numbers here before you change anything.
3. **GEOxyz changes**: go through the table above, one item at a time. Each kept or re-made change
   is its own commit with a test that proves it. Record the verdict in the table.
4. **Work list**: then the numbered list, in order. One concern per commit.
5. **Portability**: everything must run on Redmine's supported databases (PostgreSQL,
   MySQL/MariaDB; SQLite where the plugin already supports it). Migrations must be reversible and
   are run down and up on PostgreSQL and MariaDB.
6. **Browser**: start a Redmine 7 with this plugin, exercise every feature as admin and as a
   normal user with and without the plugin's permissions, and save screenshots (before on 5.1 or
   the old branch, after on 7.0) where behaviour or layout matters.
7. **Together**: run with the other GEOxyz plugins installed (the migration kit's harness, or
   `RMP_EXTRA_PLUGINS`). A failure that only appears in combination is a finding to record here.
8. **After the upgrade**: anything the production upgrade must do for this plugin (data fixes,
   settings, cron, files, removed features) goes into the section "After the upgrade".
9. **Finish**: update "Status" and the work list in this file, push `redmine70-migration`, and
   report: what changed, test numbers on both databases, what is left, what needs Jan.

### Stop and ask Jan when
- a GEOxyz change would be lost or behave differently for users;
- a new gem, a new setting with user impact, or a schema change not required by Redmine 7 seems needed;
- the change would send data to an external service;
- upstream and GEOxyz disagree on behaviour and both are defensible.

## Rules

- **Target**: Redmine 7.0-stable-GEOxyz (https://github.com/jcatrysse/redmine), Rails 8.1, Ruby 3.3+.
  Core sources for comparison: branches `5.1-stable`, `6.1-stable`, `7.0-stable`, `7.0-stable-GEOxyz`.
- **Evidence**: never report a test, lint or browser check as passed without having seen it.
  Quote the summary lines. "Should work" is not a result.
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
  `ContextMenus::*Controller`, Loofah-based text formatting, Chart.js as an ES module.
  The breaker list is in the migration kit's CHECKLIST.md.
- **Locales**: keep the locales the plugin ships in sync; translate a new key by matching the
  closest existing key in the same file, not from scratch; do not add new languages.
- **5.1 compatibility**: prefer fixes that also run on Redmine 5.1 so they can be merged early;
  say so when a fix cannot.
- **Git**: work on `redmine70-migration` only; never push to the default branch; never force-push
  a branch someone else uses. Descriptive commit messages (what and why).
- **GitHub Actions**: manual only (`workflow_dispatch`). Do not add push, pull_request or schedule
  triggers.

## Definition of done

- All items of the work list are done or explicitly deferred with a reason, in this file.
- The plugin's tests are green on Redmine 7.0-stable-GEOxyz with PostgreSQL and MariaDB
  (numbers in this file); boot, production-like eager load, migrations up/down OK.
- Every feature verified by hand on Redmine 7; screenshots listed.
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

