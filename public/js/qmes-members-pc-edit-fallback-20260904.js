/* QMES PC 회원등록 현황 수정 버튼 하드 폴백 - 2026-09-04 */
(function installQmesMembersPcEditFallback(){
  'use strict';

  const BUILD='20260904-pc-edit-hard1';
  const MODAL_ID='qmes-member-pc-hard-edit-modal';
  const STYLE_ID='qmes-member-pc-hard-edit-style';

  const txt=value=>String(value==null?'':value).trim();
  const esc=value=>String(value==null?'':value).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[ch]));

  function isMembersPage(){
    try{if(sessionStorage.getItem('qmes_current_tab')==='members')return true;}catch(_error){}
    const bodyText=txt(document.body?.innerText);
    return bodyText.includes('회원등록 현황')&&bodyText.includes('회원 추가');
  }

  function ensureStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      html body #${MODAL_ID}{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:24px!important;background:rgba(15,23,42,.42)!important;font-family:'Pretendard','Noto Sans KR','Malgun Gothic',Arial,sans-serif!important;}
      html body #${MODAL_ID} *{box-sizing:border-box!important;font-family:inherit!important;}
      html body #${MODAL_ID} .qmpe-box{width:min(780px,calc(100vw - 32px))!important;max-height:calc(100vh - 48px)!important;overflow:auto!important;border:1px solid #c8d5df!important;border-radius:12px!important;background:#fff!important;box-shadow:0 28px 80px rgba(15,23,42,.28)!important;}
      html body #${MODAL_ID} .qmpe-head{display:flex!important;align-items:center!important;justify-content:space-between!important;min-height:56px!important;padding:0 18px!important;border-bottom:1px solid #dce5eb!important;background:#fafcfd!important;}
      html body #${MODAL_ID} .qmpe-head strong{color:#203746!important;font-size:17px!important;font-weight:900!important;}
      html body #${MODAL_ID} .qmpe-close{width:34px!important;height:34px!important;border:1px solid #c4d1db!important;border-radius:7px!important;background:#fff!important;color:#405665!important;font-size:21px!important;cursor:pointer!important;}
      html body #${MODAL_ID} .qmpe-body{padding:18px!important;}
      html body #${MODAL_ID} .qmpe-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:13px!important;}
      html body #${MODAL_ID} label{display:block!important;color:#4e6373!important;font-size:13px!important;font-weight:850!important;}
      html body #${MODAL_ID} input,html body #${MODAL_ID} select{display:block!important;width:100%!important;height:42px!important;margin-top:6px!important;padding:0 11px!important;border:1px solid #b8c7d2!important;border-radius:7px!important;background:#fff!important;color:#243746!important;font-size:14px!important;font-weight:650!important;outline:none!important;}
      html body #${MODAL_ID} input:focus,html body #${MODAL_ID} select:focus{border-color:#168bc3!important;box-shadow:0 0 0 3px rgba(22,139,195,.12)!important;}
      html body #${MODAL_ID} .qmpe-readonly{display:flex!important;align-items:center!important;height:42px!important;margin-top:6px!important;padding:0 11px!important;border:1px solid #d2dce4!important;border-radius:7px!important;background:#f7f9fb!important;color:#536877!important;font-size:14px!important;font-weight:750!important;}
      html body #${MODAL_ID} .qmpe-msg{display:none!important;margin-bottom:13px!important;padding:10px 12px!important;border:1px solid #efaaaa!important;border-radius:7px!important;background:#fff5f5!important;color:#b42318!important;font-size:13px!important;font-weight:800!important;}
      html body #${MODAL_ID} .qmpe-actions{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin-top:18px!important;}
      html body #${MODAL_ID} .qmpe-btn{height:40px!important;padding:0 16px!important;border-radius:7px!important;font-size:13px!important;font-weight:850!important;cursor:pointer!important;}
      html body #${MODAL_ID} .qmpe-cancel{border:1px solid #b7c5cf!important;background:#fff!important;color:#344b5a!important;}
      html body #${MODAL_ID} .qmpe-save{border:1px solid #0b8fc7!important;background:#0b8fc7!important;color:#fff!important;}
      html body button[data-qmes-member-edit],html body .qmes-db-member-btn.edit,html body .qmf-btn.edit{pointer-events:auto!important;position:relative!important;z-index:50!important;cursor:pointer!important;opacity:1!important;visibility:visible!important;}
      @media(max-width:700px){html body #${MODAL_ID} .qmpe-grid{grid-template-columns:1fr!important;}}
    `;
    document.head.appendChild(style);
  }

  function showMessage(modal,message){
    const box=modal.querySelector('.qmpe-msg');
    if(!box)return;
    box.textContent=message;
    box.style.setProperty('display','block','important');
  }

  async function fetchMembers(){
    const response=await fetch('/api/admin/users',{credentials:'same-origin',cache:'no-store'});
    const payload=await response.json().catch(()=>({success:false,message:`HTTP ${response.status}`}));
    if(!response.ok||!payload?.success)throw new Error(payload?.message||'회원 정보를 불러오지 못했습니다.');
    return Array.isArray(payload.data)?payload.data:[];
  }

  function savePhoneLocal(beforeName,next){
    try{
      if(typeof window.loadUsers!=='function'||typeof window.saveUsers!=='function')return;
      const list=window.loadUsers();
      if(!Array.isArray(list))return;
      let found=false;
      const updated=list.map(item=>{
        const itemName=txt(item?.name||item?.id);
        if(itemName!==beforeName)return item;
        found=true;
        return {...item,id:next.name,name:next.name,dept:next.department,position:next.title,phone:next.phone,email:next.email};
      });
      if(!found)updated.push({id:next.name,name:next.name,uid:next.uid||'',dept:next.department,position:next.title,phone:next.phone,email:next.email,role:next.role||'user'});
      window.saveUsers(updated);
    }catch(_error){}
  }

  function closeModal(){document.getElementById(MODAL_ID)?.remove();}

  function openModal(user){
    closeModal();
    ensureStyle();
    const modal=document.createElement('div');
    modal.id=MODAL_ID;
    modal.setAttribute('role','dialog');
    modal.setAttribute('aria-modal','true');
    modal.setAttribute('aria-label','회원 정보 수정');
    const isSystemAdmin=txt(user.name)==='관리자'||txt(user.uid).toUpperCase()==='U-0001';
    const departments=['대표','관리부','경영지원부','연구소','생산부','영업부','품질부'];
    const departmentOptions=Array.from(new Set([user.department,...departments].filter(Boolean))).map(value=>`<option value="${esc(value)}"${txt(user.department)===txt(value)?' selected':''}>${esc(value)}</option>`).join('');
    modal.innerHTML=`<div class="qmpe-box"><div class="qmpe-head"><strong>회원 정보 수정</strong><button type="button" class="qmpe-close" aria-label="닫기">×</button></div><div class="qmpe-body"><div class="qmpe-msg"></div><div class="qmpe-grid"><label>고유번호<div class="qmpe-readonly">${esc(user.uid||'-')}</div></label><label>이름 · 로그인 ID<input name="name" value="${esc(user.name||'')}"></label><label>부서<select name="department">${departmentOptions}</select></label><label>직급<input name="title" value="${esc(user.title||'')}"></label><label>연락처<input name="phone" type="tel" value="${esc(user.phone||'')}" placeholder="010-0000-0000"></label><label>이메일<input name="email" type="email" value="${esc(user.email||'')}"></label><label>권한<select name="role"${isSystemAdmin?' disabled':''}><option value="user"${user.role==='user'?' selected':''}>일반</option><option value="admin"${user.role==='admin'?' selected':''}>관리자</option></select></label><label>계정 상태<select name="status"${isSystemAdmin?' disabled':''}><option value="APPROVED"${user.status==='APPROVED'?' selected':''}>승인</option><option value="REJECTED"${user.status==='REJECTED'?' selected':''}>반려</option></select></label></div><div class="qmpe-actions"><button type="button" class="qmpe-btn qmpe-cancel">취소</button><button type="button" class="qmpe-btn qmpe-save">수정 저장</button></div></div></div>`;
    document.body.appendChild(modal);

    modal.querySelector('.qmpe-close').onclick=closeModal;
    modal.querySelector('.qmpe-cancel').onclick=closeModal;
    modal.addEventListener('mousedown',event=>{if(event.target===modal)closeModal();});
    modal.querySelector('.qmpe-save').onclick=async()=>{
      const saveButton=modal.querySelector('.qmpe-save');
      const name=txt(modal.querySelector('[name="name"]').value);
      const email=txt(modal.querySelector('[name="email"]').value).toLowerCase();
      const department=txt(modal.querySelector('[name="department"]').value);
      const title=txt(modal.querySelector('[name="title"]').value);
      const phone=txt(modal.querySelector('[name="phone"]').value);
      const role=isSystemAdmin?'admin':txt(modal.querySelector('[name="role"]').value||user.role||'user');
      const status=isSystemAdmin?'APPROVED':txt(modal.querySelector('[name="status"]').value||user.status||'APPROVED');
      if(!name){showMessage(modal,'이름을 입력해 주세요.');return;}
      if(!email){showMessage(modal,'이메일을 입력해 주세요.');return;}
      saveButton.disabled=true;
      saveButton.textContent='저장 중...';
      try{
        const response=await fetch(`/api/admin/users/${encodeURIComponent(user.id)}`,{method:'PUT',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email,department,title,role,status})});
        const payload=await response.json().catch(()=>({success:false,message:`HTTP ${response.status}`}));
        if(!response.ok||!payload?.success)throw new Error(payload?.message||'회원 수정에 실패했습니다.');
        savePhoneLocal(txt(user.name),{...user,name,email,department,title,phone,role,status});
        closeModal();
        alert(`${name} 회원 정보를 수정했습니다.`);
        try{sessionStorage.setItem('qmes_current_tab','members');}catch(_error){}
        window.location.reload();
      }catch(error){
        showMessage(modal,error?.message||'회원 수정에 실패했습니다.');
        saveButton.disabled=false;
        saveButton.textContent='수정 저장';
      }
    };
  }

  async function handleEditClick(event,button){
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    const row=button.closest('tr');
    const cells=Array.from(row?.querySelectorAll('td')||[]).map(cell=>txt(cell.textContent));
    const rowUid=cells[0]||'';
    const rowName=cells[1]||'';
    button.disabled=true;
    const originalText=button.textContent;
    button.textContent='불러오는 중';
    try{
      const members=await fetchMembers();
      const user=members.find(item=>txt(item.uid)===rowUid)||members.find(item=>txt(item.name)===rowName);
      if(!user)throw new Error('수정할 회원을 서버 DB에서 찾지 못했습니다.');
      try{
        if(typeof window.loadUsers==='function'){
          const local=window.loadUsers();
          const extra=Array.isArray(local)?local.find(item=>txt(item.name||item.id)===txt(user.name)):null;
          if(extra?.phone&&!user.phone)user.phone=extra.phone;
        }
      }catch(_error){}
      openModal(user);
    }catch(error){
      alert(error?.message||'회원 수정 화면을 열지 못했습니다.');
    }finally{
      button.disabled=false;
      button.textContent=originalText;
    }
  }

  document.addEventListener('click',event=>{
    if(!isMembersPage())return;
    const button=event.target?.closest?.('button');
    if(!button)return;
    if(txt(button.textContent)!=='수정')return;
    if(!button.closest('tr'))return;
    handleEditClick(event,button);
  },true);

  function strengthenEditButtons(){
    if(!isMembersPage())return;
    document.querySelectorAll('table tbody tr button').forEach(button=>{
      if(txt(button.textContent)!=='수정')return;
      button.dataset.qmesMemberEdit='hard';
      button.style.setProperty('pointer-events','auto','important');
      button.style.setProperty('cursor','pointer','important');
      button.style.setProperty('position','relative','important');
      button.style.setProperty('z-index','50','important');
      button.style.setProperty('opacity','1','important');
      button.style.setProperty('visibility','visible','important');
    });
  }

  ensureStyle();
  strengthenEditButtons();
  setInterval(strengthenEditButtons,400);
  window.__QMES_MEMBER_PC_EDIT_FALLBACK__=BUILD;
})();
