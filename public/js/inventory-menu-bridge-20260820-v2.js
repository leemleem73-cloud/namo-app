/* Inventory menu bridge v5.3: restore normal menus, hide orphan IQC receipts, fix transaction detail layout, adaptive label printing, 2026-08-21. */
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

  function getDetailValue(sheet,label){
    const cell=Array.from(sheet.querySelectorAll('.inv-tx-detail-grid > div')).find(node=>clean(node.querySelector('dt')?.textContent)===label);
    return clean(cell?.querySelector('dd')?.textContent)||'-';
  }

  function labelProfile(packaging){
    const p=clean(packaging).toLowerCase();
    if(/드럼|drum|ibc|tote|탱크/.test(p))return {name:'대형',w:100,h:70,barcode:22,title:15,body:10,pad:5};
    if(/말통|pail|캔|can|통|bucket/.test(p))return {name:'중형',w:80,h:60,barcode:19,title:13,body:9,pad:4};
    if(/포대|bag|sack|봉투|파우치|pouch|박스|box|carton/.test(p))return {name:'중형',w:90,h:60,barcode:19,title:13,body:9,pad:4};
    if(/병|bottle|소형|vial/.test(p))return {name:'소형',w:70,h:50,barcode:16,title:11,body:8,pad:3.5};
    return {name:'기본',w:80,h:60,barcode:19,title:13,body:9,pad:4};
  }

  function adaptivePrintFromDetail(sheet){
    const packaging=getDetailValue(sheet,'포장형태');
    const profile=labelProfile(packaging);
    const values={
      '문서번호':getDetailValue(sheet,'문서번호'),
      '구분':getDetailValue(sheet,'구분'),
      '원료명':getDetailValue(sheet,'원료명'),
      '원료코드':getDetailValue(sheet,'원료코드'),
      'LOT':getDetailValue(sheet,'LOT'),
      '총 수량':getDetailValue(sheet,'총 수량'),
      '포장형태':packaging,
      '입고 포장수량':getDetailValue(sheet,'입고 포장수량'),
      '용기당 중량':getDetailValue(sheet,'용기당 중량'),
      '이동 방향':getDetailValue(sheet,'이동 방향'),
      '작업자':getDetailValue(sheet,'작업자'),
      '비고':getDetailValue(sheet,'비고')
    };
    const barcode=sheet.querySelector('.inv-tx-barcode svg');
    const barcodeHtml=barcode?barcode.outerHTML:'<div class="no-barcode">BARCODE</div>';
    const win=window.open('','_blank','width=900,height=760');
    if(!win)return;
    const doc=win.document;
    const rows=[['원료명',values['원료명']],['LOT',values['LOT']],['수량',values['총 수량']],['포장',values['포장형태']],['이동',values['이동 방향']],['문서',values['문서번호']]];
    doc.open();
    doc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${values['원료명']} ${values['LOT']} 바코드</title><style>
      @page{size:${profile.w}mm ${profile.h}mm;margin:0}
      *{box-sizing:border-box}html,body{margin:0;padding:0;width:${profile.w}mm;height:${profile.h}mm;font-family:Arial,"Noto Sans KR",sans-serif;color:#0f172a;background:#fff}
      .label{width:${profile.w}mm;height:${profile.h}mm;padding:${profile.pad}mm;overflow:hidden;display:flex;flex-direction:column;gap:2.1mm}
      .head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:.35mm solid #0f172a;padding-bottom:1.6mm}
      .brand{font-weight:900;font-size:${profile.title}px;line-height:1.05}.size{font-size:${Math.max(8,profile.body-1)}px;font-weight:800;color:#475569;text-align:right}
      .grid{display:grid;grid-template-columns:1fr 1fr;border:.25mm solid #cbd5e1;border-radius:2mm;overflow:hidden;flex:1 1 auto;min-height:0}
      .cell{padding:1.3mm 1.7mm;border-right:.2mm solid #e2e8f0;border-bottom:.2mm solid #e2e8f0;min-height:0;overflow:hidden}.cell:nth-child(2n){border-right:0}.cell:nth-last-child(-n+2){border-bottom:0}
      .cell small{display:block;font-size:${Math.max(6,profile.body-2)}px;color:#64748b;font-weight:800;margin-bottom:.4mm;white-space:nowrap}.cell strong{display:block;font-size:${profile.body}px;line-height:1.05;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
      .barcode{border:.25mm dashed #94a3b8;border-radius:2mm;padding:1.2mm 1.6mm;text-align:center;flex:0 0 auto}.barcode b{display:block;font-size:${Math.max(7,profile.body-1)}px;margin-bottom:.7mm}.barcode svg{width:100%!important;height:${profile.barcode}mm!important;max-width:100%!important}.barcode text{font-size:${Math.max(8,profile.body-1)}px!important}.no-barcode{height:${profile.barcode}mm;display:flex;align-items:center;justify-content:center;font-weight:900}
      .foot{font-size:${Math.max(6,profile.body-2)}px;color:#64748b;text-align:right;white-space:nowrap}
      @media print{html,body{width:${profile.w}mm;height:${profile.h}mm}.label{page-break-after:always}}
    </style></head><body><section class="label"><div class="head"><div class="brand">NAMO Chemical<br>${values['원료명']}</div><div class="size">${profile.name} 라벨<br>${profile.w}×${profile.h} mm</div></div><div class="grid">${rows.map(([k,v])=>`<div class="cell"><small>${k}</small><strong>${String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}</strong></div>`).join('')}</div><div class="barcode"><b>원료·LOT·위치 CODE128</b>${barcodeHtml}</div><div class="foot">ERP 연동용 · ${new Date().toLocaleString('ko-KR')}</div></section></body></html>`);
    doc.close();
    win.focus();
    setTimeout(()=>{win.print();win.close();},300);
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
      button.dataset.qmesAdaptivePrint='1';
    });
  }

  function installTransactionDetailLayoutFix(){
    fixTransactionDetailLayout();
    new MutationObserver(()=>fixTransactionDetailLayout()).observe(document.documentElement,{childList:true,subtree:true});
    document.addEventListener('click',event=>{
      const button=event.target.closest?.('.inv-tx-detail-actions .primary[data-qmes-adaptive-print="1"]');
      if(!button)return;
      const sheet=button.closest('.inv-tx-detail-sheet');
      if(!sheet)return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      adaptivePrintFromDetail(sheet);
    },true);
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
