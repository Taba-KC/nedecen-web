# Chapter 1 Building the backend

## Begin with the teaching relationship

The goal is to build a platform where teachers can plan lessons, confirm which concepts they actually teach, and give homework. Learners need to prepare for planned lessons, respond to confirmed lessons, and see homework and worked memoranda. Every activity should remain attached to the smallest useful teaching unit, the concept. If a learner struggles with factorisation, a general statement that Mathematics is difficult is too broad to guide the next lesson. The platform needs to preserve the particular concept, the class, and the occasion on which it is taught.

Before we draw the first screen, a more basic problem appears. How does a learner arrive in the correct class? How does a teacher acquire responsibility for Mathematics in that class? A public registration form that lets everyone choose freely would make the platform convenient to enter but unreliable to use. We therefore begin with school administration. The school establishes its classes and registers its staff and learners. People later claim the records that already identify their place in the school.

This immediately gives us three responsibilities. A platform manager maintains the shared subject catalogue and curriculum. A principal maintains a particular school's structure, people, subject streams and teaching assignments. Teachers and learners carry out teaching and learning within those assignments. These responsibilities overlap in places in the present code, especially in older curriculum routes, but the distinction explains the main architecture.

We must also correct an appealing first sketch of the hierarchy. A concept sits under a topic, a topic under a chapter, and a chapter identifies a subject and a grade number. However, the shared Mathematics subject does not belong to one stream or class. Many schools use it. A school creates streams that group subjects. A class belongs to one school grade and may select a stream. A class subject is the actual allocation of one shared subject to one class. That allocation carries the default teacher. Chapter allocations can override that teacher for individual chapters.

Imagine Grade 11A and Grade 11B both use the Science stream. The shared Mathematics curriculum exists once for Grade 11. Each class has a different class_subjects row for Mathematics. Lessons and coverage refer to that row, so confirming a lesson in 11A cannot automatically mark the same concept as taught in 11B. Sharing the curriculum saves duplication. Separating delivery preserves the truth about each class.

The implementation does not model every feature a school might eventually need. Learners have one current class, and there is no explicit academic year or enrolment history table. A class has one optional stream, rather than multiple overlapping subject-choice groups. These are useful simplifications for the current secondary-school model. They also tell us precisely where a future transfer history, year rollover or individual subject selection would require more than a new button.

## Choose a delivery model before choosing a framework

We need teachers and learners to use phones, tablets and computers. Building separate native applications would give direct access to each platform's native interfaces and distribution systems, but would introduce platform-specific builds, installation workflows and release coordination. A browser application gives us one address and one interface implementation. A school can begin using an updated screen without waiting for everyone to install a new mobile build.

That choice has costs. Network failures become part of the ordinary user experience. Browsers impose limits on background work, storage and access to device features. Installation as a progressive web app can improve the launch experience, but it does not automatically make database operations work offline. We choose a web application because the current product is primarily structured forms, lists, curriculum exploration and shared records, all well suited to browser delivery.

We split that web application into two repositories. Project-Edu-Revo owns the Express API, database schemas, migrations and business services. nedecen-web owns the Next.js interface. A request travels from the browser to the API and then to PostgreSQL. The browser never receives a database connection string. The API is the place where we validate input and decide which records the caller may use.

A single Next.js application with route handlers could also host the API. That would reduce the number of separately running services and could make cookie-based authentication simpler. The current split provides a reusable HTTP boundary for another client and allows the backend to run independently of the interface. We accept the extra work of coordinating ports, cross-origin rules, deployment settings and response types. This is a reasonable fit for this codebase, rather than proof that two services are always better than one.

Node.js supplies the backend's JavaScript runtime. A runtime is the program that executes our application outside the browser. It lets us use the same language family in the interface and server. Requests spend much of their time waiting for the database or network, which fits Node's asynchronous I/O model. Heavy CPU work would need a different execution strategy; declaring a function async does not turn expensive computation into a separate worker.

TypeScript adds checked descriptions of values and function inputs. If createClass expects gradeId to be a number, the editor can identify many incorrect calls before we run the server. TypeScript does not inspect an incoming HTTP request at runtime. The request still needs validation. This is why TypeScript and Zod appear together: one helps the developer while writing code, and the other checks values arriving from outside the program.

Express gives us an explicit route and middleware pipeline. We could choose a more structured framework such as NestJS, or a different server such as Fastify. Here, Express keeps the first backend small: create an app, register middleware, attach routers, listen on a port. It does not supply the application's data model, authentication policy, runtime schemas or a complete application architecture. Those responsibilities become visible files in this repository.

## Establish the workspace and the configuration boundary

We begin with package.json because another developer needs a reproducible way to install and run the server. Dependencies are libraries needed by the running application. Development dependencies support compilation, direct TypeScript execution and schema generation. The backend declares Express, pg, Drizzle ORM, Zod, bcrypt, jsonwebtoken, cors, dotenv, multer and xlsx. The frontend declares Next.js, React, React DOM and next-pwa, with TypeScript, ESLint and Tailwind tooling for development.

package-lock.json records the resolved dependency tree. A version range in package.json permits a set of versions; the lockfile captures the installation chosen for this checkout. For reproduction, use npm ci with that lockfile. The backend dev command runs tsx watch src/server.ts, so saving a TypeScript file restarts development execution. The build command runs tsc and writes JavaScript to dist. The start command runs dist/server.js with Node. Development execution and production compilation are separate steps for a reason.

In backend tsconfig.json, rootDir is src and outDir is dist. Scripts under scripts are run directly by tsx and are outside the normal src compilation input. strict enables stronger checks, while esModuleInterop helps imported packages with different module export conventions work together. The backend currently compiles CommonJS and targets ES2020. The frontend uses moduleResolution bundler and noEmit because Next's build system handles browser bundles and generated output.

Now we encounter values that differ between machines. The development database is not the production database. A token-signing secret must not be embedded in committed source. We put machine-specific configuration in environment variables, often loaded from a local .env file during development. DATABASE_URL identifies the PostgreSQL connection. JWT_SECRET signs and verifies access tokens. PORT selects the backend listener. OPENAI_API_KEY and OPENAI_MODEL control the optional homework drafting integration.

An illustrative backend configuration looks like DATABASE_URL=postgresql://app_user:REPLACE_ME@localhost:5432/nedecen_dev, JWT_SECRET=REPLACE_WITH_A_LONG_RANDOM_VALUE and PORT=3000, each on its own line. These are placeholders, not credentials. The frontend may use NEXT_PUBLIC_API_URL=http://localhost:3000 in .env.local. NEXT_PUBLIC means the value can be included in browser code. It is appropriate for a public API address and inappropriate for a database password or signing key.

The backend server starts with import 'dotenv/config'. That import loads configuration before importing app.ts and the database modules beneath it. This order matters because those modules read process.env during initialization. drizzle.config.ts also reads process.env.DATABASE_URL, but it does not itself import dotenv/config. For migration commands, ensure the variable is present in the shell or load dotenv explicitly in that configuration. A non-null assertion, the exclamation mark after an environment lookup, reassures TypeScript but does not create the variable or validate it at runtime.

.gitignore keeps dependencies, generated output and local configuration out of version control. In the backend it excludes node_modules, dist, .env and local database backups. The frontend also excludes .next, build output, environment files and TypeScript build information. Ignoring a file prevents ordinary future additions; it does not erase a secret already committed to Git. A useful .env.example shows names and placeholder values so another developer can set up a machine without copying private configuration.

There is a practical gap worth recording. The backend ignore file is narrow and does not broadly exclude uploads or every possible backup format. The presence of a directory does not mean its contents should be committed. Configuration discipline comes from checking what Git tracks, not assuming that a folder name is private. We document the current boundary without changing the user's application while writing this book.

## Bring PostgreSQL into the design

We need durable records whose relationships remain valid under simultaneous requests. PostgreSQL is a relational database: it stores rows in tables and can enforce relationships, uniqueness and transactions. Our domain is rich in relationships, including schools to grades, classes to learners, and lessons to concepts. A document database could represent these records, but the application would need a different strategy for joins and cross-record integrity. SQLite could serve a smaller single-node deployment. PostgreSQL fits the multi-user service and the concurrency controls this code already uses.

The repository identifies the database engine as PostgreSQL. It does not establish a particular managed hosting vendor. We should therefore explain choosing the engine without inventing a decision to use Supabase, Neon or another provider. Local installation, a container or a managed service can all provide a PostgreSQL connection to this application.

For a fresh development setup, provision a PostgreSQL instance, create a database and a login that can apply the project's schema, and set DATABASE_URL. An illustrative SQL beginning is CREATE USER nedecen_app WITH PASSWORD 'REPLACE_ME'; followed by CREATE DATABASE nedecen_dev OWNER nedecen_app;. Choose actual credentials privately. Install backend dependencies, make the connection variable available to the migration process, review the committed migration journal, and run npm run db:migrate against a disposable development database first.

npm run db:generate compares TypeScript schema declarations with migration metadata and generates SQL. It does not apply that SQL to a running database. npm run db:migrate applies recorded migrations. A migration is a versioned change to database structure or data. A seed is initial content. scripts/seed.ts inserts a sample province, district, circuit and school. It is not a complete installer for every subject, manager and principal account, and its ordinary inserts do not make it safe to rerun indefinitely on an already seeded database.

src/db/index.ts creates a pg Pool and wraps it with Drizzle. Opening a database connection for every query would add overhead. A pool reuses a bounded set of connections. If more requests need connections than the pool can supply, some wait. Pooling reduces repeated connection setup; it does not promise unlimited concurrency or zero waiting.

Drizzle expresses SQL operations and schemas using TypeScript. It is an object relational mapping tool, commonly called an ORM, but this code remains visibly close to SQL. db.select().from(grades).where(eq(grades.schoolId, schoolId)) corresponds to selecting grade rows for one school. Raw SQL remains available for operations such as advisory locks, normalized indexes and multi-table deletion. Prisma or a query builder could also serve this role. Drizzle suits a design that wants typed schema definitions while retaining explicit control of SQL.

## Learn the schema vocabulary through one class

Suppose the principal creates class 11A. Its name is readable but is not a dependable permanent identity: someone may rename it. We give the row an id generated by serial and mark it as the primary key. Other tables refer to that number. A primary key is the stable identifier of a row. A foreign key is a database rule requiring a reference to point to an existing row.

classes.gradeId is an integer foreign key to grades.id. The database can reject a class linked to a nonexistent grade. name is text and notNull, so a row cannot omit it. streamId is nullable because the principal may create the class before choosing subjects. classTeacherId is nullable for the same setup reason. Optional setup is represented as missing data rather than a fabricated teacher or stream.

A unique constraint on gradeId and name means two classes in the same grade cannot share the same stored name. The same name may still exist in another school's grade. createdAt records creation time. It is not an automatic audit history and does not tell us who changed a row later. We should distinguish fields that preserve useful facts from features they do not implement.

The grades table adds a check constraint restricting number to 8 through 12. A check constraint tests the values of a row. A trigger is database code that runs when a database event occurs. Migration 0016 adds a trigger that provisions the five supported grades whenever a school is inserted, and another that blocks grade deletion or changes to the grade's school and number. A disabled Add grade button would only affect one interface. These database rules apply to other clients too.

The schema dictionary later in this chapter lists every current table and every declared column. Read it alongside the complete line-numbered schema listings. The dictionary explains each field's role, while the listing shows its exact declaration, nullability, default and constraints.

## Separate geography from school activation

We create provinces, districts and circuits because a school has an administrative location. Districts refer to provinces, circuits refer to districts, and schools refer to circuits. Repeating the entire geographic description in every school would make updates inconsistent. A reference hierarchy lets one district name serve all its circuits.

schools has both an activationCode and a code. The activation code supports the initial claim of a school. The shorter school code helps staff and learners locate their school during account claiming. activatedAt distinguishes a seeded school from an activated one. These fields describe different events and should not be merged just because both are text used during entry.

schoolService.ts exposes seedSchool, getAllSchools, getSchoolById and activateSchool. Activation checks whether the school exists, whether the activation code matches and whether activation has already happened, then sets the school code and timestamp. The service reads and updates in separate steps rather than performing a single conditional atomic update. That is sufficient to understand the current implementation, but it leaves a concurrent activation race that a stronger design would close.

The school router uses Zod to check request shape and returns a generic activation failure. The route name /schools/seed describes its intended platform responsibility. A name is not an authorization control: the current seed route has no authentication middleware. The same router's GET operations can return full school rows. That is a meaningful limitation because full rows include activation-related data. We should not teach these endpoints as a finished protected provisioning system.

## Register people before creating logins

We now need records for staff and learners before either has a username. people stores staff identity, staff number, role and school. learners stores learner identity, admission number, school and class. The separation reflects different domain requirements. Staff can receive teaching allocations; learners belong to a class and submit learning feedback. app_managers are separate again because a platform manager is not naturally a member of one school.

Both staff and learner rows allow username and passwordHash to be null until claiming is complete. accountSetUp defaults to false. This lets the principal establish the register first. The person later supplies the school code, official identifier and initials to find the record, confirms the name, and chooses credentials. School placement is inherited from the register rather than accepted from an unrestricted signup form.

The combination of schoolId and staffNumber is unique for staff. The combination of schoolId and admissionNumber is unique for learners. A national or platform-wide uniqueness requirement is not imposed on those school identifiers. Username uniqueness is enforced within each account table. The login helper tries staff, then learners, then managers, so duplicate usernames across account types can be ambiguous. This is a cost of separate account stores and sequential account discovery.

people.role defaults to teacher. A principal is a person with role principal. The old teachers.ts file now contains only a comment pointing to people.ts. It is not a second live teachers table. The surviving placeholder is useful historical evidence of a broader staff model replacing a narrower teacher-only name.

Onboarding hashes passwords with bcrypt using a cost of 10 before saving. Hashing stores a one-way verification representation rather than recoverable plaintext. bcrypt.compare checks a submitted password against that representation. SHA-256 is used elsewhere for random refresh tokens; that does not make it an interchangeable password-hashing choice. Human passwords and high-entropy random tokens have different threat and performance requirements.

The current lookup factors are practical but weak evidence of personal identity. School codes, admission numbers and initials may be known to others. The routes check whether the account is already set up, but the service update is not a conditional claim inside a locked transaction. Two simultaneous claims need stronger handling. A future invitation or verified claim process should be introduced as a deliberate new capability, not described as already present.

## Give the caller a verifiable identity

Once a person has credentials, the browser needs to identify subsequent requests without resending the password each time. authService.ts generates a signed JSON Web Token, usually shortened to JWT. Its payload contains accountId, accountType, schoolId and an optional role. Signing lets the backend detect an altered token. The payload is readable data, not encrypted secret storage.

An access token lasts 15 minutes in this implementation. A separate refresh token lasts seven days. The refresh token is generated from 64 random bytes and returned to the client, while only its SHA-256 hash is stored in refresh_tokens. If the token table is read, its hashes are not immediately usable as the original bearer tokens. A refresh request hashes the supplied token, finds the stored row, checks expiry and issues a new access token.

requireAuth reads the Authorization header, requires the Bearer prefix, verifies the signature and expiration using JWT_SECRET, and attaches the verified identity to req.caller. The TypeScript declaration extends Express Request so other handlers know caller may exist. requirePrincipal, requireLearner and requireTeacher then test account type and role. A 401 means a request lacks valid authentication; a 403 means the identified caller is not allowed to perform the operation.

These checks are only the first layer. A principal of School A must not edit School B merely by changing schoolId in a URL. A teacher must not confirm another teacher's lesson merely by knowing its number. We need ownership checks on the resource as well as a recognized role. Newer class, stream, roster and teacher-workspace routes make those checks explicit. Some older people, learner and curriculum routes are less consistent. Each route must be read with its middleware and service together.

Refresh currently reuses a valid stored refresh token rather than rotating it on each use. Manager refresh checks whether the manager remains active, and staff refresh reloads the role. Learner refresh does not perform the same explicit account-existence check. The frontend stores tokens in localStorage, which makes JavaScript access easy but exposes them to successful script injection. HttpOnly cookies would change that tradeoff and would require deliberate cross-origin, cookie and request-forgery handling.

The backend exposes logout by deleting the refresh-token hash. An already issued access token remains valid until expiry unless a separate revocation mechanism is introduced. Most frontend logout paths currently clear local storage without calling the backend logout endpoint. The manager screen does attempt server-side logout. The learning point is to follow both sides of a session, because the existence of an endpoint does not mean every screen invokes it.

## Build the HTTP pipeline one layer at a time

src/server.ts owns process startup. It loads environment configuration, imports the assembled application and listens on PORT or 3000. src/app.ts owns request composition. Separating them lets tests import the app and start an ephemeral listener without automatically binding the production port during import.

app.ts creates Express, configures CORS for http://localhost:3001 with credentials, enables a JSON request body limit of 1 MB, exposes the uploads directory, adds request logging and mounts routers. Middleware is a function participating in the request pipeline. It can reject a request, attach information or call next to continue. Ordering therefore matters. A router's middleware only applies where its path and position match.

CORS is the browser's cross-origin access mechanism. The interface and API run on different ports, which makes them different origins. The configured frontend origin is allowed to read API responses in the browser. CORS does not authenticate callers and does not stop a command-line program from sending a request. Production deployment needs an origin appropriate to its real address; the current hardcoded localhost origin is development configuration.

An HTTP route combines a method, path and handler. GET reads, POST commonly creates or performs a command, PATCH changes part of a resource, and DELETE removes it. A path parameter such as :classId is text extracted from the URL. Zod coercion or numeric parsing turns it into a checked number. req.body contains parsed JSON. res.json serializes a response. Status 201 signals creation; 400 signals invalid input; 404 signals missing records; 409 signals a conflict; 405 rejects a method; 410 retires an operation.

Routes translate the transport problem into an application operation. Services implement domain actions such as synchronizing a class's subjects or publishing a curriculum. Schema files describe storage. This separation makes it easier to change one boundary without rewriting every route. It is a convention rather than an absolute wall: manager.ts performs some database reads directly, and teacher-workspace routes open transactions to obtain scope. Read the real code instead of treating an old comment that only services access the database as a guaranteed rule.

Zod supplies runtime validation. safeParse returns success or validation errors; parse throws a Zod error. Newer endpoints wrap thrown validation and TeacherError instances into readable HTTP errors. app.ts does not install a single comprehensive JSON error handler after all routers. Some unexpected failures can therefore reach Express's default handling instead of the error shape the frontend expects. A shared error layer is an improvement opportunity with a concrete symptom: inconsistent failure responses.

## Turn a stream into class teaching allocations

We next create streams and stream_subjects. A stream belongs to a school. The join table records pairs of streamId and subjectId. A join table represents a many-to-many relationship: one stream contains several subjects, and one subject can appear in several streams. A comma-separated string of subject names would be harder to validate and join. Unique stream-subject pairs prevent duplicate membership.

When a principal assigns a stream to a class, choosing a stream is only the visible beginning. Teachers need class_subjects rows for those subjects, and curriculum chapters need class_chapters links. classSubjectService.ts centralizes this synchronization so creating a class, changing a stream and editing stream membership do not each invent a different allocation rule.

syncClassSubjects opens with the shared setup advisory lock, locks the class row, obtains its grade, and verifies the stream belongs to the grade's school. It reads desired stream members, compares them with existing class-subject rows and toggles active accordingly. Missing rows are inserted. Existing rows are reused when a subject returns, preserving their IDs and related teaching history. It then attaches active shared chapters matching the subject and grade number.

An advisory lock is an application-selected database lock. The setup operations coordinate on the pair 7411 and 0. This is a deliberately coarse synchronization point: curriculum publication and teaching setup cannot interleave freely and create inconsistent links. It trades throughput for a simpler consistency boundary. It does not lock every conceivable database writer automatically; cooperating operations must acquire the same lock.

A transaction groups related database statements into a single unit of success or failure. If creating a class succeeds but creating its allocations fails, the transaction can roll the whole operation back. Row locks such as FOR UPDATE coordinate competing changes to selected rows. A database unique constraint remains necessary even when the application checks for duplicates, because two requests can both pass a pre-check before either inserts.

The class naming service trims an optional Grade prefix, removes the current grade number, strips whitespace, uppercases the identifier and accepts letters only. Within Grade 11, A, 11A and Grade 11 A can become 11A. This is normalization, meaning different representations of the same intended value are converted to one stored form. The rule is intentionally narrow. A future class naming policy with digits or punctuation requires changing this function, validation, tests and any interface guidance together.

Assigning a subject teacher updates class_subjects.personId. Chapter allocations using the previous default, or having no teacher, inherit the new default. Explicit chapter overrides are retained. The SQL comparison IS NOT DISTINCT FROM treats nulls predictably when comparing the old default. This small expression protects a real staffing rule: changing the normal Mathematics teacher should not silently remove a deliberate chapter specialist.

The frontend's Create stream dialog makes several API calls, first creating the stream and then adding selected subjects. That entire user action is not one server transaction. Its command closure remembers the created stream and successfully added subjects so retrying can continue. That is a useful recovery strategy, but another reader can still observe an incomplete stream between calls. A single atomic create-stream-with-members endpoint would provide a stronger boundary if needed.

## Publish a curriculum without destroying lesson history

We need one shared curriculum for each subject and grade number. curriculum_libraries stores that pair and its revision. chapters stores ordered chapters, topics stores ordered topics beneath chapters, and concepts stores ordered concepts beneath topics. Names describe content; IDs identify records. orderIndex controls teaching order independently of names and creation time.

The concept row stores chapterId as well as topicId. Storing both could allow a contradictory combination, such as a concept pointing to a topic in a different chapter. The composite foreign key on topicId and chapterId points to topics.id and topics.chapterId together. The database can therefore enforce that the topic and chapter agree. This is a specific reason for the composite unique declaration in topics, even though topics.id is already a primary key.

The curriculum editor allows renaming and reordering while keeping IDs. Replacing a concept deliberately creates a new identity. Removing curriculum entries sets active to false rather than deleting the rows. Retirement preserves references from lessons, questions and feedback. Without this distinction, editing the current annual teaching plan could invalidate past classroom records or make an old lesson appear to refer to a different concept.

We also need to avoid one manager overwriting another manager's edits. A loaded curriculum includes its revision. saveCurriculum compares that revision with the database version inside the setup transaction. A mismatch returns 409 and asks the editor to reload. A successful save increments the revision. This is optimistic concurrency control: the user edits without keeping a database lock open for minutes, and the save checks whether the starting version is still current.

Read operations use repeatable read transactions in important curriculum and dashboard flows. A consistent snapshot prevents an overview from combining half of one publication with half of another. The code also injects a database argument into several services, enabling tests to supply controlled transaction behavior. These are separate tools: a transaction protects a database operation, a revision protects a user's longer edit cycle, and dependency injection makes behavior easier to verify.

Manager spreadsheet import is a review workflow. Row 1 provides chapter labels, row 2 provides topic labels, and rows 3 onward contain concepts. Columns define topics. Repeated or horizontally merged chapter headings group columns. The parser preserves teaching order, skips blank cells, rejects formulas and limits size. Similar long chapter names generate a warning rather than being merged silently. The manager can combine unsaved chapters deliberately.

Multer reads the uploaded file into memory, with the manager and roster routes limiting it to one file of 2 MB. xlsx turns workbook bytes into worksheet cells. Neither library understands the application's curriculum by itself. Our parser supplies those semantics, and Zod checks the reviewed nested payload before saving. Reading a spreadsheet is not the same operation as publishing its data.

The older chapterImport route remains mounted and uses a flatter chapterName and conceptName format with developer-role access. The separate learnerImport.ts file still exists but is not mounted by app.ts. We must distinguish an existing file from a live endpoint. The present roster router replaces direct roster upload with preview and commit. A codebase can retain historical helpers without those helpers defining the current user journey.

## Import a school register without making partial mistakes invisible

Register import solves a different spreadsheet problem. The school already has a list of names and official identifiers. Retyping hundreds of rows is slow and creates mistakes. We accept a spreadsheet, show an editable preview and commit only reviewed rows. Staff headers include title, firstName, surname and staffNumber. Learner headers include firstName, surname and admissionNumber. Learners no longer require a title.

rosterImportService.ts checks the target school and, for learners, verifies the target class belongs to that school. parseRosterWorkbook reads only the first worksheet, checks dimensions, requires each expected heading exactly once, rejects formula cells and returns normalized row objects. validateRosterRows checks required fields, maximum lengths, identifiers already registered in the school and duplicate identifiers inside the preview.

Preview does not insert records. Commit validates again because another administrator may have changed the register after the preview was generated. A per-school advisory lock using 7412 and the school ID coordinates commits through this path. The transaction inserts all reviewed rows together. If one is invalid, the operation saves none. This differs from the older bulkAddPeople and bulkAddLearners helpers, which try rows one at a time and report partial success.

The inline frontend importer skips rows already present in the preview's existing-identifier list, while displaying a skipped count. It still lets the user edit or remove remaining rows. The backend remains authoritative at commit. Browser checks make correction faster; server checks preserve integrity if the request comes from another client or the browser's information has become stale.

## Make lesson planning and confirmation different facts

We can now implement the original purpose. lessons identifies a chapter, a class subject, a calendar date and a status. lesson_concepts connects a lesson to the concepts intended or confirmed for that occasion. One lesson can cover several concepts. The same concept can be revisited in another lesson. A unique lesson-concept pair prevents the same concept being counted twice within one lesson.

teacherWorkspaceService.ts is the current center of the teacher workflow. teacherScope verifies the caller is a set-up staff account in the school, finds an active class-subject allocation and calculates which chapters the teacher owns. Ownership uses a chapter override where one exists, otherwise the class subject's default teacher. The service derives subject and grade from the allocation instead of trusting separate client-provided values.

getPlanning reads confirmed teaching history, gathers taught concept IDs, calculates progress and selects the first incomplete owned chapter, falling back to the last chapter. Teacher custom concepts are loaded only for the current class-subject scope. They use isCustom and classSubjectId so a teacher's addition does not become shared curriculum for every class. Their high orderIndex places them after ordinary curriculum ordering in the current implementation; it is a convention rather than a separate scheduling engine.

Planning can flag a concept worth revisiting. For a confirmed lesson concept, the service counts didnt_understand responses and compares that count with the full current class register. At least 30 percent triggers the flag. Ten responses out of a class of forty are 25 percent even if only ten learners responded. The denominator is the roster, not respondents. This decision directly changes what the teacher sees, so we must explain it instead of calling the result a vague understanding score.

savePlan checks that selected concepts belong to the chapter and permitted class-specific additions, rejects duplicate IDs, requires at least one concept or new custom concept, validates the topics of new additions, creates the planned lesson and inserts its concept links inside one transaction. The route also validates the date. The browser suggests a school date, but the server remains responsible for accepting a valid plan.

confirmPlan locks the lesson row, checks ownership, rejects an already confirmed lesson and prevents confirmation before its date in Africa/Johannesburg. It accepts only concepts present in the plan. Unchecked concept links are removed and the status becomes confirmed inside the transaction. Confirming zero concepts is possible, representing a lesson where none of the planned concepts were covered. The remaining concepts can be planned again.

This model has an important historical consequence. Confirmation mutates the original lesson_concepts set; it does not store a separate immutable planned set and actual set. Preview feedback still identifies its lesson and concept, but the full original plan is not preserved as a dedicated versioned plan history. If planned-versus-taught reporting becomes a requirement, the model needs an additional distinction rather than guessing the original set from the confirmed row.

lessonService.ts retains earlier simple planning and confirmation helpers. They write in multiple steps without the newer scope and transaction protection. Current lesson routes delegate writes to savePlan and confirmPlan, preserving legacy URL shapes while sharing stronger business rules. This is a concrete development revision: keep compatible entry points, replace the unsafe operation behind them.

## Attach homework to what actually happened

Homework should test concepts taught in a confirmed lesson. getHomeworkContext enforces confirmation and returns the eligible concepts, grade and chapter information. homework.lessonId is unique, giving each lesson at most one homework set. questions belong to that set and each question has one conceptId, body, optional memo and orderIndex.

sendHomework locks the lesson, checks the teacher's scope, rejects an existing set, requires nonempty questions and ensures every question tests a confirmed concept. It validates a future due date and a valid custom memorandum release time where required. It inserts the set and all questions together. The old separate create-homework and add-question POST routes return 410, directing callers toward the reviewed complete-set workflow. This prevents a half-built set from becoming the normal publication process.

memoReleaseType supports immediately, at_due_date and custom. memoReleaseAt stores the optional custom time. A due date is a timestamp because it includes a time of day, whereas a lesson date is a calendar date. Most timestamp declarations here do not explicitly use PostgreSQL time-zone-aware timestamp types. The interface converts local datetime input to ISO timestamps. Deployment and storage time-zone behavior therefore needs testing rather than assuming a date string alone removes ambiguity.

The dashboard deliberately omits memo text from learner responses. It calculates release eligibility for task status. However, the current learner interface does not implement a complete release-gated memo retrieval and reveal journey. A stored release policy is not sufficient by itself. To complete that feature, a learner-authorized endpoint must verify class ownership and release time before returning a memo, and a learner control must call it.

Optional AI drafting stays behind the backend. homeworkAiService.ts sends a structured request to the Responses API using fetch. There is no OpenAI SDK dependency in package.json. The key stays in process.env. The request includes educational context and concept labels, asks for a strict JSON schema, sets store to false and applies a 90-second timeout. It does not send learner or school identities in the constructed prompt.

Returned JSON is still untrusted input. The service validates it with Zod and checks exact per-concept question counts. Generation is limited to 30 questions in one request and ten per concept. Sending a reviewed set allows up to 50 questions. The AI limiter is an in-memory map per account, allowing at most 40 generation requests per hour and one in flight. It is a pilot-process limit, not a shared quota across several server instances.

A generated memo is a draft. The teacher can flag it, provide a correction note, compare a candidate replacement and keep or discard it. Regeneration does not automatically replace a saved question. This keeps the human review decision visible. Structured output ensures shape, not mathematical correctness. Manual question writing remains usable when the key is absent or the provider fails.

## Separate three kinds of learner feedback

lesson_preview_feedback asks about a concept before an upcoming lesson. Its identity combines learner, lesson and concept. lesson_feedback asks about a specific lesson-concept occurrence after teaching. Its identity combines learner and lessonConceptId. question_feedback records completion, memorandum reveal and reaction for an individual question. One generic feedback table would need a flexible target type and more service rules to prevent invalid combinations. Separate tables make the target of each reaction explicit.

The preview reactions are new_to_me, getting_it and will_see_it. Post-lesson reactions are understood, not_sure and didnt_understand. Question reactions include understood and didnt_get_it. These values are restricted in route schemas, while database columns remain text. Direct SQL could insert another string unless further database constraints are introduced. That is a useful example of a business rule enforced at one layer but not every layer.

Each feedback table has a unique identity pair or triple so one learner has one current response for that target. The services look for an existing row and update it, otherwise insert. This is an application-level upsert pattern. A database ON CONFLICT upsert would handle a simultaneous first submission more cleanly; with the current read-then-insert sequence, the unique constraint may reject a racing insert rather than merge it.

isAnonymous defaults to true, but the database still stores the learner ID. Anonymity here is a presentation and access promise, not irreversible anonymization. The aggregate service returns reaction counts rather than individual identities. Any screen claiming anonymity must be consistent with that distinction and with who can inspect stored records.

Current learner-feedback routes check the account type but do not consistently verify that the target lesson, concept or question belongs to the learner's class. The aggregate route similarly checks a teacher role without the newer lessonScope ownership rule. These limitations are directly visible in the code. They should be repaired before treating the feedback boundary as complete multi-school authorization.

## Assemble dashboards from authoritative records

dashboardService.ts gives the browser a purposeful overview rather than making it reconstruct the entire database. It loads the school, verifies the account and accountSetUp state, derives a learner's class, obtains active allocations, filters teacher-owned chapters, gathers lessons, concepts and homework, and builds task lists. Staff see needsYou. Learners see waitingForYou and comingUp. Relevant announcements are selected from the school and the caller's classes, grades and streams.

Coverage counts unique shared concepts with a confirmed lesson in the relevant class subject. Planning does not advance coverage. Teaching the same concept twice does not double it. Class-specific custom concepts do not expand the shared curriculum denominator. classCurriculumService.ts performs a similar read for the principal's class-subject curriculum modal and rounds its displayed percentage to one decimal place.

The dashboard is computed from current records rather than stored in a dashboard table. That avoids maintaining duplicate task state after every change. It also means some operations issue multiple queries and filter data in memory. At a larger scale, repeated per-allocation curriculum reads and unpaginated lists would need profiling and optimization. The present design prioritizes visible rules and correctness for the current workload rather than claiming unlimited scale.

Announcements need title, body, creator, school and audience. audienceType chooses all, grade, class or stream; audienceId identifies the selected target and is null for all. Because one integer can refer to different tables depending on audienceType, it has no ordinary single-table foreign key. This is a polymorphic reference. The convenience of one announcement table shifts target validation into the API. A more normalized recipient model would trade extra tables for stronger database relationships.

## Delete deliberately and preserve where appropriate

Removing a stream and deleting a class have different meanings. Removing a stream clears class references and deactivates class subjects while preserving lessons and related history. Deleting a class is currently a destructive operation that explicitly removes its learners and teaching data. The frontend confirmation describes that scope. The backend performs the dependent deletions inside a transaction and verifies class, grade and school together.

deleteClassContents removes question feedback, lesson feedback and preview feedback before the questions and lessons they reference. It removes homework, lesson-concept links, class chapters, learner refresh tokens, learners and class subjects in dependency order. Class-targeted announcements are removed too. These manual deletions are necessary because the schema's foreign keys do not generally declare cascading deletion. The order is a map of the domain's dependencies.

Parameterized SQL such as WHERE class_id = ANY($1::int[]) passes values separately from the SQL text. This avoids building query syntax by concatenating user input. The connection is released in finally after COMMIT or ROLLBACK. If a future feature adds another table referring to a learner, question or class subject, its cleanup behavior must be considered here. Adding a table is also adding a lifecycle responsibility.

## Follow the revisions that the repository actually records

The Git history begins with backend setup on 7 August 2026, followed by school activation and geography, school structure routes, people and learner routes, JWT authentication, bulk learner import, announcements and role-based access. The October history expands curriculum and dashboard support and removes learner titles. The migration sequence gives more detailed evidence of model changes than a broad commit message alone.

We initially link teachers through chapter allocations. Later, migration 0014 adds the default teacher and active flag to class_subjects. The migration preserves a teacher when the old chapter allocations agree, repairs stream-related activity and backfills missing class-chapter links. The revised design makes the common whole-subject assignment easy while retaining chapter exceptions. That is a better fit for the observed staffing model, not a reason to discard all existing chapter data.

We initially allow grade management as ordinary CRUD. Migration 0016 replaces that flexibility with fixed Grades 8 through 12. It backfills missing grades, retains existing IDs, adds the supported range and installs provisioning and protection triggers. The grades API now refuses custom creation or deletion with 405. This revision removes an administrative task that no longer belongs to the chosen product boundary.

We initially attach concepts directly to chapters. Migration 0017 introduces topics. It creates a General topic beneath each existing chapter, assigns existing concepts without changing their IDs, makes topicId mandatory, adds the composite foreign key and increments curriculum revisions so older editors reload. This is the safe shape of a required-field migration: create the new parent records, backfill references, then enforce the stronger rule.

Migration 0018 adds class_subject_id for teacher custom concepts. Where existing lesson use identifies exactly one class subject, it backfills that scope. It does not guess an allocation for every ambiguous old custom concept. Migration 0019 removes learner titles from the database and the surrounding workflows. Staff titles remain. The current working changes add migration 0020 to remove class profile photos and simplify the relevant routes and interface. That last change is present in the working tree and should not be presented as an already committed release.

Earlier migrations 0000 through 0010 establish and extend the original tables. Migrations 0011 through 0013 add class profile fields and uniqueness for class names and grade numbers. The complete SQL reference preserves the exact sequence. Generated superhero-style filenames are identifiers from migration tooling, not descriptions of business intent. Read their SQL and journal order rather than trying to infer purpose from the decorative names.

## Verify the behavior without touching school records

Tests are most useful when they protect a business rule. The backend supplies focused scripts for fixed grades, principal setup, class curriculum, manager curriculum, roster imports, dashboards and teacher workflows. HTTP variants also exercise the Express boundary. Some scripts use a database or construct temporary test databases, so inspect their configuration before running them. A test command is executable code and may have data effects.

For lesson changes, verify that another teacher cannot access the allocation, a future lesson cannot be confirmed, an unplanned concept cannot be added during confirmation, and duplicate homework cannot be sent. For curriculum changes, verify stable IDs on rename, new IDs on replacement, retirement with lesson references intact and stale revision conflicts. For coverage, verify that repeated lessons, other classes, planned lessons and custom additions do not inflate the shared count.

This book is produced by read-only source inspection and Git inspection. Database provisioning, migrations, seed scripts and application test scripts are described for learning rather than executed against the user's school data. The complete source companion provides the exact files to inspect before changing or running them. The next chapter follows the same records into the visible interface.
