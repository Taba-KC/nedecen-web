# Security hardening — 28 October 2026

This records the targeted fixes in the frontend and the sibling Project-Edu-Revo backend. It is not a claim that every possible vulnerability has been eliminated.

## Access boundaries

- Public school listing, school details and school activation responses now explicitly whitelist fields and omit activation codes.
- Creating schools through the legacy seed endpoint, creating subjects, and writing/importing shared chapters or concepts require an authenticated, currently enabled platform manager. Being a school principal does not authorize editing the platform curriculum.
- School activation changes only a previously inactive school, including when requests race.
- Account claiming still uses its existing identity checks, as explicitly requested. Its underlying identity-proof weakness remains unresolved. Claim/activation requests now have an IP attempt limit.

## Browser sessions

Login returns a short-lived access token, held in JavaScript memory. The refresh credential is stored as a host-only HttpOnly cookie scoped to `/auth`; it is not returned in login JSON or saved in localStorage. Existing localStorage sessions migrate on their next refresh. Browser account/category/school metadata remains in localStorage for navigation; the backend never treats that metadata as permission.

Authenticated fetches include credentials. Auth endpoints reject foreign browser origins. Cookie-authenticated refresh/logout requests also require a trusted Origin. SameSite defaults to Lax, and production cookies are Secure. Refresh checks the account still exists, is enabled/activated and retains the expected school. JWT verification explicitly permits HS256 only.

All roles use server logout to delete the refresh-token hash and clear the cookie. Local cleanup happens immediately, with a keepalive request for revocation. Other open tabs clear their in-memory session when account metadata changes. Late refresh responses cannot restore the frontend's signed-out session.

Limits: an already copied access token can remain usable until its 15-minute expiry, subject to the live permission checks on its endpoint. Offline sign-out clears the browser state but cannot guarantee server revocation until connectivity returns. HttpOnly cookies reduce credential theft through JavaScript; they do not make injected scripts harmless. A strict Content Security Policy and a full XSS review remain separate work.

## Attempt limiting

Migration `0028_auth_attempt_limits.sql` adds database-backed atomic fixed windows shared by every backend process. Keys are SHA-256 hashes; raw addresses and credentials are not stored. Login limits are 12 attempts per normalized username/account type per 15 minutes, plus 300 requests per IP per 15 minutes across login endpoints. Claim/activation has 300 per IP per 15 minutes; refresh has 600. Logout remains available when those limits are exhausted. Rejections return HTTP 429 and Retry-After. Expired windows are cleaned hourly.

These controls reduce automated guessing; they cannot prevent distributed abuse or targeted account lockout by themselves. Shared school networks may need carefully monitored quota adjustments.

## Deployment configuration

Backend environment:

- `NODE_ENV=production` on the production server.
- `JWT_SECRET`: a unique random secret of at least 32 characters. Production startup rejects missing/short values. Do not commit it.
- `FRONTEND_ORIGINS`: comma-separated exact frontend origins, including scheme and port where applicable. Production requires this configuration. No trailing slash. Local defaults are http://localhost:3001 and http://127.0.0.1:3001.
- `AUTH_COOKIE_SAME_SITE=lax` for same-site frontend/API hosting. Prefer HTTPS domains such as app.example.com and api.example.com. If the frontend and API are truly cross-site, `none` requires HTTPS and can still be affected by browser third-party-cookie policies.
- `TRUST_PROXY_HOPS`: set only to the known reverse-proxy hop count of the deployment. An incorrect value can make IP limiting trust forged forwarded addresses.

Frontend: set `NEXT_PUBLIC_API_URL` to the HTTPS API origin for production, and rebuild after changing it. Both applications must use compatible hostnames locally (localhost with localhost, rather than mixing localhost and 127.0.0.1).

Apply backend migrations before starting the new backend. Migration 0028 was applied successfully to the currently configured development database. Deploy the frontend and backend together because login's refresh-token transport changed.

## Response and cache protection

The API sends no-store, nosniff, frame denial and a restrictive referrer policy. The frontend adds nosniff, frame denial, a referrer policy and disables unused camera/microphone/location features. The service worker's runtime caching is limited to Next build assets; authenticated API responses and pages are not runtime-cached. Sign-out also clears old CacheStorage entries from earlier versions.

## Verification

- Backend build and frontend TypeScript/targeted ESLint passed.
- `npm run test:security-hardening`: 25 HTTP/database checks, with fixtures rolled back. Covers public-field redaction, anonymous/principal/disabled-manager write rejection, manager writes, cookie flags, origin rejection, refresh, logout revocation/replay and shared attempt limits.
- Existing school, teacher HTTP, learner, curriculum, roster HTTP and dashboard HTTP suites passed.
- Browser cookie-session check passed: no persisted tokens, HttpOnly cookie inaccessible to document.cookie, session restoration after reload, sign-out request and cookie removal.
- Cross-role 360px mobile browser regression passed.

No deployment, external penetration test, dependency advisory audit or Azure configuration audit was performed as part of this targeted pass. Account claiming remains the explicit exception above.
