// Isolated browser smoke test: intercepts the embedded PC app, never accesses production.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobile=fs.readFileSync('public/mobile-app-20261031.html','utf8');
  // Use the real PC sidebar markup from this branch, rather than invented menu names.
  const desktop=fs.readFileSync('public/index.html','utf8');
  const sidebar=desktop.match(/<aside class="sidebar"[^>]*>[\s\S]*?<\/aside>/);
  assert.ok(sidebar,'Real PC sidebar markup missing');
  const pc='<!doctype html><html><head></head><body>'+sidebar[0]+'<main class="workspace-body" style="padding:16px;background:#fff"><h2 id="mock-work-title">작업지시서 목록 (모의 화면)</h2><table><tr><td>목록</td></tr></table></main><script>document.querySelectorAll(".sidebar .menu[data-page]").forEach(e=>e.onclick=()=>document.body.dataset.active=e.dataset.page)</'+'script></body></html>';
  for(const label of ['작업지시서','수입검사 IQC','공정검사 PQC','출하검사 OQC']){
   assert.ok(sidebar[0].includes(label),'Real PC menu missing: '+label);
  }
  await page.route('http://qmes-mobile.local/**',route=>{
   const url=new URL(route.request().url());
   if(url.pathname==='/mobile-app-20261031.html')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:mobile});
   if(url.pathname==='/')return route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:pc});
   return route.fulfill({status:404,body:''});
  });
  await page.goto('http://qmes-mobile.local/mobile-app-20261031.html');
  await page.waitForFunction(()=>window.qmesMobileCheck?.().checks.menusReady===true);
  const report=await page.evaluate(()=>window.qmesMobileCheck());
  assert.equal(report.checks.menusReady,true);
  // Retired or unavailable PC menus must not be advertised on the mobile home.
  for(const missing of ['재고','생산실적']){
   assert.equal(await page.locator('[data-find="'+missing+'"]').count(),0,missing+' shortcut should be absent');
  }
  await page.locator('[data-find="작업지시"]').first().click();
  await page.locator('body.in-work').waitFor();
  assert.match(await page.locator('#worktitle').innerText(),/작업지시서/);
  assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),'work');
  // Verify each core inspection menu against the actual PC sidebar's data-page.
  for(const [label,expected] of [['수입검사','incoming'],['공정검사','process'],['출하검사','outgoing']]){
   await page.locator('#backhome').click();
   await page.locator('#home').waitFor({state:'visible'});
   await page.locator('[data-find="'+label+'"]').first().click();
   await page.locator('body.in-work').waitFor();
   assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),expected,label+' did not activate');
   assert.match(await page.locator('#worktitle').innerText(),new RegExp(label));
   const businessContent=page.frameLocator('#pc').locator('#mock-work-title');
   await businessContent.waitFor({state:'visible'});
   assert.equal(await businessContent.evaluate(el=>{
    const rect=el.getBoundingClientRect(),style=getComputedStyle(el);
    return rect.width>0&&rect.height>0&&style.display!=='none'&&style.visibility!=='hidden';
   }),true,label+' embedded business content not visible');
  }
  await page.locator('#backhome').click();
  await page.locator('[data-find="작업지시"]').first().click();
  await page.locator('body.in-work').waitFor();
  await page.locator('#workmenu').click();
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('menu-open')),true);
  await page.locator('#shade').click({position:{x:370,y:200}});
  await page.locator('#backhome').click();
  await page.locator('#home').waitFor({state:'visible'});
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('in-work')),false);
  // The navigation test already returned home; avoid clicking a hidden work-only button.
  await page.locator('#home').waitFor({state:'visible'});
  fs.mkdirSync('artifacts/qmes-mobile',{recursive:true});
  await page.screenshot({path:path.join('artifacts/qmes-mobile','home-390.png'),fullPage:true});
  await page.locator('[data-find="작업지시"]').first().click();
  await page.locator('body.in-work').waitFor();
  // A menu click is not enough: the embedded business content must actually be visible.
  const workContent=page.frameLocator('#pc').locator('#mock-work-title');
  await workContent.waitFor({state:'visible'});
  const visible=await workContent.evaluate(el=>{
   const r=el.getBoundingClientRect(),css=getComputedStyle(el);
   return r.width>0&&r.height>0&&css.visibility!=='hidden'&&css.display!=='none';
  });
  assert.equal(visible,true,'Embedded work content is not visible');
  await page.screenshot({path:path.join('artifacts/qmes-mobile','workorder-390.png'),fullPage:true});
  const layout=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}));
  assert.ok(layout.documentWidth<=layout.viewport+2,'Mobile shell horizontal overflow: '+JSON.stringify(layout));
  console.log('PASS: 390px mobile shell, real PC sidebar work order/IQC/PQC/OQC navigation, menu and home (mock business data only)');
 } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
