# Chapter 2 - Signing in and completing the principal navigation tutorial

**Starts:** The login page from Chapter 1 is open. You click the username field.

**Ends:** You have first submitted wrong credentials, then signed in correctly as a principal, opened Grades & Classes during the navigation tutorial, and clicked Finish. The first grade's page is fully rendered with the tutorial gone.

This is a source-based trace of the current checkout, not a recorded browser session. I have not used real credentials or created login attempts against your database. Example identifiers and credentials below are fictional. Framework navigation behaviour was checked against this repository's installed Next.js documentation.

To make one exact path possible, we use these conditions:

- A desktop browser viewport of approximately 1440 × 900 CSS pixels, with no resizing during the task.
- A principal account that has already been set up, belonging to an existing school. “First ever” means this account's first workspace visit in this browser origin, with no saved library location or tutorial progress. It does not mean creating the account.
- The first submission uses the correct principal username but a wrong, non-empty password. That username has no matching learner or manager account. The second submission corrects the password.
- The API is reachable and configured to allow this frontend origin. Rate limits have not already been exhausted. The newly issued token remains valid through this short task.
- The school has its normal grades 8–12. Existing classes, streams, and staff may vary; I will distinguish those database-dependent values.
- You accept the tutorial with Show me, open Grades & Classes, wait for its first page, then use Next, Next, Finish. You leave Don't ask again unchecked.

A tutorial requires opening a book before its first Next button works. Thus “the screen after the tutorial” is not necessarily the untouched welcome screen. In our chosen sequence it is the Grade 8 page in Grades & Classes.

## 1. Your click gives the username input focus

The browser receives mouse/pointer input, hit-tests the visible page, and identifies the input underneath the pointer. The overlaid label allows pointer events through it. The browser gives the input **focus**: keyboard input now goes to this control.

Focus can also be reached by keyboard navigation. It is a browser concept, separate from a React state value.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 152 - 159)

React's event system dispatches the focus event to:

~~~tsx
onFocus={() => setFocusedField("username")}
~~~

The arrow function has no parameter because it does not need event details. It calls the setter with the string "username".

The field has no custom onClick handler. Its focus handler, rather than a login function, is the application code responding here.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 13 - 21)

React schedules a render with focusedField now equal to "username". The hooks return existing state; the other values remain unchanged.

A state setter does not edit a local variable halfway through the old render. It requests another render. React may batch several updates before committing them.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 47 - 50)

usernameActive becomes true because the focus comparison is true. The OR expression does not need to inspect whether username is empty. passwordActive remains false. checkingSession is already false from Chapter 1, so the page continues to its form.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 142 - 182)

In this render:

- The username wrapper chooses --color-focus as its border colour.
- Input padding becomes "14px var(--control-px) 0", making space above the entered text.
- The label's top becomes 0.
- Its transform becomes "translateY(-50%) scale(0.72)".
- Its colour becomes the focus colour.

The label moves up to the wrapper's upper edge, shifts upward by half its own height, and shrinks to 72% scale around its left-centre origin.

React commits these changes to the DOM. The browser runs the declared 0.15-second CSS transitions for border, padding, position, transform, and colour. The native browser also draws the caret.

No HTTP request or database operation is caused by this focus change.

## 2. Typing updates state one edit at a time

Assume the fictional username is principal.demo. Type the first character.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 152 - 165)

The browser edits the input. React invokes:

~~~tsx
onChange={(e) => setUsername(e.target.value)}
~~~

Here e is the event argument. "e.target" identifies the input, and ".value" is its current complete string, not just the latest character.

The setter receives "p". After the next character it receives "pr", and so on. A paste can deliver several characters in one edit.

This is a **controlled input**: its value property comes from React's username state. React commits the updated value back to the element. It does not recreate the entire browser document or query the server for every character.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 47 - 48)

As edits trigger renders, usernameActive remains true. The label stays raised. Values in the password state do not change merely because username changes.

We repeat this same event → setter → render → commit process for the remaining username edits. There is no separate source file for each character.

### Moving to password runs blur, then focus handling

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 157 - 159)

When the username loses focus, its onBlur callback calls setFocusedField(null).

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 199 - 206)

When the password receives focus, its onFocus calls setFocusedField("password"). The exact native pointer/focus event sequence is browser-controlled; React may batch resulting updates.

The resulting focusedField is "password".

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 47 - 48)

usernameActive remains true because username is non-empty even though it no longer has focus. passwordActive becomes true because password has focus.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 168 - 182)

The username label remains raised but takes the muted text colour, and its wrapper returns to the neutral border colour.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 189 - 229)

The password wrapper now takes the focus border. Its label raises and takes the focus colour, and its padding makes room for text.

As you type a wrong password, its onChange reads e.target.value and calls setPassword. The browser visually masks the characters because type is password. **The state still holds the actual entered string.** Masking does not hash or encrypt the JavaScript value.

Nothing in these handlers trims credentials, validates them against a database, or transmits them while you type.

## 3. You click Sign in with the wrong password

Moving focus from the password to a button may run the password blur handler, clearing focusedField. Both labels remain raised because both values are non-empty.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 236 - 248)

This is an enabled submit button inside a form. The browser performs native constraint validation before dispatching a valid submit event.

Both controls are required. An empty input could cause native validation feedback and prevent the form's submit handler from running. Our non-empty wrong password passes required validation: the browser cannot know whether a non-empty password is correct.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 139 - 140)

The form's submit event reaches onSubmit={handleSubmit}. Now, for the first time, that function's body executes.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 33 - 38)

~~~tsx
async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);
  try {
    const accountType = await login(username, password);
~~~

"React.FormEvent" is a TypeScript annotation for the event argument. It does not create a new event at runtime.

"preventDefault()" suppresses the browser's normal form submission/navigation. Our JavaScript will send the request instead. It does not stop all propagation or cancel our code.

setError(null) clears any previous error, and setLoading(true) marks submission in progress.

"async" makes this handler return a Promise. "await" pauses this invocation until the called operation settles. It resembles awaiting Task in C#: the browser remains able to process work while the operation waits.

The local variable accountType is not assigned a successful value yet. First, execution enters login with the strings currently in state.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 30 - 35)

login accepts typed username and password parameters and promises one of three account-category strings. "person" includes school staff such as principals.

The first try block calls:

~~~ts
api.post<LoginResponse>("/auth/people/login", { username, password })
~~~

The object uses shorthand properties: username receives the username variable and password receives the password variable.

LoginResponse describes the expected successful result to TypeScript. It is not a validation routine and is not sent as part of the request.

The frontend does not yet know this is a principal. It tries the staff account category first.

## 4. Our API helper constructs the request

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 220 - 221)

api.post calls the shared generic request helper with a path and options:

- method is POST.
- body is JSON.stringify(body).

**JSON.stringify** serialises a JavaScript object into text. For our fictional submission, the body has this shape:

~~~json
{"username":"principal.demo","password":"a-deliberately-wrong-password"}
~~~

This is a structural example, not an actual captured password. POST is used to submit this authentication operation. The password is not placed in the URL.

The generic type parameter T lets this helper express the caller's expected result type, similar to a generic method in C#. It does not inspect network data automatically.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 180)

request receives path, options, and retry. Default parameters mean options becomes an empty object and retry becomes true when omitted.

Before fetching, it calls getRefreshToken.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 58 - 61)

This browser-only helper reads the legacy refreshToken storage entry. Our clean browser has none, so it returns null. The conditional renewal call in request is skipped.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 49 - 52)

getAccessToken calls currentAccessToken.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 30 - 35)

There is no token in module memory. The helper checks an old localStorage entry, finds none, removes that legacy key, and returns null.

These operations are synchronous browser storage/memory operations, not database calls.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 182 - 190)

fetch receives the full API address, combining API_BASE with /auth/people/login, and an options object.

- "...options" spreads the method and JSON body into the object.
- credentials: "include" permits eligible cookies to accompany cross-origin requests and permits credentialed response handling.
- Content-Type: application/json declares the body's format.
- The conditional object spread includes an Authorization header only if a token exists. It does not on this first login.
- "...options.headers" allows caller-supplied headers to be added or overridden.

**fetch** is the browser's networking API. Calling it returns a Promise for a Response; it does not return the already-decoded JSON body.

An **API** is a defined interface for programs to communicate. Here its interface consists of endpoint paths, HTTP methods, input bodies, and response shapes.

With the fallback API configuration from Chapter 1, this request goes to http://localhost:3000/auth/people/login. That is separate from a frontend running at http://localhost:3001.

### The browser may first ask permission through CORS

Two different ports mean two different origins. A cross-origin JSON POST usually requires an **OPTIONS preflight**, unless an appropriate preflight result can already be reused.

The browser sends OPTIONS describing the desired method and headers. It does not run our login handler to check the credentials during preflight.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 48 - 50)

The Express application has CORS middleware registered here. These app.use calls happened at startup; now the registered middleware handles the incoming request.

**Express** is the backend library that routes HTTP requests through functions. A **middleware** function handles some aspect of a request and either responds or passes control onward.

cors is a library function configured with allowedOrigins and credentials:true. It supplies the appropriate browser-access headers. Under its ordinary preflight handling it answers OPTIONS before the later JSON parser, logger, rate limiter, or login route execute.

(File: [Project-Edu-Revo/src/securityConfig.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/securityConfig.ts), lines 2 - 5)

The configuration helper provides allowed origins: explicitly configured values when present, otherwise the listed localhost/127.0.0.1 frontend origins in non-production. It had already run at startup. It does not validate a password.

If the origin is allowed and preflight succeeds, the browser sends the POST. CORS is a browser-access rule, not account authentication.

### While the request waits, the button changes

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 236 - 248)

React can now commit loading=true. The button becomes disabled, its disabled-opacity class applies, and its text becomes Signing in....

Disabling this button prevents normal repeated clicks on it. The username/password inputs are not disabled by this code. The submitted request already captured the strings passed to login; edits made while it is waiting would not rewrite its JSON body.

The exact time this visual update paints can overlap the network/backend work that follows.

## 5. The POST enters the backend middleware chain

The request reaches the separately running Node.js/Express backend in Project-Edu-Revo. It does not call a Next.js API route in nedecen-web.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 61)

For this POST, CORS middleware runs first. The next custom middleware sets response security headers and Cache-Control: no-store, then calls next.

"req" is the request object; "res" constructs the response; "next()" tells Express to continue through the matching middleware chain. Names prefixed with "_" mark parameters that are unused here.

express.json({limit:'1mb'}) parses eligible JSON bodies into req.body, with a 1MB limit. Our valid small JSON body parses into an object containing two strings.

The /uploads static-file handler does not match this path. Request logging follows.

(File: [Project-Edu-Revo/src/middleware/logger.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/logger.ts), lines 11 - 14)

requestLogger prints the method and path, such as POST /auth/people/login, then calls next(). It does not log the submitted password in this statement.

### First rate limit: the request's address

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 66 - 70)

The login-IP limiter was registered for all three login paths with a limit of 300 requests in 900 seconds. This POST matches.

The attemptLimit factory was called during setup. Its returned async middleware executes now.

(File: [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts), lines 7 - 18)

It creates a key by hashing the scope plus request identity using Node's crypto library:

- createHash('sha256') constructs a hash object.
- update(...) supplies the text to hash.
- digest('hex') returns the digest as hexadecimal text.

Without a custom identity function, the request IP or socket address is used. Nullish fallbacks handle missing values.

A **hash** is a deterministic digest, not encrypted text you later decrypt. Here it produces a stable key without storing the raw address.

Then db.execute receives a Drizzle sql template performing a PostgreSQL insert/update in auth_attempt_windows.

This is our first database operation in this task. **PostgreSQL** is the separate database server storing persistent table rows. Drizzle is the query-building library used by this backend; this code does not use Prisma.

The SQL means:

1. Insert a new window with attempts=1 and an expiry based on the current time.
2. If the key already exists, reset an expired window or increment the existing count.
3. Return the count and remaining wait time.

The sql-tagged template parameterises interpolated values. Those values are passed as query parameters rather than concatenated into SQL commands.

(File: [Project-Edu-Revo/src/db/index.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/db/index.ts), lines 17 - 26)

The imported db was created earlier: pg.Pool manages reusable PostgreSQL connections, and drizzle(pool) wraps that pool with the query API. These constructors are not rerun for each request. Here the query uses that existing pool to send SQL to PostgreSQL and await the result.

DATABASE_URL is private backend configuration, not something the browser needs.

(File: [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts), lines 15 - 18)

The middleware reads the returned row. Below the limit, it calls next. Above it, it would return 429 with Retry-After and stop this chain. We are below the limit.

Successful and unsuccessful requests both count. The limiter does not wait to see whether the password was correct.

### The auth router checks the browser origin

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 70 - 70)

The request enters the mounted auth router. Its routes already existed before this POST arrived.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 13 - 15)

The /auth middleware matches and calls trustedAuthOrigin.

(File: [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts), lines 17 - 21)

req.get('Origin') reads the browser's origin header. An origin outside frontendOrigins is rejected with 403. A request without Origin but carrying a refresh cookie is also rejected by this condition.

Our allowed-origin request passes and calls next. Because Origin is present, the absent-Origin branch and its cookie lookup are unnecessary on this path.

### Second rate limit: endpoint plus username

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 15 - 15)

The per-account limiter uses 12 attempts in 900 seconds. Its custom identity combines the endpoint path with a username transformed by String, trim, toLowerCase, and slice(0,200).

The optional chaining in req.body?.username avoids failing just because the body or property is absent. The normalisation applies to the **rate-limit key**, not to the username later sent into the database lookup.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 29 - 30)

The matching POST route executes loginLimit before its async handler.

(File: [Project-Edu-Revo/src/middleware/authRateLimit.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authRateLimit.ts), lines 7 - 18)

The same limiter code runs with this different scope and identity. It writes/increments its own database counter and, below the limit, calls next.

One login POST has now touched two limiter counters.

## 6. The staff login handler validates and checks the password

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 29 - 34)

The handler calls loginSchema.safeParse(req.body). The schema was constructed during module loading; now its validation function runs on this request's object.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 17 - 20)

The Zod schema requires a username string of 1–200 characters and a password string of 1–1024 characters. **Zod** is the validation library. Unlike a TypeScript type annotation, safeParse actually checks runtime input.

Our non-empty wrong values have valid shapes. A shape failure would return 400, but a wrong password is not a shape failure.

The handler passes the validated strings to loginPerson and awaits it.

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 45 - 49)

~~~ts
const [person] = await db.select().from(people).where(eq(people.username, username));
~~~

This query asks PostgreSQL for staff rows whose username equals the submitted string. The fluent chain constructs the query; awaiting it obtains rows.

Array destructuring takes the first row as person. If no row existed, person would be undefined.

The imported people schema maps TypeScript property names to database columns. That mapping was prepared when the module loaded; it is not table creation during login.

"person?.accountSetUp" uses optional chaining to safely inspect a possibly missing row. The first guard rejects absent, unclaimed, or password-less accounts. Our principal exists and is set up, so execution continues.

bcrypt.compare(password, person.passwordHash) checks the submitted password against the stored password hash.

**bcrypt** is the password-hashing library. We do not decrypt a stored password. The library uses the encoded hash's salt and parameters to check whether the supplied string matches it.

Its Promise resolves to false for our deliberately wrong password. The next if throws new Error('Invalid credentials').

A thrown error exits this async function by rejecting its Promise. The token-generation lines below do not execute. No access token or refresh-token row is created for this failed staff check.

### The route returns a 401 response

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 33 - 39)

The rejected await transfers control to catch. res.status(401).json(...) sends:

~~~json
{"error":"Invalid credentials"}
~~~

401 is the HTTP status used here for failed authentication. res.json serialises the object and sends a JSON response.

writeRefreshCookie was not reached. This failure does not issue a new refresh cookie.

At this point the backend has answered one failed staff request. **The frontend has not yet displayed the final error.**

## 7. The browser receives the 401 and tries another account category

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 192 - 209)

fetch resolves to a Response even for HTTP 401. fetch ordinarily rejects for network-level failures, not merely because the server sent a failure status.

The request helper considers whether to refresh.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 130 - 132)

shouldRefresh is true only for 401 responses outside /auth/. Our path starts with /auth/, so it returns false. No automatic refresh request or retry is performed for this login endpoint.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 207 - 209)

res.ok is false, so the helper awaits parseError.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 121 - 124)

parseError calls res.json to parse the response body's JSON text into an object. Its small catch supplies an empty object only if parsing fails.

It throws an Error using body.error, or a status-based fallback if absent. Here the message is Invalid credentials.

The rejection travels back through request and api.post to the login helper's await.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 43 - 45)

The staff try block's catch runs. It does not return the error to the form yet. Instead, it posts the **same username and password** to /auth/learners/login.

The same api.post → request → credential lookup → fetch path runs again. There are still no session tokens. Another OPTIONS preflight may be required, depending on the browser's applicable preflight cache.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 70)

The second POST repeats CORS, security headers, JSON parsing, request logging, the login-IP limiter, and auth-router entry. It increments the shared IP counter again.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 14 - 15)

The allowed-origin guard runs again, then the account limiter uses the learner endpoint's path plus username, giving a different endpoint-specific counter.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 45 - 50)

The learner handler validates the same shape, then calls loginLearner.

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 59 - 64)

It queries learners by username. Under our stated condition there is no matching learner, so learner is undefined. The accountSetUp guard throws.

Because the first OR operand is true, the code does not inspect a missing learner's passwordHash and does not call bcrypt.compare. For an existing set-up learner with a wrong password, comparison would run and return false instead.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 53 - 55)

The learner route sends the same 401 Invalid credentials shape. No learner token is created.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 192 - 209)

The frontend again skips refresh for an auth endpoint and calls parseError.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 121 - 124)

Parsing the response and throwing Error rejects the learner api.post.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 53 - 55)

The inner catch now calls loginManager(username,password). The return "manager" statement would happen only if that call succeeded; it will not on our path.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 159 - 160)

loginManager posts the same values to /auth/managers/login.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 70)

The third POST repeats the shared middleware, including another IP-counter increment.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 14 - 15)

It passes origin validation and the manager endpoint's account limiter.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 93 - 97)

The manager handler validates the body and calls the backend loginManager service.

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 118 - 120)

The service queries appManagers by username. No manager exists under our assumption, so the !manager?.active condition is true and throws.

The OR short-circuits; bcrypt.compare is not called for a missing manager.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 96 - 97)

The catch sends 401 Invalid credentials.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 192 - 209)

The browser helper receives the failure, skips auth refresh, and enters parseError.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 121 - 124)

parseError throws. This final rejection travels through frontend loginManager and out of login. There is no further account-type fallback.

**One failed form submission has produced three sequential login POSTs**, not one POST with three backend lookups hidden inside it. There may also be preflight requests. No token was issued, but rate-limit rows were written.

The broad catches also mean some other failures, such as a server error, can trigger the same fallback chain. We are tracing wrong credentials, but the code does not restrict fallback to 401 alone.

## 8. The form finally displays the error

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 38 - 44)

The await login now rejects, so handleSubmit enters catch and sets:

~~~text
Incorrect username or password. Please try again.
~~~

Then finally runs setLoading(false). finally runs whether the operation succeeds or fails.

The page's catch does not inspect the backend error message. It deliberately displays this fixed text. Consequently a network failure or a 429 can also be presented as this same text; this implementation does not distinguish them here.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 128 - 137)

React renders again. error is now a non-empty string, so error && (...) includes the warning box. Its background reads --color-error-bg and text reads --color-error-text. The current palette gives the warning its yellow background.

The box has padding, rounded corners, small semibold text, a flex row, spacing, and a warning symbol alongside the message. It is inserted above the form, so layout adjusts to make room.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 236 - 248)

loading is false, so the button is enabled, restored from its disabled appearance, and says Sign in.

Username and password state were never cleared. Both values remain, both labels remain raised, and the browser still masks the password. There was no route change.

Typing by itself will not clear this error; setError(null) runs when the next submit begins.


## 9. You correct the password and submit again

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 199 - 206)

Clicking the password field runs its focus handler again. Editing runs onChange and setPassword. The controlled input now holds the correct string.

This reuses the focus, label, padding, border, and text-update process already traced. We do not add another login request until submission.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 33 - 38)

Clicking Sign in passes required validation, reaches handleSubmit, prevents native navigation, clears the error, sets loading true, and calls login with the corrected values.

React can remove the warning box and display Signing in... while this request waits.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 30 - 35)

login again tries /auth/people/login first.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 220 - 221)

api.post serialises the current strings as JSON and calls request.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 190)

The helper still has no refresh/access token to attach. It sends a new staff POST. An applicable preflight may be reused or performed again.

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 70)

The backend repeats the POST middleware path: CORS, headers, JSON parser, logger, IP limiter, auth router. This is the fourth login POST across our two submissions.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 14 - 20)

The origin guard and endpoint/account limiter pass, and the schema remains available for validation.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 29 - 34)

safeParse succeeds. The route awaits loginPerson.

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 45 - 50)

The service queries the principal row again. Its account is set up and has a password hash. This time bcrypt.compare returns true.

The !valid guard does not throw. Execution continues into token generation.

## 10. The backend creates a short-lived access token

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 25 - 27)

generateAccessToken receives the principal's database id, accountType "person", school id, and role "principal".

It calls jwt.sign with:

1. A payload object containing those claims.
2. The private signing secret already loaded by the backend.
3. An expiresIn option using the configured expiry.

**JWT** means JSON Web Token. Here, a signed access token carries claims identifying the account and school. A typical token has dot-separated header, payload, and signature parts.

**Signing is not encryption.** The payload can be decoded, but the signature lets the backend detect forgery or modification when it verifies the token. The browser does not receive the signing secret.

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 17 - 19)

The existing configuration supplies a 15-minute access-token lifetime and a 7-day refresh-token lifetime. These constants were initialised at backend startup; the login now uses their values. The ! after process.env.JWT_SECRET is a TypeScript non-null assertion, not runtime secret validation.

jwt.sign also produces timing claims such as expiry. The returned value is the token string, which the service stores in its local accessToken variable.

## 11. The backend creates and stores a refresh credential

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 51 - 52)

crypto.randomBytes(64) produces 64 random bytes. toString('hex') encodes them as 128 hexadecimal characters.

This **refresh token** is an opaque random credential, not another JWT. It allows a later session renewal without sending the password again.

The service calls storeRefreshToken with this raw credential and account details.

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 33 - 39)

The helper:

- Hashes rawToken using SHA-256.
- Creates a Date object for the current time.
- Adds seven days through getDate/setDate.
- Inserts tokenHash, accountId, accountType, schoolId, and expiresAt into refreshTokens.
- Returns rawToken.

Only the hash is stored as the credential value in the database. SHA-256 is suitable here for hashing a high-entropy random token; passwords were checked with bcrypt.

db.insert(...).values(...) constructs the insertion and await waits for PostgreSQL to finish. This is a persistent session write. No UI data such as class records is created.

(File: [Project-Edu-Revo/src/services/authService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/authService.ts), lines 53 - 54)

loginPerson returns an object with accessToken and refreshToken. Its Promise fulfils, so the route's await resumes rather than entering catch.

### The route puts the refresh credential in a cookie

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 34 - 36)

The route calls writeRefreshCookie with the response and raw refresh token.

(File: [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts), lines 14 - 14)

writeRefreshCookie calls Express's res.cookie using the cookie name and options. It configures a Set-Cookie response header; this function does not directly edit browser storage from the server.

(File: [Project-Edu-Revo/src/middleware/authCookie.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/authCookie.ts), lines 3 - 8)

The cookie is named nedecen_refresh. options executes now and returns:

| Option | Meaning |
| --- | --- |
| httpOnly: true | Browser JavaScript cannot read it through document.cookie. |
| secure | Required in production, or when sameSite is none. |
| sameSite | Defaults to lax; configurable to none for the appropriate cross-site setup. |
| path: /auth | Restricts the cookie to matching auth paths. |
| maxAge | Seven days, expressed in milliseconds. |

Cross-origin and cross-site are different concepts: two localhost ports differ in origin, but are normally same-site. Cookie eligibility also depends on hostname, scheme, path, browser policy, and these options.

The browser accepts/sends cookies according to those rules. credentials:"include" does not override cookie restrictions.

(File: [Project-Edu-Revo/src/routes/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/auth.ts), lines 36 - 36)

The route sends a successful JSON response containing **only the accessToken**.

The refresh credential travels in Set-Cookie, not this JSON object. The browser manages that cookie; our fetch code does not extract the raw Set-Cookie header.

## 12. The frontend reads the successful result and remembers identity

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 192 - 211)

The successful Response does not need refresh handling. res.ok is true, so parseError is skipped.

res.json parses the response text, producing an object with accessToken. request returns that asynchronous result; api.post and the login helper receive it.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 35 - 36)

login stores the object as res and calls decodeToken(res.accessToken).

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 17 - 24)

decodeToken:

1. Splits the token string at dots.
2. Takes array element 1, the payload.
3. Replaces URL-safe Base64 characters using the two global regular expressions.
4. Calls the browser's atob function to decode Base64 text.
5. Calls JSON.parse to turn that text into an object.

The regular-expression /g flag means replace all matches. If this process throws, catch returns an empty object.

"Record<string, unknown>" expresses a dictionary-like object whose property values must be inspected or asserted before specific use.

**This function decodes; it does not verify the signature.** These decoded values help choose the interface. The backend will independently verify the signed credential before returning protected information.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 37 - 37)

The helper calls rememberAccessToken.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 25 - 29)

renewal defaults to false. The function increments sessionGeneration, resets any shared refreshPromise, and stores the access-token string in module memory.

sessionGeneration helps distinguish work belonging to different sessions. This call removes old accessToken/refreshToken localStorage entries. New usable tokens are not saved there.

The browser's storage event is not fired in the same window merely because it changes its own localStorage. Our cross-document listener therefore does not reload this login page here.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 38 - 42)

The login helper writes routing metadata to localStorage:

- accountType becomes "person".
- role becomes the decoded role, "principal" here.
- schoolId becomes the school id converted to a string.
- accountId becomes the account id converted to a string.

The role assignment falls back to teacher only if its left side is null or undefined. Type assertions do not validate claims, and localStorage metadata is not backend authority.

For a fictional account id 42 in school 7, these would be "42" and "7". These are teaching values, not records read from your database.

The function returns "person". Because this staff login succeeded, **the learner and manager fallback requests do not run on this attempt**.

The password is not copied into persistent storage by this helper. The old form state can still hold it until that component is removed.

## 13. The frontend selects the principal destination

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 38 - 39)

handleSubmit's await fulfils and accountType is assigned "person".

To call router.push, JavaScript first evaluates the arguments in:

~~~ts
router.push(getResumePath(accountType, getRole()));
~~~

It must evaluate getRole before invoking getResumePath with that result.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 86 - 89)

getRole returns the stored role, "principal".

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 135 - 138)

getResumePath calls getRedirectPath.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 124 - 132)

The account is neither manager nor learner, and role is principal, so it returns /dashboard/principal.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 135 - 138)

For a non-manager, getResumePath also checks for a remembered library URL. Splitting the base path at "/" produces ["", "dashboard", "principal"]; element 2 supplies the library role.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 66 - 72)

rememberedLibraryLocation calls identity, then reads the account's saved navigation state.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 11 - 22)

identity reads accountType, accountId, schoolId, and role. It confirms the id/school strings contain digits using regular expressions and chooses principal mode.

It builds a key separating account, id, school, and role. An illustrative key is nedecen.library.v1:person:42:7:principal.

The regular expression /^\d+$/ matches one or more digits across the entire string. The permitted-role checks prevent selecting a learner mode for a person account.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 43 - 48)

read retrieves the saved JSON text. On this first visit the entry is absent, so "{}" is parsed.

It returns an object with no last location and an empty books dictionary. Malformed JSON would be caught and yield an empty books dictionary too.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 70 - 75)

With no saved.last string, rememberedLibraryLocation returns null before calling the URL validator.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 135 - 138)

The nullish fallback returns the base /dashboard/principal.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 39 - 44)

router.push starts a Next.js client-side navigation and adds a history entry. It does not send a password or wait for every dashboard request to finish.

finally sets loading false. The form may briefly rerender as enabled before navigation commits; React and network timing determine whether you see that intermediate paint. Once navigation removes it, its state is no longer the active screen.

## 14. Next.js enters the principal route

Next.js obtains the route's component data and JavaScript, using an available route cache or making framework requests as needed. This differs from the Express API request.

A client-side navigation normally preserves shared layouts and updates route content. It does not require a brand-new document load. Framework RSC requests are not the /staff/me/access API call that we will reach shortly.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 23 - 31)

When navigation removes the login component, React runs its session-effect cleanup, setting that effect's active flag to false. Its earlier restoration check has already finished; the cleanup prevents a late result from acting on the removed login screen. The login component's username/password state is no longer mounted. The theme attribute already applied to html remains because the theme effect has no cleanup removing it.

(File: [src/app/dashboard/principal/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/layout.tsx), lines 5 - 7)

PrincipalLayout receives children and returns them without adding another shell. The root document/layout from Chapter 1 remains shared.

(File: [src/app/dashboard/principal/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/dashboard/principal/page.tsx), lines 6 - 12)

PrincipalHome returns a Suspense boundary around StaffAccessBoundary, which in turn wraps BookWorkspace.

**Suspense** is React's mechanism for displaying a fallback while a descendant suspends. The fallback here says Opening your school library….

This message is possible, not a compulsory step on every navigation. A useEffect-based API request does not automatically trigger Suspense. The access component has its own explicit loading output.

The page supplies mode="administration", a prop describing the required workspace mode. JSX nesting supplies BookWorkspace as children; it does not guarantee its function runs before the access boundary permits it.

## 15. Before mounting the library, the frontend asks for current access

(File: [src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx), lines 6 - 15)

The module has a Context created with null as its default. **React context** lets descendants read a supplied value without passing it as a prop through every intermediate component.

On mounting, StaffAccessBoundary obtains a router, initialises access to null and error to an empty string, and creates the load function with useCallback.

useCallback remembers a function identity according to dependencies; it does not call that function immediately.

The component registers effects for loading and permission-dependent redirection. allowed is currently null because access is null.

(File: [src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx), lines 16 - 19)

There is no error, but access is absent, so it returns Loading your work assignments….

It has not returned Context.Provider or mounted BookWorkspace yet. Book-loading effects cannot run through this boundary before access arrives.

### The boundary's effect starts the access request

(File: [src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx), lines 13 - 13)

After commit, it checks isLoggedIn and getAccountType.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 116 - 119)

isLoggedIn checks for a current access token or remembered account category. "!!" converts a value to a boolean.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 30 - 35)

currentAccessToken returns the in-memory token just stored by the successful login. No legacy lookup is necessary because it is present.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 77 - 80)

getAccountType reads "person". The boundary's login/account guard passes.

(File: [src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx), lines 12 - 13)

It calls load and registers a window focus listener to call load again when this window regains focus. Registration does not run another request immediately. We assume no additional window-focus changes in the trace.

load calls api.get<StaffAccess>('/staff/me/access').

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 223 - 224)

api.get calls request with method GET and no body.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 190)

request checks the absent legacy refresh token, obtains the existing access token, and includes:

~~~http
Authorization: Bearer <the-access-token>
Content-Type: application/json
~~~

Bearer means possession of the credential is used to authenticate the request. The token is in the request header, not a principal id supplied by an editable UI field.

The helper sets Content-Type even for this body-less GET. On a cross-origin request, that header and Authorization can require preflight. An eligible refresh cookie has /auth scope and is not needed on /staff/me/access.

The browser sends GET to the backend after any necessary preflight.

## 16. The backend verifies the token and computes live permissions

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 50 - 72)

The request repeats applicable CORS, response-header, parser, and logger middleware. The login and refresh path-specific limiters do not match this URL. The /auth origin middleware also does not match it.

The mounted staffAccess router matches /staff/me/access.

(File: [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts), lines 9 - 11)

Its GET route first runs requireAuth, then its async handler.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 40)

requireAuth reads req.headers.authorization. It checks the Bearer prefix, extracts the token by splitting on a space, and calls jwt.verify.

verify uses the server secret and explicitly permits HS256. The library checks the signature and expiry. A malformed, expired, or invalid signature would yield a 401 here. The newly issued token passes.

The "as AuthPayload" annotation tells TypeScript the expected verified payload shape; it is the preceding verification, not this assertion, that performs the cryptographic check.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 42 - 48)

For a person account, requireAuth additionally queries the current people row with matching account id and school id. This catches account availability and school-membership changes even before the token expires.

It confirms accountSetUp and refreshes payload.role from the current database row. Then it assigns req.caller=payload and calls next.

**Authentication** established who is calling. The later access computation determines what work that account may perform.

(File: [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts), lines 9 - 10)

The handler calls staffAccess(req.caller!) and awaits it. The exclamation mark is a TypeScript assertion that the prior middleware supplied caller; it performs no extra runtime verification.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 13)

staffAccess performs these queries in sequence:

1. Read the matching staff row again.
2. Confirm person account, set-up status, and principal/teacher role.
3. Read administrative-work grants for that person and school.
4. Read active class-subject allocations joined to classes and grades, restricted to the school and matching academic year.
5. If allocations exist, read active chapter assignments belonging to this person within those allocations. Otherwise use an empty array.

A **join** connects rows from related tables according to matching columns. An inner join keeps matching combinations; this is how the query follows allocations → classes → grades.

The array map in the final query extracts allocation ids. inArray expresses a SQL membership condition. All queries use the existing db/pool.

These reads run even though a principal ultimately gets broad administrative access. The code computes teaching eligibility as well.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 14 - 17)

The returned object contains:

- isPrincipal: true from the current person's role.
- canTeach: whether this person owns an allocation or has an eligible chapter assignment.
- capabilities: the capability list for principals.
- schoolId: the current school id.

The capability list comes from this module's existing constant: grades, streams, staff, learners, curriculum. The principal's shelf also includes Announcements because the frontend permits all books for isPrincipal, rather than requiring that placeholder to be a capability.

(File: [Project-Edu-Revo/src/routes/staffAccess.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/staffAccess.ts), lines 9 - 10)

res.json serialises this access object into a successful response.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 192 - 211)

The frontend helper receives an OK response and parses its JSON. No refresh retry is needed.

(File: [src/components/dashboard/StaffAccess.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/StaffAccess.tsx), lines 12 - 19)

load's then callback calls setAccess(value) and clears error. React rerenders.

allowed is now true because the mode is administration and access.isPrincipal is true. The redirect effect has no work to do.

The return now supplies Context.Provider with access as its value and renders its children.

Only now does the principal library mount.


## 17. The principal library first renders with no book open

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 11 - 25)

The client component uses React state/effects, Next.js router/query hooks, the book registry, navigation-memory helpers, responsive shell, and page-turn hook. The CSS import is a **CSS Module**.

A CSS Module gives source classes such as workspace and paper generated names scoped to this module. The styles object maps those property names to generated class strings. It prevents a generic class such as paper in another module from accidentally matching this one.

Imports make these dependencies available; they do not call every imported feature's function.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 94 - 108)

The registry's BOOKS array is prepared when the module is evaluated. Its first definition contains Grades & Classes metadata and function values for load, pages, and view.

Those function bodies do not run merely because the shelf needs the title and colour.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 224 - 227)

The Announcements entry is built by calling underDevelopmentBook with its descriptive metadata.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 30 - 41)

That helper returns an object containing the metadata and callbacks for a future informational page. Its spread copies the supplied properties. Its load/pages/view callbacks are created, not invoked. Announcements is not fetched during this trace.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 198 - 209)

BookWorkspace obtains router and search parameters, then reads the access context via useStaffAccess.

useMemo computes the permitted books. isPrincipal is true, so the filter retains every definition.

**useMemo** can reuse a computed result while its dependencies remain equal. It is an optimisation, not a database cache or something required for correctness.

The URL is /dashboard/principal with no query string. params.get('book') and params.get('page') return null; tab falls back to an empty string.

books.find cannot find a book with id null, so book is undefined.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 214 - 237)

The component initialises state for loaded data, a rendered page view, attempts, errors, revision, search text, and an open command. None has loaded content yet.

useRef creates objects with a mutable current property. Unlike a state setter, changing a ref does not request a render. Here refs track DOM elements and transient bookkeeping.

With no book selected:

- data is null.
- pages and flat are empty arrays.
- page is undefined.
- breadcrumbPages is empty.
- index is -1 because findIndex found nothing.
- view is null.
- error has no message.

The different keys identify book/page/revision/tab combinations so later responses are not displayed for the wrong selection.

### The page-turn hook is set up, without turning anything

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 57 - 89)

usePageTurn creates refs for the actual paper, animation layers, active animation, and latest content key.

Its layout effect records the key. There is no active incoming animation, so it does not clone content. Another layout effect registers a reduced-motion preference-change listener.

**useLayoutEffect** runs after DOM changes are committed, before the browser's next paint. It is useful here when animation logic needs current DOM elements.

The hook creates clear and turn callbacks using useCallback and returns refs plus the turn function. Creating them does not start an animation.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 239 - 255)

Two effects are registered for book loading and view generation. When run with book undefined, their guards return immediately. The initial welcome screen does not fetch all six books.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 257 - 288)

Other effects register history listeners, initialise previous-location/index refs, and coordinate later scrolling/turning. No popstate event or location change has occurred yet, so their event callbacks do not navigate or refresh now.

### The returned shell

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 320 - 339)

The root div uses styles.workspace. With no book, there is no inline --book-accent override.

ResponsiveLibrary receives no bookTitle and a location string describing the empty selection.

The top bar contains a Next.js Link to the principal library, NEDECEN branding, Principal's library from live access, and a Sign out handler. The handler bodies are registered, not run.

The contents area includes an open native details element. details/summary implement browser-controlled expand/collapse without a custom loop. Its introduction says No book is opened; its page list is empty.

The central main element contains the binder/paper layout, breadcrumb, decorative spine, and independent scrollable content area.

Because !book is true, it returns the welcome heading Your school. One page at a time., guidance, and an Open Grades & Classes button based on books[0]. The button is not clicked yet.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 31 - 33)

The Arrow component returns an inline SVG path. SVG describes vector geometry for the browser to draw. It does not download an icon file or perform navigation.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 346 - 358)

Pagination has no page yet; its buttons are disabled and its text says No book opened.

The animation container contains an underlay and six empty sheet elements made with Array.from. React keys identify elements across renders. The layers are inert and aria-hidden because they are visual-only.

The shelf maps the six book definitions to buttons/covers: Grades & Classes, Streams, Staff, Learners, Announcements, Curriculum.

Each cover's --book-color comes from its metadata. aria-label names the action Open [title], and aria-pressed reflects whether that book is selected.

No command dialog is rendered because command is null. This path does not execute class-creation, roster-import, or other book tools.

### The responsive wrapper establishes the desktop mode

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 51 - 65)

ResponsiveLibrary calls useLibraryMemory, reads viewport mode, initialises drawer/help/tutorial state, and creates refs plus a unique id.

useSyncExternalStore connects React to a value maintained outside React state: here browser media-query results. It uses subscribeMode for notifications, currentMode for the current client value, and the desktop fallback for server rendering.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 13 - 24)

At 1440 × 900, neither phoneQuery nor portraitQuery matches, so currentMode returns desktop.

subscribeMode attaches change listeners to those media queries and returns a cleanup that removes them. No resize occurs during this trace.

The module's contexts hold callbacks for navigation help and closing drawers. Context creation alone does not open anything.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 61 - 65)

bookOpen is false. overlay is null because mode is desktop, even if drawerState later stores a side. Desktop menus are columns, not overlay drawers.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 155)

The wrapper supplies context providers, DOM data attributes for mode/open state/tutorial state, and a root ref.

It includes compact navigation controls and a dismissal backdrop, but CSS hides the compact bar on desktop. The backdrop is inactive with no overlay.

It places the workspace children in the shell and mounts LibraryTutorial with callbacks that can change drawerState and tutorialStep.

The onClickCapture handler is registered on the wrapper. It will run in the capture phase of later clicks, before the target's bubbling click handler.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 30 - 49)

LibraryContents reads navigation-help context, access context, pathname, and router. Its footer supplies Navigation help, conditional Switch to teaching, and Sign out.

Switch to teaching appears only if canTeach is true and the remaining condition passes. A principal role alone does not guarantee that button appears.

LibraryDrawerClose reads its close context and renders a button hidden by desktop styling. LibraryShelfTitle renders desktop/compact title spans, with CSS selecting the relevant one.

### The workspace's own styling now applies

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 6 - 25)

This workspace defines a local paper/ink/accent palette, sets its background, and uses **Arial, Helvetica, sans-serif** for its base font. Its branding uses **Georgia**, with a serif fallback.

This is a useful continuation of Chapter 1: Geist is the root/sign-in font, but a more local font-family rule overrides it within the principal workspace.

At this desktop width, the layout uses three grid columns: 214px contents, a flexible middle, and 244px shelf. minmax(0,1fr) lets the middle shrink instead of long content forcing overflow. There are gaps, padding, and a viewport-derived height.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 51 - 71)

The binder and paper use positioned elements, borders, shadows, and pseudo-elements to suggest stacked paper. Pseudo-elements are CSS-generated decoration, not extra React components.

The pageScroll region uses overflow-y:auto, so its content can scroll independently of the top bar and shelf.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 163 - 189)

Shelf covers use a two-column grid, gradients, shadows, rounded corners, and the per-cover colour. Serif cover titles and decorative seals are CSS/HTML, not bitmap book images.

The welcome layout centres its heading, book-like decoration, and action. Its large heading uses Georgia.

(File: [src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css), lines 1 - 17)

The responsive shell keeps contents in a flex column with a scrollable body and account-action footer. Its compact bar and drawer-close buttons are display:none on desktop.

Ordinary rendering/layout is browser work. There is no React loop manually drawing these columns.

## 18. Mount effects save the URL and prepare the first-visit prompt

These effects are independent where there is no data dependency. Their precise commits and paints can overlap; do not read this as a claim that every sibling effect runs in this written order.

(File: [src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts), lines 8 - 16)

The hook reads pathname and query text. After commit it calls rememberLibraryLocation with the current URL and registers a pagehide callback to save the URL when the document is hidden/unloaded through that event.

The event registration does not immediately fire pagehide.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 50 - 62)

rememberLibraryLocation recognises the /dashboard/principal path, gets the account identity, validates the URL, reads prior memory, and writes the current location.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 11 - 22)

identity repeats the previously explained account/school/role checks and returns the account-specific storage key.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 25 - 31)

libraryLocation parses the address using a dummy base URL. "new URL" here parses text locally; it does not contact library.invalid.

It checks the exact pathname and rejects a hash. With no book/query, it returns the root principal pathname.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 43 - 48)

read supplies empty memory for this first visit.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 58 - 62)

The helper sets saved.last and stores JSON in localStorage. There is no book-specific entry yet. This remembers a browser URL; it is not a backend write.

### Desktop accessibility setup

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 67 - 86)

The auto-contents effect has no new book to reveal. History/resize dismissal listeners are registered for future events.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 89 - 113)

The accessibility effect queries the mounted contents, shelf, workspace, and top bar from the root ref, assigns matching menu ids, and calculates visibility.

On desktop, no overlay is active and those regions remain available. The effect updates inert and aria-hidden accordingly and removes drawer-dialog roles.

Because active is null, it returns before the scroll lock, focus trap, or drawer-focus code. Those bodies do not execute on this desktop path.

### The tutorial checks account-specific progress

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 17 - 27)

LibraryTutorial starts with prompt=false, step=null, never=false, and key=null. Its initial render contains neither a prompt nor a coach.

Its mount effect schedules requestAnimationFrame. That asks the browser to run a callback before an upcoming repaint; it is not a fixed-duration timer.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 29 - 31)

The scheduled callback calls accountKey.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 9 - 12)

It reads accountType, accountId, and schoolId, then builds an account/school-specific progress key. With our fictional ids it is nedecen.navigation-help.v1:person:7:42.

Notice this key's component order differs from the navigation-memory key. They track different things.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 30 - 31)

setKey remembers this string in React state. The callback reads persistent progress and a tab-session timestamp.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 13 - 16)

read parses saved JSON or "{}". It sanitises visits into a non-negative number and accepts completed/dismissed only when literally true. On malformed JSON it returns visits:0.

This first visit has visits 0 and neither flag true.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 31 - 39)

Date.now gives milliseconds since the Unix epoch. **sessionStorage** is browser storage associated with this tab's page session, distinct from persistent localStorage.

The effect writes the timestamp and checks whether less than 30 minutes have passed since the last recorded mount. On our first visit, no timestamp exists; Number('0') produces 0, so the recent-visit guard does not return.

It increments visits to 1, capped at 4, saves progress as JSON, and sets prompt=true because visits<=3 and the completion/dismissal flags are absent.

There is no background inactivity timer here: the timestamp check happens when this mount effect runs. Ordinary book changes do not remount the entire shell in our trace.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 41 - 52)

The manual-help effect returns because request is 0. The step effect reports null to the wrapper and opens no menu. No tutorial step has started yet.

## 19. The prompt becomes a native modal

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 68 - 72)

The new render includes TeacherDialog titled A quick tour of your library?, an explanation, an unchecked Don't ask again checkbox, and Maybe later / Show me buttons.

TeacherDialog is reused here despite its teacher-oriented name. Its name does not restrict it to teacher accounts.

(File: [src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx), lines 12 - 15)

The component receives title, onClose, and children. busy defaults to false. It calls useModalMotion and uses that returned ref/close pair because no external motion object was supplied.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 19 - 34)

The hook creates dialog and timer refs, registers timer cleanup, and builds a close callback. **The close callback's body does not execute just because the modal was rendered.**

(File: [src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx), lines 16 - 26)

The JSX renders a native dialog with a labelled heading, a close button, and tutorial children.

After commit, its effect clears inert on the dialog, calls the browser's showModal(), and locks body scrolling.

showModal places it in the browser's modal top layer and makes the outside document unavailable for normal interaction. Browser dialog behaviour manages initial focus and modal keyboard behaviour.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 8 - 15)

lockModalScroll increments a shared lock count. For the first lock, it stores the body's prior inline overflow and sets overflow:hidden.

It returns an unlock function that only releases once. The last release restores the previous value. This supports overlapping dialogs without restoring scroll too soon.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 198 - 206)

The dialog is centred, width-limited, padded, paper-coloured, rounded, and shadowed. The ::backdrop rule supplies the dim overlay. The h2 uses Georgia, while body text uses the workspace's inherited font.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 15 - 22)

The open modal uses the shared entrance animation. Reduced-motion rules can disable it. The exit-animation declarations exist, but opening the modal does not run an exit.

## 20. You click Show me

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 145)

This click passes through the wrapper's capture handler. It is not a shelf-book button, and mode is desktop, so neither drawer-changing branch runs.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 71 - 71)

The button's handler calls remember(), sets prompt false, and sets step to 0.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 53 - 55)

remember's completed argument defaults to false. It reads the saved progress and uses object spreads to preserve visits and other fields.

Because completed and never are false, neither optional spread adds completed:true or dismissed:true. The stored record still has the visit information.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 68 - 78)

React removes the prompt dialog and adds the coach section for step 0.

This button does **not** call TeacherDialog's animated close callback. It directly changes the parent state, so the modal unmounts.

(File: [src/components/dashboard/teacher-books/TeacherDialog.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/dashboard/teacher-books/TeacherDialog.tsx), lines 16 - 22)

Effect cleanup closes the native dialog and invokes unlock, restoring body scrolling when the lock count reaches zero.

(File: [src/hooks/useModalMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useModalMotion.ts), lines 20 - 22)

The motion hook's cleanup clears any pending close timer. None was started on this path. There is no 140ms modal-exit delay from clicking Show me.

## 21. Tutorial step 1: Choose a book

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 46 - 52)

The step effect reports 0 to the wrapper and calls openMenu('shelf').

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 54 - 65)

The callbacks update tutorialStep and drawerState. On desktop, overlay remains null; the shelf was already a visible column.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 154)

The root now has data-tutorial-step="0". The tutorial state belongs to the mounted shell, so normal book selection need not erase it.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 61 - 78)

The coach shows Step 1 of 3, Choose a book, explanatory text, and Open any book, then continue.

Its Next button is disabled because step===0 and bookOpen is false. The user must open a book to proceed. The displayed number is step+1 because array indices/state are zero-based.

The coach is a section with an accessible label and aria-live="polite", not a native modal. It leaves the shelf interactive.

(File: [src/components/principal/books/library-tutorial.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/library-tutorial.module.css), lines 1 - 7)

The coach is fixed near the bottom centre, limited to 420px width or the available viewport, with a capped height and its own scrolling. It uses paper/ink variables, border, rounded corners, shadow, and Georgia for the heading.

(File: [src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css), lines 131 - 135)

The root step attribute makes CSS outline the bookshelf. Contents/shelf get 320px bottom padding while the tour is active, allowing their content to scroll clear of the coach.

No API request was needed to start the tutorial. Visits and completion are browser-storage preferences.


## 22. You open Grades & Classes

You click that book's cover on the right-hand shelf. You could instead use the welcome area's Open Grades & Classes button; our trace uses the cover.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 145)

The wrapper's click-capture handler runs first. event.target may be a nested cover span. closest(...) walks up its ancestors to find the shelf button whose aria-label begins with Open.

It finds the button. On desktop, the special compact re-opening branch is false, so it sets drawerState to a closed side for the current location. This does not hide the permanent desktop shelf.

The handler does not call preventDefault or stopPropagation, so the target's normal React click handler can run.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 350 - 355)

The cover button's handler calls navigate(item.id), supplying "grades". It does not supply a page or tab.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 294 - 300)

navigate checks importChanged, which is false. No revision increment is needed.

Because nextPage is absent, it asks rememberedLibraryLocation('principal','grades') for a previous page in this book.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 66 - 75)

identity and read use the same account-specific navigation key explained earlier. This visit has saved the bare library URL but no books.grades entry, so the lookup returns null before URL validation.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 297 - 300)

new URLSearchParams receives {book:'grades'} and constructs query text safely.

The optional chaining expression tries the remembered URL only if one exists. There is none, so page remains undefined. The "??=" operator assigns a fallback only if the left side is null or undefined.

No page or tab parameter is added.

### A visual page turn begins before navigation/data completes

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 301 - 307)

The old bookId is null and nextBook is grades, so navigate calls turn(1). The distance 1 requests a forward visual turn.

This animation is separate from changing the URL or fetching the destination.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 91 - 99)

turn first calls clear.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 63 - 71)

clear cancels animations from any preceding turn, removes the data-turning marker, and empties the temporary layer contents. There is no preceding turn to cancel on this first selection.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 91 - 101)

With normal motion enabled and mounted source/layers, the guard passes. It extracts the underlay and sheet elements, chooses forward direction, and asks for a schedule and frames.

(File: [src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts), lines 42 - 45)

For distance 1, count is 1. Array.from produces one timing entry with delay 0 and duration 340ms. Larger distances can use multiple staggered sheets.

(File: [src/components/principal/books/pageTurnMotion.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/pageTurnMotion.ts), lines 22 - 36)

pageTurnFrames(false) uses the predefined forwardFold values. It builds front, back, curl, and shadow keyframe arrays.

For each fold, it computes a starting edge and a sine-based strength, then constructs clip-path polygons, translations, horizontal scales, and opacities. These describe the visible part of the page, its reverse side, curl, and shadow over animation progress.

No record is saved and no route is changed by this geometry calculation.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 99 - 115)

The hook records the active animation and adds data-turning="forward" to the layers.

For its one scheduled sheet, it creates four div elements using document.createElement, names them with data attributes, appends them, and prepares visual snapshots for the first sheet's front and back.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 44 - 50)

placeSnapshot calls snapshot, inserts its result into the chosen visual layer, and restores captured scroll offsets.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 16 - 37)

snapshot makes a deep DOM clone of the visible paper.

It removes animation/spine decoration from the clone, makes it inert and aria-hidden, strips ids to avoid duplicates, and applies absolute visual-only styling with pointer events disabled.

It can copy current displayed input values and scroll offsets. Our welcome page has no editable form, so the input-copy loop has no fields to process.

**A cloned DOM node is not a second mounted React component.** It does not become another working login form or another live API consumer.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 120 - 128)

The hook calls the browser's Element.animate API for the sheet and each visual part. It stores Animation objects and watches their finished Promises.

When all complete, it calls clear if this is still the active turn. A later turn could cancel them, in which case catch handles the cancellation.

If the user prefers reduced motion, the earlier guard skips this entire visual turn. Navigation still proceeds.

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 150 - 160)

CSS positions the temporary layers over the paper, reveals them only while data-turning exists, and supplies reverse/curl/shadow visual styling. Pointer events remain disabled.

### Now the URL changes

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 306 - 309)

navigate records the animated destination and calls:

~~~ts
router.push("/dashboard/principal?book=grades", { scroll: false });
~~~

The real code builds this string from URLSearchParams. scroll:false asks Next.js not to scroll the entire window to the top for this navigation.

It clears the page search query. The browser history now tracks this book selection through the query string.

"book" is an application's URL parameter, not a physical .tsx file name. We remain on the same Next.js principal route; the component interprets its query parameters.

## 23. The selected book renders a loading state

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 198 - 237)

useSearchParams now yields book=grades. books.find selects the Grades & Classes definition.

No loaded object for that book exists yet, so data remains null. pages is empty, page is undefined, and view is null.

The mounted ResponsiveLibrary and LibraryTutorial preserve their state. It is still tutorial step 0; it has not become a new first visit.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 320 - 342)

The root receives --book-accent from this book's colour, #8b413d. The shell receives bookTitle="Grades & Classes", so bookOpen becomes true.

The contents introduction identifies the open book, initially with no built pages. The centre displays Preparing your page… until both data and a view are ready.

The shelf's selected-book aria-pressed value becomes true. These changes are React state/prop rendering, not page-specific HTML sent by the Express API.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 67 - 80)

The auto-contents effect notices the book. On desktop it records lastBook and returns without scheduling the two-frame compact-drawer reveal.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 46 - 52)

bookOpen changed, so the tutorial step effect reports step 0 again and requests the shelf. Desktop overlay remains null.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 75 - 77)

The coach's extra Open any book hint disappears, and Next becomes enabled. **It is gated by bookOpen, not by every data request finishing.** We choose to wait for the page before continuing.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 266 - 288)

The location effect updates remembered animation/location refs. The explicit navigate call already recorded this destination, so the matching animated-location guard avoids starting the same turn a second time. It resets the paper's scroll position as appropriate.

(File: [src/hooks/useLibraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useLibraryMemory.ts), lines 8 - 16)

The query-string change restarts the memory effect, which saves the new address and replaces its pagehide listener with a closure containing the latest URL.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 25 - 40)

libraryLocation checks the principal path, validates the book against allowed names, and rebuilds a URLSearchParams object using the supported parameters.

For book=grades with no page, it returns the validated address without inventing a page id.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 50 - 62)

rememberLibraryLocation stores this as saved.last and as saved.books.grades. The URL has no password or token in it.

## 24. The book starts its data requests

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 239 - 246)

The book-loading effect now has a book. It calls getSchoolId.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 95 - 100)

The helper reads the school string from localStorage and uses parseInt(...,10) to convert it to a base-10 number. It returns null if conversion gives NaN. Our valid school id passes.

This local value identifies the requested school. Backend permission checks still decide whether it is allowed.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 241 - 245)

The effect creates a cancelled flag and calls book.load(schoolId). Its callbacks will ignore obsolete results if cleanup marks the operation cancelled. This flag does not abort fetch.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 100 - 102)

The Grades & Classes load function calls Promise.all with three operations:

1. structure(schoolId).
2. Read the school's streams.
3. Read the school's people.

Promise.all waits for all to succeed and returns results in the input order, **not response-arrival order**. If one rejects, the combined Promise rejects; this does not automatically cancel the other requests.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 47 - 49)

structure begins by requesting the school's grades and awaiting them.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 15 - 16)

base constructs /schools/[schoolId]. get delegates to api.get and expects an array of record objects.

The initial batch therefore contains these GETs:

~~~text
/schools/[schoolId]/grades
/schools/[schoolId]/streams
/schools/[schoolId]/people
~~~

"[schoolId]" is explanatory notation here. The actual request contains a number, not square brackets.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 223 - 224)

Each get calls the shared request helper.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 174 - 211)

Each request obtains the current in-memory token, includes its Authorization header and credential options, sends GET, checks the response, and parses JSON. Our valid token means there is no refresh retry.

Requests and their OPTIONS preflights can overlap. The following backend explanations are separate tracks, not a claim that grades must finish before streams or people.

## 25. A shared backend check applies to these school reads

Each GET repeats shared CORS/response-header/logging middleware. None matches a login-IP limiter.

(File: [Project-Edu-Revo/src/middleware/auth.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/auth.ts), lines 33 - 48)

Each protected route's requireAuth verifies the bearer token and reads the current staff row before attaching req.caller. It is not satisfied merely by localStorage.role.

(File: [Project-Edu-Revo/src/middleware/schoolAdministration.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/middleware/schoolAdministration.ts), lines 4 - 13)

The route's requireSchoolAdministration middleware calls staffAccess, compares the requested school with the caller's current school, and chooses read capabilities for GET.

Because isPrincipal is true, the non-principal capability-denial condition is false. It calls next.

(File: [Project-Edu-Revo/src/services/staffAccessService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/staffAccessService.ts), lines 8 - 17)

This repeats the live staff/grant/allocation/chapter queries already traced for the access endpoint. The backend does not reuse the browser's previously returned access object as authority.

That means one feature GET can involve several database queries before its own data query even starts. The frontend interface is not performing those queries directly.

The factories creating these middleware functions ran at startup. Their returned functions run now for each matching request.

## 26. Grades GET: retrieve the school's grade rows

(File: [Project-Edu-Revo/src/app.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/app.ts), lines 79 - 85)

Router mount order matters. The grades router is visited before streams, classes, and people. A router with no matching handler passes onward; it does not create a response just by being mounted.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 12 - 19)

The /schools/:schoolId/grades prefix middleware runs requireAuth and requireSchoolAdmin, then validates a positive safe-integer school id and matching caller school. Our request passes.

Colon-prefixed segments are route parameters. Express extracts the real number's text into req.params.schoolId.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 23 - 27)

The exact GET handler converts that text to a number, checks the school exists, and gets its grades.

(File: [Project-Edu-Revo/src/services/schoolService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/schoolService.ts), lines 33 - 36)

getSchoolById selects the school row by id. Array destructuring takes its first result, and nullish fallback returns null if absent. Our existing school is returned, so the route does not send 404.

(File: [Project-Edu-Revo/src/services/gradeService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/gradeService.ts), lines 14 - 16)

getGradesBySchool selects rows with the matching schoolId and orders them by number. It is a read, not creation of grades during login.

The normal provisioned grades are 8–12. Their database ids are separate from their educational numbers: Grade 8's id need not be 8.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 26 - 26)

res.json returns the grade-row array.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 207 - 211)

The browser parses the OK response as an array.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 48 - 49)

structure sorts numerically using Number(a.number)-Number(b.number), then maps each grade to another GET for its classes.

This introduces **one additional request per grade**, after grades are known. For five grades, five class requests can now run in parallel. They need not wait for the initial streams/people responses.

## 27. Streams GET: retrieve stream records

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 26 - 31)

The stream prefix applies requireAuth and requireSchoolAdmin, followed by a school-match check.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 82 - 96)

The exact GET route applies requireAuth and requireSchoolAdmin again, validates the numeric school id, checks the school exists through getSchoolById, and calls getStreamsBySchool.

This repetition is in the current code: do not assume a permission function runs only once because the URL represents one operation.

(File: [Project-Edu-Revo/src/services/streamService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/streamService.ts), lines 21 - 23)

The service selects stream rows belonging to the school.

(File: [Project-Edu-Revo/src/routes/streams.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/streams.ts), lines 95 - 96)

The route sends their array as JSON. The frontend request helper parses it and fulfils this branch of Promise.all.

These records are loaded because class tools can use streams. The user has not opened the separate Streams book.

## 28. People GET: retrieve staff choices and status

(File: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts), lines 57 - 64)

The people GET runs requireAuth and requireSchoolAdmin, reads/validates the school through getSchoolById, then calls getPeopleBySchool.

There is no people prefix middleware equivalent to the stream prefix in this path; these checks are attached to the handler.

(File: [Project-Edu-Revo/src/services/peopleService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/peopleService.ts), lines 27 - 61)

The service explicitly selects display/account-status fields: names, staff number, role, ids, username, setup status, creation time, administrative work, and assignment counts.

It joins chapter and subject tables, uses aggregation/grouping for counts, restricts rows to the school, and orders by surname.

A left join retains a person even without matching assignment rows. Aggregation produces counts rather than one display row per joined chapter.

The query does not select passwordHash for the returned staff choices. This is different from the login query that needed it privately on the server.

(File: [Project-Edu-Revo/src/routes/people.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/people.ts), lines 62 - 63)

The route serialises the array; the browser parses it and fulfils the people branch of Promise.all.

These rows will supply class-manager choices when a create/edit action is later opened. Fetching them does not open the Staff book or any class dialog.

## 29. Each classes GET follows a longer middleware path

After grades return, structure requests:

~~~text
/schools/[schoolId]/grades/[gradeId]/classes
~~~

for each grade id.

(File: [Project-Edu-Revo/src/routes/grades.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/grades.ts), lines 14 - 19)

First, this longer URL still matches the earlier grades-router **prefix**. requireAuth, requireSchoolAdmin, and its school-id checks execute there.

The exact grades-list GET does not match this longer path, so processing continues to later mounted routers.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 29 - 38)

The classes-router prefix matches next. It repeats requireAuth and requireSchoolAdmin, checks grade-id validity and school ownership, and queries grades for a row matching both gradeId and schoolId. Only then does it call next.

The more specific :classId middleware below does not match a list URL lacking a class id.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 107 - 123)

The list GET itself again includes requireAuth and requireSchoolAdmin. It converts parameters, checks for invalid numbers, confirms the school exists, and calls getClassesByGrade.

**On this current mounting path, one class-list request can run requireAuth and administrative access checks three times**: grades prefix, classes prefix, and GET handler. Each invocation can repeat its database reads.

This is existing behaviour, not a requirement of Express or a simplification that one request equals one query.

(File: [Project-Edu-Revo/src/services/classService.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/services/classService.ts), lines 90 - 125)

getClassesByGrade builds a query that:

- Selects class id, academic year, grade id, stream ids, class-manager id, name, description, and creation time.
- Uses a SQL array subquery to obtain stream memberships.
- Left-joins learners to count them.
- Left-joins people to obtain class-manager names.
- Restricts rows to the requested grade.
- Groups fields so each class has an aggregate learner count.
- Orders by class name.

count(learners.id) gives zero when a class has no learner matches. For a grade with no classes, the query returns an empty array, not an invented class.

(File: [Project-Edu-Revo/src/routes/classes.ts](C:/Users/Kgodiso/source/repos/Project-Edu-Revo/src/routes/classes.ts), lines 122 - 123)

Each response returns that grade's class list.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 49 - 50)

Promise.all preserves the grade-request order while collecting the arrays. flat removes one array level, producing one combined classes list.

structure returns {grades,classes}.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 102 - 102)

When structure, streams, and people have all succeeded, load returns an object combining grades/classes with streams/people through object spread.

For five grades, this book opening required **eight feature GET requests**: grades, streams, people, plus five class lists. Permission/membership queries and any preflights are additional work, not additional feature URLs in that count.

If a feature request failed, the book effect could show a load error. Our successful path waits until all required data is available.


## 30. Loaded records become a navigation tree

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 239 - 245)

The load Promise fulfils. Because cancelled is false, its then callback calls setLoaded with book id, data, and revision, and clears any load error.

React renders again. loaded matches the selected book/revision, so data now refers to that object.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 224 - 228)

The memoised pages computation calls book.pages(data).

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 103 - 108)

The Grades & Classes pages function maps sorted grades into parent page objects.

Each has a stable id such as grade-[database-id], a title such as Grade 8, a displayed page number, kind="grade", and entity holding the grade record.

For each grade, it filters classes by gradeId, sorts their names with numeric-aware localeCompare, and maps them to child pages. Each class has a Bulk import learners grandchild.

These are **data objects describing pages inside the book**. They are not separate Next.js page.tsx files, and generating their descriptions does not execute the import tool.

If a grade has no classes, its children array is empty.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 115 - 117)

flattenPages recursively produces reading order: a parent, then all its descendants, then the next parent.

flatMap combines each returned array into the result, and the spread expands descendant entries. The recursion ends at an empty children array.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 226 - 231)

No explicit page parameter was supplied, so page falls back to flat[0]: the first grade, Grade 8 under our normal-grade assumption.

index becomes 0. pageKey and viewKey now incorporate that selected page and current revision.

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 122 - 129)

findPagePath walks the tree recursively to find the selected node and its ancestors. For the first parent grade, it returns that grade alone.

The workspace takes the last two nodes for its breadcrumb. This is array processing in the browser, not another network request.

### The contents can render before the centre view is ready

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 324 - 342)

The contents now has page headings and the correct count. data exists, but view is still absent until the view effect finishes, so the central loading state can remain briefly.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 39 - 45)

Contents maps each page into an ordered-list entry and button, showing page number/title.

key helps React track the list item. aria-current="page" and the currentHeading class mark the active Grade 8 page. The child recursion renders class/import subheadings where they exist.

Every button receives a navigation callback, but merely rendering the list does not navigate to each entry.

## 31. The first grade's view is generated

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 248 - 255)

Now book, data, and page all exist, so the view effect passes its guards. It reads the school id again and calls book.view with schoolId, data, page, tab, and principal status.

It creates a cancellation flag for obsolete results. If the selection changed before completion, cleanup would prevent the old callback from replacing the new view.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 109 - 117)

The view function extracts page.entity. The TypeScript ! asserts it is present; it does not fetch or construct a missing entity.

The page is kind grade, so the import branch is skipped and the grade branch executes:

- Filter classes to this grade.
- reduce their learnerCount values to a sum, converting values with Number and treating missing counts as zero.
- Construct a descriptive sentence with class and learner counts.
- Construct one section titled Classes in this grade.
- Build rows for child class pages.
- Build a create-class action description.

reduce starts its accumulator at 0. A grade with no classes therefore has learnerCount 0 rather than undefined.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 24 - 27)

pageRows maps child pages to display rows containing id, title, Page [number] detail text, and destination pageId.

figure calls React.createElement to describe a strong element for a count. sentence describes a span containing text and those strong elements. This is React UI construction without JSX, not direct DOM insertion.

The singular/plural conditional expressions in the view choose class/classes and learner/learners based on counts.

### Creating an action description does not create a class

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 57 - 63)

classCommand executes now to describe the visible action. With no cls argument, its label becomes Create a class in Grade 8.

It prepares field descriptions for label, class manager, and description, plus a run callback.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 21 - 22)

text and select are small arrow-function helpers returning objects. Defaults supply empty values and required flags. The description field overrides its type to textarea and sets maxLength.

select creates its choices using optionsOf(data.people).

(File: [src/components/principal/books/types.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/types.ts), lines 130 - 142)

optionsOf maps staff records to string ids and labels. Where a name property is unavailable, nameOf combines title, first name, and surname, filtering absent pieces and joining with spaces.

These field objects are prepared as part of the action description, even though the dialog is not open.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 63 - 71)

The run callback is created but **its body does not execute**. No class is inserted, no save payload is sent, and no new class page id is returned during this task.

(File: [src/components/principal/books/registry.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/registry.ts), lines 115 - 117)

The grade branch returns the description and section object. It does not proceed into class-specific learner/subject GETs below that return.

Because view is async, its result is a Promise even though this grade branch requires no additional fetch.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 253 - 254)

The then callback stores the view together with pageKey and viewKey, then clears the corresponding error. React renders again.

## 32. The central Grade 8 page is rendered

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 234 - 237)

The view's pageKey matches the current selection. Its viewKey matches too, so viewStale is false and there is no error.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 333 - 346)

The breadcrumb identifies Grades & Classes and Grade 8. The successful conditional selects WorkspacePage instead of loading/error output.

It supplies the view, title, empty search query, current tab, callbacks, school id, data, and stale/error values. Pagination shows the first page and disables Previous because index is 0. Next depends on whether more flattened pages exist; with grades 8–12 it is available.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 118 - 146)

WorkspacePage reads current search parameters and initialises import-related state, though this view is not an import view.

outlineActions counts title and section actions. With a single create-class section action it does not force outlined action styling.

Functions such as pageHref and activate are declared for later interaction. Rendering them does not submit a command.

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 157 - 190)

The header displays Grade 8.

This grade view has no filter tabs, no import controls, and no title-level actions. Search appears only if explicitly requested or a section has more than five rows. Thus the presence of a search box depends on the school's existing class count, not the principal's first-visit status.

MotionPanel wraps the content with aria-busy=false and inert=false because it is not stale.

The description displays:

~~~text
Grade 8 has [class count] classes with [learner count] learners enrolled.
~~~

The actual singular/plural wording is chosen by the code. Counts come from the records just returned, not hard-coded text. This chapter does not claim a particular count without reading the school's database.

The section shows Classes in this grade, its row count, and the create-class action.

Its row filter combines each row's title/detail/badge into lower-case text and checks the empty query. Every string includes an empty string, so all rows pass initially.

If there are classes, each row is a button with a title, page-number detail, and Arrow. If there are none, the section displays No classes yet. Create the first class here.

No import component mounts because this view has no import property.

### The create-class button is rendered through a shared component

(File: [src/components/principal/books/BookWorkspace.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/BookWorkspace.tsx), lines 145 - 155)

contextAction chooses classes and supplies a label, icon choice, and onClick callback to MobileAction. There is no alternative import link for this grade action.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 7 - 14)

actionIconFor tests the label using regular expressions. Its Create prefix selects the add icon.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 42 - 46)

MobileAction renders a type=button control, forwards handler props, and supplies accessible label/title fallbacks. It marks add as an action whose text should remain visible even on compact layouts.

(File: [src/components/shared/MobileAction.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/MobileAction.tsx), lines 16 - 38)

MobileActionContent constructs icon/text spans. Icon selects inline SVG geometry; add uses crossing vertical/horizontal strokes. This is browser-drawn vector content, not an asset request.

(File: [src/components/shared/mobile-action.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/mobile-action.module.css), lines 1 - 12)

On our desktop width, the icon span is hidden by the base rule and the action text remains. Compact rules can reveal the icon and change spacing at their media query.

We do not click this action. Its handler and command run callback remain unexecuted.

### Final page appearance and entrance

(File: [src/components/principal/books/books.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/books.module.css), lines 79 - 126)

The sticky header stays at the top of its scroll container, with an opaque paper background. Its h1 uses 28px Georgia and a 1.25 line-height.

Flex rules align action groups; paragraph rules style the description; section and row rules supply gaps, dividers, counts, text sizes, and muted detail text.

The empty-state rule applies only if there are no rows. Row-link hover styling is browser CSS; it does not need a custom onMouseMove callback.

(File: [src/components/shared/Motion.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/shared/Motion.tsx), lines 37 - 47)

MotionPanel renders a div and uses a layout effect for its arrival animation. Once the non-stale changeKey is supplied, it animates from opacity .35 with a 4px downward translation to full opacity at its final position over 160ms.

It skips this animation for reduced motion and registers cleanup/preference-change handling. Element.animate is browser animation code called by our hook; React does not repeatedly set opacity in an application loop.

(File: [src/components/principal/books/usePageTurn.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/usePageTurn.ts), lines 73 - 82)

The page-turn layout effect updates latestKey. If a turn is still active and its content key changed, it can update the incoming visual snapshot with current paper content. If the 340ms animation already ended, that branch does nothing.

Network completion and the animation duration are independent. A fast turn may end before data arrives; a fast API may finish while the turn is still visible.

We wait until the page is usable and those transient animations have settled before continuing the tutorial.

## 33. You click Next: Choose a page

The coach is still on Step 1, now with an open book. You click its enabled Next button.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 145)

The capture handler sees a coach button, not a shelf or contents-navigation button. On desktop, it makes no drawer change.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 57 - 60)

next sees step 0, so the final-step branch is false. It calls:

~~~ts
setStep(current => (current ?? -1) + 1);
~~~

This is a **functional state update**: React passes the current state to the updater. It produces 1 here.

The null fallback would make a null step become 0, but our step is already 0.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 46 - 52)

The step effect reports 1 through stepChanged. Because a book is open, it also calls openMenu('contents').

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 54 - 65)

The wrapper stores that drawer side, but desktop overlay remains null. The contents column is already present and does not slide in as a modal.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 61 - 78)

The coach now shows Step 2 of 3, Choose a page, and the desktop description explaining the left menu.

(File: [src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css), lines 131 - 135)

data-tutorial-step="1" moves the visual outline to the contents nav. The temporary bottom padding remains while the tutorial is active.

No grade data is refetched just because the tutorial step changed. Its state is in the responsive shell/tutorial, not a change to book/revision dependencies.

The tutorial's code does not require clicking a page on this step. Grade 8 is already selected. In our defined sequence, you inspect the highlighted list and click Next without selecting a different page.

## 34. You click Next: Switch books anytime

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 57 - 60)

next increments step from 1 to 2.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 46 - 52)

The step effect reports 2 and requests the shelf.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 61 - 78)

The coach shows Step 3 of 3, Switch books anytime, and the desktop text describing the permanent right-hand library and Navigation help at the bottom of the left menu.

The action button's conditional label becomes Finish because step===2.

(File: [src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css), lines 131 - 135)

The outline highlights the bookshelf again. No book selection changed, so the Grade 8 view stays mounted and no feature GET is caused by this Next click.

You leave Don't ask again unchecked. Its onChange callback therefore does not run during this trace.

## 35. You click Finish

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 57 - 60)

next now takes the step===2 branch:

~~~ts
remember(true);
setStep(null);
closeMenu();
~~~

It first persists completion.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 53 - 55)

remember(true) reads the existing progress and spreads it into a new object with completed:true. Because never remains false, it does not add dismissed:true.

The JSON record preserves visits and any existing fields and writes completion under this account/school progress key in localStorage. This is not a PostgreSQL write.

Completion prevents the normal future auto-prompt condition from passing. Navigation help can still manually request the guide; completion does not remove that button.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 65 - 65)

closeMenu calls the wrapper's close callback, storing side:null for the current location.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 73 - 78)

step is null, so the conditional coach section is no longer returned. The prompt is already false, so no prompt dialog returns either.

(File: [src/components/principal/books/LibraryTutorial.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/LibraryTutorial.tsx), lines 46 - 52)

The effect reports null to the wrapper. None of its menu-opening conditions is true.

(File: [src/components/principal/books/ResponsiveLibrary.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/ResponsiveLibrary.tsx), lines 137 - 155)

The root's data-tutorial-step becomes "none". On desktop, overlay remains null. The mounted workspace and book view continue to exist.

(File: [src/components/principal/books/responsive-library.module.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/components/principal/books/responsive-library.module.css), lines 131 - 135)

The step-specific outline and extra bottom padding no longer match. The browser recalculates the affected styles and layout and paints the ordinary workspace.

A brief render/commit interval can exist between removing the coach and the effect updating the wrapper's step attribute. We wait until that settles rather than describing every state setter as an immediately visible frame.

## 36. The endpoint: what is fully rendered now?

We stop at /dashboard/principal?book=grades, with the first grade selected by the component's default selection. There need not be a page= parameter for Grade 8 to be visible.

The desktop screen contains:

| Region | Current result |
| --- | --- |
| Top bar | NEDECEN, principal-library identification, Sign out. |
| Left contents | Grades & Classes page tree, Grade 8 marked current, Navigation help, account actions permitted by live access. |
| Centre | Grade 8 heading, class/learner count sentence, Classes in this grade section, existing class rows or the empty-state message, create-class action. |
| Pagination | First page selected; Previous disabled; Next available with the normal remaining grades. |
| Right shelf | Six book covers, with Grades & Classes selected. |
| Tutorial | Prompt and coach gone; completion stored for this account/school in this browser origin. |

Nothing waits for a secret final tutorial API request. Finish changes browser preference/state and presentation. The book data was loaded earlier and the normal page remains.

### Which requests and writes actually occurred?

| Trigger | Application requests on our path |
| --- | --- |
| First, wrong submission | POST people login → POST learner login → POST manager login, all 401. |
| Corrected submission | POST people login, successful. |
| Entering the principal route | GET /staff/me/access. |
| Opening Grades & Classes | GET grades, streams, people, and one classes GET per returned grade. |
| Advancing/finishing the tutorial | No application API request. |

This excludes framework navigation/asset requests and any browser CORS preflights. With five normal grades, there are eight book feature GETs. Window-focus changes, development Strict Mode, retries, or a different starting session can add work; this source-based logical trace does not claim an exact packet count from a running browser.

The failed attempts wrote rate-limit counters. Successful login also stored a hashed refresh-token row and issued a cookie. Feature loading read school data. Navigation memory and tutorial progress were written to browser storage.

**No class, learner, stream, or curriculum record was created by finishing this task.**

The three most useful chains to recognise are:

~~~text
Input event → React handler → state setter → render/commit → browser paint

Submit → login helper → fetch → Express middleware → service → PostgreSQL
       ← parsed response/error ← HTTP response ← handler result

Tutorial click → local state/preference change → matching JSX/CSS changes
~~~

We stop here. Creating a class, opening another book, or clicking a grade heading for a new task is not part of this chapter.

