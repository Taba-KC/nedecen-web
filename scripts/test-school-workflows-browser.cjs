/* Mocked API browser checks: no production learners or assignments are changed. */
/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const shots='.next/school-workflows-screenshots';fs.mkdirSync(shots,{recursive:true});
const base=process.env.LEARNER_UI_URL||'http://localhost:3001';
const common={id:1,name:'Mathematics'},agric={id:2,name:'Agricultural Sciences'},geo={id:3,name:'Geography'};
const streams=[{id:1,name:'Agriculture',subjects:[common,agric]},{id:2,name:'Geography',subjects:[common,geo]}];
const cls={id:10,gradeId:11,name:'11A',streamId:1,streamIds:[1],academicYear:2026,learnerCount:1};
const teacherData={profile:{title:'Ms',firstName:'Test',surname:'Teacher',schoolName:'Test school',number:'T1'},subjects:[],needsYou:[],comingUp:[]};
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:1280,height:900},reducedMotion:'reduce'});
  await context.addInitScript(()=>{localStorage.setItem('accessToken','fixture');localStorage.setItem('accountType','person');localStorage.setItem('accountId','1');localStorage.setItem('schoolId','1');localStorage.setItem('role','principal');});
  let access={isPrincipal:true,canTeach:true,capabilities:['grades','streams','staff','learners','curriculum'],schoolId:1};
  let savedStreams=null,savedImport=null,savedGrants=null,selected=false;
  await context.route('http://localhost:3000/**',async route=>{
   const req=route.request(),url=new URL(req.url()),p=url.pathname,method=req.method();
   const json=payload=>route.fulfill({json:payload});
   if(p==='/staff/me/access')return json(access);
   if(p==='/staff/me/dashboard')return json(teacherData);
   if(p==='/schools/1/grades')return json([{id:11,number:11}]);
   if(p==='/schools/1/grades/11/classes')return json([cls]);
   if(p==='/schools/1/streams')return json(streams);
   if(p==='/schools/1/people')return json([{id:1,title:'Ms',firstName:'Test',surname:'Teacher',staffNumber:'T1',administrativeWork:['grades'],accountSetUp:true}]);
   if(p==='/schools/1/people/1/administrative-work'){savedGrants=req.postDataJSON();return json({saved:true});}
   if(p==='/schools/1/classes/10/learners')return json([{id:20,firstName:'Test',surname:'Learner',admissionNumber:'L1',accountSetUp:true}]);
   if(p==='/schools/1/classes/10/subjects')return json([]);
   if(p==='/schools/1/classes/10/streams'){
    if(method==='PUT'){savedStreams=req.postDataJSON();return json({saved:true});}
    return json({options:[streams[0]],cls:{streamConfiguration:null}});
   }
   if(p.match(/^\/schools\/1\/streams\/[12]\/subjects$/))return json(streams[Number(p.split('/')[4])-1].subjects.map(subject=>({subjectId:subject.id,subjectName:subject.name})));
   if(p.endsWith('/learners/import/preview'))return json({rows:[{firstName:'Test',surname:'Learner',identifier:'L1'}],existingIdentifiers:[]});
   if(p.endsWith('/learners/import/review'))return json({reviewHash:'reviewed',added:0,retained:1,assigned:0,transfers:[{name:'Transfer Learner',admissionNumber:'L2',fromClass:'10B'}],removed:[{name:'Old Learner',admissionNumber:'L3'}]});
   if(p.endsWith('/learners/import/commit')){savedImport=req.postDataJSON();return json({saved:1});}
   if(p==='/learners/me/learning-setup'){
    if(method==='POST'){selected=true;return json({saved:true});}
    return json({status:selected?'ready':'choose-subjects',classId:10,className:'11A',academicYear:2026,revision:1,common:[common],different:[agric,geo],options:streams,configuration:{primarySubjectId:agric.id,locations:[{subjectId:3,building:'Science block',classroom:'G1'}]}});
   }
   if(p==='/learners/me/workspace')return json({profile:{firstName:'Test',surname:'Learner',schoolName:'Test school',number:'L1',className:'11A',gradeNumber:11},subjects:[{id:91,subjectId:3,subjectName:'Geography',attendanceLocation:{building:'Science block',classroom:'G1'},syllabus:[],lessons:[],homework:[]}]});
   return route.fulfill({status:404,json:{error:'Unexpected fixture '+p}});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/dashboard/principal?book=grades&page=class-10&tab=subjects');
  await page.getByRole('button',{name:'Manage streams',exact:true}).click();
  await page.getByLabel('Geography',{exact:true}).check();
  await page.getByRole('combobox',{name:'Primary subject attended in this master class'}).click();
  await page.getByRole('option',{name:'Agricultural Sciences',exact:true}).click();
  await page.getByLabel('Building',{exact:true}).fill('Science block');
  await page.getByLabel('Classroom name',{exact:true}).fill('G1');
  await page.screenshot({path:shots+'/master-class-desktop.png'});
  await page.getByRole('button',{name:'Save',exact:true}).click();
  await page.locator('dialog').waitFor({state:'hidden'});
  assert.deepEqual(savedStreams,{streamIds:[1,2],configuration:{primarySubjectId:2,locations:[{subjectId:3,building:'Science block',classroom:'G1'}]}});
  await page.goto(base+'/dashboard/principal?book=grades&page=import-10');
  await page.getByRole('combobox',{name:'Purpose',exact:true}).click();
  await page.getByRole('option',{name:'Grade progression',exact:true}).click();
  await page.getByLabel('Academic year').fill('2027');
  await page.locator('input[type=file]').setInputFiles({name:'class.csv',mimeType:'text/csv',buffer:Buffer.from('firstName,surname,admissionNumber\nTest,Learner,L1')});
  await page.getByRole('button',{name:'Preview',exact:true}).click();
  await page.getByRole('button',{name:'Review changes',exact:true}).click();
  await page.getByRole('heading',{name:'Review changes before saving'}).waitFor();
  assert.equal(savedImport,null);
  await page.setViewportSize({width:360,height:800});
  await page.screenshot({path:'.next/mobile-polish-screenshots/import-review-360.png'});
  assert.equal(await page.locator('table').evaluate(node=>node.scrollWidth<=node.clientWidth),true,'Phone import preview needs no sideways scrolling');
  assert.equal(await page.getByLabel('First name, row 1').evaluate(node=>getComputedStyle(node).fontSize),'16px');
  await page.setViewportSize({width:1280,height:900});
  await page.getByText('Transfer Learner (L2) from 10B',{exact:true}).waitFor();
  await page.screenshot({path:shots+'/progression-review-desktop.png'});
  await page.getByRole('button',{name:'Save 1 learners',exact:true}).click();
  await page.getByRole('button',{name:'Done',exact:true}).waitFor();
  assert.equal(savedImport.mode,'progression');assert.equal(savedImport.academicYear,2027);assert.equal(savedImport.reviewHash,'reviewed');
  await page.goto(base+'/dashboard/principal?book=staff&page=staff');
  await page.getByRole('button',{name:'Assign administrative work',exact:true}).click();
  await page.getByLabel('Staff',{exact:true}).check();
  await page.getByRole('button',{name:'Save',exact:true}).click();await page.locator('dialog').waitFor({state:'hidden'});
  assert.deepEqual(savedGrants,{capabilities:['grades','staff']});
  // Admin-only staff are routed away from teaching and see only their permitted book.
  access={isPrincipal:false,canTeach:false,capabilities:['grades'],schoolId:1};
  await page.goto(base+'/dashboard/staff');await page.waitForURL('**/dashboard/principal');
  await page.getByRole('button',{name:'Open Grades & Classes',exact:true}).last().waitFor();
  assert.equal(await page.locator('[data-library-books] > div').count(),1);
  assert.equal(await page.getByRole('button',{name:/Switch to/}).count(),0);
  access={...access,canTeach:true};
  await page.reload();await page.getByRole('button',{name:'Switch to teaching'}).click();await page.waitForURL('**/dashboard/staff');
  await page.getByRole('button',{name:'Switch to administration'}).waitFor();
  // Mandatory learner selection at phone width, before any learning screen is shown.
  await context.addInitScript(()=>{localStorage.setItem('accountType','learner');localStorage.removeItem('role');});
  await page.setViewportSize({width:390,height:844});await page.goto(base+'/dashboard/learner');
  await page.getByRole('heading',{name:'Confirm your subjects'}).waitFor();
  assert.equal(await page.getByRole('button',{name:'Confirm my subjects'}).isEnabled(),false);
  await page.getByRole('radio').last().check();
  await page.screenshot({path:shots+'/learner-choice-phone.png',fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.getByRole('button',{name:'Confirm my subjects'}).click();
  await page.getByRole('button',{name:'Open Lessons',exact:true}).waitFor();
  await page.getByRole('button',{name:'Open Lessons',exact:true}).click();
  await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
  await page.getByText('Attend Geography in Science block · G1.',{exact:true}).waitFor();
  assert.deepEqual(errors,[]);console.log('Browser checks passed: master-class configuration, progression review, filtered administrative library, mode switch, mandatory learner choice and classroom information.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
