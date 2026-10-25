/* Account isolation, safe destinations, sign out and session renewal, without real credentials. */
/* eslint-disable @typescript-eslint/no-require-imports */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
require.extensions['.ts'] = (module, filename) => module._compile(ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, filename);
global.window = {};
const values = new Map();
global.localStorage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, String(value)), removeItem: key => values.delete(key) };
const memory = require('../src/lib/libraryMemory.ts');
const auth = require('../src/lib/auth.ts');
function session(id = 12, school = 1, role = 'learner') {
  localStorage.setItem('accountType', role === 'learner' ? 'learner' : 'person');
  localStorage.setItem('accountId', id); localStorage.setItem('schoolId', school);
  localStorage.setItem('role', role === 'staff' ? 'teacher' : role);
}
function token(exp = Date.now() / 1000 + 3600) {
  return 'fixture.' + Buffer.from(JSON.stringify({ accountId: 12, accountType: 'learner', schoolId: 1, exp })).toString('base64url') + '.signature';
}
(async () => {
  session();
  const completed = '/dashboard/learner?book=lessons&page=completed-91&lesson=45';
  memory.rememberLibraryLocation(completed);
  memory.rememberLibraryLocation('/dashboard/learner?book=homework&page=previous-91&activity=81');
  assert.equal(memory.rememberedLibraryLocation('learner', 'lessons'), completed);
  assert.equal(auth.getResumePath('learner', null), '/dashboard/learner?book=homework&page=previous-91&activity=81');
  for (const value of ['https://evil.invalid', '//evil.invalid', '/dashboard/learner-other', '/dashboard/staff?book=lessons', '/dashboard/learner?book=unknown', '/dashboard/learner?book=lessons&page=<script>', '/dashboard/learner?book=lessons&lesson=-1', '/dashboard/learner#anything']) assert.equal(memory.libraryLocation('learner', value), null, value);
  session(13); assert.equal(memory.rememberedLibraryLocation('learner'), null, 'Another account starts with its own history');
  session(12, 2); assert.equal(memory.rememberedLibraryLocation('learner'), null, 'Schools have separate histories');
  session(); assert.equal(memory.rememberedLibraryLocation('staff'), null, 'Wrong role cannot restore history');
  auth.logout(); session();
  assert.equal(auth.getResumePath('learner', null), '/dashboard/learner', 'Explicit sign out returns to library');
  assert.equal(memory.rememberedLibraryLocation('learner', 'lessons'), completed, 'Book choices survive explicit sign out');
  memory.rememberLibraryLocation(completed); localStorage.setItem('accessToken', token());
  global.fetch = () => { throw new Error('Unexpired session should not renew'); };
  assert.equal(await auth.restoreSavedSession(), completed);
  localStorage.setItem('accessToken', token(1)); localStorage.setItem('refreshToken', 'fixture-refresh');
  let refreshes = 0;
  global.fetch = async () => { refreshes++; return { ok: true, json: async () => ({ accessToken: token() }) }; };
  assert.deepEqual(await Promise.all([auth.restoreSavedSession(), auth.restoreSavedSession()]), [completed, completed]);
  assert.equal(refreshes, 1, 'Strict Mode / simultaneous callers share renewal');
  localStorage.setItem('accessToken', token(1));
  global.fetch = async () => ({ ok: false });
  assert.equal(await auth.restoreSavedSession(), null, 'Expired/revoked refresh stays on sign in');
  assert.equal(localStorage.getItem('accessToken'), null);
  session(); localStorage.setItem('nedecen.library.v1:learner:12:1:learner', '{broken');
  assert.equal(memory.rememberedLibraryLocation('learner'), null, 'Corrupted saved history is ignored');
  const read = localStorage.getItem; localStorage.getItem = () => { throw new Error('Storage disabled'); };
  assert.doesNotThrow(() => memory.rememberLibraryLocation(completed));
  assert.equal(memory.rememberedLibraryLocation('learner'), null);
  localStorage.getItem = read;
  console.log('Library memory checks passed: per-book/account/school history, safe URLs, explicit sign out, expired session renewal and unavailable storage.');
})().catch(error => { console.error(error); process.exitCode = 1; });
