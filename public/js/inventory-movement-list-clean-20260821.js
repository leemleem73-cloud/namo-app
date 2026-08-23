/* Inventory table alignment v12: consistent headers and row fields across inventory sections. */
(function(){
  'use strict';
  if(window.__QMES_INV_TABLE_ALIGNMENT_V12_20260824__)return;
  window.__QMES_INV_TABLE_ALIGNMENT_V12_20260824__=true;

  const PAGE_SIZE=20;
  let page=1;
  let timer=0;
  let lastTable=null;

  const clean=v=>String(v??'').replace(/\s+/g,' ').trim();

  function ensureStyle(){
    let style=document.getElementById('qmes-inv-table-alignment-style-v12');
    if(style)return;
    style=document.createElement('style');
    style.id='qmes-inv-table-alignment-style-v12';
    style.textContent=`
      #qmes-inventory-host .inv-movement-panel{overflow-x:hidden!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table{width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table col{width:12.5%!important;min-width:0!important;max-width:none!important}
      #qmes-inventory-host .inv-movement-table thead th{height:42px!important;padding:8px 16px 8px 8px!important;line-height:1.3!important;letter-spacing:0!important;vertical-align:middle!important;border-bottom:1px solid #cbd5e1!important}
      #qmes-inventory-host .inv-movement-table tbody td{height:44px!important;padding:8px 16px 8px 8px!important;line-height:1.3!important;letter-spacing:0!important;vertical-align:middle!important;border-bottom:1px solid #e2e8f0!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table th,#qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table td{box-sizing:border-box!important;text-align:center!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #qmes-inventory-host .inv-shell table.inv-stock-table.inv-movement-table .inv-tx-detail-link{text-align:center!important}
      #qmes-inventory-host .inv-movement-table th.qmes-inv-seq,#qmes-inventory-host .inv-movement-table td.qmes-inv-seq{text-align:center!important}
      #qmes-inventory-host .inv-movement-table input,#qmes-inventory-host .inv-movement-table select,#qmes-inventory-host .inv-movement-table textarea{width:100%!important;max-width:100%!important;margin:0!important;box-sizing:border-box!important}
      #qmes-inventory-host .inv-movement-table td:nth-child(6){font-variant-numeric:tabular-nums}

      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table{width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important}
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table col{width:11.111111%!important;min-width:0!important;max-width:none!important}

      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table{width:100%!important;min-width:0!important;table-layout:fixed!important;border-collapse:collapse!important}
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table:not(.inv-movement-table) th{width:16.666667%!important}
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table.inv-movement-table col{width:14.285714%!important;min-width:0!important;max-width:none!important}
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table th{width:12.5%!important}

      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table th,
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table td,
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-shell table.inv-stock-table td.num,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table th,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table td,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table td.num,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table th,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table td,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table td.num{box-sizing:border-box!important;height:44px!important;padding:8px 10px!important;line-height:1.3!important;text-align:center!important;vertical-align:middle!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-stock-table input,
      #qmes-inventory-host[data-qmes-inventory-section="lot"] .inv-stock-table select,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table input,
      #qmes-inventory-host[data-qmes-inventory-section="production"] .inv-panel table select,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table input,
      #qmes-inventory-host[data-qmes-inventory-section="count"] .inv-panel table select{width:100%!important;max-width:100%!important;margin:0!important;box-sizing:border-box!important;text-align:center!important}

      #qmes-inventory-host .inv-tx-detail-link{display:block!important;width:100%!important;text-align:left!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important;line-height:1.35!important}
      #qmes-inventory-host .qmes-inv-pager{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px 8px 4px}
      #qmes-inventory-host .qmes-inv-pager button{min-width:38px;height:34px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;font-weight:800;cursor:pointer}
      #qmes-inventory-host .qmes-inv-pager button.is-active{background:#0ea5e9;border-color:#0ea5e9;color:#fff}
      #qmes-inventory-host .qmes-inv-pager button:disabled{opacity:.4;cursor:default}
      #qmes-inventory-host .qmes-inv-pager .qmes-inv-page-info{margin-left:8px;color:#64748b;font-size:12px;font-weight:700}
    `;
    document.head.appendChild(style);
  }

  function removeTransactionButton(host){
    host.querySelectorAll('.inv-actions button').forEach(button=>{
      const text=clean(button.textContent);
      if(text==='입출고 처리'||text==='입출고처리')button.remove();
    });
  }

  function ensureColgroup(table){
    let colgroup=table.querySelector(':scope > colgroup');
    if(!colgroup){colgroup=document.createElement('colgroup');table.prepend(colgroup);}
    while(colgroup.children.length<8)colgroup.appendChild(document.createElement('col'));
    while(colgroup.children.length>8)colgroup.lastElementChild.remove();
  }

  function ensureSequence(table,rows){
    ensureColgroup(table);
    const head=table.querySelector('thead tr');
    if(head&&!head.querySelector('.qmes-inv-seq')){
      const th=document.createElement('th');
      th.className='qmes-inv-seq';
      th.textContent='순번';
      head.prepend(th);
    }
    rows.forEach((row,index)=>{
      let td=row.querySelector(':scope > .qmes-inv-seq');
      if(!td){td=document.createElement('td');td.className='qmes-inv-seq';row.prepend(td);}
      td.textContent=String(index+1);
    });
  }

  function pagerMarkup(total,pages){
    const start=Math.max(1,Math.min(page-2,Math.max(1,pages-4)));
    const end=Math.min(pages,start+4);
    let html=`<button type="button" data-qmes-page="${Math.max(1,page-1)}" ${page===1?'disabled':''}>‹</button>`;
    for(let p=start;p<=end;p++)html+=`<button type="button" data-qmes-page="${p}" class="${p===page?'is-active':''}">${p}</button>`;
    html+=`<button type="button" data-qmes-page="${Math.min(pages,page+1)}" ${page===pages?'disabled':''}>›</button>`;
    html+=`<span class="qmes-inv-page-info">총 ${total}건 · 페이지당 ${PAGE_SIZE}건</span>`;
    return html;
  }

  function render(){
    ensureStyle();
    const host=document.getElementById('qmes-inventory-host');
    if(!host)return;
    const title=clean(host.querySelector('.inv-title-row h2')?.textContent);
    const section=title.includes('입출고 관리')?'movement':title.includes('LOT별 재고')?'lot':title.includes('생산투입/완료')?'production':title.includes('재고실사')?'count':'';
    if(section)host.dataset.qmesInventorySection=section;
    else delete host.dataset.qmesInventorySection;
    if(section!=='movement')return;
    removeTransactionButton(host);

    const panel=host.querySelector('.inv-movement-panel');
    const table=panel?.querySelector('.inv-movement-table');
    const body=table?.querySelector('tbody');
    if(!panel||!table||!body)return;

    if(lastTable!==table){page=1;lastTable=table;}
    const rows=Array.from(body.children).filter(node=>node.tagName==='TR');
    ensureSequence(table,rows);
    const pages=Math.max(1,Math.ceil(rows.length/PAGE_SIZE));
    page=Math.min(Math.max(1,page),pages);
    rows.forEach((row,index)=>{row.hidden=!(index>=(page-1)*PAGE_SIZE&&index<page*PAGE_SIZE);});

    let pager=panel.querySelector('.qmes-inv-pager');
    if(!pager){pager=document.createElement('div');pager.className='qmes-inv-pager';panel.appendChild(pager);}
    const nextHtml=pagerMarkup(rows.length,pages);
    if(pager.innerHTML!==nextHtml)pager.innerHTML=nextHtml;
  }

  function schedule(){clearTimeout(timer);timer=setTimeout(render,40);}

  document.addEventListener('click',event=>{
    const button=event.target.closest?.('[data-qmes-page]');
    if(!button)return;
    const host=button.closest('#qmes-inventory-host');
    if(!host)return;
    event.preventDefault();
    event.stopPropagation();
    const next=Number(button.dataset.qmesPage);
    if(Number.isInteger(next)&&next>0){page=next;render();}
  },true);

  const observer=new MutationObserver(mutations=>{
    let relevant=false;
    for(const mutation of mutations){
      for(const node of mutation.addedNodes){
        if(node.nodeType!==1)continue;
        if(node.matches?.('.inv-shell,.inv-movement-table,.inv-title-row')||node.querySelector?.('.inv-movement-table,.inv-title-row')){relevant=true;break;}
      }
      if(relevant)break;
    }
    if(relevant)schedule();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('qmes:inventory-auto-linked',schedule);
  schedule();
})();