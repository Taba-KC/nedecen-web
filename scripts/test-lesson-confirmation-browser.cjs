/* Browser checks use isolated lesson fixtures; no real teaching records are changed. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const shots = path.resolve('.next/lesson-confirmation-screenshots');
fs.mkdirSync(shots, { recursive: true });
const concepts = [
  { id: 1, name: 'Determine the direction of the resultant using simple trigonometric ratios', prerequisites: ['Identify opposite and adjacent sides of a right-angled triangle.'], learningOutcomes: ['Can you calculate the reference angle of a resultant?'] },
  { id: 2, name: 'Define normal force', prerequisites: ['Identify the contact surface.'], learningOutcomes: ['Can you describe the normal force?'] },
];
const lesson = { id: 45, lessonNumber: 1, date: '2000-01-01', status: 'planned', chapterName: 'Vectors in two dimensions', concepts, homework: [] };
const subject = { id: 91, subjectName: 'Physical Sciences', classId: 10, className: '11B', gradeNumber: 11, totalConcepts: 2, taughtConcepts: 0, currentChapter: { name: lesson.chapterName }, curriculum: [], lessons: [lesson, { ...lesson, id: 46, lessonNumber: 2, date: '2999-01-01' }] };
const data = { profile: { firstName: 'Test', surname: 'Teacher', number: 'T001', username: 'fixture', schoolName: 'Test school' }, subjects: [subject], needsYou: [], comingUp: [] };
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    for (const viewport of [{ width: 1600, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 568 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'lesson-preview-fixture');
        localStorage.setItem('accountType', 'person'); localStorage.setItem('role', 'teacher'); localStorage.setItem('schoolId', '1');
      });
      const requests = [], errors = [];
      await context.route('http://localhost:3000/**', route => {
        if (new URL(route.request().url()).pathname === '/staff/me/access') return route.fulfill({ json: { isPrincipal: true, canTeach: true, capabilities: ['grades','streams','staff','learners','curriculum'], schoolId: 1 } });
        if (new URL(route.request().url()).pathname === '/learners/me/learning-setup') return route.fulfill({ json: { status: 'ready' } });
        requests.push(route.request().method());
        if (new URL(route.request().url()).pathname === '/staff/me/dashboard') return route.fulfill({ json: data });
        return route.fulfill({ status: 404, json: { error: 'Unexpected fixture endpoint' } });
      });
      const page = await context.newPage(); page.on('pageerror', err => errors.push(err.message));
      await page.goto(`${base}/dashboard/staff?book=lessons&page=confirm-91`);
      if (viewport.width <= 768) {
        await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
        await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
      }
      const list = page.getByRole('region', { name: 'Lessons to confirm', exact: true }); await list.waitFor();
      assert.equal(await page.getByRole('button', { name: 'View plan', exact: true }).count(), 0);
      const firstLesson = list.locator(':scope > ul > li').first();
      const expand = firstLesson.getByRole('button', { name: /^Lesson 1/ });
      assert.equal(await expand.getAttribute('aria-expanded'), 'false');
      assert.equal(await firstLesson.getByRole('button', { name: /^View / }).count(), 0, 'Concept actions start hidden');
      const confirmButton = firstLesson.getByRole('button', { name: 'Confirm taught lesson', exact: true });
      const collapsedActionBox = await confirmButton.boundingBox();
      await expand.click();
      const region = firstLesson.getByRole('region'); await region.waitFor();
      assert.equal(await firstLesson.getByRole('button', { name: /^Lesson 1/ }).getAttribute('aria-expanded'), 'true');
      assert.equal(await region.getByRole('button', { name: /^View / }).count(), 2);
      const titleBox = await firstLesson.getByRole('heading', { level: 3 }).locator('button span').boundingBox();
      const conceptBox = await region.boundingBox();
      assert.ok(conceptBox.x > titleBox.x && conceptBox.x - titleBox.x <= 24, 'Concepts have a small indentation');
      assert.ok(conceptBox.y > titleBox.y + titleBox.height, 'Concepts sit beneath the lesson title');
      if (viewport.width <= 600) {
        const actionBox = await confirmButton.boundingBox();
        const rowBox = await firstLesson.boundingBox();
        assert.ok(actionBox.y >= conceptBox.y + conceptBox.height, 'Confirmation follows the expanded concepts');
        assert.ok(actionBox.y > collapsedActionBox.y + 50, 'Expanding concepts pushes confirmation downward');
        assert.ok(Math.abs(actionBox.x - titleBox.x) < 1, 'Confirmation starts at the lesson name');
        assert.ok(Math.abs((actionBox.x - rowBox.x) - (rowBox.x + rowBox.width - actionBox.x - actionBox.width)) < 1, 'Confirmation has equal side margins');
      }
      await page.screenshot({ path: path.join(shots, `expanded-${viewport.width}.png`), fullPage: true });
      await region.getByRole('button', { name: concepts[0].name, exact: true }).click();
      const nameDialog = page.getByRole('dialog', { name: 'Concept details', exact: true });
      await nameDialog.waitFor();
      await nameDialog.getByText(concepts[0].prerequisites[0], { exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await nameDialog.waitFor({ state: 'detached' });
      await region.getByRole('button', { name: `View ${concepts[0].name}`, exact: true }).click();
      let dialog = page.getByRole('dialog', { name: 'Concept details', exact: true }); await dialog.waitFor();
      assert.equal(await page.locator('dialog[open]').count(), 1);
      await dialog.getByText(concepts[0].prerequisites[0], { exact: true }).waitFor();
      await dialog.getByText(concepts[0].learningOutcomes[0], { exact: true }).waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await firstLesson.getByRole('button', { name: /^Lesson 1/ }).getAttribute('aria-expanded'), 'true');
      await firstLesson.getByRole('button', { name: /^Lesson 1/ }).click();
      assert.equal(await firstLesson.getByRole('region').count(), 0);
      // Confirmation focuses on checkboxes; guidance stays on the expanded page.
      await firstLesson.getByRole('button', { name: 'Confirm taught lesson', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Confirm taught lesson', exact: true }); await dialog.waitFor();
      assert.equal(await dialog.getByRole('button', { name: /^View/ }).count(), 0, 'Confirmation has no duplicate View actions');
      assert.equal(await page.locator('dialog[open]').count(), 1);
      await dialog.getByRole('checkbox', { name: concepts[1].name, exact: true }).uncheck();
      assert.equal(await dialog.getByRole('checkbox', { name: concepts[1].name, exact: true }).isChecked(), false);
      assert.equal(await dialog.getByRole('checkbox', { name: concepts[0].name, exact: true }).isChecked(), true);
      await page.screenshot({ path: path.join(shots, `confirmation-${viewport.width}.png`) });
      await page.keyboard.press('Escape');
      assert.equal(await list.locator(':scope > ul > li').last().getByRole('button', { name: 'Confirm taught lesson', exact: true }).count(), 0, 'Future lesson confirmation stays unavailable');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      assert.ok(requests.every(method => method === 'GET'), 'Previewing never changes saved lesson data');
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('Lesson confirmation browser checks passed: inline concept guidance, checkbox-only confirmation, future lesson guard and mobile/tablet/desktop layouts.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
