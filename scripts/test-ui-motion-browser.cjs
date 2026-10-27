/* Exercises real intermediate frames with isolated API data; never writes real records. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const shots = path.resolve('.next/ui-motion-screenshots'); fs.mkdirSync(shots, { recursive: true });
const concepts = [
  { id: 1, lessonConceptId: 101, name: 'Determine the direction of a resultant using trigonometric ratios', chapterName: 'Vectors', topicName: 'Components', prerequisites: ['Identify opposite and adjacent sides.'], learningOutcomes: ['Can you calculate a reference angle?'], answers: [null], taught: true },
  { id: 2, lessonConceptId: 102, name: 'Define normal force', chapterName: 'Forces', topicName: 'Contact forces', prerequisites: ['Identify a contact surface.'], learningOutcomes: ['Can you explain the normal force?'], answers: [null], taught: false },
];
const lesson = { id: 45, lessonNumber: 1, date: '2000-01-01', status: 'planned', chapterName: 'Vectors', concepts, homework: [] };
const subject = { id: 91, subjectId: 3, subjectName: 'Physical Sciences', classId: 10, className: '11B', gradeNumber: 11, totalConcepts: 2, taughtConcepts: 1, currentChapter: { name: 'Vectors' }, curriculum: [], syllabus: concepts, lessons: [lesson, { ...lesson, id: 46, lessonNumber: 2, status: 'confirmed', canRespond: true }, { ...lesson, id: 47, lessonNumber: 3, date: '2999-01-01' }], homework: [1, 2].map(n => ({ id: 80 + n, activityNumber: n, lessonId: 46, dueDate: '2999-01-01T10:00:00Z', releaseAt: null, canReveal: false, questions: [] })) };
const data = { profile: { firstName: 'Test', surname: 'Account', number: 'X001', username: 'fixture', schoolName: 'Test school' }, subjects: [subject], needsYou: [], comingUp: [] };
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    for (const reduced of [false, true]) {
      const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: reduced ? 'reduce' : 'no-preference' });
      await context.addInitScript(() => {
        const role = location.pathname.split('/')[2];
        localStorage.setItem('accessToken', 'motion-fixture'); localStorage.setItem('schoolId', '1');
        localStorage.setItem('accountType', role === 'manager' ? 'manager' : role === 'learner' ? 'learner' : 'person');
        localStorage.setItem('role', role === 'staff' ? 'teacher' : role);
      });
      const errors = [], writes = [];
      await context.route('http://localhost:3000/**', route => {
        if (new URL(route.request().url()).pathname === '/staff/me/access') return route.fulfill({ json: { isPrincipal: true, canTeach: true, capabilities: ['grades','streams','staff','learners','curriculum'], schoolId: 1 } });
        if (new URL(route.request().url()).pathname === '/learners/me/learning-setup') return route.fulfill({ json: { status: 'ready' } });
        const url = new URL(route.request().url()), p = url.pathname;
        if (route.request().method() !== 'GET') writes.push(p);
        let json = [];
        if (p.endsWith('/dashboard') || p.endsWith('/workspace')) json = data;
        else if (p.endsWith('/homework-context')) json = { concepts, existingHomeworkId: null, aiAvailable: true, chapterName: 'Vectors' };
        else if (p === '/schools/1/grades') json = [{ id: 8, number: 8 }];
        else if (p === '/schools/1/grades/8/classes') json = [{ id: 10, gradeId: 8, name: '8A' }];
        else if (p === '/manager/subjects') json = [{ id: 3, name: 'Physical Sciences' }];
        else if (p.startsWith('/manager/curricula/')) json = { subjectId: 3, gradeNumber: Number(p.split('/').at(-1)), revision: 1, exists: true, chapters: [{ id: 1, name: 'Vectors', topics: [{ id: 1, name: 'Components', concepts }] }] };
        return route.fulfill({ json });
      });
      const page = await context.newPage(); page.on('pageerror', e => errors.push(e.message));
      async function open(url) {
        await page.goto(base + url);
        if (page.viewportSize().width <= 768 && url.includes('?book=')) {
          await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
          await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
        }
      }
      async function closeDialog(dialog) {
        await dialog.evaluate(async node => { await Promise.all(node.getAnimations().map(a => a.finished.catch(() => {}))); });
        if (!reduced) await page.screenshot({ path: path.join(shots, `dialog-${new URL(page.url()).pathname.split('/').at(-1)}-${page.viewportSize().width}.png`), fullPage: false });
        const result = await dialog.evaluate(async node => {
          node.querySelector('header button').click();
          node.getBoundingClientRect();
          const immediate = { connected: node.isConnected, closing: node.hasAttribute('data-motion-closing'), inert: node.inert };
          const exits = node.getAnimations();
          for (const animation of exits) { animation.pause(); animation.currentTime = Number(animation.effect.getTiming().duration) * .4; }
          const middle = node.isConnected ? Number(getComputedStyle(node).opacity) : 0;
          exits.forEach(animation => animation.play());
          await new Promise((resolve, reject) => {
            if (!node.isConnected) { resolve(); return; }
            const timeout = setTimeout(() => { observer.disconnect(); reject(new Error('Dialog did not unmount after dismissal')); }, 2000);
            const observer = new MutationObserver(() => { if (!node.isConnected) { clearTimeout(timeout); observer.disconnect(); resolve(); } });
            observer.observe(document.body, { childList: true, subtree: true });
          });
          return { ...immediate, middle, removed: !node.isConnected };
        });
        assert.equal(result.removed, true);
        if (!reduced) { assert.equal(result.connected, true); assert.equal(result.closing, true); assert.equal(result.inert, true); assert.ok(result.middle > 0 && result.middle < 1, 'Dialog fades before removal'); }
        else { assert.equal(result.closing, false, 'Reduced motion closes immediately'); }
      }
      async function switchTab(container, button) {
        await container.evaluate(node => { node.dataset.instance = 'retained'; });
        const before = await container.locator('.motion-tab-indicator').evaluate(node => new DOMMatrixReadOnly(getComputedStyle(node).transform).m41);
        await button.click();
        await page.waitForFunction(node => node.getAttribute('aria-selected') === 'true' || node.getAttribute('aria-pressed') === 'true', await button.elementHandle());
        const middle = await container.locator('.motion-tab-indicator').evaluate(async node => {
          node.getBoundingClientRect();
          const transitions = node.getAnimations();
          for (const animation of transitions) { animation.pause(); animation.currentTime = Number(animation.effect.getTiming().duration) * .4; }
          const value = new DOMMatrixReadOnly(getComputedStyle(node).transform).m41;
          transitions.forEach(animation => animation.finish());
          return { value, end: new DOMMatrixReadOnly(getComputedStyle(node).transform).m41 };
        });
        assert.equal(await container.getAttribute('data-instance'), 'retained', 'Tab bar stays mounted');
        assert.ok(middle.end > before, 'Highlight moves to the second tab');
        if (!reduced) assert.ok(middle.value > before && middle.value < middle.end, 'The highlight visibly travels between tabs');
      }
      for (const viewport of [{ width: 1600, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
        await page.setViewportSize(viewport);
        await open('/dashboard/staff?book=lessons&page=confirm-91');
        const toggle = page.getByRole('button', { name: /^Lesson 1 -/ }); await toggle.waitFor();
        assert.equal(await toggle.getByText(/Lesson 1/).evaluate(node => Number(getComputedStyle(node).fontWeight) >= 600), true);
        assert.equal(await page.getByRole('button', { name: 'Expand', exact: true }).count(), 0);
        const expansion = await toggle.evaluate(async node => {
          const target = document.getElementById(node.getAttribute('aria-controls'));
          const next = node.closest('li').nextElementSibling;
          const before = next.getBoundingClientRect().y;
          const initialStyle = { rows: getComputedStyle(target).gridTemplateRows, transition: getComputedStyle(target).transition, display: getComputedStyle(target).display };
          await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))); 
          await new Promise(resolve => {
            const observer = new MutationObserver(() => { if (target.dataset.open === 'true') { observer.disconnect(); resolve(); } });
            observer.observe(target, { attributes: true, attributeFilter: ['data-open'] });
            node.click();
          });
          target.getBoundingClientRect();
          // Sample the real CSS engine at 40%; headless background compositor clocks may stall.
          const transitions = target.getAnimations();
          for (const animation of transitions) { animation.pause(); animation.currentTime = Number(animation.effect.getTiming().duration) * .4; }
          const middle = { height: target.getBoundingClientRect().height, next: next.getBoundingClientRect().y };
          transitions.forEach(animation => animation.finish());
          node.querySelector('svg').getAnimations().forEach(animation => animation.finish());
          return { before, initialStyle, middle, end: { height: target.getBoundingClientRect().height, next: next.getBoundingClientRect().y } };
        });
        assert.ok(expansion.end.height > 0);
        if (!reduced) {
          assert.ok(expansion.middle.height > 0 && expansion.middle.height < expansion.end.height, 'Concepts expand through intermediate heights: ' + JSON.stringify({viewport, expansion}));
          assert.ok(expansion.middle.next > expansion.before && expansion.middle.next < expansion.end.next, 'Expansion pushes following lessons down');
        }
        await toggle.click(); await toggle.click();
        assert.equal(await toggle.getAttribute('aria-expanded'), 'true', 'Rapid toggles settle on the latest selection');
        const region = page.getByRole('region', { name: /Lesson 1.*concepts/ });
        await region.getByRole('button', { name: /^View / }).first().click();
        const dialog = page.getByRole('dialog', { name: 'Concept details', exact: true }); await dialog.waitFor();
        if (!reduced) assert.ok(await dialog.evaluate(node => node.getAnimations().some(a => a.animationName === 'motion-modal-in')));
        await closeDialog(dialog);
        await page.screenshot({ path: path.join(shots, `lesson-${viewport.width}-${reduced ? 'reduced' : 'motion'}.png`), fullPage: true });
      }
      await page.setViewportSize({ width: 1600, height: 1000 });
      await open('/dashboard/staff?book=homework&page=compose-91&lesson=46');
      await page.getByRole('button', { name: '+ Add a question', exact: true }).click();
      let dialog = page.getByRole('dialog', { name: 'Add a question', exact: true });
      await dialog.getByLabel('Question', { exact: true }).fill('A local draft question');
      await dialog.getByRole('button', { name: 'Save', exact: true }).click();
      await dialog.waitFor({ state: 'hidden' });
      await page.getByRole('heading', { name: 'Question 1', exact: true }).waitFor();
      const due = page.getByLabel('Due date and time:'); await due.fill('2026-12-10T15:30');
      await switchTab(page.getByRole('group', { name: 'Homework creation method' }), page.getByRole('button', { name: 'Generate automatically', exact: true }));
      assert.equal(await due.inputValue(), '2026-12-10T15:30', 'Mode changes preserve dates');
      assert.equal(await page.getByRole('heading', { name: 'Question 1', exact: true }).count(), 1, 'Mode changes preserve saved draft questions');
      await page.getByRole('spinbutton').first().fill('2.5');
      await page.getByRole('button', { name: 'Write manually', exact: true }).click();
      await page.waitForURL(url => !url.searchParams.has('method'));
      assert.equal(await page.getByRole('button', { name: 'Send homework to class', exact: true }).evaluate(node => node.closest('form').checkValidity()), true, 'Hidden AI fields cannot block manual homework');

      await page.getByRole('button', { name: '+ Add a question', exact: true }).click();
      dialog = page.getByRole('dialog', { name: 'Add a question', exact: true });
      await dialog.getByLabel('Question', { exact: true }).fill('This must not be saved');
      await closeDialog(dialog);
      assert.equal(await page.getByRole('heading', { name: 'Question 2', exact: true }).count(), 0);
      for (const [book, second] of [['lessons', 'Completed'], ['homework', 'Previous'], ['syllabus', 'Not yet covered']]) {
        await open(`/dashboard/learner?book=${book}&page=subject-91`);
        await switchTab(page.getByRole('tablist'), page.getByRole('tab', { name: second, exact: true }));
        if (book === 'syllabus') {
          await page.getByRole('button', { name: 'Prerequisites', exact: true }).click();
          await closeDialog(page.getByRole('dialog', { name: 'Prerequisites', exact: true }));
        }
      }
      await open('/dashboard/principal?book=grades&page=class-10');
      await switchTab(page.getByRole('group', { name: 'Page filters' }), page.getByRole('button', { name: 'Subjects', exact: true }));
      await page.getByRole('button', { name: 'Edit class', exact: true }).click();
      await closeDialog(page.getByRole('dialog'));
      await open('/dashboard/manager');
      await page.getByRole('button', { name: 'Load curriculum', exact: true }).click();
      const guidance = page.locator('details').first(); await guidance.waitFor();
      await guidance.locator('summary').click();
      await guidance.getByLabel('Prerequisite 1', { exact: true }).fill('An unsaved edit that must survive collapse');
      const disclosure = await guidance.evaluate(async node => {
        const before = node.getBoundingClientRect().height;
        const summary = node.querySelector('summary');
        const collapsed = summary.getBoundingClientRect().height;
        const supported = CSS.supports('interpolate-size','allow-keywords');
        summary.click();
        let middle = node.getBoundingClientRect().height;
        if (supported && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
          // UA details-content animations are not exposed by getAnimations in every browser.
          const deadline = performance.now() + 1500;
          do { await new Promise(requestAnimationFrame); middle = node.getBoundingClientRect().height; }
          while (!(middle > collapsed + 1 && middle < before - 1) && performance.now() < deadline);
          while (node.getBoundingClientRect().height > collapsed + 1 && performance.now() < deadline) await new Promise(requestAnimationFrame);
        }
        return { before, middle, end: node.getBoundingClientRect().height, supported };
      });
      if (!reduced && disclosure.supported) assert.ok(disclosure.middle > disclosure.end && disclosure.middle < disclosure.before, 'Native curriculum disclosures collapse smoothly: ' + JSON.stringify(disclosure));
      await guidance.locator('summary').click();
      assert.equal(await guidance.getByLabel('Prerequisite 1', { exact: true }).inputValue(), 'An unsaved edit that must survive collapse');
      // Manager confirmations are app dialogs too; cancelling preserves local edits.
      await page.getByRole('button', { name: 'Remove chapter', exact: true }).click();
      await closeDialog(page.getByRole('dialog', { name: 'Confirm change', exact: true }));
      assert.equal(await page.getByLabel(/^Chapter 1/).inputValue(), 'Vectors');
      await page.getByRole('button', { name: 'Remove chapter', exact: true }).click();
      await page.getByRole('dialog', { name: 'Confirm change', exact: true }).getByRole('button', { name: 'Confirm', exact: true }).click();
      await page.getByLabel(/^Chapter 1/).waitFor({ state: 'hidden' });
      await page.getByRole('button', { name: 'Load curriculum', exact: true }).click();
      await page.getByRole('dialog', { name: 'Confirm change', exact: true }).getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.locator('dialog[open]').waitFor({ state: 'hidden' });
      assert.equal(await page.getByLabel(/^Chapter 1/).count(), 0, 'Cancel does not discard manager edits');
      await page.getByRole('button', { name: 'Load curriculum', exact: true }).click();
      await page.getByRole('dialog', { name: 'Confirm change', exact: true }).getByRole('button', { name: 'Confirm', exact: true }).click();
      await page.getByLabel(/^Chapter 1/).waitFor();
      const freshGuidance = page.locator('details').first();
      await freshGuidance.locator('summary').click();
      await freshGuidance.getByLabel('Prerequisite 1', { exact: true }).fill('Keep this if replacement is cancelled');
      await page.getByLabel('Upload spreadsheet').setInputFiles({ name: 'fixture.csv', mimeType: 'text/csv', buffer: Buffer.from('Chapter,Topic,Concept\nVectors,Components,Test') });
      await page.getByRole('dialog', { name: 'Confirm change', exact: true }).getByRole('button', { name: 'Confirm', exact: true }).click();
      await page.getByRole('dialog', { name: 'Confirm change', exact: true }).getByText(/Review this spreadsheet as a replacement/).waitFor();
      await closeDialog(page.getByRole('dialog', { name: 'Confirm change', exact: true }));
      assert.equal(await freshGuidance.getByLabel('Prerequisite 1', { exact: true }).inputValue(), 'Keep this if replacement is cancelled');
      assert.notEqual(await page.evaluate(() => document.body.style.overflow), 'hidden', 'Dialog scroll locks release after chained confirmations');
      await page.setViewportSize({ width: 390, height: 844 });
      await page.getByRole('button', { name: 'Remove chapter', exact: true }).click();
      await page.getByRole('dialog', { name: 'Confirm change', exact: true }).evaluate(async node => { await Promise.all(node.getAnimations().map(a => a.finished.catch(() => {}))); });
      assert.equal((await page.getByRole('dialog', { name: 'Confirm change', exact: true }).boundingBox()).width, 390, 'Phone sheets fill the viewport width');
      await closeDialog(page.getByRole('dialog', { name: 'Confirm change', exact: true }));
      assert.equal(await page.getByLabel(/^Chapter 1/).inputValue(), 'Vectors');
      assert.deepEqual(writes, [], 'Animation and local edits never submit data');
      assert.deepEqual(errors, []);
      await context.close();
    }
    console.log('Motion checks passed across principal, teacher, learner and manager: real slide/fade frames, moving tabs, preserved drafts, rapid toggles and reduced motion.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
