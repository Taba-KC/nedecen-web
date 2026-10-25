/* Navigation persistence in real browser storage, with isolated accounts and intercepted API data. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const shots = path.resolve('.next/learner-menu-screenshots'); fs.mkdirSync(shots, { recursive: true });
const concept = { id: 1, lessonConceptId: 101, name: 'Resolve vectors', chapterName: 'Vectors', topicName: 'Components', prerequisites: [], learningOutcomes: ['Can you resolve a vector?'], answers: [null], taught: true };
const lessons = [45, 46].map((id, index) => ({ id, lessonNumber: index + 1, date: '2026-10-10', status: 'confirmed', canRespond: true, concepts: [concept], homework: [], chapterName: 'Vectors' }));
const subject = { id: 91, subjectId: 3, subjectName: 'Physical Sciences', classId: 10, className: '11B', gradeNumber: 11, totalConcepts: 1, taughtConcepts: 1, currentChapter: { name: 'Vectors' }, syllabus: [concept], curriculum: [], lessons, homework: [1, 2, 3].map(n => ({ id: 80 + n, activityNumber: n, lessonId: 45, dueDate: '2026-10-29T10:00:00Z', releaseAt: null, canReveal: false, questions: [] })) };
const profile = { firstName: 'Test', surname: 'Account', number: 'X001', username: 'fixture', schoolName: 'Test school' };
const feedback = lessons.map(lesson => ({ id: lesson.id, lessonId: lesson.id, lessonNumber: lesson.lessonNumber, lessonDate: lesson.date, createdAt: lesson.date, chapterName: 'Vectors', totalLearners: 1, concepts: [] }));
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    for (const role of ['learner', 'staff', 'principal']) {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
      await context.addInitScript(({ role }) => {
        // Do not overwrite a changed account when reopening a tab in this same context.
        if (localStorage.getItem('accessToken')) return;
        const accountType = role === 'learner' ? 'learner' : 'person';
        const token = 'fixture.' + btoa(JSON.stringify({ accountId: 12, schoolId: 1, accountType, role: role === 'staff' ? 'teacher' : role, exp: Date.now() / 1000 + 3600 })) + '.signature';
        localStorage.setItem('accessToken', token); localStorage.setItem('accountId', '12');
        localStorage.setItem('schoolId', '1'); localStorage.setItem('accountType', accountType);
        localStorage.setItem('role', role === 'staff' ? 'teacher' : role);
      }, { role });
      await context.route('http://localhost:3000/**', route => {
        const path = new URL(route.request().url()).pathname;
        let json = [];
        if (path.endsWith('/workspace') || path.endsWith('/dashboard')) json = { profile, subjects: [subject], needsYou: [], comingUp: [] };
        else if (path.endsWith('/homework-context')) json = { concepts: [concept], existingHomeworkId: null, aiAvailable: true, chapterName: 'Vectors' };
        else if (path.endsWith('/lesson-feedback')) json = feedback;
        else if (path === '/schools/1/grades') json = [{ id: 8, number: 8 }];
        else if (path === '/schools/1/grades/8/classes') json = [{ id: 10, gradeId: 8, name: '8A' }];
        return route.fulfill({ json });
      });
      let page = await context.newPage(); const errors = [];
      const observe = () => page.on('pageerror', error => errors.push(error.message)); observe();
      async function dismiss() {
        await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
        await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
      }
      async function openBook(title) {
        await page.getByRole('button', { name: 'Open library', exact: true }).click();
        await page.getByRole('button', { name: `Open ${title}`, exact: true }).click();
        await dismiss();
      }
      const target = role === 'learner' ? 'lessons&page=subject-91&tab=completed&lesson=45' : role === 'staff' ? 'lessons&page=lesson-feedback-91&lesson=45' : 'grades&page=class-10&tab=subjects';
      const destination = `${base}/dashboard/${role}?book=${target}`;
      await page.goto(destination); await dismiss();
      const heading = page.locator('[data-page-heading] h1'); await heading.waitFor();
      assert.equal(await heading.evaluate(node => getComputedStyle(node).fontSize), '24px');
      if (role === 'learner') await page.getByRole('heading', { name: 'Lesson 1 - 10 Oct 2026', exact: true }).waitFor();
      if (role === 'staff') assert.equal(await page.getByLabel('Select lesson to review').inputValue(), '45');
      await openBook(role === 'principal' ? 'Announcements' : 'Homework');
      await openBook(role === 'principal' ? 'Grades & Classes' : 'Lessons');
      await page.waitForURL(destination);
      // Closing the page leaves localStorage intact, just as reopening the app on this device does.
      await page.close(); page = await context.newPage(); observe(); await page.goto(base);
      await page.waitForURL(destination); await dismiss();
      await page.locator('[data-page-heading] h1').waitFor();
      if (role === 'learner') {
        await page.goto(`${base}/dashboard/learner?book=homework&page=previous-91&activity=81`); await dismiss();
        await page.waitForURL(url => url.searchParams.get('page') === 'subject-91' && url.searchParams.get('tab') === 'previous');
        await page.getByRole('heading', { name: 'Home Activity 1', exact: true }).waitFor();
        const homeworkDestination = url => url.searchParams.get('book') === 'homework' && url.searchParams.get('page') === 'subject-91' && url.searchParams.get('tab') === 'previous' && url.searchParams.get('activity') === '81';
        await openBook('Lessons'); await openBook('Homework'); await page.waitForURL(homeworkDestination);
        await page.close(); page = await context.newPage(); observe(); await page.goto(base);
        await page.waitForURL(homeworkDestination); await dismiss();
        await page.getByRole('heading', { name: 'Home Activity 1', exact: true }).waitFor();
      }
      if (role === 'staff') {
        await page.getByLabel('Select lesson to review').selectOption('46');
        await page.waitForURL(/lesson=46/);
        await openBook('Homework'); await openBook('Lessons');
        assert.equal(await page.getByLabel('Select lesson to review').inputValue(), '46');
        await openBook('Homework');
        await page.getByRole('button', { name: 'Open pages menu', exact: true }).click();
        await page.locator('[data-library-contents]').getByRole('button', { name: /Create homework/ }).click();
        await page.getByRole('button', { name: 'Generate automatically', exact: true }).click();
        await page.waitForURL(/method=ai/);
        await page.locator('[data-library-workspace]').getByRole('button', { name: 'Create homework', exact: true }).first().click();
        await page.waitForURL(/lesson=45/);
        assert.equal(await page.getByRole('button', { name: 'Generate automatically', exact: true }).getAttribute('aria-pressed'), 'true');
        await page.getByRole('button', { name: 'Pick another lesson', exact: true }).click();
        await page.getByRole('dialog', { name: 'Pick another lesson', exact: true }).getByRole('button', { name: /Lesson 2/ }).click();
        await page.waitForURL(/lesson=46/);
        await openBook('Lessons'); await openBook('Homework');
        assert.equal(await page.getByRole('button', { name: 'Generate automatically', exact: true }).getAttribute('aria-pressed'), 'true');
        assert.equal(new URL(page.url()).searchParams.get('lesson'), '46');
      }
      // An explicit deep link wins over history. A deleted page safely uses the current tree.
      if (role === 'learner') {
        await page.goto(`${base}/dashboard/learner?book=syllabus&page=uncovered-91`); await dismiss();
        await page.getByRole('heading', { name: 'Physical Sciences syllabus', exact: true }).waitFor();
        await page.waitForURL(url => url.searchParams.get('page') === 'subject-91' && url.searchParams.get('tab') === 'uncovered');
        assert.equal(await page.getByRole('tab', { name: 'Not yet covered', exact: true }).getAttribute('aria-selected'), 'true');
        await openBook('Homework'); await openBook('Syllabus');
        assert.equal(await page.getByRole('tab', { name: 'Not yet covered', exact: true }).getAttribute('aria-selected'), 'true');
        await page.close(); page = await context.newPage(); observe(); await page.goto(base);
        await page.waitForURL(url => url.searchParams.get('book') === 'syllabus' && url.searchParams.get('tab') === 'uncovered'); await dismiss();
        await page.getByRole('tab', { name: 'Not yet covered', exact: true }).waitFor();
        await page.goto(`${base}/dashboard/learner?book=lessons&page=completed-999`); await dismiss();
        await page.getByRole('heading', { name: 'Physical Sciences lessons', exact: true }).waitFor();
        await openBook('Homework'); await openBook('Lessons');
        assert.equal(new URL(page.url()).searchParams.has('page'), false, 'Removed page is discarded when reopening book');
      }
      for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1600, height: 1000 }]) {
        await page.setViewportSize(viewport);
        if (viewport.width <= 1200) {
          await page.locator('[data-drawer="none"]').waitFor();
          await page.getByRole('button', { name: 'Open pages menu', exact: true }).click();
          await page.getByRole('dialog', { name: 'Chapters and headings', exact: true }).waitFor();
        }
        const menu = page.locator('[data-library-contents]');
        if (role !== 'principal') {
          const account = menu.locator('details').filter({ hasText: role === 'learner' ? 'Your learner account' : 'Your staff account' });
          if (await account.getAttribute('open') === null) await account.locator('summary').click();
        }
        const signOut = menu.getByRole('button', { name: 'Sign out', exact: true });
        assert.equal(await signOut.isVisible(), true);
        const box = await signOut.boundingBox(), menuBox = await menu.boundingBox();
        assert.ok(box.y >= menuBox.y && box.y + box.height <= viewport.height, 'Sign out remains inside the visible left menu');
        assert.ok(menuBox.y + menuBox.height - (box.y + box.height) < 40, 'Sign out sits at the bottom, including when account details overflow');
        await page.screenshot({ path: path.join(shots, `${role}-sign-out-${viewport.width}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.locator('[data-drawer="none"]').waitFor();
      await page.getByRole('button', { name: 'Open pages menu', exact: true }).click();
      await page.locator('[data-library-contents]').getByRole('button', { name: 'Sign out', exact: true }).click();
      await page.waitForURL(`${base}/`);
      await page.getByRole('button', { name: 'Sign in', exact: true }).waitFor();
      assert.deepEqual(await page.evaluate(() => ['accessToken', 'refreshToken', 'accountType', 'role', 'schoolId', 'accountId'].map(key => localStorage.getItem(key))), [null, null, null, null, null, null], 'Menu sign out clears the browser session');
      assert.deepEqual(errors, [], role);
      await context.close();
    }
    console.log('Browser memory checks passed: all three roles restore book/page/filters and resume from app entry; mobile contents still opens; smaller titles, teacher method, deleted-page fallback, and bottom-menu sign out on all roles and screen sizes verified.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
