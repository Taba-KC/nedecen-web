/* Isolated browser fixtures: no school records are changed. */
/* eslint-disable @typescript-eslint/no-require-imports */
const { chromium }=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const base=process.env.LEARNER_UI_URL||'http://127.0.0.1:3001';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try { for(const width of [360,768,1280]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});
  await context.addInitScript(()=>{localStorage.setItem('accessToken','fixture');localStorage.setItem('accountType','person');localStorage.setItem('schoolId','1');localStorage.setItem('role','principal');});
  let roster=[1,2,3].map(id=>({id,firstName:'Learner',surname:String(id),admissionNumber:'L'+id})),reviewed,committed;
  await context.route('http://localhost:3000/**',route=>{
   const req=route.request(),p=new URL(req.url()).pathname;
   const json=value=>route.fulfill({json:value});
   if(p==='/staff/me/access')return json({isPrincipal:width!==768,canTeach:false,capabilities:['grades'],schoolId:1});
   if(p==='/schools/1/grades')return json([{id:11,number:11}]);
   if(p==='/schools/1/grades/11/classes')return json([{id:10,name:'11C',gradeId:11,academicYear:2026,learnerCount:roster.length},{id:20,name:'11B',gradeId:11,academicYear:2026,learnerCount:0},{id:30,name:'11D',gradeId:11,academicYear:2027,learnerCount:0}]);
   if(p==='/schools/1/streams'||p==='/schools/1/people')return json([]);
   if(p==='/schools/1/classes/10/learners')return json(roster);
   if(p.endsWith('/learner-transfers/review')){reviewed=req.postDataJSON();return json({reviewHash:'a'.repeat(64),count:reviewed.learnerIds.length,remaining:roster.length-reviewed.learnerIds.length,source:{name:'11C'},target:{name:'11B',academicYear:2026},learners:roster.filter(row=>reviewed.learnerIds.includes(row.id))});}
   if(p.endsWith('/learner-transfers/commit')){committed=req.postDataJSON();roster=roster.filter(row=>!committed.learnerIds.includes(row.id));return json({moved:committed.learnerIds.length});}
   return route.fulfill({status:404,json:{error:'Unexpected fixture '+p}});
  });
  const page=await context.newPage();const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base+'/dashboard/principal?book=grades&page=class-10',{timeout:120000});
  if(width<=768)await page.getByRole('button',{name:'Close pages menu',exact:true}).click();
  await page.getByRole('button',{name:'Move learners',exact:true}).click();
  const dialog=page.getByRole('dialog',{name:'Move learners from Grade 11C',exact:true});await dialog.waitFor();
  assert.equal(await dialog.getByRole('checkbox',{name:'Select all learners',exact:true}).isChecked(),true);
  await dialog.getByRole('checkbox',{name:'Learner 2 L2',exact:true}).uncheck();
  await dialog.getByRole('combobox',{name:'Destination class',exact:true}).click();
  assert.equal(await page.getByRole('option',{name:'Grade 11D',exact:true}).count(),0,'Different years are not offered');
  await page.getByRole('option',{name:'Grade 11B',exact:true}).click();
  await dialog.getByRole('button',{name:'Review move',exact:true}).click();
  await dialog.getByRole('button',{name:'Confirm move (2)',exact:true}).waitFor();
  assert.equal(committed,undefined,'Review never commits');
  assert.deepEqual(reviewed,{targetClassId:20,learnerIds:[1,3]});
  assert.equal(await dialog.evaluate(node=>node.scrollWidth<=node.clientWidth),true,'Dialog does not overflow');
  fs.mkdirSync('.next/learner-transfer-screenshots',{recursive:true});
  await page.screenshot({path:`.next/learner-transfer-screenshots/review-${width}.png`});
  await dialog.getByRole('button',{name:'Confirm move (2)',exact:true}).click();
  await dialog.waitFor({state:'detached'});
  assert.deepEqual(committed,{...reviewed,reviewHash:'a'.repeat(64)});
  const register=page.getByRole('region',{name:'Class register',exact:true});
  await register.getByText('Learner 2',{exact:true}).waitFor();
  assert.equal(await register.getByText('Learner 1',{exact:true}).count(),0);
  assert.deepEqual(errors,[]);
  await context.close();
 } console.log('Learner transfer browser checks passed: all/selected learners, review before commit, destination filtering, refreshed register and phone/tablet/desktop layouts, including delegated administration.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
