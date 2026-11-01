/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const concept = { id: 1, name: 'Cell structure', chapterName: 'Cells', topicName: 'Cells', prerequisites: [], learningOutcomes: ['Identify a cell'], answers: [null] };
const subjects = [91, 92].map((id, index) => ({ id, subjectId: id, subjectName: index ? 'Mathematics' : 'Life Sciences', syllabus: [], lessons: [{ id: id + 100, lessonNumber: 1, date: '2026-10-31', status: 'planned', canRespond: false, concepts: [concept] }], homework: [] }));
const data = { profile: { firstName: 'Test', surname: 'Learner', number: 'L1', username: 'test', schoolName: 'Fixture school', className: '11B', gradeNumber: 11 }, subjects };
const seed = subjects.map(subject => ({ id: `plan-${subject.id}`, message: `Your ${subject.subjectName} teacher has published tomorrow's lesson.`, action: 'Prepare for lesson', bookId: 'lessons', subjectId: subject.id, pageId: `subject-${subject.id}`, lessonId: subject.id + 100, tab: 'upcoming', context: subject.subjectName, date: '2026-10-31', read: false }));

(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    for (const viewport of [{ width: 1500, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'notifications-fixture'); localStorage.setItem('accountType', 'learner');
        localStorage.setItem('accountId', '1'); localStorage.setItem('schoolId', '1');
        localStorage.setItem('nedecen.navigation-help.v1:learner:1:1', JSON.stringify({ visits: 4, completed: true }));
      });
      let alerts = structuredClone(seed), fail = false, reads = [];
      await context.route('http://localhost:3000/**', route => {
        const url = new URL(route.request().url());
        if (url.pathname === '/learners/me/learning-setup') return route.fulfill({ json: { status: 'ready' } });
        if (url.pathname === '/learners/me/workspace') return route.fulfill({ json: data });
        if (url.pathname === '/learners/me/notifications/read') {
          const { ids } = route.request().postDataJSON(); reads.push(...ids);
          alerts = alerts.map(item => ids.includes(item.id) ? { ...item, read: true } : item);
          return route.fulfill({ json: { ids } });
        }
        if (url.pathname === '/learners/me/notifications') return fail ? route.fulfill({ status: 500, json: { error: 'Notifications temporarily unavailable' } }) : route.fulfill({ json: alerts });
        return route.fulfill({ status: 404, json: { error: `Unexpected endpoint: ${url.pathname}` } });
      });
      const page = await context.newPage(); const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/dashboard/learner`);
      const trigger = () => page.locator('button[aria-label^="Notifications"]:visible').first();
      await page.locator('[data-library-books] button[aria-label="Open Lessons"]').waitFor({ state: 'attached' });
      await page.waitForFunction(() => [...document.querySelectorAll('button[aria-label^="Notifications"]')].some(item => item.getAttribute('aria-label') === 'Notifications, 2 unread'));
      assert.match(await page.locator('[data-library-books] button[aria-label="Open Lessons"]').textContent(), /2/);
      await trigger().click();
      await page.getByRole('region', { name: 'Notifications', exact: true }).getByRole('button', { name: /Life Sciences/ }).click();
      await page.waitForURL(url => url.searchParams.get('book') === 'lessons' && url.searchParams.get('page') === 'subject-91' && url.searchParams.get('tab') === 'upcoming');
      const close = page.getByRole('button', { name: 'Close pages menu', exact: true });
      if (viewport.width <= 768) { await close.waitFor(); await close.click(); }
      await page.getByRole('heading', { name: 'Life Sciences lessons', exact: true }).waitFor();
      if (viewport.width <= 768) {
        const libraryButton = await page.getByRole('button', { name: 'Open library', exact: true }).boundingBox();
        const bellButton = await trigger().boundingBox();
        assert.ok(libraryButton.x + libraryButton.width <= viewport.width && Math.abs(libraryButton.y - bellButton.y) < 15, 'Library and notification controls share one compact row');
      }
      assert.ok(reads.includes('plan-91'));
      assert.ok(!reads.includes('plan-92'), 'Other subject remains unread');
      assert.equal(await page.locator('[data-library-contents] button').filter({ hasText: 'Mathematics lessons' }).locator('[data-notification-badge]').count(), 1, 'Unread subject keeps its left-menu badge');
      await trigger().click();
      const panel = page.getByRole('region', { name: 'Notifications', exact: true });
      await panel.getByRole('button', { name: 'Mark all as read' }).click();
      await page.waitForFunction(() => [...document.querySelectorAll('button[aria-label^="Notifications"]')].every(item => item.getAttribute('aria-label') === 'Notifications'));
      await page.keyboard.press('Escape');
      assert.equal(await panel.count(), 0);
      assert.equal(await trigger().getAttribute('aria-expanded'), 'false');
      await page.reload();
      if (viewport.width <= 768) { await close.waitFor(); await close.click(); }
      await trigger().waitFor();
      await trigger().click();
      await page.getByRole('region', { name: 'Notifications', exact: true }).getByRole('button', { name: 'Mark all as read' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Mark all as read' }).isDisabled(), true);
      await page.keyboard.press('Escape');
      fail = true;
      await page.evaluate(() => window.dispatchEvent(new Event('focus')));
      await trigger().click();
      await page.getByRole('alert').filter({ hasText: 'Notifications temporarily unavailable' }).waitFor();
      assert.equal(await page.getByRole('heading', { name: 'Life Sciences lessons', exact: true }).count(), 1, 'Notification errors do not replace lesson content');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'No horizontal overflow');
      fs.mkdirSync('.next/notification-screenshots', { recursive: true });
      await page.screenshot({ path: `.next/notification-screenshots/learner-${viewport.width}.png` });
      assert.deepEqual(errors, []);
      await context.close();
    }
    for (const viewport of [{ width: 1500, height: 1000 }, { width: 390, height: 844 }]) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce', serviceWorkers: 'block' });
      await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'notifications-fixture'); localStorage.setItem('accountType', 'person'); localStorage.setItem('role', 'teacher');
        localStorage.setItem('accountId', '1'); localStorage.setItem('schoolId', '1');
        localStorage.setItem('nedecen.navigation-help.v1:person:1:1', JSON.stringify({ visits: 4, completed: true }));
      });
      const teacherSubject = { ...subjects[0], classId: 1, className: '11B', gradeNumber: 11, totalConcepts: 1, taughtConcepts: 1, curriculum: [], currentChapter: null, lessons: [{ ...subjects[0].lessons[0], status: 'confirmed', homework: [], chapterName: 'Cells' }] };
      let alerts = [{ ...seed[0], id: 'feedback-191', pageId: 'lesson-feedback-91', message: "Learners have submitted feedback on today's lesson.", action: 'Review feedback', tab: undefined }];
      await context.route('http://localhost:3000/**', route => {
        const pathname = new URL(route.request().url()).pathname;
        if (pathname === '/staff/me/access') return route.fulfill({ json: { isPrincipal: false, canTeach: true, capabilities: [], schoolId: 1 } });
        if (pathname === '/staff/me/dashboard') return route.fulfill({ json: { ...data, subjects: [teacherSubject], needsYou: [], comingUp: [] } });
        if (pathname === '/staff/me/notifications') return route.fulfill({ json: alerts });
        if (pathname === '/staff/me/notifications/read') { const { ids } = route.request().postDataJSON(); alerts = alerts.map(item => ids.includes(item.id) ? { ...item, read: true } : item); return route.fulfill({ json: { ids } }); }
        if (pathname === '/staff/class-subjects/91/lesson-feedback') return route.fulfill({ json: [{ id: 191, lessonId: 191, lessonNumber: 1, lessonDate: '2026-10-30', createdAt: '2026-10-30T08:00:00Z', chapterName: 'Cells', totalLearners: 2, concepts: [] }] });
        return route.fulfill({ status: 404, json: { error: `Unexpected endpoint: ${pathname}` } });
      });
      const page = await context.newPage();
      await page.goto(`${base}/dashboard/staff`);
      const trigger = page.locator('button[aria-label="Notifications, 1 unread"]:visible').first();
      await trigger.click();
      await page.getByRole('region', { name: 'Notifications', exact: true }).getByRole('button', { name: /Learners have submitted/ }).click();
      if (viewport.width === 390) await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
      await page.getByRole('heading', { name: 'See lesson feedback', exact: true }).waitFor();
      assert.equal(new URL(page.url()).searchParams.get('lesson'), '191');
      assert.equal(new URL(page.url()).searchParams.get('page'), 'lesson-feedback-91');
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
      await context.close();
    }
    console.log('Notification browser checks passed: teacher and learner links, desktop/tablet/phone, book and subject badges, read persistence, mark-all, Escape, error isolation and overflow.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
