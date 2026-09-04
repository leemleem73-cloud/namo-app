/* QMES 회원 이메일 동기화 + 회원등록 현황 간격 정리 - 2026-09-04 */
(function(){
  'use strict';

  const STYLE_ID='qmes-members-spacing-polish-20260904';

  function installMembersSpacingStyle(){
    if(document.getElementById(STYLE_ID))return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-db-member-card .qmes-db-member-head{
        min-height:52px!important;
        padding:0 18px!important;
      }
      .qmes-db-member-card .qmes-db-member-head h2{
        font-size:16px!important;
        line-height:1.25!important;
        letter-spacing:-.15px!important;
      }
      .qmes-db-member-table-wrap{
        width:100%!important;
        overflow-x:auto!important;
        overflow-y:hidden!important;
      }
      .qmes-db-member-table{
        width:100%!important;
        min-width:1380px!important;
        table-layout:fixed!important;
        border-collapse:separate!important;
        border-spacing:0!important;
        background:#fff!important;
      }
      .qmes-db-member-table thead th{
        height:46px!important;
        padding:0 14px!important;
        vertical-align:middle!important;
        text-align:center!important;
        border-bottom:1px solid #cfdbe3!important;
        background:#f7f9fb!important;
        color:#455b6b!important;
        font-size:12.5px!important;
        font-weight:850!important;
        line-height:1.2!important;
        letter-spacing:-.08px!important;
        white-space:nowrap!important;
      }
      .qmes-db-member-table tbody td{
        height:52px!important;
        padding:0 14px!important;
        vertical-align:middle!important;
        border-bottom:1px solid #e0e8ed!important;
        background:#fff!important;
        color:#293f4e!important;
        font-size:13.5px!important;
        font-weight:650!important;
        line-height:1.35!important;
        letter-spacing:-.06px!important;
        white-space:nowrap!important;
        overflow:hidden!important;
        text-overflow:ellipsis!important;
      }
      .qmes-db-member-table tbody tr:last-child td{
        border-bottom:0!important;
      }
      .qmes-db-member-table tbody tr:hover td{
        background:#f7fafc!important;
      }
      .qmes-db-member-table tbody tr.is-editing td{
        background:#edf8fd!important;
      }
      .qmes-db-member-uid{
        font-size:13px!important;
        font-weight:800!important;
        line-height:1.3!important;
        letter-spacing:0!important;
        font-variant-numeric:tabular-nums!important;
      }
      .qmes-db-member-name{
        font-size:13.5px!important;
        font-weight:800!important;
        line-height:1.3!important;
        letter-spacing:-.08px!important;
      }
      .qmes-db-member-phone,
      .qmes-db-member-table td:nth-child(6){
        font-variant-numeric:tabular-nums!important;
        letter-spacing:0!important;
      }
      .qmes-db-member-row-actions{
        display:flex!important;
        align-items:center!important;
        justify-content:flex-start!important;
        gap:7px!important;
        flex-wrap:nowrap!important;
        min-height:32px!important;
        overflow:visible!important;
      }
      .qmes-db-member-row-actions .qmes-db-member-btn{
        height:30px!important;
        min-width:auto!important;
        padding:0 10px!important;
        border-radius:6px!important;
        font-size:11.5px!important;
        font-weight:800!important;
        line-height:28px!important;
        letter-spacing:-.08px!important;
        white-space:nowrap!important;
      }
      .qmes-db-member-row-actions .qmes-db-member-btn.edit{min-width:76px!important;}
      .qmes-db-member-row-actions .qmes-db-member-btn.reset{min-width:88px!important;}
      .qmes-db-member-row-actions .qmes-db-member-btn.delete{min-width:42px!important;}
      .qmes-db-member-badge{
        min-height:24px!important;
        padding:2px 8px!important;
        font-size:11.5px!important;
        line-height:18px!important;
        letter-spacing:-.05px!important;
      }
      .qmes-db-member-table th:nth-child(1),
      .qmes-db-member-table td:nth-child(1){width:105px!important;}
      .qmes-db-member-table th:nth-child(2),
      .qmes-db-member-table td:nth-child(2){width:150px!important;}
      .qmes-db-member-table th:nth-child(3),
      .qmes-db-member-table td:nth-child(3){width:90px!important;}
      .qmes-db-member-table th:nth-child(4),
      .qmes-db-member-table td:nth-child(4){width:90px!important;}
      .qmes-db-member-table th:nth-child(5),
      .qmes-db-member-table td:nth-child(5){width:110px!important;}
      .qmes-db-member-table th:nth-child(6),
      .qmes-db-member-table td:nth-child(6){width:320px!important;}
      .qmes-db-member-table th:nth-child(7),
      .qmes-db-member-table td:nth-child(7){width:90px!important;text-align:center!important;}
      .qmes-db-member-table th:nth-child(8),
      .qmes-db-member-table td:nth-child(8){width:90px!important;text-align:center!important;}
      .qmes-db-member-table th:nth-child(9),
      .qmes-db-member-table td:nth-child(9){width:270px!important;overflow:visible!important;}
      @media(max-width:1500px){
        .qmes-db-member-table{min-width:1280px!important;}
        .qmes-db-member-table thead th{padding:0 11px!important;}
        .qmes-db-member-table tbody td{padding:0 11px!important;}
      }
    `;
    document.head.appendChild(style);
  }

  installMembersSpacingStyle();

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
    installMembersSpacingStyle();
    if(finished){clearInterval(timer);return;}
    syncEmails();
    updateVisibleTable();
  },800);

  setTimeout(syncEmails,200);
  window.__QMES_MEMBER_EDIT_LINK_DISABLED__=true;
})();
