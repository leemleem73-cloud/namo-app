/* NAMO QMES mobile-only writable operational forms — 2026-09-03 */
(function installQmesMobileOperationWrite(){
  'use strict';
  if(window.__QMES_MOBILE_OPERATION_WRITE_20260903__)return;
  window.__QMES_MOBILE_OPERATION_WRITE_20260903__=true;
  if(!location.pathname.toLowerCase().endsWith('/mobile-work.html'))return;

  const params=new URLSearchParams(location.search);
  const tab=String(params.get('tab')||'').trim();
  const direct=params.get('new')==='1';
  if(!['prod','woIssue','prodProcess','eq','partners','pop'].includes(tab))return;

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/,/g,''));return Number.isFinite(n)?n:0;};
  const esc=v=>clean(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const today=()=>new Date().toISOString().slice(0,10);
  const nowIso=()=>new Date().toISOString();
  const pad=n=>String(n).padStart(2,'0');
  const timeNow=()=>{const d=new Date();return `${pad(d.getHours())}:${pad(d.getMinutes())}`;};
  const state={work:[],equipment:[],partners:[],user:'',autoOpened:false};

  async function api(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    const payload=await response.json().catch(()=>null);
    if(response.status===401){location.replace('/index.html?mobileLogin=1');throw new Error('AUTH');}
    if(!response.ok||payload?.success===false)throw new Error(payload?.message||`HTTP ${response.status}`);
    return payload?.data!==undefined?payload.data:payload;
  }
  function parse(record){let p=record?.payload;if(p&&typeof p==='object')return p;if(typeof p==='string'){try{return JSON.parse(p)}catch(_){}}return{};}
  function active(records){return(Array.isArray(records)?records:[]).filter(r=>!parse(r).deleted);}
  function nodes(){return{editor:document.getElementById('editor'),title:document.getElementById('editorTitle'),sub:document.getElementById('editorSub'),body:document.getElementById('editorBody'),error:document.getElementById('formError'),loading:document.getElementById('loading'),loadingText:document.getElementById('loadingText')};}
  function showLoading(show,text){const n=nodes();if(n.loadingText&&text)n.loadingText.textContent=text;if(n.loading)n.loading.classList.toggle('show',!!show);}
  function showError(text){const n=nodes();if(!n.error)return;n.error.textContent=text;n.error.classList.add('show');}
  function clearError(){const n=nodes();if(n.error){n.error.textContent='';n.error.classList.remove('show');}}
  function closeEditor(){const n=nodes();n.editor?.classList.remove('open');n.editor?.setAttribute('aria-hidden','true');clearError();}
  function openEditor(title,subtitle,html){const n=nodes();if(!n.editor||!n.body)return false;clearError();if(n.title)n.title.textContent=title;if(n.sub)n.sub.textContent=subtitle||'모바일 · iPad 입력';n.body.innerHTML=html;n.editor.classList.add('open');n.editor.setAttribute('aria-hidden','false');return true;}
  function currentUser(){const fromHead=clean(document.getElementById('userName')?.textContent).replace(/님$/,'');return fromHead&&fromHead!=='확인 중'&&fromHead!=='로그인 필요'?fromHead:state.user||'MOBILE';}
  function navigate(next,newMode=true){location.assign(`/mobile-work.html?tab=${encodeURIComponent(next)}${newMode?'&new=1':''}&v=20260903-write1`);}

  function workRecord(lot){return active(state.work).find(r=>clean(r.record_key).toUpperCase()===clean(lot).toUpperCase());}
  function orderRows(){return active(state.work).filter(r=>!clean(r.record_key).startsWith('process:')&&!clean(r.record_key).startsWith('worker:')).map(r=>{const p=parse(r),b=p.batch||{},d=p.doc||{};const lot=clean(p.lotNo||b.no||r.record_key).toUpperCase();return{record:r,payload:p,lot,item:clean(b.item||b.itemName||d.item||d.product),date:clean(b.due||d.date).slice(0,10),plan:num(b.plan??d.plan),done:num(b.done),status:clean(b.status||d.status||'발행'),tank:clean(b.tank||d.tank),type:clean(d.productionType||d.workType||b.productionType||b.workType||'D-양산')};}).filter(x=>x.lot);}
  function materialText(payload){const rows=Array.isArray(payload?.doc?.inputs)?payload.doc.inputs:[];return rows.map(r=>[r.name||r.material||'',r.materialLot||r.lot||'',r.std??r.plan??r.qty??'',r.unit||'kg'].join(' | ')).join('\n');}
  function parseMaterials(text){return String(text||'').split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map((line,index)=>{const parts=line.split('|').map(v=>v.trim());const name=parts[0]||`원료 ${index+1}`,lot=(parts[1]||'').toUpperCase(),std=num(parts[2]),unit=parts[3]||'kg';return{seq:index+1,name,material:name,lot,materialLot:lot,std:std||null,plan:std||null,act:null,actual:null,unit,inputStatus:'신규',note:'',supplier:''};});}
  function nextWorkNo(){const prefix='C',part=today().replace(/-/g,'').slice(2),used=new Set(orderRows().map(x=>x.lot));let seq=1,key='';do{key=`${prefix}${part}-${String(seq++).padStart(3,'0')}`}while(used.has(key));return key;}

  async function openWorkForm(lot=''){
    showLoading(true,'작업지시 최신 데이터를 확인하는 중입니다.');
    try{state.work=await api('/api/qmes-sync/workorder');}catch(_){state.work=[];}finally{showLoading(false);}
    const item=lot?orderRows().find(x=>x.lot===clean(lot).toUpperCase()):null;
    const p=item?.payload||{},b=p.batch||{},d=p.doc||{};
    const workNo=item?.lot||nextWorkNo(),product=item?.item||'',date=item?.date||today(),plan=item?.plan||'',done=item?.done||0,tank=item?.tank||'',type=item?.type||'D-양산',worker=clean(d.workers||b.worker||''),notes=clean(d.note||d.remark||'');
    if(!openEditor(item?'작업지시 수정':'작업지시 신규작성','PC 공용 작업지시 DB',`<div class="form-note">PC 작업지시와 같은 <b>doc + batch + LOT</b> 공용 구조로 저장합니다. 저장 직전에 서버 최신본을 다시 확인해 동시수정 충돌을 차단합니다.</div><form class="form-grid" id="qmowWorkForm">
      <div class="form-field"><label>작업지시 / 생산 LOT *</label><input name="lot" value="${esc(workNo)}" ${item?'readonly':''}></div>
      <div class="form-field"><label>생산구분 *</label><select name="productionType">${['D-양산','C-Pilot','B-Lab'].map(v=>`<option ${type===v?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-field full"><label>제품명 *</label><input name="product" value="${esc(product)}"></div>
      <div class="form-field"><label>생산일 / 납기 *</label><input name="date" type="date" value="${esc(date)}"></div>
      <div class="form-field"><label>탱크 / 설비 *</label><input name="tank" value="${esc(tank)}"></div>
      <div class="form-field"><label>생산계획량 (kg) *</label><input name="plan" type="number" min="0.001" step="0.001" inputmode="decimal" value="${esc(plan)}"></div>
      <div class="form-field"><label>생산실적 (kg)</label><input name="done" type="number" min="0" step="0.001" inputmode="decimal" value="${esc(done)}"></div>
      <div class="form-field"><label>작업자</label><input name="worker" value="${esc(worker)}"></div>
      <div class="form-field"><label>상태</label><select name="status">${['발행','대기','진행중','완료'].map(v=>`<option ${(item?.status||'발행')===v?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-field full"><label>원료 투입 계획</label><textarea name="materials" style="min-height:135px" placeholder="한 줄에: 원료명 | 원료 LOT | 계획kg | 단위\n예: NMP | NMP-260903-01 | 100 | kg">${esc(materialText(p))}</textarea></div>
      <div class="form-field full"><label>비고</label><textarea name="notes">${esc(notes)}</textarea></div>
      <div class="form-actions"><button type="button" id="qmowCancel">취소</button><button class="save" type="submit">작업지시 저장</button></div>
    </form>`))return;
    document.getElementById('qmowCancel')?.addEventListener('click',closeEditor);
    document.getElementById('qmowWorkForm')?.addEventListener('submit',e=>saveWork(e,item));
  }
  async function saveWork(event,item){
    event.preventDefault();clearError();const f=event.currentTarget,fd=new FormData(f),lot=clean(fd.get('lot')).toUpperCase(),product=clean(fd.get('product')),date=clean(fd.get('date')),tank=clean(fd.get('tank')),plan=num(fd.get('plan')),done=num(fd.get('done')),productionType=clean(fd.get('productionType')),worker=clean(fd.get('worker')),status=clean(fd.get('status')),materials=parseMaterials(fd.get('materials')),notes=clean(fd.get('notes'));
    if(!lot||lot.length<3||!product||!date||!tank||plan<=0){showError('작업지시 LOT, 제품명, 생산일, 탱크/설비, 생산계획량을 확인하세요.');return;}
    if(done>plan*1.5){showError('생산실적이 계획량의 150%를 초과합니다. 수량을 확인하세요.');return;}
    showLoading(true,'작업지시를 공용 DB에 저장하는 중입니다.');
    try{
      const fresh=await api('/api/qmes-sync/workorder'),current=active(fresh).find(r=>clean(r.record_key).toUpperCase()===lot);
      if(item&&current&&clean(current.updated_at)!==clean(item.record.updated_at))throw new Error('다른 PC에서 같은 작업지시를 수정했습니다. 새로고침 후 다시 저장하세요.');
      if(!item&&current)throw new Error('같은 작업지시/LOT 번호가 이미 존재합니다.');
      const base=current?parse(current):(item?.payload||{}),baseDoc=base.doc||{},baseBatch=base.batch||{},baseLot=base.lotRecord||{};
      const doc={...baseDoc,item:product,product,workType:productionType,productionType,procName:baseDoc.procName||'생산',tank,plan,date,workers:worker,status,inputs:materials.length?materials:(Array.isArray(baseDoc.inputs)?baseDoc.inputs:[]),conds:Array.isArray(baseDoc.conds)?baseDoc.conds:[],packaging:Array.isArray(baseDoc.packaging)?baseDoc.packaging:[],note:notes,remark:notes,updatedAt:nowIso(),updatedBy:currentUser()};
      const batch={...baseBatch,no:lot,item:product,itemName:product,tank,plan,done,unit:baseBatch.unit||'kg',due:date,status,worker,productionType,workType:productionType,updatedAt:nowIso()};
      const lotRecord={...baseLot,lot:lot,lotNo:lot,item:product,itemName:product,initialQty:num(baseLot.initialQty)||plan,currentQty:done||num(baseLot.currentQty)||0,qty:done||num(baseLot.qty)||0,stage:baseLot.stage||'생산',status:status==='완료'?'생산완료':(baseLot.status||'작업지시 발행'),materials:materials.length?materials:(Array.isArray(baseLot.materials)?baseLot.materials:[]),updatedAt:nowIso()};
      const payload={...base,lotNo:lot,doc,batch,lotRecord,intermediateLot:base.intermediateLot||null,containers:base.containers||{},remainders:base.remainders||{},savedAt:nowIso(),savedBy:currentUser(),source:base.source||'MOBILE QMES'};
      await api('/api/qmes-sync/workorder',{method:'POST',body:JSON.stringify({key:lot,payload})});
      closeEditor();state.work=await api('/api/qmes-sync/workorder');document.getElementById('qmpRefresh')?.click();document.getElementById('refreshBtn')?.click();
    }catch(error){if(error.message!=='AUTH')showError(`저장 실패: ${error.message}`);}finally{showLoading(false);}
  }

  const defaultSteps=(equipment='생산설비')=>[
    {no:1,name:'작업준비 / 원료확인',equipment:'원료 준비',status:'대기',startAt:'',endAt:'',resultQty:'',defectQty:'0',workers:[]},
    {no:2,name:'원료 계량 / 투입',equipment,status:'대기',startAt:'',endAt:'',resultQty:'',defectQty:'0',workers:[]},
    {no:3,name:'바인더 제조',equipment:'TK 501',status:'대기',startAt:'',endAt:'',resultQty:'',defectQty:'0',workers:[]},
    {no:4,name:'전도 슬러리 제조',equipment:'TK 501A ↔ B',status:'대기',startAt:'',endAt:'',resultQty:'',defectQty:'0',workers:[]},
    {no:5,name:'공정검사 (PQC)',equipment:'검사실',status:'대기',startAt:'',endAt:'',resultQty:'',defectQty:'0',workers:[]},
    {no:6,name:'충진 / 포장',equipment:'충진기',status:'대기',startAt:'',endAt:'',resultQty:'',defectQty:'0',workers:[]},
    {no:7,name:'생산완료 / 제품보관',equipment:'제품보관',status:'대기',startAt:'',endAt:'',resultQty:'',defectQty:'0',workers:[]}
  ];
  async function openProcessForm(lot=''){
    showLoading(true,'생산공정 최신 기록을 확인하는 중입니다.');
    try{state.work=await api('/api/qmes-sync/workorder');}finally{showLoading(false);}
    const orders=orderRows(),selected=clean(lot).toUpperCase()||orders[0]?.lot||'',processRecord=active(state.work).find(r=>clean(r.record_key)===`process:${selected}`),saved=processRecord?parse(processRecord):{},order=orders.find(x=>x.lot===selected),steps=Array.isArray(saved.steps)&&saved.steps.length?saved.steps:defaultSteps(order?.tank||'생산설비');
    if(!openEditor(processRecord?'생산공정 수정':'생산공정 입력','PC process:LOT 공용기록',`<div class="form-note">PC 생산공정과 같은 7단계 공용 구조입니다. LOT를 선택하고 각 단계 상태·실적을 저장할 수 있습니다.</div><form class="form-grid" id="qmowProcessForm">
      <div class="form-field full"><label>작업지시 LOT *</label><select name="lot" id="qmowProcessLot">${orders.map(o=>`<option value="${esc(o.lot)}" ${o.lot===selected?'selected':''}>${esc(o.lot)} · ${esc(o.item)} · ${esc(o.status)}</option>`).join('')}</select></div>
      <div class="form-field"><label>공정 전체상태</label><select name="status">${['대기','진행중','완료','중단'].map(v=>`<option ${clean(saved.status||'대기')===v?'selected':''}>${v}</option>`).join('')}</select></div>
      <div class="form-field"><label>작업자</label><input name="workers" value="${esc((Array.isArray(saved.workers)?saved.workers.map(w=>clean(w.name||w)).filter(Boolean):[]).join(', '))}" placeholder="홍길동, 김나모"></div>
      <div class="form-section"><strong>7단계 공정</strong>${steps.map((s,i)=>`<div style="display:grid;grid-template-columns:28px minmax(0,1fr) 92px 90px;gap:6px;align-items:center;margin-bottom:7px"><b style="font-size:9px;text-align:center">${i+1}</b><div><div style="font-size:9px;font-weight:900;color:#334b61">${esc(s.name)}</div><div style="font-size:7.5px;color:#82909d;margin-top:2px">${esc(s.equipment||'-')}</div></div><select name="stepStatus${i}" style="min-height:40px;border:1px solid #d6e0e7;border-radius:8px;background:#fff;font-size:12px"><option ${s.status==='대기'?'selected':''}>대기</option><option ${s.status==='진행중'?'selected':''}>진행중</option><option ${s.status==='완료'?'selected':''}>완료</option><option ${s.status==='중단'?'selected':''}>중단</option></select><input name="stepQty${i}" type="number" min="0" step="0.001" value="${esc(s.resultQty||'')}" placeholder="실적kg" style="min-height:40px;border:1px solid #d6e0e7;border-radius:8px;padding:0 7px;font-size:12px"></div>`).join('')}</div>
      <div class="form-actions"><button type="button" id="qmowProcessCancel">취소</button><button class="save" type="submit">공정 저장</button></div>
    </form>`))return;
    document.getElementById('qmowProcessCancel')?.addEventListener('click',closeEditor);
    document.getElementById('qmowProcessLot')?.addEventListener('change',e=>openProcessForm(e.target.value));
    document.getElementById('qmowProcessForm')?.addEventListener('submit',e=>saveProcess(e,processRecord,steps));
  }
  async function saveProcess(event,openedRecord,baseSteps){event.preventDefault();clearError();const f=event.currentTarget,fd=new FormData(f),lot=clean(fd.get('lot')).toUpperCase(),status=clean(fd.get('status')),workers=clean(fd.get('workers')).split(',').map(v=>v.trim()).filter(Boolean).map((name,i)=>({id:`mobile-${i+1}-${name}`,uid:'',name,dept:'생산',role:'작업자'}));if(!lot){showError('작업지시 LOT를 선택하세요.');return;}showLoading(true,'생산공정을 저장하는 중입니다.');try{const fresh=await api('/api/qmes-sync/workorder'),current=active(fresh).find(r=>clean(r.record_key)===`process:${lot}`);if(openedRecord&&current&&clean(current.updated_at)!==clean(openedRecord.updated_at))throw new Error('다른 PC에서 같은 생산공정을 수정했습니다. 새로고침 후 다시 저장하세요.');const previous=current?parse(current):{},steps=baseSteps.map((s,i)=>{const nextStatus=clean(fd.get(`stepStatus${i}`)),resultQty=clean(fd.get(`stepQty${i}`));let startAt=s.startAt||'',endAt=s.endAt||'';if(nextStatus==='진행중'&&!startAt)startAt=nowIso();if(nextStatus==='완료'){if(!startAt)startAt=nowIso();if(!endAt)endAt=nowIso();}return{...s,status:nextStatus,resultQty,startAt,endAt,workers};});const order=orderRows().find(o=>o.lot===lot),payload={...previous,lot,item:order?.item||previous.item||'',productionDate:order?.date||previous.productionDate||today(),planQty:order?.plan||previous.planQty||0,status,workerIds:workers.map(w=>w.id),workers,steps,createdAt:previous.createdAt||nowIso(),createdBy:previous.createdBy||currentUser(),updatedAt:nowIso(),updatedBy:currentUser()};await api('/api/qmes-sync/workorder',{method:'POST',body:JSON.stringify({key:`process:${lot}`,payload})});if(status==='완료'&&order){const wo=workRecord(lot),base=parse(wo),batch={...(base.batch||{}),status:'완료',done:num(base.batch?.plan||order.plan),updatedAt:nowIso()},lotRecord={...(base.lotRecord||{}),status:'생산완료',productionStatus:'완료',productionWorkers:workers.map(w=>w.name),processCompletedAt:nowIso(),updatedAt:nowIso()};await api('/api/qmes-sync/workorder',{method:'POST',body:JSON.stringify({key:lot,payload:{...base,batch,lotRecord,savedAt:nowIso(),savedBy:currentUser()}})});}closeEditor();document.getElementById('qmpRefresh')?.click();}catch(error){if(error.message!=='AUTH')showError(`저장 실패: ${error.message}`);}finally{showLoading(false);}}

  async function openEquipmentForm(){if(!openEditor('설비 점검 신규등록','PC 설비 공용 DB',`<div class="form-note">PC 일일 설비점검과 동일한 공용 equipment 기록으로 저장합니다.</div><form class="form-grid" id="qmowEqForm"><div class="form-field"><label>설비번호 *</label><input name="eqId" placeholder="예: TK-501"></div><div class="form-field"><label>관리항목 *</label><input name="item" placeholder="예: 교반속도"></div><div class="form-field"><label>항목키</label><input name="paramKey" placeholder="예: rpm"></div><div class="form-field"><label>측정값 *</label><input name="value"></div><div class="form-field"><label>관리기준 *</label><input name="spec" placeholder="예: 800~1200 rpm"></div><div class="form-field"><label>판정</label><select name="judge"><option>정상</option><option>이탈</option></select></div><div class="form-field"><label>점검일</label><input name="date" type="date" value="${today()}"></div><div class="form-field"><label>점검시간</label><input name="time" type="time" value="${timeNow()}"></div><div class="form-field full"><label>비고</label><textarea name="note"></textarea></div><div class="form-actions"><button type="button" id="qmowEqCancel">취소</button><button class="save" type="submit">점검 저장</button></div></form>`))return;document.getElementById('qmowEqCancel')?.addEventListener('click',closeEditor);document.getElementById('qmowEqForm')?.addEventListener('submit',saveEquipment);}
  async function saveEquipment(event){event.preventDefault();clearError();const fd=new FormData(event.currentTarget),eqId=clean(fd.get('eqId')).toUpperCase(),item=clean(fd.get('item')),paramKey=clean(fd.get('paramKey'))||item.replace(/\s+/g,'_').toLowerCase(),v=clean(fd.get('value')),spec=clean(fd.get('spec')),judge=clean(fd.get('judge')),date=clean(fd.get('date')),time=clean(fd.get('time')),note=clean(fd.get('note'));if(!eqId||!item||!v||!spec||!date||!time){showError('설비번호, 관리항목, 측정값, 관리기준, 일시를 확인하세요.');return;}const entry={id:`EQ-M-${Date.now()}`,eqId,paramKey,item,v,spec,judge,date,time,note,by:currentUser(),recordedAt:`${date}T${time}:00`,source:'MOBILE QMES'};showLoading(true,'설비 점검을 저장하는 중입니다.');try{await api('/api/qmes-sync/equipment',{method:'POST',body:JSON.stringify({key:entry.id,payload:{entry,savedAt:nowIso(),savedBy:currentUser()}})});closeEditor();document.getElementById('refreshBtn')?.click();}catch(error){if(error.message!=='AUTH')showError(`저장 실패: ${error.message}`);}finally{showLoading(false);}}

  async function loadPartners(){try{state.partners=await api('/api/qmes-extra-sync/partner');}catch(_){state.partners=[];}}
  function renderPartners(){const content=document.querySelector('.content');if(!content)return;const rows=active(state.partners).map(r=>({record:r,p:parse(r)}));content.innerHTML=`<div style="display:flex;flex-direction:column;gap:9px"><button id="qmowPartnerNew" type="button" style="height:44px;border:0;border-radius:10px;background:#0d5eb8;color:#fff;font-size:10px;font-weight:900">거래처 신규등록</button><div class="message show warn">PC 거래처 화면은 아직 브라우저 로컬 데이터 구조입니다. 모바일 신규등록은 공용 partner DB에 안전하게 저장하며 PC 원본 화면은 변경하지 않습니다.</div>${rows.length?rows.map(x=>`<article class="record"><div class="record-head"><div class="record-no">${esc(x.p.kind==='supplier'?'SUP':'CUS')}</div><div class="record-title"><strong>${esc(x.p.name||x.p.company||'-')}</strong><span>${esc(x.p.code||x.record.record_key)} · ${esc(x.p.material||'')}</span></div><span class="badge green">${esc(x.p.status||'거래중')}</span></div><div class="fields"><div class="field"><label>구분</label><span>${x.p.kind==='supplier'?'공급업체':'고객사'}</span></div><div class="field"><label>LOT</label><span>${esc(x.p.lot||'-')}</span></div></div></article>`).join(''):'<div class="empty"><strong>모바일 공용 거래처 기록이 없습니다.</strong></div>'}</div>`;document.getElementById('qmowPartnerNew')?.addEventListener('click',openPartnerForm);}
  function openPartnerForm(){if(!openEditor('거래처 신규등록','모바일 공용 기준정보',`<form class="form-grid" id="qmowPartnerForm"><div class="form-field"><label>구분</label><select name="kind"><option value="customer">고객사</option><option value="supplier">공급업체</option></select></div><div class="form-field"><label>코드 *</label><input name="code" placeholder="CUS001 / SUP001"></div><div class="form-field full"><label>회사명 *</label><input name="name"></div><div class="form-field"><label>원료명 (공급업체)</label><input name="material"></div><div class="form-field"><label>최근 원료 LOT</label><input name="lot"></div><div class="form-field"><label>상태</label><select name="status"><option>거래중</option><option>거래중지</option></select></div><div class="form-actions"><button type="button" id="qmowPartnerCancel">취소</button><button class="save" type="submit">저장</button></div></form>`))return;document.getElementById('qmowPartnerCancel')?.addEventListener('click',closeEditor);document.getElementById('qmowPartnerForm')?.addEventListener('submit',savePartner);}
  async function savePartner(event){event.preventDefault();clearError();const fd=new FormData(event.currentTarget),kind=clean(fd.get('kind')),code=clean(fd.get('code')).toUpperCase(),name=clean(fd.get('name')),material=clean(fd.get('material')),lot=clean(fd.get('lot')).toUpperCase(),status=clean(fd.get('status'));if(!code||!name){showError('거래처 코드와 회사명을 입력하세요.');return;}const payload={source:'MOBILE QMES',kind,code,name,company:name,material,lot,status,updatedAt:nowIso(),updatedBy:currentUser()};showLoading(true,'거래처를 저장하는 중입니다.');try{await api('/api/qmes-extra-sync/partner',{method:'POST',body:JSON.stringify({key:`${kind}:${code}`,payload})});closeEditor();await loadPartners();renderPartners();}catch(error){if(error.message!=='AUTH')showError(`저장 실패: ${error.message}`);}finally{showLoading(false);}}

  function renderPop(){const content=document.querySelector('.content');if(!content)return;const pt=document.getElementById('pageTitle'),ht=document.getElementById('headTitle'),pd=document.getElementById('pageDesc');if(pt)pt.textContent='현장입력';if(ht)ht.textContent='현장입력';if(pd)pd.textContent='현장에서 필요한 입력 화면을 바로 선택하세요.';document.getElementById('toolbar')?.style.setProperty('display','none');content.innerHTML=`<div style="display:grid;grid-template-columns:1fr;gap:9px"><button class="record" type="button" data-pop="prodProcess" style="text-align:left"><div class="record-head"><div class="record-no">PP</div><div class="record-title"><strong>생산공정 입력</strong><span>7단계 공정 · 작업자 · 실적</span></div></div></button><button class="record" type="button" data-pop="iqc" style="text-align:left"><div class="record-head"><div class="record-no">IQ</div><div class="record-title"><strong>수입검사 입력</strong><span>원료 LOT · IQC</span></div></div></button><button class="record" type="button" data-pop="pqc" style="text-align:left"><div class="record-head"><div class="record-no">PQ</div><div class="record-title"><strong>공정검사 입력</strong><span>PQC 측정값</span></div></div></button><button class="record" type="button" data-pop="oqc" style="text-align:left"><div class="record-head"><div class="record-no">OQ</div><div class="record-title"><strong>출하검사 입력</strong><span>OQC · 출하정보</span></div></div></button></div>`;content.querySelectorAll('[data-pop]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.pop,true)));}

  function injectProductionActions(){const root=document.getElementById('qmpRoot');if(!root)return false;let tools=root.querySelector('.qmp-tools');if(tools&&!tools.querySelector('[data-qmow-new]')){const b=document.createElement('button');b.type='button';b.className='qmp-btn primary';b.dataset.qmowNew='1';b.textContent=tab==='prodProcess'?'공정입력':'신규작성';b.addEventListener('click',()=>tab==='prodProcess'?openProcessForm(''):openWorkForm(''));tools.appendChild(b);}root.querySelectorAll('.qmp-card').forEach(card=>{const actions=card.querySelector('.qmp-actions'),lot=clean(card.dataset.lot);if(!actions||actions.querySelector('[data-qmow-edit]'))return;const b=document.createElement('button');b.type='button';b.className='qmp-btn';b.dataset.qmowEdit=lot;b.textContent=tab==='prodProcess'?'공정수정':'수정';b.addEventListener('click',()=>tab==='prodProcess'?openProcessForm(lot):openWorkForm(lot));actions.prepend(b);});return true;}
  function injectGenericNew(label,handler){const create=document.getElementById('createBtn');if(create){const cloned=create.cloneNode(true);create.replaceWith(cloned);cloned.classList.add('show');cloned.textContent=label;cloned.addEventListener('click',handler);return true;}return false;}

  async function init(){
    try{const u=await api('/api/auth/me').catch(()=>null);state.user=clean(u?.user?.name||u?.name||u?.user?.loginId||u?.loginId);}catch(_){}
    if(tab==='pop'){setTimeout(renderPop,120);return;}
    if(tab==='partners'){await loadPartners();setTimeout(()=>{renderPartners();if(direct&&!state.autoOpened){state.autoOpened=true;openPartnerForm();}},160);return;}
    if(tab==='eq'){setTimeout(()=>{injectGenericNew('신규등록',openEquipmentForm);if(direct&&!state.autoOpened){state.autoOpened=true;openEquipmentForm();}},260);return;}
    if(tab==='prod'){setTimeout(()=>{injectGenericNew('신규작성',()=>openWorkForm(''));if(direct&&!state.autoOpened){state.autoOpened=true;openWorkForm('');}},260);return;}
    const observer=new MutationObserver(()=>{if(injectProductionActions()&&direct&&!state.autoOpened){state.autoOpened=true;setTimeout(()=>tab==='prodProcess'?openProcessForm(''):openWorkForm(''),80);}});observer.observe(document.documentElement,{childList:true,subtree:true});setTimeout(()=>{injectProductionActions();if(direct&&!state.autoOpened){state.autoOpened=true;tab==='prodProcess'?openProcessForm(''):openWorkForm('');}},450);
  }
  init();
})();
