/* Inventory menu bridge v3.2: stable mount + enterprise detail cleanup, 2026-08-21. */
(function(){
  let root=null,host=null,current='overview';
  const sections=[['overview','재고현황'],['movement','입출고 관리'],['lot','LOT별 재고'],['production','생산투입/완료'],['count','재고실사']];
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();
  const upper=v=>clean(v).toUpperCase();

  function iqcRows(){
    const db=window.DB||{};
    return [db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].find(Array.isArray)||[];
  }
  function getCell(sheet,label){
    return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid > div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;
  }
  function getValue(sheet,label){return clean(getCell(sheet,label)?.querySelector('dd')?.textContent)||'-';}
  function makeCell(label,value,wide){
    const div=document.createElement('div');if(wide)div.className='wide';
    const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value||'-';div.append(dt,dd);return div;
  }
  function findIqc(sheet){
    const doc=upper(getValue(sheet,'문서번호')).replace(/^IQC:/,'');
    const lot=upper(getValue(sheet,'LOT'));
    const name=upper(getValue(sheet,'원료명'));
    return iqcRows().find(row=>{
      const inNo=upper(row?.inNo||row?.in_no||row?.receiptNo||row?.receipt_no);
      const rowLot=upper(row?.lot||row?.lotNo||row?.lot_no);
      const rowName=upper(row?.name||row?.material||row?.item||row?.itemName||row?.item_name);
      return (doc&&inNo&&doc===inNo)||(lot&&rowLot===lot&&(!name||!rowName||name===rowName));
    })||null;
  }
  function packaging(row){
    if(!row)return'';
    const type=clean(row.packagingType||row.packaging_type||row.packageType||row.package_type||row.packType||row.pack_type||row.packingType||row.packing_type||row.containerType||row.container_type);
    const other=clean(row.packagingTypeOther||row.packaging_type_other||row.packageTypeOther||row.package_type_other);
    return type==='기타'&&other?`기타(${other})`:type;
  }
  function dateOnly(v){const s=clean(v);return /^\d{4}-\d{2}-\d{2}/.test(s)?s.slice(0,10):(s||'-');}
  function upgradeDetail(sheet){
    if(!sheet||sheet.dataset.qmesUpgraded==='1')return;
    const grid=sheet.querySelector('.inv-tx-detail-grid');if(!grid)return;
    const material=getValue(sheet,'원료명'),lot=getValue(sheet,'LOT'),type=getValue(sheet,'구분'),qty=getValue(sheet,'총 수량'),packageQty=getValue(sheet,'입고 포장수량'),direction=getValue(sheet,'이동 방향'),operator=getValue(sheet,'작업자'),remark=getValue(sheet,'비고');
    const iqc=findIqc(sheet);
    const pack=packaging(iqc)||getValue(sheet,'포장형태');
    const recv=dateOnly(iqc?.recv||iqc?.recvDate||iqc?.receivedAt||iqc?.inDate||iqc?.in_date);
    const inspect=dateOnly(iqc?.inspectedAt||iqc?.inspectDate||iqc?.inspectionDate||iqc?.examDate||iqc?.exam_date);
    grid.replaceChildren(
      makeCell('원료명',material),makeCell('구분',type),
      makeCell('LOT',lot),makeCell('포장형태',pack),
      makeCell('입고일자',recv),makeCell('검사일자',inspect),
      makeCell('총 수량',qty),makeCell('입고 포장수량',packageQty),
      makeCell('이동 방향',direction),makeCell('작업자',operator),
      makeCell('비고',remark,true)
    );
    const head=sheet.querySelector('.inv-tx-detail-head > div');
    if(head){const span=head.querySelector('span');if(span){span.innerHTML='<img src="/logo.png" alt="NAMO Chemical" style="display:block;height:30px;max-width:250px;object-fit:contain;object-position:left center">';span.style.display='block';}const h3=head.querySelector('h3');if(h3)h3.textContent='입출고 처리 상세';}
    const barcode=sheet.querySelector('.inv-tx-barcode svg');if(barcode){barcode.style.setProperty('height','108px','important');barcode.style.setProperty('width','100%','important');}
    const title=sheet.querySelector('.inv-tx-barcode > div > span');if(title)title.textContent='ERP 연동용 CODE128';
    const print=sheet.querySelector('.inv-tx-detail-actions .primary');if(print)print.textContent='바코드 인쇄';
    sheet.dataset.qmesUpgraded='1';
  }
  function installDetailUpgrade(){
    document.querySelectorAll('.inv-tx-detail-sheet').forEach(upgradeDetail);
    new MutationObserver(()=>document.querySelectorAll('.inv-tx-detail-sheet').forEach(upgradeDetail)).observe(document.documentElement,{childList:true,subtree:true});
  }

  function restore(){if(root){try{root.unmount();}catch(e){}root=null;}host?.remove();host=null;const main=document.querySelector('#root>div>main');if(main)Array.from(main.children).forEach(el=>{if(el.dataset.invHidden==='1'){el.style.removeProperty('display');delete el.dataset.invHidden;}});}
  function decorateSidebar(){const side=document.getElementById('qmes-sync-sidebar');if(!side)return;const title=side.querySelector('.qmes-side-title'),wrap=side.querySelector('.qmes-side-items');if(title)title.textContent='재고관리';if(!wrap)return;wrap.replaceChildren();sections.forEach(([id,label])=>{const b=document.createElement('button');b.type='button';b.className='qmes-side-item'+(current===id?' is-active':'');b.textContent=label;b.addEventListener('click',event=>{event.stopPropagation();open(id);});wrap.appendChild(b);});}
  function inventoryComponent(){if(typeof window.InventoryEnterpriseTab==='function')return window.InventoryEnterpriseTab;try{if(typeof InventoryEnterpriseTab==='function')return InventoryEnterpriseTab;}catch(e){}return null;}
  function open(section='overview'){
    current=sections.some(s=>s[0]===section)?section:'overview';
    const main=document.querySelector('#root>div>main'),Component=inventoryComponent();
    if(!main||!Component){console.error('[QMES inventory] InventoryEnterpriseTab is not ready.');return;}
    Array.from(main.children).forEach(el=>{if(el!==host){el.dataset.invHidden='1';el.style.setProperty('display','none','important');}});
    if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}
    if(root){try{root.unmount();}catch(e){}root=null;}
    host.replaceChildren();root=ReactDOM.createRoot(host);root.render(React.createElement(Component,{section:current}));
    document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.toggle('is-active',clean(b.textContent)==='재고관리'));
    try{sessionStorage.setItem('qmes_inventory_section',current);}catch(e){}
    if(typeof window.qmesSetGlobalSidebarGroup==='function')window.qmesSetGlobalSidebarGroup('재고관리');setTimeout(decorateSidebar,20);setTimeout(decorateSidebar,180);
  }
  function install(){
    const nav=document.querySelector('.qmes-top-menu');if(!nav||nav.querySelector('[data-qmes-inventory-menu]'))return false;
    const item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qmesInventoryMenu='1';
    const button=document.createElement('button');button.type='button';button.className='qmes-top-menu-button';button.innerHTML='<span aria-hidden="true" style="font-size:15px">▣</span><span>재고관리</span><span style="font-size:11px">›</span>';
    button.addEventListener('click',()=>{let saved='overview';try{saved=sessionStorage.getItem('qmes_inventory_section')||'overview';}catch(e){}open(saved);});item.appendChild(button);
    const trace=Array.from(nav.children).find(el=>clean(el.textContent).includes('LOT 추적'));if(trace)trace.after(item);else nav.appendChild(item);
    document.addEventListener('click',event=>{const top=event.target.closest?.('.qmes-top-menu-button');if(top&&top!==button&&!top.closest('[data-qmes-inventory-menu]')&&host)restore();},true);
    window.qmesOpenInventorySection=open;return true;
  }
  document.addEventListener('click',event=>{const detail=event.target.closest?.('.inv-tx-detail-link');if(detail)event.stopPropagation();},false);
  installDetailUpgrade();
  const timer=setInterval(()=>{if(install())clearInterval(timer);},250);setTimeout(()=>clearInterval(timer),15000);
})();
