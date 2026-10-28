/* Browser-only session fixture; no real credentials or accounts are used. */
/* eslint-disable @typescript-eslint/no-require-imports */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const assert=require('node:assert/strict');
const base=process.env.LEARNER_UI_URL||'http://localhost:3001';
const token='fixture.'+Buffer.from(JSON.stringify({accountId:1,accountType:'person',schoolId:1,role:'teacher',exp:Math.floor(Date.now()/1000)+900})).toString('base64url')+'.signature';
(async()=>{
 const browser=await chromium.launch({channel:'msedge',headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>localStorage.setItem('nedecen.navigation-help.v1:person:1:1',JSON.stringify({completed:true,visits:1})));
  let signedIn=false,refreshes=0,revoked=false;
  const errors=[];
  await context.route('http://localhost:3000/**',route=>{
   const req=route.request(),path=new URL(req.url()).pathname;
   const headers={'access-control-allow-origin':base,'access-control-allow-credentials':'true'};
   const json=(value,status=200,extra={})=>route.fulfill({status,headers:{...headers,...extra},json:value});
   if(req.method()==='OPTIONS')return route.fulfill({status:204,headers:{...headers,'access-control-allow-methods':'GET,POST,OPTIONS','access-control-allow-headers':'content-type,authorization'}});
   if(path==='/auth/people/login'){signedIn=true;return json({accessToken:token},200,{'set-cookie':'nedecen_refresh=cookie-only-fixture; HttpOnly; Path=/auth; SameSite=Lax'});}
   if(path==='/auth/refresh'){refreshes++;assert.ok(req.headers().cookie?.includes('nedecen_refresh='));return signedIn?json({accessToken:token}):json({error:'Revoked'},401);}
   if(path==='/auth/logout'){assert.ok(req.headers().cookie?.includes('nedecen_refresh='));revoked=true;signedIn=false;return json({message:'Logged out'},200,{'set-cookie':'nedecen_refresh=; HttpOnly; Path=/auth; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT'});}
   if(!signedIn||req.headers().authorization!=='Bearer '+token)return json({error:'Expired'},401);
   if(path==='/staff/me/access')return json({isPrincipal:false,canTeach:true,capabilities:[],schoolId:1});
   if(path==='/staff/me/dashboard')return json({profile:{firstName:'Test',surname:'Teacher',schoolName:'Fixture',number:'1'},subjects:[],needsYou:[],comingUp:[]});
   return json({error:'Unexpected fixture'},404);
  });
  const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
  await page.goto(base,{timeout:120000});
  await page.getByLabel('Username',{exact:true}).fill('fixture');await page.getByLabel('Password',{exact:true}).fill('fixture-password');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();await page.waitForURL('**/dashboard/staff');
  await page.getByRole('heading',{name:'Your library',exact:true}).waitFor();
  assert.deepEqual(await page.evaluate(()=>[localStorage.getItem('accessToken'),localStorage.getItem('refreshToken')]),[null,null]);
  const cookie=(await context.cookies()).find(row=>row.name==='nedecen_refresh');assert.ok(cookie?.httpOnly);
  assert.ok(!(await page.evaluate(()=>document.cookie)).includes('nedecen_refresh'));
  await page.reload();await page.getByRole('heading',{name:'Your library',exact:true}).waitFor();assert.ok(refreshes>0,'Reload restores the session using the cookie');
  // A visible workspace gives access to the sign-out footer on phones.
  await page.getByRole('button',{name:'Open Lessons',exact:true}).click();
  await page.getByRole('button',{name:'Sign out',exact:true}).click();
  await page.waitForURL(base+'/');
  await page.getByRole('button',{name:'Sign in',exact:true}).waitFor();
  await page.waitForFunction(()=>localStorage.getItem('accountType')===null);
  assert.equal(revoked,true);assert.equal((await context.cookies()).some(row=>row.name==='nedecen_refresh'),false);
  assert.deepEqual(errors,[]);
  console.log('Cookie session browser checks passed: sign in, HttpOnly renewal, no localStorage tokens, reload restoration and server sign-out revocation.');
  await context.close();
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
