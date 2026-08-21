/* Inventory movement list cleanup: remove manual transaction button, add sequence and pagination. */
(function(){
  'use strict';
  if(window.__QMES_INV_MOVEMENT_LIST_CLEAN_20260821__)return;
  window.__QMES_INV_MOVEMENT_LIST_CLEAN_20260821__=true;

  const PAGE_SIZE=20;
  let page=1;
  let scheduled=false;

  function clean(v){return String(v??'').replace(/\s+/g,' ').trim();}

  function ensureStyle(){
    if(document.getElementById('qmes-inv-movement-clean-style'))return;
    const style=document.createElement('style');
    style.id='qmes-inv-movement-clean-style';
    style.textContent=`
      .inv-movement-table .qmes-inv-seq{width:64px!important;text-align:center!important;white-space:nowrap!important}
      .qmes-inv-pager{display:flex;align-items:center;justify-content:center;gap:8px;padding:16px 8px 4px}
      .qmes-inv-pager button{min-width:38px;height:34px;border:1px solid #cbd5e1;border-radius:7px;background:#fff;color:#334155;font-weight:800;cursor:pointer}
      .qmes-inv-pager button.is-active{background:#0ea5e9;border-color:#0ea5e9;color:#fff}
      .qmes-inv-pager button:disabled{opacity:.4;cursor:default}
      .qmes-inv-pager .qmes-inv-page-info{margin-left:8px;color:#64748b;font-size:12px;font-weight:700}
    `;
    document.head.appendChild(style);
  }

  function removeTransactionButton(host){
    const actions=host.querySelector('.inv-title-row .inv-actions');
    if(!actions)return;
    Array.from(actions.querySelectorAll('button')).forEach(button=>{
      const text=clean(button.textContent);
      if(text==='입출고 처리'||text==='입출고처리')button.remove();
    });
  }

  function installSequence(table,rows){
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

  function renderPager(panel,rows){
    const total=rows.length;
    const pages=Math.max(1,Math.ceil(total/PAGE_SIZE));
    page=Math.min(Math.max(1,page),pages);
    rows.forEach((row,index)=>{
      const visible=index>=(page-1)*PAGE_SIZE&&index<page*PAGE_SIZE;
      row.style.display=visible?'':'none';
    });

    let pager=panel.querySelector('.qmes-inv-pager');
    if(!pager){pager=document.createElement('div');pager.className='qmes-inv-pager';panel.appendChild(pager);}
    pager.replaceChildren();

    const add=(label,target,disabled=false,active=false)=>{
      const b=document.createElement('button');b.type='button';b.textContent=label;b.disabled=disabled;if(active)b.classList.add('is-active');
      b.addEventListener('click',()=>{page=target;apply();});pager.appendChild(b);
    };
    add('‹',page-1,page===1);
    const start=Math.max(1,Math.min(page-2,pages-4));
    const end=Math.min(pages,start+4);
    for(let p=start;p<=end;p++)add(String(p),p,false,p===page);
    add('›',page+1,page===pages);
    const info=document.createElement('span');info.className='qmes-inv-page-info';info.textContent=`총 ${total}건 · 페이지당 ${PAGE_SIZE}건`;pager.appendChild(info);
  }

  function apply(){
    ensureStyle();
    const host=document.getElementById('qmes-inventory-host');
    if(!host)return;
    const title=clean(host.querySelector('.inv-title-row h2')?.textContent);
    if(!title.includes('입출고 관리'))return;
    removeTransactionButton(host);
    const panel=host.querySelector('.inv-movement-panel');
    const table=panel?.querySelector('.inv-movement-table');
    const body=table?.querySelector('tbody');
    if(!panel||!table||!body)return;
    const rows=Array.from(body.children).filter(node=>node.tagName==='TR');
    installSequence(table,rows);
    renderPager(panel,rows);
  }

  function schedule(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;apply();});}
  new MutationObserver(schedule).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('qmes:inventory-auto-linked',schedule);
  schedule();
})();