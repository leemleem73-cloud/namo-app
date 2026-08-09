/* QMES Stage 8 final inventory validation UI */
(function(global){
  "use strict";
  if(!global.React||typeof global.InventoryTab!=="function") return;
  const BaseInventoryTab=global.InventoryTab;
  const h=global.React.createElement;
  const number=value=>{const parsed=Number(String(value??"").replace(/,/g,""));return Number.isFinite(parsed)?parsed:0;};
  const format=value=>number(value).toLocaleString("ko-KR",{maximumFractionDigits:3});

  function CurrentInventorySummary(){
    const [version,setVersion]=global.React.useState(0);
    global.React.useEffect(()=>{
      const refresh=()=>setVersion(value=>value+1);
      const events=["qmes:data-updated","qmes:data-changed","qmes:inventory-lot-validation-ready","qmes:finished-goods-inventory-ready","focus"];
      events.forEach(eventName=>global.addEventListener(eventName,refresh));
      return()=>events.forEach(eventName=>global.removeEventListener(eventName,refresh));
    },[]);

    const rows=typeof global.qmesBuildInventoryLotRows==="function"
      ? (global.qmesBuildInventoryLotRows()||[])
      : [];
    const current=rows.reduce((sum,row)=>sum+number(row?.remaining),0);
    const hold=rows.filter(row=>row?.hold).reduce((sum,row)=>sum+number(row?.remaining),0);
    const available=Math.max(0,current-hold);
    const lots=rows.filter(row=>number(row?.remaining)>0).length;
    const validation=typeof global.qmesValidateInventoryLotFlow==="function"
      ? global.qmesValidateInventoryLotFlow()
      : null;
    const errors=number(validation?.counts?.errors);
    const warnings=number(validation?.counts?.warnings);
    const cards=[
      ["현재고 합계",`${format(current)} kg`],
      ["가용재고",`${format(available)} kg`],
      ["홀드재고",`${format(hold)} kg`],
      ["재고 LOT 수",`${lots} LOT`],
    ];

    return h("section",{id:"qmes-inventory-final-safe","data-version":version,className:"rounded-xl border border-sky-900/70 bg-sky-950/30 p-4"},
      h("div",{className:"text-sm font-black text-sky-300 mb-3"},"실시간 재고 요약 · QMES 연동"),
      h("div",{className:"qf-grid grid grid-cols-2 lg:grid-cols-4 gap-3"},
        cards.map(([label,value])=>h("div",{key:label,className:"qf-card rounded-lg border border-slate-700 bg-slate-900/50 p-3"},
          h("div",{className:"qf-label text-xs text-slate-400"},label),
          h("div",{className:"qf-value text-lg font-black mt-1"},value)
        ))
      ),
      h("div",{className:"qf-foot flex gap-3 mt-3 text-xs text-slate-400"},
        h("span",null,"LOT 수불 자동검증"),
        h("b",{className:errors?"text-amber-300":"text-emerald-300"},`오류 ${errors}건`),
        h("span",null,`경고 ${warnings}건`)
      )
    );
  }

  function EnhancedInventoryTab(){
    const result=typeof global.qmesRunFinalInventoryValidation==="function"
      ? global.qmesRunFinalInventoryValidation()
      : {ok:false,summary:{totalLots:0,mismatch:0,errors:0,warnings:0},mismatch:[]};
    const summary=result.summary||{};
    const bad=(result.mismatch||[]).slice(0,10);
    const tone=result.ok?"green":(summary.errors||summary.mismatch)?"red":"amber";
    const title=result.ok?"최종 수불 정상":`최종 수불 확인 필요 ${summary.mismatch||0}건`;
    const panel=typeof Panel!=="undefined"
      ? h(Panel,{title:"최종 재고 수불 검증",right:typeof Badge!=="undefined"?h(Badge,{tone},title):h("span",null,title)},
          h("div",{className:"grid grid-cols-2 md:grid-cols-5 gap-3 mb-3"},
            [["전체 LOT",summary.totalLots||0],["원재료 LOT",summary.rawLots||0],["완제품 LOT",summary.finishedLots||0],["불일치",summary.mismatch||0],["오류/경고",`${summary.errors||0}/${summary.warnings||0}`]].map(([label,value])=>
              h("div",{key:label,className:"rounded-lg border border-slate-700 bg-slate-900/40 p-3"},h("div",{className:"text-xs text-slate-400"},label),h("div",{className:"text-lg font-black mt-1"},String(value)))
            )
          ),
          bad.length
            ? h("div",{className:"overflow-x-auto"},h("table",{className:"w-full text-sm min-w-[760px]"},
                h("thead",null,h("tr",{className:"text-xs text-slate-400 border-b border-slate-800"},["구분","품목","LOT","예상잔량","실제잔량","상태"].map(x=>h("th",{key:x,className:"py-2 px-3 text-left"},x)))),
                h("tbody",null,bad.map((r,i)=>h("tr",{key:`${r.type}-${r.lot}-${i}`,className:"border-b border-slate-800/60"},
                  h("td",{className:"py-2 px-3"},r.type),h("td",{className:"py-2 px-3"},r.item||"-"),h("td",{className:"py-2 px-3 font-mono text-xs text-sky-300"},r.lot||"-"),h("td",{className:"py-2 px-3"},String(r.expected)),h("td",{className:"py-2 px-3"},String(r.actual)),h("td",{className:"py-2 px-3 text-rose-300 font-bold"},"불일치"))))
              ))
            : h("div",{className:"rounded-lg border border-emerald-800/60 bg-emerald-950/20 px-3 py-3 text-sm text-emerald-200"},"원재료 입고부터 완제품 출하까지 LOT 수불이 일치합니다.")
        )
      : null;
    return h("div",{className:"flex flex-col gap-4"},h(CurrentInventorySummary),panel,h(BaseInventoryTab));
  }

  try{
    InventoryTab=EnhancedInventoryTab;
    global.InventoryTab=EnhancedInventoryTab;
    global.dispatchEvent(new CustomEvent("qmes:inventory-final-validation-ui-ready"));
  }catch(error){
    console.error("[QMES] 최종 재고 검증 화면 연결 실패",error);
  }
})(window);
