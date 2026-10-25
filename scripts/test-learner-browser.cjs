/* Optional browser regression: uses Playwright and isolated API fixtures, never real learner data. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const shots = path.resolve(process.env.LEARNER_SCREENSHOTS || '.next/learner-screenshots'); fs.mkdirSync(shots, { recursive: true });
const concepts = Array.from({ length: 12 }, (_, index) => ({ id: index + 1, lessonConceptId: index + 101, name: ['Resolve vectors into horizontal and vertical components', 'Determine the direction of a resultant using trigonometric ratios', 'Use the theorem of Pythagoras to calculate a resultant'][index % 3] + (index > 2 ? ` (${index + 1})` : ''), chapterName: index < 6 ? 'Vectors in two dimensions' : 'Newton’s laws', topicName: index < 6 ? 'Resultant vectors' : 'Forces and motion', prerequisites: ['Be able to identify the opposite, adjacent and hypotenuse sides of a right-angled triangle.', 'Be able to use the theorem of Pythagoras to find a missing side.'], learningOutcomes: ['Can you identify the horizontal and vertical components of a vector?', 'Can you calculate a component using the appropriate trigonometric ratio?'], answers: [null, null], taught: index < 6 }));
const subject = { id: 91, subjectId: 3, subjectName: 'Physical Sciences', syllabus: concepts, lessons: [
  { id: 45, lessonNumber: 1, date: '2026-10-09', status: 'confirmed', canRespond: false, concepts: concepts.slice(0, 2) },
  { id: 46, lessonNumber: 2, date: '2026-10-10', status: 'confirmed', canRespond: true, concepts: concepts.slice(0, 6) },
  { id: 47, lessonNumber: 3, date: '2026-10-26', status: 'planned', canRespond: false, concepts: concepts.slice(6) },
], homework: [1, 2, 3].map(n => ({ id: 80 + n, activityNumber: n, lessonId: 46, dueDate: '2026-10-29T10:00:00Z', releaseAt: n === 2 ? '2999-10-29T10:00:00Z' : '2000-01-01T10:00:00Z', canReveal: n !== 2, questions: [1, 2].map(i => ({ id: n * 10 + i, body: `A vector of magnitude 40 N acts at 30° to the horizontal. Calculate its ${i === 1 ? 'horizontal' : 'vertical'} component. Show each step in your calculation.`, conceptId: i, conceptName: concepts[i - 1].name, chapterName: concepts[i - 1].chapterName, topicName: concepts[i - 1].topicName })) })) };
const data = { profile: { firstName: 'Naledi', surname: 'Mokoena', number: 'L001', username: 'naledi', schoolName: 'Nedecen Secondary', className: '11B', gradeNumber: 11 }, subjects: [subject, { ...subject, id: 92, subjectName: 'Mathematics' }, { ...subject, id: 93, subjectName: 'English First Additional Language' }] };
const feedback = [{ id: 46, lessonId: 46, lessonNumber: 2, lessonDate: '2026-10-10', createdAt: '2026-10-10', chapterName: 'Vectors in two dimensions', totalLearners: 30, concepts: concepts.slice(0, 3).map((c, i) => ({ id: c.id, name: c.name, canReview: true, counts: { understood: 10, notUnderstood: 15, responses: 25, noResponse: 5 }, noCount: 20 - i * 4, learningGoals: c.learningOutcomes.map((goal, goalIndex) => ({ goalIndex, goal, yes: 10 + i, no: 10 - i * 2, responses: 20 - i, noResponse: 10 + i })), teachingBrief: { prerequisites: c.prerequisites, learningOutcomes: c.learningOutcomes } })) }];
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' });
  await context.addInitScript(() => { localStorage.setItem('accessToken', 'local-visual-fixture'); const staff = location.pathname.startsWith('/dashboard/staff'); localStorage.setItem('accountType', staff ? 'person' : 'learner'); if (staff) localStorage.setItem('role', 'teacher'); else localStorage.removeItem('role'); });
  const page = await context.newPage();
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  let saves = 0;
  await page.route('http://localhost:3000/**', async route => {
    const url = new URL(route.request().url());
    if (url.pathname === '/learners/me/workspace') return route.fulfill({ json: data });
    if (/\/lesson-concepts\/\d+\/goals$/.test(url.pathname)) {
      const body = route.request().postDataJSON(); const concept = concepts.find(c => c.lessonConceptId === Number(url.pathname.split('/')[4]));
      concept.answers[body.goalIndex] = body.answer; saves++;
      return route.fulfill({ json: { goalResponses: concept.answers.flatMap((answer, goalIndex) => answer ? [{ goalIndex, answer }] : []) } });
    }
    if (/\/questions\/\d+\/answer$/.test(url.pathname)) return route.fulfill({ json: { memo: 'Identify the component adjacent to the angle.\nUse Rx = R cos θ.\nRx = 40 cos 30° = 34.64 N.\nThe horizontal component is 34.64 N.' } });
    if (url.pathname === '/staff/me/dashboard') return route.fulfill({ json: { profile: { ...data.profile, title: 'Ms', number: 'T001' }, subjects: [{ ...subject, classId: 10, className: '11B', gradeNumber: 11, totalConcepts: 12, taughtConcepts: 6, currentChapter: { name: 'Vectors' }, curriculum: [] }], needsYou: [], comingUp: [] } });
    if (url.pathname.endsWith('/lesson-feedback')) return route.fulfill({ json: feedback });
    if (url.pathname.endsWith('/review-concepts')) return route.fulfill({ json: { destination: 'draft', date: null } });
    return route.fulfill({ status: 404, json: { error: 'Unexpected fixture endpoint ' + url.pathname } });
  });
  async function open(book, kind, id = 91) {
    await page.goto(`${base}/dashboard/learner?book=${book}&page=${kind}-${id}`);
    if (page.viewportSize().width <= 600) {
      await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
      await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
    }
    const titles = { upcoming: 'Physical Sciences lessons', completed: 'Physical Sciences lessons', latest: 'Physical Sciences homework', previous: 'Physical Sciences homework', covered: 'Physical Sciences syllabus', uncovered: 'Physical Sciences syllabus' };
    await page.getByRole('heading', { level: 1, name: titles[kind], exact: true }).waitFor();
    await page.waitForURL(url => url.searchParams.get('page') === `subject-${id}` && url.searchParams.get('tab') === kind);
    assert.equal(await page.locator('[data-library-workspace] section > ol > li').evaluateAll(rows => rows.every(row => Math.abs(row.querySelector('h3 > span:last-child, [data-question-text]').getBoundingClientRect().left - row.querySelector('button').getBoundingClientRect().left) < 1)), true, kind + ': actions align with the statement');
  }
  await open('lessons', 'upcoming');
  assert.equal(await page.getByRole('button', { name: 'Refresh page', exact: true }).count(), 0);
  assert.equal(await page.getByRole('button', { name: 'Close book', exact: true }).count(), 0);
  assert.equal(await page.getByText(/You are preparing for/).count(), 0);
  const firstConcept = page.locator('[role="tabpanel"] ol > li').first();
  assert.equal(await firstConcept.locator('h3').evaluate(node => getComputedStyle(node).fontWeight), '400');
  assert.match(await firstConcept.locator('h3').innerText(), /^1\./);
  await page.getByRole('tab', { name: 'Upcoming', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await page.getByRole('tab', { name: 'Completed', exact: true }).waitFor();
  await page.waitForURL(url => url.searchParams.get('tab') === 'completed');
  assert.equal(await page.getByRole('tab', { name: 'Completed', exact: true }).getAttribute('aria-selected'), 'true');
  assert.equal(await page.getByRole('tab', { name: 'Completed', exact: true }).evaluate(node => document.activeElement === node), true);
  await page.getByRole('heading', { name: 'Lesson 2 - 10 Oct 2026', exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Upcoming', exact: true }).click();
  await page.getByRole('heading', { name: 'Lesson 3 - 26 Oct 2026', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Info', exact: true }).first().click();
  await page.getByRole('dialog').getByText('Newton’s laws', { exact: true }).waitFor(); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Prerequisites', exact: true }).first().click();
  await page.getByRole('dialog').getByText(/identify the opposite/).waitFor(); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Learning goals', exact: true }).first().click();
  await page.screenshot({ path: path.join(shots, 'upcoming-goals.png') }); await page.keyboard.press('Escape');
  await page.screenshot({ path: path.join(shots, 'upcoming.png') });
  await open('lessons', 'completed');
  await page.getByRole('button', { name: 'Give feedback', exact: true }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'No', exact: true }).first().click();
  await page.getByText('Feedback saved.', { exact: true }).waitFor();
  assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'No', exact: true }).first().getAttribute('aria-pressed'), 'true');
  await page.screenshot({ path: path.join(shots, 'learner-feedback.png') });
  await page.keyboard.press('Escape');
  assert.equal(saves, 1);
  await page.getByRole('button', { name: 'All lessons (2)', exact: true }).click();
  await page.screenshot({ path: path.join(shots, 'completed-browse.png') });
  await page.getByRole('dialog', { name: 'Completed lessons (2)', exact: true }).getByRole('button', { name: /Lesson 1 -/ }).click();
  await page.waitForURL(/lesson=45/);
  await page.getByRole('button', { name: 'Give feedback', exact: true }).first().click();
  assert.equal(await page.getByRole('dialog').getByRole('button', { name: 'Yes', exact: true }).first().isDisabled(), true); await page.keyboard.press('Escape');
  await page.goBack(); await page.waitForURL(url => url.searchParams.get('page') === 'subject-91' && !url.searchParams.has('lesson'));
  await open('homework', 'latest');
  await page.getByRole('button', { name: 'Topic info', exact: true }).first().click();
  await page.getByRole('dialog').getByText('Chapter', { exact: true }).waitFor(); await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Answer', exact: true }).first().click();
  await page.getByText(/34.64 N/).waitFor(); await page.screenshot({ path: path.join(shots, 'homework-answer.png') }); await page.keyboard.press('Escape');
  await page.screenshot({ path: path.join(shots, 'homework.png') });
  await open('homework', 'previous');
  assert.equal(await page.getByRole('button', { name: 'Answer', exact: true }).first().isDisabled(), true);
  await page.getByRole('heading', { name: 'Home Activity 2', exact: true }).waitFor();
  await page.getByRole('button', { name: 'All homework (3)', exact: true }).click();
  await page.screenshot({ path: path.join(shots, 'homework-history.png') });
  await page.getByRole('dialog', { name: 'Homework activities (3)', exact: true }).getByRole('button', { name: 'Home Activity 1', exact: true }).click();
  await page.waitForURL(/activity=81/);
  assert.equal(await page.getByRole('button', { name: 'Answer', exact: true }).first().isEnabled(), true);
  await page.getByRole('button', { name: 'All homework (3)', exact: true }).click();
  await page.getByRole('dialog', { name: 'Homework activities (3)', exact: true }).getByRole('button', { name: /^Home Activity 3/ }).click();
  await page.waitForURL(url => url.searchParams.get('tab') === 'latest' && !url.searchParams.has('activity'));
  await page.getByRole('heading', { name: 'Home Activity 3', exact: true }).waitFor();
  await page.getByRole('tab', { name: 'Latest', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await page.waitForURL(url => url.searchParams.get('tab') === 'previous');
  await page.getByRole('heading', { name: 'Home Activity 2', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Answer', exact: true }).first().isDisabled(), true);
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport); await open('homework', 'previous');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Homework must fit the viewport');
    await page.screenshot({ path: path.join(shots, `homework-previous-${viewport.width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 1600, height: 1000 });
  for (const kind of ['covered', 'uncovered']) { await open('syllabus', kind); assert.equal(await page.locator('section[aria-label="Concepts"] > ol > li').count(), 6); }
  await page.getByRole('tab', { name: 'Covered', exact: true }).click();
  await page.waitForURL(url => url.searchParams.get('tab') === 'covered');
  assert.equal(await page.locator('section[aria-label="Concepts"] > ol > li').count(), 6);
  await page.getByRole('button', { name: 'Prerequisites', exact: true }).first().click();
  await page.getByRole('dialog').getByText(/identify the opposite/).waitFor(); await page.keyboard.press('Escape');
  await page.getByRole('tab', { name: 'Covered', exact: true }).focus(); await page.keyboard.press('ArrowRight');
  await page.waitForURL(url => url.searchParams.get('tab') === 'uncovered');
  assert.equal(await page.getByRole('tab', { name: 'Not yet covered', exact: true }).evaluate(node => document.activeElement === node), true);
  await page.getByRole('button', { name: 'Learning goals', exact: true }).first().click();
  await page.getByRole('dialog').getByText('Can you identify the horizontal and vertical components of a vector?', { exact: true }).waitFor(); await page.keyboard.press('Escape');
  await page.screenshot({ path: path.join(shots, 'syllabus.png') });
  for (const viewport of [{ width: 320, height: 568 }, { width: 390, height: 844 }, { width: 768, height: 1024 }]) {
    await page.setViewportSize(viewport); await open('syllabus', 'uncovered');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Syllabus must fit the viewport');
    await page.screenshot({ path: path.join(shots, `syllabus-${viewport.width}.png`), fullPage: true });
  }
  await page.setViewportSize({ width: 390, height: 844 }); await open('lessons', 'upcoming');
  await page.screenshot({ path: path.join(shots, 'mobile-upcoming.png'), fullPage: true });
  await open('lessons', 'completed');
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, 'Mobile must not overflow horizontally');
  await page.screenshot({ path: path.join(shots, 'mobile.png'), fullPage: true });
  await page.getByRole('button', { name: 'Give feedback', exact: true }).first().click();
  await page.screenshot({ path: path.join(shots, 'mobile-feedback.png') }); await page.keyboard.press('Escape');
  await page.setViewportSize({ width: 1600, height: 1000 });
  await page.goto(`${base}/dashboard/staff?book=lessons&page=lesson-feedback-91`);
  await page.getByRole('heading', { name: 'Learning goals mostly not met', exact: true }).waitFor();
  await page.screenshot({ path: path.join(shots, 'teacher-feedback.png') });
  await page.getByRole('button', { name: 'Add related concept to next lesson', exact: true }).first().click();
  await page.getByText(/Saved to your next lesson draft/).waitFor();
  assert.deepEqual(errors, []);
  console.log('Browser checks passed: learner pages and dialogs, Yes/No save, history navigation, answer locks, mobile overflow and teacher review action. Screenshots: ' + shots);
  await browser.close();
})().catch(error => { console.error(error); process.exit(1); });
