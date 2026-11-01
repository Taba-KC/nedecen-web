/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const concepts = [
  { name: 'Determining the Direction of the Resultant Using Simple Trigonometric Ratios', prerequisites: ['Identify the opposite, adjacent and hypotenuse of a right-angled triangle.', 'Use sine, cosine and tangent to find an unknown angle.'], learningOutcomes: ['Calculate the direction of a resultant vector.', 'Explain the angle relative to a reference direction.'] },
  { name: 'Meet the cell membrane', prerequisites: ['Identify the outside boundary of a cell.'], learningOutcomes: ['Describe the role of the cell membrane.'] },
  { name: 'Find the nucleus', prerequisites: [], learningOutcomes: ['Identify the nucleus in a cell diagram.'] },
  { name: 'Compare the specialised structures found in plant and animal cells and explain how each structure supports its function', prerequisites: Array.from({length: 12}, (_, i) => `Revision idea ${i + 1}: recognise and describe familiar cell structures.`), learningOutcomes: ['Compare plant and animal cells.'] },
  { name: 'Discover how cells work together', prerequisites: ['Know what a tissue is.'], learningOutcomes: [] },
  { name: 'Put the pieces together', prerequisites: ['Revisit the structures of a cell.'], learningOutcomes: ['Label a complete cell diagram.'] },
].map((concept, index) => ({ ...concept, id: index + 1, lessonConceptId: index + 10, chapterName: 'The chemistry of life', topicName: 'Cells', answers: [null] }));
const subject = { id: 91, subjectId: 1, subjectName: 'Life Sciences', syllabus: [], homework: [], lessons: [
  { id: 191, lessonNumber: 2, date: '2026-11-02', status: 'planned', canRespond: false, concepts },
  { id: 190, lessonNumber: 2, date: '2026-10-30', status: 'confirmed', canRespond: true, concepts },
  { id: 189, lessonNumber: 1, date: '2026-10-29', status: 'confirmed', canRespond: false, concepts: [{...concepts[0],name:'An earlier lesson concept',lessonConceptId:99}] },
] };
const data = { profile: { firstName: 'Test', surname: 'Learner', number: 'L1', username: 'fixture', schoolName: 'Test school', className: '11B', gradeNumber: 11 }, subjects: [subject] };
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    fs.mkdirSync('.next/chalkboard-screenshots', { recursive: true });
    for (const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:1024,height:768},{width:1500,height:1000}, {width:768,height:1024}, {width:390,height:844}, {width:360,height:800}, {width:320,height:568}]) {
      const context = await browser.newContext({ viewport, reducedMotion: viewport.width === 1500 ? 'no-preference' : 'reduce', serviceWorkers: 'block' });
      const feedbackWrites = [];
      const workspace = structuredClone(data);
      let failSubmission = false;
      await context.addInitScript(() => {
        localStorage.setItem('accessToken', 'chalkboard-fixture'); localStorage.setItem('accountType', 'learner');
        localStorage.setItem('accountId', '1'); localStorage.setItem('schoolId', '1');
        localStorage.setItem('nedecen.navigation-help.v1:learner:1:1', JSON.stringify({visits:4, completed:true}));
      });
      await context.route('http://localhost:3000/**', route => {
        const path = new URL(route.request().url()).pathname;
        if (path === '/learners/me/learning-setup') return route.fulfill({json:{status:'ready'}});
        if (path === '/learners/me/workspace') return route.fulfill({json:workspace});
        if (path === '/learners/me/notifications') return route.fulfill({json:[]});
        if (/^\/learners\/me\/lesson-concepts\/\d+\/feedback$/.test(path)) {
          const body = route.request().postDataJSON(); feedbackWrites.push({path,...body});
          if (failSubmission) return route.fulfill({status:503,json:{error:'Could not submit feedback. Please try again.'}});
          const association = Number(path.split('/')[4]);
          for (const lesson of workspace.subjects[0].lessons.filter(item => item.status === 'confirmed')) for (const concept of lesson.concepts) if (concept.lessonConceptId === association) concept.answers = concept.learningOutcomes.map((_, n) => body.answers.find(item => item.goalIndex === n)?.answer ?? null);
          return route.fulfill({json:{goalResponses:body.answers}});
        }
        return route.fulfill({status:404,json:{error:'Unexpected fixture endpoint'}});
      });
      const page = await context.newPage(), errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(`${base}/dashboard/learner?book=lessons&page=subject-91&tab=upcoming`);
      if (viewport.width <= 768) await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
      const board = page.getByRole('region',{name:'Lesson chalkboard',exact:true});
      await board.waitFor();
      const settle = position => page.waitForFunction(expected => { const rail = document.querySelector('[aria-label="Lesson concepts. Swipe or use the left and right arrow keys."]'); return rail && Math.abs(rail.scrollLeft - expected * rail.clientWidth) < 2; }, position);
      const previous = board.getByRole('button',{name:'Previous concept',exact:true});
      const next = board.getByRole('button',{name:'Next concept',exact:true});
      assert.equal(await previous.isDisabled(),true);
      assert.equal(await board.getByRole('heading',{name:concepts[0].name,exact:true}).count(),1);
      {
        const fit = await page.locator('[data-page-scroll]').first().evaluate(element => ({ top:element.scrollTop, height:element.clientHeight, content:element.scrollHeight, bottom:element.getBoundingClientRect().bottom }));
        const controls = await board.getByRole('navigation').boundingBox();
        assert.ok(fit.content <= fit.height + 1, `Mobile workspace must fit without scrolling: ${JSON.stringify(fit)}`);
        assert.equal(fit.top, 0, 'Counter is visible from the initial page position');
        assert.ok(controls.y + controls.height <= fit.bottom + 1 && controls.y + controls.height <= viewport.height, 'Concept counter and arrows fit above the page footer and within the viewport');
      }
      await board.screenshot({path:`.next/chalkboard-screenshots/board-${viewport.width}.png`});
      await page.screenshot({path:`.next/chalkboard-screenshots/workspace-${viewport.width}.png`,fullPage:true});
      await next.click(); await settle(1);
      await board.getByRole('heading',{name:concepts[1].name,exact:true}).waitFor();
      assert.match(await board.getByRole('navigation').innerText(),/2\s+of\s+6/);
      const rail = board.getByRole('group',{name:'Lesson concepts. Swipe or use the left and right arrow keys.',exact:true});
      await rail.focus(); await page.keyboard.press('ArrowRight'); await settle(2);
      await board.getByText('No prerequisites listed. You can start right here.',{exact:true}).waitFor();
      await page.keyboard.press('End'); await settle(5);
      assert.equal(await next.isDisabled(),true);
      await previous.click(); await settle(4);
      await board.getByRole('heading',{name:concepts[4].name,exact:true}).waitFor();
      await board.locator('article:not([inert]) summary').click();
      await board.getByText('No learning goals have been added yet.',{exact:true}).waitFor();
      await previous.click(); await settle(3);
      const long = board.getByRole('group',{name:'Concept 4 of 6',exact:true});
      await long.getByRole('heading',{name:concepts[3].name,exact:true}).waitFor();
      await long.locator('summary').click();
      await long.getByText('Compare plant and animal cells.',{exact:true}).scrollIntoViewIfNeeded();
      assert.equal(await page.locator('[data-page-scroll]').first().evaluate(element => element.scrollTop), 0, 'Reading long board content does not move the counter out of view');
      await rail.evaluate(element => element.scrollTo({left:0,behavior:'instant'})); await settle(0);
      await board.getByRole('heading',{name:concepts[0].name,exact:true}).waitFor();
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      // Tab changes keep the existing completed-lesson feedback workflow.
      await page.getByRole('tab',{name:'Completed',exact:true}).click();
      await board.getByText(/Concepts from your lesson/).waitFor();
      await page.getByRole('button',{name:'All lessons (2)',exact:true}).waitFor();
      {
        const fit = await page.locator('[data-page-scroll]').first().evaluate(element => ({height:element.clientHeight,content:element.scrollHeight,bottom:element.getBoundingClientRect().bottom}));
        const controls = await board.getByRole('navigation').boundingBox();
        assert.ok(fit.content <= fit.height + 1 && controls.y + controls.height <= fit.bottom + 1 && controls.y + controls.height <= viewport.height, 'Completed lesson counter fits without page scrolling');
      }
      await page.screenshot({path:`.next/chalkboard-screenshots/completed-${viewport.width}.png`,fullPage:true});
      const submit = board.getByRole('button',{name:'Submit feedback',exact:true});
      await submit.click();
      await board.getByRole('alert').filter({hasText:'Choose Yes or No for each learning goal.'}).waitFor();
      assert.equal(feedbackWrites.length,0,'Incomplete feedback is not sent');
      const firstGoal = () => board.getByRole('group',{name:concepts[0].learningOutcomes[0],exact:true});
      const secondGoal = () => board.getByRole('group',{name:concepts[0].learningOutcomes[1],exact:true});
      await firstGoal().getByRole('button',{name:'Yes',exact:true}).click();
      await secondGoal().getByRole('button',{name:'No',exact:true}).click();
      await page.screenshot({path:`.next/chalkboard-screenshots/inline-feedback-${viewport.width}.png`,fullPage:true});
      assert.equal(feedbackWrites.length,0,'Choosing answers does not autosave');
      await board.getByRole('button',{name:'Next concept',exact:true}).click(); await settle(1);
      const otherGoal = board.getByRole('group',{name:concepts[1].learningOutcomes[0],exact:true});
      await otherGoal.getByRole('button',{name:'Yes',exact:true}).click();
      failSubmission = true;
      await submit.click();
      await board.getByRole('alert').filter({hasText:'Could not submit feedback. Please try again.'}).waitFor();
      assert.equal(await otherGoal.getByRole('button',{name:'Yes',exact:true}).getAttribute('aria-pressed'),'true','Failed submissions preserve choices');
      failSubmission = false;
      await submit.click();
      await board.getByText('Feedback submitted.',{exact:true}).waitFor();
      assert.equal(feedbackWrites.at(-1).path, `/learners/me/lesson-concepts/${concepts[1].lessonConceptId}/feedback`, 'Feedback belongs to the visible concept');
      assert.equal(await page.getByRole('dialog').count(),0,'Feedback is submitted directly on the board');
      await board.getByRole('button',{name:'Previous concept',exact:true}).click(); await settle(0);
      assert.equal(await firstGoal().getByRole('button',{name:'Yes',exact:true}).getAttribute('aria-pressed'),'true','Drafts survive concept navigation');
      assert.equal(await secondGoal().getByRole('button',{name:'No',exact:true}).getAttribute('aria-pressed'),'true');
      await submit.click();
      await board.getByText('Feedback submitted.',{exact:true}).waitFor();
      assert.deepEqual(feedbackWrites.at(-1).answers,[{goalIndex:0,answer:'yes'},{goalIndex:1,answer:'no'}],'All selected goals are submitted together');
      assert.equal(await submit.isDisabled(),true,'An unchanged submission cannot be sent twice');
      await secondGoal().getByRole('button',{name:'Yes',exact:true}).click();
      await submit.click();
      await board.getByText('Feedback submitted.',{exact:true}).waitFor();
      await page.reload();
      if (viewport.width <= 768) await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
      await firstGoal().getByRole('button',{name:'Yes',exact:true}).waitFor();
      assert.equal(await secondGoal().getByRole('button',{name:'Yes',exact:true}).getAttribute('aria-pressed'),'true','Saved feedback is restored after reload');
      await page.getByRole('button',{name:'All lessons (2)',exact:true}).click();
      await page.getByRole('dialog',{name:'Completed lessons (2)',exact:true}).getByRole('button',{name:'Lesson 1 - 29 Oct 2026',exact:true}).click();
      await board.getByRole('heading',{name:'An earlier lesson concept',exact:true}).waitFor();
      assert.match(await board.getByRole('navigation').innerText(),/1\s+of\s+1/);
      await board.getByText('Feedback closed. Your saved answers are shown.',{exact:true}).waitFor();
      assert.equal(await board.getByRole('button',{name:'Yes',exact:true}).first().isDisabled(),true,'Historical feedback remains read-only');
      assert.equal(await submit.isDisabled(),true);
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('Chalkboard checks passed: arrows, swipe scrolling, keyboard, boundaries, six concepts, long content, empty prerequisites/goals, completed feedback and nine viewport sizes with controls visible without page scrolling.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
