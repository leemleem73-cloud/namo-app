/* QMES 회원 이메일 자동 동기화 - 2026-09-04 */
(function(){
  'use strict';

  const EMAILS={
    '임흥배':'hbleem@namochemical.com',
    '김현진':'hyunjinkim@namochemical.com',
    '박도훈':'dhbak@namochemical.com',
    '박지헌':'jhp1767@namochemical.com',
    '박현아':'hapark@namochemical.com',
    '문지훈':'jh4ever@namochemical.com',
    '김세희':'shkim@namochemical.com',
    '정영기':'ygjeong@namochemical.com'
  };

  const clean=v=>String(v==null?'':v).trim();
  let syncing=false;
  let finished=false;

  function onMembersPage(){
    try{if(sessionStorage.getItem('qmes_current_tab')==='members')return true;}catch(_error){}
    const text=clean(document.body?.innerText);
    return text.includes('회원등록 현황')&&text.includes('회원');
  }

  async function json(url,options={}){
    const response=await fetch(url,{credentials:'same-origin',cache:'no-store',...options});
    const payload=await response.json().catch(()=>({success:false,message:`HTTP ${response.status}`}));
    if(!response.ok||!payload?.success)throw new Error(payload?.message||'요청 처리에 실패했습니다.');
    return payload;
  }

  function updateLocalStorage(){
    try{
      const key='qmes-users-v3';
      const rows=JSON.parse(localStorage.getItem(key)||'[]');
      if(!Array.isArray(rows))return;
      let changed=false;
      const next=rows.map(row=>{
        const name=clean(row?.name||row?.id);
        const email=EMAILS[name];
        if(!email||clean(row?.email).toLowerCase()===email)return row;
        changed=true;
        return {...row,email};
      });
      if(changed)localStorage.setItem(key,JSON.stringify(next));
    }catch(_error){}
  }

  function updateVisibleTable(){
    document.querySelectorAll('table tbody tr').forEach(row=>{
      const cells=Array.from(row.querySelectorAll('td'));
      if(cells.length<6)return;
      const name=clean(cells[1]?.textContent);
      const email=EMAILS[name];
      if(email)cells[5].textContent=email;
    });
  }

  async function syncEmails(){
    if(syncing||finished||!onMembersPage())return;
    syncing=true;
    try{
      const payload=await json('/api/admin/users');
      const rows=Array.isArray(payload.data)?payload.data:[];
      let changed=0;
      for(const user of rows){
        const target=EMAILS[clean(user.name)];
        if(!target||clean(user.email).toLowerCase()===target)continue;
        await json('/api/admin/users/'+encodeURIComponent(user.id),{
          method:'PUT',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({
            name:user.name,
            email:target,
            department:user.department||'',
            title:user.title||'',
            role:user.role||'user',
            status:user.status||'APPROVED'
          })
        });
        changed++;
      }
      updateLocalStorage();
      updateVisibleTable();
      finished=true;
      window.__QMES_MEMBER_EMAIL_SYNC__={ok:true,changed,emails:{...EMAILS}};
      if(changed>0)console.info(`[QMES] 회원 이메일 ${changed}건 동기화 완료`);
    }catch(error){
      window.__QMES_MEMBER_EMAIL_SYNC__={ok:false,error:String(error?.message||error)};
    }finally{
      syncing=false;
    }
  }

  const timer=setInterval(()=>{
    if(finished){clearInterval(timer);return;}
    syncEmails();
    updateVisibleTable();
  },800);

  setTimeout(syncEmails,200);
  window.__QMES_MEMBER_EDIT_LINK_DISABLED__=true;
})();
