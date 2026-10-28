# Chapter 2: You type your details, sign in, and reach the principal's library

Previous: [Chapter 1 — Opening the app](C:/Users/Kgodiso/source/repos/nedecen-web/docs/principal-chapter-01-opening-the-app.md).

**We start exactly where Chapter 1 stopped:** the login form is visible at `http://localhost:3001/`. Both inputs are empty. You have not signed in.

**We stop when:** the principal's library is visible, including the first-visit tutorial question if this browser is eligible for it. We will not open a book yet.

This is one continuous example. Read in order; you do not need to jump back to the large reference guide.

For the story, imagine an already-created and activated principal account:

```text
Username:       principal_demo
Password:       ExampleOnly!42
Person ID:      12
School ID:      7
Database role:  principal
```

These are **invented teaching values**, not credentials to try against your real database. We assume this account exists with a matching password hash. We also assume this is a fresh browser, its theme is light, it has no remembered library location, and this school has no teaching allocations yet. That last assumption keeps our permissions example simple; it does not stop a principal seeing the administrative books.

We picture a desktop browser first. At the end we follow what changes for a phone.

References point to the current source on **28 October 2026**. Frontend files are in `nedecen-web`; backend files are in `Project-Edu-Revo`. Functions with similar names in those two projects are not the same function.

## 1. You click inside Username

**Frontend file: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:158), line 158.**

The browser focuses that input. React calls the function attached to its `onFocus` event:

```tsx
() => setFocusedField("username")
```

The arrow function takes no arguments it uses here. It asks React to change the remembered `focusedField` value from null to `"username"`.

That state change asks React to call `LoginPage()` again. The browser does not ask the backend for anything.

**Execution returns to the page function: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:47), lines 47–50.**

This time:

```text
focusedField === "username"  → true
usernameActive               → true
checkingSession              → false, kept from Chapter 1
```

The page therefore still returns the form, but with a raised username label.

**Same file: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:163), lines 163–165 and [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:173), lines 173–182.**

- Input padding changes to `14px var(--control-px) 0`, leaving room above the text.
- Label top changes from 50% to 0.
- Label transform adds `scale(0.72)`, making it smaller.
- Its color changes to the focus color.
- CSS transitions animate these changes over about 0.15 seconds.

React changes the element properties; the browser draws the movement. It has not created another page or stored anything in PostgreSQL.

**What you now see:** the small Username label sits up on the field border, and the cursor is in the input.

## 2. You type the first character, `p`

**Frontend file: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:157), line 157.**

The browser changes the input text, then React calls its change handler with an event object named `e`.

Follow this expression from inside outward:

```tsx
setUsername(e.target.value)
```

- `e.target` is the input involved in the event.
- `.value` is its complete current text, now `"p"`.
- `setUsername("p")` updates the remembered username state.

React renders LoginPage again. At the input's `value={username}` line, username now supplies `"p"`. That is a **controlled input**: the page's state supplies its value.

The input event does not call `login`. There is no request for each letter.

**Our state now:** username is `"p"`; password is still empty; loading is false; error is null.

## 3. You finish the username and enter the password

For each further change, the same username handler stores the complete text currently in the input. It is not manually appending one letter in your code.

Eventually:

```text
username = "principal_demo"
```

You move into Password. Username's blur handler sets focusedField to null; Password's focus handler sets it to `"password"`. React can combine nearby state updates into a render, so do not expect to see every intermediate focus state painted.

**Frontend file: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:204), lines 204–206.**

Password's change handler follows the same pattern and eventually stores:

```text
password = "ExampleOnly!42"
```

The browser masks its display because this input has `type="password"`. The JavaScript value is still the entered string. Masking is not encryption or password hashing.

When Username loses focus, its label remains raised: the `username !== ""` part of usernameActive is true. Password's label similarly remains raised after it has text.

**Where we are now:** both values are in this browser page's React state. They have not been saved to localStorage or sent to the backend by these input handlers.

## 4. You click Sign in

**Frontend file: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:140), line 140 and [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:238), lines 238–239.**

The button is a submit button belonging to that form. The browser checks the required inputs. Both contain values in our example, so it allows a form submit event.

React invokes `handleSubmit` with that event.

**Same file: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:33), lines 33–39.**

Read its first statements in order:

1. `e.preventDefault()` stops the browser's normal form submission/navigation. Your code will send the request instead.
2. `setError(null)` clears any previous error.
3. `setLoading(true)` marks this submission as running.
4. The `try` block calls `login(username, password)` with our two state values.

`await` says: “Pause this function's continuation until login finishes.” It does not freeze the whole browser.

React can render the loading state while that asynchronous work waits. The button becomes disabled because `disabled={loading}` is now true, and its text becomes **Signing in...**. Those changes come from [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:236), lines 236–248.

**We pause handleSubmit at its await and follow the called function into `src/lib/auth.ts`.**

## 5. The frontend `login()` function receives two strings

**Frontend file: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:30), lines 30–36.**

This is your own helper, not an imported login function from Next or React.

Its inputs are now:

```text
username: "principal_demo"
password: "ExampleOnly!42"
```

Inside its first try block it calls:

```tsx
api.post<LoginResponse>("/auth/people/login", { username, password })
```

- The path names the backend operation we want.
- `{ username, password }` is shorthand for an object with those two named properties.
- `<LoginResponse>` tells TypeScript the expected response shape. It does not send that type to the server and does not validate the response at runtime.
- This endpoint is for school staff accounts. A principal is a staff/person account with a principal role, so this is the correct first attempt.

The learner/manager catch branches are not entered on our successful principal path.

**login now waits for api.post. We follow that call into `src/lib/api.ts`.**

## 6. `api.post` makes the request instructions

**Frontend file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:220), lines 220–221.**

This small function receives the endpoint path and the object we just constructed. It calls `request`, supplying:

```tsx
{
  method: "POST",
  body: JSON.stringify({
    username: "principal_demo",
    password: "ExampleOnly!42"
  })
}
```

`JSON.stringify` converts the JavaScript object into text in a standard data format. This text is the request's **body**, also commonly called its **payload**.

It is not a database INSERT. POST means we are submitting an operation to the backend; the route decides what database work to do.

**Next:** request receives these instructions.

## 7. `request()` checks whether a token is already available

**Frontend file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:174), lines 174–181.**

The inputs are our path/options plus the default `retry=true`.

First it calls getRefreshToken. **Same file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:58), lines 58–61.** This reads only the old, legacy localStorage refreshToken key. In our fresh browser it returns null. Therefore it does not call refreshAccessToken before login.

Back in request, it calls getAccessToken. **Same file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:49), lines 49–52.** This delegates to currentAccessToken.

**Same file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:30), lines 30–35.**

- We are in a browser, so it passes the window check.
- The module's accessToken starts as null.
- It tries to adopt an older localStorage accessToken if present, then removes that old key.
- Our browser has no old token, so it returns null.

**We return to request with `token=null`.** No authentication has happened yet.

## 8. The browser sends the login request

**Frontend file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:182), lines 182–193.**

This file has a similar fetch in the upload helper. For this JSON call, follow the fetch **inside request**, immediately after its token checks.

It combines API_BASE and path:

```text
http://localhost:3000 + /auth/people/login
= http://localhost:3000/auth/people/login
```

`...options` copies method/body into the fetch instructions. `credentials:"include"` allows browser cookies to be sent/received as appropriate. Content-Type tells the backend the body is JSON. Because token is null, the conditional Authorization header contributes nothing.

Our request is approximately:

```http
POST /auth/people/login HTTP/1.1
Host: localhost:3000
Origin: http://localhost:3001
Content-Type: application/json

{"username":"principal_demo","password":"ExampleOnly!42"}
```

This is the first credentials request in our story. The page address stays on port 3001. The request travels to the backend on port 3000.

The browser adds some headers itself, including Origin. You do not have to write them all in fetch.

**Frontend functions waiting now:** handleSubmit waits for login; login waits for api.post/request; request waits for fetch. The button can remain visibly in its loading state.

## 9. The browser may first ask permission to send this cross-origin request

Ports 3001 and 3000 are different browser origins, even though both are localhost. A JSON cross-origin request normally needs a **CORS preflight**, unless a suitable permission result is already cached.

The browser can send an OPTIONS request to the same API address, indicating POST and Content-Type. This is browser-generated permission checking, not a second call to loginPerson.

**Backend file: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:50), line 50.**

The installed `cors` middleware responds for allowed origins. Its default preflight handling normally finishes with 204 and no body. Credentials support is enabled in this configuration.

Allowed origins come from **[Project-Edu-Revo/src/securityConfig.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/securityConfig.ts:2), lines 2–6**. Without overrides in local development they include http://localhost:3001 and http://127.0.0.1:3001.

For this permitted origin, the browser proceeds with POST. The preflight does not reach the password handler or attempt-limit database operation because CORS middleware handles it first.

**We now follow the actual POST through the backend.**

## 10. Express starts passing POST through shared middleware

The backend was already started before you clicked. Its entry [Project-Edu-Revo/src/server.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/server.ts:6), lines 6–19 loads environment configuration and listens on the backend port. Those startup statements are not rerun for every login.

The request now enters the Express application set up in **[Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:42), lines 42–62**.

Express is the installed server library. It keeps an ordered list of request handlers. A **middleware** is a function in that list which can inspect/change a request or response, finish the response, or call `next()` to continue.

For our POST:

1. The cors handler supplies allowed-origin/credential headers.
2. The next handler adds response protection headers, including Cache-Control:no-store. Even though they are set now, they travel back when the eventual response is sent.
3. `express.json({limit:'1mb'})` reads the JSON body text and makes a JavaScript object available as `req.body`.

The handler we will reach later can now read:

```text
req.body.username = "principal_demo"
req.body.password = "ExampleOnly!42"
```

No handler has looked up the principal yet.

## 11. The request is logged, then the IP attempt limiter runs

**Backend file: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:60), lines 60–61.**

The /uploads static handler does not match /auth/people/login. Express moves on to requestLogger.

**File: [Project-Edu-Revo/src/middleware/logger.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/logger.ts:11), lines 11–14.**

This receives req/res/next, writes the method/path to the server console, then calls next. The log line looks like:

```text
POST /auth/people/login
```

It does not log your password and is not a permanent business audit record.

**Back to app.ts: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:67), lines 67–70.**

The login path matches the IP attempt limiter, with scope login-ip, limit 300, window 900 seconds. 900 seconds is 15 minutes.

When the server originally executed attemptLimit(...) during setup, it received a middleware function to register. **Now** Express calls that returned function for this request.

We follow it into authRateLimit.ts before continuing to the login route.

## 12. The limiter constructs a private counter key

**Backend file: [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:7), lines 7–10.**

The returned async function receives req/res/next.

- There is no custom identity function for this IP limiter, so it selects req.ip, falling back to the socket address if necessary.
- It combines scope and address into a string.
- Node's built-in crypto createHash converts that into a SHA-256 hex digest.

We will call the result `IP_COUNTER_HASH`. This is a teaching label, not a literal value from your database.

Why hash it? The table needs a consistent key to count repeated requests, while avoiding storing the raw IP address in the key.

**Next:** the counter reaches PostgreSQL. This is database work **before** the password query.

## 13. Drizzle sends the limiter's counter operation to PostgreSQL

**Backend file: [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:11), lines 11–15.**

The SQL operation means:

1. Try inserting a counter row with this key, attempts 1, expiry 15 minutes from now.
2. If that key already exists, update it instead.
3. If its old window has expired, reset count to 1 and start a fresh window.
4. Otherwise increment attempts and keep the existing expiry.
5. Return attempts plus remaining seconds to wait.

This insert-or-update is called an **upsert**. PostgreSQL performs this counter update atomically, so simultaneous requests do not both overwrite the count with the same new value.

`sql` and `db.execute` come from Drizzle, the database query library. Values inside its SQL template are bound as parameters, rather than pasted into SQL as executable text.

### How that operation reaches the database program

**Supporting backend file: [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts:7), lines 7–9 and [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts:17), lines 17–27.**

This connection setup was already created when the backend loaded:

- `pg` supplies Pool, which reuses PostgreSQL connections.
- DATABASE_URL tells the backend how to reach its database. The browser does not get that private value.
- Drizzle wraps the pool as db.

When db.execute is awaited, the database driver uses a connection, sends the parameterized command, and awaits PostgreSQL's result. Importing a table/schema is not what saves the row; executing the command is.

The actual table was created earlier by **[Project-Edu-Revo/src/db/migrations/0028_auth_attempt_limits.sql](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/migrations/0028_auth_attempt_limits.sql:1), lines 1–2**. Migrations are setup commands, not repeated on each click. Its primary key makes the conflict/upsert possible.

Assuming this is the first attempt in the window, PostgreSQL returns something like attempts 1 and retry_after 900. The exact remaining seconds depend on time.

**We return to the waiting limiter function with that result.**

## 14. The limiter lets the request continue

**Backend file: [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts:15), lines 15–18.**

- It takes the first returned row.
- `row.attempts > limit` is 1 > 300, which is false in our example.
- It therefore calls next().

If it had exceeded 300, it would instead set Retry-After and finish with 429. That branch is not taken here.

Back in app.ts, the refresh and claim limiters do not match this path. Express reaches app.use(authRouter).

**Next:** the authentication router checks the browser origin.

## 15. The auth router checks where the request came from

**Backend file: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:13), lines 13–15.**

Router comes from Express. It groups related handlers; app.use(authRouter) made them reachable.

Its `router.use('/auth',trustedAuthOrigin)` matches our /auth path and calls trustedAuthOrigin.

**File: [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:17), lines 17–21.**

- req.get('Origin') reads http://localhost:3001.
- frontendOrigins returns the permitted origins as explained at preflight.
- Our origin is on the list, so the foreign-origin condition is false.
- The missing-Origin cookie condition is also false because Origin exists.
- next() continues the request.

This is separate from CORS response headers. The route is explicitly checking allowed origins because its authentication operations use browser cookies.

**We return to the auth router.**

## 16. A second limiter counts attempts for this username/category

**Backend file: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:15), line 15.**

The matching POST route has loginLimit before its password handler. This time attemptLimit was configured with a custom identity function.

That identity function takes req and builds a value from:

```text
req.path:           /auth/people/login
req.body.username: principal_demo
```

It trims/lowercases the username for counting and bounds its length. This normalization is for the limiter; it does not rewrite the username later used in the password lookup.

The scope is login-account, limit 12, window 900 seconds. The key therefore differs from the IP key and from the learner/manager login paths.

**Return to authRateLimit.ts, the same middleware body from steps 12–14.** It hashes this identity, executes the same atomic upsert against auth_attempt_windows and checks returned attempts against 12. Assuming a first attempt, 1 > 12 is false, so next() continues.

That is two database counter operations so far—not two password checks.

## 17. The login route validates the payload

**Backend file: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:29), lines 29–34.**

Now its async route callback runs. Inputs are Express's req and res objects. req contains incoming data; res is how the handler builds an outgoing response.

It calls loginSchema.safeParse(req.body).

**Same file: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:17), lines 17–20.**

The installed Zod library supplies z.object/z.string/min/max. This schema expects username and password strings, bounded at 200 and 1024 characters respectively, each at least one character.

Our two strings pass, so safeParse returns an object resembling:

```text
success: true
data: {
  username: "principal_demo",
  password: "ExampleOnly!42"
}
```

The bad-input return 400 is skipped. The route calls:

```ts
await loginPerson(result.data.username, result.data.password)
```

**We pause this route at await and enter the backend service.**

## 18. `loginPerson()` looks for the staff account

**Backend file: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:45), lines 45–47.**

This function receives our username/password strings. It does not receive a role claimed by the browser.

Its first query is:

```ts
const [person] = await db.select().from(people)
  .where(eq(people.username, username));
```

- db.select builds a read query.
- people is the Drizzle table description imported from your schema.
- eq is a Drizzle helper meaning equality.
- username is our function argument, principal_demo.
- await waits for the returned records.
- `[person]` takes the first item from the result array.

The equivalent SQL idea is:

```sql
SELECT * FROM people WHERE username = $1;
-- parameter $1 contains principal_demo
```

The pg/Drizzle connection path is the same one we followed for the counter. PostgreSQL looks up rows in the already-existing people table.

**Table definition: [Project-Edu-Revo/src/db/schema/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/people.ts:8), lines 8–21.** Its columns include role, school ID, username, passwordHash and accountSetUp. The table definition is not inserting a new principal now; we are reading the one we assumed exists.

## 19. PostgreSQL returns the person, and the service checks activation

**Backend file: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:47), line 47.**

Execution continues on the next service line after the awaited select finishes.

For our example, person contains values such as:

```text
id:            12
schoolId:      7
role:          "principal"
username:      "principal_demo"
accountSetUp:  true
passwordHash:  a stored bcrypt hash
```

It also contains other selected staff columns. We are not copying a real password hash into this guide.

The check is:

```ts
if (!person?.accountSetUp || !person.passwordHash)
  throw new Error('Invalid credentials');
```

`?.` safely reads accountSetUp even if no person was found. Here person exists, activation is true, and a hash exists, so neither failure condition applies. The service continues.

It has not checked whether the password matches yet.

## 20. bcrypt checks the password

**Backend file: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:48), lines 48–49.**

bcrypt is an installed password-hashing library. Its compare function takes:

1. The password the user just supplied.
2. The bcrypt hash previously saved for that account.

It returns a Promise resolving to true or false. It does not recover a plaintext password from the hash. On our chosen correct-password path, valid becomes true, so the following invalid-credentials throw is skipped.

This comparison is computation on the backend; it is not another SELECT. The browser is still waiting with Signing in... visible.

**Next:** the service creates the credentials that subsequent requests will use.

## 21. `loginPerson` calls `generateAccessToken`

**Backend file: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:50), line 50.**

The arguments are:

```text
accountId:   12
accountType: "person"
schoolId:    7
role:        "principal"
```

**Same file, called function: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:25), lines 25–27.**

The installed jsonwebtoken library's jwt.sign creates a signed access token from those claims, the private server signing secret, and the 15-minute expiry setting.

The private JWT_SECRET and expiry constants were read/prepared in [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:17), lines 17–19. The TypeScript exclamation mark after process.env.JWT_SECRET is not part of the secret; it tells the type checker the developer expects a value.

A token is a string. It contains readable encoded claims plus a signature. The signature lets the backend later detect a modified token. The claims are not encrypted just because they are encoded.

**The function returns the signed string to loginPerson.** We will call it ACCESS_TOKEN in examples rather than print a real token.

## 22. The service creates a separate refresh credential

**Backend file: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:51), lines 51–53.**

Node's built-in crypto library generates 64 random bytes, then toString('hex') represents them as 128 hexadecimal characters. This credential is separate from the signed access token.

The next statement calls storeRefreshToken(rawRefresh,12,'person',7), and waits.

We therefore leave loginPerson briefly and enter storeRefreshToken.

## 23. The refresh credential's hash is stored in PostgreSQL

**Backend file: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:33), lines 33–40.**

Its inputs are the random raw credential plus account ID/type/school.

Follow the lines:

1. createHash('sha256').update(rawToken).digest('hex') creates a SHA-256 hash. This random-token hash is different from the bcrypt password hash.
2. new Date makes an expiry value starting from now.
3. setDate adds the configured seven days.
4. db.insert(refreshTokens).values(...) sends an INSERT with tokenHash, accountId 12, accountType person, schoolId 7, expiresAt.
5. await waits for PostgreSQL to accept the insert.
6. It returns rawToken to the caller. loginPerson does not need to use that returned value because it already has rawRefresh.

**Table: [Project-Edu-Revo/src/db/schema/refreshTokens.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/schema/refreshTokens.ts:7), lines 7–15.** The database generates the row ID and creation time. tokenHash is unique. The usable raw refresh credential is **not** the value stored in tokenHash.

That insert is another actual database write. The account/password are not replaced; this is a new session credential record.

The overall login service does not wrap its counter reads/writes, person SELECT and refresh INSERT in one large explicit transaction. They are separate operations in the order we have followed.

**We now return to loginPerson, immediately after its await storeRefreshToken.**

## 24. The service returns to the route

**Backend file: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:53), line 53.**

The service resolves with:

```text
{
  accessToken: ACCESS_TOKEN,
  refreshToken: RAW_REFRESH_CREDENTIAL
}
```

This is a JavaScript return inside the backend. It is not yet the HTTP response sent to the browser.

**We return to routes/auth.ts at its waiting `const tokens = await loginPerson(...)`.**

## 25. The route prepares an HttpOnly cookie

**Backend file: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:34), lines 34–36.**

tokens now holds the returned object. Next the route calls writeRefreshCookie(res,tokens.refreshToken).

**File: [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:14), line 14.**

That function invokes Express res.cookie with the name nedecen_refresh, the raw credential, and the result of options().

**Same file: [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts:4), lines 4–8.**

For ordinary local development defaults, options produces:

- httpOnly:true: browser JavaScript cannot read this cookie through document.cookie.
- secure:false locally, unless SameSite none is configured; production uses Secure.
- sameSite:lax by default, restricting when the browser sends it in cross-site contexts.
- path:/auth: it belongs to authentication paths, not every class/catalogue request.
- maxAge: seven days in milliseconds for Express's option.

res.cookie adds a Set-Cookie header to the eventual response. It does not insert another database row.

**We return to the route after writeRefreshCookie.**

## 26. The route sends the successful response

**Backend file: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:36), line 36.**

res.json sends JSON and finishes this handler. No explicit status was set on this success path, so the normal status is 200.

The response is approximately:

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Cache-Control: no-store
Access-Control-Allow-Origin: http://localhost:3001
Access-Control-Allow-Credentials: true
Set-Cookie: nedecen_refresh=RAW_REFRESH_CREDENTIAL; Path=/auth; HttpOnly; SameSite=Lax; ...

{"accessToken":"ACCESS_TOKEN"}
```

The labels ACCESS_TOKEN and RAW_REFRESH_CREDENTIAL stand for generated strings; they are not literal values the real app sends. Other automatically supplied headers/cookie attributes are omitted here.

The JSON does not contain the refresh credential. The cookie carries it separately. The browser handles Set-Cookie, storing the cookie if its rules allow it. Frontend JavaScript cannot read this HttpOnly value from the response headers or document.cookie.

This handler does not call next after sending success, so Express does not continue into every other application's route. No grades/classes query has run just because login succeeded.

**We now cross back to the frontend request function waiting for fetch.**

## 27. The browser receives the response, and our waiting functions resume

**Frontend file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:174), lines 174–210.**

Earlier, this function paused at `await fetch(...)`. Now it has a `Response` object in `res`. This object contains the status, readable headers, and a body that JavaScript can read. It is not yet the plain object `{ accessToken: ... }`.

The code considers whether to refresh an expired session. `shouldRefresh(path, res)` checks for status 401 and excludes authentication paths. Our response is 200, so the retry block does not run. No refresh request is made.

Next, `if (!res.ok)` is false: 200 is a successful status. `parseError` is skipped.

Finally, `return res.json()` reads and parses the response body. Its result is a Promise for a JavaScript object:

```js
{ accessToken: "ACCESS_TOKEN" }
```

That result travels back through the existing chain:

```text
request(...) finishes
  → api.post(...) finishes
    → the await inside frontend login(...) can continue
```

There is no second login request hidden in this return journey. These are functions passing one result back to their callers.

## 28. Frontend login reads the token's claims

**Frontend file: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:36), lines 36–42.**

The successful `api.post` result becomes `res` inside frontend `login`. The next line calls `decodeToken(res.accessToken)`.

**The called helper: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:17), lines 17–25.**

Follow its expression in small pieces:

- `token.split(".")` separates the three JWT sections into an array.
- `[1]` takes the middle section, containing the claims.
- The two `.replace(...)` calls convert URL-safe Base64 characters for decoding.
- The browser's built-in `atob(...)` decodes that section into JSON text.
- `JSON.parse(...)` turns that text into a JavaScript object.
- `return` sends that object back. If these operations throw, `catch` returns `{}`.

For our example, the object includes `accountId: 12`, `accountType: "person"`, `schoolId: 7`, and `role: "principal"`. The JWT library also supplied issue and expiry times.

This helper **does not verify the signature**. It reads the claims so the frontend can choose a destination. The backend will verify the signature before allowing protected work.

## 29. The frontend remembers the session in two different places

**Call site: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:37), lines 37–42.**

First, `rememberAccessToken` receives the generated token string.

**Called function: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:25), lines 25–30.**

`renewal` was not supplied, so its default is false. The function increments `sessionGeneration`, clears any old shared refresh Promise, and assigns the token to the module's `accessToken` variable. This is browser JavaScript memory. It lasts while this loaded app remains alive.

It also removes legacy `accessToken` and `refreshToken` keys from localStorage. New sessions do not put the credentials into those keys.

**Return to frontend login: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:38), lines 38–42.**

These lines store the small pieces of session information the interface needs:

```text
localStorage key    String stored
accountType         person
role                principal
schoolId            7
accountId           12
```

`String(...)` converts numeric claims to strings because localStorage stores strings. The `??` expressions provide fallbacks if claims are absent. In our successful example those fallbacks are not used.

We now have three different things, each with a purpose:

| Where | What is there | Why |
|---|---|---|
| JavaScript memory | Access token | Send it with protected API requests. |
| HttpOnly cookie | Raw refresh credential | Let the server renew the session later. |
| localStorage | Account type, role, school ID, account ID | Help the interface choose and remember its workspace. |

Changing a localStorage role cannot grant backend permissions. Those decisions still happen on the server.

The next line returns `"person"`. This completes frontend `login`. Its learner and manager fallback branches do not run on our successful path.

## 30. The submit handler receives "person" and chooses a destination

**We return to: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:38), lines 38–45.**

The `await` has finished. The local variable `accountType` now contains `"person"`.

The next expression is:

```tsx
router.push(getResumePath(accountType, getRole()));
```

JavaScript must work out the argument before calling `router.push`. So `getRole()` runs first and reads `"principal"` from localStorage.

**Getter: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:86), lines 86–89.**

Then `getResumePath("person", "principal")` runs.

**Destination functions: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:124), lines 124–141.**

`getRedirectPath` tests manager, learner, and principal in that order. The first two tests fail; the principal test succeeds. It returns `/dashboard/principal`.

`getResumePath` stores that in `base`. Because this is not a manager account, it also asks whether this account has a safe remembered principal-library address.

## 31. The app checks for a remembered location, but our browser has none

**Frontend file: [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:66), lines 66–76.**

The argument is `"principal"`: it came from `base.split("/")[2]`.

First, this function calls `identity(role)`.

**Identity helper: [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:11), lines 11–22.**

It reads the account metadata we just stored, validates that the account and school IDs contain digits, and constructs this key:

```text
nedecen.library.v1:person:12:7:principal
```

That key separates this principal's remembered navigation from another account or school on the same device.

Next, `read(user.key)` runs.

**Storage reader: [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:43), lines 43–48.**

No value exists in our fresh browser. `getItem` returns null; `?? "{}"` supplies empty JSON text; `JSON.parse` produces an empty object. The helper returns an object with no `last` address and an empty `books` object.

Back in `rememberedLibraryLocation`, no particular book was requested, so it reads `saved.last`. This is undefined. The `typeof location !== "string"` test returns null immediately. The later URL-validation function is not called on this path.

Back in `getResumePath`, `null ?? base` chooses `/dashboard/principal`.

**We return to the login submit handler with the final destination string.**

## 32. Next.js changes the route; the submit handler finishes

**Frontend call: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:39), lines 39–44.**

`router` came from Next.js's `useRouter`. `push` asks Next.js to navigate and add the destination to browser history. The address becomes:

```text
http://localhost:3001/dashboard/principal
```

This is a frontend route. It is not a request to Express at port 3000. Next.js may request the destination's route data or JavaScript from port 3001; what it needs to download depends on what it already has cached. The browser does not need to reload the whole document for this client navigation.

There is no exception, so `catch` is skipped. `finally` asks React to set `loading` back to false. `router.push` itself is not awaited here. Navigation and React rendering can happen around this final state update; we should not imagine a guaranteed visible flash of the old Sign in button.

The login page leaves the active route. Its username and password component state are no longer the principal's active screen.

## 33. The principal route describes a protected workspace

**Route file: [nedecen-web/src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx:6), lines 6–12.**

Next.js matches `/dashboard/principal` to this `page.tsx`. The root layout from Chapter 1 still surrounds it. The principal layout simply returns its children:

**Layout file: [nedecen-web/src/app/dashboard/principal/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/layout.tsx:5), lines 5–7.**

`PrincipalHome()` returns nested React elements:

```text
Suspense
  StaffAccessBoundary, mode="administration"
    BookWorkspace
```

`Suspense` is imported from React. It provides the fallback “Opening your school library…” if something underneath suspends. That fallback is different from the explicit permissions-loading message we are about to reach.

Writing `<BookWorkspace />` here describes a child element. It does not force the entire workspace to appear even when the boundary returns a loading message instead of its children.

## 34. The access boundary initially displays a loading message

**Frontend file: [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:10), lines 10–20.**

`StaffAccessBoundary` receives `mode: "administration"` and the child workspace element.

On its first render:

- `access` is null because no current permissions response has arrived.
- `error` is an empty string.
- `load` is a function prepared with React's `useCallback`. Preparing it does not send the request yet.
- `allowed` is null because the expression starts with `access && ...`.
- Two `useEffect` calls register work to run after React commits the render. They do not execute their bodies in the middle of this render.

The error branch is skipped. `if (!access)` succeeds, so the component returns “Loading your work assignments…”. The provider at the bottom is not reached, and the books are not mounted yet.

React puts that loading paragraph on the screen. Its inline `padding: 28` supplies 28 pixels of padding. `role="status"` identifies it as a status message for assistive technology.

## 35. After that render, the boundary starts the permissions request

**Effect and load function: [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:12), lines 12–15.**

The effect checks `isLoggedIn()` and `getAccountType()`.

**Helpers: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:116), lines 116–119 and [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:77), lines 77–80.**

`currentAccessToken()` finds our in-memory token, so `isLoggedIn()` is true. `getAccountType()` reads `"person"`. The condition that would redirect to `/` is false.

The effect calls `load()`. That function calls `api.get('/staff/me/access')`, then attaches a success callback and an error callback to the returned Promise. These callbacks wait for the result; they do not run immediately.

The effect also registers `load` as a browser-window `focus` listener. Returning to this window later can reload permissions. Returning the cleanup function tells React how to remove that listener when needed. Registering it does not itself make a second request.

The other effect sees `access` is still null and returns without redirecting.

## 36. The shared API helper sends a protected GET

**Frontend file: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:218), lines 218–230; the same request function from step 27 handles it.**

`api.get` passes `method: "GET"` to `request`. There is no request body.

This time `getAccessToken()` returns the token we remembered in step 29. The helper builds an Authorization header:

```http
GET /staff/me/access HTTP/1.1
Host: localhost:3000
Origin: http://localhost:3001
Content-Type: application/json
Authorization: Bearer ACCESS_TOKEN
```

The helper sets Content-Type even for this bodyless GET. Authorization and that content type can require a CORS preflight; if needed, the browser first sends OPTIONS and the CORS middleware answers it as explained earlier. A preflight does not perform the staff lookup.

The actual GET is sent with `credentials: "include"`. Our refresh cookie has `Path=/auth`, so it is not sent to `/staff/me/access`. The bearer token is what authenticates this request.

The frontend waits. The loading paragraph remains visible while that request is in progress.

## 37. Express routes this request to the staff-access handler

**Backend mounting order: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts:70), lines 70–75.**

The common CORS, security-header, JSON, and logging middleware run as applicable, just as before. There is no JSON body to parse. The login/refresh/claim attempt-limit middleware is mounted on other paths, so this GET does not increment those counters.

The authentication router has no matching `/staff/me/access` route. The manager router also has no matching route. Express reaches the staff-access router.

**Matching endpoint: [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:9), lines 9–11.**

Express matches both the GET method and path. It calls `requireAuth` first. The async handler that returns permissions must wait until `requireAuth` calls `next()`.

## 38. requireAuth verifies the token and checks the live staff record

**Backend file: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts:33), lines 33–55.**

`req.headers.authorization` contains `Bearer ACCESS_TOKEN`. The missing-header/wrong-prefix condition is false.

`header.split(' ')[1]` extracts the token string. Then `jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] })` runs. `jwt` is the imported `jsonwebtoken` library. It checks the signature with the server's secret, restricts the permitted algorithm, and checks expiry. A token changed by the user will not verify merely because its JSON looks convincing.

Our valid, unexpired token produces the claims object. Its account type is person, so the code queries the current people table using **both** ID 12 and school ID 7.

Through Drizzle and the database connection already explained, the server sends a SELECT equivalent to:

```sql
SELECT * FROM people WHERE id = 12 AND school_id = 7;
```

The actual query uses parameters. The database returns the current principal row. `await` finishes, and `[current]` takes that row.

`current.accountSetUp` is true, so the unavailable-account response is skipped. The code copies `current.role` into `payload.role`. Thus a current database role replaces an older token role.

`req.caller = payload` attaches the verified caller information to this one request. `next()` hands execution to the next endpoint handler. It does not send a response yet.

If the token had failed verification, the catch would send 401. If the live staff record were missing or inactive, the check would send 403. Neither failure happens in our example.

## 39. The route asks staffAccess for the current assignments

**We return to: [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts:9), lines 9–11.**

The handler calls `staffAccess(req.caller!)` and waits. The `!` is TypeScript's non-null assertion: it tells the type checker that the caller is present. It does not authenticate anything; `requireAuth` just did that work.

**Service: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:8), lines 8–18.**

This function receives the verified caller object. Now follow its database work in order:

1. It selects the person again by account ID 12 and school ID 7. This is a second query, not reuse of the middleware's `current` variable. Those variables belong to different functions.
2. It checks that this is an activated person account with role principal or teacher. Our row passes. Otherwise it throws `AccessError`.
3. It selects administrative-work grants for person 12 in school 7. Our example has none, so `grants` becomes `[]`.
4. It selects active class-subject allocations in this school, joining classes and grades. It requires the allocation's academic year to match its class's year. This query gathers relevant school allocations; it is not restricted to person 12 at this point.
5. We assumed this school has no teaching allocations, so `allocations` is `[]`. The conditional expression for `chapterAssignments` selects its `: []` branch. The extra chapter-assignment query does not run.

`eq`, `and`, and `inArray` are imported Drizzle query-building helpers. `eq` expresses equality; `and` combines conditions; `inArray` would test membership if the chapter query ran. `innerJoin` ties rows together using matching IDs. None of these means “download the entire database into the browser.” The database does the filtering/joining and returns the selected rows to the backend.

So the real GET has made four SELECT queries on this example path: one in `requireAuth`, then three in `staffAccess`. It makes no writes.

## 40. The service builds the permissions response

**Return expression: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:14), lines 14–18; capability names: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts:5), line 5.**

The service computes:

- `isPrincipal`: true because the live database role is principal.
- `canTeach`: false because neither a matching teaching allocation nor chapter assignment exists.
- `capabilities`: all five supported administrative capabilities, because this person is a principal. The empty grants array does not remove a principal's capabilities.
- `schoolId`: 7, from the database row.

It returns an ordinary JavaScript object to the waiting route handler. The route passes that object into `res.json(...)`, which sends HTTP 200 with this body:

```json
{
  "isPrincipal": true,
  "canTeach": false,
  "capabilities": ["grades", "streams", "staff", "learners", "curriculum"],
  "schoolId": 7
}
```

No `AccessError` was thrown, so the route's error response does not run. Express finishes this request.

## 41. The frontend receives permissions and renders the workspace

**Back to frontend: [nedecen-web/src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx:12), lines 12–20.**

The same API helper receives 200, skips refresh/error handling, parses JSON, and resolves its Promise.

Now the `.then(value => ...)` callback in `load` runs. `value` is the object above. `setAccess(value)` stores it in React state; `setError('')` clears a previous error if there was one.

React renders `StaffAccessBoundary` again. This time:

```text
access is an object
mode is administration
access.isPrincipal is true
allowed is true
```

The error, loading, and not-allowed early returns are all skipped. The final line returns `<Context.Provider value={access}>{children}</Context.Provider>`.

React's context lets descendants read this object without receiving it through every intermediate component's props. `BookWorkspace` can now render and call `useStaffAccess()` to obtain it.

The redirect effect runs with the new values, sees `allowed` is true, and returns. We stay at `/dashboard/principal`.

## 42. BookWorkspace works out what is open: nothing yet

**Frontend file: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:198), lines 198–238.**

`useRouter` supplies navigation tools. `useSearchParams` reads the URL query. Our address has no `?book=...` and no `?page=...`, so:

```text
bookId = null
pageId = null
tab = ""
```

`useStaffAccess()` receives the permissions object. `BOOKS.filter(...)` keeps every book because `access.isPrincipal` is true. React's `useMemo` caches this calculation until its access dependency changes; it is not a database query.

`books.find(item => item.id === bookId)` finds no book with ID null. `book` is undefined.

The state declarations start with no loaded book data, no page view, no errors, no search text, and no active command. The revision counters start at zero. `useRef` creates stable holders for things such as DOM elements and animation bookkeeping; assigning a ref later does not itself request a render.

Because there is no selected book and no data:

- `data` is null.
- `pages` is `[]`.
- `flattenPages(pages)` returns an empty array too.
- `page` is undefined.
- `breadcrumbPages` is `[]`.
- `index` is -1 because no page was found.

The keys constructed from these values identify the current view state. They are comparison strings, not requests or database IDs.

## 43. Where did the six books come from?

**Imported catalogue: [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:94), lines 94–104.**

The registry supplies the book definitions. A book definition is a JavaScript object describing a feature: its identifier, title, cover colour, and functions for loading records and building pages/views. It is not an individual SQL table or a separate browser tab.

For this principal, the definitions produce these covers:

| Book | ID used in URLs | Cover colour |
|---|---|---|
| Grades & Classes | grades | `#8b413d` — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:100), line 100 |
| Streams | streams | `#536b58` — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:160), line 160 |
| Staff | staff | `#536680` — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:192), line 192 |
| Learners | learners | `#96713d` — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:210), line 210 |
| Announcements | announcements | `#786081` — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:225), line 225 |
| Curriculum | curriculum | `#4d7778` — [nedecen-web/src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts:233), line 233 |

There are five capability names but six covers. This is possible because the principal condition keeps all books, including the Announcements placeholder.

Importing these definitions prepares their functions. It does not call every `load` or `view` function. The individual feature records are not needed to draw closed covers.

## 44. The workspace returns the three main areas

**Rendered structure: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:320), lines 320–360.**

We now reach the JSX returned by `BookWorkspace`. JSX describes elements and their props. React uses that description to create or update actual DOM nodes.

The outer div gets `styles.workspace`. There is no selected book, so the inline style that would set `--book-accent` is undefined. The stylesheet's default accent applies.

Inside it, `ResponsiveLibrary` wraps the header and three-area layout. Its `bookTitle` prop is undefined, its location string is `"null/"`, and `children` contains the elements described below. This location string is internal drawer bookkeeping; it is not written into the address bar.

The desktop header contains NEDECEN, School workspace, Principal’s library, and a Sign out button. `access.isPrincipal` selects the principal wording. The Sign out handler is attached to a button, but nobody has clicked it, so logout does not run.

The left area receives `<LibraryContents>`. Its child markup contains an open `<details>` element with Chapters & Headings. Because `book` is undefined, it shows “No book is opened.” The page navigation is empty because `pages.length` is zero.

The centre `<main>` is the binder. It contains the paper, toolbar, page body, and pagination footer. The toolbar chooses “Your school library” because there is no book. There are no breadcrumb page segments yet.

The right `<aside>` contains the bookshelf. We will inspect its repeated covers shortly.

Notice what is not happening: `WorkspacePage`, a feature command dialog, and an import modal do not mount on this path. Their function definitions exist, but their conditional branches are not selected.

## 45. The centre chooses the welcome content

**Welcome branch: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:339), lines 339–343.**

The first condition is `!book`, which is true. The expression chooses the welcome div and skips the error, feature-page, and loading alternatives.

The visible wording comes directly from this JSX:

```text
A little order. More possibility.
Your school.
One page at a time.
Grades, people and everything in between.
Choose a book from your shelf to get started.
Open Grades & Classes
6 books. One workspace.
```

`<br />` creates the explicit line breaks. `books[0]?.title` supplies Grades & Classes to the button, and `books.length` supplies 6. React inserts those values into the text.

The small decorative book with N is a styled div, not a picture downloaded from the backend. `aria-hidden="true"` keeps that decoration out of the accessibility reading order.

**Footer: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:346), lines 346–347.**

Both page buttons are disabled because `!book` is true. The centre text reads “No book opened”. The arrow SVGs are created by the local `Arrow` component; changing its `back` prop changes the SVG path direction.

The following turn-layer elements prepare decorative page-turn surfaces. They are `inert` and hidden from assistive technology. Preparing them does not trigger a page turn.

**The hook behind those refs: [nedecen-web/src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts:57), lines 57–91.**

The earlier call to `usePageTurn(...)` created the source/layer refs and an `active` ref initially containing null. It prepared `clear` and `turn` callbacks and returned them to the workspace. After the DOM commits, its layout effect records the current content key. Because `active.current` is null, there is no incoming animation snapshot to update. Another layout effect registers a reduced-motion preference listener and cleanup. The `turn` callback's animation loop is not called on this initial screen.

## 46. The right side repeats one cover for each book

**Bookshelf markup: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:350), lines 350–357.**

`books.map(item => ...)` runs once per definition. It returns one tile per book. For Grades & Classes, `item.title` becomes the cover title and button label, `item.mark` becomes 01, and `item.color` becomes `#8b413d`.

`key={item.id}` gives React a stable identity for each tile when comparing renders. A key is not visible text.

The cover's inline style sets a CSS custom property:

```tsx
style={{ "--book-color": item.color }}
```

The cover stylesheet reads that property as a colour. This is the connection between a value in the registry and the red book you see.

`aria-label={`Open ${item.title}`}` gives the button an accessible name. `aria-pressed` is false for every book because none is selected. `onClick={() => navigate(item.id)}` installs a function to call later. It does not open six books while this map runs.

`LibraryShelfTitle()` supplies two text spans:

**Shared title: [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:34), line 34.**

Desktop CSS displays “Your bookshelf”; compact CSS displays “Your library”. The count beside it comes from `books.length`. The introductory sentence comes from the shelf's `<p>`, not from a database field.

## 47. CSS gives those elements their colours, size, and positions

**Base appearance: [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:6), line 6.**

The CSS module import gives JavaScript an object such as `styles.workspace`. Next.js maps each module class to a generated class name, and the browser applies the matching CSS. React does not manually paint each pixel; the browser lays out and paints the styled DOM.

The workspace establishes custom properties for ink, muted text, paper, lines, and the default green accent. Descendants can use those inherited values. The light paper and background colours make the library look like the screenshot's physical pages.

**Layout rules: [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:24), lines 24–34.**

The desktop grid uses a narrow contents column, a flexible centre, and a bookshelf column. `minmax(0, 1fr)` lets the centre take available space while permitting it to shrink. The maximum width limits the whole layout on a large monitor; automatic side margins centre it. Padding and gaps create the spaces between the three areas.

**Paper and binding: [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:54), lines 54–64 and [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:52), lines 52–53.**

Borders, a paper background, rounded corners, shadows, and the binder's pseudo-elements create the page stack. A pseudo-element is a decorative box produced by CSS; it does not need a separate JSX element. The spine's two spans receive the ring styling.

**Welcome and covers: [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:183), lines 183–189 and [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:170), lines 170–177.**

Welcome rules centre the content and set its spacing. The heading and cover titles use serif typography; body text uses the workspace's sans-serif font. The cover uses the `--book-color` we just supplied, with gradients/shadows for depth. Its aspect ratio controls its proportions as the available width changes.

These rules apply after the elements exist. There is no extra HTTP call saying “make Grades & Classes red”. Changing the registry colour would feed a different value into the same CSS rule.

## 48. ResponsiveLibrary checks the actual viewport

**Mode helpers: [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:15), lines 15–22; component setup: [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:51), lines 51–68.**

The component calls `useSyncExternalStore(subscribeMode, currentMode, ...)`, a React hook for reading a changing source outside React state. Here that source is browser media-query results.

`currentMode()` asks the browser's `matchMedia` whether these conditions match:

- Phone: at most 600 pixels wide, or a short viewport at most 500 pixels high and at most 1000 pixels wide.
- Portrait tablet: 601–1200 pixels wide in portrait orientation, when the phone condition did not match.
- Otherwise: desktop.

These are viewport measurements in CSS pixels, not a lookup of the device's brand. Resizing a PC window can therefore select phone mode.

The supplied server snapshot is desktop because server rendering cannot inspect `window`. Once running in the browser, React reads the actual result. `subscribeMode` registers media-query change listeners and returns cleanup code to remove them.

For our desktop example, mode remains desktop. The component sets attributes such as:

```html
data-library-mode="desktop"
data-book-open="false"
data-drawer="none"
```

CSS selectors use these attributes to choose the appropriate layout. The compact top navigation exists in the returned JSX but desktop styling hides it. It is not a separate application with a second login flow.

## 49. The left-menu footer is added, and the first effects finish

**Footer component: [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:37), lines 37–50.**

`LibraryContents` wraps its supplied children in a scrollable body, then adds the footer. It reads permissions through `useStaffAccess` and the current route through Next.js's `usePathname`.

The footer has Navigation help and Sign out. The teaching/administration switch condition is false in our scenario because `canTeach` is false. Its button is therefore not returned.

The help button's handler comes from React context. Clicking it later will increment the help request; attaching the handler does not start the tour now.

**Book-data effects: [nedecen-web/src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx:240), lines 240–255.**

For these effects, use the ones inside `BookWorkspace` beginning with `if (!book) return` and `if (!book || !data || !page) return`. Both return immediately. No grades, streams, learners, or curriculum endpoint is called yet.

Other effects register browser-history handlers and record the current location. Registering a `popstate` listener does not simulate a Back click. The initial location effect has no previous location to animate away from, so it does not turn a page.

**Drawer effects: [nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx:82), lines 82–128.**

The wrapper registers history/resize listeners and inspects its real DOM regions. On desktop with no drawer open, it leaves visible regions available and removes inappropriate hidden/modal attributes. The `if (!active) return` branch skips the menu focus trap and menu scroll lock.

The automatic introductory menu effect also has nothing to open: no book title exists yet.

React effects are post-render work. Several components have them; the browser can paint and React can batch updates around them. The important sequence is that each effect needs its component to commit first. We should not invent one guaranteed line-by-line ordering across unrelated effects.

## 50. A small effect remembers this library address

**Hook: [nedecen-web/src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts:8), lines 8–17.**

`ResponsiveLibrary` calls this custom hook. A custom hook is our own function using React hooks; it is not a special backend service.

`usePathname()` reads `/dashboard/principal`. `useSearchParams().toString()` is empty. After the render, the effect calls `rememberLibraryLocation('/dashboard/principal')`.

**Called function: [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:50), lines 50–65.**

The function checks the route, constructs the same account-specific key from step 31, and asks `libraryLocation` to validate the address.

**Validator: [nedecen-web/src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:25), lines 25–42.**

Our pathname is exactly `/dashboard/principal`, with no hash and no query. It returns that safe local pathname. The fake base `https://library.invalid` only helps JavaScript's `URL` parser handle relative paths. No request is sent to that domain.

Back in `rememberLibraryLocation`, `saved.last` becomes `/dashboard/principal`. There is no book query to remember separately. The function writes the JSON to localStorage. It also arranges for the hook to save the latest location on `pagehide` later.

This is a browser-storage write, not a SQL write. It does not change a class, account, or permission.

## 51. The tutorial checks whether this is an eligible visit

**Component and visit effect: [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:17), lines 17–40.**

The wrapper returns `LibraryTutorial` with `request=0`, `compact=false`, and `bookOpen=false` for our desktop example.

Initially `prompt` is false, `step` is null, `never` is false, and `key` is null. Its first return produces no prompt and no tutorial coach.

After mounting, its effect schedules a callback with the browser's `requestAnimationFrame`. That callback runs when the browser processes the scheduled frame; calling `requestAnimationFrame` itself does not immediately show a modal.

**Key and reader helpers: [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:9), lines 9–16.**

Inside the callback, `accountKey()` reads the session metadata and returns:

```text
nedecen.navigation-help.v1:person:7:12
```

Notice this helper puts school before ID, unlike the navigation-memory key. They are separate preference systems.

`read(account)` finds no stored tutorial value and supplies visits 0, completed false, and dismissed false. The effect reads the current time and a sessionStorage timestamp. In our fresh tab there is no timestamp, so `last` is 0.

The code stores the current timestamp, then checks whether less than 30 minutes have elapsed since the previous timestamp. Our fresh visit passes that check. It increases visits from 0 to 1 and stores the progress in localStorage.

`saved.visits <= 3 && !saved.completed && !saved.dismissed` is true, so `setPrompt(true)` asks React to render the prompt.

The other effects do not start an actual tour: request is 0 and step is null. The tour's menu-opening branches require numbered steps, which we have not entered.

## 52. React mounts the prompt; the native dialog opens

**Prompt branch: [nedecen-web/src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx:68), lines 68–72.**

With `prompt=true`, React now includes `TeacherDialog` with the title “A quick tour of your library?”. It supplies a paragraph, a Don’t ask again checkbox, and Maybe later / Show me buttons as its children.

The checkbox is controlled by `never`, currently false, so it is unchecked. Nothing has been dismissed or completed yet. The buttons' callbacks wait for clicks.

**Shared dialog: [nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx:12), lines 12–26.**

Despite its name, this reusable component is also used here for principals. It receives the title and children as props.

`useModalMotion(onClose)` creates a ref for the real dialog and a close function. `useId()` provides a stable title ID so `aria-labelledby` can connect the dialog to its heading.

React inserts the `<dialog>` and assigns its DOM node to `ref.current`. Then the effect reads that node and calls the browser's built-in `showModal()`. This promotes it into the browser's modal top layer and makes the rest of the document unavailable for normal interaction while it is open.

The effect also calls `lockModalScroll()`.

**Scroll and motion helpers: [nedecen-web/src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts:8), lines 8–35.**

The first lock remembers the old body overflow and sets it to hidden. The returned function will release that lock during cleanup. The motion hook has prepared a short delayed-close function, but we have not called it: the prompt is only opening.

**Dialog appearance: [nedecen-web/src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css:198), lines 198–206; motion: [nedecen-web/src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css:15), lines 15–24.**

The shared dialog styles supply paper colour, border, padding, width limits, and the darker backdrop. The motion class supplies the brief entry transition/animation. Reduced-motion rules can suppress animation for people who request that preference.

The motion stylesheet was already imported by the root layout: [nedecen-web/src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:9), line 9. Its entry keyframes move from slightly lower/smaller and transparent to the final position and full opacity in 180 milliseconds. The base dialog width is at most 520 pixels and also limited by the viewport; later phone CSS can further adjust its presentation.

The library is still behind the prompt. Opening the prompt did not navigate to a new page, fetch classes, or create a record in PostgreSQL.

**This is the end of our main journey: sign-in is complete, access has been checked, and the library has rendered.**

## 53. Replay only the last part on a phone

Do not sign in again for this explanation. Imagine the same successful account and response, but a viewport 360 pixels wide.

The requests, token checks, database queries, and six allowed book definitions are the same. `currentMode()` now returns phone.

**Phone selectors: [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:21), lines 21–28.**

The wrapper's mode attribute changes, so these selectors hide the contents/workspace and present the library as the initial screen. “Your library” is rendered by the wrapper's `h1`; it is not the name of a database table. The bookshelf uses the available phone width.

Later phone refinements in [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:118), lines 118–127, override some earlier values: the library heading becomes 30 pixels, the layout has 20-pixel side padding, and the books use a 24-by-16-pixel row/column gap. When equally specific CSS rules set the same property, the later rule wins. That is why reading only the first phone rule can give you an outdated size.

The DOM-region effect also marks hidden contents/workspace regions inert and aria-hidden. This keeps hidden buttons from being keyboard or screen-reader destinations. CSS controls appearance; those attributes help control interaction/accessibility.

The tutorial receives `compact=true` and uses phone/tablet navigation explanations if the tour is started. The initial invitation still uses the same modal component, constrained to the viewport.

On a portrait tablet, `currentMode` selects portrait instead. The shared stylesheet retains the centred paper workspace and supplies temporary navigation drawers. Landscape/large-screen mode uses the desktop layout. It is the same underlying workspace and data, with different responsive presentation.

The portrait workspace and floating-panel dimensions are set in [nedecen-web/src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css:89), lines 89–98. For example, the paper width is limited by `min(980px, calc(100% - 64px))` and automatic inline margins centre it. The contents panel is at most 360 pixels wide; the shelf is at most 400 pixels wide. Their translated positions keep them off-screen until a drawer is opened. We have not clicked either menu icon in this chapter.

## 54. A short separate replay: what if the password was wrong?

Return mentally to step 4, keeping the username but typing `WrongExample!` instead. This is a separate attempt, not something that happened during the successful journey above.

The form submits a different JSON password. The middleware and database-backed attempt checks still run. The person lookup can still find person 12, but `bcrypt.compare` returns false. The service throws; the people-login route catches that and sends 401 with its credentials error.

**Frontend error conversion: [nedecen-web/src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:121), lines 121–125.**

`request` sees the unsuccessful response. Authentication paths do not trigger its token-refresh retry. `parseError` reads the error JSON and throws a JavaScript Error. That rejects `api.post`.

**Fallback sequence: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:42), lines 42–61.**

Here, follow the catch inside `login`, immediately after its people-login branch. The current app tries learner login next, then manager login if learner login also fails. Each fallback is another HTTP request to its corresponding endpoint, with its own matching middleware/service checks. It does not simply show the first error immediately.

For this replay, assume neither a learner nor a manager exists with username `principal_demo`. Here is the rest of that chain without pretending the person lookup is repeated against the same table:

1. `api.post('/auth/learners/login', ...)` sends the same username and wrong password to the learner endpoint. The IP limiter increments its shared login-IP counter; the account limiter uses the learner path in its key. Origin checking and Zod validation run as before.
2. The learner route, [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:45), lines 45–58, calls `loginLearner`. In [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:59), lines 59–62, the query reads the learners table by username. PostgreSQL returns no row. The activation/hash guard throws before bcrypt or token generation. The route catches it and sends 401. The shared frontend request helper parses that error and rejects its Promise.
3. Frontend `login` catches the learner failure and calls its `loginManager(username, password)` helper: [nedecen-web/src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:159), lines 159–167. That helper sends POST `/auth/managers/login` with the same values.
4. The matching backend route, [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts:93), lines 93–98, performs its limit/schema checks and calls backend `loginManager`. In [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts:118), lines 118–124, the SELECT reads appManagers by username. No manager row is found. The `!manager?.active` test is true, so the OR expression short-circuits: bcrypt is not called. The function throws. The route returns 401.
5. The frontend API helper rejects again. Frontend `loginManager` does not catch that failure, so its caller's await throws too. Frontend `login` has no further fallback; its Promise rejects back to `handleSubmit`.

Assuming these invented credentials match neither a learner nor a manager, the final failure propagates to `handleSubmit`.

**Final user message: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:41), lines 41–44; error markup: [nedecen-web/src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:129), lines 129–137.**

The catch stores the friendly message. Finally clears loading. React renders the error paragraph and re-enables Sign in. The route has not changed. No successful credentials were remembered, and no refresh-token row was created for these failed logins, although the attempt counters were updated.

That is why there can be several network entries for one unsuccessful Sign in click in this implementation. This short replay is here to explain that behaviour, not to pretend the success path ran those extra requests.

## Where we leave the principal

The successful principal is at `/dashboard/principal`. The server has checked credentials and live staff access. The browser has an access token in memory, an HttpOnly renewal cookie, and account/navigation preferences in browser storage.

On desktop the library has its contents area, welcome paper, and six covers. On a fresh eligible visit, the tutorial invitation sits above it. On phone the initial library presentation prioritises the books.

We have not clicked Show me, opened Grades & Classes, loaded Grade 9, or edited anything. Those clicks belong to the next part of the story. When we continue, we can start from this exact state instead of skipping over the next event.
