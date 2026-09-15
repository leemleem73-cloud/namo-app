/* NAMO QMES - employee access permission visibility + email alignment fix (2026-09-15)
 * Admin > employee registration status
 * - Center-align the email column.
 * - Guarantee a per-employee access permission button for every non-admin employee.
 * - Reuse the existing QMES access-permission modal/API.
 */
(function(){
  'use strict';
  if(window.__QMES_MEMBER_ACCESS_VISIBILITY_FIX_20260915__) return;
  window.__QMES_MEMBER_ACCESS_VISIBILITY_FIX_20260915__=true;

  const STYLE_ID='qmes-member-access-visibility-fix-style-20260915';
  const ACCESS_SRC='./js/qmes-access-permissions-20260910.js?v=20260915-2';
  const ACCESS_LOADER='qmes-member-access-permission-runtime-loader-20260915';
  const clean=value=>String(value==null?'':value).replace(/\s+/g,' ').trim();
  let scheduled=false;
  let accessLoadPromise=null;

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      /* Current member table columns: UID, name, department, title, phone, email, role, status, actions. */
      html body #root .qmes-db-member-table thead th:nth-child(6),
      html body #root .qmes-db-member-table tbody td:nth-child(6){
        text-align:center!important;
      }
      html body #root .qmes-db-member-table tbody td:nth-child(6){
        vertical-align:middle!important;
      }
      html body #root .qmes-db-member-table{
        min-width:1360px!important;
      }
      html body #root .qmes-db-member-row-actions{
        display:flex!important;
        align-items:center!important;
        gap:6px!important;
        flex-wrap:nowrap!important;
      }
      html body #root .qmes-db-member-row-actions .qmes-access-trigger,
      html body #root .qmes-db-member-row-actions .qmes-member-direct-access{
        display:inline-flex!important;
        align-items:center!important;
        justify-content:center!important;
        height:34px!important;
        min-width:104px!important;
        padding:0 11px!important;
        border:1px solid #6fb8d8!important;
        border-radius:6px!important;
        background:#eef9fd!important;
        color:#08719c!important;
        -webkit-text-fill-color:#08719c!important;
        font-size:12px!important;
        font-weight:850!important;
        line-height:1!important;
        white-space:nowrap!important;
        cursor:pointer!important;
        opacity:1!important;
        visibility:visible!important;
      }
      html body #root .qmes-db-member-row-actions .qmes-access-trigger:hover,
      html body #root .qmes-db-member-row-actions .qmes-member-direct-access:hover{
        border-color:#269dce!important;
        background:#e0f4fc!important;
      }
    `;
    document.head.appendChild(style);
  }

  function loadAccessModule(){
    if(typeof window.qmesOpenAccessPermission==='function') return Promise.resolve(true);
    if(accessLoadPromise) return accessLoadPromise;

    accessLoadPromise=new Promise(resolve=>{
      let script=document.querySelector(`script[data-qmes-loader="${ACCESS_LOADER}"]`);
      if(!script){
        script=document.createElement('script');
        script.src=ACCESS_SRC;
        script.async=false;
        script.dataset.qmesLoader=ACCESS_LOADER;
        document.head.appendChild(script);
      }

      let tries=0;
      const check=()=>{
        if(typeof window.qmesOpenAccessPermission==='function'){
          resolve(true);
          return;
        }
        tries+=1;
        if(tries>=50){
          resolve(false);
          return;
        }
        setTimeout(check,100);
      };
      script.addEventListener('load',()=>setTimeout(check,0),{once:true});
      script.addEventListener('error',()=>resolve(false),{once:true});
      check();
    });
    return accessLoadPromise;
  }

  async function openPermission(name){
    const employeeName=clean(name);
    if(!employeeName) return;
    const loaded=await loadAccessModule();
    if(!loaded||typeof window.qmesOpenAccessPermission!=='function'){
      alert('접근권한 설정 모듈을 불러오지 못했습니다. 새로고침 후 다시 시도해 주세요.');
      return;
    }
    window.qmesOpenAccessPermission({name:employeeName});
  }

  function headerIndexes(table){
    const headers=Array.from(table.querySelectorAll('thead th')).map(th=>clean(th.textContent));
    return {
      name:headers.findIndex(text=>text==='로그인 ID·이름'||text==='이름'||text.includes('로그인 ID')),
      email:headers.findIndex(text=>text==='이메일'),
      role:headers.findIndex(text=>text==='권한'||text==='계정등급'),
      actions:headers.findIndex(text=>text==='관리')
    };
  }

  function patchTable(){
    ensureStyle();
    const table=document.querySelector('.qmes-db-member-table');
    if(!table) return;

    const indexes=headerIndexes(table);
    if(indexes.email>=0){
      const header=table.querySelectorAll('thead th')[indexes.email];
      if(header) header.style.setProperty('text-align','center','important');
    }

    table.querySelectorAll('tbody tr').forEach(row=>{
      const cells=Array.from(row.querySelectorAll(':scope > td'));
      if(!cells.length) return;

      const nameCell=indexes.name>=0?cells[indexes.name]:cells[1];
      const emailCell=indexes.email>=0?cells[indexes.email]:cells[5];
      const roleCell=indexes.role>=0?cells[indexes.role]:cells[6];
      const actionsCell=indexes.actions>=0?cells[indexes.actions]:cells[cells.length-1];
      const actions=actionsCell?.querySelector('.qmes-db-member-row-actions');
      if(!actions) return;

      if(emailCell) emailCell.style.setProperty('text-align','center','important');

      const name=clean(nameCell?.textContent);
      const roleText=clean(roleCell?.textContent);
      const roleBadge=roleCell?.querySelector('.qmes-db-member-badge');
      const isAdmin=roleBadge?.classList.contains('admin')||/^(관리자|시스템 관리자)$/.test(roleText)||name==='관리자';
      const existing=actions.querySelector('.qmes-access-trigger,.qmes-member-direct-access');

      if(isAdmin){
        if(existing) existing.remove();
        return;
      }
      if(!name) return;

      const button=existing||document.createElement('button');
      button.type='button';
      button.classList.add('qmes-db-member-btn','qmes-access-trigger','qmes-member-direct-access');
      button.textContent='접근권한 설정';
      button.dataset.qmesAccessName=name;
      button.disabled=false;
      button.onclick=event=>{
        event.preventDefault();
        event.stopPropagation();
        openPermission(name);
      };

      if(!existing){
        const reset=Array.from(actions.querySelectorAll('button')).find(item=>clean(item.textContent)==='비밀번호 초기화');
        const deleteButton=Array.from(actions.querySelectorAll('button')).find(item=>clean(item.textContent)==='삭제');
        if(deleteButton) actions.insertBefore(button,deleteButton);
        else if(reset) reset.insertAdjacentElement('afterend',button);
        else actions.appendChild(button);
      }
    });
  }

  function schedule(){
    if(scheduled) return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      patchTable();
      setTimeout(patchTable,60);
    });
  }

  function start(){
    ensureStyle();
    loadAccessModule();
    if(document.body){
      new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true});
    }
    document.addEventListener('click',event=>{
      if(event.target instanceof Element&&event.target.closest('.qmes-db-members,#qmes-erp-sidebar')) setTimeout(schedule,0);
    },true);
    window.addEventListener('qmes:navigate-tab',()=>setTimeout(schedule,0));
    setInterval(patchTable,1000);
    schedule();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
