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
  // Real PC pages are dynamically rendered into these module containers.
  for(const id of ['work','incoming','process','outgoing']){
   assert.match(desktop,new RegExp('<section class="module-page" id="'+id+'"'),id+' business module container missing');
  }
  // Verify real desktop entrypoints remain present before running the isolated mobile mock.
  assert.ok(desktop.includes('신규 작업지시서 등록'),'Work order create action missing');
  assert.ok(desktop.includes('renderSavedWorkOrders()'),'Work order list rendering missing');
  assert.ok(desktop.includes('premiumInspectionShell(id,title,desc,cols)'),'Inspection rendering missing');
  // Guard against false green results when PC modules are renamed or removed.
  for(const [name,source,selector] of [
   ['IQC/PQC/OQC','function incomingWorkOrderFrame','iqc-register-header'],
   ['Inspection entry','inspection-entry','ie-grid'],
   ['LOT trace','function lotTraceShell','lot-search-grid'],
   ['Quality approval','function qualityApprovalShell','quality-approval-table']
  ]){
   assert.ok(desktop.includes(source),name+' PC business source missing: '+source);
   assert.ok(desktop.includes(selector),name+' PC UI selector missing: '+selector);
  }
  for(const [name,selector] of [
   ['Work-order material input','#workMaterialTable'],
   ['Inspection filters','.ip-filter-row'],
   ['Inspection entry','.ie-grid'],
   ['LOT trace','.lot-search-grid'],
   ['Quality approval','.quality-approval-table']
  ])assert.ok(mobile.includes(selector),name+' mobile adaptation missing: '+selector);

  const sidebar=desktop.match(/<aside class="sidebar"[^>]*>[\s\S]*?<\/aside>/);
  assert.ok(sidebar,'Real PC sidebar markup missing');
  const pc='<!doctype html><html><head></head><body>'+sidebar[0]+'<main class="workspace-body" style="padding:16px;background:#fff"><h2 id="mock-work-title">작업지시서 목록 (모의 화면)</h2><form id="mock-business-form"><label for="mock-lot">LOT 번호</label><input id="mock-lot" name="lot" type="text"><button id="mock-save" type="submit">저장</button></form><table id="mock-business-table"><tr><td>목록</td><td>LOT</td></tr></table></main><script>document.querySelectorAll(".sidebar .menu[data-page]").forEach(e=>e.onclick=()=>document.body.dataset.active=e.dataset.page);document.getElementById("mock-business-form").addEventListener("submit",e=>{e.preventDefault();document.body.dataset.savedLot=document.getElementById("mock-lot").value})</'+'script></body></html>';
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
  // Isolated form ergonomics only: no real QMES save or backend access.
  const lot=page.frameLocator('#pc').locator('#mock-lot');
  await lot.fill('MOBILE-TEST-LOT');
  assert.equal(await lot.inputValue(),'MOBILE-TEST-LOT');
  const formMetrics=await lot.evaluate(el=>({fontSize:parseFloat(getComputedStyle(el).fontSize),width:el.getBoundingClientRect().width}));
  assert.ok(formMetrics.fontSize>=16,'Mobile input font is too small: '+JSON.stringify(formMetrics));
  assert.ok(formMetrics.width>0,'Mobile input is not laid out');
  await page.frameLocator('#pc').locator('#mock-save').click();
  assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-saved-lot'),'MOBILE-TEST-LOT','Mock mobile save action did not receive entered LOT');
  await page.frameLocator('#pc').locator('.qmes-mobile-table-scroll').first().waitFor({state:'attached'});
  await page.screenshot({path:path.join('artifacts/qmes-mobile','workorder-390.png'),fullPage:true});
  // Exercise mobile-only CSS against representative real PC module selectors.
  // These are layout checks, NOT live database or QMES transaction tests.
  const responsive=await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const host=document.createElement('section');host.id='incoming';host.className='module-page active';
   host.innerHTML='<div class="iqc-work-frame"><div class="iqc-register-header"><strong>수입검사 등록 및 조회</strong><div class="iqc-header-tools"><button class="btn new-btn">신규 등록</button></div></div><div class="ip-filter-row"><label class="ip-filter"><input class="input" value="LOT-001"></label></div><div class="inspection-entry"><div class="ie-grid"><div class="ie-field"><input value="sample"></div></div></div><div class="ip-table-wrap"><table class="ip-table"><tr><td>LOT-001</td></tr></table></div></div>';
   body.appendChild(host);
   const css=e=>getComputedStyle(e);
   const grid=host.querySelector('.ip-filter-row');
   const input=host.querySelector('.ie-field input');
   const btn=host.querySelector('.new-btn');
   const result={filterColumns:css(grid).gridTemplateColumns.split(' ').length,inputFont:parseFloat(css(input).fontSize),buttonHeight:btn.getBoundingClientRect().height,tableOverflow:css(host.querySelector('.ip-table-wrap')).overflowX};
   host.remove();return result;
  });
  assert.equal(responsive.filterColumns,1,'Inspection filters must be single-column on mobile: '+JSON.stringify(responsive));
  assert.ok(responsive.inputFont>=16,'Inspection form input too small: '+JSON.stringify(responsive));
  assert.ok(responsive.buttonHeight>=44,'Inspection create button too short: '+JSON.stringify(responsive));
  assert.equal(responsive.tableOverflow,'auto','Inspection table must scroll horizontally');
  const traceApproval=await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const lot=document.createElement('section');lot.id='lotTrace';lot.className='module-page active';
   lot.innerHTML='<div class="lot-search-grid"><div class="lot-field"><input value="LOT-001"></div><button>조회</button></div><div class="lot-flow"><div class="lot-step">원료</div><div class="lot-step">공정</div></div><div class="lot-detail-grid"><div class="lot-detail-box"><table class="lot-detail-table"><tr><td>결과</td></tr></table></div></div>';
   body.appendChild(lot);
   const flow=getComputedStyle(lot.querySelector('.lot-flow'));
   const lotResult={columns:getComputedStyle(lot.querySelector('.lot-search-grid')).gridTemplateColumns.split(' ').length,flowDirection:flow.flexDirection,flowDisplay:flow.display,font:parseFloat(getComputedStyle(lot.querySelector('input')).fontSize),detailOverflow:getComputedStyle(lot.querySelector('.lot-detail-box')).overflowX};
   lot.remove();
   const approval=document.createElement('section');approval.id='approval';approval.className='module-page active';
   approval.innerHTML='<div class="module-shell"><div class="module-toolbar"><div class="filters"><input class="quality-approval-search"></div><div class="table-tools"><button class="quality-approval-refresh">새로고침</button></div></div><div class="module-body"><table class="quality-approval-table"><tr><td>결재 문서</td></tr></table></div><div class="quality-approval-pager"><button class="quality-page-btn">1</button></div></div>';
   body.appendChild(approval);
   const approvalResult={searchFont:parseFloat(getComputedStyle(approval.querySelector('.quality-approval-search')).fontSize),refreshHeight:approval.querySelector('.quality-approval-refresh').getBoundingClientRect().height,tableOverflow:getComputedStyle(approval.querySelector('.module-body')).overflowX,pageHeight:approval.querySelector('.quality-page-btn').getBoundingClientRect().height};
   approval.remove();
   return {lot:lotResult,approval:approvalResult};
  });
  assert.equal(traceApproval.lot.columns,1,'LOT search must be one column: '+JSON.stringify(traceApproval.lot));
  assert.equal(traceApproval.lot.flowDisplay,'flex','LOT process flow should be flex on mobile');
  assert.equal(traceApproval.lot.flowDirection,'column','LOT process flow must be vertical');
  assert.ok(traceApproval.lot.font>=16,'LOT input font too small');
  assert.equal(traceApproval.lot.detailOverflow,'auto','LOT detail must scroll');
  assert.ok(traceApproval.approval.searchFont>=16,'Approval search input too small');
  assert.ok(traceApproval.approval.refreshHeight>=44,'Approval refresh touch target too small');
  assert.equal(traceApproval.approval.tableOverflow,'auto','Approval table must scroll');
  assert.ok(traceApproval.approval.pageHeight>=40,'Approval pagination touch target too small');
  const workForm=await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const host=document.createElement('section');host.id='work';host.className='module-page active';
   host.innerHTML='<div class="module-shell"><div class="nwi-header"><div class="nwi-title">작업지시서</div><div class="module-toolbar"><div class="table-tools"><button class="btn new-btn">신규 작업지시서 등록</button></div></div></div><div class="work-form"><div class="work-basic-grid"><div class="form-item"><label>생산 LOT NO</label><input value="LOT-TEST"></div><div class="form-item"><label>제품명</label><input value="TEST"></div></div><div class="work-section"><div class="work-section-body"><table id="workMaterialTable"><tr><td>원료</td><td>수량</td></tr></table></div></div><div class="form-actions"><button>저장</button></div></div></div>';
   body.appendChild(host);
   const basic=host.querySelector('.work-basic-grid'),lot=host.querySelector('.work-basic-grid input'),create=host.querySelector('.new-btn'),save=host.querySelector('.form-actions button');
   const result={columns:getComputedStyle(basic).gridTemplateColumns.split(' ').length,inputFont:parseFloat(getComputedStyle(lot).fontSize),createHeight:create.getBoundingClientRect().height,saveHeight:save.getBoundingClientRect().height,materialWidth:host.querySelector('#workMaterialTable').getBoundingClientRect().width};
   host.remove();return result;
  });
  assert.equal(workForm.columns,1,'Work order basic fields should stack: '+JSON.stringify(workForm));
  assert.ok(workForm.inputFont>=16,'Work order input font too small');
  assert.ok(workForm.createHeight>=44,'Work order create button too short');
  assert.ok(workForm.saveHeight>=44,'Work order save button too short');
  assert.ok(workForm.materialWidth>0,'Work order material table hidden');
  const layout=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}));
  assert.ok(layout.documentWidth<=layout.viewport+2,'Mobile shell horizontal overflow: '+JSON.stringify(layout));
  console.log('PASS: 390px mobile shell, real PC sidebar work order/IQC/PQC/OQC navigation, menu and home (mock business data only)');
 } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
