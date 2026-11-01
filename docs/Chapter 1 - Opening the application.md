# Chapter 1 - Opening the application

**Task starts:** You enter the application's root URL in the browser and press Enter.

**Task ends:** The sign-in form is visible, styled, and ready for you to click the username field.

We follow a **fresh visit with no remembered account**. You intend to sign in as a principal, but the application cannot know that yet. This public page is shared.

We assume the frontend server is already running, the address reaches it, JavaScript is enabled, and browser storage is available. Saved-password autofill, extensions, or an existing service worker can introduce additional behaviour.

This is a source-code walkthrough of the checked-out application on 29 October 2026, not a recording of a running browser. Line references describe this version. Framework behaviour was checked against the Next.js documentation installed in the repository. No application code was changed to create this chapter.

Read in sequence. You do not need to memorise the vocabulary: each term appears alongside the work it does.

## 1. Before Enter: what must already exist?

Your browser cannot directly open this application's TypeScript files and run them as a website. Tools must prepare the files, and a server must answer requests.

(File: [package.json](C:/Users/Kgodiso/source/repos/nedecen-web/package.json), lines 5 - 10)

The project defines these commands:

~~~json
"dev": "next dev",
"build": "next build",
"start": "next start",
"lint": "eslint"
~~~

This file is **JSON**, a text format representing data using objects, arrays, strings, numbers, booleans, and null. Here, "scripts" is an object containing command names and command strings. Double quotes are part of JSON syntax.

When someone runs "npm run dev", **npm**, a tool installed with Node.js, looks up "dev" and starts Next.js's development server.

**Node.js** runs JavaScript outside a browser. Here it provides the environment for the server and development tools. It does not draw the page on your monitor.

**A server is a program that listens for requests and sends responses.** Its computer is also often called a server. Your browser is the client: it asks for something.

**Next.js** organises the application's routes, prepares code and assets, and serves the website. Development mode prepares routes as needed and watches for edits. For production, "npm run build" prepares an optimised application; "npm run start" serves the built result.

These actions occur before, or independently of, your visit. Pressing Enter does not run "npm run dev".

### The server's configuration is prepared

(File: [next.config.ts](C:/Users/Kgodiso/source/repos/nedecen-web/next.config.ts), lines 6 - 19)

"import type { NextConfig }" imports a TypeScript type for checking configuration. Types describe permitted values and object shapes. This import disappears when executable JavaScript is produced.

"require('next-pwa')" loads a package. The parentheses immediately following it call the loaded function with a configuration object. Its result, a wrapper function, is stored in "withPWA".

"const" creates a binding that cannot be reassigned. It does not make every property inside an object immutable.

**PWA** means Progressive Web App. A **service worker** is a browser-managed script that can intercept requests and use caches. This integration is disabled in development by:

~~~ts
disable: process.env.NODE_ENV === "development"
~~~

"process.env" exposes environment settings to server/build code. "===" compares without JavaScript's automatic type conversion. The comparison produces a boolean.

The configured runtime cache pattern targets paths containing "/_next/static/". "CacheFirst" asks an active worker to try cached assets first. A production worker may also have generated precache entries. This configuration does not establish that a worker is installed in your browser. Our fresh development visit assumes there is none.

(File: [next.config.ts](C:/Users/Kgodiso/source/repos/nedecen-web/next.config.ts), lines 21 - 33)

"const nextConfig: NextConfig" declares a value with a type annotation. The annotation helps check code; it is not a runtime C#-style type check.

The "headers" method returns response-header configuration. Its "async" keyword means it returns a **Promise**, an object representing a result that will become available or fail asynchronously.

The "/:path*" pattern applies the listed headers across routes:

| Header | Instruction to the browser |
| --- | --- |
| X-Content-Type-Options: nosniff | Avoid guessing a resource's type instead of using its declared type. |
| X-Frame-Options: DENY | Do not display this page inside a frame. |
| Referrer-Policy: strict-origin-when-cross-origin | Restrict the referring URL information sent to other origins. |
| Permissions-Policy | Disable the listed camera, microphone, and geolocation capabilities for this document. |

"turbopack: {}" supplies an empty options object for Next.js's Turbopack build tooling. "module.exports = withPWA(nextConfig)" passes the configuration through the wrapper and exports the result for Next.js.

Configuration loading does not occur again for every click.

### Tools prepare the styles and font

(File: [src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx), lines 6 - 14)

The layout imports a metadata type, the "Geist" font helper, and two stylesheets:

~~~ts
import "./globals.css";
import "./motion.css";
~~~

An **import** makes another module's exported values available, or requests its effects. A module is a file treated as a unit of code. Importing a function is not the same as calling it.

"./" means relative to the current file's directory. These two imports tell the tooling that the layout needs these CSS files.

**CSS** describes appearance: colours, sizes, spacing, positioning, and other visual rules.

The font configuration is:

~~~ts
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});
~~~

We call "Geist", imported from "next/font/google", with an object containing two properties:

- "variable" names a CSS custom property through which we will use the font.
- "subsets" is an array requesting the Latin character subset for preloading.

The helper's result provides values such as "geistSans.variable", a generated CSS class name.

**Next.js processes this font call while preparing the application.** It downloads the necessary font resources during preparation and serves generated font assets with the app. The visiting browser does not contact Google Fonts merely because this import contains "google". It also does not run this TypeScript font helper on each render.

The selected font is **Geist**. Later we will see how the browser's CSS actually applies it.

(File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css), lines 1 - 6)

"@import 'tailwindcss'" includes **Tailwind CSS** in the styling pipeline. Tailwind supplies small reusable classes such as "flex" and "text-sm".

(File: [postcss.config.mjs](C:/Users/Kgodiso/source/repos/nedecen-web/postcss.config.mjs), lines 5 - 11)

This exports an object enabling "@tailwindcss/postcss". **PostCSS** processes CSS; its Tailwind plugin generates styling rules for utility classes used in the source.

The browser receives CSS. It does not run Tailwind each time it draws a control.

These preparations can happen at startup, at production build time, or on demand during development. They are not actions performed by the visiting user.

## 2. You enter the address and press Enter

Imagine this example:

~~~text
http://localhost:3001/
~~~

This is an illustration, not a claim that your frontend currently runs on port 3001. Use the frontend address printed by your server.

| Part | Meaning |
| --- | --- |
| http | Use HTTP, the web's request/response protocol. |
| localhost | Contact this same computer. |
| 3001 | Contact the program listening on this port. |
| / | Ask for the root route. |

A **port** is a numbered network endpoint that helps direct traffic to the intended program. It is not a file or folder. Several servers can run on one computer by listening on different ports.

For a public address such as "https://example.com/", the browser normally resolves the hostname to a network address using **DNS**, unless the answer is cached. Localhost uses a local loopback address. HTTPS adds an encrypted connection and certificate checks. HTTP's default port is 80 and HTTPS's is 443 when omitted.

The browser establishes or reuses a connection and sends a request. Simplified, its meaning is:

~~~http
GET / HTTP/1.1
Host: localhost:3001
~~~

This is a teaching example, not a captured packet. Newer HTTP versions encode the same basic information differently.

"GET" means retrieve a resource. "/" identifies the requested path. **Headers**, such as Host, carry additional information. Cookies already stored for that destination may also accompany a request.

No application component has handled a mouse click. The browser's own networking code performs this navigation. Our repository does not contain a custom function for DNS resolution or establishing that connection.

This request asks the frontend for a page. It is not a username/password check.

## 3. Next.js identifies the route and loads its dependencies

Next.js's **App Router** maps folders and specially named files to URL paths.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 1 - 13)

This file represents "/". Its default export supplies the route component:

~~~ts
export default function LoginPage() {
~~~

"function LoginPage()" declares a named function without parameters. "export" makes it available outside the module; "default" designates the module's default export.

A **React component** is a function returning a description of UI. React is the library that evaluates those descriptions and manages updates. Next.js arranges for React to render this component. We do not manually call it from a main method.

".tsx" permits TypeScript with **JSX**, the tag-shaped syntax we will shortly encounter. ".ts" files contain TypeScript without JSX.

The first line is:

~~~ts
"use client";
~~~

This marks a client-component boundary because the page needs state, effects, and browser events. Its executable dependencies are prepared as part of the browser code.

It **does not mean the server can never render this component**. On an initial full visit, Next.js can produce initial HTML for client components too.

Lines 3–7 are a comment: useful to people, not executed.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 8 - 11)

Named imports inside braces make these available:

- React's "useEffect" and "useState".
- Next.js's "useRouter".
- Our authentication helpers.
- Our "useTheme" hook.

"@/" is this project's alias for the "src" directory. It is not an internet address.

Next.js follows imports to prepare the dependency graph: modules needed by this page, including their dependencies. When executable modules are evaluated, their top-level statements run. Function bodies wait until called.

Modules are normally reused once loaded within an environment. React rendering a component again does not mean reinitialising all imported modules.

### The imported API module performs local setup

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 6 - 23)

The authentication helper depends on this API module. At module evaluation, it computes:

~~~ts
export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
~~~

A **base URL** is the common beginning of API addresses. "??" selects the right operand only if the left operand is null or undefined. An empty string would not use the fallback.

Next.js inserts the public environment setting into browser code during its preparation. This address can differ from the address serving the frontend page. Computing it does not send a request.

The module initialises "refreshPromise" and "accessToken" to null and "sessionGeneration" to 0. "let" permits reassignment. A type such as "string | null" means either a string or null; "|" expresses a TypeScript union.

The guard checks whether window exists. **window** is the browser's global object, absent in ordinary server execution. Using "typeof window" safely checks that absence.

On the server, the listener block is skipped. In the browser, "window.addEventListener('storage', ...)" registers a callback for relevant local-storage changes from another same-origin document.

Registering a callback does not run it. On our quiet fresh visit, that callback's reload body does not execute.

(File: [src/lib/api.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/api.ts), lines 218 - 233)

The module also constructs an exported "api" object with put, post, get, patch, delete, and upload function properties. These are callable helpers; creating the object does not call them. None sends a request on our fresh-visit path.

(File: [src/lib/libraryMemory.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/libraryMemory.ts), lines 3 - 9)

Another dependency initialises a "books" object mapping role names to allowed book-name arrays.

"Record<LibraryRole, readonly string[]>" describes an object whose role keys map to read-only string arrays. Types disappear from executable JavaScript; the object value remains.

This initialisation does not open a principal book, query a database, or call the module's navigation-memory functions.

## 4. Next.js prepares the outer document

(File: [src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx), lines 16 - 20)

The layout module exports "metadata", an object checked against the Metadata type.

It specifies the title NEDECEN, a description, and "/manifest.json". Next.js uses this to produce document metadata. The title appears in browser UI such as a tab, not as a paragraph inside the form.

The **manifest** is a JSON resource describing installation-related app information. Linking it does not install the app.

(File: [src/app/layout.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/layout.tsx), lines 22 - 36)

The root layout receives an object and extracts its children property:

~~~tsx
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
~~~

This is **object destructuring** in a function parameter. Instead of accepting "props" and writing "props.children", we take children directly.

The annotation after ":" describes the object's shape. "React.ReactNode" means a renderable value: an element, text, or other supported content. It is not a DOM object created with "new".

Next.js supplies the route content as children. The JSX returned by this layout describes:

- html, the outer document element, with English as its language.
- A class for the generated font variable plus the "h-full" class.
- A head with theme colour "#1a1a1a" and an Apple touch-icon link.
- A body containing the route's output.

JSX braces enter a JavaScript expression. The backtick-delimited string in className is a **template literal**: it combines the value of geistSans.variable with the text "h-full".

React's className becomes the HTML class attribute. The dot in "geistSans.variable" accesses a property, just as property access in C# does.

"min-h-dvh flex flex-col" gives the body a minimum dynamic viewport height and a flexbox column layout. Dynamic viewport units account for changing visible browser space, useful when mobile browser bars expand or collapse.

"{children}" places the route output inside body.

This is logical composition, not a guarantee that all rendering occurs once in a rigid parent-then-child clock order. React and Next.js may prepare, cache, stream, or repeat work.

### Some output can have been prepared before the visit

A production route like this can have HTML prerendered during the build and served later. In development, work can happen on demand.

Therefore, pressing Enter does not necessarily re-execute every source line on the server. The next sections explain how initial output is produced, whether during preparation or while serving the request.

## 5. React evaluates the page's initial state

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 13 - 15)

The function begins:

~~~ts
const router = useRouter();
const { theme, toggle } = useTheme();
~~~

A **hook** lets a component or another hook use React-managed capabilities. Hooks must be called consistently at the top level so React associates their state with the correct component.

"useRouter()" obtains Next.js navigation methods. Storing the router does not navigate.

The next statement calls our custom hook, then extracts theme and toggle from its returned object. Follow that call before continuing down the page.

### Inside the theme hook during server preparation

(File: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts), lines 5 - 15)

The hook calls:

~~~ts
const [theme, setTheme] = useState<"light" | "dark">(() => {
~~~

"useState" returns a pair: a value remembered by React and a function that requests changes to it. Array destructuring names them theme and setTheme.

The angle-bracket type permits only the specific strings "light" and "dark". It is more restrictive than any string.

The arrow function "() => { ... }" is a **lazy initialiser**. React calls it to get initial state when mounting, rather than re-running the preference lookup on every later render.

During server preparation, line 9 detects that window is absent and returns "light". The localStorage and matchMedia statements below do not execute in that environment.

(File: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts), lines 17 - 30)

"useEffect" registers work for after a browser commit. **Effects do not run during server rendering.** The function body containing document.documentElement is not executed on the server.

"[theme]" is the **dependency array**. React uses it to determine whether the effect should run again after later changes.

The toggle function is declared but not called: there has been no theme-button click.

"return { theme, toggle }" returns an object using property shorthand: named properties hold the corresponding value and function.

Control returns to the page.

### Remaining page state is established

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 16 - 21)

Each hook call establishes a separate state value:

| State | Initial value | Setter | Meaning |
| --- | --- | --- | --- |
| username | "" | setUsername | Entered username, initially empty. |
| password | "" | setPassword | Entered password, initially empty. |
| error | null | setError | No error message yet. |
| loading | false | setLoading | No submission in progress. |
| focusedField | null | setFocusedField | No focused field. |
| checkingSession | true | setCheckingSession | Initial session check still pending. |

null explicitly means no value; it differs from an empty string and from false. "useState<string | null>(null)" permits a message string or null.

React owns this state storage. On another render, it supplies current state rather than forgetting everything like ordinary local variables from a completed function call.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 23 - 31)

The page registers a session-restoration effect. Its body waits for the browser; it does not run on the server.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 33 - 45)

Execution encounters a declaration of handleSubmit. **Declaring the function does not execute its body.** No login request is made. Chapter 2 will enter this body when the form is submitted.

Reading down the file does not mean executing every nested function as you pass it.

### The initial output is the opening message

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 47 - 50)

Two expressions calculate whether the labels should be raised:

~~~ts
const usernameActive = focusedField === "username" || username !== "";
const passwordActive = focusedField === "password" || password !== "";
~~~

"||" means logical OR. "!==" means not strictly equal. Both expressions produce false: neither field has focus or content.

"if (checkingSession)" is true. The function returns the short main element displaying:

~~~text
Opening your workspace…
~~~

A return exits the function. **The longer JSX beginning at line 52 is not evaluated on this render.** No username input or sign-in button is returned yet.

The main tag marks primary page content. The p tag is a paragraph; "role='status'" identifies status information for assistive technology.

Its utility classes mean:

- min-h-screen: at least viewport height.
- flex: arrange children using flexbox.
- items-center: centre on the flex cross axis.
- justify-center: centre on the flex main axis.

Together they centre this message in the viewport.

"style={{ ... }}" uses outer braces for a JavaScript expression and inner braces for an object. Properties such as backgroundColor and color supply inline styles. Strings such as "var(--color-background)" ask CSS to resolve custom properties.

JSX describes UI. React and Next.js convert that description into output; you are not drawing characters pixel by pixel.

## 6. The response reaches the browser

The frontend sends the document in an HTTP response, normally with a success status, HTML content type, and applicable configured headers.

**HTML** describes document structure. The browser parses it into the **DOM**, a tree of objects representing html, body, main, p, and other elements.

Next.js also provides **React Server Component data**, the RSC payload, and references to JavaScript and CSS assets. The payload helps React reconcile the server-prepared and client component trees. It is framework data, not a login result.

As it discovers asset references, the browser requests CSS, JavaScript, and fonts unless suitable copies are cached. Downloads can overlap. Streaming can expose parts of the document before the entire response finishes.

A browser may request the favicon, manifest, and icons according to its own behaviour. The layout supplied the manifest and Apple icon references, and Next.js recognises the project's favicon file by convention. Their exact download order is not the execution order of our source lines.

### CSS begins determining appearance

(File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css), lines 260 - 299)

":root" selects the document root. Names beginning with "--" declare **CSS custom properties**. These are inherited styling values, separate from TypeScript variables.

For example:

~~~css
--color-background: #ffffff;
--color-text: #1a1a1a;
--color-accent: #8B0000;
~~~

These hexadecimal values encode red, green, and blue components. White is #ffffff; #8B0000 is dark red.

The opening message's "var(--color-background)" resolves from applicable rules. Before the browser applies a theme attribute, the root's default palette is light.

(File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css), lines 348 - 367)

"@layer base" places these rules in the base cascade layer. CSS layers help resolve precedence.

"*" matches all elements. The rule resets margin and padding. "box-sizing: border-box" makes declared dimensions include padding and border, subject to overriding rules.

The selector list html, body applies shared styling to both.

This is where the font is used:

~~~css
font-family: var(--font-geist-sans), sans-serif;
~~~

The generated class on html defines the custom property. This rule consumes it. Text generally inherits its font from ancestors; Tailwind's base form-control rules also inherit font styling.

**Geist is the configured font**, with fallback faces available while it loads or if unavailable. "sans-serif" is a generic fallback category, not one specific font file.

To change the global font, the connected places are the layout's font selection and this rule. Keeping the custom-property name can preserve that connection; changing its name requires changing both ends. We are identifying the edit locations, not changing the application.

These rules also set background and text colours and a 0.2-second transition when those properties change. Body can grow beyond a single viewport as content requires.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 1 - 5)

The motion stylesheet defines an easing property and base transitions for buttons, links, inputs, selects, and textareas. Transitions tell the browser how to interpolate a visual property when it changes.

No controls are present in the opening-message output yet. Importing this stylesheet does not start all its animations.

(File: [src/app/motion.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/motion.css), lines 43 - 45)

A media query detects a user preference for reduced motion. If it matches, these rules disable animations and transitions with "!important", a stronger-precedence declaration marker.

A **media query** applies styling conditionally based on features of the viewing environment.

### How this becomes pixels

The browser combines DOM structure and styles, calculates layout, paints content, and composites layers for display. These are browser-engine operations.

It may show the opening message before the page's JavaScript is ready. HTML arriving, pixels appearing, and interactivity being ready are separate milestones.

Unlike a typical SFML program, our code does not contain a loop clearing the screen and redrawing controls. The browser manages its rendering and event machinery. React will ask it to make particular document changes.

## 7. React hydrates the page in the browser

The browser runs JavaScript generated from our TypeScript and JSX. Type annotations are removed; JSX is transformed into JavaScript calls.

**Hydration** is React connecting the component tree, state, and event logic to the server-prepared document. It reconciles that output with the client component tree.

The root layout remains a Server Component: its source function is not now rerun as a browser component. The login page is a Client Component and participates in hydration.

Client modules are evaluated in this browser environment. The API module performs its local setup again in this separate environment; window now exists, so its storage listener can be registered. Still no API request.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 13 - 21)

React evaluates the login component in the browser. It obtains the router, calls useTheme, and establishes empty credentials, no error, no focus, and checkingSession true.

Server and browser execution are separate. A JavaScript state object in server memory is not shared directly with browser memory across the network.

### The theme initialiser can now inspect the browser

(File: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts), lines 8 - 15)

The window guard is now false, so execution reaches:

~~~ts
const stored = localStorage.getItem("theme") as "light" | "dark" | null;
~~~

**localStorage** is persistent, per-origin, browser-managed string storage. An **origin** is the combination of scheme, hostname, and port. A setting at one port is not automatically available at another.

"getItem" returns a string or null. The "as" expression tells TypeScript the value we expect; it does not validate stored text at runtime.

"window.matchMedia('(prefers-color-scheme: dark)').matches" asks whether the browser's environment prefers dark colours. matches is a boolean.

The conditional expression chooses dark or light:

~~~ts
condition ? valueIfTrue : valueIfFalse
~~~

This operator resembles C#'s conditional operator.

"return stored ?? preferred" uses the stored value when present, otherwise the system preference. A browser without account metadata could still have a saved theme. A completely fresh origin uses the system preference.

The opening-message markup itself has no theme-dependent label. The preference will be applied through an effect after commit.

### Initial browser rendering still returns the opening message

The page registers its effects, declares handleSubmit without calling it, calculates the two false field-active flags, and reaches the same checkingSession early return.

React connects this output to the server-prepared document. It has not yet returned the form.

## 8. After commit, the effects run

A **commit** is when React applies its prepared result to the document. Effects run after commit; the exact relationship to a visible paint can vary. The theme effect is registered through the earlier hook call before the page's session effect.

(File: [src/hooks/useTheme.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/hooks/useTheme.ts), lines 17 - 19)

The effect body now executes:

~~~ts
document.documentElement.setAttribute("data-theme", theme);
~~~

document is the browser object representing this document. documentElement refers to html. setAttribute changes an attribute on that element.

If theme is dark, html now carries "data-theme='dark'". This changes the DOM and affects which CSS rules match.

(File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css), lines 323 - 346)

"[data-theme='dark']" is an attribute selector. It matches the element marked by that effect and overrides selected custom properties.

The background becomes #1b1b1b, text becomes #ffffff, and the other listed values change. Descendants using these variables pick up the results.

The browser's CSS engine resolves these rules. Our JavaScript does not loop through every button and recolour it individually.

The effect does not save theme to localStorage; the uncalled toggle function does that when a user changes the preference.

A light-to-dark startup change can be visible because server output starts with default light styling and the browser applies preference afterwards.

### The page begins the saved-session check

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 23 - 31)

The callback passed to useEffect executes:

~~~ts
let active = true;
~~~

Then it calls restoreSavedSession and attaches then and catch callbacks to its Promise.

A **callback** is a function passed for another piece of code to call later. "path => { ... }" is an arrow function receiving one argument.

"void" before the expression discards its result. It does not cancel the function call, wait for it synchronously, or prevent callbacks from running.

The callback inside then is registered now; we first enter restoreSavedSession.

The effect also returns:

~~~ts
return () => { active = false; };
~~~

This is a **cleanup function**. React can call it when cleaning up the effect, such as when removing the component. It marks that particular effect invocation inactive so a later completion will not update an obsolete page. It does not cancel a network request.

## 9. The check finds no remembered account

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 142 - 144)

We enter:

~~~ts
export async function restoreSavedSession(): Promise<string | null> {
  const account = getAccountType();
  if (!account || !["person", "learner", "manager"].includes(account)) return null;
~~~

The return type says the eventual result is a path string or null. A path would mean there is somewhere to resume; null means there is no resumable destination.

"async" functions return Promises even when an early path returns without awaiting anything.

Execution calls getAccountType before continuing to the if statement.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 77 - 80)

The window guard confirms browser execution. "localStorage.getItem('accountType')" finds no account metadata in our fresh visit and returns null.

The type assertion expresses the expected account categories; it does not enforce their validity at runtime.

Control returns to restoreSavedSession with account equal to null.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 142 - 144)

"!account" is true. "!" is logical NOT, and null is a **falsy** value: it acts as false in a condition.

JavaScript's OR short-circuits. Because its first operand is true, the includes call in the second operand is unnecessary and does not run.

The function returns null immediately, giving its caller a Promise fulfilled with null.

**Lines 145 onward do not run on this path.** There is no token decoding, session-renewal request, authentication backend execution, or database query.

The frontend server was contacted to retrieve the page. The separate authentication API was not contacted by this check.

Even if a refresh cookie existed without account metadata, this function would still return at the first guard. Metadata is checked before any renewal request.

### The Promise callback resumes

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 25 - 29)

The then callback receives null as path. Promise callbacks are scheduled as **microtasks**; they run after the current JavaScript stack yields, not in the middle of restoreSavedSession's return statement.

active is still true, so "if (!active) return" does not exit.

path is null, so "if (path)" is false and router.replace is not called.

The else branch calls:

~~~ts
setCheckingSession(false);
~~~

The setter asks React to update remembered state and render again. It does not resume the old render below its return. **React evaluates the component again using the new state.**

The catch callback would handle a rejected Promise or an error thrown in the preceding callback. It does not execute on this successful no-account check.

## 10. React renders again, producing the form

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 13 - 31)

React evaluates the component again with:

- Empty username and password.
- error and focusedField still null.
- loading still false.
- checkingSession now false.
- The current browser-selected theme.

"useState(true)" in the source does not reset checkingSession on this render. That argument provides initial state for mounting, not an assignment each time.

The lazy theme initialiser does not need to run again. With unchanged theme and router dependencies, the corresponding effects do not restart just because checkingSession changed.

The component again encounters handler declarations. Their bodies still do not run.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 47 - 57)

Both field-active flags are false. This time the checkingSession condition is false, so execution reaches the longer JSX return.

We now follow the JSX in source order while it constructs a UI description. This does not imply the browser paints one element at a time in that order.

### The outer main element

data-auth-page marks this area for matching CSS rules. It does not create an event handler.

min-h-screen gives minimum viewport height. lg:flex enables flexbox layout at Tailwind's large breakpoint. The background reads the current colour variable.

Responsive prefixes such as sm: and lg: are CSS conditions. In this project's uncustomised Tailwind theme, sm begins at 40rem and lg at 64rem, normally 640px and 1024px. These are width thresholds, not tests of device brand.

### The left introduction panel

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 59 - 87)

The panel uses:

~~~text
hidden lg:flex lg:flex-col lg:w-[48%] min-h-screen
~~~

hidden removes it from layout by default. At lg, it becomes a flex container, stacks its children in a column, and takes 48% width. Square brackets permit an explicit value in a Tailwind class.

Its background uses --color-primary.

The inner container uses flex-1 for available flex space, justify-between to separate its groups, and p-12 for padding: normally 3rem or 48px.

The brand row contains a small span and NEDECEN. A span groups inline content. The w-3 and h-3 classes give the dot equal dimensions, and rounded-full makes it circular. Its colour comes from --color-accent. This dot is CSS geometry; it is not a downloaded image.

The h1 supplies the main heading. text-5xl, font-bold, text-white, leading-tight, and mb-4 set size, weight, colour, line spacing, and bottom margin.

The inner span gives part of the heading the accent colour. The JSX expression containing a space string inserts a literal space between text segments.

The explanatory paragraph uses smaller text and relaxed line spacing. rgba(255,255,255,0.5) means white with 50% opacity. The bottom paragraph supplies the South African secondary schools / CAPS text with increased letter spacing.

The JSX comments beginning with "{/*" are developer notes, not visible text.

### The right panel and theme button

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 89 - 105)

The right panel takes the remaining flex space and stacks its children vertically. Its responsive background classes use the background variable by default, the canvas variable at sm, and the background variable again at lg.

This happens through CSS without a custom JavaScript resize loop.

The top bar uses justify-end to place the button at the end of the row. p-4, sm:p-6, and lg:p-8 increase padding at wider breakpoints.

The button gets surface, text, and border colours from variables. Its classes set small semibold text, horizontal and vertical padding, pill-shaped corners, and transitions.

"onClick={toggle}" passes the function reference to React. It does not call toggle while rendering.

The conditional label reads "Dark mode" if theme is light; otherwise "Light mode". It describes the action available.

### Form container, smaller-screen brand, and heading

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 107 - 126)

The form area uses flexbox centring, horizontal padding, and bottom padding.

w-full max-w-sm lets the inner container take the available width up to a maximum of 24rem, normally 384px.

At sm, rounding, a shadow, and padding create a card. At lg, the explicit lg classes remove that shadow, rounding, and padding. Its background uses --color-card.

This region's brand row has lg:hidden. It shows on smaller screens while the left panel is hidden; wide screens instead show the left panel's branding.

The h2 displays "Sign in to your account". The paragraph below asks for a username and password. The classes and inline styles set their text size, weight where applicable, margins, and colours.

### The error box is absent

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 128 - 137)

"error && (...)" uses logical AND. If error held a message, the following element could be rendered. Right now error is null, so no error box is included.

The nested error-box JSX is not evaluated. The normal initial form has no warning icon.

### The form and spacing

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 139 - 140)

form is a native HTML form. "onSubmit={handleSubmit}" supplies a callback for a later submission event. It does not execute the callback.

flex flex-col stacks its controls. The inline gap reads --field-gap.

(File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css), lines 301 - 320)

These shared custom properties provide dimensions and spacing. The form consumes --field-gap, and controls consume --control-height and --control-px.

px means CSS pixels, logical units that need not correspond one-to-one with physical screen pixels. rem is relative to the root font size. At the usual 16px root size, 1.5rem is 24px.

**The field-gap declaration is 1.10rem**, normally 17.6px. Its comment says 28px, but the browser uses the value, not the comment.

A declared custom property matters only where a rule uses it. These login wrappers use rounded-lg rather than --control-radius, so changing that unused radius property would not change their corners.

### The username wrapper and input

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 142 - 167)

relative gives the overlaid, absolutely positioned label a containing block. rounded-lg rounds the wrapper's corners.

The height uses --control-height, normally 50px. Its border expression builds a string with a width of 1.5px, solid style, and a conditional colour.

The template literal's inserted conditional compares focusedField with "username". No field is focused, so it selects --color-border instead of --color-focus.

The wrapper uses the card background and a 0.15-second border-colour transition with ease timing.

The native input's properties are:

| Property | Meaning at this moment |
| --- | --- |
| id="username" | Gives the element an identifier for its label. |
| type="text" | Creates a normal text-entry control. |
| autoComplete="username" | Identifies it to browser autofill; it does not fetch a username from our server. |
| value={username} | Displays the current state value, an empty string. |
| onChange | Supplies a callback for later editing. |
| onFocus | Supplies a callback for later focus. |
| onBlur | Supplies a callback for later loss of focus. |
| required | Enables native required-field validation when submission is attempted. |

An input whose value comes from React state is a **controlled input**. Display follows state, and editing callbacks will request state changes.

The arrow functions are created and supplied now. Their bodies do not execute until the corresponding events happen. We will enter those bodies in Chapter 2.

w-full h-full fills the wrapper. text-sm selects small text, bg-transparent exposes the wrapper background, and outline-none removes the input's own outline. The wrapper's border handles the focus appearance when its state changes.

With usernameActive false, padding chooses "0 var(--control-px)": zero vertical and the configured horizontal padding. The raised-text alternative is not selected yet. Text colour reads --color-text, and a transition prepares for later padding changes.

### Username's label before it floats

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 168 - 186)

htmlFor connects the label to the matching input id. React uses htmlFor for the HTML for attribute.

absolute positions it inside the relative wrapper. pointer-events-none makes pointer hit testing pass through it to the control underneath.

Since usernameActive is false:

- top is 50%.
- transform is translateY(-50%), moving the label upward by half its own height to centre it vertically.
- left reads the shared horizontal padding.
- fontSize is 0.875rem, normally 14px.
- lineHeight is 1, making line height equal to the font size.
- Its text uses the muted colour.
- Its background matches the card.
- Horizontal padding is 4px, with zero vertical padding.
- zIndex is 2, placing it above lower content in the relevant stacking context.

transformOrigin sets the anchor for scaling when that alternate state is used. The transition lists top, transform, and colour changes with 0.15-second durations.

Nothing moves yet just because a transition was declared.

The label says Username. This is a real label overlaid on the input, not a placeholder attribute.

### Password's wrapper, input, and label

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 189 - 234)

This creates the same structure using password state and the password id.

type="password" asks the browser to obscure entered characters. autoComplete="current-password" identifies an existing-account password to password managers.

Its value is empty and passwordActive is false. The border is neutral, padding is unraised, and the label is centred with muted text, just like the username control.

The event functions are supplied without being called. Password masking affects display; it is not itself encryption, and creating this input sends no password anywhere.

### The sign-in button

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 236 - 248)

type="submit" makes this button a form submission control.

disabled receives loading. Since loading is false, the button is enabled.

The classes provide full width, small bold text, increased letter spacing, rounded corners, and transitions. disabled:opacity-50 would reduce opacity when disabled; it is not active now.

Height uses --control-height. Background uses --color-accent, and text uses --color-btn-primary-text.

The conditional expression selects "Sign in" because loading is false. "Signing in..." is not displayed.

Rendering the button does not submit the form.

### Help text, divider, and claim buttons

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 252 - 290)

The help paragraph advises contacting the school administrator, using small centred muted text and top spacing.

The divider is a flex row with two expanding one-pixel-high elements around "First time here?". Border colour supplies their line colour.

The final two buttons display "Claim learner account" and "Claim staff account". Their styles set shared height, outlined borders, current text colour, transparent backgrounds, and spacing.

Each onClick receives an arrow function that would call router.push with the appropriate onboarding route. These function bodies do not execute during our task. A route address appearing inside a handler does not automatically load that page.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 292 - 299)

The closing tags complete the returned description. Control returns to React.

## 11. React commits the form and the browser paints it

React compares the new result with the opening-message result and commits the required DOM changes. This state update does not ordinarily download a whole new HTML document.

The status paragraph is removed, the form structure is inserted or updated as needed, and React connects the event-handler relationships for the controls. React manages event delegation internally; our code does not manually attach a native listener to every element.

The browser resolves matching rules, calculates layout for the current viewport, and paints the updated content.

Previously introduced utility classes, custom properties, font rules, inline styles, and motion rules participate through CSS's cascade. Inline declarations ordinarily beat ordinary stylesheet rules for the same property; specificity, cascade layers, and !important also affect precedence.

(File: [src/app/globals.css](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/globals.css), lines 380 - 386)

At widths up to 600px, this media query matches the form's data-auth-page marker:

- Control height is 50px.
- Field gap becomes 20px.
- Inputs get a 16px font-size rule.
- Buttons have at least 44px height.
- The h2 has 1.3 line height.

The input selector's greater specificity lets its font-size rule override the generic text-size utility here.

These are browser styling operations, not JavaScript resize callbacks.

Font files may finish loading after an early paint, replacing fallback text. On a successful settled load, the configured Geist face is used for its supported characters. The form can remain usable with fallback text if a font fails.

Content taller than the viewport can scroll using the browser's normal behaviour. Ordinary scrolling or CSS-responsive layout does not require a custom React state update.

**Our endpoint is reached:** the form is visible and interactive. Our code has not focused a field; the inputs have no autoFocus property. No submission is in progress.

## 12. The remembered-session fork

The trace above intentionally returned at the first restoration guard. A different starting condition would take a different path.

(File: [src/lib/auth.ts](C:/Users/Kgodiso/source/repos/nedecen-web/src/lib/auth.ts), lines 142 - 154)

If valid account metadata exists, the function can continue past line 144. It can examine an access token, request renewal when necessary, check account consistency, and return a destination path.

Those lines **did not execute on our fresh visit**. We do not invent a backend request to explain the page we just reached.

(File: [src/app/page.tsx](C:/Users/Kgodiso/source/repos/nedecen-web/src/app/page.tsx), lines 25 - 29)

If restoration returns a path, the callback calls router.replace(path). That navigates away and replaces the current history entry. A principal with a remembered session may therefore resume their workspace rather than remain at the login page.

If restoration returns null, checkingSession is cleared and the form appears.

A returning-session trace would need its own starting condition and would follow any renewal request through the backend and database at the point it occurs. It is not part of the no-account execution traced here.

## 13. Connecting what happened to what you see

| Observation | Explanation from this task |
| --- | --- |
| The address opened the sign-in route. | Next.js mapped / to the page component. |
| "Opening your workspace…" may have appeared first. | checkingSession initially selected the early return. |
| The form replaced it. | The no-account result set checkingSession to false and requested another render. |
| The current theme is applied. | The theme effect changed an attribute; CSS matched it. |
| Text is configured to use Geist. | The font helper supplied a variable, and global CSS consumed it. |
| A wide screen has a left introduction panel. | Responsive classes expose it at the large breakpoint. |
| Empty inputs have centred labels. | Both field-active flags are false. |
| The Sign in button is enabled. | loading is false. |
| No principal data was retrieved. | No account has been identified and no principal route has been entered. |
| The form is ready for interaction. | The DOM update and React event connections are in place. |

The app does not continuously call login while waiting. The browser's event loop handles input, scheduled work, and other events. React and our code respond when relevant events or state changes occur. The browser controls actual drawing.

In development, React Strict Mode can intentionally repeat rendering work and run an extra effect setup/cleanup cycle to detect bugs. Development tooling can make its own requests too. This chapter describes the logical execution path, not a guarantee that every line is called exactly once in a development debugger.

We stop before clicking or typing. That action begins Chapter 2.

