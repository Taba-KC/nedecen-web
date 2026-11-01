/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const base = process.env.LEARNER_UI_URL || 'http://localhost:3001';
const question = (id, body) => ({id,body,conceptId:1,conceptName:'Calculate a resultant vector',chapterName:'Vectors in two dimensions',topicName:'Perpendicular vectors'});
const latest = {id:63,activityNumber:3,lessonId:190,dueDate:'2026-11-02T14:00:00Z',releaseAt:'2026-01-01T10:00:00Z',canReveal:true,questions:[question(201,'Two perpendicular forces act on an object. A force of 30 N acts east and a force of 40 N acts north.\nCalculate the magnitude and direction of the resultant force.'),question(202,'Draw a labelled vector diagram.'),question(203,'Explain how you would check your calculated result using a scale drawing.')]};
const locked = {id:62,activityNumber:2,lessonId:189,dueDate:'2999-01-01T10:00:00Z',releaseAt:'2999-01-01T10:00:00Z',canReveal:false,questions:[question(191,'Locked activity question 1'),question(192,'Locked activity question 2')]};
const older = {...latest,id:61,activityNumber:1,questions:[question(181,'Earlier activity question')]};
const data = {profile:{firstName:'Test',surname:'Learner',number:'L1',username:'fixture',schoolName:'Fixture school',className:'11B',gradeNumber:11},subjects:[{id:91,subjectId:1,subjectName:'Physical Sciences',syllabus:[],lessons:[],homework:[older,locked,latest]}]};

(async () => {
  const browser = await chromium.launch({channel:'msedge',headless:true});
  try {
    fs.mkdirSync('.next/homework-chalkboard-screenshots',{recursive:true});
    for (const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1280,height:720},{width:1024,height:768},{width:1500,height:1000},{width:768,height:1024},{width:390,height:844},{width:360,height:800},{width:320,height:568}]) {
      const context = await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
      await context.addInitScript(() => {
        localStorage.setItem('accessToken','homework-fixture'); localStorage.setItem('accountType','learner');
        localStorage.setItem('accountId','1'); localStorage.setItem('schoolId','1');
        localStorage.setItem('nedecen.navigation-help.v1:learner:1:1',JSON.stringify({visits:4,completed:true}));
      });
      const reads = [], methods = [], errors = [];
      let failAnswer = true;
      await context.route('http://localhost:3000/**',async route => {
        const path = new URL(route.request().url()).pathname;
        methods.push(route.request().method());
        if (path === '/learners/me/learning-setup') return route.fulfill({json:{status:'ready'}});
        if (path === '/learners/me/workspace') return route.fulfill({json:data});
        if (path === '/learners/me/notifications') return route.fulfill({json:[]});
        const answer = path.match(/^\/learners\/me\/questions\/(\d+)\/answer$/);
        if (answer) {
          const id = Number(answer[1]); reads.push(id);
          if (id === 201) await new Promise(resolve => setTimeout(resolve,200));
          if (id === 203 && failAnswer) return route.fulfill({status:409,json:{error:'The teacher has not released this answer yet.'}});
          return route.fulfill({json:{questionId:id,memo:id === 202 ? null : `Worked answer for question ${id}.\nMagnitude = √(30² + 40²) = 50 N.\nDirection = tan⁻¹(40/30) = 53.1° north of east.`}});
        }
        return route.fulfill({status:404,json:{error:`Unexpected endpoint: ${path}`}});
      });
      const page = await context.newPage(); page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`${base}/dashboard/learner?book=homework&page=subject-91&tab=latest`);
      if (viewport.width <= 768) await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
      const board = page.getByRole('region',{name:'Homework chalkboard',exact:true});
      await board.getByRole('heading',{name:latest.questions[0].body,exact:true}).waitFor();
      assert.equal(reads.length,0,'Worked answers are never prefetched');
      const fit = async () => {
        
        const scroll = await page.locator('[data-page-scroll]').first().evaluate(node=>({height:node.clientHeight,content:node.scrollHeight,bottom:node.getBoundingClientRect().bottom,top:node.scrollTop}));
        const controls = await board.getByRole('navigation').boundingBox();
        assert.ok(scroll.content <= scroll.height + 1 && controls.y + controls.height <= scroll.bottom + 1 && controls.y + controls.height <= viewport.height, 'Homework counter stays above the footer and within the viewport');
        assert.equal(scroll.top,0);
      };
      await fit();
      await page.screenshot({path:`.next/homework-chalkboard-screenshots/question-${viewport.width}.png`,fullPage:true});
      assert.equal(await board.getByRole('button',{name:'Previous question',exact:true}).isDisabled(),true);
      await board.locator('article:not([inert]) summary').click();
      await board.locator('article:not([inert])').getByText('Calculate a resultant vector',{exact:true}).waitFor();
      assert.equal(await page.getByRole('dialog').count(),0,'Topic details stay on the board');
      await board.getByRole('button',{name:'Show answer',exact:true}).click();
      await board.getByRole('button',{name:'Next question',exact:true}).click();
      await board.getByRole('heading',{name:latest.questions[1].body,exact:true}).waitFor();
      await board.getByRole('button',{name:'Show answer',exact:true}).click();
      await board.getByText('Your teacher has not provided a worked answer for this question yet.',{exact:true}).waitFor();
      assert.equal(await board.getByRole('group',{name:'Question 2 of 3',exact:true}).getByText(/Worked answer for question 201/).count(),0,'A late response cannot appear under another question');
      await board.getByRole('button',{name:'Previous question',exact:true}).click();
      await board.getByRole('region',{name:'Worked answer',exact:true}).getByText(/Worked answer for question 201/).waitFor();
      await fit();
      await page.screenshot({path:`.next/homework-chalkboard-screenshots/answer-${viewport.width}.png`,fullPage:true});
      await board.getByRole('button',{name:'Hide answer',exact:true}).click();
      await board.getByRole('button',{name:'Show answer',exact:true}).waitFor();
      assert.equal(await board.getByRole('region',{name:'Worked answer',exact:true}).count(),0);
      const rail = board.getByRole('group',{name:'Homework questions. Swipe or use the left and right arrow keys.',exact:true});
      await rail.focus(); await page.keyboard.press('End');
      await board.getByRole('heading',{name:latest.questions[2].body,exact:true}).waitFor();
      assert.equal(await board.getByRole('button',{name:'Next question',exact:true}).isDisabled(),true);
      await board.getByRole('button',{name:'Show answer',exact:true}).click();
      await board.getByRole('alert').filter({hasText:'The teacher has not released this answer yet.'}).waitFor();
      failAnswer = false;
      await board.getByRole('button',{name:'Try answer again',exact:true}).click();
      await board.getByRole('region',{name:'Worked answer',exact:true}).getByText(/Worked answer for question 203/).waitFor();
      await page.getByRole('tab',{name:'Previous',exact:true}).click();
      await board.getByRole('heading',{name:'Locked activity question 1',exact:true}).waitFor();
      assert.equal(await board.getByRole('button',{name:'Show answer',exact:true}).isDisabled(),true);
      assert.ok(!reads.some(id=>id===191||id===192),'Locked homework never requests an answer');
      assert.equal(await board.getByRole('region',{name:'Worked answer',exact:true}).count(),0,'Answers reset when switching activity');
      await fit();
      await page.getByRole('button',{name:'All homework (3)',exact:true}).click();
      await page.getByRole('dialog',{name:'Homework activities (3)',exact:true}).getByRole('button',{name:'Home Activity 1',exact:true}).click();
      await board.getByRole('heading',{name:'Earlier activity question',exact:true}).waitFor();
      assert.match(await board.getByRole('navigation').innerText(),/1\s+of\s+1/);
      await board.getByRole('button',{name:'Show answer',exact:true}).click();
      await board.getByRole('region',{name:'Worked answer',exact:true}).getByText(/Worked answer for question 181/).waitFor();
      await page.getByRole('button',{name:'All homework (3)',exact:true}).click();
      await page.getByRole('dialog',{name:'Homework activities (3)',exact:true}).getByRole('button',{name:/^Home Activity 3/}).click();
      await board.getByRole('heading',{name:latest.questions[0].body,exact:true}).waitFor();
      assert.equal(await page.getByRole('tab',{name:'Latest',exact:true}).getAttribute('aria-selected'),'true');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
      assert.ok(methods.every(method=>method==='GET'),'The presentation adds no homework reaction writes');
      assert.deepEqual(errors,[]);
      await context.close();
    }
    console.log('Homework board checks passed: nine screen sizes, visible counter, question navigation, inline topic details and answers, release locks, stale responses, empty memos, retry, and activity history.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1});
