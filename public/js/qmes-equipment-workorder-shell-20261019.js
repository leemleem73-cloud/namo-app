/* Equipment workspace same shell as work-order registration and list. No equipment records modified. */
(()=>{'use strict';
let mounted=null;
const css=document.createElement('style');css.textContent=`
#equipment .eq-hero,#equipment .eq-toolbar-card{display:none!important}
#equipment .eq-page{background:#f0f5fa!important;padding:0!important;border:1px solid #dbe4ec;border-radius:3px;overflow:hidden}
#equipment .eq-parity-header{display:flex;justify-content:space-between;align-items:center;gap:14px;background:white;padding:14px 20px;border-bottom:1px solid #d7e1eb}
#equipment .eq-parity-header h2{font-size:18px;font-weight:800;color:#193950;margin:0;border-left:4px solid #2081d5;padding-left:10px}
#equipment .eq-parity-header .eq-parity-buttons{display:flex;align-items:center;gap:7px;flex-wrap:wrap}
#equipment .eq-parity-header button{height:36px;padding:0 15px;border-radius:5px;border:1px solid #cfdfef;color:#16446c;background:white;font-weight:700;cursor:pointer}
#equipment .eq-parity-header button.primary{background:#1574bb;color:white;border-color:#1574bb}
#equipment .eq-parity-filters{background:#f1f6fb;padding:12px 16px;display:flex;flex-wrap:wrap;align-items:center;gap:12px 16px;border-bottom:1px solid #dbe5ed}
#equipment .eq-parity-filters label{display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#344d67;white-space:nowrap}
#equipment .eq-parity-filters input,#equipment .eq-parity-filters select{width:142px;height:32px;border:1px solid #ccdaea;border-radius:4px;padding:0 8px;background:white;color:#294763;font-size:12px}
#equipment .eq-parity-filters select{width:145px}
#equipment .eq-parity-summary{display:flex;justify-content:space-between;align-items:center;gap:12px;background:white;padding:12px 16px 9px}
#equipment .eq-parity-summary b{font-size:13px;color:#183b5a}
#equipment .eq-parity-summary button{height:29px;background:white;border:1px solid #d5e0ec;border-radius:4px;padding:0 10px;color:#375b7b;cursor:pointer}
#equipment .eq-parity-summary .eq-parity-toggle{min-width:29px}
#equipment .eq-table-card{border:0!important;border-radius:0!important;box-shadow:none!important;margin:0!important;background:white!important;padding:0 16px 16px!important}
#equipment .eq-table-title{display:none!important}
#equipment .eq-table thead th{background:#e7eff8!important;color:#254563!important}
#equipment .eq-parity-hidden{display:none!important}
#equipment .eq-parity-actionline{display:flex;gap:7px;align-items:center;margin-left:auto}
#equipment .eq-parity-actionline button{height:30px;background:white;border:1px solid #d2dfee;border-radius:4px;color:#22537e;padding:0 10px;cursor:pointer}
#equipment .eq-parity-actionline button[data-find],#equipment .eq-parity-actionline button[data-toggle]{width:32px;padding:0;display:inline-flex;justify-content:center;align-items:center}#equipment .eq-parity-actionline button[hidden]{display:none!important}
@media(max-width:850px){#equipment .eq-parity-header{align-items:flex-start;flex-direction:column}#equipment .eq-parity-filters label{flex:1 1 180px}#equipment .eq-parity-filters input,#equipment .eq-parity-filters select{width:100%}}

#equipment .eq-parity-actionline button[data-find],#equipment .eq-parity-actionline button[data-toggle]{width:34px!important;min-width:34px!important;height:32px!important;min-height:32px!important;padding:0!important;display:inline-flex!important;justify-content:center!important;align-items:center!important;box-sizing:border-box!important;color:#2464a0!important;border:1px solid #c9ddef!important;border-radius:5px!important;background:#fff!important}
#equipment .eq-parity-actionline button[data-find]:hover,#equipment .eq-parity-actionline button[data-toggle]:hover{background:#fff!important;color:#12548d!important;border-color:#a3c8ed!important}
#equipment .eq-parity-actionline button[data-eq-tip]:hover:after{background:#22649b!important;color:white!important}
#equipment .eq-parity-actionline button[data-eq-tip]{position:relative}
/* Equipment inquiry/collapse: white background, black text, scoped only. */
#equipment .eq-parity-actionline button[data-find],#equipment .eq-parity-actionline button[data-toggle],#equipment .eq-parity-actionline button[data-find]:hover,#equipment .eq-parity-actionline button[data-toggle]:hover{background:#fff!important;color:#000!important}


`;document.head.append(css);
function init(){
 const page=document.querySelector('#equipment .eq-page');
 if(!page||page===mounted||!page.querySelector('.eq-table')||!page.querySelector('.eq-actions [data-bulk-print]'))return;
 mounted=page;
 const toolbar=page.querySelector('.eq-toolbar-card'),actions=page.querySelector('.eq-actions'),tableCard=page.querySelector('.eq-table-card');
 const header=document.createElement('div');header.className='eq-parity-header';header.innerHTML='<h2>설비 등록 및 조회</h2><div class="eq-parity-buttons"></div>';
 const buttons=header.querySelector('.eq-parity-buttons');
 const move=(selector,label,primary)=>{const original=actions.querySelector(selector);if(!original)return;const button=document.createElement('button');button.textContent=label;button.className=primary?'primary':'';button.onclick=()=>original.click();buttons.append(button)};
 move('#eqExport','엑셀 내보내기',false);move('#eqCheckRegister','+ 점검등록',false);move('button:not(#eqCheckRegister):not(#eqExport):not([data-bulk-print]):not([data-bulk-delete])','+ 신규 설비 등록',true);
 // Explicit source is the button text, not incidental action order.
 const newSource=[...actions.querySelectorAll('button')].find(x=>x.textContent.includes('신규 설비 등록'));
 if(newSource){const b=[...buttons.children].find(x=>x.textContent.includes('신규 설비 등록'));if(b)b.onclick=()=>newSource.click()}
 const filters=document.createElement('div');filters.className='eq-parity-filters';
 filters.innerHTML='<label>설비구분 <select data-filter-group><option value="all">전체</option><option value="생산설비">생산설비</option><option value="검사·측정설비">검사·측정설비</option></select></label><label>설비명 <input data-filter-name placeholder="전체"></label><label>점검상태 <select data-filter-status><option value="">전체</option><option>정상</option><option>점검예정</option><option>교정관리</option><option>점검완료</option></select></label><label>점검일자 <input data-filter-date type="date"></label>';
 const summary=document.createElement('div');summary.className='eq-parity-summary';
 summary.innerHTML='<b>▸ 설비 등록 현황</b><div class="eq-parity-actionline"><button data-selected-print hidden>선택 인쇄</button><button data-selected-delete hidden>선택 삭제</button><button data-clear>조건 지우기</button><button data-find title="조회" aria-label="조회"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></svg></button><button data-toggle title="접기" aria-label="접기"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7 14 5-5 5 5"/></svg></button></div>';
 page.insertBefore(header,page.firstChild);header.after(filters,summary);
 let collapsed=false;const fields={group:filters.querySelector('[data-filter-group]'),name:filters.querySelector('[data-filter-name]'),status:filters.querySelector('[data-filter-status]'),date:filters.querySelector('[data-filter-date]'),};
 const originalSearch=toolbar.querySelector('#eqSearch'),originalTabs=[...toolbar.querySelectorAll('.eq-tab')];
 function apply(){
  const group=fields.group.value,name=fields.name.value.trim().toLowerCase(),status=fields.status.value.trim(),date=fields.date.value;
  page.querySelectorAll('.eq-table tbody tr').forEach(tr=>{
   const cells=tr.cells;
   const cell=i=>(cells[i]?.textContent||'').trim();
   const matchGroup=group==='all'||cell(4)===group;
   const matchName=!name||cell(3).toLowerCase().includes(name);
   const matchStatus=!status||cell(11)===status;
   const matchDate=!date||cell(9).includes(date)||cell(10).includes(date);
   tr.style.display=matchGroup&&matchName&&matchStatus&&matchDate?'':'none';
  });
 }

 Object.values(fields).forEach(el=>el.addEventListener(el.tagName==='SELECT'?'change':'input',apply));
 summary.querySelector('[data-clear]').onclick=()=>{Object.entries(fields).forEach(([k,el])=>el.value=k==='group'?'all':'');apply()};
 const findButton=summary.querySelector('[data-find]'),toggleButton=summary.querySelector('[data-toggle]');
 const tip=document.createElement('div');tip.className='eq-hover-tip';Object.assign(tip.style,{position:'fixed',zIndex:'2147483647',pointerEvents:'none',display:'none',background:'#fff',color:'#000',border:'1px solid #c9ddef',fontSize:'12px',fontWeight:'600',padding:'6px 10px',borderRadius:'5px',boxShadow:'0 3px 10px #0003',whiteSpace:'nowrap'});document.body.appendChild(tip);
 const showTip=b=>{tip.textContent=b.dataset.eqTip;tip.style.display='block';const r=b.getBoundingClientRect(),w=tip.offsetWidth;tip.style.left=Math.max(8,Math.min(window.innerWidth-w-8,r.left+r.width/2-w/2))+'px';tip.style.top=Math.max(6,r.top-tip.offsetHeight-8)+'px';};
 [findButton,toggleButton].forEach(b=>{b.removeAttribute('title');b.dataset.eqTip=b===findButton?'조회':'접기';b.addEventListener('mouseenter',()=>showTip(b));b.addEventListener('mouseleave',()=>{tip.style.display='none'});b.addEventListener('focus',()=>showTip(b));b.addEventListener('blur',()=>{tip.style.display='none'})});
 findButton.onclick=()=>{apply();};

 summary.querySelector('[data-toggle]').onclick=()=>{collapsed=!collapsed;tableCard.classList.toggle('eq-parity-hidden',collapsed);summary.querySelector('[data-toggle]').innerHTML=collapsed?'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7 10 5 5 5-5"/></svg>':'<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m7 14 5-5 5 5"/></svg>';toggleButton.dataset.eqTip=collapsed?'펼치기':'접기'};
 const bulkPrint=actions.querySelector('[data-bulk-print]'),bulkDelete=actions.querySelector('[data-bulk-delete]'),printBtn=summary.querySelector('[data-selected-print]'),deleteBtn=summary.querySelector('[data-selected-delete]');
 printBtn.onclick=()=>bulkPrint.click();deleteBtn.onclick=()=>bulkDelete.click();
 const sync=()=>{const selected=page.querySelectorAll('.eq-table tbody input.eq-wo-select:checked').length;printBtn.hidden=!selected;deleteBtn.hidden=!selected};
 page.querySelector('.eq-table').addEventListener('change',()=>setTimeout(sync,0));
 new MutationObserver(sync).observe(actions.querySelector('.eq-wo-actions'),{attributes:true,attributeFilter:['hidden']});
 sync();
}
const observer=new MutationObserver(()=>{const p=document.querySelector('#equipment .eq-page');if(p&&p!==mounted)init()});observer.observe(document.body,{childList:true,subtree:true});init();
})();