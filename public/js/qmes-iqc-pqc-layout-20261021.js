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
    const body=table.querySelector('tbody');
    if(body&&![...body.querySelectorAll('.item')].some(x=>x.textContent.trim()==='포장상태')){
      const tr=document.createElement('tr');tr.dataset.kind='qual';tr.innerHTML='<td></td><td class="item">포장상태</td><td class="spec">용기·포장 파손 및 누출 없을 것</td><td class="method">육안</td><td><select class="std-measure"><option value="">선택</option><option>적합</option><option>부적합</option></select></td><td><select class="std-row-judge"><option>대기</option><option>합격</option><option>불합격</option></select></td>';body.prepend(tr);
    }
    table.querySelectorAll('tbody tr').forEach((row,index)=>{row.firstElementChild.textContent=String(index+1);
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
    section.innerHTML = '<div class="am-section-head"><b>검사항목</b><span>포장상태·외관·라벨·입고 중량·COA 각 1회 확인</span></div>';
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
const specs=[['포장상태','용기·포장 파손 및 누출 없을 것','육안'],['외관','이물질 혼입 및 외관 이상 없을 것','육안'],['라벨','품명·LOT·표기사항 일치할 것','육안'],['중량','표시중량 및 입고기준 만족','저울'],['COA 확인','공급사 COA 및 LOT 일치 확인','문서확인']];
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
 box.innerHTML='<div class="am-section-head"><b>검사항목</b><span>포장상태·외관·라벨·입고 중량·COA 각 1회 확인</span></div><div class="std-result-wrap"><table class="std-result"><colgroup>'+[5,12,26,17,25,15].map(n=>'<col style="width:'+n+'%">').join('')+'</colgroup><thead><tr>'+['NO','검사항목','검사기준','검사방법 / 기기','확인 결과','판정'].map(v=>'<th>'+v+'</th>').join('')+'</tr></thead><tbody>'+checks.map((c,i)=>'<tr data-iqc-check="'+i+'"><td>'+(i+1)+'</td><td>'+esc(c.name)+'</td><td>'+esc(specs[i][1])+'</td><td>'+esc(specs[i][2])+'</td><td>'+(c.name==='중량'?'<input data-check-value type="text" inputmode="decimal" placeholder="확인 중량 (kg)" value="'+esc(c.value)+'">':'<select data-check-value>'+options(c.name==='COA 확인'?['확인','확인중','미확인']:['적합','부적합'],c.value)+'</select>')+'</td><td><select data-check-judge>'+options(['대기','합격','불합격'],c.judge)+'</select></td></tr>').join('')+'</tbody></table></div>';
 frame.after(box);
 box._checks=checks;box._dirty=false;
 const summary=pane.querySelector('#iqcEditResult');if(summary){summary.disabled=true;summary.title='검사항목 판정으로 자동 계산됩니다.';}
 function changed(event){const tr=event.target.closest('[data-iqc-check]');if(!tr)return;const i=Number(tr.dataset.iqcCheck),check=checks[i];check.value=tr.querySelector('[data-check-value]').value;check.judge=tr.querySelector('[data-check-judge]').value;
 if(event.target.matches('[data-check-value]')&&check.name!=='중량'){check.judge=['부적합','이상있음','미확인'].includes(check.value)?'불합격':['적합','이상없음','정상','확인','확인완료'].includes(check.value)?'합격':'대기';tr.querySelector('[data-check-judge]').value=check.judge;}
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

/* Summarize actual saved inspection items and refresh rows rendered before this script. */
(function(){
 function labels(row){
  let items;try{items=typeof row.items_json==='string'?JSON.parse(row.items_json):row.items_json;}catch{items=[];}
  return [...new Set((Array.isArray(items)?items:[]).map(x=>String(x?.name||'').trim()).filter(n=>n&&!['비고','원본시트'].includes(n)&&!n.includes('판정')).map(n=>['COA','COA확인'].includes(n.replace(/\s/g,'').toUpperCase())?'COA 확인':n))].join(' / ')||'미등록';
 }
 window.iqcItemSummary=row=>labels(row).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 if(typeof document==='undefined')return;
 const root=document.getElementById('incoming');if(!root)return;
 let scheduled=false,reloaded=false;
 function paint(){
  scheduled=false;
  const records=Array.isArray(root._iqcRows)?root._iqcRows:[],byId=new Map(records.map(row=>[String(row.id),row]));
  root.querySelectorAll('table').forEach(table=>{
   const headers=[...table.querySelectorAll('thead th')],index=headers.findIndex(th=>th.textContent.trim()==='검사항목');if(index<0)return;
   table.querySelectorAll('tbody tr[data-iqc-id]').forEach(tr=>{const row=byId.get(String(tr.dataset.iqcId)),cell=tr.children[index];if(!row||!cell)return;const value=labels(row);if(cell.textContent!==value)cell.textContent=value;});
  });
  // The first native read can finish before this parser-blocking script loads.
  // Re-read once using the same native query so the audited completion also reaches the visible rows.
  if(!reloaded&&records.length&&typeof window.loadIncomingFromDb==='function'){
   reloaded=true;Promise.resolve(window.qmesAuthDataReady?.wait()).then(()=>window.loadIncomingFromDb(root,root._iqcPage||1)).then(schedule).catch(error=>console.warn('[IQC summary refresh]',error));
  }
 }
 function schedule(){if(!scheduled){scheduled=true;queueMicrotask(paint);}}
 new MutationObserver(schedule).observe(root,{childList:true,subtree:true});schedule();
})();

/* IQC COA uploads belong to the inspection record and are separate from issued reports. */
(function(){
'use strict';
const base='/api/qmes/iqc/attachments',states=new WeakMap();let cached=null,pending=null;
async function refresh(){if(cached)return cached;if(pending)return pending;pending=(async()=>{const r=await fetch(base,{credentials:'same-origin',cache:'no-store'}),j=await r.json();if(!r.ok||!j.success)throw Error(j.message||'COA 조회 실패');return cached=j.data;})().finally(()=>pending=null);return pending;}
function link(file){const a=document.createElement('a');a.href=base+'/'+encodeURIComponent(file.id);a.target='_blank';a.rel='noopener';a.textContent=file.name;a.title=file.name;a.addEventListener('click',e=>e.stopPropagation());return a;}
function mount(root,id){
 if(states.has(root))return states.get(root);
 const box=document.createElement('div');box.className='iqc-coa-field';
 const label=document.createElement('label');label.textContent='COA 첨부파일';
 const input=document.createElement('input');input.type='file';input.accept='.pdf,.jpg,.jpeg,.png';input.setAttribute('aria-label','수입검사 COA 첨부파일');
 const info=document.createElement('span');info.textContent='PDF · JPG · PNG / 최대 5MB';box.append(label,input,info);
 (root.querySelector('.std-info')||root).after(box);const state={input,info};states.set(root,state);
 input.addEventListener('change',()=>{info.textContent=input.files[0]?input.files[0].name+' · 저장 시 첨부됩니다.':'PDF · JPG · PNG / 최대 5MB';});
 if(id)refresh().then(rows=>{if(!box.isConnected||input.files.length)return;const f=rows.find(f=>String(f.iqc_id)===String(id));if(f)info.replaceChildren(link(f));else info.textContent='첨부파일 없음';}).catch(()=>{info.textContent='기존 COA 조회 실패';});
 return state;
}
async function attachment(root){
 const file=states.get(root)?.input.files[0];if(!file)return undefined;
 if(!file.size||file.size>5*1024*1024||!/\.(pdf|jpe?g|png)$/i.test(file.name))throw Error('COA는 5MB 이하 PDF, JPG, PNG 파일을 선택해 주세요.');
 const base64=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=()=>reject(Error('COA 파일 읽기 실패'));reader.readAsDataURL(file);});
 return {name:file.name,base64};
}
const originalFetch=window.fetch;
window.fetch=async function(input,options){
 let url;try{url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,location.href);}catch{return originalFetch.apply(this,arguments);}
 const method=String(options?.method||input?.method||'GET').toUpperCase();
 if(url.origin===location.origin&&/^\/api\/iqc(?:\/[^/]+)?$/.test(url.pathname)&&['POST','PUT'].includes(method)&&typeof options?.body==='string'){
  const root=document.querySelector('.am-split[data-am-screen="incoming"] .std-inspection[data-inspection-type="incoming"],.am-split[data-am-screen="incoming"] .iqc-edit-settings-frame');
  const file=root?await attachment(root):undefined;
  if(file){const body=JSON.parse(options.body);options={...options,body:JSON.stringify({...body,attachment:file})};}
  const response=await originalFetch.call(this,input,options);if(response.ok){cached=null;}return response;
 }
 return originalFetch.apply(this,arguments);
};
function scan(){
 document.querySelectorAll('.am-split[data-am-screen="incoming"] .std-inspection[data-inspection-type="incoming"]').forEach(root=>mount(root));
 document.querySelectorAll('.am-split[data-am-screen="incoming"] .iqc-edit-settings-frame').forEach(root=>mount(root,root.parentElement.querySelector('.iqc-edit-checks')?.dataset.recordId));
 const root=document.getElementById('incoming');if(!root)return;
 if(typeof pageInfo!=='undefined'&&pageInfo.incoming?.[2]&&!pageInfo.incoming[2].includes('COA')){const cols=pageInfo.incoming[2],i=cols.indexOf('성적서');if(i>=0)cols.splice(i+1,0,'COA');}
 root.querySelectorAll('table').forEach(table=>{
  const report=[...table.querySelectorAll('thead th')].find(th=>th.textContent.trim()==='성적서');if(!report)return;
  if(!table.querySelector('th[data-iqc-coa-header]')){const th=document.createElement('th');th.dataset.iqcCoaHeader='1';th.textContent='COA';report.after(th);const cols=table.querySelector('colgroup');if(cols){const col=document.createElement('col');col.style.width='10%';cols.insertBefore(col,cols.children[report.cellIndex+1]||null);}}
  table.querySelectorAll('tbody tr[data-iqc-id]').forEach(tr=>{
   const reportCell=tr.querySelector('.report-issue')?.closest('td');if(!reportCell||tr.querySelector('[data-iqc-coa-cell]'))return;
   const cell=document.createElement('td');cell.dataset.iqcCoaCell='1';cell.textContent='조회 중';reportCell.after(cell);
   refresh().then(rows=>{if(!cell.isConnected)return;const f=rows.find(f=>String(f.iqc_id)===String(tr.dataset.iqcId));cell.replaceChildren();if(f)cell.append(link(f));else cell.textContent='—';}).catch(()=>{if(cell.isConnected)cell.textContent='조회 실패';});
  });
 });
}
let queued=false;function schedule(){if(!queued){queued=true;queueMicrotask(()=>{queued=false;scan();});}}
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});scan();
const style=document.createElement('style');style.textContent='.iqc-coa-field{display:grid;grid-template-columns:128px minmax(160px,1fr) minmax(120px,1fr);align-items:center;gap:10px;margin:10px 0;padding:10px;border:1px solid #d7e0e9;background:#f7faff;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif}.iqc-coa-field label{text-align:center;font-weight:600}.iqc-coa-field input{width:100%;min-width:0;font:inherit}.iqc-coa-field span{overflow-wrap:anywhere}#incoming [data-iqc-coa-cell]{white-space:normal!important;text-align:center!important;padding:8px!important}#incoming [data-iqc-coa-cell] a{display:block;color:#245b9e;white-space:normal;overflow-wrap:anywhere;line-height:1.4}@media(max-width:760px){.iqc-coa-field{grid-template-columns:100px minmax(0,1fr)}.iqc-coa-field span{grid-column:2}}';document.head.append(style);
window.qmesIqcFiles={mount,attachment};
})();
