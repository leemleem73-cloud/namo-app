// Isolated browser smoke test: intercepts the embedded PC app, never accesses production.
const { chromium } = require('playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
(async () => {
 const browser = await chromium.launch({headless:true});
 try {
  const page = await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const mobile=fs.readFileSync('public/mobile-app-20261031.html','utf8');
  const pc='<!doctype html><html><head></head><body><aside class="sidebar"><div class="menu" data-page="work"><span class="label">작업지시서</span></div><div class="menu" data-page="incoming"><span class="label">수입검사 IQC</span></div><div class="menu" data-page="process"><span class="label">공정검사 PQC</span></div><div class="menu" data-page="outgoing"><span class="label">출하검사 OQC</span></div></aside><main class="workspace-body"><table><tr><td>목록</td></tr></table></main><script>document.querySelectorAll(".menu").forEach(e=>e.onclick=()=>document.body.dataset.active=e.dataset.page)</script></body></html>';
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
  await page.locator('[data-find="작업지시"]').first().click();
  await page.locator('body.in-work').waitFor();
  assert.match(await page.locator('#worktitle').innerText(),/작업지시서/);
  assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),'work');
  await page.locator('#workmenu').click();
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('menu-open')),true);
  await page.locator('#shade').click({position:{x:370,y:200}});
  await page.locator('#backhome').click();
  await page.locator('#home').waitFor({state:'visible'});
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('in-work')),false);
  console.log('PASS: 390px mobile shell, module navigation, menu and return home (mock PC data only)');
 } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
