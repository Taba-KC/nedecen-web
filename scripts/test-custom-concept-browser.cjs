/* Isolated API fixtures verify chapter/topic selection without changing teaching data. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const shots = path.resolve('.next/custom-concept-screenshots');
fs.mkdirSync(shots, { recursive: true });
const concept = { id: 1, name: 'Resolve vectors', topicId: 11, prerequisites: [], learningOutcomes: [] };
const chapters = [
  { id: 1, name: 'Vectors in two dimensions', topics: [{ id: 11, name: 'Resolution of a Vector into Its Horizontal and Vertical Components', concepts: [concept] }, { id: 12, name: 'Resultant of perpendicular vectors', concepts: [] }] },
  { id: 2, name: 'Newton’s laws and application of Newton’s laws', topics: [{ id: 21, name: 'Understanding forces acting on objects on horizontal and inclined planes with long topic names', concepts: [] }, { id: 22, name: 'Applying Newton’s laws', concepts: [] }] },
  { id: 3, name: 'A chapter awaiting topics', topics: [] },
];
const subject = { id: 91, subjectName: 'Physical Sciences', classId: 10, className: '11B', gradeNumber: 11, totalConcepts: 1, taughtConcepts: 0, currentChapter: { name: chapters[0].name }, curriculum: chapters, lessons: [] };
const data = { profile: { firstName: 'Test', surname: 'Teacher', number: 'T001', username: 'fixture', schoolName: 'Test school' }, subjects: [subject], needsYou: [], comingUp: [] };
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    for (const viewport of [{ width: 320, height: 568 }, { width: 360, height: 800 }, { width: 768, height: 1024 }, { width: 1600, height: 1000 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'custom-concept-fixture'); localStorage.setItem('accountType', 'person'); localStorage.setItem('role', 'teacher'); localStorage.setItem('schoolId', '1');
      });
      const writes = [], errors = [];
      await context.route('http://localhost:3000/**', route => {
        if (new URL(route.request().url()).pathname === '/staff/me/access') return route.fulfill({ json: { isPrincipal: true, canTeach: true, capabilities: ['grades','streams','staff','learners','curriculum'], schoolId: 1 } });
        if (new URL(route.request().url()).pathname === '/learners/me/learning-setup') return route.fulfill({ json: { status: 'ready' } });
        const request = route.request(), pathname = new URL(request.url()).pathname;
        if (request.method() !== 'GET') {
          writes.push({ pathname, body: request.postDataJSON() });
          return route.fulfill({ json: { id: 99 } });
        }
        if (pathname === '/staff/me/dashboard') return route.fulfill({ json: data });
        if (pathname.endsWith('/planning')) return route.fulfill({ json: { chapter: chapters[0], chapters, customConcepts: [], reviewConcepts: [], planningConcepts: [concept], taughtConceptIds: [], flaggedConcepts: [], suggestedDate: '2026-10-26' } });
        return route.fulfill({ status: 404, json: { error: 'Unexpected fixture endpoint' } });
      });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/dashboard/staff?book=lessons&page=plan-91`);
      if (viewport.width <= 768) {
        await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
        await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
      }
      await page.getByRole('button', { name: '+ Add a concept', exact: true }).click();
      let dialog = page.getByRole('dialog', { name: 'Add a concept', exact: true }); await dialog.waitFor();
      assert.equal(await dialog.locator('select').count(), 0, 'Long options use a viewport-bounded list, not a native popup');
      await dialog.getByRole('combobox', { name: 'Topic', exact: true }).click();
      let list = dialog.getByRole('listbox', { name: 'Topic', exact: true });
      assert.equal(await list.getByRole('option').count(), 2);
      assert.equal(await list.getByRole('option', { name: chapters[1].topics[0].name }).count(), 0);
      assert.equal(await list.evaluate(node => node.scrollWidth <= node.clientWidth), true, 'Long topic names wrap');
      const box = await list.boundingBox(); assert.ok(box.x >= 0 && box.x + box.width <= viewport.width);
      await page.screenshot({ path: path.join(shots, `topics-${viewport.width}.png`) });
      await page.keyboard.press('Escape');
      assert.equal(await dialog.isVisible(), true, 'Escape closes the choices before the dialog');
      assert.equal(await dialog.getByRole('listbox').count(), 0);
      await dialog.getByRole('combobox', { name: 'Chapter', exact: true }).click();
      await dialog.getByRole('option', { name: chapters[1].name, exact: true }).click();
      assert.equal(await dialog.getByRole('combobox', { name: 'Topic', exact: true }).innerText(), chapters[1].topics[0].name);
      await dialog.getByRole('combobox', { name: 'Topic', exact: true }).click();
      list = dialog.getByRole('listbox', { name: 'Topic', exact: true });
      assert.equal(await list.getByRole('option', { name: chapters[0].topics[0].name }).count(), 0, 'Switching chapters removes stale topic choices');
      await page.keyboard.press('ArrowDown'); await page.keyboard.press('Enter');
      assert.equal(await dialog.getByRole('combobox', { name: 'Topic', exact: true }).innerText(), chapters[1].topics[1].name);
      await dialog.getByRole('combobox', { name: 'Chapter', exact: true }).focus();
      await page.keyboard.press('End'); await page.keyboard.press('Enter');
      assert.equal(await dialog.getByRole('combobox', { name: 'Topic', exact: true }).isDisabled(), true);
      assert.equal(await dialog.getByRole('button', { name: 'Save', exact: true }).isDisabled(), true);
      await dialog.getByRole('combobox', { name: 'Chapter', exact: true }).click();
      await dialog.getByRole('option', { name: chapters[1].name, exact: true }).click();
      await dialog.getByLabel('Concept', { exact: true }).fill('A custom inclined-plane example');
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await dialog.waitFor({ state: 'detached' });
      assert.equal(writes.length, 0, 'Cancel does not persist the concept');
      assert.equal(await page.getByRole('button', { name: 'Edit concept', exact: true }).count(), 0);
      await page.getByRole('button', { name: '+ Add a concept', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Add a concept', exact: true });
      await dialog.getByLabel('Concept', { exact: true }).fill('A custom inclined-plane example');
      await dialog.getByRole('combobox', { name: 'Chapter', exact: true }).click();
      await dialog.getByRole('option', { name: chapters[1].name, exact: true }).click();
      await dialog.getByRole('combobox', { name: 'Topic', exact: true }).click();
      await dialog.getByRole('option', { name: chapters[1].topics[1].name, exact: true }).click();
      await dialog.getByRole('button', { name: 'Save', exact: true }).click();
      await dialog.waitFor({ state: 'detached' });
      assert.equal(writes.length, 0, 'Modal Save stages the concept until the lesson is saved');
      await page.getByRole('button', { name: 'Edit concept', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Custom concept', exact: true });
      assert.equal(await dialog.getByRole('combobox', { name: 'Chapter', exact: true }).innerText(), chapters[1].name);
      assert.equal(await dialog.getByRole('combobox', { name: 'Topic', exact: true }).innerText(), chapters[1].topics[1].name);
      await page.screenshot({ path: path.join(shots, `selected-${viewport.width}.png`) });
      assert.equal(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), true);
      await dialog.getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByRole('button', { name: 'Save lesson plan', exact: true }).click();
      await page.getByRole('heading', { name: 'Lesson plan saved', exact: true }).waitFor();
      assert.equal(writes.length, 1);
      assert.deepEqual(writes[0].body.customConcepts, [{ name: 'A custom inclined-plane example', topicId: 22 }]);
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('Custom concept checks passed: bounded wrapping options, dependent chapter/topic selection, keyboard navigation, empty chapters, cancel/edit drafts and saved payload across phone/tablet/desktop.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
