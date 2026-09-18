/* NAMO QMES - Sales/Due screen rescue
 * 2026-09-18
 * ADD-ONLY.
 * Restores the Sales/Due ledger when legacy visual owners hide the body.
 * No MutationObserver, no data deletion, no data writes.
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_SCREEN_RESCUE_20260918__) return;
  window.__QMES_SALES_SCREEN_RESCUE_20260918__=true;

  const SALES='qmes-erp-sales-v1';
  const META='qmes-sales-order-meta-v1';
  const SHIPPING='qmes-erp-shipping-v1';
  const DELETED='qmes-sales-deleted-v1';
  const HOST='qmes-sales-screen-rescue-20260918';
  const STYLE='qmes-sales-screen-rescue-20260918-style';
  const PAGE_SIZE=10;
  const state={from:'2025-01-01',to:String(new Date().getFullYear())+'-12-31',customer:'',product:'',progress:'전체',due:'전체',q:''};
  let page=1;
  let remoteRows=null;

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const num=v=>{const n=Number(String(v==null?'':v).replace(/[^0-9.+-]/g,''));return Number.isFinite(n)?n:0};
  const esc=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||'null');return v==null?f:v}catch(_){return f}};
  const localRows=()=>{const v=read(SALES,[]);return Array.isArray(v)?v:[]};
  const metaMap=()=>{const v=read(META,{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}};
  const shipRows=()=>{const v=read(SHIPPING,[]);return Array.isArray(v)?v:[]};
  const deleted=()=>{const v=read(DELETED,[]);return Array.isArray(v)?v:[]};
  const rows=()=>Array.isArray(remoteRows)&&remoteRows.length?remoteRows:localRows();
  const key=r=>clean(r&&(r.workOrder||r.id));
  const meta=(r,m=metaMap())=>m[key(r)]||m[clean(r&&r.id)]||(r&&r.orderMeta)||{};
  const shownId=(r,m=metaMap())=>clean(meta(r,m).salesOrderIdOverride)||clean(r&&r.id);
  const iso=v=>{const m=clean(v).match(/(20\d{2})[-./]?(\d{1,2})[-./]?(\d{1,2})/);return m?m[1]+'-'+String(m[2]).padStart(2,'0')+'-'+String(m[3]).padStart(2,'0'):''};
  const orderDateFromId=id=>{const a=clean(id).match(/^SO-(20\d{2})(\d{2})(\d{2})-/i);if(a)return a[1]+'-'+a[2]+'-'+a[3];const b=clean(id).match(/^SO-(\d{2})(\d{2})(\d{2})-/i);return b?'20'+b[1]+'-'+b[2]+'-'+b[3]:''};
  const orderDate=(r,m)=>{const mm=meta(r,m);return iso(mm.orderDate||r&&r.orderDate||r&&r.productionDate||r&&r.createdAt)||orderDateFromId(shownId(r,m))};
  const customer=(r,m)=>{const mm=meta(r,m);return clean(mm.customerOverride)||clean(r&&r.customer)||'-'};
  const product=(r,m)=>{const mm=meta(r,m);return clean(mm.productOverride)||clean(r&&r.product)||'-'};
  const qty=(r,m)=>{const mm=meta(r,m);return num(mm.qtyOverride!=null?mm.qtyOverride:r&&r.qty)};
  const due=(r,m)=>{const mm=meta(r,m);return iso(mm.requestedDue||r&&r.due)};
  const delivery=(r,m)=>{const mm=meta(r,m);return clean(mm.deliveryPlace)||clean(r&&r.deliveryPlace)||'-'};
  const fmt=v=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:3});

  function isDeleted(r,m){
    const id=clean(r&&r.id),wo=key(r),shown=shownId(r,m);
    return deleted().some(x=>{const did=clean(x&&x.id),dwo=clean(x&&x.workOrder);return (did&&(did===id||did===shown))||(dwo&&wo&&dwo===wo)});
  }

  function shipDone(r,m){
    const mm=meta(r,m),id=shownId(r,m),raw=clean(r&&r.id),wo=key(r);
    const text=[r&&r.shipping,mm.shippingStatus].map(clean).join(' ');
    if((r&&r.actualShipment===true)||mm.actualShipment===true||/출하완료|납품완료|배송완료|출고완료/.test(text)) return true;
    return shipRows().some(s=>{
      const sid=clean(s&&(s.sales||s.salesOrder||s.salesOrderId)),swo=clean(s&&(s.workOrder||s.lot));
      const st=[s&&s.shipping,s&&s.delivery,s&&s.status].map(clean).join(' ');
      return ((sid&&(sid===id||sid===raw))||(wo&&swo===wo))&&((s&&s.actualShipment===true)||/출하완료|납품완료|배송완료|출고완료/.test(st));
    });
  }

  function production(r,m,done){
    if(done)return '생산완료';
    const mm=meta(r,m),raw=clean(mm.productionPlanStatus)||clean(r&&r.plan);
    if(/완료/.test(raw))return '생산완료';
    if(/생산중|진행/.test(raw))return '생산진행';
    if(clean(r&&r.workOrder)||clean(mm.workOrder))return '생산진행';
    return raw||'생산대기';
  }
  function shipping(r,m,done){if(done)return '출하완료';const mm=meta(r,m),raw=clean(mm.shippingStatus)||clean(r&&r.shipping);return raw&&raw!=='-'?raw:'출하대기'}
  function dueState(r,m,done){
    const d=due(r,m);
    if(done)return {label:'납기완료',tone:'good',bucket:'완료'};
    if(!d)return {label:'-',tone:'gray',bucket:'기타'};
    const target=new Date(d+'T23:59:59').getTime(),now=Date.now(),days=Math.ceil((target-now)/86400000);
    if(days<0)return {label:'지연 '+Math.abs(days)+'일',tone:'bad',bucket:'지연'};
    if(days<=7)return {label:'임박 D-'+days,tone:'warn',bucket:'임박'};
    return {label:'정상',tone:'good',bucket:'정상'};
  }
  function progress(prod,ship){if(/출하완료/.test(ship))return '출하완료';if(/출하/.test(ship)&&!/대기/.test(ship))return '출하진행';if(/생산완료/.test(prod))return '생산완료';if(/진행/.test(prod))return '생산진행';return '생산대기'}

  function view(){
    const m=metaMap();
    return rows().filter(r=>r&&!isDeleted(r,m)).map(r=>{
      const done=shipDone(r,m),prod=production(r,m,done),ship=shipping(r,m,done),ds=dueState(r,m,done);
      return {row:r,id:shownId(r,m),date:orderDate(r,m),customer:customer(r,m),product:product(r,m),qty:qty(r,m),unit:'kg',due:due(r,m),dueState:ds,production:prod,shipping:ship,progress:progress(prod,ship),delivery:delivery(r,m)};
    }).sort((a,b)=>String(b.date).localeCompare(String(a.date))||String(b.id).localeCompare(String(a.id),undefined,{numeric:true}));
  }

  function filtered(all){
    const q=clean(state.q).toLowerCase(),pq=clean(state.product).toLowerCase();
    return all.filter(x=>{
      if(state.from&&x.date&&x.date<state.from)return false;
      if(state.to&&x.date&&x.date>state.to)return false;
      if(state.customer&&x.customer!==state.customer)return false;
      if(pq&&!x.product.toLowerCase().includes(pq))return false;
      if(state.progress!=='전체'&&x.progress!==state.progress)return false;
      if(state.due!=='전체'&&x.dueState.bucket!==state.due)return false;
      if(q&&!([x.id,x.date,x.customer,x.product,x.due,x.production,x.shipping,x.delivery].join(' ').toLowerCase().includes(q)))return false;
      return true;
    });
  }

  function findRoot(){
    const nodes=[...document.querySelectorAll('.qerp')];
    return nodes.find(node=>/수주\s*·?\s*납기\s*관리|영업\s*\/\s*수주/.test(clean(node.querySelector('.qerp-title')?.textContent)))||null;
  }

  function installStyle(){
    if(document.getElementById(STYLE))return;
    const s=document.createElement('style');s.id=STYLE;s.textContent=`
#${HOST}{margin:0;padding:0}
#${HOST} .qsr-filter{padding:12px 0 14px;background:#fff}
#${HOST} .qsr-grid{display:grid;grid-template-columns:350px 155px 250px 145px 145px minmax(270px,1fr) 78px 78px;gap:0 10px;align-items:end}
#${HOST} .qsr-field{display:flex;flex-direction:column;gap:6px;min-width:0}
#${HOST} .qsr-field>span:first-child{color:#68758a;font-size:10px;font-weight:800}
#${HOST} .qsr-date{display:grid;grid-template-columns:minmax(0,1fr) 14px minmax(0,1fr);gap:4px;align-items:center}
#${HOST} .qsr-date>b{text-align:center;color:#7c8c9a;font-size:11px}
#${HOST} input,#${HOST} select{width:100%;height:42px;box-sizing:border-box;border:1px solid #b9c9d5;border-radius:10px;background:#fff;color:#26394b;padding:0 11px;font-size:12px;font-weight:650}
#${HOST} .qsr-grid>button{width:78px;height:42px;border:1px solid #b9c9d5;border-radius:10px;background:linear-gradient(180deg,#fff 0%,#e8eef3 100%);color:#25384a;font-size:11px;font-weight:850}
#${HOST} .qsr-grid>button.primary{border-color:#1786c7;background:#1786c7;color:#fff}
#${HOST} .qsr-list{overflow:hidden;border:1px solid #d3dfe7;background:#fff}
#${HOST} .qsr-wrap{width:100%;overflow:auto}
#${HOST} table{width:100%;min-width:1450px;border-collapse:collapse;table-layout:fixed;font-size:10px}
#${HOST} thead th{height:46px;padding:8px 7px;background:linear-gradient(180deg,#7fb4d6 0%,#619bc2 100%);color:#fff;border-right:1px solid rgba(255,255,255,.32);border-bottom:1px solid #4f8ab2;font-size:10px;font-weight:900;text-align:center;white-space:nowrap}
#${HOST} tbody td{height:46px;padding:8px 7px;background:#fff;color:#405569;border-bottom:1px solid #dce5eb;font-size:10px;font-weight:600;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#${HOST} tbody tr:nth-child(even) td{background:#f7fafc}
#${HOST} td.left{text-align:left}#${HOST} td.num{text-align:right}
#${HOST} .qsr-link{border:0;background:transparent;color:#126ca8;font-size:10px;font-weight:850;padding:0;cursor:pointer}
#${HOST} .qsr-badge{display:inline-flex;align-items:center;justify-content:center;min-width:50px;height:24px;padding:0 8px;border-radius:6px;font-size:9px;font-weight:850}
#${HOST} .qsr-badge.good{background:#e7f8ed;color:#18864b}#${HOST} .qsr-badge.warn{background:#fff1df;color:#d87b15}#${HOST} .qsr-badge.bad{background:#ffeaea;color:#c94444}#${HOST} .qsr-badge.blue{background:#e7f4ff;color:#187bc0}#${HOST} .qsr-badge.gray{background:#eef1f4;color:#647485}
#${HOST} .qsr-actions{display:flex;justify-content:center;gap:5px}#${HOST} .qsr-actions button{height:28px;min-width:38px;padding:0 8px;border:1px solid #b9cbd8;border-radius:5px;background:#fff;color:#365269;font-size:9px;font-weight:850}#${HOST} .qsr-actions button:first-child{border-color:#1786c7;background:#1786c7;color:#fff}
#${HOST} .qsr-empty{height:210px;text-align:center;color:#8797a6;font-size:11px}
#${HOST} .qsr-foot{display:flex;align-items:center;justify-content:center;gap:4px;min-height:54px;padding:8px 12px;border-top:1px solid #dce5eb;background:#fff}
#${HOST} .qsr-page{min-width:34px;height:34px;padding:0 9px;border:1px solid #b8c7d4;border-radius:4px;background:#fff;color:#334b60;font-size:11px;font-weight:850}
#${HOST} .qsr-page.active{border-color:#0d659e;background:#0d659e;color:#fff}
.qerp.qsr-rescued>.qerp-kpis,.qerp.qsr-rescued>.qerp-card{display:none!important}
.qerp.qsr-rescued #qmes-sales-enterprise-module-v2,.qerp.qsr-rescued #qmes-sales-due-ledger-20260918,.qerp.qsr-rescued #qmes-sales-purchase-ui-match-20260918,.qerp.qsr-rescued #qmes-sales-purchase-stable-owner-20260918,.qerp.qsr-rescued #qmes-sales-final-owner-v3-20260918{display:none!important}
@media(max-width:1350px){#${HOST} .qsr-grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}#${HOST} .qsr-grid>button{width:100%}}
`;document.head.appendChild(s);
  }

  const badge=(t,tone)=>'<span class="qsr-badge '+tone+'">'+esc(t)+'</span>';
  function rowHtml(x){
    return '<tr>'+
      '<td><button class="qsr-link" data-qsr-detail="'+esc(x.id)+'">'+esc(x.date||'-')+'</button></td>'+
      '<td><button class="qsr-link" data-qsr-detail="'+esc(x.id)+'">'+esc(x.id||'-')+'</button></td>'+
      '<td class="left">'+esc(x.customer)+'</td><td class="left">'+esc(x.product)+'</td>'+
      '<td class="num">'+fmt(x.qty)+'</td><td>'+esc(x.unit)+'</td><td>'+esc(x.due||'-')+'</td>'+
      '<td>'+badge(x.dueState.label,x.dueState.tone)+'</td>'+
      '<td>'+badge(x.production,/완료/.test(x.production)?'good':/진행/.test(x.production)?'blue':'gray')+'</td>'+
      '<td>'+badge(x.shipping,/완료/.test(x.shipping)?'good':/진행|예정/.test(x.shipping)?'blue':'gray')+'</td>'+
      '<td class="left">'+esc(x.delivery)+'</td>'+
      '<td><span class="qsr-actions"><button data-qsr-detail="'+esc(x.id)+'">상세</button><button data-qsr-edit="'+esc(x.id)+'">수정</button></span></td></tr>';
  }

  function render(){
    const host=document.getElementById(HOST);if(!host)return;
    const all=view(),data=filtered(all),customers=[...new Set(all.map(x=>x.customer).filter(v=>v&&v!=='-'))].sort((a,b)=>a.localeCompare(b,'ko'));
    const pages=Math.max(1,Math.ceil(data.length/PAGE_SIZE));if(page>pages)page=pages;
    const slice=data.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE);
    host.innerHTML='<div class="qsr-filter"><div class="qsr-grid">'+
      '<label class="qsr-field"><span>기간</span><span class="qsr-date"><input type="date" data-qsr-from value="'+esc(state.from)+'"><b>~</b><input type="date" data-qsr-to value="'+esc(state.to)+'"></span></label>'+
      '<label class="qsr-field"><span>거래처</span><select data-qsr-customer><option value="">전체</option>'+customers.map(v=>'<option value="'+esc(v)+'" '+(state.customer===v?'selected':'')+'>'+esc(v)+'</option>').join('')+'</select></label>'+
      '<label class="qsr-field"><span>품목명</span><input data-qsr-product value="'+esc(state.product)+'" placeholder="품목명 또는 규격 입력"></label>'+
      '<label class="qsr-field"><span>진행상태</span><select data-qsr-progress>'+['전체','생산대기','생산진행','생산완료','출하진행','출하완료'].map(v=>'<option '+(state.progress===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
      '<label class="qsr-field"><span>납기상태</span><select data-qsr-due>'+['전체','정상','임박','지연','완료'].map(v=>'<option '+(state.due===v?'selected':'')+'>'+v+'</option>').join('')+'</select></label>'+
      '<label class="qsr-field"><span>통합검색</span><input data-qsr-q value="'+esc(state.q)+'" placeholder="수주번호, 거래처명, 품목명 등 검색"></label>'+
      '<button class="primary" data-qsr-search>⌕ 조회</button><button data-qsr-reset>↻ 초기화</button></div></div>'+
      '<div class="qsr-list"><div class="qsr-wrap"><table><thead><tr><th>수주일 ↓</th><th>수주번호</th><th>거래처명</th><th>품목명 (규격)</th><th>수주수량</th><th>단위</th><th>요청납기</th><th>납기상태</th><th>생산상태</th><th>출하상태</th><th>납품처</th><th>관리</th></tr></thead><tbody>'+
      (slice.length?slice.map(rowHtml).join(''):'<tr><td colspan="12" class="qsr-empty">조회 조건에 해당하는 수주가 없습니다.</td></tr>')+
      '</tbody></table></div><div class="qsr-foot">'+Array.from({length:pages},(_,i)=>'<button class="qsr-page '+(i+1===page?'active':'')+'" data-qsr-page="'+(i+1)+'">'+(i+1)+'</button>').join('')+'</div></div>';
    const root=findRoot(),sub=root&&root.querySelector('.qerp-sub');if(sub)sub.textContent='총 '+data.length+'건';
  }

  function ensure(){
    installStyle();
    const root=findRoot();if(!root)return false;
    root.classList.add('qsr-rescued');
    const title=root.querySelector('.qerp-title');if(title)title.textContent='수주·납기 관리대장';
    let host=document.getElementById(HOST);
    if(!host){
      host=document.createElement('section');host.id=HOST;
      const head=root.querySelector(':scope > .qerp-head');
      if(head&&head.nextSibling)root.insertBefore(host,head.nextSibling);else root.appendChild(host);
    }
    render();
    return true;
  }

  async function hydrate(){
    if(typeof window.qmesSyncList!=='function')return;
    try{
      const records=await window.qmesSyncList('inventory');
      const found=(Array.isArray(records)?records:[]).find(r=>clean(r&&r.record_key)==='erp:sales');
      let payload=found&&found.payload;
      if(typeof payload==='string'){try{payload=JSON.parse(payload)}catch(_){payload=null}}
      if(payload&&Array.isArray(payload.rows)){remoteRows=payload.rows;render()}
    }catch(_){}
  }

  function readFilters(){
    const h=document.getElementById(HOST);if(!h)return;
    state.from=clean(h.querySelector('[data-qsr-from]')?.value);state.to=clean(h.querySelector('[data-qsr-to]')?.value);
    state.customer=clean(h.querySelector('[data-qsr-customer]')?.value);state.product=clean(h.querySelector('[data-qsr-product]')?.value);
    state.progress=clean(h.querySelector('[data-qsr-progress]')?.value)||'전체';state.due=clean(h.querySelector('[data-qsr-due]')?.value)||'전체';state.q=clean(h.querySelector('[data-qsr-q]')?.value);page=1;
  }
  function reset(){state.from='2025-01-01';state.to=String(new Date().getFullYear())+'-12-31';state.customer='';state.product='';state.progress='전체';state.due='전체';state.q='';page=1}
  function findRow(id){const wanted=clean(id),m=metaMap();return rows().find(r=>[clean(r&&r.id),key(r),shownId(r,m)].includes(wanted))||null}

  document.addEventListener('click',e=>{
    const t=e.target;if(!(t instanceof Element))return;
    const d=t.closest('[data-qsr-detail]');if(d){e.preventDefault();window.qmesSalesDetailConsistency?.open?.(clean(d.dataset.qsrDetail))||window.qmesSalesOrderDetail?.open?.(clean(d.dataset.qsrDetail));return}
    const ed=t.closest('[data-qsr-edit]');if(ed){e.preventDefault();const row=findRow(clean(ed.dataset.qsrEdit));if(row)window.qmesSalesEditDirectV18?.open?.(row);return}
    if(t.closest('[data-qsr-search]')){readFilters();render();return}
    if(t.closest('[data-qsr-reset]')){reset();render();return}
    const p=t.closest('[data-qsr-page]');if(p){page=Math.max(1,Number(p.dataset.qsrPage)||1);render();return}
    if(t.closest('[data-tab="erpSales"],[data-menu-id="erpSales"]')||/수주\s*·?\s*납기/.test(clean(t.textContent))){[0,120,400,900].forEach(ms=>setTimeout(()=>{ensure();hydrate()},ms))}
  },true);

  ['qmes:erp-runtime-loaded','qmes:mes-master-ready','qmes:enterprise-ui-ready','qmes:erp-data-changed','qmes:data-updated'].forEach(name=>window.addEventListener(name,()=>setTimeout(()=>{ensure();hydrate()},0)));
  window.addEventListener('hashchange',()=>setTimeout(()=>{ensure();hydrate()},0));
  window.addEventListener('popstate',()=>setTimeout(()=>{ensure();hydrate()},0));
  window.addEventListener('storage',e=>{if([SALES,META,SHIPPING,DELETED].includes(e.key))render()});

  [0,150,500,1100,2200].forEach(ms=>setTimeout(()=>{ensure();hydrate()},ms));
  window.qmesSalesScreenRescue20260918={ensure,render,hydrate};
})();