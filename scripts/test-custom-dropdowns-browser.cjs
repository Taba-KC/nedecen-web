/* Shared chooser integration, viewport geometry, keyboard, FormData and modal layering. */
/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');const fs=require('node:fs');
const shots='.next/custom-dropdown-screenshots';fs.mkdirSync(shots,{recursive:true});
const subjects=Array.from({length:12},(_,i)=>({id:i+1,name:i===1?'English First Additional Language with a deliberately long curriculum subject title':`Subject ${i+1}`}));
const concept={id:1,name:'Identify opposite, adjacent and hypotenuse sides in a right-angled triangle',chapterName:'Vectors',topicName:'Components',prerequisites:[],learningOutcomes:[]};
const subject={id:91,subjectName:'Physical Sciences',subjectId:1,classId:10,className:'11A',gradeNumber:11,totalConcepts:1,taughtConcepts:1,currentChapter:{name:'Vectors'},curriculum:[],lessons:[{id:46,lessonNumber:1,date:'2026-10-10',status:'confirmed',chapterName:'Vectors',concepts:[concept],homework:[]}]};
(async()=>{const browser=await chromium.launch({channel:'msedge',headless:true});try{
 const context=await browser.newContext({viewport:{width:1920,height:1080}});
 await context.addInitScript(()=>{const role=location.pathname.split('/')[2];localStorage.setItem('accessToken','fixture');localStorage.setItem('accountId','1');localStorage.setItem('schoolId','1');localStorage.setItem('accountType',role==='manager'?'manager':'person');localStorage.setItem('role',role==='staff'?'teacher':role);});
 let selectedSubjects=[],creates=0;
 await context.route('http://localhost:3000/**',route=>{const req=route.request(),p=new URL(req.url()).pathname;let json=[];
  if(p==='/staff/me/access')json={isPrincipal:true,canTeach:true,capabilities:['grades','staff','streams'],schoolId:1};
  else if(p==='/schools/1/grades')json=[{id:11,number:11}];
  else if(p==='/schools/1/grades/11/classes')json=[{id:10,gradeId:11,name:'11A',academicYear:2026}];
  else if(p==='/subjects'||p==='/manager/subjects')json=subjects;
  else if(p==='/schools/1/streams'&&req.method()==='POST'){creates++;json={id:1,name:req.postDataJSON().name};}
  else if(p==='/schools/1/streams/1/subjects'&&req.method()==='POST'){selectedSubjects.push(req.postDataJSON().subjectId);json={id:selectedSubjects.length};}
  else if(p==='/staff/me/dashboard')json={profile:{firstName:'Test',surname:'Teacher',schoolName:'Test school'},subjects:[subject],needsYou:[],comingUp:[]};
  else if(p.endsWith('/homework-context'))json={concepts:[concept],existingHomeworkId:null,aiAvailable:false};
  else if(p.endsWith('/lesson-feedback'))json=[{id:46,lessonNumber:1,lessonDate:'2026-10-10',concepts:[]}];
  return route.fulfill({json});
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
 const open=async url=>{await page.goto('http://localhost:3001'+url);if(page.viewportSize().width<=1200&&!url.includes('/manager'))await page.getByRole('button',{name:'Close pages menu',exact:true}).click();};
 for(const viewport of [{width:1920,height:1080},{width:768,height:1024},{width:390,height:844}]){
  await page.setViewportSize(viewport);await open('/dashboard/principal?book=grades&page=import-10');
  const purpose=page.getByRole('combobox',{name:'Purpose',exact:true});await purpose.waitFor();
  if(viewport.width===1920){const title=await page.getByRole('heading',{name:'Bulk import learners',exact:true}).boundingBox(),box=await purpose.boundingBox();assert.ok(Math.abs(title.y-box.y)<20,'Purpose is aligned with the title on desktop');}
  await purpose.click();const panel=page.locator('[data-select-panel]');await panel.waitFor();
  await panel.evaluate(async node=>{await Promise.all(node.getAnimations().map(animation=>animation.finished.catch(()=>{})));});
  const bounds=await panel.boundingBox();assert.ok(bounds.x>=0&&bounds.x+bounds.width<=viewport.width&&bounds.y>=0&&bounds.y+bounds.height<=viewport.height,'Chooser stays inside viewport');
  const spotlight=await panel.evaluate(node=>decodeURIComponent(node.style.getPropertyValue('--select-backdrop')));
  assert.match(spotlight, /mask id="spotlight"/);
  assert.match(spotlight, /fill-opacity=".55"/);
  assert.equal(await panel.getByRole('button',{name:'Close choices'}).count(),0);
  await page.screenshot({path:`${shots}/purpose-${viewport.width}.png`});
  await page.keyboard.press('ArrowDown');await page.keyboard.press('Enter');await panel.waitFor({state:'hidden'});
  await page.getByLabel('Academic year').waitFor({state:'visible'});assert.equal(await page.getByLabel('Academic year').isEnabled(),true);
  assert.equal(await purpose.evaluate(node=>node===document.activeElement),true,'Focus returns to chooser');
  await purpose.click();
  const litTrigger=await page.locator('[data-page-heading] [data-custom-select] > button').boundingBox();
  await page.mouse.click(litTrigger.x+litTrigger.width/2,litTrigger.y+litTrigger.height/2);await panel.waitFor({state:'hidden'});
  await purpose.click();await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
 }
 // Multiple choices remain open, are searchable, and submit normal FormData values.
 await page.setViewportSize({width:768,height:1024});await open('/dashboard/principal?book=streams&page=my-streams');
 await page.getByRole('button',{name:'Create a stream',exact:true}).click();
 await page.getByLabel('Stream name',{exact:true}).fill('New stream');
 await page.getByRole('combobox',{name:'Subjects',exact:true}).click();
 const panel=page.locator('[data-select-panel]');await page.getByRole('option',{name:'Subject 1',exact:true}).click();
 await page.getByRole('searchbox',{name:'Search choices'}).fill('deliberately');
 const longOption=page.getByRole('option',{name:subjects[1].name,exact:true});await longOption.click();
 assert.equal(await longOption.getAttribute('aria-selected'),'true');
 await page.screenshot({path:shots+'/multiple-tablet.png'});
 await page.getByRole('button',{name:'Done',exact:true}).click();await panel.waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Save',exact:true}).click();await page.locator('dialog').waitFor({state:'hidden'});
 assert.equal(creates,1);assert.deepEqual(selectedSubjects,[1,2]);
 // Required native validation opens the custom chooser inside an existing modal.
 await open('/dashboard/principal?book=grades&page=class-10');await page.getByRole('button',{name:'Add learner',exact:true}).click();
 await page.getByLabel('First name',{exact:true}).fill('Test');await page.getByLabel('Surname',{exact:true}).fill('Learner');await page.getByLabel('Admission number',{exact:true}).fill('L1');
 const classChoice=page.getByRole('combobox',{name:'Class',exact:true});await classChoice.click();await page.getByRole('option',{name:'Choose an option',exact:true}).click();await panel.waitFor({state:'hidden'});
 await page.getByRole('button',{name:'Save',exact:true}).click();await panel.waitFor();assert.equal(await page.locator('[data-custom-select] > button[aria-invalid=true]').count(),1);
 await page.keyboard.press('Escape');await panel.waitFor({state:'hidden'});assert.equal(await page.locator('dialog[open]').count(),1,'Escape leaves parent modal open');await page.keyboard.press('Escape');
 // Teacher homework and manager filters use the same control and change their content.
 await page.setViewportSize({width:390,height:844});await open('/dashboard/staff?book=homework&page=compose-91&lesson=46');
 await page.getByRole('combobox',{name:'Memo release:',exact:true}).click();await page.getByRole('option',{name:'Custom time',exact:true}).click();
 await page.getByLabel('Release memos at:').waitFor({state:'visible'});await page.screenshot({path:shots+'/teacher-phone.png'});
 await open('/dashboard/manager');await page.getByRole('combobox',{name:'Subject',exact:true}).click();await page.getByRole('searchbox',{name:'Search choices'}).fill('deliberately');await page.getByRole('option',{name:subjects[1].name,exact:true}).click();
 assert.ok((await page.getByRole('combobox',{name:'Subject',exact:true}).textContent()).includes('English'));
 assert.deepEqual(errors,[]);console.log('Custom dropdown checks passed: desktop/tablet/phone layout, dimming, keyboard, focus, multi-select FormData, search, required validation, nested-dialog Escape, teacher and manager selectors.');
}finally{await browser.close();}})().catch(error=>{console.error(error);process.exitCode=1;});
