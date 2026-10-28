# Chapter 1: You open the app, and the login screen appears

**Starting point:** you have not entered a username or password.

**Finishing point:** you can see the login screen, ready to type.

We will follow one example: a new browser visit, no saved login, no saved theme, and the device's normal appearance set to light. We will first picture a desktop browser, then explain the few rules that make this same screen look different on a phone.

You do not need the previous guide open. Read this from top to bottom. When the story moves to another file, I will say why. When it returns, I will say where it returns.

The line numbers refer to the source as it stands when this chapter was written, on **28 October 2026**. Click a filename to open it. You do not need to change any code to follow along.

## 1. You enter `http://localhost:3001` and press Enter

For this example, assume the frontend development server is already running on port `3001`. This chapter does not start or stop your servers.

The address has three pieces:

- `http://` tells the browser which way to communicate with the server.
- `localhost` means **this computer**.
- `3001` identifies the particular server program we want on this computer.

There is also an implied path: `/`. You did not type a deeper page address such as `/dashboard/principal`, so the browser asks for the root page.

The browser sends a request roughly like this:

```http
GET / HTTP/1.1
Host: localhost:3001
```

`GET` means: “Please send me this resource.” There is no username/password payload. You have not entered them yet.

**Where we are now:** the browser has asked the frontend server for `/`. Nothing has reached the school database.

## 2. Next.js receives that request

The program answering port `3001` is the frontend's **Next.js server**.

Next.js is an installed library/framework: it supplies the machinery that receives page requests, finds route files, prepares HTML, and sends the browser the JavaScript and CSS it needs.

**File: [package.json](C:/Users/Kgodiso/source/repos/nedecen-web/package.json:5), lines 5–9.**

- The `dev` entry says `next dev`.
- Running the development command starts that framework's development server. A port can be supplied when starting it.
- This file does not execute a login function when a user opens the address. It tells development tools how to start/build the application.

There is no single `main()` function you wrote that manually receives this page request. Next.js supplies that first piece. We begin following *your application files* where Next connects the request to them.

One timing detail: Next can reuse already-prepared code and fetch several browser resources in parallel. I will not pretend every imported file is read from disk again on every visit. Inside the functions below, however, we can follow the actual statements and the values they produce.

**Next stop:** Next must decide which page `/` means.

## 3. Next finds `src/app/page.tsx`

Next uses folder/file names to find pages. In this project:

```text
src/
  app/
    layout.tsx   ← the outside document around the page
    page.tsx     ← the page for /
```

Because you requested `/`, Next selects `src/app/page.tsx`.

It also uses `src/app/layout.tsx` to provide the surrounding HTML document. The layout and page are pieces of one coordinated render; you did not send a separate browser request for each TypeScript file.

`tsx` means this file can contain TypeScript plus JSX. JSX is the HTML-like notation you will see shortly. The browser receives the processed result, not the original TypeScript file as a page of text.

**Where we are now:** Next has found the login page and its outer layout. Neither has checked a password.

## 4. Next prepares the outside document

**File: [src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:6), lines 6–9.**

These lines are imports. An import makes something from another file or library available here.

- `Metadata` comes from Next. It is a TypeScript description of the metadata object's shape. It helps check the code while developing; it is not a function that runs in the browser.
- `Geist` comes from `next/font/google`. This is Next's font-loading integration.
- `./globals.css` brings in the application's global styling.
- `./motion.css` brings in shared animation styling.

Those last two imports do not return a variable. They tell the build system to include those styles.

**Same file: [src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:11), lines 11–14.**

```tsx
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
```

- `const geistSans` creates a named value for the font setup returned by Next.
- `variable` requests a CSS variable named `--font-geist-sans`.
- `subsets: ["latin"]` chooses the font's Latin character subset.

Next's build/font machinery prepares the font assets and generated styles. This is not a request to your Express backend, and not a new Google font download initiated by this function on every page visit.

**Same file: [src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:16), lines 16–20.**

The object contains the document title `NEDECEN`, a description, and a manifest address. `export` makes it available to Next, which uses it when preparing the document's metadata.

The title is why the browser tab can say NEDECEN. The manifest describes installable-app details; listing it here does not sign someone in.

**Next stop:** what HTML does this outer layout describe?

## 5. `RootLayout` describes the document around the login page

**File: [src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx:22), lines 22–36.**

This declares a function named `RootLayout`. Next invokes it as part of preparing the route.

Its input is an object with `children`. Here, `children` represents the page content Next places inside the layout. Think: **“Here is the outside document; put the selected page in this opening.”**

The TypeScript text `children: React.ReactNode` describes the kind of content allowed. It does not itself create visible text.

The `return` describes:

```tsx
<html ...>
  <head>...</head>
  <body ...>{children}</body>
</html>
```

- `lang="en"` marks the document language as English.
- `geistSans.variable` adds Next's generated font-variable class to the HTML element.
- `h-full` is a Tailwind CSS class asking for full height.
- The theme-color meta tag supplies a color hint to supporting browsers.
- The apple-touch-icon link names an icon for supported saved/home-screen shortcuts.
- The body uses `min-h-dvh flex flex-col`: at least the visible browser height, with a vertical flexible layout.
- `{children}` is where the route's content belongs. Curly braces in JSX mean “use this JavaScript value here.”

This function does **not** produce a login form by itself. That comes from the page we are about to enter.

**Where we are now:** the outer document is described. Next still needs the page content inside it.

## 6. Next prepares the login page's imports

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:1), line 1.**

`"use client"` marks this file as part of the interactive browser side of the app. That is needed because this page uses state, browser storage, and click/input handlers.

It does **not** mean “this page can never be prepared on the server.” On a first page load, Next can also prepare an initial HTML preview of a Client Component. Later, browser JavaScript makes it interactive. You will see both stages below.

**Same file: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:8), lines 8–11.**

- React supplies `useState`, which remembers values between renders, and `useEffect`, which schedules work after the component has appeared in the browser.
- Next supplies `useRouter`, which gives the page navigation methods such as `push` and `replace`.
- `login`, `getRole`, `getResumePath`, `restoreSavedSession` come from your own `src/lib/auth.ts`.
- `useTheme` comes from your own `src/hooks/useTheme.ts`.

The `@/` beginning is a shortcut to `src/`, configured in [tsconfig.json](C:/Users/Kgodiso/source/repos/nedecen-web/tsconfig.json:21), lines 21–23. So `@/lib/auth` means `src/lib/auth.ts` here.

Importing `login` does **not** log someone in. It makes the function available for a later call.

### A small piece of setup inside that import chain

**File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:6), lines 6–7.**

This helper imports your API functions and library-memory functions. There is still no password submission. Some module-level setup is prepared:

**File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:6), line 6.**

`API_BASE` stores the configured backend address, falling back to `http://localhost:3000`. The `??` means “use the right-hand value if the left-hand value is missing/null.” Merely assigning this address does not send a request.

**Same file: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts:15), lines 15–23.**

- `refreshPromise` starts as null: no token-renewal request is in progress.
- `accessToken` starts as null: this newly loaded browser module has no access token in memory.
- `sessionGeneration` starts at zero. Later session changes use it to recognize old responses.
- The `typeof window` check prevents browser-only work on the server. In the browser it installs a storage event listener.
- That listener's callback waits for relevant changes from another tab. Registering it does not execute its reload lines now.

**File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts:4), lines 4–8.**

This prepares allowed book IDs for later navigation memory. It does not load the principal's books from the database. The other function bodies in these imported helper modules wait until someone calls them.

**Next stop:** React invokes the login page function.

## 7. React enters `LoginPage()` for the first render

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:13), lines 13–15.**

A **render** means React calls a component function to ask: “Given the current values, what should the screen contain?”

- The function is named `LoginPage`.
- It takes no page-specific arguments here.
- `const router = useRouter()` gets the navigation tools. It does not navigate anywhere yet.
- `const { theme, toggle } = useTheme()` calls another function and takes two named values from its result.

We therefore pause `LoginPage` at that call and follow `useTheme`.

## 8. Execution enters `useTheme()`

**File: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:7), lines 7–16.**

The first important expression is:

```tsx
const [theme, setTheme] = useState<"light" | "dark">(() => {
  ...
});
```

Here is what its pieces mean:

- `theme` will hold the current choice.
- `setTheme` is the function we can call later to change that choice.
- `<"light" | "dark">` is TypeScript saying those are the two allowed values.
- The `() => { ... }` function calculates the starting value when this state is first created.

**On the server:** `window` does not exist, so the first check returns `"light"`. It does not try to read browser storage.

**When the browser initializes this component:** `window` exists. It checks localStorage for `theme`. In our example nothing is saved, so `stored` is null. It then asks matchMedia whether the device prefers dark mode. We chose a light-mode device, so `preferred` becomes `"light"`. `stored ?? preferred` therefore returns `"light"`.

`localStorage` is a browser-provided small key/value store. Reading it does not contact your backend or PostgreSQL.

**Same file: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:17), lines 17–19.**

This registers work to put the current theme on the document **after the browser render is committed**. Its inner line does not run as an immediate next statement inside the render. On the server, effects do not run.

The function also declares `toggle` in [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:24), lines 24–28. Declaring it prepares a function we can call later. Nobody has clicked the theme button, so it does not change theme or storage now.

**Same file: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:30), line 30.**

The hook returns an object with theme and toggle. In our example:

```text
theme = "light"
toggle = a function waiting to be called
```

**We now return to `page.tsx`, immediately after its `useTheme()` call.**

## 9. `LoginPage` sets up its other starting values

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:16), lines 16–21.**

Read these six lines one by one:

- `username` starts as `""`, an empty string. `setUsername` will update it later.
- `password` also starts as an empty string.
- `error` starts as null: no error to show.
- `loading` starts as false: no login submission is running.
- `focusedField` starts as null: neither input is marked focused.
- `checkingSession` starts as true: the page has not yet decided whether it should restore a saved login.

The square-bracket pair in each useState line gives you the remembered value and its update function. The initial values are not reapplied every time React renders again; that is why state can change.

**Our values now:**

```text
theme:           "light"
username:        ""
password:        ""
error:           null
loading:         false
focusedField:    null
checkingSession: true
```

Nothing has been entered or saved.

## 10. The page registers a saved-session check

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:23), lines 23–31.**

This is another useEffect. React records its callback for the browser's after-render stage. It does **not** call restoreSavedSession during this first render itself.

Its eventual job will be to ask: “Did this browser already have a login we can resume?” We will enter that callback at step 15. For now the render continues downward.

**Same file: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:33), lines 33–45.**

The page declares a function named handleSubmit. Its body will handle a submitted login form. Merely reaching this declaration does not run login or create a request. We have not clicked Sign in, so those statements wait for chapter 2.

**Where we are now:** React is still deciding the first screen. The session check is scheduled; the submit function is waiting.

## 11. The first render chooses the temporary message

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:47), lines 47–50.**

The two expressions calculate whether the labels should be raised:

```tsx
const usernameActive = focusedField === "username" || username !== "";
const passwordActive = focusedField === "password" || password !== "";
```

`===` compares values. `||` means “or.”

For username: null is not `"username"`, and username is empty, so both sides are false. usernameActive becomes false. passwordActive is also false.

The next line checks checkingSession. It is true, so the function immediately returns the temporary main element with **“Opening your workspace…”**.

This return ends this particular call to LoginPage. The longer return below it—the one containing the login form—is not evaluated in this call.

The placeholder's classes center its paragraph horizontally/vertically and make it at least screen-height. Inline style uses the background and text CSS variables. `role="status"` identifies the message as status information for assistive tools; it does not start a server process.

**First requested screen content:** a temporary message, not the form yet. It may be so brief you never notice it.

## 12. Next sends the prepared page to the browser

Next arranges the layout and returned page content into its response. For our path, the page part is presently the temporary message.

The browser receives HTML and framework data/scripts; it also requests the referenced JavaScript, CSS and font assets as needed. These resources may load in parallel, so there is not one reliable “CSS file finishes before every JavaScript file” order.

The response for a successful root page load normally has HTTP status 200. It is an **HTML page response**, unlike the JSON login response we will study in chapter 2.

**File: [next.config.ts](C:/Users/Kgodiso/source/repos/nedecen-web/next.config.ts:23), lines 23–31.**

The configured response headers apply to pages. Among them:

- X-Content-Type-Options asks browsers not to guess an unexpected content type.
- X-Frame-Options DENY prevents embedding this page in a frame.
- Referrer-Policy controls what referrer information is sent onward.
- Permissions-Policy disables camera/microphone/location capabilities here.

These settings were prepared by the frontend server configuration; they are not database queries or a call to the Express authentication router.

**Where we are now:** the browser has page content and is loading the assets that will style it and connect its behavior.

## 13. The browser applies the global styles

Remember the globals.css import from the layout? The browser receives processed CSS from that build pipeline. It does not execute this CSS as TypeScript functions.

**File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css:6), line 6.**

This includes Tailwind styling support. Tailwind translates class names used in your source into CSS rules during development/build. For example, `flex` and `items-center` are styling instructions, not React functions.

**File: [postcss.config.mjs](C:/Users/Kgodiso/source/repos/nedecen-web/postcss.config.mjs:5), lines 5–11.**

This configures the Tailwind PostCSS plugin that processes the styling. It is tool setup, not something the browser calls each time it draws a button.

**Back to globals.css: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css:260), lines 260–283.**

These rules define named colors such as:

```css
--color-background: #ffffff;
--color-text: #1a1a1a;
--color-accent: #8B0000;
```

A CSS variable is a named value other rules can use. `var(--color-background)` means “look up that value here.” It is not a lookup in PostgreSQL.

**Same file: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css:348), lines 348–366.**

- The universal `*` rule removes default margin/padding and selects border-box sizing. Border-box means a declared width includes padding/border rather than adding them outside that width.
- html/body get the font from the generated Geist variable, background/text colors, and a short color transition.
- Body can grow with content and is at least the dynamic viewport height.

Rules for other screens in this CSS file do not all alter the login page. A rule must match an element here. For example, old `.grades-glass` rules are not instructions to load grades now.

**What the browser can paint now:** the styled temporary status screen. Actual painting and asset loading may overlap; the visible result is what matters in this step.

## 14. Browser JavaScript connects React to the page

Next loads the browser code for the Client Component. React connects it to the initial document. This step is called **hydration**: the screen can now be managed by React and respond to handlers.

The browser's first LoginPage render follows the same function path we just walked: router → useTheme → state → registered effects → temporary return. The important difference is that browser-only things such as window/localStorage now exist.

For our chosen example, the starting theme remains light and checkingSession remains true. The form is still not the returned branch.

After this browser render is committed, the scheduled effects can run. We now follow those effects rather than jumping straight to the finished form.

## 15. The theme effect sets `data-theme="light"`

**File: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts:17), lines 17–19.**

Now its inner statement runs:

```tsx
document.documentElement.setAttribute("data-theme", theme);
```

- `document` is the browser's page document.
- `documentElement` is its outer html element.
- setAttribute adds/changes a named attribute.
- theme currently equals light.

The resulting HTML element has `data-theme="light"`. This does not require a new React render by itself; it directly changes a browser attribute that CSS can inspect.

globals.css also has a `[data-theme="dark"]` block. It does not match light, so the default light color variables stay in effect. On a dark-preference visit, those variables would differ; we are following the light path only here.

**Next:** the page's own saved-session effect runs.

## 16. Execution enters the page's saved-session callback

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:23), lines 23–31.**

We saw this code being registered earlier. Now the callback body actually starts:

- `let active = true` makes a local flag for this particular effect.
- `restoreSavedSession()` calls the helper imported from auth.ts.
- `.then(...)` attaches work to run when that helper finishes.
- `.catch(...)` attaches fallback work if it fails.
- The function returned at the end is cleanup. It will mark active=false if this effect is cleaned up; it does not set active false immediately after registration.

`void` before restoreSavedSession means this caller intentionally does not return/await its Promise. It does **not** cancel the helper. The result is still handled by then/catch.

**We leave page.tsx for auth.ts at this call.**

## 17. `restoreSavedSession()` asks which account is remembered

**File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:142), lines 142–144.**

The first statement calls getAccountType. We pause this function there and follow that call.

**Same file: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts:77), lines 77–80.**

- The function takes no arguments.
- If window is unavailable it returns null. We are in the browser now, so we continue.
- `localStorage.getItem("accountType")` asks the browser for that saved value.
- We assumed a fresh browser with no saved login, so the result is null.

The TypeScript `as ...` describes the expected type. It does not manufacture a saved value or prove a real account exists.

**We return to restoreSavedSession, immediately after `const account = getAccountType()`.**

Its local variable account is now null.

The next condition begins `if (!account ...)`. `!account` is true when there is no account value. That condition returns null immediately.

Because this is an async function, its caller receives a Promise that resolves to null. Think: “I have finished checking; there is no remembered account to resume.”

The later lines that read tokens, refresh a cookie session, decode claims or choose a resume path do not run on this path. No `/auth/refresh` request is sent.

**Where we are now:** the session helper has finished without contacting Express or PostgreSQL. Its result is going back to the waiting then callback in page.tsx.

## 18. The result returns to `page.tsx`

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:25), lines 25–29.**

The `.then(path => ...)` callback now receives:

```text
path = null
active = true
```

Follow the checks:

1. `if (!active) return` does not stop us, because active is true.
2. `if (path)` is false, because path is null. We do not call router.replace.
3. The else calls `setCheckingSession(false)`.

That is a state update. It tells React: **“The check is finished; calculate the screen again.”** It does not manually create an input or reload the browser page.

The catch branch is not used because the helper finished successfully. The cleanup is not a login operation and does not run just because then completed.

**Next:** React renders LoginPage again, this time with checkingSession false.

## 19. React re-enters `LoginPage()`

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:13), lines 13–31.**

React calls the component function again. It retrieves the remembered state rather than resetting everything to the initial values:

```text
theme:           "light"
username:        ""
password:        ""
error:           null
loading:         false
focusedField:    null
checkingSession: false  ← the value we just changed
```

The useTheme call again returns the current theme and toggle function. Its starting-value calculation is not a new theme reset on every render.

React sees the effects again, but unchanged dependencies do not request a new theme change or session check just because checkingSession changed. `[theme]` watches theme; `[router]` watches router identity. Development tools can perform extra checks/replays; that is not a separate sign-in request.

handleSubmit is again available as a handler, but its body still does not execute.

usernameActive and passwordActive are still false. **At the temporary-return condition, however, checkingSession is now false.** React continues past that line to the longer return below it.

This is the precise reason the form appears next.

## 20. This render describes the login page's outer panels

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:52), lines 52–87.**

The main element has data-auth-page, a screen-height class and background style. data-auth-page is a label for CSS selectors; it does not call a function.

On our desktop example:

- `lg:flex` lets the main area's children sit in a row.
- The left panel's `hidden lg:flex` means hidden by default, displayed as flex at the large breakpoint.
- `lg:w-[48%]` makes that panel 48% of the main width on large screens.
- `backgroundColor: "var(--color-primary)"` looks up #1a1a1a from globals.css. That makes it very dark.
- The inner flex column uses space-between to separate branding, message and footer vertically.
- The dot is a small round span with the accent color. The NEDECEN title is literal text here.
- The large heading is another element; its nested span uses the accent color for the second part. No database supplies the marketing sentence.

These JSX lines describe elements and styling. They are not each a separate network request. React later updates the real browser elements from this description.

**Same file: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:89), lines 89–111.**

The right side uses flex-1 to take the remaining width and a column layout to stack its topbar and form area. The topbar aligns the theme button to the right.

The button's label uses:

```tsx
{theme === "light" ? "Dark mode" : "Light mode"}
```

This is a choice expression: if the condition is true, use the first text; otherwise the second. Our theme is light, so it says **Dark mode**, the action the button would perform.

`onClick={toggle}` attaches a callback for later; it does not call toggle while rendering. We are not clicking it in this chapter.

## 21. React describes the form container and heading

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:107), lines 107–126.**

- The outer form-area div uses flex, items-center and justify-center to center its child within available room.
- Horizontal padding leaves space at the edges.
- The inner div has w-full and max-w-sm: it can fill available width but stops at a readable maximum width (normally 24rem for this Tailwind token).
- The sm-prefixed rules give the container padding, corners and shadow on medium-sized layouts; the lg-prefixed rules remove those decorations for the desktop composition.
- Background comes from color-card, white in this example.
- The small NEDECEN brand has lg:hidden, so it is hidden on our desktop. It serves the smaller layout where the left brand panel is absent.
- The h2 supplies “Sign in to your account”; the paragraph supplies the instruction below it.

Again, the wording comes directly from JSX, not an API response.

## 22. The error box is considered, but not included

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:128), lines 128–137.**

The expression begins `{error && (...)}`.

That means: include the box if error has a value worth showing. Our error is null, so React includes no error box.

Its styles and warning symbol are present in the source, but they are not visible simply because the code exists. A future failed login must first set error.

**Next:** React describes the empty form inputs.

## 23. React describes the form and the Username field

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:140), lines 140–150.**

The form attaches handleSubmit as its future submit callback. `flex flex-col` stacks its children. gap uses --field-gap from CSS.

**File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css:307), lines 307–315.**

The current values include control-height 50px, horizontal input padding 1.5rem, field gap 1.10rem. At a normal16px base size, 1.10rem is 17.6px. The nearby comment saying 28px does not match that value; the browser obeys the actual value, not the comment.

**Back to page.tsx: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:153), lines 153–167.**

- id=username lets its label refer to this input.
- type=text permits ordinary visible text.
- autoComplete=username hints to the browser/password manager what this field is.
- value=username is currently an empty string.
- onChange stores future typed text using setUsername. Nobody has typed, so it has not run.
- onFocus will set focusedField to username; onBlur will clear it. Neither is called by merely declaring these handlers.
- required asks the browser to require a value when submitting. It is not performing a database validation now.
- w-full/h-full fill the surrounding field box, which has a 50px height.
- Because usernameActive is false, the chosen input padding is `0 var(--control-px)`, not the raised-label version with 14px at the top.

The surrounding box's style chooses a 1.5px border from color-border because focusedField is not username. It stays the ordinary gray border in our example.

**Same file: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:168), lines 168–186.**

The label is positioned within the surrounding relative box:

- htmlFor=username connects it to that input ID.
- absolute allows precise placement inside the surrounding box.
- left uses the same input padding, so the label starts where typed text would start.
- Because usernameActive is false, top is50% and transform is translateY(-50%). Together these center the label vertically.
- fontSize is 0.875rem (normally 14px).
- Color is muted because the field is not focused.
- pointer-events-none stops this overlaid label intercepting pointer clicks intended for the input.
- transition describes a short movement/color change for a later focus/typing event. No animation needs to happen now.

The visible word is Username. It is a separate label over an empty input, not a prefilled username value.

## 24. React describes the Password field

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:189), lines 189–234.**

It follows the same structure as Username, using its own password state and matching IDs:

- The surrounding box has 50px height and an ordinary gray border.
- id=password matches htmlFor=password.
- type=password means the browser masks entered characters. There are no characters yet.
- autoComplete=current-password tells a password manager this is a sign-in password.
- value=password is empty.
- onChange/onFocus/onBlur wait for later input events.
- required applies at submission.
- passwordActive is false, so input padding stays level and its label stays vertically centered.

No hashing takes place in this step. Hash comparison only happens after a later request carrying submitted credentials reaches the backend.

## 25. React describes Sign in and the remaining text/buttons

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:236), lines 236–248.**

- type=submit connects the button to form submission.
- disabled=loading currently evaluates to false, so it is enabled. Required inputs can still block an empty native form submission.
- w-full makes it as wide as its container.
- Its height comes from the same 50px control variable as the inputs.
- Background uses color-accent, #8B0000, so it is dark red.
- Text uses color-btn-primary-text, white.
- The text choice uses loading=false, so it shows Sign in, not Signing in...

The app has not called handleSubmit just because the submit button now exists.

**Same file: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:252), lines 252–290.**

The remaining description contains:

- The contact-your-administrator hint, centered and muted.
- A row with First time here? between two thin divider divs. Each line has h-px and border-color background. They are tiny colored rectangles, not typed dash characters.
- Two outline buttons for claiming accounts. Each has a handler that would navigate to a corresponding onboarding route if clicked.

Those onClick functions are waiting. You have not started claiming an account and have not left `/`.

**Next:** React has the complete new description and updates the browser's visible content.

## 26. The browser now shows the finished login screen

React updates the page to match the longer returned description. The temporary message is replaced by the panels/form. The surrounding root document remains in place.

The browser computes sizes, matching CSS and positions, then paints them. CSS determines appearance; React supplies elements and current values. This is why changing username state later can change label placement without requesting a whole new HTML page.

On our chosen desktop/light example, you now see:

- A dark promotional panel on the left.
- The login area on the right.
- Dark mode button near the top right.
- Empty Username and Password fields.
- Dark-red Sign in button.
- Hint, divider and account-claim buttons below it.

Browser autofill/password-manager behavior can fill/focus controls outside this particular example. It is browser behavior layered on the page, not evidence that the app queried a password from PostgreSQL.

## 27. If you opened the same address on a phone

The route/function/session-check journey remains the same. The important difference for **this login screen** is CSS, not the bookshelf's ResponsiveLibrary component. That component is not mounted here.

**File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx:61), lines 61–62.**

Below Tailwind's large breakpoint (normally 1024px), lg:flex does not apply, so hidden keeps the left promotional panel absent. The right area fills available width instead of sitting beside it. The smaller brand appears because lg:hidden does not apply yet.

Tailwind's sm prefix normally begins at 640px. It changes padding/background/card styling for intermediate widths. These are stylesheet media conditions, not a JavaScript question asking for your phone model.

**File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css:380), lines 380–386.**

At width 600px or below:

- data-auth-page gets control-height 50px and field-gap 20px.
- Inputs use 16px text.
- Buttons have at least 44px height.
- The heading gets line-height 1.3.

Those rules match the data-auth-page attribute we saw on the main element. A tablet browser may use an intermediate card layout or the large layout depending on its available width. The initial login page does not use the later library's phone/portrait/desktop JavaScript mode detection.

## 28. Stop here: no sign-in has happened

At this point:

```text
Browser URL:      http://localhost:3001/
Visible screen:   Login form
Username value:  ""
Password value:  ""
checkingSession: false
loading:         false
error:           null
```

For the fresh-visit path we followed:

- The browser requested the frontend page and its assets.
- No login payload was sent.
- No Express login/refresh handler ran.
- No Drizzle query or PostgreSQL operation was needed.
- The principal's books have not loaded. The app does not know that this visitor is a principal yet.

The next real event would be clicking or typing into a field. Chapter2 can begin exactly there: the first username character, its onChange callback, the label movement, the password, and then Sign in—followed all the way through the backend/database and back.

---

**About the sequence:** this chapter follows the application's source-level control flow for one fresh visit. It does not claim an observed millisecond-by-millisecond browser trace. Next/React can stream work, reuse prepared modules and repeat development checks; assets can load together. Function declarations and scheduled callbacks have deliberately been distinguished from the moment their bodies actually run. No source code or school data was changed to write this chapter.
