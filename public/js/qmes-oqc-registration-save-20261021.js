/* Persist new OQC certificates, retaining failed/pending results and all three measurements. */
(function () {
  'use strict';
  if (window.__qmesOqcRegistrationSave20261021) return;
  window.__qmesOqcRegistrationSave20261021 = true;
  const scope = '.std-inspection.oqc-pqc-layout[data-inspection-type="outgoing"]';
  const states = new WeakMap();
  const fieldsByLabel = {
    '검사일자': 'date', '검사자': 'inspector', '고객사': 'customer',
    '제품명': 'product', '완제품 LOT': 'lot', '비고': 'remarks',
    'CoA 상태': 'coaStatus', '검사상태': 'inspectionStatus'
  };
  const tell = message => { if (typeof window.toast === 'function') window.toast(message); };

  function prepare(root) {
    if (!states.has(root)) {
      states.set(root, { requestId: crypto.randomUUID(), busy: false, saved: false });
      root.querySelectorAll('.std-info .am-inline-cell').forEach(cell => {
        const name = fieldsByLabel[cell.querySelector('label')?.textContent.trim()];
        const input = cell.querySelector('input,select,textarea');
        if (!name || !input) return;
        input.dataset.oqcRegistrationField = name;
        if (!input.id) input.id = 'oqcRegistration-' + name;
        cell.querySelector('label').htmlFor = input.id;
        if (name === 'date' && !input.value) input.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Seoul' });
        if (name === 'inspector' && !input.value) input.value = String(window.__QMES_CURRENT_USER__?.name || '');
        if (name === 'coaStatus') {
          input.value = '대기';
          input.disabled = true;
          input.title = 'CoA 발행 후 상태가 반영됩니다.';
        }
      });
    }
    const status = root.querySelector('[data-oqc-registration-field="inspectionStatus"]');
    if (status) {
      const result = root.querySelector('#stdOverallJudge')?.value || '대기';
      status.value = result === '대기' ? '검사중' : '검사완료';
      status.disabled = true;
      status.title = '측정값에 따른 자동 상태';
    }
    return states.get(root);
  }

  function showError(root, message) {
    let error = root.querySelector('.oqc-registration-save-error');
    if (!error) {
      error = document.createElement('div');
      error.className = 'oqc-registration-save-error';
      error.setAttribute('role', 'alert');
      error.style.cssText = 'margin:12px 0;padding:12px 16px;border:1px solid #efb8c4;border-radius:6px;background:#fff1f3;color:#a02040;font-size:13px';
      root.prepend(error);
    }
    error.textContent = message;
    error.hidden = false;
    tell(message);
  }

  async function save(root) {
    const state = prepare(root);
    if (state.busy || state.saved) return;
    if (!window.qmesOqcRules) {
      showError(root, '판정 기준을 불러오지 못했습니다. 화면을 다시 열어 주세요.');
      return;
    }
    const fields = Object.fromEntries([...root.querySelectorAll('[data-oqc-registration-field]')]
      .map(input => [input.dataset.oqcRegistrationField, input.value.trim()]));
    if (!fields.date || !fields.lot || !fields.inspector) {
      showError(root, '검사일자, 완제품 LOT, 검사자를 입력해 주세요.');
      return;
    }
    const measurements = {};
    root.querySelectorAll('.std-result tbody tr').forEach(row => {
      const name = window.qmesOqcRules.canonical(row.querySelector('.item')?.textContent.trim());
      measurements[name] = [...row.querySelectorAll('.std-measure')].map(input => input.value.trim());
    });
    const buttons = [...document.querySelectorAll('#mainWorkspace #modalSave,#mainWorkspace [data-am-save]')];
    const controls = [...root.querySelectorAll('input,select,textarea'), ...buttons].map(input => [input, input.disabled]);
    state.busy = true;
    controls.forEach(([input]) => { input.disabled = true; });
    const previousError = root.querySelector('.oqc-registration-save-error');
    if (previousError) previousError.hidden = true;
    try {
      const signal = typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function'
        ? AbortSignal.timeout(20000) : undefined;
      const response = await fetch('/api/qmes-sync/oqc/register', {
        method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' },
        signal,
        body: JSON.stringify({ requestId: state.requestId, fields, measurements })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result.success !== true) throw Error(result.message || '출하검사 저장에 실패했습니다.');
      state.saved = true;
    } catch (error) {
      const message = error.name === 'TimeoutError' || error.name === 'AbortError'
        ? '연결이 지연되어 저장 결과를 확인하지 못했습니다. 다시 저장해 주세요.'
        : String(error.message || error);
      showError(root, '출하검사 저장 실패: ' + message);
    } finally {
      state.busy = false;
      controls.forEach(([input, wasDisabled]) => { input.disabled = wasDisabled; });
    }
    if (!state.saved) return;
    // A successful server write stays successful even if refreshing the list later fails.
    if (root.isConnected) {
      if (typeof workspacePreviousPage !== 'undefined') workspacePreviousPage = 'outgoing';
      if (typeof window.closeModal === 'function') window.closeModal();
      const section = document.getElementById('outgoing');
      if (section) {
        document.querySelectorAll('.module-page').forEach(page => page.classList.remove('active'));
        section.classList.add('active');
        try {
          if (typeof window.loadHistoricalInspectionRows === 'function') await window.loadHistoricalInspectionRows(section, 'outgoing');
        } catch (error) {
          tell('출하검사는 저장되었습니다. 목록을 다시 조회해 주세요.');
          return;
        }
      }
    }
    tell('출하검사 저장 완료');
  }

  const original = window.initStandardInspectionForm;
  if (typeof original === 'function') window.initStandardInspectionForm = function (type) {
    const result = original.apply(this, arguments);
    if (type === 'outgoing') document.querySelectorAll(scope).forEach(prepare);
    return result;
  };
  // Stop the legacy demo-save and its top-button forwarding before either closes the form.
  document.addEventListener('click', event => {
    const button = event.target.closest('#modalSave,[data-am-save]');
    const workspace = button?.closest('#mainWorkspace');
    const root = workspace?.querySelector(scope);
    if (!root) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    void save(root);
  }, true);
  for (const name of ['input', 'change']) document.addEventListener(name, event => {
    const root = event.target.closest(scope);
    if (root) prepare(root);
  });
  let pending = false;
  new MutationObserver(() => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => { pending = false; document.querySelectorAll(scope).forEach(prepare); });
  }).observe(document.body, { childList: true, subtree: true });
  document.querySelectorAll(scope).forEach(prepare);
})();


/* Link new OQC registration to authoritative production records without copying inspection results. */
(function(){
'use strict';
const scope='.std-inspection.oqc-pqc-layout[data-inspection-type="outgoing"]';
const bound=new WeakSet();
const clean=value=>{const s=String(value??'').trim();return s==='-'?'':s;};
const day=value=>{const s=clean(value);const m=s.match(/\d{4}[-./]\d{1,2}[-./]\d{1,2}/);if(!m)return '';return m[0].split(/[-./]/).map((x,i)=>i?x.padStart(2,'0'):x).join('-');};
const norm=value=>clean(value).toUpperCase().replace(/\s+/g,'');
function orderInfo(order){
 const f=order.fields||{};
 const period=clean(f['작업기간']||f['지시기간']||'');
 const dates=period.match(/\d{4}[-./]\d{1,2}[-./]\d{1,2}/g)||[];
 const start=day(order.workDate||f['작업일자']||dates[0]);
 return {no:clean(f['작업지시번호']||order.workOrderNo||order.id),
 lot:clean(f['생산 LOT NO']||f['생산 LOT']||f['LOT NO']||order.lot||order.productionLot),
 product:clean(f['제품명']||order.product),
 customer:clean(f['고객사']||f['고객사명']||order.customer),
 start,end:day(dates[1])||start};
}
function productionCandidates(orders,checks,date){
 const info=orders.filter(o=>o&&!o.deleted).map(orderInfo);
 const candidates=info.filter(o=>date&&o.start&&date>=o.start&&date<=(o.end||o.start)).map(o=>({...o,source:'작업지시'}));
 for(const row of checks){
  if(row.deleted||day(row.date||row.inspectionDate)!==date)continue;
  const lot=clean(row.lot||row.productionLot),product=clean(row.product);
  const no=clean(row.workOrderNo||row.orderNo);
  let matches=info.filter(o=>lot&&norm(o.lot)===norm(lot)&&(!product||!o.product||norm(o.product)===norm(product)));
  if(no){const exact=matches.filter(o=>norm(o.no)===norm(no));if(exact.length)matches=exact;}
  const unique=new Map(matches.map(o=>[[o.lot,o.product,o.customer].map(norm).join('|'),o]));
  const order=unique.size===1?[...unique.values()][0]:{};
  candidates.push({lot:lot||order.lot||'',product:product||order.product||'',customer:clean(row.customer)||order.customer||'',no:no||order.no||'',source:'공정검사'});
 }
 const byKey=new Map();
 for(const c of candidates){
  if(!c.lot)continue;
  const key=[c.lot,c.product,c.customer].map(norm).join('|');
  if(byKey.has(key)){const old=byKey.get(key);if(!old.source.includes(c.source))old.source+=' · '+c.source;}
  else byKey.set(key,{...c});
 }
 // A PQC row with no customer is redundant only when exactly one complete match exists.
 const list=[...byKey.values()];
 return list.filter(c=>c.customer||list.filter(other=>other!==c&&other.customer&&norm(other.lot)===norm(c.lot)&&norm(other.product)===norm(c.product)).length!==1);
}
function unpack(records){
 const rows=[];
 for(const record of records){let p=record.payload||{};if(typeof p==='string'){try{p=JSON.parse(p)}catch(e){continue;}}
 if(!p.deleted&&Array.isArray(p.rows))rows.push(...p.rows.filter(r=>r&&!r.deleted));}
 return rows;
}
async function get(path){
 await window.qmesAuthDataReady?.wait();
 let response=await fetch(path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)});
 if(response.status===401&&window.qmesReauthenticate){await window.qmesReauthenticate();response=await fetch(path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000)});}
 const result=await response.json().catch(()=>({}));
 if(!response.ok||result.success===false||!Array.isArray(result.data))throw Error(result.message||'연동 자료 조회 실패');
 return result.data;
}
function setup(root){
 if(bound.has(root))return;
 const field=name=>root.querySelector('[data-oqc-registration-field="'+name+'"]');
 const date=field('date'),customerInput=field('customer'),lot=field('lot'),product=field('product');
 if(!date||!customerInput||!lot||!product)return;
 bound.add(root);
 const customer=document.createElement('select');
 for(const attr of customerInput.attributes)if(!['type','placeholder','value'].includes(attr.name))customer.setAttribute(attr.name,attr.value);
 customer.setAttribute('aria-label','고객사 선택');
 const existing=clean(customerInput.value);
 customer.add(new Option('고객사 선택',''));
 if(existing)customer.add(new Option(existing,existing));
 customer.value=existing;customerInput.replaceWith(customer);
 const cell=document.createElement('div');cell.className='am-inline-cell full oqc-production-link';
 const label=document.createElement('label');label.textContent='검사 대상';
 const area=document.createElement('div');area.className='v';
 const select=document.createElement('select');select.setAttribute('aria-label','검사 대상 선택');select.dataset.oqcProductionTarget='1';
 const message=document.createElement('small');message.setAttribute('role','status');
 const retry=document.createElement('button');retry.type='button';retry.className='btn';retry.textContent='다시 조회';retry.hidden=true;
 area.append(select,message,retry);cell.append(label,area);date.closest('.am-inline-cell').after(cell);
 let orders=[],checks=[],history=[],choices=[],loaded=false,loading=false,autoValues=null,lastDate=date.value;
 function setValue(input,value){input.value=value;input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));}
 function ensureCustomer(value){if(value&&![...customer.options].some(o=>o.value===value))customer.add(new Option(value,value));}
 function customers(){
  const selected=customer.value;
  const names=[...new Set([...orders.map(o=>orderInfo(o).customer),...checks.map(r=>clean(r.customer)),...history.map(r=>clean(r.customer)),selected].filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));
  customer.replaceChildren(new Option('고객사 선택',''));
  for(const name of names)customer.add(new Option(name,name));
  customer.value=selected;
 }
 function clearAuto(){
  if(!autoValues)return;
  for(const [name,input] of [['lot',lot],['product',product],['customer',customer]])if(input.value===autoValues[name])setValue(input,'');
  autoValues=null;
 }
 function apply(choice){
  if(!choice)return;
  ensureCustomer(choice.customer);
  setValue(lot,choice.lot);setValue(product,choice.product);setValue(customer,choice.customer);
  autoValues={lot:choice.lot,product:choice.product,customer:choice.customer};
  message.textContent='LOT · 제품명 · 고객사를 연결했습니다.'+(!choice.customer?' 고객사를 선택해 주세요.':'');
 }
 function render(allowAuto){
  if(!root.isConnected)return;
  choices=productionCandidates(orders,checks,day(date.value));
  select.replaceChildren(new Option(choices.length?'검사 대상 선택':'해당 일자 연동 내역 없음',''));
  choices.forEach((c,i)=>select.add(new Option([c.lot,c.product||'제품 미등록',c.customer||'고객사 미등록',c.source+(c.no?' '+c.no:'')].join(' / '),String(i))));
  select.disabled=!choices.length;
  const current=choices.findIndex(c=>norm(c.lot)===norm(lot.value)&&norm(c.product)===norm(product.value)&&norm(c.customer)===norm(customer.value));
  if(current>=0)select.value=String(current);
  if(allowAuto&&choices.length===1&&!lot.value&&!product.value&&!customer.value){select.value='0';apply(choices[0]);}
  else message.textContent=!date.value?'검사일자를 선택해 주세요.':choices.length>1?'같은 날짜에 여러 건이 있습니다. 검사 대상을 선택해 주세요.':choices.length===1?'검사 대상을 선택하면 생산정보를 불러옵니다.':'해당 일자의 작업지시·공정검사가 없습니다. 직접 입력할 수 있습니다.';
 }
 async function load(){
  if(loading)return;loading=true;retry.hidden=true;select.disabled=true;
  select.replaceChildren(new Option('생산정보 조회 중',''));message.textContent='';
  try{
   const result=await Promise.allSettled([get('/api/qmes/work-orders'),get('/api/qmes-sync/pqc'),get('/api/qmes-sync/oqc')]);
   if(result[0].status!=='fulfilled'||result[1].status!=='fulfilled')throw Error('작업지시·공정검사 정보를 불러오지 못했습니다.');
   orders=result[0].value;checks=unpack(result[1].value);history=result[2].status==='fulfilled'?unpack(result[2].value):[];
   loaded=true;customers();render(true);
  }catch(e){loaded=false;select.replaceChildren(new Option('생산정보 조회 실패',''));message.textContent=e.message;retry.hidden=false;}
  finally{loading=false;}
 }
 select.addEventListener('change',()=>{if(select.value!=='')apply(choices[Number(select.value)]);});
 date.addEventListener('change',()=>{
  if(date.value===lastDate)return;lastDate=date.value;clearAuto();
  if(loaded)render(true);else if(!loading)void load();
 });
 retry.addEventListener('click',()=>void load());
 void load();
}
let pending=false;
function scan(){document.querySelectorAll(scope).forEach(setup);}
new MutationObserver(()=>{if(!pending){pending=true;queueMicrotask(()=>{pending=false;scan();});}}).observe(document.body,{childList:true,subtree:true});
const style=document.createElement('style');style.textContent='.oqc-production-link .v{display:flex;flex-direction:column;gap:5px;padding:5px 8px!important}.oqc-production-link select{width:100%}.oqc-production-link small{color:#637b93;font-size:11px;line-height:1.5}.oqc-production-link .btn{align-self:flex-start}.oqc-pqc-layout select option{background:#fff;color:#35435b}';document.head.append(style);
scan();
})();
