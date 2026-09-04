/* QMES PC 회원 수정: React/모달을 우회하는 네이티브 링크 방식 */
(function(){
  'use strict';
  if(window.__QMES_MEMBER_EDIT_LINK_V1__) return;
  window.__QMES_MEMBER_EDIT_LINK_V1__=true;

  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();
  const onMembersPage=()=>{
    try{if(sessionStorage.getItem('qmes_current_tab')==='members') return true;}catch(_e){}
    const text=clean(document.body?.innerText);
    return text.includes('회원등록 현황')&&text.includes('회원 추가');
  };

  function rowName(button){
    const row=button.closest('tr');
    if(!row) return '';
    const cells=Array.from(row.querySelectorAll('td'));
    if(!cells.length) return '';
    const preferred=clean(cells[1]?.textContent);
    if(preferred && preferred!=='-') return preferred;
    return clean(cells.find(cell=>cell.classList.contains('qmes-db-member-name'))?.textContent);
  }

  function go(button,event){
    const name=rowName(button);
    if(!name) return;
    event?.preventDefault?.();
    event?.stopPropagation?.();
    event?.stopImmediatePropagation?.();
    try{sessionStorage.setItem('qmes_current_tab','members');}catch(_e){}
    window.location.assign('/member-edit.html?v=20260904-native2&name='+encodeURIComponent(name));
  }

  document.addEventListener('pointerdown',function(event){
    if(!onMembersPage()) return;
    const button=event.target?.closest?.('button');
    if(!button || clean(button.textContent)!=='수정' || !button.closest('tr')) return;
    button.dataset.qmesNativeMemberEdit='1';
  },true);

  document.addEventListener('click',function(event){
    if(!onMembersPage()) return;
    const button=event.target?.closest?.('button');
    if(!button || clean(button.textContent)!=='수정' || !button.closest('tr')) return;
    go(button,event);
  },true);

  // 일부 PC 브라우저/오버레이가 click을 막는 경우 pointerup에서도 이동 처리.
  document.addEventListener('pointerup',function(event){
    if(!onMembersPage()) return;
    const button=event.target?.closest?.('button[data-qmes-native-member-edit="1"]');
    if(!button || clean(button.textContent)!=='수정' || !button.closest('tr')) return;
    setTimeout(()=>{
      if(location.pathname.endsWith('/member-edit.html')) return;
      const name=rowName(button);
      if(name) window.location.assign('/member-edit.html?v=20260904-native2&name='+encodeURIComponent(name));
    },30);
  },true);

  function mark(){
    if(!onMembersPage()) return;
    document.querySelectorAll('table tbody tr button').forEach(button=>{
      if(clean(button.textContent)!=='수정') return;
      button.dataset.qmesNativeMemberEdit='1';
      button.title='회원 정보 수정';
      button.style.setProperty('pointer-events','auto','important');
      button.style.setProperty('cursor','pointer','important');
      button.style.setProperty('position','relative','important');
      button.style.setProperty('z-index','2147480000','important');
    });
  }
  mark();
  setInterval(mark,300);
})();
