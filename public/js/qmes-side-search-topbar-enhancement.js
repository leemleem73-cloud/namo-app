(function(){
  "use strict";
  if(window.__QMES_SIDE_SEARCH_TOPBAR_ENHANCEMENT__) return;
  window.__QMES_SIDE_SEARCH_TOPBAR_ENHANCEMENT__=true;

  const clean=v=>String(v||"").replace(/[›〉]/g,"").replace(/\s+/g," ").trim();
  const menuMap={
    '대시보드':[{label:'종합 대시보드',direct:'대시보드'},{label:'SPC 대시보드',group:'품질검사',sub:'SPC (Cpk)'}],
    '생산관리':[{label:'생산 진행',group:'생산관리',sub:'생산 (배치)'},{label:'작업지시서',group:'생산관리',sub:'작업지시서'}],
    '품질검사':[{label:'수입검사 (IQC)',group:'품질검사',sub:'수입검사 (IQC)'},{label:'공정검사 (PQC)',group:'품질검사',sub:'공정검사 (PQC)'},{label:'출하검사 (OQC)',group:'품질검사',sub:'출하검사 (OQC)'},{label:'SPC (Cpk)',group:'품질검사',sub:'SPC (Cpk)'},{label:'품질 인터락',group:'품질검사',sub:'품질 인터락 (차단)'},{label:'출하성적서',group:'품질검사',sub:'출하성적서'}],
    '현장입력':[{label:'현장 입력 (iPad)',direct:'현장입력'}],
    '재고관리':[{label:'원재료 재고',direct:'재고관리'}],
    '거래처 현황':[{label:'거래처 현황',direct:'거래처 현황'}],
    '설비관리':[{label:'설비 모니터링',direct:'설비관리'}],
    'LOT 추적':[{label:'LOT 추적',direct:'LOT 추적'}],
    '부적합관리':[{label:'부적합 (8D)',group:'부적합관리',sub:'부적합 (8D)'},{label:'고객불만 (GQMS)',group:'부적합관리',sub:'고객불만 (GQMS)'},{label:'4M 변경관리',group:'부적합관리',sub:'4M 변경관리'}]
  };
  const groups=Object.keys(menuMap);
  const allItems=groups.flatMap(group=>[
    {group,label:group,isGroup:true},
    ...menuMap[group].map((item,index)=>({group,label:item.label,item,index,isGroup:false}))
  ]);

  const style=document.createElement('style');
  style.id='qmes-side-search-topbar-enhancement-style';
  style.textContent=`
    .qmes-top-menu-bar,.qmes-top-menu{background:#fff!important;}
    .qmes-top-menu-button{color:#334155!important;background:transparent!important;}
    .qmes-top-menu-button span{color:inherit!important;}
    .qmes-top-menu-button:hover,.qmes-top-menu-button:focus-visible{background:#eef7ff!important;color:#175cd3!important;outline:none!important;}
    .qmes-top-menu-button[aria-current="page"],.qmes-top-menu-button.is-active,.qmes-top-menu-item.is-active .qmes-top-menu-button{background:#edf4ff!important;color:#175cd3!important;}
    #qmes-sync-sidebar .qmes-side-search-result-group{padding:7px 12px 4px!important;color:#64748b!important;font-size:11px!important;font-weight:800!important;}
    #qmes-sync-sidebar .qmes-side-search-result{position:relative!important;display:flex!important;align-items:center!important;width:100%!important;min-height:40px!important;padding:9px 10px 9px 14px!important;margin:2px 0!important;border:0!important;border-radius:7px!important;background:transparent!important;color:#475569!important;font-size:13px!important;font-weight:700!important;text-align:left!important;cursor:pointer!important;}
    #qmes-sync-sidebar .qmes-side-search-result:hover,#qmes-sync-sidebar .qmes-side-search-result:focus-visible{background:#f4f7fa!important;color:#175cd3!important;outline:none!important;}
  `;
  document.head.appendChild(style);

  const topButtons=()=>Array.from(document.querySelectorAll('.qmes-top-menu-button'));
  const topLabel=b=>clean(b?.querySelector('span')?.textContent||b?.textContent);
  const findTop=label=>topButtons().find(b=>topLabel(b)===label);

  function navigateResult(result){
    const group=result.group;
    const top=findTop(group);
    if(!top)return;
    top.click();
    if(result.isGroup)return;
    const targetLabel=result.item?.label||result.label;
    const clickSidebarTarget=()=>{
      const side=document.getElementById('qmes-sync-sidebar');
      if(!side)return false;
      const target=Array.from(side.querySelectorAll('.qmes-side-item')).find(b=>clean(b.textContent)===clean(targetLabel));
      if(!target)return false;
      target.click();
      return true;
    };
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      if(clickSidebarTarget())return;
      setTimeout(clickSidebarTarget,40);
      setTimeout(clickSidebarTarget,120);
    }));
  }

  function install(){
    const side=document.getElementById('qmes-sync-sidebar');
    const input=side?.querySelector('.qmes-side-search-input');
    const wrap=side?.querySelector('.qmes-side-items');
    if(!side||!input||!wrap)return false;
    if(input.dataset.qmesGlobalSearchBound==='1')return true;
    input.dataset.qmesGlobalSearchBound='1';

    const renderGlobal=()=>{
      const q=clean(input.value).toLowerCase();
      if(!q)return;
      const matches=allItems.filter(row=>clean(row.label).toLowerCase().includes(q)||clean(row.group).toLowerCase().includes(q));
      wrap.replaceChildren();
      if(!matches.length){
        const empty=document.createElement('div');
        empty.className='qmes-side-empty';
        empty.textContent='검색 결과 없음';
        wrap.appendChild(empty);
        return;
      }
      let lastGroup='';
      matches.forEach(result=>{
        if(result.group!==lastGroup){
          const group=document.createElement('div');
          group.className='qmes-side-search-result-group';
          group.textContent=result.group;
          wrap.appendChild(group);
          lastGroup=result.group;
        }
        const button=document.createElement('button');
        button.type='button';
        button.className='qmes-side-search-result';
        button.textContent=result.isGroup?result.group:result.label;
        button.addEventListener('click',()=>navigateResult(result));
        wrap.appendChild(button);
      });
    };

    input.addEventListener('input',()=>{
      if(clean(input.value)) requestAnimationFrame(renderGlobal);
    },true);
    input.addEventListener('keydown',event=>{
      if(event.key!=='Enter'||!clean(input.value))return;
      event.preventDefault();
      event.stopPropagation();
      side.querySelector('.qmes-side-search-result')?.click();
    },true);
    return true;
  }

  let tries=0;
  const timer=setInterval(()=>{
    tries+=1;
    if(install()||tries>200)clearInterval(timer);
  },50);
  window.addEventListener('load',install);
  document.addEventListener('qmes:data-updated',install);
})();
