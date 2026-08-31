/* NAMO QMES - New Sales Order direct grid layout V1 - 2026-08-31
 * Adjusts the CURRENT visible new-order form in place. No replacement modal.
 * Desktop layout:
 * 1) 수주번호 | 수주일자 | 고객사 | 요청 납기일
 * 2) 제품(2칸) | 수주수량 | 단가
 * 3) 고객 PO(2칸) | 납품처(2칸)
 * 4) 비고/고객 요구사항(전체)
 */
(function(){
  'use strict';
  if(window.__QMES_SALES_NEW_ORDER_GRID_LAYOUT_20260831_V1__) return;
  window.__QMES_SALES_NEW_ORDER_GRID_LAYOUT_20260831_V1__=true;

  const STYLE_ID='qmes-sales-new-order-grid-layout-20260831-v1-style';
  const clean=v=>String(v==null?'':v).replace(/\s+/g,' ').trim();

  function ensureStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const style=document.createElement('style');
    style.id=STYLE_ID;
    style.textContent=`
      .qmes-sales-gridfix-active .qmes-sales-gridfix-grid{
        display:grid!important;
        grid-template-columns:repeat(4,minmax(0,1fr))!important;
        gap:10px 12px!important;
        grid-auto-flow:row!important;
      }
      .qmes-sales-gridfix-active .qmes-sales-gridfix-hide{display:none!important}
      .qmes-sales-gridfix-active .qmes-sales-gridfix-one{grid-column:span 1!important}
      .qmes-sales-gridfix-active .qmes-sales-gridfix-two{grid-column:span 2!important}
      .qmes-sales-gridfix-active .qmes-sales-gridfix-full{grid-column:1/-1!important}
      @media(max-width:900px){
        .qmes-sales-gridfix-active .qmes-sales-gridfix-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important}
        .qmes-sales-gridfix-active .qmes-sales-gridfix-two,.qmes-sales-gridfix-active .qmes-sales-gridfix-full{grid-column:1/-1!important}
      }
      @media(max-width:560px){
        .qmes-sales-gridfix-active .qmes-sales-gridfix-grid{grid-template-columns:1fr!important}
        .qmes-sales-gridfix-active .qmes-sales-gridfix-one,.qmes-sales-gridfix-active .qmes-sales-gridfix-two,.qmes-sales-gridfix-active .qmes-sales-gridfix-full{grid-column:1/-1!important}
      }
    `;
    document.head.appendChild(style);
  }

  function dialogFrom(node){
    if(!(node instanceof Element)) return null;
    if(node.matches?.('[role="dialog"][aria-label="신규 수주 등록"]')) return node;
    return node.querySelector?.('[role="dialog"][aria-label="신규 수주 등록"]')||null;
  }

  function rootFrom(dialog){
    if(!dialog) return null;
    let root=dialog;
    for(let i=0;i<6&&root.parentElement;i++){
      if(root.id&&/qmes-sales-new-order/i.test(root.id)) return root;
      root=root.parentElement;
    }
    return dialog;
  }

  function fieldWrap(el,form){
    if(!el) return null;
    let p=el;
    while(p&&p!==form){
      const cls=String(p.className||'');
      if(/(?:^|\s)(?:n\d+-field|nm-field|nv4-field|qsn-field|qerp-field|field|form-field)(?:\s|$)/i.test(cls)||/field/i.test(cls)) return p;
      p=p.parentElement;
    }
    return el.parentElement;
  }

  function byName(form,name){
    return form.elements?.[name]||form.querySelector?.(`[name="${name}"]`)||null;
  }

  function setSpan(wrap,type,order){
    if(!wrap) return;
    wrap.classList.remove('qmes-sales-gridfix-one','qmes-sales-gridfix-two','qmes-sales-gridfix-full');
    wrap.classList.add(type==='two'?'qmes-sales-gridfix-two':type==='full'?'qmes-sales-gridfix-full':'qmes-sales-gridfix-one');
    wrap.style.setProperty('order',String(order),'important');
  }

  function setLabel(wrap,text){
    const label=wrap?.querySelector?.('label');
    if(label) label.textContent=text;
  }

  function patch(root){
    ensureStyle();
    const dialog=dialogFrom(root)||dialogFrom(document.body);
    if(!dialog) return false;
    const modal=rootFrom(dialog);
    const form=modal?.querySelector?.('form')||dialog.querySelector?.('form');
    if(!modal||!form) return false;

    const names=['salesOrderId','orderDate','customer','due','product','qty','unitPrice','po','deliveryPlace','remarks'];
    const controls=Object.fromEntries(names.map(name=>[name,byName(form,name)]));
    if(!controls.salesOrderId||!controls.customer||!controls.product||!controls.qty||!controls.due) return false;

    const wraps={};
    Object.entries(controls).forEach(([name,el])=>{wraps[name]=fieldWrap(el,form)});
    const grid=wraps.salesOrderId?.parentElement;
    if(!grid||!wraps.product||wraps.product.parentElement!==grid) return false;

    modal.classList.add('qmes-sales-gridfix-active');
    grid.classList.add('qmes-sales-gridfix-grid');

    // Keep business defaults for downstream metadata, but do not consume screen slots.
    ['orderType','priority'].forEach(name=>{
      const el=byName(form,name);if(!el)return;
      if(name==='orderType'&&!clean(el.value)) el.value='양산';
      if(name==='priority'&&!clean(el.value)) el.value='일반';
      const wrap=fieldWrap(el,form);if(wrap){wrap.classList.add('qmes-sales-gridfix-hide');wrap.style.setProperty('order','-1','important')}
    });

    setSpan(wraps.salesOrderId,'one',10);
    setSpan(wraps.orderDate,'one',20);
    setSpan(wraps.customer,'one',30);
    setSpan(wraps.due,'one',40);
    setSpan(wraps.product,'two',50);
    setSpan(wraps.qty,'one',60);
    setSpan(wraps.unitPrice,'one',70);
    setSpan(wraps.po,'two',80);
    setSpan(wraps.deliveryPlace,'two',90);
    setSpan(wraps.remarks,'full',100);

    setLabel(wraps.due,'요청 납기일 *');
    setLabel(wraps.product,'제품 *');
    setLabel(wraps.qty,'수주수량 (kg) *');
    setLabel(wraps.unitPrice,'단가 (원/kg)');
    setLabel(wraps.po,'고객 PO');
    setLabel(wraps.deliveryPlace,'납품처');
    setLabel(wraps.remarks,'비고/고객 요구사항');

    if(controls.product) controls.product.placeholder='절연 슬러리 제품명 / 품목코드';
    if(controls.po) controls.po.placeholder='고객 발주번호';
    if(controls.deliveryPlace) controls.deliveryPlace.placeholder='고객 지정 납품처';
    if(controls.remarks) controls.remarks.placeholder='포장, 라벨, CoA, 납기, 운송 등 고객 요구사항';

    const note=modal.querySelector('.n9-note,.n8-note,.nm-note,[class*="note"]');
    if(note&&/수주\s*Master|데모|기준정보/.test(clean(note.textContent))){
      note.textContent='나모케미칼 수주 Master 입력화면입니다. 생산·품질·출하 실적은 수주 확정 후 연결되며 수주 기본값을 덮어쓰지 않습니다.';
    }

    const headers=[...modal.querySelectorAll('th')];
    headers.forEach(th=>{
      const t=clean(th.textContent);
      if(t==='가용재고') th.textContent='가용 완제품재고';
      else if(t==='생산필요') th.textContent='생산 필요량';
    });

    modal.dataset.qmesSalesGridfix='20260831-v1';
    return true;
  }

  let queued=false;
  function scan(){
    if(queued) return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;patch(document.body)});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',scan,{once:true});
  else scan();

  const observer=new MutationObserver(records=>{
    if(records.some(r=>r.addedNodes&&r.addedNodes.length)) scan();
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  ['qmes:enterprise-ui-ready','qmes:mes-master-ready','qmes:erp-data-changed'].forEach(name=>window.addEventListener(name,scan));
  window.qmesSalesNewOrderGridLayoutV1={scan:()=>patch(document.body)};
})();
