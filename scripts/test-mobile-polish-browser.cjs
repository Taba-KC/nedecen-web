/* Isolated fixtures: verify mobile icons, desktop labels and preserved action behaviour. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const shots = path.resolve('.next/mobile-polish-screenshots'); fs.mkdirSync(shots, { recursive: true });
const concept = { id: 1, lessonConceptId: 101, name: 'Determine the direction of a resultant using simple trigonometric ratios', chapterName: 'Vectors', topicName: 'Components', prerequisites: ['Identify opposite and adjacent sides.'], learningOutcomes: ['Can you calculate the angle?'], answers: [null], taught: true };
const chapter = { id: 1, name: 'Vectors', total: 1, taught: 0, topics: [{ id: 1, name: 'Components', concepts: [concept] }] };
const lesson = { id: 45, lessonNumber: 1, date: '2000-01-01', status: 'planned', concepts: [concept], homework: [] };
const subject = { id: 91, subjectId: 3, subjectName: 'Physical Sciences', classId: 10, className: '11B', gradeNumber: 11, totalConcepts: 1, taughtConcepts: 0, currentChapter: { name: 'Vectors' }, curriculum: [chapter], syllabus: [concept], homework: [{id:81,activityNumber:1,lessonId:46,dueDate:'2999-01-01T10:00:00Z',releaseAt:null,canReveal:false,questions:[{id:71,body:'Determine the angle of the resultant vector.',conceptName:concept.name,chapterName:'Vectors',topicName:'Components'}]}], lessons: [lesson, { ...lesson, id: 46, lessonNumber: 2, status: 'confirmed', canRespond: true }] };
const data = { profile: { firstName: 'Test', surname: 'Account', number: 'X001', username: 'fixture', schoolName: 'Test school' }, subjects: [subject], needsYou: [], comingUp: [] };
(async () => {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge', headless: true });
  try {
    for (const viewport of process.env.MOBILE_ENTRY_ONLY ? [] : [{ width: 320, height: 740 }, { width: 360, height: 800 }, { width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1600, height: 1000 }].filter(viewport=>!process.env.MOBILE_WIDTH||viewport.width===Number(process.env.MOBILE_WIDTH))) {
      const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
      await context.addInitScript(() => {
        const role = location.pathname.split('/')[2];
        localStorage.setItem('accessToken', 'icons-fixture'); localStorage.setItem('schoolId', '1');
        localStorage.setItem('accountType', role === 'manager' ? 'manager' : role === 'learner' ? 'learner' : 'person');
        localStorage.setItem('role', role === 'staff' ? 'teacher' : role);
      });
      const errors = [], writes = [];
      await context.route('http://localhost:3000/**', route => {
        if (new URL(route.request().url()).pathname === '/staff/me/access') return route.fulfill({ json: { isPrincipal: true, canTeach: true, capabilities: ['grades','streams','staff','learners','curriculum'], schoolId: 1 } });
        if (new URL(route.request().url()).pathname === '/learners/me/learning-setup') return route.fulfill({ json: { status: 'ready' } });
        const request = route.request(), p = new URL(request.url()).pathname;
        if (request.method() !== 'GET') writes.push(p);
        let json = [];
        if (p.endsWith('/dashboard') || p.endsWith('/workspace')) json = data;
        else if (p === '/schools/1/grades') json = [{ id: 11, number: 11 }];
        else if (p === '/schools/1/grades/11/classes') json = [{ id: 10, gradeId: 11, name: '11B', streamId:4,streamIds:[4],academicYear:2026 }];
        else if(p==='/schools/1/streams')json=[{id:4,name:'Science'}];
        else if(p==='/schools/1/streams/4/subjects')json=[{id:91,subjectId:3,subjectName:'Physical Sciences'}];
        else if(p==='/subjects')json=[{id:3,name:'Physical Sciences'}];
        else if(p==='/schools/1/people')json=[{id:1,title:'Ms',firstName:'Naledi',surname:'Mokoena',staffNumber:'T001',accountSetUp:true,assignedChapterCount:1}];
        else if(p==='/schools/1/classes/10/learners')json=[{id:2,firstName:'Kgomotso',surname:'Mahlangu',admissionNumber:'L001',accountSetUp:true}];
        else if(p==='/subjects/3/grades/11/chapters')json=[chapter];
        else if(p==='/chapters/1/concepts')json=[concept];
        else if(p.endsWith('/planning'))json={chapter,chapters:[chapter],customConcepts:[],reviewConcepts:[],planningConcepts:[concept],taughtConceptIds:[],flaggedConcepts:[],suggestedDate:'2026-10-28'};
        else if(p.endsWith('/lesson-feedback'))json=[];
        else if (p === '/schools/1/classes/10/subjects') json = [{ id: 91, subjectName: 'Physical Sciences' }];
        else if (p.endsWith('/homework-context')) json = { concepts: [concept], existingHomeworkId: null, aiAvailable: false };
        else if (p === '/manager/subjects') json = [{ id: 3, name: 'Physical Sciences' }];
        else if (p.startsWith('/manager/curricula/')) json = { subjectId: 3, gradeNumber: 11, revision: 1, exists: true, chapters: [chapter] };
        return route.fulfill({ json });
      });
      const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
      async function open(url) {
        await page.goto(base + url);
        if (viewport.width <= 768 && !url.includes('/manager')) {
          await page.getByRole('dialog', { name: 'Chapters and headings' }).waitFor();
          await page.getByRole('button', { name: 'Close pages menu', exact: true }).click();
        }
        assert.equal(await page.getByRole('button', { name: 'Close book', exact: true }).count(), 0);
      }
      async function checkIcon(button) {
        await button.waitFor();
        const result = await button.evaluate(node => ({ iconVisible: !!node.querySelector('svg')?.getClientRects().length, width: node.getBoundingClientRect().width, height: node.getBoundingClientRect().height, label: node.getAttribute('aria-label') }));
        assert.ok(result.label);
        assert.equal(result.iconVisible, viewport.width <= 600, 'Icons appear only on phones');
        if (viewport.width <= 600) { assert.ok(result.width >= 44); assert.ok(result.height >= 44); }
      }
      async function noOverflow() { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true); }
      await open('/dashboard/principal?book=grades&page=class-10');
      await checkIcon(page.getByRole('button', { name: 'Edit class', exact: true }));
      await checkIcon(page.getByRole('button', { name: 'Delete class', exact: true }));
      await page.screenshot({ path: path.join(shots, `principal-learners-${viewport.width}.png`) });
      await page.getByRole('button', { name: 'Edit class', exact: true }).click();
      await page.getByRole('dialog').getByLabel('Class label (for example A)', { exact: true }).waitFor();
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Delete class', exact: true }).click();
      await page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.getByRole('button', { name: 'Subjects', exact: true }).click();
      const subjects = page.getByRole('region', { name: 'Subjects & teachers', exact: true });
      await subjects.getByRole('button', { name: 'Assign teacher', exact: true }).waitFor();
      for (const label of ['Manage streams', 'Assign teacher', 'Curriculum']) {
        assert.equal(await subjects.getByRole('button', { name: label, exact: true }).locator('svg').count(), 0, 'Subjects tab retains text actions');
      }
      await page.screenshot({ path: path.join(shots, `principal-subjects-${viewport.width}.png`) }); await noOverflow();
      for(const [book,pageId] of [['staff','staff'],['streams','my-streams'],['learners','learners'],['curriculum','curriculum-11-3']]){await open('/dashboard/principal?book='+book+'&page='+pageId);await page.locator('[data-page-heading] h1').waitFor();await page.screenshot({path:path.join(shots,`principal-${book}-${viewport.width}.png`)});await noOverflow();}
      await open('/dashboard/staff?book=lessons&page=plan-91');await page.getByRole('button',{name:'Add a concept',exact:false}).waitFor();await page.screenshot({path:path.join(shots,`teacher-planning-${viewport.width}.png`)});await noOverflow();
      await open('/dashboard/staff?book=lessons&page=confirm-91');
      await checkIcon(page.getByRole('button', { name: 'Confirm taught lesson', exact: true }));
      await page.getByRole('button', { name: /^Lesson 1/ }).click();
      await checkIcon(page.getByRole('button', { name: `View ${concept.name}`, exact: true }));
      await page.getByRole('button', { name: `View ${concept.name}`, exact: true }).click();
      await page.getByRole('dialog', { name: 'Concept details', exact: true }).waitFor(); await page.keyboard.press('Escape');
      await page.screenshot({ path: path.join(shots, `teacher-lessons-${viewport.width}.png`) }); await noOverflow();
      await open('/dashboard/staff?book=homework&page=compose-91&lesson=46');
      await checkIcon(page.getByRole('button', { name: '+ Add a question', exact: true }));
      await page.getByRole('button', { name: '+ Add a question', exact: true }).click();
      const dialog = page.getByRole('dialog', { name: 'Add a question', exact: true });
      await dialog.getByLabel('Question', { exact: true }).fill('A draft question');
      await dialog.getByRole('button', { name: 'Save', exact: true }).click();
      await checkIcon(page.getByRole('button', { name: 'View question 1', exact: true }));
      await checkIcon(page.getByRole('button', { name: 'Delete question 1', exact: true }));
      await page.screenshot({ path: path.join(shots, `teacher-homework-${viewport.width}.png`) });
      await page.getByRole('button', { name: 'Delete question 1', exact: true }).click();
      assert.equal(await page.getByRole('heading', { name: 'Question 1', exact: true }).count(), 0);
      await open('/dashboard/learner?book=lessons&page=subject-91');
      for (const label of ['Info', 'Prerequisites', 'Learning goals']) {
        const button = page.getByRole('button', { name: label, exact: true });
        assert.equal(await button.locator('svg').count(), 0);
        assert.equal(await button.innerText(), label);
      }
      await page.screenshot({ path: path.join(shots, `learner-${viewport.width}.png`) }); await noOverflow();
      for(const [book,tab] of [['lessons','completed'],['homework','latest'],['homework','previous'],['syllabus','covered'],['syllabus','uncovered']]){await open('/dashboard/learner?book='+book+'&page=subject-91&tab='+tab);await page.locator('[data-page-heading] h1').waitFor();await page.screenshot({path:path.join(shots,`learner-${book}-${tab}-${viewport.width}.png`)});await noOverflow();}
      await open('/dashboard/manager');
      await page.getByRole('button', { name: 'Load curriculum', exact: true }).click();
      await checkIcon(page.getByRole('button', { name: 'Move up', exact: true }));
      await checkIcon(page.getByRole('button', { name: 'Remove chapter', exact: true }));
      await page.getByRole('button', { name: 'Remove chapter', exact: true }).click();
      await page.getByRole('dialog', { name: 'Confirm change', exact: true }).getByRole('button', { name: 'Cancel', exact: true }).click();
      await page.screenshot({ path: path.join(shots, `manager-${viewport.width}.png`) }); await noOverflow();
      assert.deepEqual(writes, [], 'Testing never mutates real or fixture server data');
      assert.deepEqual(errors, []);
      await context.close();
    }
    const entry=await browser.newContext({viewport:{width:360,height:800}});
    const entryPage=await entry.newPage();
    for(const [name,url] of [['sign-in','/'],['staff-claim','/onboard/staff'],['learner-claim','/onboard/learner'],['manager-login','/manager/login']]){await entryPage.goto(base+url);await entryPage.locator('input').first().waitFor();assert.equal(await entryPage.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.ok(await entryPage.locator('input').first().evaluate(node=>parseFloat(getComputedStyle(node).fontSize)>=16));await entryPage.screenshot({path:path.join(shots,`entry-${name}-360.png`),fullPage:true});}
    await entry.close();
    console.log(process.env.MOBILE_ENTRY_ONLY?'Phone entry checks passed: sign in, staff/learner account claim, manager sign in, readable inputs and no overflow.':'Mobile polish checks passed: principal books, teacher planning/confirmation/homework, learner lessons/homework/syllabus, manager editor, entry forms, action behavior and no overflow.');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
