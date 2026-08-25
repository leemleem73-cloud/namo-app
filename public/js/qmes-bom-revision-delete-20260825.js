(function(){
  if(window.__QMES_BOM_REVISION_DELETE__) return;
  window.__QMES_BOM_REVISION_DELETE__ = true;
  const KEY='qmes-bom-local-v1';
  const load=()=>{try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(a)?a:[]}catch(e){return[]}};
  const save=a=>localStorage.setItem(KEY,JSON.stringify(a));
  function refresh(){
    const host=document.getElementById('qmes-chemical-bom-v5-host');
    if(!host) return;
    const table=host.querySelector('#qbm-revs')?.closest('table');
    if(!table) return;
    const head=table.querySelector('thead tr');
    if(head && !head.querySelector('[data-qbm-delete-head]')){
      const th=document.createElement('th'); th.dataset.qbmDeleteHead='1'; th.textContent='관리'; head.appendChild(th);
    }
    const rows=[...host.querySelectorAll('#qbm-revs tr[data-id]')];
    rows.forEach(tr=>{
      if(tr.querySelector('[data-qbm-delete]')) return;
      const id=tr.dataset.id;
      const td=document.createElement('td');
      const btn=document.createElement('button');
      btn.type='button'; btn.dataset.qbmDelete=id; btn.textContent='삭제';
      btn.style.cssText='border:1px solid #ef4444;background:#fff;color:#dc2626;border-radius:6px;padding:4px 9px;font-size:11px;font-weight:800;cursor:pointer';
      btn.addEventListener('click',e=>{
        e.preventDefault(); e.stopPropagation();
        const list=load(); const target=list.find(x=>x.id===id); if(!target) return;
        if(target.status==='사용중'){
          alert('사용중 Master BOM은 삭제할 수 없습니다. 먼저 다른 Revision을 사용중으로 확정하거나 폐기 처리하세요.');
          return;
        }
        if(!confirm(`${target.productCode||''} ${target.revision||''} BOM을 삭제하시겠습니까?`)) return;
        save(list.filter(x=>x.id!==id));
        tr.remove();
        const prod=host.querySelector(`#qbm-products tr[data-id="${CSS.escape(id)}"]`); if(prod) prod.remove();
        const msg=host.querySelector('#qbm-msg'); if(msg){msg.textContent='선택한 BOM Revision을 삭제했습니다.';msg.style.color='#15803d';}
        if(!host.querySelector('#qbm-revs tr[data-id]')){
          const tbody=host.querySelector('#qbm-revs');
          if(tbody) tbody.innerHTML='<tr><td colspan="7" style="text-align:center;color:#94a3b8;padding:20px">저장된 Revision이 없습니다.</td></tr>';
        }
      });
      td.appendChild(btn); tr.appendChild(td);
    });
  }
  new MutationObserver(refresh).observe(document.documentElement,{childList:true,subtree:true});
  setInterval(refresh,700);
  setTimeout(refresh,200);
})();