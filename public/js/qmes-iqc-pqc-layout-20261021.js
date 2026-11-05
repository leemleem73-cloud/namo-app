/* IQC registration layout parity with PQC. Keep the original field IDs and save wiring. */
(function () {
  'use strict';
  function singleIqcChecks(table){
    if(!table)return;
    table.dataset.iqcSingleCheck='1';
    const headers=['NO','검사항목','검사기준','검사방법 / 기기','확인 결과','판정'];
    const heading=table.querySelector('thead tr');
    if(heading){
      const cells=[...heading.children];
      if(cells.length===8){cells[6].remove();cells[5].remove();}
      [...heading.children].forEach((cell,index)=>cell.textContent=headers[index]||'');
    }
    const columns=[...table.querySelectorAll('colgroup col')];
    if(columns.length===8){columns[6].remove();columns[5].remove();}
    [...table.querySelectorAll('colgroup col')].forEach((col,index)=>col.style.setProperty('width',[5,12,26,17,25,15][index]+'%','important'));
    table.querySelectorAll('tbody tr').forEach(row=>{
      const cells=[...row.children];
      if(cells.length===8){cells[6].remove();cells[5].remove();}
      const label=row.querySelector('.item')?.textContent.trim()||'';
      const judge=row.querySelector('.std-row-judge');
      if(judge?.tagName==='SELECT'&&!judge.querySelector('option[value=""]')){
        const initial=judge.value;
        const option=document.createElement('option');option.value='';option.textContent='선택';
        judge.insertBefore(option,judge.firstChild);
        if(!initial||initial==='대기')judge.value='';
        judge.setAttribute('aria-label',label+' 판정 선택');
      }
      const input=row.querySelector('.std-measure');
      if(input){
        input.setAttribute('aria-label',label==='중량'?'입고 확인 중량(kg)':label+' 확인 결과');
        if(label==='중량')input.placeholder='확인 중량 (kg)';
      }
    });
  }
  const original = window.standardInspectionForm;
  if (typeof original !== 'function') return;
  window.standardInspectionForm = function (type) {
    const markup = original.apply(this, arguments);
    if (type !== 'incoming') return markup;
    const template = document.createElement('template');
    template.innerHTML = markup;
    const root = template.content.querySelector('.std-inspection');
    root.classList.add('iqc-pqc-layout');
    root.querySelector('.std-inspection-head')?.remove();
    root.querySelector('.std-premium-band')?.remove();
    const titles = [...root.querySelectorAll('.std-section-title')];
    titles.forEach(title => title.remove());
    const info = root.querySelector('.std-info');
    const fields = [...info.children];
    info.classList.add('am-inline-edit-grid');
    for (let index = 0; index < fields.length; index += 2) {
      const cell = document.createElement('div');
      cell.className = 'am-inline-cell';
      const label = document.createElement('label');
      label.textContent = fields[index].textContent;
      const input = fields[index + 1].querySelector('input,select');
      if (input?.id) label.htmlFor = input.id;
      cell.append(label, fields[index + 1]);
      fields[index].remove();
      info.append(cell);
    }
    // Keep each date input with its label and existing save binding.
    const dateCells = [...info.querySelectorAll('.am-inline-cell')];
    const receiptDate = dateCells.find(cell => cell.querySelector('label')?.textContent.trim() === '입고일자');
    const inspectionDate = dateCells.find(cell => cell.querySelector('label')?.textContent.trim() === '검사일자');
    if (receiptDate && inspectionDate) info.prepend(receiptDate, inspectionDate);
    const summary = root.querySelector('.std-summary-grid');
    [...summary.querySelectorAll('.std-summary-card')].slice(0, 2).forEach((card, index) => {
      const cell = document.createElement('div');
      cell.className = 'am-inline-cell';
      const label = document.createElement('label');
      label.textContent = index === 0 ? '검사합부' : '검사상태';
      const value = card.querySelector('.value');
      value.className = 'v';
      cell.append(label, value);
      info.append(cell);
    });
    summary.remove();
    const remarks = root.querySelector('.std-premium-remarks');
    const remarkCell = document.createElement('div');
    remarkCell.className = 'am-inline-cell full';
    const label = document.createElement('label');
    label.textContent = '비고';
    const textarea = remarks.querySelector('textarea');
    textarea.removeAttribute('style');
    textarea.placeholder = '비고 입력';
    remarkCell.append(label, textarea);
    info.append(remarkCell);
    remarks.remove();
    const table = root.querySelector('.std-result-wrap');
    const section = document.createElement('section');
    section.className = 'am-section iqc-pqc-measure-section';
    section.innerHTML = '<div class="am-section-head"><b>검사항목</b><span>외관·라벨·입고 중량·COA 각 1회 확인</span></div>';
    table.before(section);
    section.append(table);
    info.querySelectorAll('.am-inline-cell').forEach(cell=>{
      const name=cell.querySelector('label')?.textContent.trim();
      if(!['원료명','공급업체','검사합부','검사상태'].includes(name))return;
      const select=cell.querySelector('select');if(select)select.dataset.iqcTextStart='1';
    });
    singleIqcChecks(root.querySelector('.std-result'));
    return root.outerHTML;
  };
  const style = document.createElement('style');
  style.id = 'iqc-pqc-layout-20261021';
  style.textContent = `
  .am-split[data-am-screen="incoming"] .iqc-pqc-layout{border:0!important;background:#fff!important}
  .iqc-pqc-layout .std-info.am-inline-edit-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;border:1px solid #e0e5eb!important;border-bottom:0!important}
  .iqc-pqc-layout .std-info .am-inline-cell{min-width:0;grid-template-columns:128px minmax(0,1fr)!important}
  .iqc-pqc-layout .std-info .am-inline-cell>.v{padding:0!important;min-height:0!important;border:0!important;min-width:0!important}
  .iqc-pqc-layout .std-info input,.iqc-pqc-layout .std-info select{height:29px!important;min-height:29px!important;border-radius:2px!important;background:#fff!important;font-size:11px!important}
  html body #mainWorkspace #workspaceBody .iqc-pqc-layout .std-info select[data-iqc-text-start="1"]{text-align:left!important;text-align-last:left!important;text-indent:0!important;padding-left:8px!important}
  .iqc-pqc-layout .std-info textarea{height:68px!important;resize:vertical!important}
  .iqc-pqc-layout .iqc-pqc-measure-section{margin-top:16px!important}
  .iqc-pqc-layout .std-result{width:100%!important;table-layout:fixed!important;border-collapse:collapse!important;border:1px solid #dce3ec!important;font-size:13px!important}
  .iqc-pqc-layout .std-result th,.iqc-pqc-layout .std-result td{height:54px!important;box-sizing:border-box!important;border:1px solid #dce3ec!important;padding:10px 8px!important;text-align:center!important;vertical-align:middle!important;line-height:1.45!important;font-size:13px!important;color:#35435b!important;background:#fff!important}
  .iqc-pqc-layout .std-result thead th{height:46px!important;background:#f4f6fa!important;font-weight:700!important}
  .iqc-pqc-layout .std-result input,.iqc-pqc-layout .std-result select{width:100%!important;min-width:0!important;height:38px!important;border:1px solid #dce3ed!important;border-radius:6px!important;background:#fff!important;font-size:13px!important;text-align:center!important}
  .iqc-pqc-layout .std-result col.no{width:5%}.iqc-pqc-layout .std-result col.item{width:12%}.iqc-pqc-layout .std-result col.spec{width:20%}.iqc-pqc-layout .std-result col.method{width:13%}.iqc-pqc-layout .std-result col.m{width:13.333%}.iqc-pqc-layout .std-result col.judge{width:10%}
  .iqc-pqc-layout .std-approval-row{margin-top:12px!important;display:grid!important;grid-template-columns:138px repeat(3,minmax(0,1fr))!important;border:1px solid #cbd6e2!important}
  .iqc-pqc-layout .approval-label{background:#f2f5f9!important;color:#2c3c50!important;font-size:12px!important}
  .iqc-pqc-layout .std-approval-item .pqc-approval-heading{background:#f9fbfd!important;font-size:12px!important}
  .iqc-pqc-layout .std-approval-item .pqc-approval-person{font-size:12px!important}
  .iqc-pqc-layout .std-premium-footer{border:1px solid #cbd6e2!important;border-top:0!important;background:#fff!important;color:#65768a!important;padding:9px 12px!important;font-size:11px!important}
  @media(max-width:1100px){.iqc-pqc-layout .std-info.am-inline-edit-grid{grid-template-columns:1fr!important}.iqc-pqc-layout .std-result-wrap{overflow-x:auto!important}}
  @media(max-width:760px){.iqc-pqc-layout .std-info .am-inline-cell{grid-template-columns:104px minmax(0,1fr)!important}.iqc-pqc-layout .std-approval-row{grid-template-columns:90px repeat(3,minmax(0,1fr))!important}}
  `;
  document.head.append(style);
})();

/* Align IQC report blocks and give each shared edge exactly one stroke. */
(function(){
 const style=document.createElement('style');style.id='iqc-report-alignment-single-borders-20261028';
 const pane='html body #mainWorkspace .am-split[data-am-screen="incoming"]:has(.iqc-pqc-layout)';
 const base=pane+' .iqc-pqc-layout';
 style.textContent=
 pane+' .am-detail-pane>.am-section>.am-section-body{padding:8px 0 0!important;box-sizing:border-box!important;min-width:0!important}'+
 base+'{width:100%!important;max-width:100%!important;min-width:0!important;margin:0!important;padding:0!important;border:0!important;outline:0!important;box-shadow:none!important;box-sizing:border-box!important}'+
 base+'>:is(.std-info,.iqc-pqc-measure-section,.iqc-esign-parity){width:100%!important;max-width:100%!important;min-width:0!important;margin-left:0!important;margin-right:0!important;box-sizing:border-box!important}'+
 base+' .std-info.am-inline-edit-grid{border:1px solid #d7e0e9!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell{border:0!important;border-right:1px solid #d7e0e9!important;border-bottom:1px solid #d7e0e9!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell:nth-child(2n),'+base+' .std-info.am-inline-edit-grid>.am-inline-cell.full{border-right:0!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell:last-child{border-bottom:0!important}'+
 base+' .std-info.am-inline-edit-grid>.am-inline-cell>label{border-right:1px solid #d7e0e9!important}'+
 base+' .iqc-pqc-measure-section{border:0!important;border-top:1px solid #65717e!important;margin-top:16px!important;padding:0!important;box-shadow:none!important}'+
 base+' .iqc-pqc-measure-section>.am-section-head{border-bottom:1px solid #d7e0e9!important;box-sizing:border-box!important}'+
 base+' .iqc-pqc-measure-section>.std-result-wrap{border:0!important;outline:0!important;box-shadow:none!important;margin:0!important;padding:8px 0 0!important;width:100%!important;box-sizing:border-box!important}'+
 base+' table.std-result{width:100%!important;min-width:0!important;box-sizing:border-box!important;border:1px solid #d7e0e9!important;border-collapse:separate!important;border-spacing:0!important;margin:0!important}'+
 base+' table.std-result :is(thead,tbody) tr>:is(th,td){border:0!important;border-right:1px solid #d7e0e9!important;border-bottom:1px solid #d7e0e9!important}'+
 base+' table.std-result tr>:last-child{border-right:0!important}'+
 base+' table.std-result tbody tr:last-child>*{border-bottom:0!important}'+
 base+' .iqc-esign-parity{border:1px solid #d7e0e9!important;outline:0!important;box-shadow:none!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table{border:0!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table>div{border:0!important;border-right:1px solid #d7e0e9!important;box-sizing:border-box!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table>.pqc-esign-head{border-bottom:1px solid #d7e0e9!important}'+
 base+' .iqc-esign-parity>.pqc-esign-table>div:nth-child(4),'+base+' .iqc-esign-parity>.pqc-esign-table>div:last-child{border-right:0!important}'+
 base+' .iqc-esign-parity>.pqc-esign-note{border:0!important;border-top:1px solid #d7e0e9!important}';
 document.head.append(style);
})();

/* Remove registration guidance without changing any inspection or approval fields. */
(function(){
 const selector='.am-split[data-am-screen="incoming"]:has(.iqc-pqc-layout)';
 function clean(){
  document.querySelectorAll(selector).forEach(pane=>{
   pane.querySelector('.am-detail-top .title-wrap>small')?.remove();
   pane.querySelector('.am-detail-note')?.remove();
   const footer=pane.querySelector('.iqc-esign-parity>.pqc-esign-note');
   if(footer&&footer.textContent!=='(주)나모케미칼')footer.textContent='(주)나모케미칼';
  });
 }
 const style=document.createElement('style');style.id='iqc-registration-copy-clean-20261028';
 style.textContent=selector+' .am-detail-top .title-wrap>small,'+selector+' .am-detail-note{display:none!important}html body #mainWorkspace '+selector+' .iqc-esign-parity>.pqc-esign-note{display:flex!important;align-items:center!important;justify-content:center!important;text-align:center!important}';
 document.head.append(style);
 let pending=false;new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;clean();});}}).observe(document.body,{childList:true,subtree:true});
 clean();
})();

/* IQC edit checks parity: show and persist saved item results in the existing editor. */
(function(){
'use strict';
const specs=[['외관','이물질 혼입 및 외관 이상 없을 것','육안'],['라벨','품명·LOT·표기사항 일치할 것','육안'],['중량','표시중량 및 입고기준 만족','저울'],['COA 확인','공급사 COA 및 LOT 일치 확인','문서확인']];
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function items(row){try{const a=typeof row.items_json==='string'?JSON.parse(row.items_json):row.items_json;return Array.isArray(a)?a:[];}catch{return [];}}
function canonical(name){return ['COA','COA확인'].includes(String(name||'').trim().replace(/\s+/g,'').toUpperCase())?'COA 확인':String(name||'').trim();}
function read(row){const saved=items(row);return specs.map(([name])=>{const old=saved.find(x=>canonical(x.name)===name);return {name,value:String(old?.values?.[0]??old?.value??''),judge:String(old?.judge||'')};});}
function overall(checks){if(checks.some(c=>c.judge==='불합격'||['부적합','이상있음','미확인'].includes(c.value)))return '불합격';if(checks.some(c=>!c.value.trim()||c.judge!=='합격'||c.value==='확인중'))return '대기';return '합격';}
function merge(row,checks){const saved=items(row).map(x=>({...x}));for(const check of checks){const i=saved.findIndex(x=>canonical(x.name)===check.name),old=i>=0?saved[i]:{};const next={...old,name:check.name,values:[check.value],value:check.value,judge:check.judge||'대기'};if(Array.isArray(old.values)&&old.values.length>1&&!old.legacyValues)next.legacyValues=old.values.slice();if(i>=0)saved[i]=next;else saved.push(next);}return saved;}
const api={read,overall,merge};window.qmesIqcEditChecks=api;
const originalOpen=window.editIncomingRecord,originalItems=window.updateIqcRemarkItems;
if(typeof originalOpen!=='function'||typeof originalItems!=='function')return;
function options(values,current){return [...new Set(['',...values,...(current?[current]:[])])].map(v=>'<option value="'+esc(v)+'"'+(v===current?' selected':'')+'>'+esc(v||'선택')+'</option>').join('');}
window.editIncomingRecord=function(section,row){
 originalOpen.apply(this,arguments);
 const pane=document.querySelector('.am-split[data-am-screen="incoming"]'),frame=pane?.querySelector('.iqc-edit-settings-frame');if(!frame)return;
 const checks=read(row),box=document.createElement('section');box.className='iqc-edit-checks iqc-pqc-layout am-section';box.dataset.recordId=String(row.id);
 box.innerHTML='<div class="am-section-head"><b>검사항목</b><span>외관·라벨·입고 중량·COA 각 1회 확인</span></div><div class="std-result-wrap"><table class="std-result"><colgroup>'+[5,12,26,17,25,15].map(n=>'<col style="width:'+n+'%">').join('')+'</colgroup><thead><tr>'+['NO','검사항목','검사기준','검사방법 / 기기','확인 결과','판정'].map(v=>'<th>'+v+'</th>').join('')+'</tr></thead><tbody>'+checks.map((c,i)=>'<tr data-iqc-check="'+i+'"><td>'+(i+1)+'</td><td>'+esc(c.name)+'</td><td>'+esc(specs[i][1])+'</td><td>'+esc(specs[i][2])+'</td><td>'+(i===2?'<input data-check-value type="text" inputmode="decimal" placeholder="확인 중량 (kg)" value="'+esc(c.value)+'">':'<select data-check-value>'+options(i===3?['확인','확인중','미확인']:['적합','부적합'],c.value)+'</select>')+'</td><td><select data-check-judge>'+options(['대기','합격','불합격'],c.judge)+'</select></td></tr>').join('')+'</tbody></table></div>';
 frame.after(box);
 box._checks=checks;box._dirty=false;
 const summary=pane.querySelector('#iqcEditResult');if(summary){summary.disabled=true;summary.title='검사항목 판정으로 자동 계산됩니다.';}
 function changed(event){const tr=event.target.closest('[data-iqc-check]');if(!tr)return;const i=Number(tr.dataset.iqcCheck),check=checks[i];check.value=tr.querySelector('[data-check-value]').value;check.judge=tr.querySelector('[data-check-judge]').value;
 if(event.target.matches('[data-check-value]')&&i!==2){check.judge=['부적합','이상있음','미확인'].includes(check.value)?'불합격':['적합','이상없음','정상','확인','확인완료'].includes(check.value)?'합격':'대기';tr.querySelector('[data-check-judge]').value=check.judge;}
 box._dirty=true;if(summary)summary.value=overall(checks);
 }
 box.addEventListener('input',changed);box.addEventListener('change',changed);
};
window.updateIqcRemarkItems=function(row,remark,date,result){
 const box=document.querySelector('.am-split[data-am-screen="incoming"] .iqc-edit-checks');
 if(box?.dataset.recordId===String(row.id)&&box._dirty)return originalItems.call(this,{...row,items_json:merge(row,box._checks)},remark,date,overall(box._checks));
 return originalItems.apply(this,arguments);
};
const style=document.createElement('style');style.textContent='.iqc-edit-checks{margin-top:16px!important}.iqc-edit-checks>.std-result-wrap{padding-top:8px!important}.iqc-edit-checks .std-result td{font-weight:400!important}.iqc-edit-checks .std-result :is(input,select){font:inherit!important;color:#35435b!important}';document.head.append(style);
})();

/* Summarize actual saved inspection items, including label, mass and COA. */
(function(){
 if(typeof window.iqcItemSummary!=='function')return;
 window.iqcItemSummary=function(row){
  let items;try{items=typeof row.items_json==='string'?JSON.parse(row.items_json):row.items_json;}catch{items=[];}
  const labels=[...new Set((Array.isArray(items)?items:[]).map(x=>String(x?.name||'').trim()).filter(n=>n&&!['비고','원본시트'].includes(n)&&!n.includes('판정')).map(n=>n.replace(/\s/g,'').toUpperCase()==='COA'?'COA 확인':n))];
  return (labels.join(' / ')||'미등록').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 };
})();
