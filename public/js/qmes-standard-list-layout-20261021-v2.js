/* Present the standard-document list without changing stored field indexes. */
(function () {
  'use strict';
  const style = document.createElement('style');
  style.textContent = `
html body #standard .module-body{border:0!important}
html body #standard .std-document-list{min-width:1050px!important;table-layout:fixed}
html body #standard .std-document-list tr{display:grid;grid-template-columns:5% 30% 7% 12% 11% 13% 22%}
html body #standard .std-document-list tr>:is(:nth-child(2),:nth-child(4),:nth-child(8)){display:none!important}
html body #standard .std-document-list tr>:nth-child(1){order:1}
html body #standard .std-document-list tr>:nth-child(3){order:2}
html body #standard .std-document-list tr>:nth-child(4){order:3}
html body #standard .std-document-list tr>:nth-child(5){order:4}
html body #standard .std-document-list tr>:nth-child(6){order:5}
html body #standard .std-document-list tr>:nth-child(7){order:6}
html body #standard .std-document-list tr>:nth-child(9){order:7}
html body #standard .std-document-list tr>:nth-child(8){order:8}
html body #standard .std-document-list tr>:nth-child(10){order:9}
html body #standard .std-document-list :is(th,td){display:flex;flex-direction:column;align-items:flex-start;justify-content:center;text-align:left!important;border:0!important;min-width:0;padding:12px 14px!important}
html body #standard .std-document-list thead th{height:40px!important;background:#edf4f9!important;color:#69839d!important;font-size:11px!important}
html body #standard .std-document-list tbody td{height:68px!important;border-bottom:1px solid #edf2f7!important;color:#365574!important;font-size:12px!important}
html body #standard .std-document-list .std-document-name{color:#1673c7!important;font-weight:600!important;text-decoration:underline;cursor:pointer}
html body #standard .std-document-list .std-document-name::after{content:attr(data-document-number);display:block;color:#8193a7;font-size:11px;font-weight:400;margin-top:4px;text-decoration:none}
html body #standard .std-document-list .std-approval-label{border:0;border-radius:20px;padding:4px 10px;font-size:11px;background:#f0f3f7;color:#61748a}
html body #standard .std-document-list .std-approval-label[data-approved="true"]{background:#e9f7ef;color:#39946a}
html body #standard .std-document-list .std-extra-cell{color:#8193a7!important}
html body #standard .std-document-list tr.std-empty{display:block}
html body #standard .std-document-list tr.std-empty td{display:flex!important;align-items:center;height:100px!important;color:#8193a7!important}
`;
  document.head.append(style);
  function enhance() {
    const section = document.getElementById('standard');
    const table = section?.querySelector('.module-body > table');
    if (!table) return;
    table.classList.add('std-document-list');
    const header = table.querySelector('thead tr');
    if (!header || header.children.length < 8) return;
    if (!header.dataset.stdLayout) {
      header.dataset.stdLayout = '1';
      header.children[0].textContent = 'No.';
      header.children[2].textContent = '문서번호 / 문서명';
      header.children[7].textContent = '결재상태';
      for (const title of ['첨부파일', '비고']) {
        const cell = document.createElement('th'); cell.textContent = title; header.append(cell);
      }
    }
    const body=table.tBodies[0]||table.createTBody();
    const placeholder=body.querySelector('tr[data-std-placeholder]');
    if(placeholder&&Array.from(body.rows).some(row=>row!==placeholder))placeholder.remove();
    if(!body.rows.length){
      const blank=document.createElement('tr');
      blank.dataset.stdPlaceholder='1';blank.className='std-placeholder';blank.setAttribute('aria-hidden','true');
      for(let i=0;i<header.children.length;i++)blank.appendChild(document.createElement('td'));
      body.appendChild(blank);
    }
    table.querySelectorAll('tbody tr').forEach(row => {
      if(row.dataset.stdPlaceholder==='1')return;
      if (row.children.length < 8) { row.classList.add('std-empty'); return; }
      const cells = row.children;
      cells[2].classList.add('std-document-name');
      cells[2].dataset.documentNumber = cells[1].textContent.trim();
      if (!row.dataset.stdLayout) {
        row.dataset.stdLayout = '1';
        const status = cells[7];
        if (!status.querySelector('button,a,input,select')) {
          const label = document.createElement('span'); label.className = 'std-approval-label';
          label.textContent = status.textContent.trim() || '미지정';
          label.dataset.approved = String(label.textContent === '승인완료');
          status.replaceChildren(label);
        }
        for (const label of ['첨부 없음', row.dataset.remarks || '-']) {
          const cell = document.createElement('td'); cell.className = 'std-extra-cell'; cell.textContent = label; row.append(cell);
        }
      }
    });
  }
  function start() {
    const section = document.getElementById('standard');
    if (!section) return;
    const observer = new MutationObserver(() => {
      observer.disconnect(); enhance(); observe();
    });
    const observe = () => observer.observe(section, {childList:true,subtree:true,characterData:true});
    enhance(); observe();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, {once:true});
  else start();
})();

/* Match work/NCR/equipment summary headings to the incoming inspection summary. */
(function(){
 const style=document.createElement('style');style.id='qmes-work-summary-heading-parity-20261026';
 style.textContent=`
 html body #work .module-shell>.nwi-list-head,
 html body #ncr .ncr-equipment-card>.ncr-list-head,
 html body #equipment .eq-parity-summary{
  box-sizing:border-box!important;margin:0!important;
  padding:11px 16px!important;min-height:52px!important;
  display:flex!important;align-items:center!important;justify-content:space-between!important;
  background:#fff!important;color:#1e3f64!important;
  font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;
  font-size:13.5px!important;font-weight:800!important;line-height:normal!important;
 }
 html body #work .nwi-list-head>span:first-child,
 html body #ncr .ncr-list-head>span:first-child,
 html body #equipment .eq-parity-summary>b{
  margin:0!important;padding:0!important;color:#1e3f64!important;
  font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;
  font-size:13.5px!important;font-weight:800!important;line-height:normal!important;
 }
 `;document.head.append(style);
})();

/* Shared inquiry spacing, measured from incoming inspection. */
(function(){
 const style=document.createElement('style');style.id='qmes-inquiry-spacing-parity-20261026';
 style.textContent=`
 html body :is(.module-page,.module-page.active) .ip-toolbar,
 html body :is(#orders,#purchase,#quality,#standard,#approval) .module-toolbar,
 html body #work #namo-work-inquiry,
 html body #equipment .eq-parity-filters,
 html body #ncr .ncr-equipment-card>.ncr-tools{
  box-sizing:border-box!important;margin:0!important;padding:12px 16px!important;
 }
 html body .module-page .ip-filter-row,
 html body :is(#orders,#purchase) .qpf-grid,
 html body #work #namo-work-inquiry .nwi-grid,
 html body #equipment .eq-parity-filters,
 html body #ncr .ncr-equipment-card>.ncr-tools,
 html body :is(#quality,#standard,#approval) .module-toolbar>.filters{
  display:flex!important;flex-wrap:wrap!important;align-items:center!important;
  gap:10px 20px!important;min-width:0!important;
 }
 html body .module-page .ip-filter-row>.ip-filter,
 html body :is(#orders,#purchase) .qpf-field,
 html body #work #namo-work-inquiry .nwi-grid>label,
 html body #equipment .eq-parity-filters>label,
 html body #ncr .ncr-equipment-card>.ncr-tools>label{
  display:flex!important;flex-direction:row!important;align-items:center!important;
  flex:0 0 auto!important;gap:8px!important;margin:0!important;padding:0!important;
  min-width:0!important;width:auto!important;font-size:11.5px!important;font-weight:700!important;
  line-height:30px!important;color:#344d67!important;white-space:nowrap!important;
 }
 html body .module-page .ip-filter>span,
 html body :is(#orders,#purchase) .qpf-field>span,
 html body #work #namo-work-inquiry .nwi-grid>label>span{
  flex:0 0 auto!important;min-width:0!important;width:auto!important;margin:0!important;padding:0!important;
  text-align:left!important;font-size:11.5px!important;font-weight:700!important;line-height:30px!important;
 }
 html body .module-page .ip-filter :is(input:not([type=hidden]),select),
 html body :is(#orders,#purchase) .qpf-field :is(input:not([type=hidden]),select),
 html body #work #namo-work-inquiry .nwi-grid>label :is(input:not([type=hidden]),select),
 html body #equipment .eq-parity-filters>label :is(input:not([type=hidden]),select),
 html body #ncr .ncr-equipment-card>.ncr-tools>label :is(input:not([type=hidden]),select),
 html body :is(#quality,#standard,#approval) .module-toolbar>.filters :is(input:not([type=hidden]),select){
  box-sizing:border-box!important;width:195px!important;min-width:195px!important;max-width:195px!important;
  flex:0 0 195px!important;height:30px!important;min-height:30px!important;margin:0!important;
  padding:0 8px!important;border:1px solid #ccdaea!important;border-radius:4px!important;
  background:#fff!important;color:#294763!important;font-family:inherit!important;font-size:12px!important;font-weight:600!important;
 }
 html body :is(#orders,#purchase) .qpf-field .pcal-root,
 html body #work #namo-work-inquiry .nwi-period-trigger,
 html body #equipment .eq-parity-filters>label input[data-filter-date],
 html body #ncr .ncr-period-trigger,
 html body .module-page :is(.qic-period-trigger,.qpc-period-trigger,.qoc-period-trigger){
  box-sizing:border-box!important;width:215px!important;min-width:215px!important;max-width:215px!important;
  flex:0 0 215px!important;height:30px!important;min-height:30px!important;margin:0!important;
 }
 html body #work #namo-work-inquiry .nwi-grid>[hidden],
 html body #ncr .ncr-tools[hidden]{display:none!important}
 `;document.head.append(style);
})();

(()=>{const s=document.createElement('style');s.id='qmes-inquiry-specificity-fix-20261026';s.textContent=`
html body #work #namo-work-inquiry .nwi-grid.nwi-single-row-six>label>input[data-filter],
html body #work #namo-work-inquiry .nwi-grid.nwi-single-row-six>label>select[data-filter]{
width:195px!important;min-width:195px!important;max-width:195px!important;flex:0 0 195px!important}
html body #spcTrend#spcTrend .ip-toolbar{padding:12px 16px!important}
html body #spcTrend .ip-toolbar .ip-filter-row{display:flex!important;flex-wrap:wrap!important;gap:10px 20px!important;align-items:center!important}
html body #spcTrend .ip-toolbar .ip-filter{display:flex!important;align-items:center!important;gap:8px!important;margin:0!important}
html body #spcTrend .ip-toolbar .ip-filter>span{font-size:11.5px!important;font-weight:700!important;line-height:30px!important;text-align:left!important}
html body #spcTrend .ip-toolbar .ip-filter :is(input,select){width:195px!important;min-width:195px!important;max-width:195px!important;height:30px!important;box-sizing:border-box!important;margin:0!important}
`;document.head.append(s);})();

/* Remove SPC theme's fixed label columns and oversized inquiry controls. */
(()=>{const style=document.createElement('style');style.id='spc-compact-inquiry-final-20261026';style.textContent=`
html body #spcTrend#spcTrend .ip-toolbar .ip-filter-row>.ip-filter{gap:8px!important;margin:0!important;padding:0!important;min-height:30px!important;align-items:center!important}
html body #spcTrend#spcTrend .ip-toolbar .ip-filter-row>.ip-filter>span{flex:0 0 auto!important;min-width:0!important;width:auto!important;max-width:none!important;font-size:11.5px!important;font-weight:700!important;line-height:30px!important;margin:0!important;padding:0!important}
html body #spcTrend#spcTrend .ip-toolbar .ip-filter-row>.ip-filter :is(input,select){width:195px!important;min-width:195px!important;max-width:195px!important;flex:0 0 195px!important;height:30px!important;min-height:30px!important;max-height:30px!important;font-size:12px!important;font-weight:600!important;padding:0 8px!important;margin:0!important;border:1px solid #ccdaea!important;border-radius:4px!important;box-sizing:border-box!important}
`;document.head.append(style);})();

/* Work list customer text follows ordinary body-cell weight. */
(()=>{const s=document.createElement('style');s.id='work-customer-normal-weight-20261026';s.textContent='html body #work#work table.work-list-table tbody tr>td:nth-child(3),html body #work#work table.work-list-table tbody tr>td:nth-child(3) *{font-weight:400!important}';document.head.append(s);})();

/* Shared list table metrics from incoming inspection; no detail/report tables. */
(function(){
 'use strict';
 const ids=['orders','purchase','work','process','outgoing','equipment','quality','ncr','approval','standard','spcTrend','changeControl','instrumentMgmt','calibrationMgmt','namo-production-final-panel'];
 const roots=ids.map(id=>'#'+id+'#'+id).join(',');
 const scope='html body :is('+roots+') table.qmes-iqc-list-parity';
 const s=document.createElement('style');s.id='qmes-iqc-list-table-parity-20261026';
 s.textContent=scope+'{font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:12px!important;border-spacing:0!important}'+
 scope+' thead th{box-sizing:border-box!important;height:34px!important;min-height:34px!important;padding:4px 6px!important;font-size:12px!important;font-weight:600!important;line-height:1.25!important;color:#244260!important;background:#e8f0f8!important;border-color:#cbd8e5!important;text-align:center!important;vertical-align:middle!important}'+
 scope+' tbody td{box-sizing:border-box!important;height:44px!important;min-height:44px!important;padding:5px 6px!important;font-size:12px!important;font-weight:400!important;line-height:1.4!important;border-color:#d5dce5!important;text-align:center!important;vertical-align:middle!important;white-space:normal!important;overflow-wrap:anywhere!important}'+
 scope+' tbody td :is(span,strong,b,a){font-family:inherit!important;font-size:12px!important}'+
 scope+' input[type=checkbox]{box-sizing:border-box!important;width:13px!important;height:13px!important;min-width:13px!important;max-width:13px!important;min-height:13px!important;max-height:13px!important;margin:0!important;padding:0!important;vertical-align:middle!important;accent-color:#2563eb}'+
 scope+' tbody td button{box-sizing:border-box!important;height:24px!important;min-height:24px!important;padding:0 8px!important;font-family:inherit!important;font-size:11px!important;line-height:22px!important;border-radius:4px!important}'+
 scope+' :is(th,td).qmes-iqc-check-col{width:34px!important;min-width:34px!important;max-width:34px!important;padding:0!important}'+
 scope+' :is(th,td).qmes-iqc-no-col{width:52px!important;min-width:52px!important;max-width:52px!important;padding:4px!important}'+
 scope+' :is(th,td).qmes-iqc-combined-col{width:86px!important;min-width:86px!important;max-width:86px!important;padding:0!important}'+
 scope+' col.qmes-iqc-check-col{width:34px!important}'+scope+' col.qmes-iqc-no-col{width:52px!important}'+scope+' col.qmes-iqc-combined-col{width:86px!important}';
 document.head.append(s);
 function apply(table){
  if(table.closest('.am-split,.work-form,.report-sheet,.ncr-form,.ncr-editor-shell,.eq-print'))return;
  if(!table.tHead||!table.tBodies.length)return;
  table.classList.add('qmes-iqc-list-parity');
  const headers=[...table.tHead.rows[0].cells],first=headers[0];if(!first)return;
  const checkbox=!!first.querySelector('input[type=checkbox]');
  const title=first.textContent.trim().replace(/\s/g,'');
  const combined=checkbox&&/No\.?|번호/i.test(title);
  const noOnly=!checkbox&&/^(No\.?|NO\.?|번호)$/i.test(title);
  const kinds=combined?['qmes-iqc-combined-col']:checkbox?['qmes-iqc-check-col','qmes-iqc-no-col']:noOnly?['qmes-iqc-no-col']:[];
  const cols=[...table.querySelectorAll(':scope>colgroup>col')];
  kinds.forEach((name,index)=>{
   headers[index]?.classList.add(name);cols[index]?.classList.add(name);
   for(const body of table.tBodies)for(const row of body.rows)if(row.cells.length===headers.length)row.cells[index]?.classList.add(name);
  });
 }
 function scan(){for(const id of ids){const root=document.getElementById(id);root?.querySelectorAll('table').forEach(apply);}}
 let queued=false;
 function schedule(){if(queued)return;queued=true;queueMicrotask(()=>{queued=false;scan();});}
 function boot(){new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});scan();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();

/* Center list checkboxes without overriding the shared 13px dimensions. */
(()=>{const s=document.createElement('style');s.id='qmes-list-checkbox-center-20261026';s.textContent=`
html body :is(#orders#orders,#purchase#purchase,#work#work,#outgoing#outgoing) table.qmes-iqc-list-parity input[type=checkbox]{margin:0 auto!important;display:block!important;float:none!important;position:static!important;align-self:center!important;justify-self:center!important}
html body :is(#orders#orders,#purchase#purchase,#work#work,#outgoing#outgoing) table.qmes-iqc-list-parity :is(th,td).qmes-iqc-check-col{padding:0!important;text-align:center!important;vertical-align:middle!important}
html body :is(#orders#orders,#purchase#purchase,#work#work,#outgoing#outgoing) table.qmes-iqc-list-parity :is(.qpf-select,.iqc-select-number){align-items:center!important;justify-items:center!important}
`;document.head.append(s);})();

/* Keep IQC detail fields readable on wide desktop displays; print unchanged. */
(()=>{const style=document.createElement('style');style.id='iqc-detail-readable-width-20261026';style.textContent=`
@media screen{

html body #mainWorkspace .am-split[data-am-screen="incoming"] .form-grid.iqc-edit-settings-frame{box-sizing:border-box!important;width:100%!important;max-width:1100px!important;margin-left:auto!important;margin-right:auto!important}
}
`;document.head.append(style);})();

/* Purchase document links match work-order number emphasis. */
(()=>{const s=document.createElement('style');s.id='purchase-number-work-parity-20261026';s.textContent='html body #purchase#purchase table.qmes-iqc-list-parity tbody td.qpu-order-number,html body #purchase#purchase table.qmes-iqc-list-parity tbody td.qpu-order-number :is(a,span){color:#1565c0!important;font-weight:700!important;text-decoration:underline!important}';document.head.append(s);})();

/* The process list wrapper owns the bottom border; avoid a doubled final row line. */
(()=>{const s=document.createElement('style');s.id='process-list-single-bottom-border-20261026';s.textContent='html body #process#process table.ip-table.qmes-iqc-list-parity tbody tr:last-child>td{border-bottom:0!important;box-shadow:none!important}';document.head.append(s);})();

(()=>{const style=document.createElement('style');style.id='approval-list-row-bottom-20261026';style.textContent='html body #approval#approval>.module-shell>.module-body{min-height:0!important;height:auto!important;max-height:none!important;padding:0!important;border:1px solid #d5dce5!important}html body #approval#approval>.module-shell>.module-body>table{height:auto!important;min-height:0!important;margin:0!important}html body #approval#approval>.module-shell>.module-body>table tbody tr>td{border-bottom:1px solid #d5dce5!important}html body #approval#approval>.module-shell>.module-body>table tbody tr:last-child>td{border-bottom:0!important}';document.head.append(style);})();

(()=>{const s=document.createElement('style');s.id='standard-list-grid-parity-20261027';s.textContent="\n/* Document list uses seven visible grid columns with no fixed-width No. cell gap. */\nhtml body #standard#standard>.module-shell>.module-body{height:auto!important;min-height:0!important;background:#fff!important;border:1px solid #d5dce5!important}\nhtml body #standard#standard .std-document-list{display:block!important;width:100%!important;min-width:1050px!important;border:0!important;border-spacing:0!important}\nhtml body #standard#standard .std-document-list>colgroup{display:none!important}\nhtml body #standard#standard .std-document-list :is(thead,tbody){display:block!important;width:100%!important}\nhtml body #standard#standard .std-document-list tr{display:grid!important;grid-template-columns:52px minmax(260px,2.6fr) minmax(80px,.7fr) minmax(110px,1fr) minmax(100px,1fr) minmax(130px,1.2fr) minmax(130px,1.2fr)!important;width:100%!important;background:#fff!important}\nhtml body #standard#standard .std-document-list :is(th,td){box-sizing:border-box!important;width:100%!important;min-width:0!important;max-width:none!important;align-items:center!important;justify-content:center!important;text-align:center!important;border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;padding:8px 12px!important}\nhtml body #standard#standard .std-document-list thead tr{background:#e8f0f8!important}\nhtml body #standard#standard .std-document-list thead th{height:34px!important;min-height:34px!important;background:#e8f0f8!important;color:#244260!important;font-size:12px!important;font-weight:600!important;line-height:18px!important}\nhtml body #standard#standard .std-document-list tbody td{height:44px!important;min-height:44px!important;background:#fff!important;font-size:12px!important;font-weight:400!important;line-height:18px!important}\nhtml body #standard#standard .std-document-list tr>:last-child{border-right:0!important}\nhtml body #standard#standard .std-document-list tbody tr:last-child td{border-bottom:0!important}\nhtml body #standard#standard .std-document-list tr.std-empty{display:block!important}\nhtml body #standard#standard .std-document-list tr.std-empty td{height:44px!important;min-height:44px!important}\n";document.head.append(s);})();

(()=>{const style=document.createElement('style');style.id='standard-white-row-single-edge-20261027';style.textContent=`
html body #standard#standard>.module-shell>.module-body{border:1px solid #d5dce5!important;box-shadow:none!important}
html body #standard#standard .std-document-list thead th{border-bottom:1px solid #d5dce5!important}
html body #standard#standard .std-document-list tbody tr:last-child>td{border-bottom:0!important;box-shadow:none!important}
html body #standard#standard .std-document-list tr.std-placeholder>td{height:44px!important;min-height:44px!important;background:#fff!important}
`;document.head.append(style);})();
