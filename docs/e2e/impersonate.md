# impersonate

Run 2026-10-06T19:33:48.436Z against http://127.0.0.1:3000.

| screenshot | user | URL | shows |
|---|---|---|---|
| ![](impersonate-profile-link.png) | admin | `/users/6` | Admin sees "Impersonate" with an icon next to Edit on a user profile |
| ![](impersonate-edit-link.png) | admin | `/users/6/edit` | The link is also on the edit page |
| ![](impersonate-own-profile.png) | admin | `/users/1` | On the own profile there is no Impersonate link |
| ![](impersonate-locked-profile.png) | admin | `/users/8` | A locked user cannot be impersonated: no link |
| ![](impersonate-impersonating.png) | admin | `/` | Logged in as reporter: red bar with Cancel, user menu shows reporter |
| ![](impersonate-no-admin-while-impersonating.png) | admin | `/admin` | While impersonating, admin pages are refused (reporter is no admin) |
| ![](impersonate-nested-refused.png) | admin | `/my/page` | A second impersonation from inside is refused, still reporter |
| ![](impersonate-cancelled.png) | admin | `/my/page` | After Cancel: back as admin, no bar |
| ![](impersonate-failures-keep-admin.png) | admin | `/my/page` | Impersonating a locked or unknown user fails with 404 and the admin session stays |
| ![](impersonate-sudo.png) | admin | `/admin/impersonation?user_id=7` | After Cancel the session is new, so sudo mode asks for the admin password again |
| ![](impersonate-outsider-private.png) | admin | `/projects/e2e-private` | Impersonating outsider: the private project is refused |
| ![](impersonate-outsider-public.png) | admin | `/projects/e2e-project` | The public project is visible, bar present |
| ![](impersonate-anonymous.png) | anonymous | `/users/6` | Anonymous: no link |
| ![](impersonate-manager.png) | manager | `/users/6` | A project manager without admin rights gets no link |
