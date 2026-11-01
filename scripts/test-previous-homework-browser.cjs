/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.LEARNER_UI_URL||'http://localhost:3001';
const lessons=Array.from({length:8},(_,n)=>({id:181+n,lessonNumber:n+1,date:'2026-10-20',status:'confirmed',chapterName:'Vectors',concepts:[{id:1,name:'Resultant vectors'}],homework:[{id:61+n,activityNumber:n+1,dueDate:'2026-11-02T10:00:00Z',questions:[{id:301+n,body:`Activity ${n+1} question`,conceptId:1,memo:'Existing answer'}]}]}));
lessons[7].homework[0].questions=[{id:201,body:'Calculate the magnitude of the resultant force.',conceptId:1,memo:null},{id:202,body:'Calculate the direction of the resultant force.',conceptId:1,memo:'Use inverse tangent.'}];
const seed={aiAvailable:true,profile:{firstName:'Test',surname:'Teacher',number:'T1',username:'fixture',schoolName:'Test school'},subjects:[{id:91,subjectName:'Physical Sciences',className:'11B',classId:1,gradeNumber:11,totalConcepts:1,taughtConcepts:1,currentChapter:null,curriculum:[],lessons}],needsYou:[],comingUp:[]};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  fs.mkdirSync('.next/previous-homework-screenshots',{recursive:true});
  for(const viewport of [{width:1500,height:1000},{width:768,height:1024},{width:390,height:844}]){
   const context=await browser.newContext({viewport,reducedMotion:'reduce',serviceWorkers:'block'});
   await context.addInitScript(()=>{localStorage.setItem('accessToken','history-fixture');localStorage.setItem('accountType','person');localStorage.setItem('role','teacher');localStorage.setItem('accountId','1');localStorage.setItem('schoolId','1');localStorage.setItem('nedecen.navigation-help.v1:person:1:1',JSON.stringify({visits:4,completed:true}));});
   const data=structuredClone(seed),writes=[],generations=[],errors=[];let fail=false,failAI=false;
   await context.route('http://localhost:3000/**',route=>{
    const pathname=new URL(route.request().url()).pathname;
    if(pathname==='/staff/me/access')return route.fulfill({json:{isPrincipal:false,canTeach:true,capabilities:[],schoolId:1}});
    if(pathname==='/staff/me/dashboard')return route.fulfill({json:data});
    if(pathname==='/staff/me/notifications')return route.fulfill({json:[]});
    const generation=pathname.match(/^\/staff\/questions\/(\d+)\/generate-memo$/);
    if(generation){generations.push({id:Number(generation[1]),...route.request().postDataJSON()});return failAI?route.fulfill({status:503,json:{error:'AI temporarily unavailable. Your draft is unchanged.'}}):route.fulfill({json:{memo:`AI worked answer for question ${generation[1]}. Show the calculation step by step.`}});}
    const edit=pathname.match(/^\/staff\/questions\/(\d+)\/memo$/);
    if(edit){const body=route.request().postDataJSON();writes.push({method:route.request().method(),id:Number(edit[1]),...body});if(fail)return route.fulfill({status:503,json:{error:'Could not save this answer. Try again.'}});const question=data.subjects[0].lessons.flatMap(item=>item.homework.flatMap(activity=>activity.questions)).find(item=>item.id===Number(edit[1]));question.memo=body.memo.trim()||null;return route.fulfill({json:{id:question.id,memo:question.memo}});}
    return route.fulfill({status:404,json:{error:`Unexpected endpoint: ${pathname}`}});
   });
   const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
   await page.goto(`${base}/dashboard/staff?book=homework&page=subject-91`);
   if(viewport.width<=768)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
   await page.getByRole('button',{name:'Open Previous homework',exact:true}).click();
   const chooser=page.getByRole('combobox',{name:'Select previous homework',exact:true});
   await chooser.waitFor();assert.match(await chooser.innerText(),/Home Activity 8/);
   await page.getByRole('heading',{name:'Home Activity 8 · Lesson 8',exact:true}).waitFor();
   await chooser.click();
   assert.equal(await page.getByRole('option').count(),6,'Latest activity plus five preceding activities');
   assert.equal(await page.getByRole('option',{name:/Home Activity 1 /}).count(),0);
   await page.getByRole('option',{name:/Home Activity 7 /}).click();
   await page.waitForURL(url=>url.searchParams.get('activity')==='67');
   await page.getByText('Activity 7 question',{exact:true}).waitFor();
   await page.reload();if(viewport.width<=768)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
   assert.match(await chooser.innerText(),/Home Activity 7/);
   await chooser.click();await page.getByRole('option',{name:/Home Activity 8 /}).click();
   await page.getByRole('heading',{name:'Home Activity 8 · Lesson 8',exact:true}).waitFor();
   const questions=page.locator('ol').filter({has:page.getByRole('heading',{name:'Question 1',exact:true})});
   const first=questions.locator(':scope > li').nth(0),second=questions.locator(':scope > li').nth(1);
   await first.getByRole('button',{name:'Add answer',exact:true}).click();
   await first.getByLabel('Worked answer (optional)',{exact:true}).fill('Magnitude = 50 N.');
   fail=true;await first.getByRole('button',{name:'Save answer',exact:true}).click();
   await first.getByRole('alert').waitFor();assert.equal(await first.getByLabel('Worked answer (optional)',{exact:true}).inputValue(),'Magnitude = 50 N.');
   fail=false;await first.getByRole('button',{name:'Save answer',exact:true}).click();await first.getByText('Answer saved.',{exact:true}).waitFor();
   assert.equal(writes.at(-1).id,201);
   await second.getByRole('button',{name:'Edit answer',exact:true}).click();await second.getByLabel('Worked answer (optional)',{exact:true}).fill('Direction = 53.1° north of east.');
   await second.getByRole('button',{name:'Save answer',exact:true}).click();await second.getByText('Answer saved.',{exact:true}).waitFor();assert.equal(writes.at(-1).id,202);
   const beforeAI=writes.length;
   await first.getByRole('button',{name:'Generate answer with AI',exact:true}).click();
   const candidate=first.getByRole('region',{name:'AI answer draft',exact:true});await candidate.waitFor();
   assert.equal(writes.length,beforeAI,'Generating is not publishing');assert.equal(await first.getByRole('button',{name:'Save answer',exact:true}).isDisabled(),true);
   await candidate.getByRole('button',{name:'Discard draft',exact:true}).click();assert.equal(await first.getByLabel('Worked answer (optional)',{exact:true}).inputValue(),'Magnitude = 50 N.');
   failAI=true;await first.getByRole('button',{name:'Generate answer with AI',exact:true}).click();await first.getByRole('alert').filter({hasText:'AI temporarily unavailable'}).waitFor();
   assert.equal(await first.getByLabel('Worked answer (optional)',{exact:true}).inputValue(),'Magnitude = 50 N.','Failed generation preserves the current answer');
   failAI=false;await first.getByLabel('AI guidance (optional)',{exact:true}).fill('Show the vector calculation.');await first.getByRole('button',{name:'Generate answer with AI',exact:true}).click();
   await candidate.waitFor();assert.equal(generations.at(-1).note,'Show the vector calculation.');
   await candidate.getByRole('button',{name:'Use draft',exact:true}).click();assert.equal(writes.length,beforeAI,'Accepting a draft still requires Save');
   await first.getByLabel('Worked answer (optional)',{exact:true}).fill('Teacher-reviewed AI answer: 50 N.');await first.getByRole('button',{name:'Save answer',exact:true}).click();
   await first.getByText('Answer saved.',{exact:true}).waitFor();assert.equal(writes.at(-1).memo,'Teacher-reviewed AI answer: 50 N.');
   await page.reload();if(viewport.width<=768)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
   await page.getByText('Teacher-reviewed AI answer: 50 N.',{exact:true}).waitFor();
   await page.screenshot({path:`.next/previous-homework-screenshots/latest-${viewport.width}.png`,fullPage:true});
   const beforeCancel=writes.length;await first.getByRole('button',{name:'Edit answer',exact:true}).click();await first.getByLabel('Worked answer (optional)',{exact:true}).fill('Unsaved change');await first.getByRole('button',{name:'Cancel',exact:true}).click();assert.equal(writes.length,beforeCancel);
   data.aiAvailable=false;await page.reload();if(viewport.width<=768)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
   assert.equal(await first.getByRole('button',{name:'Generate answer with AI',exact:true}).isDisabled(),true,'Unavailable AI does not block manual editing');
   assert.equal(await first.getByRole('button',{name:'Edit answer',exact:true}).isEnabled(),true);
   assert.ok(writes.every(item=>item.method==='PATCH'));assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);assert.deepEqual(errors,[]);await context.close();
  }
  console.log('Homework history checks passed: latest default, six-activity selector, persistent selection, manual editing, AI drafts/guidance/discard/retry/review/save, unavailable-AI fallback and three screen sizes.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
