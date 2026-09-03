/* NAMO QMES mobile-only work order parity with current PC IssueWoTab — 2026-09-03 */
(function installMobileWorkOrderPcParity(){
  'use strict';
  if(window.__QMES_MOBILE_WORKORDER_PC_PARITY_20260903__) return;
  window.__QMES_MOBILE_WORKORDER_PC_PARITY_20260903__=true;
  const params=new URLSearchParams(location.search);
  if(String(params.get('tab')||'')!=='woIssue') return;

  const VERSION='20260903-wopc1';
  const clean=v=>String(v==null?'':v).trim();
  const compact=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num=v=>{const n=Number(String(v==null?'':v).replace(/,/g,''));return Number.isFinite(n)?n:0;};
  const nullableNum=v=>{const s=String(v==null?'':v).trim();if(!s)return null;const n=Number(s.replace(/,/g,''));return Number.isFinite(n)?n:null;};
  const fmt=(v,d=3)=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:d});
  const nowIso=()=>new Date().toISOString();
  const todayTime=()=>new Date().toLocaleTimeString('ko-KR',{hour12:false});
  const parseRecord=record=>{let p=record?.payload;if(p&&typeof p==='object')return p;if(typeof p==='string'){try{return JSON.parse(p)}catch(_){}}return{};};
  const isDeleted=record=>Boolean(parseRecord(record).deleted);
  const state={records:[],pqcRecords:[],oqcRecords:[],user:null,bom:{},workTypes:['바인더 솔루션(중간재)','완제품'],intermediate:['중간배치(SBR 바인더)','중간배치(PVDF 바인더)','중간배치(SBS 바인더)'],materials:['NMP','BYK180 (분산제)','AOH30 (Boehmite)','SBS','PVdF','SBR'],filter:{lot:'',item:'',date:''},page:1,pageSize:10,draft:null,previewLot:'',mounted:false};

  const FALLBACK_BOM={
    ' NBA20-HM01':{prefix:'SL',baseQty:230,procName:'절연슬러리 제조',workType:'완제품',tanks:['HSM #1 (High Shear Mixer)','HSM #2 (High Shear Mixer)'],items:[{seq:1,name:'NMP',base:17.09,unit:'kg',note:''},{seq:2,name:'BYK180 (분산제)',base:.789,unit:'kg',note:''},{seq:3,name:'AOH30 (Boehmite)',base:27.6,unit:'kg',note:'투입 후 20min 순환'},{seq:4,name:'SBS',base:0,unit:'kg',note:''},{seq:5,name:'PVdF',base:0,unit:'kg',note:''},{seq:6,name:'SBR',base:106.24,unit:'kg',note:''},{seq:7,name:'중간배치 선택',base:0,unit:'kg',note:''}]},
    '중간배치(SBR 바인더)':{prefix:'CBG',baseQty:230,procName:'SBR 바인더 솔루션 제조',workType:'바인더 솔루션(중간재)',tanks:['HSM #1 (High Shear Mixer)','HSM #2 (High Shear Mixer)'],items:[{seq:1,name:'NMP',base:0,unit:'kg',note:''},{seq:2,name:'SBR',base:0,unit:'kg',note:''}]},
    '중간배치(PVDF 바인더)':{prefix:'CBG',baseQty:230,procName:'PVDF 바인더 솔루션 제조',workType:'바인더 솔루션(중간재)',tanks:['HSM #1 (High Shear Mixer)','HSM #2 (High Shear Mixer)'],items:[{seq:1,name:'NMP',base:0,unit:'kg',note:''},{seq:2,name:'PVdF',base:0,unit:'kg',note:''}]},
    '중간배치(SBS 바인더)':{prefix:'CBG',baseQty:230,procName:'SBS 바인더 솔루션 제조',workType:'바인더 솔루션(중간재)',tanks:['HSM #1 (High Shear Mixer)','HSM #2 (High Shear Mixer)'],items:[{seq:1,name:'NMP',base:0,unit:'kg',note:''},{seq:2,name:'SBS',base:0,unit:'kg',note:''}]}
  };

  async function api(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
    const payload=await response.json().catch(()=>null);
    if(response.status===401){location.replace(`/index.html?mobileLogin=1&v=${VERSION}`);throw new Error('AUTH');}
    if(!response.ok||payload?.success===false)throw new Error(payload?.message||`HTTP ${response.status}`);
    return payload?.data!==undefined?payload.data:payload;
  }

  function evaluateConst(source,name,nextName,scope=''){
    const start=source.indexOf(`const ${name} =`);if(start<0)throw new Error(`${name} not found`);
    const eq=source.indexOf('=',start)+1;let end=nextName?source.indexOf(`\n\nconst ${nextName}`,eq):-1;
    if(end<0){end=source.indexOf('\n\nfunction ',eq);if(end<0)end=source.length;}
    const expr=source.slice(eq,end).trim().replace(/;\s*$/,'');
    return Function(`${scope}\nreturn (${expr});`)();
  }

  async function loadPcCatalog(){
    state.bom=FALLBACK_BOM;
    try{
      const response=await fetch(`/js/production.jsx?v=${Date.now()}`,{credentials:'same-origin',cache:'no-store'});
      if(!response.ok)throw new Error('PC production source unavailable');
      const source=await response.text();
      const bom=evaluateConst(source,'BOM','INTERMEDIATE_MATERIAL_OPTIONS');
      const intermediate=evaluateConst(source,'INTERMEDIATE_MATERIAL_OPTIONS','WORK_TYPE_OPTIONS');
      const workTypes=evaluateConst(source,'WORK_TYPE_OPTIONS','MATERIAL_OPTIONS');
      if(bom&&Object.keys(bom).length)state.bom=bom;
      if(Array.isArray(intermediate)&&intermediate.length)state.intermediate=intermediate;
      if(Array.isArray(workTypes)&&workTypes.length)state.workTypes=workTypes;
      state.materials=['NMP','BYK180 (분산제)','AOH30 (Boehmite)','SBS','PVdF','SBR'];
    }catch(error){console.warn('[QMES mobile workorder] PC BOM fallback:',error.message);}
  }

  function products(){return Object.keys(state.bom).filter(name=>!state.bom[name]?.legacy);}
  function firstProduct(){const list=products();return list.find(name=>state.bom[name]?.workType==='완제품')||list[0]||' NBA20-HM01';}
  function materialType(name){return state.intermediate.includes(String(name||''))||String(name||'').includes('중간배치')?'중간재':'일반원료';}
  function availableMaterialOptions(workType){const base=[...state.materials];return workType==='바인더 솔루션(중간재)'?base:[...base,'중간배치 선택',...state.intermediate];}
  function blankMaterials(product){const safe=state.bom[product]||state.bom[firstProduct()]||{items:[]};return (safe.items||[]).map((it,i)=>({...it,seq:i+1,materialLot:'',containerNo:'',inputStatus:'신규',availableQty:'',base:it.base??'',plan:'',actual:'',remaining:null,note:it.note||'',unit:it.unit||'kg'}));}
  const blankPack=()=>({containerNo:'',packWeight:'',packDate:'',storageLocation:'',status:'포장계획'});
  const defaultConds=()=>[
    {proc:'HSM 용해',item:'시간',std:'≤ 80 min',method:'PLC 패널',act:'',ok:null,by:''},
    {proc:'HSM 용해',item:'온도',std:'< 70 ℃',method:'PLC 패널',act:'',ok:null,by:''},
    {proc:'HSM 용해',item:'RPM',std:'3,540±500 rpm',method:'PLC 패널',act:'',ok:null,by:''},
    {proc:'HSM 용해',item:'최대압력',std:'≤ 6 bar',method:'PLC 패널',act:'',ok:null,by:''},
    {proc:'HSM 용해',item:'유량',std:'< 20 L/min',method:'PLC 패널',act:'',ok:null,by:''},
    {proc:'순환',item:'시간',std:'60 min',method:'PLC 패널',act:'',ok:null,by:''},
    {proc:'순환',item:'온도',std:'< 70 ℃',method:'PLC 패널',act:'',ok:null,by:''}
  ];

  function orderRecords(includeDeleted=false){
    return (state.records||[]).filter(record=>{
      const key=compact(record?.record_key);if(key.startsWith('process:')||key.startsWith('worker:'))return false;
      return includeDeleted||!isDeleted(record);
    });
  }
  function orderFromRecord(record){
    const p=parseRecord(record),d=p.doc||{},b=p.batch||{},l=p.lotRecord||{};
    const lot=compact(p.lotNo||b.no||record?.record_key).toUpperCase();if(!lot)return null;
    const inputs=Array.isArray(d.inputs)?d.inputs:[];
    const actualInputs=inputs.reduce((sum,row)=>sum+(Number(row.act)||0),0);
    const actual=Number(d.productionActual??(actualInputs>0?actualInputs:b.done)??0);
    const shift=String(b.shift||'').split(' · ');
    return{record,payload:p,lot,item:String(b.item??d.item??l.itemName??l.item??''),tank:compact(b.tank||d.tank),plan:num(b.plan??d.plan),actual,date:compact(b.due||d.date).slice(0,10),timeRange:compact(d.timeRange||shift[1]),shiftType:compact(d.shiftType||shift[0]||'일반'),worker:compact(d.workers||b.worker),doc:d,batch:b,lotRecord:l};
  }
  function orders(){return orderRecords(false).map(orderFromRecord).filter(Boolean).sort((a,b)=>String(b.date||'').localeCompare(String(a.date||''))||String(b.record?.updated_at||'').localeCompare(String(a.record?.updated_at||'')));}
  function inspectionRows(records){const rows=[];(records||[]).forEach(record=>{const p=parseRecord(record);if(p.deleted)return;(Array.isArray(p.rows)?p.rows:[]).forEach(row=>rows.push(row));});return rows;}
  function autoStatus(order){
    const doc=order?.doc||{};if(doc.manualStatus)return doc.manualStatus;
    const pqc=inspectionRows(state.pqcRecords).filter(row=>compact(row.lot)===order.lot);
    const oqc=inspectionRows(state.oqcRecords).filter(row=>compact(row.lot)===order.lot);
    const pass=v=>['OK','합격','적합','PASS'].includes(String(v||'').toUpperCase());
    if(oqc.some(row=>pass(row.judge)))return'완료';
    if(pqc.length||oqc.length)return'검사중';
    if((doc.inputs||[]).some(row=>Number(row.act)>0))return'생산중';
    return'발행';
  }
  function statusClass(status){return status==='완료'?'done':status==='검사중'?'inspect':status==='생산중'?'running':'issued';}
  function filteredOrders(){const f=state.filter,qLot=f.lot.toLowerCase(),qItem=f.item.toLowerCase();return orders().filter(o=>(!qLot||o.lot.toLowerCase().includes(qLot))&&(!qItem||o.item.toLowerCase().includes(qItem))&&(!f.date||o.date===f.date));}

  function ensureStyle(){
    if(document.getElementById('qwp-style'))return;
    const style=document.createElement('style');style.id='qwp-style';style.textContent=`
      .qwp{display:flex;flex-direction:column;gap:12px;color:#142e44}.qwp *{box-sizing:border-box}.qwp-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.qwp-head h2{margin:0;font-size:20px;font-weight:950;letter-spacing:-.04em}.qwp-btn{min-height:38px;padding:0 11px;border:1px solid #d5e0e8;border-radius:9px;background:#fff;color:#315069;font-size:9px;font-weight:900;cursor:pointer;white-space:nowrap}.qwp-btn.primary{border-color:#0d5eb8;background:#0d5eb8;color:#fff}.qwp-btn.danger{border-color:#eccdd2;background:#fff8f9;color:#a83343}.qwp-btn.print{border-color:#b8d5e8;background:#f2f8fc;color:#0e639b}.qwp-guide{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 11px;border:1px solid #dce4eb;border-radius:10px;background:#fff;font-size:8px;font-weight:850;color:#617286}.qwp-guide span{display:flex;align-items:center;gap:4px}.qwp-dot{width:7px;height:7px;border-radius:50%;background:#93a0ac}.qwp-dot.issued{background:#d19021}.qwp-dot.running{background:#2380c3}.qwp-dot.inspect{background:#8059c6}.qwp-dot.done{background:#35a45a}.qwp-filter{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:7px;padding:10px;border:1px solid #dce4eb;border-radius:11px;background:#fff}.qwp-filter label{display:block;color:#81909e;font-size:7.5px;font-weight:850}.qwp-filter input{width:100%;height:40px;margin-top:4px;padding:0 9px;border:1px solid #d9e2e8;border-radius:8px;background:#fff;color:#1b344a;font-size:13px;outline:0}.qwp-filter .qwp-btn{align-self:end;height:40px}.qwp-tablebox{overflow:auto;border:1px solid #dce4eb;border-radius:11px;background:#fff}.qwp-table{width:100%;min-width:1080px;border-collapse:collapse;font-size:10px}.qwp-table th{padding:9px 8px;background:#f3f6f8;border-bottom:1px solid #dce4eb;color:#647587;font-size:8px;font-weight:950;text-align:center;white-space:nowrap}.qwp-table td{padding:9px 8px;border-bottom:1px solid #edf1f4;color:#2f465b;text-align:center;white-space:nowrap}.qwp-table td.left{text-align:left}.qwp-table td.num{text-align:right;font-variant-numeric:tabular-nums}.qwp-table tbody tr:last-child td{border-bottom:0}.qwp-lot{border:0;background:none;color:#0d66a4;font-weight:950;font-family:ui-monospace,SFMono-Regular,Consolas,monospace;cursor:pointer}.qwp-status{height:31px;border:1px solid #d8e1e8;border-radius:7px;padding:0 7px;font-size:9px;font-weight:900}.qwp-status.issued{background:#fff6e6;color:#9b6200}.qwp-status.running{background:#eaf5fc;color:#126da6}.qwp-status.inspect{background:#f1ecff;color:#6e4aae}.qwp-status.done{background:#eaf8ed;color:#257b3d}.qwp-actions{display:flex;justify-content:center;gap:4px}.qwp-actions .qwp-btn{min-height:31px;padding:0 7px;font-size:7.8px}.qwp-empty{padding:36px;text-align:center;color:#7b8996;font-size:10px}.qwp-pages{display:flex;align-items:center;justify-content:center;gap:8px}.qwp-pages span{font-size:9px;color:#66788a;font-weight:850}
      .qwp-form{border:1px solid #d8e2e9;border-radius:12px;background:#fff;overflow:hidden}.qwp-formhead{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 13px;border-bottom:1px solid #e7edf1;background:#f8fafb}.qwp-formhead strong{font-size:14px;font-weight:950}.qwp-formhead small{display:block;margin-top:3px;color:#718295;font-size:8px;font-weight:800}.qwp-auto{font-family:ui-monospace,SFMono-Regular,Consolas,monospace;color:#0e67a4;font-weight:950}.qwp-formbody{padding:12px}.qwp-basic{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}.qwp-field label{display:block;margin-bottom:5px;color:#65778b;font-size:8px;font-weight:900}.qwp-field input,.qwp-field select{width:100%;height:43px;padding:0 10px;border:1px solid #d6e0e7;border-radius:9px;background:#fff;color:#18334a;font-size:13px;outline:0}.qwp-field input[readonly]{background:#f3f6f8;color:#31739e;font-weight:900}.qwp-field input:focus,.qwp-field select:focus{border-color:#69a7d0;box-shadow:0 0 0 3px rgba(31,119,180,.08)}.qwp-section{margin-top:13px;border:1px solid #dfe6eb;border-radius:10px;overflow:hidden}.qwp-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 11px;background:#f5f8fa;border-bottom:1px solid #e3e9ee;color:#2d485e;font-size:9px;font-weight:950;line-height:1.5}.qwp-section-title small{font-size:7.5px;color:#7c8b99}.qwp-matbox,.qwp-packbox{overflow:auto}.qwp-mattable{width:100%;min-width:1180px;border-collapse:collapse}.qwp-mattable th,.qwp-packtable th{padding:8px 6px;background:#fbfcfd;border-bottom:1px solid #e4eaee;color:#6f7e8c;font-size:7.5px;font-weight:950;text-align:center;white-space:nowrap}.qwp-mattable td,.qwp-packtable td{padding:6px;border-bottom:1px solid #edf1f4;text-align:center;font-size:9px}.qwp-mattable input,.qwp-mattable select,.qwp-packtable input,.qwp-packtable select{width:100%;height:36px;padding:0 7px;border:1px solid #d9e2e8;border-radius:7px;background:#fff;color:#20394f;font-size:10px;outline:0}.qwp-mattable .mat-name{min-width:170px}.qwp-mattable .mat-lot{min-width:135px;font-family:ui-monospace,SFMono-Regular,Consolas,monospace}.qwp-type{display:block;margin-top:3px;color:#7d8b98;font-size:7px;font-weight:850}.qwp-calc{font-variant-numeric:tabular-nums;font-weight:850}.qwp-calc.good{color:#2b8848}.qwp-calc.warn{color:#b17409}.qwp-calc.bad{color:#b63849}.qwp-packtable{width:100%;min-width:870px;border-collapse:collapse}.qwp-formfoot{display:flex;align-items:center;justify-content:flex-end;gap:7px;margin-top:13px;padding-top:11px;border-top:1px solid #edf1f4}.qwp-error{display:none;margin:0 0 10px;padding:10px 11px;border:1px solid #edcfd4;border-radius:8px;background:#fff7f8;color:#a23544;font-size:9px;font-weight:850;line-height:1.55}.qwp-error.show{display:block}
      .qwp-modal{position:fixed;inset:0;z-index:130;display:none;align-items:flex-end;background:rgba(8,28,45,.45);backdrop-filter:blur(2px)}.qwp-modal.open{display:flex}.qwp-modal-card{width:min(100%,850px);max-height:92dvh;margin:0 auto;overflow:auto;border-radius:16px 16px 0 0;background:#f4f6f8;box-shadow:0 -20px 55px rgba(9,30,48,.2)}.qwp-modal-head{position:sticky;top:0;z-index:2;display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 12px;border-bottom:1px solid #dbe3e9;background:#fff}.qwp-modal-head strong{font-size:12px;font-weight:950}.qwp-paper{margin:12px;padding:17px;background:#fff;color:#1e2935;border:1px solid #d6dde3;border-radius:6px}.qwp-paper-top{display:grid;grid-template-columns:1fr 1.2fr 1fr;align-items:center;padding-bottom:12px;border-bottom:2px solid #263746}.qwp-paper-top img{width:120px;max-width:100%;height:40px;object-fit:contain}.qwp-paper-title{text-align:center}.qwp-paper-title b{display:block;font-size:18px}.qwp-paper-title small{font-size:8px;color:#6e7b86}.qwp-paper-meta{text-align:right;font-size:8px;line-height:1.7}.qwp-paper-sec{margin-top:12px}.qwp-paper-sec h4{margin:0;padding:6px 7px;background:#eef2f5;border:1px solid #bfc8d0;border-bottom:0;font-size:9px}.qwp-paper table{width:100%;border-collapse:collapse;font-size:8px}.qwp-paper th,.qwp-paper td{padding:6px 5px;border:1px solid #c7cfd6;text-align:center}.qwp-paper th{background:#f6f7f8}.qwp-sign{width:48%!important;margin-left:auto;margin-top:12px}.qwp-sign th,.qwp-sign td{height:28px}.qwp-paper-foot{margin-top:10px;text-align:center;color:#87929b;font-size:7px}
      .qwp-busy{position:fixed;inset:0;z-index:160;display:none;align-items:center;justify-content:center;background:rgba(255,255,255,.78);backdrop-filter:blur(2px)}.qwp-busy.show{display:flex}.qwp-busy div{padding:15px 18px;border:1px solid #dae3e9;border-radius:11px;background:#fff;color:#355269;font-size:10px;font-weight:900;box-shadow:0 15px 40px rgba(20,44,64,.12)}
      @media(max-width:620px){.qwp-filter{grid-template-columns:1fr 1fr}.qwp-filter>div:nth-child(3){grid-column:1/2}.qwp-filter .qwp-btn{grid-column:2/3}.qwp-basic{grid-template-columns:1fr}.qwp-paper{margin:7px;padding:10px}.qwp-paper-top{grid-template-columns:.8fr 1.2fr 1fr}.qwp-paper-top img{width:76px}.qwp-paper-title b{font-size:14px}}
      @media print{body *{visibility:hidden!important}.qwp-modal.open,.qwp-modal.open *{visibility:visible!important}.qwp-modal{position:absolute!important;inset:0!important;display:block!important;background:#fff!important}.qwp-modal-card{width:100%!important;max-height:none!important;overflow:visible!important;background:#fff!important}.qwp-modal-head{display:none!important}.qwp-paper{margin:0!important;border:0!important;border-radius:0!important}.bottom,.head,.pagebar{display:none!important}}
    `;document.head.appendChild(style);
  }

  function shell(){
    const content=document.querySelector('.content');if(!content)return false;
    const pageTitle=document.getElementById('pageTitle'),headTitle=document.getElementById('headTitle'),pageDesc=document.getElementById('pageDesc'),toolbar=document.getElementById('toolbar');
    if(pageTitle)pageTitle.textContent='작업지시 관리';if(headTitle)headTitle.textContent='작업지시 관리';if(pageDesc)pageDesc.textContent='PC 작업지시서와 동일 항목 · 동일 공용 DB 구조';if(toolbar)toolbar.style.display='none';
    const summary=document.querySelector('.summary');if(summary)summary.style.display='none';
    if(!document.getElementById('qwpRoot'))content.innerHTML='<div id="qwpRoot" class="qwp"></div>';
    if(!document.getElementById('qwpPreview'))document.body.insertAdjacentHTML('beforeend','<div class="qwp-modal" id="qwpPreview" aria-hidden="true"></div><div class="qwp-busy" id="qwpBusy"><div id="qwpBusyText">처리 중입니다.</div></div>');
    const genericEditor=document.getElementById('editor');genericEditor?.classList.remove('open');genericEditor?.setAttribute('aria-hidden','true');
    state.mounted=true;return true;
  }
  function busy(show,text='처리 중입니다.'){const box=document.getElementById('qwpBusy'),label=document.getElementById('qwpBusyText');if(label)label.textContent=text;if(box)box.classList.toggle('show',!!show);}

  function renderList(){
    if(!shell())return;const root=document.getElementById('qwpRoot');if(!root)return;
    const list=filteredOrders(),pages=Math.max(1,Math.ceil(list.length/state.pageSize));state.page=Math.min(state.page,pages);const rows=list.slice((state.page-1)*state.pageSize,state.page*state.pageSize);
    root.innerHTML=`<div class="qwp-head"><h2>작업지시 관리</h2><button type="button" class="qwp-btn primary" id="qwpNew">＋ 신규 발행</button></div>
      <div class="qwp-guide"><span><i class="qwp-dot issued"></i>발행</span><span><i class="qwp-dot running"></i>생산중</span><span><i class="qwp-dot inspect"></i>검사중</span><span><i class="qwp-dot done"></i>완료</span><em>PC와 동일하게 자동 표시되며 직접 변경 가능합니다.</em></div>
      <div class="qwp-filter"><div><label>LOT No.</label><input id="qwpFilterLot" value="${esc(state.filter.lot)}" placeholder="LOT 검색"></div><div><label>품목</label><input id="qwpFilterItem" value="${esc(state.filter.item)}" placeholder="품목 검색"></div><div><label>생산일자</label><input id="qwpFilterDate" type="date" value="${esc(state.filter.date)}"></div><button type="button" class="qwp-btn" id="qwpFilterReset">초기화</button></div>
      <div class="qwp-tablebox"><table class="qwp-table"><thead><tr><th>LOT No.</th><th>품목</th><th>설비</th><th>계획량</th><th>실투입량</th><th>생산일자</th><th>생산시간</th><th>근무유형</th><th>작업자</th><th>상태</th><th>관리</th></tr></thead><tbody>${rows.length?rows.map(o=>`<tr><td class="left"><button class="qwp-lot" data-preview="${esc(o.lot)}">${esc(o.lot)}</button></td><td class="left">${esc(o.item||'-')}</td><td>${esc(o.tank||'-')}</td><td class="num">${fmt(o.plan)} kg</td><td class="num">${o.actual>0?`${fmt(o.actual)} kg`:'—'}</td><td>${esc(o.date||'-')}</td><td>${esc(o.timeRange||'-')}</td><td>${esc(o.shiftType||'-')}</td><td>${esc(o.worker||'-')}</td><td><select class="qwp-status ${statusClass(autoStatus(o))}" data-status="${esc(o.lot)}"><option ${autoStatus(o)==='발행'?'selected':''}>발행</option><option ${autoStatus(o)==='생산중'?'selected':''}>생산중</option><option ${autoStatus(o)==='검사중'?'selected':''}>검사중</option><option ${autoStatus(o)==='완료'?'selected':''}>완료</option></select></td><td><div class="qwp-actions"><button class="qwp-btn" data-preview="${esc(o.lot)}">미리보기</button><button class="qwp-btn print" data-print="${esc(o.lot)}">출력</button><button class="qwp-btn" data-edit="${esc(o.lot)}">수정</button><button class="qwp-btn danger" data-delete="${esc(o.lot)}">삭제</button></div></td></tr>`).join(''):`<tr><td colspan="11" class="qwp-empty">검색 조건에 맞는 발행 내역이 없습니다.</td></tr>`}</tbody></table></div>
      ${list.length>state.pageSize?`<div class="qwp-pages"><button class="qwp-btn" id="qwpPrev" ${state.page===1?'disabled':''}>이전</button><span>${state.page} / ${pages}</span><button class="qwp-btn" id="qwpNext" ${state.page===pages?'disabled':''}>다음</button></div>`:''}`;
    document.getElementById('qwpNew')?.addEventListener('click',()=>openForm());
    ['Lot','Item','Date'].forEach(key=>document.getElementById(`qwpFilter${key}`)?.addEventListener('input',e=>{state.filter[key.toLowerCase()]=e.target.value;state.page=1;renderList();}));
    document.getElementById('qwpFilterReset')?.addEventListener('click',()=>{state.filter={lot:'',item:'',date:''};state.page=1;renderList();});
    document.getElementById('qwpPrev')?.addEventListener('click',()=>{state.page=Math.max(1,state.page-1);renderList();});document.getElementById('qwpNext')?.addEventListener('click',()=>{state.page+=1;renderList();});
    root.querySelectorAll('[data-preview]').forEach(b=>b.addEventListener('click',()=>openPreview(b.dataset.preview)));
    root.querySelectorAll('[data-print]').forEach(b=>b.addEventListener('click',()=>{openPreview(b.dataset.print);setTimeout(()=>window.print(),80);}));
    root.querySelectorAll('[data-edit]').forEach(b=>b.addEventListener('click',()=>openForm(b.dataset.edit)));
    root.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',()=>deleteOrder(b.dataset.delete)));
    root.querySelectorAll('[data-status]').forEach(s=>s.addEventListener('change',()=>changeStatus(s.dataset.status,s.value)));
  }

  function nextLot(date,site){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return'—';const[yy,mm,dd]=date.split('-');const yearChar=String.fromCharCode(65+(parseInt(yy,10)-2025));const monthChar=String.fromCharCode(64+parseInt(mm,10));const prefix=`${site}${yearChar}${monthChar}${dd}`;let max=0;
    orderRecords(true).forEach(record=>{const key=compact(record.record_key).toUpperCase();if(!key.startsWith(prefix))return;const tail=key.slice(prefix.length);const n=parseInt(tail,10);if(Number.isFinite(n))max=Math.max(max,n);});return`${prefix}${String(max+1).padStart(2,'0')}`;
  }
  function draftPlanTotal(){return Number((state.draft?.materials||[]).reduce((sum,row)=>sum+num(row.plan),0).toFixed(3));}
  function remaining(row){const actual=nullableNum(row.actual);if(actual==null)return null;const available=nullableNum(row.availableQty)??nullableNum(row.plan)??0;return Number(Math.max(0,available-actual).toFixed(3));}
  function errorPct(row){const p=nullableNum(row.plan),a=nullableNum(row.actual);return p&&a!=null?Number(((a-p)/p*100).toFixed(2)):null;}
  function ratioPct(row){const p=nullableNum(row.plan),a=nullableNum(row.actual);return p&&a!=null?Number((a/p*100).toFixed(2)):null;}
  function calcTone(error){if(error==null)return'';const a=Math.abs(error);return a<=.5?'good':a<=1?'warn':'bad';}

  function openForm(lot=''){
    const order=orders().find(o=>o.lot===compact(lot).toUpperCase());const fp=firstProduct();
    if(order){const d=order.doc,b=order.batch,product=Object.prototype.hasOwnProperty.call(state.bom,order.item)?order.item:(Object.keys(state.bom).find(k=>k.trim()===order.item.trim())||order.item||fp),bom=state.bom[product]||state.bom[fp];state.draft={editing:order.record,base:order.payload,form:{workType:d.workType||b.workType||bom?.workType||'완제품',product,tank:b.tank||d.tank||bom?.tanks?.[0]||'',prodDate:b.due||d.date||'',lotNo:order.lot,site:order.lot?.[0]||'C',hours:d.hours||'7h',timeRange:d.timeRange||(b.shift?.split(' · ')[1]||''),shiftType:d.shiftType||(b.shift?.split(' · ')[0]||'일반'),worker:b.worker||d.workers||''},materials:(d.inputs?.length?d.inputs:(bom?.items||[])).map((it,i)=>({seq:i+1,name:it.name,materialLot:it.materialLot||it.lot||'',containerNo:it.containerNo||'',inputStatus:it.inputStatus||'신규',availableQty:it.availableQty??'',base:it.base??'',plan:it.plan??it.std??'',actual:it.act??'',remaining:it.remaining??null,unit:it.unit||'kg',note:it.note||''})),packs:d.packaging?.length?d.packaging.map(x=>({...x})): [blankPack()]};}
    else{const bom=state.bom[fp];state.draft={editing:null,base:{},form:{workType:bom?.workType||'완제품',product:fp,tank:bom?.tanks?.[0]||'',prodDate:'',lotNo:'',site:'C',hours:'7h',timeRange:'08:30~16:30',shiftType:'일반',worker:''},materials:blankMaterials(fp),packs:[blankPack()]};}
    renderForm();window.scrollTo({top:0,behavior:'smooth'});
  }

  function renderForm(){
    if(!shell()||!state.draft)return;const root=document.getElementById('qwpRoot'),d=state.draft,f=d.form,bom=state.bom[f.product]||state.bom[firstProduct()]||{tanks:[],workType:f.workType,procName:'절연슬러리 제조'};const productOptions=products().filter(name=>state.bom[name]?.workType===f.workType);const auto=nextLot(f.prodDate,f.site),lotDisplay=d.editing?f.lotNo:(f.lotNo||auto),planned=draftPlanTotal(),binder=bom.workType==='바인더 솔루션(중간재)',matOptions=availableMaterialOptions(bom.workType);
    root.innerHTML=`<div class="qwp-form"><div class="qwp-formhead"><div><strong>${d.editing?'작업지시 수정':'신규 작업지시 발행'}</strong><small>LOT No. 자동 채번: <span class="qwp-auto" id="qwpAutoLot">${esc(auto)}</span></small></div><button type="button" class="qwp-btn" id="qwpCloseForm">× 닫기</button></div><div class="qwp-formbody"><div class="qwp-error" id="qwpError"></div><div class="qwp-basic">
      <div class="qwp-field"><label>작업구분</label><select id="qwpWorkType">${state.workTypes.map(v=>`<option value="${esc(v)}" ${f.workType===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="qwp-field"><label>공정 / 품목 (Grd.)</label><select id="qwpProduct">${productOptions.map(v=>`<option value="${esc(v)}" ${f.product===v?'selected':''}>${esc(state.bom[v]?.workType==='완제품'?v.trim():`[${state.bom[v]?.workType}] ${v.trim()}`)}</option>`).join('')}</select></div>
      <div class="qwp-field"><label>설비명</label><select id="qwpTank">${(bom.tanks||[]).map(v=>`<option ${f.tank===v?'selected':''}>${esc(v)}</option>`).join('')}</select></div>
      <div class="qwp-field"><label>생산일자</label><input id="qwpProdDate" type="date" value="${esc(f.prodDate)}"></div>
      <div class="qwp-field"><label>LOT No.</label><input id="qwpLot" value="${esc(lotDisplay==='—'?'':lotDisplay)}" placeholder="LOT No." ${d.editing?'readonly':''}></div>
      <div class="qwp-field"><label>생산구분</label><select id="qwpSite"><option value="C" ${f.site==='C'?'selected':''}>C — Pilot</option><option value="D" ${f.site==='D'?'selected':''}>D — 양산</option><option value="B" ${f.site==='B'?'selected':''}>B — Lab</option></select></div>
      <div class="qwp-field"><label>생산계획량 (kg)</label><input id="qwpPlanTotal" value="${planned>0?planned.toFixed(3):''}" placeholder="원료 계획량 합계" readonly></div>
      <div class="qwp-field"><label>작업시간</label><input id="qwpHours" value="${esc(f.hours)}" placeholder="예: 7h"></div>
      <div class="qwp-field"><label>생산시간</label><input id="qwpTimeRange" value="${esc(f.timeRange)}" placeholder="예: 08:30~16:30"></div>
      <div class="qwp-field"><label>근무유형</label><select id="qwpShift"><option ${f.shiftType==='일반'?'selected':''}>일반</option><option ${f.shiftType==='잔업'?'selected':''}>잔업</option><option ${f.shiftType==='특근'?'selected':''}>특근</option></select></div>
      <div class="qwp-field"><label>작업자</label><input id="qwpWorker" value="${esc(f.worker)}"></div>
    </div>
    <div class="qwp-section"><div class="qwp-section-title"><span>① 원재료 투입 계획 <small>계획량 합계 → 생산계획량 자동 계산 · 실투입 시 잔량/오차/투입비율 자동 계산</small></span><button type="button" class="qwp-btn" id="qwpAddMaterial">＋ 행 추가</button></div><div class="qwp-matbox"><table class="qwp-mattable"><thead><tr><th>순서</th><th>원재료명</th><th>LOT No.</th><th>투입상태</th><th>계획량</th><th>실투입량</th><th>사용 후 잔량</th><th>오차(%)</th><th>투입비율</th><th>비고</th><th></th></tr></thead><tbody>${d.materials.map((row,i)=>materialRowHtml(row,i,matOptions)).join('')}<tr><td></td><td><b>계</b></td><td></td><td></td><td class="qwp-calc" id="qwpMatPlanSum">${planned>0?planned.toFixed(3)+' kg':''}</td><td class="qwp-calc good" id="qwpMatActualSum">${d.materials.some(r=>nullableNum(r.actual)!=null)?d.materials.reduce((s,r)=>s+num(r.actual),0).toFixed(3)+' kg':''}</td><td class="qwp-calc warn" id="qwpMatRemainSum">${d.materials.some(r=>remaining(r)!=null)?d.materials.reduce((s,r)=>s+(remaining(r)||0),0).toFixed(3)+' kg':''}</td><td id="qwpMatErrSum"></td><td id="qwpMatRatioSum"></td><td></td><td></td></tr></tbody></table></div></div>
    ${binder?`<div class="qwp-section"><div class="qwp-section-title"><span>② 바인더 솔루션 포장정보 <small>중간재 LOT는 작업지시 LOT로 자동 연결</small></span><button type="button" class="qwp-btn" id="qwpAddPack">＋ 포장 추가</button></div><div class="qwp-packbox"><table class="qwp-packtable"><thead><tr><th>No</th><th>포장번호(선택)</th><th>포장중량</th><th>포장일자</th><th>보관위치</th><th>상태</th><th>현재 잔량</th><th></th></tr></thead><tbody>${d.packs.map((row,i)=>packRowHtml(row,i,f.prodDate)).join('')}<tr><td></td><td><b>포장 합계</b></td><td class="qwp-calc" id="qwpPackSum">${d.packs.reduce((s,r)=>s+num(r.packWeight),0).toFixed(3)} kg</td><td colspan="5"></td></tr></tbody></table></div></div>`:''}
    <div class="qwp-formfoot"><button type="button" class="qwp-btn" id="qwpCancel">취소</button><button type="button" class="qwp-btn primary" id="qwpSave">저장</button></div></div></div>`;
    bindForm(binder);
  }

  function materialRowHtml(row,i,options){const rem=remaining(row),err=errorPct(row),ratio=ratioPct(row);return`<tr data-mat-row="${i}"><td>${i+1}</td><td><select class="mat-name" data-mat="name" data-i="${i}">${row.name==='중간배치(바인더)'?'<option disabled selected>중간배치 원료명 선택 필요</option>':''}${options.map(v=>`<option value="${esc(v)}" ${row.name===v?'selected':''} ${v==='중간배치 선택'?'disabled':''}>${esc(v)}</option>`).join('')}</select><span class="qwp-type" id="qwpType${i}">${esc(materialType(row.name))}</span></td><td><input class="mat-lot" data-mat="materialLot" data-i="${i}" value="${esc(row.materialLot||'')}" placeholder="원재료 LOT"></td><td><select data-mat="inputStatus" data-i="${i}"><option ${row.inputStatus!=='잔량'?'selected':''}>신규</option><option ${row.inputStatus==='잔량'?'selected':''}>잔량</option></select></td><td><input data-mat="plan" data-i="${i}" inputmode="decimal" value="${esc(row.plan??'')}"></td><td><input data-mat="actual" data-i="${i}" inputmode="decimal" value="${esc(row.actual??'')}" placeholder="실투입"></td><td class="qwp-calc ${rem>0?'warn':''}" id="qwpRemain${i}">${rem==null?'—':rem.toFixed(3)+' kg'}</td><td class="qwp-calc ${calcTone(err)}" id="qwpErr${i}">${err==null?'—':`${err>0?'+':''}${err.toFixed(2)}%`}</td><td class="qwp-calc ${calcTone(err)}" id="qwpRatio${i}">${ratio==null?'—':ratio.toFixed(2)+'%'}</td><td><input data-mat="note" data-i="${i}" value="${esc(row.note||'')}" placeholder="비고"></td><td><button type="button" class="qwp-btn danger" data-remove-mat="${i}">삭제</button></td></tr>`;}
  function packRowHtml(row,i,date){return`<tr><td>${i+1}</td><td><input data-pack="containerNo" data-i="${i}" value="${esc(row.containerNo||'')}" placeholder="미입력 시 자동 채번"></td><td><input data-pack="packWeight" data-i="${i}" inputmode="decimal" value="${esc(row.packWeight??'')}"></td><td><input data-pack="packDate" data-i="${i}" type="date" value="${esc(row.packDate||date||'')}"></td><td><input data-pack="storageLocation" data-i="${i}" value="${esc(row.storageLocation||'')}" placeholder="예: 중간재 Rack A-01"></td><td><select data-pack="status" data-i="${i}"><option ${row.status==='포장계획'?'selected':''}>포장계획</option><option ${row.status==='포장완료'?'selected':''}>포장완료</option><option ${row.status==='사용가능'?'selected':''}>사용가능</option></select></td><td class="qwp-calc">${num(row.packWeight).toFixed(3)} kg</td><td><button type="button" class="qwp-btn danger" data-remove-pack="${i}">삭제</button></td></tr>`;}

  function bindForm(binder){
    const d=state.draft;
    const byId=id=>document.getElementById(id);
    byId('qwpCloseForm')?.addEventListener('click',renderList);byId('qwpCancel')?.addEventListener('click',renderList);byId('qwpSave')?.addEventListener('click',saveOrder);
    byId('qwpWorkType')?.addEventListener('change',e=>{const type=e.target.value,product=products().find(name=>state.bom[name]?.workType===type)||firstProduct(),bom=state.bom[product];d.form={...d.form,workType:type,product,tank:bom?.tanks?.[0]||'',lotNo:d.editing?d.form.lotNo:''};d.materials=blankMaterials(product);d.packs=[blankPack()];renderForm();});
    byId('qwpProduct')?.addEventListener('change',e=>{const product=e.target.value,bom=state.bom[product];d.form={...d.form,product,workType:bom?.workType||d.form.workType,tank:bom?.tanks?.[0]||'',lotNo:d.editing?d.form.lotNo:''};d.materials=blankMaterials(product);d.packs=[blankPack()];renderForm();});
    byId('qwpTank')?.addEventListener('change',e=>d.form.tank=e.target.value);
    byId('qwpProdDate')?.addEventListener('change',e=>{d.form.prodDate=e.target.value;if(!d.editing)d.form.lotNo='';renderForm();});
    byId('qwpSite')?.addEventListener('change',e=>{d.form.site=e.target.value;if(!d.editing)d.form.lotNo='';renderForm();});
    byId('qwpLot')?.addEventListener('input',e=>d.form.lotNo=e.target.value.toUpperCase().replace(/\s/g,''));
    byId('qwpHours')?.addEventListener('input',e=>d.form.hours=e.target.value);byId('qwpTimeRange')?.addEventListener('input',e=>d.form.timeRange=e.target.value);byId('qwpShift')?.addEventListener('change',e=>d.form.shiftType=e.target.value);byId('qwpWorker')?.addEventListener('input',e=>d.form.worker=e.target.value);
    document.querySelectorAll('[data-mat]').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',e=>{const i=Number(e.target.dataset.i),key=e.target.dataset.mat;let value=e.target.value;if(key==='materialLot')value=value.toUpperCase();if(['plan','actual'].includes(key))value=value.replace(/[^0-9.]/g,'');d.materials[i][key]=value;if(key==='name'){d.materials[i].materialLot='';d.materials[i].containerNo='';d.materials[i].availableQty='';d.materials[i].inputStatus='신규';const typeEl=byId(`qwpType${i}`);if(typeEl)typeEl.textContent=materialType(value);}updateFormCalcs();}));
    document.querySelectorAll('[data-remove-mat]').forEach(b=>b.addEventListener('click',()=>{d.materials.splice(Number(b.dataset.removeMat),1);renderForm();}));
    byId('qwpAddMaterial')?.addEventListener('click',()=>{const options=availableMaterialOptions((state.bom[d.form.product]||{}).workType);d.materials.push({seq:d.materials.length+1,name:options.find(v=>v!=='중간배치 선택')||'NMP',materialLot:'',containerNo:'',inputStatus:'신규',availableQty:'',base:'',plan:'',actual:'',remaining:null,unit:'kg',note:''});renderForm();});
    if(binder){document.querySelectorAll('[data-pack]').forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',e=>{const i=Number(e.target.dataset.i),key=e.target.dataset.pack;let value=e.target.value;if(key==='containerNo')value=value.toUpperCase();if(key==='packWeight')value=value.replace(/[^0-9.]/g,'');d.packs[i][key]=value;updateFormCalcs();}));document.querySelectorAll('[data-remove-pack]').forEach(b=>b.addEventListener('click',()=>{d.packs.splice(Number(b.dataset.removePack),1);renderForm();}));byId('qwpAddPack')?.addEventListener('click',()=>{d.packs.push(blankPack());renderForm();});}
    updateFormCalcs();
  }

  function updateFormCalcs(){
    const d=state.draft;if(!d)return;const plan=draftPlanTotal(),actual=d.materials.reduce((s,r)=>s+num(r.actual),0),remSum=d.materials.reduce((s,r)=>s+(remaining(r)||0),0);const planEl=document.getElementById('qwpPlanTotal'),ps=document.getElementById('qwpMatPlanSum'),as=document.getElementById('qwpMatActualSum'),rs=document.getElementById('qwpMatRemainSum');if(planEl)planEl.value=plan>0?plan.toFixed(3):'';if(ps)ps.textContent=plan>0?plan.toFixed(3)+' kg':'';if(as)as.textContent=d.materials.some(r=>nullableNum(r.actual)!=null)?actual.toFixed(3)+' kg':'';if(rs)rs.textContent=d.materials.some(r=>remaining(r)!=null)?remSum.toFixed(3)+' kg':'';
    d.materials.forEach((row,i)=>{const rem=remaining(row),err=errorPct(row),ratio=ratioPct(row),re=document.getElementById(`qwpRemain${i}`),ee=document.getElementById(`qwpErr${i}`),ra=document.getElementById(`qwpRatio${i}`);if(re){re.textContent=rem==null?'—':rem.toFixed(3)+' kg';re.className=`qwp-calc ${rem>0?'warn':''}`;}if(ee){ee.textContent=err==null?'—':`${err>0?'+':''}${err.toFixed(2)}%`;ee.className=`qwp-calc ${calcTone(err)}`;}if(ra){ra.textContent=ratio==null?'—':ratio.toFixed(2)+'%';ra.className=`qwp-calc ${calcTone(err)}`;}});
    const pSum=document.getElementById('qwpPackSum');if(pSum)pSum.textContent=d.packs.reduce((s,r)=>s+num(r.packWeight),0).toFixed(3)+' kg';
  }
  function showFormError(text){const el=document.getElementById('qwpError');if(!el)return;el.textContent=text;el.classList.add('show');window.scrollTo({top:0,behavior:'smooth'});}

  async function saveOrder(){
    const d=state.draft;if(!d)return;const f=d.form,bom=state.bom[f.product]||state.bom[firstProduct()]||{},lot=(f.lotNo||nextLot(f.prodDate,f.site)||'').trim().toUpperCase();
    if(!/^\d{4}-\d{2}-\d{2}$/.test(f.prodDate)){showFormError('생산일자를 선택하세요.');return;}if(!lot||lot==='—'){showFormError('LOT No.를 확인하세요.');return;}
    busy(true,'PC 공용 작업지시 DB에 저장하는 중입니다.');
    try{
      const fresh=await api('/api/qmes-sync/workorder');const current=(fresh||[]).find(r=>compact(r.record_key).toUpperCase()===lot);if(d.editing&&current&&compact(current.updated_at)!==compact(d.editing.updated_at))throw new Error('다른 PC에서 같은 작업지시를 수정했습니다. 새로고침 후 다시 수정하세요.');if(!d.editing&&current&&!parseRecord(current).deleted)throw new Error('이미 사용 중인 LOT No.입니다.');
      const base=current?parseRecord(current):(d.base||{}),qty=Number(draftPlanTotal().toFixed(3)),time=todayTime(),existingDone=d.editing?num((base.batch||{}).done):0,isBinder=bom.workType==='바인더 솔루션(중간재)';
      const packaging=isBinder?d.packs.filter(row=>compact(row.containerNo||row.packWeight||row.packDate||row.storageLocation)).map((row,index)=>({containerNo:compact(row.containerNo||`${lot}-P${String(index+1).padStart(2,'0')}`).toUpperCase(),packWeight:Number(num(row.packWeight).toFixed(3)),packDate:row.packDate||f.prodDate,storageLocation:compact(row.storageLocation),remainingQty:Number(num(row.packWeight).toFixed(3)),status:row.status||'포장계획'})):[];
      const inputs=d.materials.map((it,index)=>{const planned=nullableNum(it.plan);const actual=nullableNum(it.actual);const type=materialType(it.name),available=type==='중간재'?Number(nullableNum(it.availableQty)??planned??0):Number(nullableNum(it.availableQty)??planned??0),rem=actual==null?null:Number(Math.max(0,available-actual).toFixed(3));return{seq:index+1,name:it.name,lot:it.materialLot||'',materialLot:it.materialLot||'',materialType:type,containerNo:compact(it.containerNo).toUpperCase(),inputStatus:it.inputStatus||'신규',availableQty:available,remaining:rem,unit:it.unit||'kg',note:it.note||'',base:nullableNum(it.base)??'',std:planned,plan:planned,act:actual,ratio:planned>0&&actual!=null?Number((actual/planned*100).toFixed(2)):null,error:planned>0&&actual!=null?Number(((actual-planned)/planned*100).toFixed(2)):null,ok:null,by:''};});
      const doc={item:f.product,workType:bom.workType||'완제품',procName:bom.procName,tank:f.tank,plan:qty,date:f.prodDate,hours:f.hours,timeRange:f.timeRange,shiftType:f.shiftType,workers:compact(f.worker),status:'발행',packaging,inputs,conds:Array.isArray(base.doc?.conds)&&base.doc.conds.length?base.doc.conds:defaultConds()};
      const batch={no:lot,item:f.product,workType:bom.workType||'완제품',tank:f.tank,plan:qty,done:existingDone,unit:'kg',due:f.prodDate,status:'발행',shift:`${f.shiftType} · ${f.timeRange}`,worker:compact(f.worker),time};
      const binderInput=inputs.find(it=>materialType(it.name)==='중간재'),binderLot=compact(binderInput?.materialLot).toUpperCase();
      const lotRecord={item:f.product.trim(),itemName:f.product,workType:bom.workType,qty:`${qty.toLocaleString()} kg (계획)`,wo:lot,status:'발행 — 생산 대기',stage:'수입',materials:inputs.filter(it=>compact(it.materialLot)).map(it=>({lot:it.materialLot,code:'-',name:it.name,materialType:it.materialType,containerNo:it.containerNo||'',inputStatus:it.inputStatus||'신규',qty:`${Number(it.act??it.plan??0).toLocaleString()} ${it.unit||'kg'}`,remainingQty:it.remaining,supplier:it.materialType==='중간재'?'사내 중간재':'-',recv:f.prodDate,iqc:it.materialType==='중간재'?'중간재 추적':'투입 전 검사 확인'})),binderLot,containers:packaging.map(row=>row.containerNo),steps:[{stage:'수입',name:'작업지시 발행',time,detail:`${bom.workType} · ${bom.procName} · ${f.tank} · 계획 ${qty.toLocaleString()}kg`,result:'발행',by:currentUser()}],ship:null};
      const previousContainers=base.containers&&typeof base.containers==='object'?base.containers:{},containers={...previousContainers};packaging.forEach(row=>{containers[row.containerNo]={...row,lot,materialName:f.product,workOrder:lot,initialQty:row.packWeight,updatedAt:nowIso()};});
      const intermediateLot=isBinder?{...(base.intermediateLot||{}),lot,type:f.product,workType:bom.workType,parentLots:inputs.map(it=>compact(it.materialLot)).filter(Boolean),childLots:base.intermediateLot?.childLots||[],containers:packaging.map(row=>row.containerNo),qty,status:'생산대기',workOrder:lot,updatedAt:nowIso(),by:currentUser()}:(base.intermediateLot||null);
      const payload={lotNo:lot,doc,batch,lotRecord,intermediateLot,containers,remainders:base.remainders||{}};
      await api('/api/qmes-sync/workorder',{method:'POST',body:JSON.stringify({key:lot,payload})});
      await ensureAutoPqc(lot,f.prodDate,f.product);
      await loadData();state.draft=null;renderList();
    }catch(error){if(error.message!=='AUTH')showFormError(`저장 실패: ${error.message}`);}finally{busy(false);}
  }

  async function ensureAutoPqc(lot,date,product){
    const current=await api('/api/qmes-sync/pqc').catch(()=>state.pqcRecords||[]);const exists=(current||[]).some(record=>{const p=parseRecord(record);return !p.deleted&&(compact(p.lotNo)===lot||(p.rows||[]).some(row=>compact(row.lot)===lot));});if(exists){state.pqcRecords=current;return;}
    const groupId=`PQC-${date.replace(/-/g,'').slice(2)}-${lot.replace(/[^A-Za-z0-9]/g,'')}`,time=new Date(),hh=`${String(time.getHours()).padStart(2,'0')}:${String(time.getMinutes()).padStart(2,'0')}`;const rows=['점도','고형분','입도(Dmax)','외관'].map((check,index)=>({id:`${groupId}-${index+1}`,groupId,date,shipDate:'',time:hh,lot,product,check,value:'',measurements:[],average:null,judge:'검사대기',note:'공정',remarks:'작업지시서 발행 후 공정검사 성적서 자동 발행',inspector:'',source:'WORK ORDER ISSUE AUTO',sharedSync:true}));
    await api('/api/qmes-sync/pqc',{method:'POST',body:JSON.stringify({key:groupId,payload:{mode:'PQC',lotNo:lot,rows,savedAt:time.toISOString(),savedBy:'SYSTEM'}})});state.pqcRecords=await api('/api/qmes-sync/pqc').catch(()=>current);
  }

  function currentUser(){const u=state.user||{};return compact(u.name||u.loginId||u.email)||'MOBILE';}
  async function changeStatus(lot,status){
    busy(true,'작업지시 상태를 PC 공용 DB에 반영하는 중입니다.');try{const fresh=await api('/api/qmes-sync/workorder'),record=(fresh||[]).find(r=>compact(r.record_key).toUpperCase()===lot);if(!record)throw new Error('작업지시를 찾을 수 없습니다.');const p=parseRecord(record),doc={...(p.doc||{})},batch={...(p.batch||{})},lotRecord={...(p.lotRecord||{})},order=orderFromRecord(record),prev=doc.manualStatus||autoStatus(order),plan=Math.max(0,num(doc.plan??batch.plan)),actual=status==='완료'?plan:status==='발행'?0:Math.max(0,num(doc.productionActual??batch.done)),progress=plan>0?Math.min(100,Math.round(actual/plan*100)):0;doc.manualStatus=status;doc.status=status;doc.productionActual=actual;doc.productionProgress=progress;doc.statusHistory=[...(doc.statusHistory||[]),{from:prev,to:status,changedAt:nowIso()}];batch.status=status==='생산중'?'진행중':status;batch.done=actual;batch.updatedAt=nowIso();if(!String(lotRecord.status||'').includes('홀드')){lotRecord.stage='생산';lotRecord.qty=`${actual.toLocaleString()} kg / 계획 ${plan.toLocaleString()} kg`;lotRecord.status=status==='완료'?'생산완료 — 검사 대기':status==='검사중'?'검사중':status==='생산중'?'생산중':'발행 — 생산 대기';}await api('/api/qmes-sync/workorder',{method:'POST',body:JSON.stringify({key:lot,payload:{...p,lotNo:lot,doc,batch,lotRecord}})});await loadData();renderList();}catch(error){if(error.message!=='AUTH')alert(`상태 변경 실패: ${error.message}`);}finally{busy(false);}
  }

  async function deleteOrder(lot){
    const reason=prompt(`작업지시 ${lot} 삭제 사유를 입력하세요.`,'');if(reason===null)return;if(!compact(reason)){alert('삭제 사유를 입력하세요.');return;}if(!confirm(`${lot} 작업지시와 연결된 PQC/OQC 공용 기록을 삭제 처리할까요?`))return;
    busy(true,'작업지시와 연결 검사기록을 삭제 처리하는 중입니다.');try{const [work,pqc,oqc]=await Promise.all([api('/api/qmes-sync/workorder'),api('/api/qmes-sync/pqc').catch(()=>[]),api('/api/qmes-sync/oqc').catch(()=>[])]),record=(work||[]).find(r=>compact(r.record_key).toUpperCase()===lot);if(!record)throw new Error('작업지시를 찾을 수 없습니다.');const deletedAt=nowIso(),deletedBy=currentUser(),p=parseRecord(record);await api('/api/qmes-sync/workorder',{method:'POST',body:JSON.stringify({key:lot,payload:{...p,lotNo:lot,deleted:true,deletedAt,deletedBy,deleteReason:compact(reason)}})});for(const[type,records]of[['pqc',pqc],['oqc',oqc]])for(const row of(records||[])){const ip=parseRecord(row);if(ip.deleted||compact(ip.lotNo)!==lot)continue;await api(`/api/qmes-sync/${type}`,{method:'POST',body:JSON.stringify({key:row.record_key,payload:{...ip,deleted:true,deletedAt,deletedBy,deleteReason:compact(reason)}})});}await loadData();renderList();}catch(error){if(error.message!=='AUTH')alert(`삭제 실패: ${error.message}`);}finally{busy(false);}
  }

  function previewHtml(order){const d=order.doc,b=order.batch,inputs=d.inputs||[],packs=d.packaging||[],planned=inputs.reduce((s,r)=>s+num(r.plan??r.std),0),actual=inputs.reduce((s,r)=>s+num(r.act),0),allDone=inputs.every(r=>r.act!=null)&&(d.conds||[]).every(c=>c.act&&c.act!=='—');return`<div class="qwp-paper"><div class="qwp-paper-top"><div><img src="/assets/namo-mobile-logo.svg?v=${VERSION}" alt="NAMO"></div><div class="qwp-paper-title"><b>작업지시서</b><small>WORK ORDER</small></div><div class="qwp-paper-meta"><div>작업지시번호 : <b>${esc(order.lot)}</b></div><div>생산일자 : ${esc(d.date||b.due||'-')}</div></div></div>
    <div class="qwp-paper-sec"><h4>기본정보</h4><table><thead><tr><th>LOT No.</th><th>제품명</th><th>설비명</th><th>작업자</th></tr></thead><tbody><tr><td>${esc(order.lot)}</td><td>${esc(d.item||b.item||'-')}</td><td>${esc(d.tank||b.tank||'-')}</td><td>${esc(d.workers||b.worker||'-')}</td></tr></tbody></table></div>
    <div class="qwp-paper-sec"><h4>생산정보</h4><table><thead><tr><th>작업구분</th><th>공정명</th><th>생산계획량</th><th>작업시간</th><th>생산시간</th><th>근무유형</th></tr></thead><tbody><tr><td>${esc(d.workType||b.workType||'완제품')}</td><td>${esc(d.procName||'절연슬러리 제조')}</td><td>${fmt(d.plan??b.plan)} kg</td><td>${esc(d.hours||'-')}</td><td>${esc(d.timeRange||'-')}</td><td>${esc(d.shiftType||'일반')}</td></tr></tbody></table></div>
    <div class="qwp-paper-sec"><h4>원재료 투입</h4><div style="overflow:auto"><table style="min-width:760px"><thead><tr><th>No</th><th>원재료명</th><th>원재료 LOT</th><th>상태</th><th>계획량</th><th>실투입량</th><th>사용 후 잔량</th><th>판정</th><th>비고</th></tr></thead><tbody>${inputs.map((r,i)=>`<tr><td>${r.seq??i+1}</td><td>${esc(r.name)}<br><small>${esc(r.materialType||materialType(r.name))}</small></td><td>${esc(r.materialLot||r.lot||'-')}</td><td>${esc(r.inputStatus||'신규')}</td><td>${nullableNum(r.std)!=null?`${fmt(r.std)} ${esc(r.unit||'kg')}`:'-'}</td><td>${r.act!=null?`${fmt(r.act)} ${esc(r.unit||'kg')}`:'-'}</td><td>${r.remaining!=null?`${Number(r.remaining).toFixed(3)} ${esc(r.unit||'kg')}`:'-'}</td><td>${r.ok===true?'적합':r.ok===false?'공차 이탈':'—'}</td><td>${esc(r.note||'-')}</td></tr>`).join('')}<tr><td></td><td><b>합계</b></td><td></td><td></td><td><b>${planned.toFixed(2)} kg</b></td><td><b>${actual>0?actual.toFixed(2)+' kg':'-'}</b></td><td><b>${inputs.some(r=>r.remaining!=null)?inputs.reduce((s,r)=>s+num(r.remaining),0).toFixed(3)+' kg':'-'}</b></td><td colspan="2"></td></tr></tbody></table></div></div>
    ${packs.length?`<div class="qwp-paper-sec"><h4>중간재 포장정보</h4><div style="overflow:auto"><table style="min-width:680px"><thead><tr><th>No</th><th>중간재 LOT</th><th>포장번호</th><th>포장중량</th><th>포장일자</th><th>보관위치</th><th>현재 잔량</th><th>상태</th></tr></thead><tbody>${packs.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(order.lot)}</td><td>${esc(r.containerNo||'-')}</td><td>${num(r.packWeight).toFixed(3)} kg</td><td>${esc(r.packDate||'-')}</td><td>${esc(r.storageLocation||'-')}</td><td>${num(order.payload.containers?.[r.containerNo]?.remainingQty??r.remainingQty).toFixed(3)} kg</td><td>${esc(order.payload.containers?.[r.containerNo]?.status||r.status||'-')}</td></tr>`).join('')}</tbody></table></div></div>`:''}
    <div class="qwp-paper-sec"><h4>특이사항</h4><div style="min-height:38px;padding:8px;border:1px solid #c7cfd6;font-size:8px">${esc(d.remarks||'-')}</div></div><table class="qwp-sign"><tbody><tr><th>작성</th><th>검토</th><th>승인</th></tr><tr><td>${esc((d.workers||b.worker||'').split(',')[0])}</td><td>${allDone?esc(currentUser()):''}</td><td></td></tr></tbody></table><div class="qwp-paper-foot">본 문서는 QMES에서 발행된 관리문서입니다.</div></div>`;}
  function openPreview(lot){const order=orders().find(o=>o.lot===lot);if(!order)return;state.previewLot=lot;const modal=document.getElementById('qwpPreview');modal.innerHTML=`<div class="qwp-modal-card"><div class="qwp-modal-head"><strong>작업지시서 미리보기 · ${esc(lot)}</strong><div class="qwp-actions"><button class="qwp-btn print" id="qwpModalPrint">출력</button><button class="qwp-btn" id="qwpModalEdit">수정</button><button class="qwp-btn" id="qwpModalClose">닫기</button></div></div>${previewHtml(order)}</div>`;modal.classList.add('open');modal.setAttribute('aria-hidden','false');document.getElementById('qwpModalClose')?.addEventListener('click',closePreview);document.getElementById('qwpModalEdit')?.addEventListener('click',()=>{closePreview();openForm(lot);});document.getElementById('qwpModalPrint')?.addEventListener('click',()=>window.print());modal.addEventListener('click',e=>{if(e.target===modal)closePreview();},{once:true});}
  function closePreview(){const modal=document.getElementById('qwpPreview');modal?.classList.remove('open');modal?.setAttribute('aria-hidden','true');state.previewLot='';}

  async function loadData(){
    busy(true,'PC 공용 작업지시 데이터를 불러오는 중입니다.');try{const [work,pqc,oqc,user]=await Promise.all([api('/api/qmes-sync/workorder'),api('/api/qmes-sync/pqc').catch(()=>[]),api('/api/qmes-sync/oqc').catch(()=>[]),api('/api/auth/me').catch(()=>null)]);state.records=Array.isArray(work)?work:[];state.pqcRecords=Array.isArray(pqc)?pqc:[];state.oqcRecords=Array.isArray(oqc)?oqc:[];state.user=user?.user||user?.data?.user||user||state.user;}finally{busy(false);}
  }

  async function init(){
    ensureStyle();shell();try{await Promise.all([loadPcCatalog(),loadData()]);renderList();if(params.get('new')==='1')openForm();}catch(error){if(error.message!=='AUTH'){const root=document.getElementById('qwpRoot');if(root)root.innerHTML=`<div class="qwp-empty">작업지시 화면을 불러오지 못했습니다.<br>${esc(error.message)}</div>`;}}
  }

  ensureStyle();
  const content=document.querySelector('.content');
  if(content){const observer=new MutationObserver(()=>{if(!document.getElementById('qwpRoot')&&state.mounted){shell();state.draft?renderForm():renderList();}});observer.observe(content,{childList:true});}
  setTimeout(init,80);
})();
