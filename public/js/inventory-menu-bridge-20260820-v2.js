/* Inventory menu bridge v5.2: restore normal menus, hide orphan IQC receipts, and fix transaction detail layout, 2026-08-21. */
(function(){
  let root=null,host=null,current='overview',inventorySession=0;
  const sections=[['overview','재고현황'],['movement','입출고 관리'],['lot','LOT별 재고'],['production','생산투입/완료'],['count','재고실사']];
  const clean=v=>String(v||'').replace(/\s+/g,' ').trim();

  function activeIqcRefs(){
    const db=window.DB||{};
    const rows=Array.isArray(db.iqc)?db.iqc:[];
    return new Set(rows.map(row=>{
      const key=clean(row?.inNo||row?.in_no||row?.lot||row?.lotNo).toUpperCase();
      return key?`IQC:${key}`:'';
    }).filter(Boolean));
  }

  function installInventoryTransactionFilter(){
    if(window.__QMES_INV_IQC_TX_FILTER_V1__)return;
    window.__QMES_INV_IQC_TX_FILTER_V1__=true;
    const originalFetch=window.fetch.bind(window);
    window.fetch=async function(input,init){
      const response=await originalFetch(input,init);
      try{
        const url=typeof input==='string'?input:String(input?.url||'');
        const method=String(init?.method||input?.method||'GET').toUpperCase();
        if(method!=='GET'||!url.includes('/api/inventory/transactions'))return response;
        const clone=response.clone();
        const payload=await clone.json();
        if(!payload||payload.success!==true||!Array.isArray(payload.data))return response;
        const refs=activeIqcRefs();
        const filtered=payload.data.filter(tx=>{
          const ref=clean(tx?.reference_no||tx?.referenceNo).toUpperCase();
          return !ref.startsWith('IQC:')||refs.has(ref);
        });
        const headers=new Headers(response.headers);
        headers.set('content-type','application/json; charset=utf-8');
        return new Response(JSON.stringify({...payload,data:filtered}),{status:response.status,statusText:response.statusText,headers});
      }catch(error){
        console.warn('[QMES inventory] IQC orphan transaction filter failed:',error);
        return response;
      }
    };
  }

  function fixTransactionDetailLayout(){
    document.querySelectorAll('.inv-tx-detail-grid').forEach(grid=>{
      const cells=Array.from(grid.children);
      const barcodeCell=cells.find(cell=>clean(cell.querySelector('dt')?.textContent)==='바코드 발행수량');
      const directionCell=cells.find(cell=>clean(cell.querySelector('dt')?.textContent)==='이동 방향');
      if(barcodeCell&&directionCell&&barcodeCell.dataset.qmesDirectionMoved!=='1'){
        const directionValue=clean(directionCell.querySelector('dd')?.textContent)||'-';
        const dt=barcodeCell.querySelector('dt');
        const dd=barcodeCell.querySelector('dd');
        if(dt)dt.textContent='이동 방향';
        if(dd)dd.textContent=directionValue;
        barcodeCell.dataset.qmesDirectionMoved='1';
        barcodeCell.classList.remove('wide');
        directionCell.remove();
      }
    });
    document.querySelectorAll('.inv-tx-detail-actions .primary').forEach(button=>{
      if(/^바코드\s+\d+매\s+인쇄$/.test(clean(button.textContent)))button.textContent='바코드 인쇄';
    });
  }

  function installTransactionDetailLayoutFix(){
    fixTransactionDetailLayout();
    new MutationObserver(()=>fixTransactionDetailLayout()).observe(document.documentElement,{childList:true,subtree:true});
  }

  function restore(){
    inventorySession+=1;
    if(root){try{root.unmount();}catch(e){}root=null;}
    host?.remove();host=null;
    const main=document.querySelector('#root>div>main');
    if(main)Array.from(main.children).forEach(el=>{if(el.dataset.invHidden==='1'){el.style.removeProperty('display');delete el.dataset.invHidden;}});
  }

  function decorateSidebar(sessionId){
    if(sessionId!==inventorySession||!host)return;
    const side=document.getElementById('qmes-sync-sidebar');if(!side)return;
    const title=side.querySelector('.qmes-side-title'),wrap=side.querySelector('.qmes-side-items');
    if(title)title.textContent='재고관리';if(!wrap)return;
    wrap.replaceChildren();
    sections.forEach(([id,label])=>{
      const b=document.createElement('button');b.type='button';
      b.className='qmes-side-item'+(current===id?' is-active':'');
      b.dataset.inventorySection=id;
      b.textContent=label;
      b.addEventListener('click',event=>{event.stopPropagation();open(id);});
      wrap.appendChild(b);
    });
  }

  function inventoryComponent(){
    if(typeof window.InventoryEnterpriseTab==='function')return window.InventoryEnterpriseTab;
    try{if(typeof InventoryEnterpriseTab==='function')return InventoryEnterpriseTab;}catch(e){}
    return null;
  }

  function open(section='overview'){
    current=sections.some(s=>s[0]===section)?section:'overview';
    inventorySession+=1;const sessionId=inventorySession;
    const main=document.querySelector('#root>div>main');
    const Component=inventoryComponent();
    if(!main||!Component){console.error('[QMES inventory] InventoryEnterpriseTab is not ready.');return;}
    Array.from(main.children).forEach(el=>{if(el!==host){el.dataset.invHidden='1';el.style.setProperty('display','none','important');}});
    if(!host){host=document.createElement('div');host.id='qmes-inventory-host';main.appendChild(host);}
    if(root)root.unmount();root=ReactDOM.createRoot(host);root.render(React.createElement(Component,{section:current}));
    document.querySelectorAll('.qmes-top-menu-button').forEach(b=>b.classList.toggle('is-active',clean(b.textContent)==='재고관리'));
    try{sessionStorage.setItem('qmes_inventory_section',current);}catch(e){}
    if(typeof window.qmesSetGlobalSidebarGroup==='function')window.qmesSetGlobalSidebarGroup('재고관리');
    setTimeout(()=>decorateSidebar(sessionId),20);
    setTimeout(()=>decorateSidebar(sessionId),180);
  }

  function install(){
    const nav=document.querySelector('.qmes-top-menu');if(!nav||nav.querySelector('[data-qmes-inventory-menu]'))return false;
    const item=document.createElement('div');item.className='qmes-top-menu-item';item.dataset.qmesInventoryMenu='1';
    const button=document.createElement('button');button.type='button';button.className='qmes-top-menu-button';button.innerHTML='<span aria-hidden="true" style="font-size:15px">▣</span><span>재고관리</span><span style="font-size:11px">›</span>';
    button.addEventListener('click',()=>{let saved='overview';try{saved=sessionStorage.getItem('qmes_inventory_section')||'overview';}catch(e){}open(saved);});item.appendChild(button);
    const trace=Array.from(nav.children).find(el=>clean(el.textContent).includes('LOT 추적'));if(trace)trace.after(item);else nav.appendChild(item);

    document.addEventListener('click',event=>{
      if(!host)return;
      const target=event.target;
      const top=target.closest?.('.qmes-top-menu-button');
      if(top&&top!==button&&!top.closest('[data-qmes-inventory-menu]')){restore();return;}
      const sub=target.closest?.('.qmes-submenu-button');
      if(sub){restore();return;}
      const sideItem=target.closest?.('#qmes-sync-sidebar .qmes-side-item');
      if(sideItem&&!sideItem.dataset.inventorySection){restore();}
    },true);

    window.qmesOpenInventorySection=open;return true;
  }

  installInventoryTransactionFilter();
  installTransactionDetailLayoutFix();
  const timer=setInterval(()=>{if(install())clearInterval(timer);},250);setTimeout(()=>clearInterval(timer),15000);
})();
