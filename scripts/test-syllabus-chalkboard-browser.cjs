/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.LEARNER_UI_URL||'http://localhost:3001';
const syllabus=[
 {id:1,name:'Use Rₓ = R cos(θ) for the resultant x-component',taught:true,prerequisites:['Identify the adjacent side of a right-angled triangle.'],learningOutcomes:['Calculate a horizontal component.']},
 {id:2,name:'Use Rᵧ = R sin(θ) for the resultant y-component',taught:true,prerequisites:['Identify the opposite side of a right-angled triangle.'],learningOutcomes:['Calculate a vertical component.']},
 {id:3,name:'Find the resultant vector using a scale drawing and check its magnitude and direction by calculation',taught:true,prerequisites:Array.from({length:15},(_,n)=>`Revision idea ${n+1}: apply the rules for perpendicular vectors.`),learningOutcomes:['Compare the calculated and graphical resultant.']},
 {id:4,name:'Explore Newton’s first law',taught:false,prerequisites:[],learningOutcomes:[]},
 {id:5,name:'Explore Newton’s second law',taught:false,prerequisites:['Describe mass and acceleration.'],learningOutcomes:['Apply F = ma.']},
].map(item=>({...item,chapterName:'Vectors in two dimensions',topicName:'Components and resultants'}));
const seed={profile:{firstName:'Test',surname:'Learner',number:'L1',username:'fixture',schoolName:'Test school',className:'11B',gradeNumber:11},subjects:[{id:91,subjectId:1,subjectName:'Physical Sciences',syllabus,lessons:[],homework:[]}]};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  fs.mkdirSync('.next/syllabus-chalkboard-screenshots',{recursive:true});
  for(const viewport of [{width:1920,height:1080},{width:1366,height:768},{width:1024,height:768},{width:768,height:1024},{width:390,height:844},{width:360,height:800},{width:320,height:568}]){
   const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
   await context.addInitScript(()=>{localStorage.setItem('accessToken','syllabus-fixture');localStorage.setItem('accountType','learner');localStorage.setItem('accountId','1');localStorage.setItem('schoolId','1');localStorage.setItem('nedecen.navigation-help.v1:learner:1:1',JSON.stringify({visits:4,completed:true}));});
   const data=structuredClone(seed),methods=[],errors=[];
   await context.route('http://localhost:3000/**',route=>{methods.push(route.request().method());const path=new URL(route.request().url()).pathname;if(path==='/learners/me/learning-setup')return route.fulfill({json:{status:'ready'}});if(path==='/learners/me/workspace')return route.fulfill({json:data});if(path==='/learners/me/notifications')return route.fulfill({json:[]});return route.fulfill({status:404,json:{error:`Unexpected endpoint: ${path}`}});});
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`${base}/dashboard/learner?book=syllabus&page=subject-91&tab=covered`);
   if(viewport.width===768||viewport.width<=600)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
   const board=page.getByRole('region',{name:'Syllabus chalkboard',exact:true});
   const next=board.getByRole('button',{name:'Next concept',exact:true}),previous=board.getByRole('button',{name:'Previous concept',exact:true});
   const fit=async()=>{
    const scroll=await page.locator('[data-page-scroll]').first().evaluate(node=>({top:node.scrollTop,content:node.scrollHeight,height:node.clientHeight,bottom:node.getBoundingClientRect().bottom}));
    const controls=await board.getByRole('navigation').boundingBox();
    assert.ok(scroll.content<=scroll.height+1&&controls.y+controls.height<=scroll.bottom+1&&controls.y+controls.height<=viewport.height,'Syllabus board and controls fit the workspace');
    assert.equal(scroll.top,0);
   };
   await board.getByRole('heading',{name:syllabus[0].name,exact:true}).waitFor();await fit();
   assert.equal(await previous.isDisabled(),true);assert.match(await board.getByRole('navigation').innerText(),/1\s+of\s+3/);
   assert.equal(await board.getByRole('heading',{name:syllabus[3].name,exact:true}).count(),0,'Covered contains only taught concepts');
   await page.screenshot({path:`.next/syllabus-chalkboard-screenshots/covered-${viewport.width}.png`,fullPage:true});
   await next.click();await board.getByRole('heading',{name:syllabus[1].name,exact:true}).waitFor();
   await board.locator('article:not([inert]) summary').click();await board.getByText('Calculate a vertical component.',{exact:true}).waitFor();
   assert.equal(await page.getByRole('dialog').count(),0,'Guidance stays on the board');
   const rail=board.getByRole('group',{name:'Syllabus concepts. Swipe or use the left and right arrow keys.',exact:true});
   await rail.focus();await page.keyboard.press('End');await board.getByRole('heading',{name:syllabus[2].name,exact:true}).waitFor();assert.equal(await next.isDisabled(),true);
   await board.locator('article:not([inert]) summary').click();await board.getByText('Compare the calculated and graphical resultant.',{exact:true}).scrollIntoViewIfNeeded();await fit();
   await page.getByRole('tab',{name:'Not yet covered',exact:true}).click();
   await board.getByRole('heading',{name:syllabus[3].name,exact:true}).waitFor();assert.match(await board.getByRole('navigation').innerText(),/1\s+of\s+2/);await fit();
   await board.getByText('No prerequisites listed. You can start right here.',{exact:true}).waitFor();
   await board.locator('article:not([inert]) summary').click();await board.getByText('No learning goals have been added yet.',{exact:true}).waitFor();
   await next.click();await board.getByRole('heading',{name:syllabus[4].name,exact:true}).waitFor();
   await page.getByRole('tab',{name:'Covered',exact:true}).click();await board.getByRole('heading',{name:syllabus[0].name,exact:true}).waitFor();assert.match(await board.getByRole('navigation').innerText(),/1\s+of\s+3/,'Changing filters restarts at the first concept');
   assert.equal(await board.getByRole('button',{name:'Submit feedback',exact:true}).count(),0,'Syllabus exploration does not submit lesson feedback');
   data.subjects[0].syllabus.forEach(item=>{item.taught=true;});
   await page.getByRole('tab',{name:'Not yet covered',exact:true}).click();await page.waitForURL(/tab=uncovered/);await page.reload();
   if(viewport.width===768||viewport.width<=600)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
   await page.getByText('All current syllabus concepts have been covered.',{exact:true}).waitFor();assert.equal(await board.count(),0);
   data.subjects[0].syllabus=[];await page.reload();
   if(viewport.width===768||viewport.width<=600)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
   await page.getByText('No curriculum has been added for this subject yet.',{exact:true}).waitFor();
   assert.ok(methods.every(method=>method==='GET'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Syllabus board checks passed: seven viewport sizes, coverage filters, concept arrows/keyboard, inline guidance, long content, visible counter, filter resets, read-only exploration and empty states.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
