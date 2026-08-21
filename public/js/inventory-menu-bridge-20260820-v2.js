/* Inventory menu bridge v5.7: IQC packaging fallback + larger single-page barcode print, 2026-08-21. */
(function(){
  let root=null,host=null,current='overview',inventorySession=0;
  const sections=[['overview','재고현황'],['movement','입출고 관리'],['lot','LOT별 재고'],['production','생산투입/완료'],['count','재고실사']];
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const upper=v=>clean(v).toUpperCase();

  function iqcRows(){const db=window.DB||{};return [db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].find(Array.isArray)||[];}
  function activeIqcRefs(){return new Set(iqcRows().map(row=>{const key=upper(row?.inNo||row?.in_no||row?.lot||row?.lotNo);return key?`IQC:${key}`:'';}).filter(Boolean));}
  function pickPackaging(row){
    if(!row)return'';
    const direct=['packagingType','packaging_type','packageType','package_type','packType','pack_type','packingType','packing_type','packaging','package','packing','containerType','container_type'];
    let type='';for(const key of direct){const v=clean(row?.[key]);if(v&&v!=='-'){type=v;break;}}
    if(!type&&row?.packaging&&typeof row.packaging==='object')type=clean(row.packaging.type||row.packaging.name||row.packaging.label);
    if(!type&&row?.packageInfo&&typeof row.packageInfo==='object')type=clean(row.packageInfo.type||row.packageInfo.name||row.packageInfo.label);
    const other=clean(row?.packagingTypeOther||row?.packaging_type_other||row?.packageTypeOther||row?.package_type_other||row?.packagingOther||row?.packaging_other);
    return type==='기타'&&other?`${type}(${other})`:type;
  }
  function findIqcByValues(doc,lot,name){
    const d=upper(doc).replace(/^IQC:/,'');const l=upper(lot);const n=upper(name);
    return iqcRows().find(row=>{const inNo=upper(row?.inNo||row?.in_no||row?.receiptNo||row?.receipt_no);const rowLot=upper(row?.lot||row?.lotNo||row?.lot_no);const rowName=upper(row?.name||row?.material||row?.item||row?.itemName||row?.item_name);return (d&&inNo&&d===inNo)||(l&&rowLot===l&&(!n||!rowName||n===rowName));})||null;
  }
  function packagingFromRemark(tx){
    const r=clean(tx?.remark||tx?.reason);
    const known=['드럼','포대','말통','IBC','박스','벌크','병','캔','파우치','봉투','기타'];
    return known.find(v=>r.includes(v))||'';
  }
  function enrichTxPackaging(tx){
    if(!tx||clean(tx.packaging_type||tx.packagingType))return tx;
    const ref=clean(tx.reference_no||tx.referenceNo);
    if(!/^IQC:/i.test(ref))return tx;
    const linked=findIqcByValues(ref,tx.lot_no||tx.lotNo,tx.item_name||tx.itemName);
    const label=pickPackaging(linked)||packagingFromRemark(tx);
    if(!label)return tx;
    if(/^기타\(.+\)$/.test(label)){const m=label.match(/^기타\((.+)\)$/);return {...tx,packaging_type:'기타',packaging_type_other:m?.[1]||''};}
    return {...tx,packaging_type:label};
  }
  function findIqcForDetail(sheet){return findIqcByValues(getDetailValue(sheet,'문서번호'),getDetailValue(sheet,'LOT'),getDetailValue(sheet,'원료명'));}

  function installInventoryTransactionFilter(){
    if(window.__QMES_INV_IQC_TX_FILTER_V1__)return;window.__QMES_INV_IQC_TX_FILTER_V1__=true;
    const originalFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){const response=await originalFetch(input,init);try{const url=typeof input==='string'?input:String(input?.url||'');const method=String(init?.method||input?.method||'GET').toUpperCase();if(method!=='GET'||!url.includes('/api/inventory/transactions'))return response;const payload=await response.clone().json();if(!payload||payload.success!==true||!Array.isArray(payload.data))return response;const refs=activeIqcRefs();const filtered=payload.data.filter(tx=>{const ref=upper(tx?.reference_no||tx?.referenceNo);return !ref.startsWith('IQC:')||refs.has(ref);}).map(enrichTxPackaging);const headers=new Headers(response.headers);headers.set('content-type','application/json; charset=utf-8');return new Response(JSON.stringify({...payload,data:filtered}),{status:response.status,statusText:response.statusText,headers});}catch(error){return response;}};
  }

  function getDetailValue(sheet,label){const cell=Array.from(sheet.querySelectorAll('.inv-tx-detail-grid > div')).find(node=>clean(node.querySelector('dt')?.textContent)===label);return clean(cell?.querySelector('dd')?.textContent)||'-';}
  function labelProfile(packaging){const p=clean(packaging).toLowerCase();if(/드럼|drum|ibc|tote|탱크/.test(p))return{name:'대형',w:100,h:70,barcode:28,title:14,body:9,pad:4};if(/말통|pail|캔|can|통|bucket/.test(p))return{name:'중형',w:80,h:60,barcode:23,title:12,body:8.5,pad:3.5};if(/포대|bag|sack|봉투|파우치|pouch|박스|box|carton/.test(p))return{name:'중형',w:90,h:60,barcode:23,title:12,body:8.5,pad:3.5};if(/병|bottle|소형|vial/.test(p))return{name:'소형',w:70,h:50,barcode:18,title:10,body:7.5,pad:3};return{name:'기본',w:80,h:60,barcode:23,title:12,body:8.5,pad:3.5};}

  function adaptivePrintFromDetail(sheet){
    const packaging=getDetailValue(sheet,'포장형태');const profile=labelProfile(packaging);
    const values={'문서번호':getDetailValue(sheet,'문서번호'),'원료명':getDetailValue(sheet,'원료명'),'LOT':getDetailValue(sheet,'LOT'),'총 수량':getDetailValue(sheet,'총 수량'),'포장형태':packaging,'이동 방향':getDetailValue(sheet,'이동 방향')};
    const barcode=sheet.querySelector('.inv-tx-barcode svg');const barcodeHtml=barcode?barcode.outerHTML:'<div class="no-barcode">BARCODE</div>';const win=window.open('','_blank','width=900,height=760');if(!win)return;
    const rows=[['원료명',values['원료명']],['LOT',values['LOT']],['수량',values['총 수량']],['포장',values['포장형태']],['이동',values['이동 방향']],['문서',values['문서번호']]];const esc=v=>String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const gridTop=profile.pad+7,barcodeBottom=profile.pad,gridBottom=profile.barcode+profile.pad+2;
    win.document.write(`<!doctype html><html><head><meta charset="utf-8"><style>@page{size:${profile.w}mm ${profile.h}mm;margin:0}*{box-sizing:border-box}html,body{margin:0!important;padding:0!important;width:${profile.w}mm!important;height:${profile.h}mm!important;overflow:hidden!important;background:#fff;font-family:Arial,sans-serif}.label{position:relative;width:${profile.w}mm!important;height:${profile.h}mm!important;overflow:hidden!important;page-break-inside:avoid!important}.head{position:absolute;left:${profile.pad}mm;right:${profile.pad}mm;top:${profile.pad}mm;height:6mm;overflow:hidden;font-size:${profile.title}px;font-weight:900;line-height:1.1;border-bottom:.3mm solid #111;white-space:nowrap;text-overflow:ellipsis}.grid{position:absolute;left:${profile.pad}mm;right:${profile.pad}mm;top:${gridTop}mm;bottom:${gridBottom}mm;display:grid;grid-template-columns:1fr 1fr;grid-template-rows:repeat(3,1fr);overflow:hidden}.cell{min-width:0;min-height:0;padding:.7mm 1mm;border:.2mm solid #ddd;overflow:hidden}.cell small{display:block;font-size:7px;line-height:1.05;color:#555;white-space:nowrap}.cell strong{display:block;margin-top:.3mm;font-size:${profile.body}px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.barcode{position:absolute;left:${profile.pad}mm;right:${profile.pad}mm;bottom:${barcodeBottom}mm;height:${profile.barcode}mm!important;overflow:hidden!important;display:flex;align-items:center;justify-content:center}.barcode svg{display:block!important;width:100%!important;max-width:none!important;height:${profile.barcode}mm!important;max-height:none!important;overflow:visible!important}.barcode svg rect{shape-rendering:crispEdges}.no-barcode{font-size:10px;font-weight:700}@media print{html,body,.label{overflow:hidden!important}.label{page-break-after:avoid!important}}</style></head><body><div class="label"><div class="head">NAMO Chemical · ${esc(values['원료명'])}</div><div class="grid">${rows.map(([k,v])=>`<div class="cell"><small>${k}</small><strong>${esc(v)}</strong></div>`).join('')}</div><div class="barcode">${barcodeHtml}</div></div></body></html>`);
    win.document.close();win.focus();setTimeout(()=>{win.print();setTimeout(()=>win.close(),300);},450);
  }

  function fixTransactionDetailLayout(){document.querySelectorAll('.inv-tx-detail-sheet').forEach(sheet=>{const grid=sheet.querySelector('.inv-tx-detail-grid');if(!grid)return;let cells=Array.from(grid.children);['원료코드','용기당 중량'].forEach(label=>{const cell=cells.find(c=>clean(c.querySelector('dt')?.textContent)===label);if(cell)cell.remove();cells=Array.from(grid.children);});const packagingCell=cells.find(c=>clean(c.querySelector('dt')?.textContent)==='포장형태');if(packagingCell){const currentValue=clean(packagingCell.querySelector('dd')?.textContent);if(!currentValue||currentValue==='-'){const linked=pickPackaging(findIqcForDetail(sheet));if(linked)packagingCell.querySelector('dd').textContent=linked;}}cells=Array.from(grid.children);const barcodeCell=cells.find(c=>clean(c.querySelector('dt')?.textContent)==='바코드 발행수량');const directionCell=cells.find(c=>clean(c.querySelector('dt')?.textContent)==='이동 방향');if(barcodeCell&&directionCell){const value=clean(directionCell.querySelector('dd')?.textContent)||'-';barcodeCell.querySelector('dt').textContent='이동 방향';barcodeCell.querySelector('dd').textContent=value;barcodeCell.classList.remove('wide');directionCell.remove();}});document.querySelectorAll('.inv-tx-detail-actions .primary').forEach(button=>{if(/^바코드\s+\d+매\s+인쇄$/.test(clean(button.textContent)))button.textContent='바코드 인쇄';button.dataset.qmesAdaptivePrint='1';});}
  function installTransactionDetailLayoutFix(){fixTransactionDetailLayout();new MutationObserver(fixTransactionDetailLayout).observe(document.documentElement,{childList:true,subtree:true});document.addEventListener('click',event=>{const button=event.target.closest?.('.inv-tx-detail-actions .primary[data-qmes-adaptive-print="1"]');if(!button)return;const sheet=button.closest('.inv-tx-detail-sheet');if(!sheet)return;event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();adaptivePrintFromDetail(sheet);},true);}
  function restore(){inventorySession++;if(root){try{root.unmount();}catch(e){}root=null;}host?.remove();host=null;const main=document.querySelector('#root>div>main');if(main)Array.from(main.children).forEach(el=>{if(el.dataset.invHidden==='1'){el.style.removeProperty('display');delete el.dataset.invHidden;}});}
  function decorateSidebar(id){if(id!==inventorySession||!host)return;const side=document.getElementById('qmes-sync-sidebar');if(!side)return;const title=side.querySelector('.qmes-side-title'),wrap=side.querySelector('.qmes-side-items');if(title)title.textContent='재고관리';if(!wrap)return;wrap.replaceChildren();sections.forEach(([sid,label])=>{const b=document.createElement('button');b.type='button';b.className='qmes-side-item'+(current===sid?' is-active':'');b.dataset.inventorySection=sid;b.textContent=label;b.onclick=e=>{e.stopPropagation();open(sid);};wrap.appendChild(b);});}
  function inventoryComponent(){if(typeof window.InventoryEnterpriseTab==='function')return window.InventoryEnterpriseTab;try{if(typeof InventoryEnterpriseTab==='function')return InventoryEnterpriseTab;}catch(e){}return null;}
  function open(section='overview'){current=sections.some(s=>s[0]===section)?section:'overview';inventorySession++;const id=inventorySession;const main=document.querySelector('#root>div>main'),Component=inventoryComponent();if(!main||!Component)return;Array.from(main.children).forEach(el=>{if(el!==host){el.dataset.invHidden='1';el.style.setProperty('display','none','important');}});if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}if(root)root.unmount();root=ReactDOM.createRoot(host);root.render(React.createElement(Component,{section:current}));try{sessionStorage.setItem('qmes_inventory_section',current);}catch(e){}if(typeof window.qmesSetGlobalSidebarGroup==='function')window.qmesSetGlobalSidebarGroup('재고관리');setTimeout(()=>decorateSidebar(id),20);setTimeout(()=>decorateSidebar(id),180);}
  function install(){const nav=document.querySelector('.qmes-top-menu');if(!nav||nav.querySelector('[data-qmes-inventory-menu]'))return false;const item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qmesInventoryMenu='1';const button=document.createElement('button');button.type='button';button.className='qmes-top-menu-button';button.innerHTML='<span>▣</span><span>재고관리</span><span>›</span>';button.onclick=()=>{let saved='overview';try{saved=sessionStorage.getItem('qmes_inventory_section')||'overview';}catch(e){}open(saved);};item.appendChild(button);const trace=Array.from(nav.children).find(el=>clean(el.textContent).includes('LOT 추적'));if(trace)trace.after(item);else nav.appendChild(item);document.addEventListener('click',event=>{if(!host)return;const top=event.target.closest?.('.qmes-top-menu-button');if(top&&top!==button&&!top.closest('[data-qmes-inventory-menu]'))restore();const sub=event.target.closest?.('.qmes-submenu-button');if(sub)restore();},true);window.qmesOpenInventorySection=open;return true;}
  installInventoryTransactionFilter();installTransactionDetailLayoutFix();const timer=setInterval(()=>{if(install())clearInterval(timer);},250);setTimeout(()=>clearInterval(timer),15000);
})();
