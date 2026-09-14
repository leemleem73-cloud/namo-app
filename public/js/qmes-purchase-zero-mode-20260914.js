/* NAMO QMES - purchase order ZERO mode patch - 2026-09-14
 * Display-only temporary patch.
 * Keeps existing purchase order source/data intact and replaces only the ERP purchase tab presentation with zero values.
 */
(function installPurchaseZeroMode(global){
  "use strict";
  if(global.__QMES_PURCHASE_ZERO_MODE_20260914__) return;
  global.__QMES_PURCHASE_ZERO_MODE_20260914__=true;

  function ZeroPurchaseTab(){
    const React=global.React;
    const e=React.createElement;
    const kpi=(label,value,kind)=>e("div",{className:"qp-kpi"+(kind?" "+kind:"")},e("span",null,label),e("b",null,value));
    const th=label=>e("th",null,label);

    return e("div",{className:"qerp qp-root qmes-purchase-zero-mode"},
      e("div",{className:"qerp-head"},
        e("div",null,
          e("h1",{className:"qerp-title"},"구매 · 발주관리"),
          e("div",{className:"qerp-sub"},"MRP 부족수량 → 구매검토·결재 → 협력사 발주 → 입고·IQC까지 연결")
        )
      ),
      e("div",{className:"qp-kpis"},
        kpi("이번 달 발주금액","0원","green"),
        kpi("결재 대기","0건","orange"),
        kpi("납기 위험","0건","red"),
        kpi("미입고 수량","0 kg","")
      ),
      e("div",{className:"qerp-card"},
        e("div",{className:"qerp-card-head"},
          e("div",null,
            e("h2",null,"구매 발주 현황"),
            e("div",{className:"qerp-muted"},"현재 구매 발주 0 기준")
          ),
          e("span",{className:"qp-count"},"총 0건")
        ),
        e("div",{className:"qerp-table-wrap"},
          e("table",{className:"qerp-table"},
            e("thead",null,e("tr",null,
              th("발주번호 / 생산구분"),th("협력사"),th("품목 / 규격"),th("발주수량"),th("공급가액 / 부가세·합계"),th("발주일 / 요청납기"),th("결재"),th("입고 · IQC"),th("상태"),th("관리")
            )),
            e("tbody",null,e("tr",null,
              e("td",{colSpan:10,style:{textAlign:"center",padding:"34px 12px",color:"#64748b",fontWeight:800}},"등록된 구매 발주가 없습니다.")
            ))
          )
        )
      )
    );
  }

  function install(){
    if(!global.React) return false;
    let installed=false;
    global.QMESErpPurchaseTab=ZeroPurchaseTab;
    if(Array.isArray(global.TABS)){
      const tab=global.TABS.find(item=>item&&item.id==="erpPurchase");
      if(tab){tab.comp=ZeroPurchaseTab;installed=true;}
    }
    if(!installed&&typeof global.QMESErpPurchaseTab==="function") installed=true;
    if(installed){
      try{
        if(sessionStorage.getItem("qmes_current_tab")==="erpPurchase"){
          global.dispatchEvent(new CustomEvent("qmes:navigate-tab",{detail:{tab:"erpPurchase",source:"purchase-zero-mode-20260914"}}));
        }
      }catch(_error){}
      global.dispatchEvent(new CustomEvent("qmes:purchase-zero-mode-ready"));
    }
    return installed;
  }

  global.addEventListener("qmes:erp-integrated-ready",install);
  global.addEventListener("qmes:erp-runtime-loaded",install);

  if(!install()){
    let attempts=0;
    const timer=global.setInterval(()=>{
      attempts+=1;
      if(install()||attempts>=100) global.clearInterval(timer);
    },100);
  }
})(window);
