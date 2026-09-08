(()=>{
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));
  async function getJson(url){
    const r=await fetch(url,{credentials:'same-origin',cache:'no-store'});
    const p=await r.json();
    if(!r.ok||p.success===false) throw new Error(p.message||'조회 실패');
    return p.data??p;
  }
  function role(u){return `${u?.title||''} ${u?.role||''}`.replace(/\s/g,'').toLowerCase()}
  function active(u){return !['REJECTED','INACTIVE','DISABLED','DELETED','WITHDRAWN'].includes(String(u?.status||'APPROVED').toUpperCase())}
  function execUser(u){const t=role(u);return /(전무|상무|이사|임원|cto|coo|cfo|chief)/.test(t)&&!/(대표이사|대표|사장|회장|ceo)/.test(t)}
  function managerUser(u){return /(부장|본부장|실장|센터장|팀장)/.test(role(u))&&!execUser(u)}
  async function renderReviewers(){
    const root=$('#reviewerCheckList');
    if(!root) return;
    let users=[];
    for(const url of ['/api/attendance/directory','/api/admin/users']){
      try{const d=await getJson(url);if(Array.isArray(d)&&d.length){users=d;break}}catch(e){}
    }
    const list=[...users.filter(u=>active(u)&&execUser(u)).slice(0,3),...users.filter(u=>active(u)&&managerUser(u)).slice(0,1)];
    if(!list.length) return;
    root.innerHTML=list.map(u=>`<label class="check-person"><input type="checkbox" class="reviewer-check stability-reviewer" value="${String(u.id)}"><span class="check-person-main"><span class="check-person-name">${String(u.name||'-')}</span><span class="check-person-meta">${String(u.department||'-')} · ${String(u.title||'-')}<br>${String(u.email||'이메일 미등록')}</span></span><span class="check-person-badge ${managerUser(u)?'manager':''}">${managerUser(u)?'부장':'임원'}</span></label>`).join('');
    $$('.stability-reviewer',root).forEach(chk=>chk.addEventListener('change',()=>{
      if(chk.checked) $$('.stability-reviewer',root).forEach(x=>{if(x!==chk)x.checked=false});
      const selected=$$('.stability-reviewer',root).find(x=>x.checked);
      const user=list.find(u=>String(u.id)===String(selected?.value));
      window.__NAMO_SELECTED_REVIEWER__=user||null;
      const preview=$('#reviewerPreview');
      if(preview) preview.textContent=user?`${user.name} · ${user.title||''} · ${user.email||''}`:'검토자를 선택해 주세요.';
    }));
  }
  function readyRecords(){
    $('.page[data-page="records"] .records')?.classList.add('namo-records-ready');
    $('.page[data-page="records"] .stat-grid')?.classList.add('namo-records-ready');
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('#openWizardBtn,#requestFab,#wizardNextBtn')) setTimeout(renderReviewers,120);
    if(e.target.closest('[data-page-target="records"]')) setTimeout(readyRecords,900);
  },true);
  setTimeout(renderReviewers,900);
  setTimeout(readyRecords,1500);
})();