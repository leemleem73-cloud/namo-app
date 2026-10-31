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
  // The new read-only diagnostics must clearly flag missing real module containers in the mock.
  const readiness=await page.evaluate(()=>window.qmesMobileBusinessReadiness());
  assert.equal(readiness.source,'embedded PC QMES DOM (read-only)');
  assert.deepEqual(readiness.modules.map(m=>m.id),['work','incoming','process','outgoing','lotTrace','approval']);
  assert.ok(readiness.modules.every(m=>m.containerFound===false),'Mock PC must not be mistaken for real QMES modules');
  assert.ok(readiness.warnings.some(w=>w.includes('읽기 전용 DOM 검사')),'Diagnostic must disclose that backend operations are unverified');
  assert.equal(readiness.workOrder.screenMounted,false,'Mock must not report a real work-order screen');
  assert.equal(readiness.workOrder.listFound,false,'Mock must not report a real work-order list');
  assert.deepEqual(readiness.inspections.map(m=>m.id),['incoming','process','outgoing']);
  assert.ok(readiness.inspections.every(m=>m.screenMounted===false),'Mock must not report real inspection screens');
  assert.equal(readiness.lotTrace.screenMounted,false,'Mock must not report real LOT trace');
  assert.equal(readiness.approval.screenMounted,false,'Mock must not report real approval inbox');
  assert.ok(readiness.modules.every(m=>m.status==='not-mounted'),'Unopened modules must be diagnosed as not-mounted, not as errors');
  // Positive-path diagnostic check with synthetic mounted screens; no backend requests.
  const mounted=await page.evaluate(()=>{
   const d=document.getElementById('pc').contentDocument;
   const samples={
    work:'<div class="nwi-title">작업지시서 등록 및 조회</div><button class="new-btn">신규</button><table class="work-list-table"><thead><tr><th>LOT</th></tr></thead><tbody><tr><td>DEMO</td></tr></tbody></table>',
    incoming:'<div class="iqc-register-header">수입검사</div><div class="ip-filter-row"><input></div><table><tbody><tr><td>DEMO</td></tr></tbody></table>',
    process:'<div class="iqc-register-header">공정검사</div><table><tbody><tr><td>DEMO</td></tr></tbody></table>',
    outgoing:'<div class="iqc-register-header">출하검사</div><table><tbody><tr><td>DEMO</td></tr></tbody></table>',
    lotTrace:'<div class="lot-search-grid"><input></div><div class="lot-flow"><div class="lot-step">원료</div></div><table class="lot-detail-table"></table>',
    approval:'<input class="quality-approval-search"><table class="quality-approval-table"><tbody><tr><td>DEMO</td></tr></tbody></table><div class="quality-approval-pager"></div>'
   };
   const nodes=[];
   Object.entries(samples).forEach(([id,html])=>{const section=d.createElement('section');section.id=id;section.className='module-page active';section.style.setProperty('display','block','important');section.style.setProperty('visibility','visible','important');section.innerHTML=html;d.body.appendChild(section);nodes.push(section)});
   const result=window.qmesMobileBusinessReadiness();
   nodes.forEach(node=>node.remove());
   return result;
  });
  assert.equal(mounted.workOrder.listFound,true,'Mounted work-order table must be detected');
  assert.equal(mounted.workOrder.columnHeaders[0],'LOT','Work-order header must be captured');
  assert.equal(mounted.workOrder.visibleRows,0,'Rows in inactive PC modules must not be reported as visible');
  assert.ok(mounted.inspections.every(m=>m.screenMounted&&m.tableCount===1),'Mounted inspection tables must be detected');
  assert.equal(mounted.lotTrace.searchFound,true,'LOT search must be detected');
  assert.equal(mounted.lotTrace.stepCount,1,'LOT flow steps must be counted');
  assert.equal(mounted.approval.listFound,true,'Approval table must be detected');
  assert.equal(mounted.approval.visibleRows,0,'Rows in inactive approval module must not be reported as visible');
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
  // Replacing a PC sidebar item after building the drawer must not trigger a stale click.
  await page.locator('[data-open="1"]').first().click();
  await page.locator('body.menu-open').waitFor();
  await page.frameLocator('#pc').locator('.sidebar .menu[data-page="work"]').evaluate(el=>{
   const replacement=el.cloneNode(true);
   el.replaceWith(replacement);
   replacement.addEventListener('click',()=>{document.body.dataset.active='work'});
  });
  const staleWork=page.locator('#dynamic-menu button.nav').filter({hasText:'작업지시서'}).first();
  await staleWork.click();
  await page.locator('body.in-work').waitFor();
  assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),'work','Replaced PC menu item should still navigate to work');
  await page.locator('#backhome').click();
  await page.locator('#home').waitFor({state:'visible'});
  // Work-order list -> detail -> close -> mobile home, with synthetic read-only rows.
  await page.locator('[data-find="작업지시"]').first().click();
  await page.locator('body.in-work').waitFor();
  await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const section=document.createElement('section');section.id='work';section.className='module-page active';
   section.innerHTML='<div class="nwi-title">작업지시서 등록 및 조회</div><table class="work-list-table"><thead><tr><th>LOT</th><th>상세</th></tr></thead><tbody><tr><td>DEMO-LOT</td><td><button type="button" id="mock-work-detail-open">상세</button></td></tr></tbody></table>';
   body.appendChild(section);
   section.querySelector('#mock-work-detail-open').addEventListener('click',()=>{
    const modal=document.createElement('div');modal.className='modal work-mode';modal.id='mock-work-detail-dialog';modal.style.cssText='position:relative;display:block;min-width:760px;width:1120px';
    modal.innerHTML='<div class="work-detail-doc"><strong>DEMO-LOT</strong><button id="mock-work-detail-close" type="button">닫기</button></div>';
    body.appendChild(modal);modal.querySelector('button').addEventListener('click',()=>modal.remove());
   });
  });
  await page.frameLocator('#pc').locator('#mock-work-detail-open').click();
  await page.frameLocator('#pc').locator('#mock-work-detail-dialog').waitFor({state:'visible'});
  assert.match(await page.frameLocator('#pc').locator('#mock-work-detail-dialog').innerText(),/DEMO-LOT/);
  await page.frameLocator('#pc').locator('#mock-work-detail-close').click();
  assert.equal(await page.frameLocator('#pc').locator('#mock-work-detail-dialog').count(),0,'Work-order detail must close');
  await page.frameLocator('#pc').locator('#work').evaluate(el=>el.remove());
  await page.locator('#backhome').click();
  await page.locator('#home').waitFor({state:'visible'});
  // IQC mobile list -> registration -> back to list (isolated fixture, no DB writes).
  await page.locator('[data-find="수입검사"]').first().click();
  await page.locator('body.in-work').waitFor();
  assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),'incoming');
  await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const section=document.createElement('section');section.id='incoming';section.className='module-page active';section.style.setProperty('display','block','important');
   section.innerHTML='<div class="iqc-register-header"><button id="mock-iqc-new" type="button">신규 검사 등록</button></div><div id="mock-iqc-list"><table><tbody><tr><td>DEMO-IQC</td></tr></tbody></table></div><div id="mock-iqc-form" hidden><label>원자재 LOT<input id="mock-iqc-lot" type="text"></label><button id="mock-iqc-cancel" type="button">취소</button></div>';
   body.appendChild(section);
   const list=section.querySelector('#mock-iqc-list'),form=section.querySelector('#mock-iqc-form');
   section.querySelector('#mock-iqc-new').onclick=()=>{list.hidden=true;form.hidden=false};
   section.querySelector('#mock-iqc-cancel').onclick=()=>{form.hidden=true;list.hidden=false};
  });
  await page.frameLocator('#pc').locator('#mock-iqc-new').click();
  await page.frameLocator('#pc').locator('#mock-iqc-form').waitFor({state:'visible'});
  await page.frameLocator('#pc').locator('#mock-iqc-lot').fill('DEMO-RAW-LOT');
  assert.equal(await page.frameLocator('#pc').locator('#mock-iqc-lot').inputValue(),'DEMO-RAW-LOT');
  await page.frameLocator('#pc').locator('#mock-iqc-cancel').click();
  await page.frameLocator('#pc').locator('#mock-iqc-list').waitFor({state:'visible'});
  assert.equal(await page.frameLocator('#pc').locator('#mock-iqc-form').isVisible(),false,'IQC registration form must close on cancel');
  await page.frameLocator('#pc').locator('#incoming').evaluate(el=>el.remove());
  await page.locator('#backhome').click();
  await page.locator('#home').waitFor({state:'visible'});
  // Drawer navigation must use the currently mounted PC menu rather than stale references.
  await page.locator('[data-open="1"]').first().click();
  await page.locator('body.menu-open').waitFor();
  const workDrawer=page.locator('#dynamic-menu button.nav').filter({hasText:'작업지시서'}).first();
  await workDrawer.waitFor({state:'visible'});
  await workDrawer.click();
  await page.locator('body.in-work').waitFor();
  assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),'work','Work-order drawer navigation failed');
  assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('menu-open')),false,'Drawer should close after navigation');
  await page.locator('#backhome').click();
  await page.locator('#home').waitFor({state:'visible'});
  // Drawer navigation must preserve real PC data-page targets for LOT trace and approval.
  for(const [label,expected] of [['LOT 추적','lotTrace'],['전자결재','approval']]){
   await page.locator('[data-open="1"]').first().click();
   await page.locator('body.menu-open').waitFor();
   const entry=page.locator('#dynamic-menu button.nav').filter({hasText:label}).first();
   await entry.waitFor({state:'visible'});
   await entry.click();
   await page.locator('body.in-work').waitFor();
   assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),expected,label+' drawer navigation failed');
   assert.equal(await page.locator('body').evaluate(e=>e.classList.contains('menu-open')),false,label+' drawer remained open');
   await page.locator('#backhome').click();
   await page.locator('#home').waitFor({state:'visible'});
  }
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
  // IQC/PQC/OQC inspection registration: mobile-only CSS against representative PC selectors.
  for(const id of ['incoming','process','outgoing']){
   const inspectionMetrics=await page.frameLocator('#pc').locator('body').evaluate((body,id)=>{
    const host=document.createElement('section');host.id=id;host.className='module-page active';
    host.innerHTML='<div class="iqc-work-frame"><div class="iqc-register-header"><strong>검사 등록</strong><div class="iqc-header-tools"><button class="btn">신규 등록</button></div></div><div class="ip-filter-row"><div class="ip-filter"><input class="input" aria-label="LOT 조회"></div></div><div class="ip-table-wrap"><table class="ip-table"><tbody><tr><td>검사 목록</td></tr></tbody></table></div><div class="inspection-entry"><div class="ie-grid"><div class="ie-field"><input aria-label="검사 LOT"></div><div class="ie-field span2"><select aria-label="검사 판정"><option>합격</option></select></div></div><button class="btn">저장</button></div></div>';
    body.appendChild(host);
    const grid=host.querySelector('.ie-grid'),input=host.querySelector('.ie-field input'),save=host.querySelector('.inspection-entry button'),filters=host.querySelector('.ip-filter-row'),table=host.querySelector('.ip-table-wrap');
    const result={viewport:innerWidth,hostWidth:host.getBoundingClientRect().width,columns:getComputedStyle(grid).gridTemplateColumns.split(' ').length,filterColumns:getComputedStyle(filters).gridTemplateColumns.split(' ').length,inputFont:parseFloat(getComputedStyle(input).fontSize),saveHeight:save.getBoundingClientRect().height,tableOverflow:getComputedStyle(table).overflowX};
    host.remove();return result;
   },id);
   assert.ok(inspectionMetrics.hostWidth<=inspectionMetrics.viewport,id+' inspection exceeds viewport: '+JSON.stringify(inspectionMetrics));
   assert.equal(inspectionMetrics.columns,1,id+' entry fields should stack');
   assert.equal(inspectionMetrics.filterColumns,1,id+' search filters should stack');
   assert.ok(inspectionMetrics.inputFont>=16,id+' input font too small');
   assert.ok(inspectionMetrics.saveHeight>=44,id+' save button too short');
   assert.equal(inspectionMetrics.tableOverflow,'auto',id+' table wrapper not scrollable');
  }
  // LOT trace: check search inputs, vertical flow, and horizontally scrollable detail tables.
  const lotMetrics=await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const host=document.createElement('section');host.id='lotTrace';host.className='module-page active';
   host.innerHTML='<div class="lot-search-card"><div class="lot-search-grid"><div class="lot-field"><input aria-label="LOT 번호"></div><button>조회</button></div></div><div class="lot-flow"><div class="lot-step">원료</div><div class="lot-step">생산</div><div class="lot-step">출하</div></div><div class="lot-detail-grid"><div class="lot-detail-box"><table class="lot-detail-table"><tbody><tr><td>원료 LOT</td><td>생산 LOT</td></tr></tbody></table></div></div>';
   body.appendChild(host);
   const search=host.querySelector('.lot-search-grid'),input=host.querySelector('input'),button=host.querySelector('button'),flow=host.querySelector('.lot-flow'),details=host.querySelector('.lot-detail-grid'),box=host.querySelector('.lot-detail-box');
   const result={viewport:innerWidth,searchColumns:getComputedStyle(search).gridTemplateColumns.split(' ').length,inputFont:parseFloat(getComputedStyle(input).fontSize),buttonHeight:button.getBoundingClientRect().height,flowDirection:getComputedStyle(flow).flexDirection,detailColumns:getComputedStyle(details).gridTemplateColumns.split(' ').length,detailOverflow:getComputedStyle(box).overflowX};
   host.remove();return result;
  });
  assert.equal(lotMetrics.searchColumns,1,'LOT search should be single column: '+JSON.stringify(lotMetrics));
  assert.ok(lotMetrics.inputFont>=16,'LOT search input too small');
  assert.ok(lotMetrics.buttonHeight>=44,'LOT search button too short');
  assert.equal(lotMetrics.flowDirection,'column','LOT trace flow should stack vertically');
  assert.equal(lotMetrics.detailColumns,1,'LOT details should stack in one column');
  assert.equal(lotMetrics.detailOverflow,'auto','LOT detail table should scroll horizontally');
  // Approval inbox: inspect search, list scrolling and pager layout, without invoking approvals.
  const approvalMetrics=await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const host=document.createElement('section');host.id='approval';host.className='module-page active';
   host.innerHTML='<div class="module-shell"><div class="module-toolbar"><div class="filters"><input class="quality-approval-search" aria-label="결재 검색"></div><div class="table-tools"><button class="quality-approval-refresh">새로고침</button></div></div><div class="module-body"><table class="quality-approval-table"><tbody><tr><td>작성자</td><td>검토</td><td>승인</td></tr></tbody></table></div><div class="quality-approval-pager"><button class="quality-page-btn">1</button></div></div>';
   body.appendChild(host);
   const search=host.querySelector('.quality-approval-search'),refresh=host.querySelector('.quality-approval-refresh'),table=host.querySelector('.quality-approval-table'),bodyWrap=host.querySelector('.module-body'),pager=host.querySelector('.quality-approval-pager'),pageBtn=host.querySelector('.quality-page-btn');
   const result={viewport:innerWidth,searchFont:parseFloat(getComputedStyle(search).fontSize),searchWidth:search.getBoundingClientRect().width,refreshHeight:refresh.getBoundingClientRect().height,tableWidth:table.getBoundingClientRect().width,overflow:getComputedStyle(bodyWrap).overflowX,pagerWrap:getComputedStyle(pager).flexWrap,pageHeight:pageBtn.getBoundingClientRect().height};
   host.remove();return result;
  });
  assert.ok(approvalMetrics.searchFont>=16&&approvalMetrics.searchWidth>0,'Approval search unusable: '+JSON.stringify(approvalMetrics));
  assert.ok(approvalMetrics.refreshHeight>=44,'Approval refresh touch target too short');
  assert.ok(approvalMetrics.tableWidth>approvalMetrics.viewport,'Approval table should retain readable columns');
  assert.equal(approvalMetrics.overflow,'auto','Approval list should scroll horizontally');
  assert.equal(approvalMetrics.pagerWrap,'wrap','Approval pager should wrap');
  assert.ok(approvalMetrics.pageHeight>=40,'Approval page button too short');
  // Work-order detail modal must override the real PC 760px minimum width.
  const detailMetrics=await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const modal=document.createElement('div');modal.className='modal work-mode';modal.style.cssText='min-width:760px;width:1120px;position:relative;display:block;';
   modal.innerHTML='<div class="work-detail-doc"><input aria-label="상세 입력" value="LOT-TEST"><button type="button">확인</button><table><tbody><tr><td>원료 LOT</td><td>시험 LOT</td></tr></tbody></table></div>';
   body.appendChild(modal);
   const input=modal.querySelector('input'),button=modal.querySelector('button'),table=modal.querySelector('table');
   const result={modalWidth:modal.getBoundingClientRect().width,viewport:innerWidth,minWidth:getComputedStyle(modal).minWidth,inputFont:parseFloat(getComputedStyle(input).fontSize),buttonHeight:button.getBoundingClientRect().height,tableScrollable:getComputedStyle(table).overflowX};
   modal.remove();return result;
  });
  assert.ok(detailMetrics.modalWidth<=detailMetrics.viewport,'Work-order detail modal exceeds mobile viewport: '+JSON.stringify(detailMetrics));
  assert.ok(detailMetrics.inputFont>=16,'Work-order detail input font too small: '+JSON.stringify(detailMetrics));
  assert.ok(detailMetrics.buttonHeight>=44,'Work-order detail button too short: '+JSON.stringify(detailMetrics));
  assert.equal(detailMetrics.tableScrollable,'auto','Work-order detail table cannot scroll horizontally');
  const layout=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}));
  assert.ok(layout.documentWidth<=layout.viewport+2,'Mobile shell horizontal overflow: '+JSON.stringify(layout));
  // Verify a narrower phone without changing any production route or data.
  await page.setViewportSize({width:320,height:700});
  const narrow=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth,workVisible:document.body.classList.contains('in-work')}));
  assert.equal(narrow.workVisible,true,'Work-order view lost after narrow viewport resize');
  assert.ok(narrow.documentWidth<=narrow.viewport+2,'320px phone horizontal overflow: '+JSON.stringify(narrow));
  // Recheck the real PC work-detail modal's former 760px minimum at 320px.
  const narrowDetail=await page.frameLocator('#pc').locator('body').evaluate(body=>{
   const modal=document.createElement('div');modal.className='modal work-mode';modal.style.cssText='position:relative;display:block;min-width:760px;width:1120px;';
   modal.innerHTML='<div class="work-detail-doc"><input aria-label="작업지시서 상세 LOT"><button type="button">닫기</button></div>';
   body.appendChild(modal);
   const result={viewport:innerWidth,width:modal.getBoundingClientRect().width,inputFont:parseFloat(getComputedStyle(modal.querySelector('input')).fontSize),buttonHeight:modal.querySelector('button').getBoundingClientRect().height};
   modal.remove();return result;
  });
  assert.ok(narrowDetail.width<=narrowDetail.viewport,'320px work detail exceeds viewport: '+JSON.stringify(narrowDetail));
  assert.ok(narrowDetail.inputFont>=16&&narrowDetail.buttonHeight>=44,'320px work detail controls too small: '+JSON.stringify(narrowDetail));
  const narrowInput=await page.frameLocator('#pc').locator('#mock-lot').evaluate(el=>({font:parseFloat(getComputedStyle(el).fontSize),width:el.getBoundingClientRect().width}));
  assert.ok(narrowInput.font>=16&&narrowInput.width>0,'320px work input unusable: '+JSON.stringify(narrowInput));
  await page.locator('#backhome').click();
  await page.locator('#home').waitFor({state:'visible'});
  const narrowHome=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}));
  assert.ok(narrowHome.documentWidth<=narrowHome.viewport+2,'320px mobile home horizontal overflow: '+JSON.stringify(narrowHome));
  await page.screenshot({path:path.join('artifacts/qmes-mobile','home-320.png'),fullPage:true});
  // Cover a common Android phone width and landscape rotation as well.
  for(const [width,height,label] of [[412,915,'412px portrait'],[844,390,'landscape']]){
   await page.setViewportSize({width,height});
   await page.locator('#home').waitFor({state:'visible'});
   const dims=await page.evaluate(()=>({viewport:innerWidth,documentWidth:document.documentElement.scrollWidth}));
   assert.ok(dims.documentWidth<=dims.viewport+2,label+' home horizontal overflow: '+JSON.stringify(dims));
   await page.locator('[data-find="작업지시"]').first().click();
   await page.locator('body.in-work').waitFor();
   assert.equal(await page.frameLocator('#pc').locator('body').getAttribute('data-active'),'work',label+' work navigation failed');
   await page.locator('#backhome').click();
  }
  await page.setViewportSize({width:390,height:844});


  console.log('PASS: 390px mobile shell, real PC sidebar work order/IQC/PQC/OQC navigation, menu and home (mock business data only)');
 } finally {await browser.close()}
})().catch(err=>{console.error(err);process.exitCode=1});
