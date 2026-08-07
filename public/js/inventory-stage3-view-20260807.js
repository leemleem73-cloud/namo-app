/* QMES inventory stage 3 view - raw materials + finished goods */
(function installInventoryStage3View(global){
  "use strict";

  function h(){ return global.React.createElement.apply(global.React, arguments); }

  function fmt(value){
    const n=Number(value||0);
    return Number.isFinite(n)?n.toLocaleString(undefined,{maximumFractionDigits:3}):"0";
  }

  function Stage3InventoryTab(){
    const [tab,setTab]=global.React.useState("raw");
    const [version,setVersion]=global.React.useState(0);
    const rawRows=typeof global.qmesBuildInventoryRows==="function"?global.qmesBuildInventoryRows():[];
    const fgRows=typeof global.qmesBuildFinishedGoodsRows==="function"?global.qmesBuildFinishedGoodsRows():[];

    global.React.useEffect(()=>{
      const refresh=()=>setVersion(v=>v+1);
      global.addEventListener("qmes:data-updated",refresh);
      global.addEventListener("qmes:inventory-stage2-ready",refresh);
      global.addEventListener("qmes:finished-goods-inventory-ready",refresh);
      global.addEventListener("storage",refresh);
      global.addEventListener("focus",refresh);
      return()=>{
        global.removeEventListener("qmes:data-updated",refresh);
        global.removeEventListener("qmes:inventory-stage2-ready",refresh);
        global.removeEventListener("qmes:finished-goods-inventory-ready",refresh);
        global.removeEventListener("storage",refresh);
        global.removeEventListener("focus",refresh);
      };
    },[]);

    const rawShort=rawRows.filter(r=>Number(r.availableStock||0)<Number(r.safety||0));
    const fgRemaining=fgRows.reduce((sum,r)=>sum+Number(r.remaining||0),0);

    const tabButton=(key,label,count)=>h("button",{
      type:"button",
      onClick:()=>setTab(key),
      className:`px-4 py-2 rounded-lg text-sm font-bold border ${tab===key?"bg-sky-600/30 border-sky-400 text-sky-200":"bg-slate-900/40 border-slate-700 text-slate-400"}`
    },`${label} (${count})`);

    const rawTable=h("div",{className:"overflow-x-auto"},
      h("table",{className:"w-full text-sm min-w-[980px]"},
        h("thead",null,h("tr",{className:"text-xs text-slate-400 border-b border-slate-800"},
          ["자재코드","품명","현재고","홀드","가용재고","안전재고","LOT","상태"].map((x,i)=>h("th",{key:x,className:`py-2 px-3 ${i>=2&&i<=6?"text-right":"text-left"}`},x))
        )),
        h("tbody",null,rawRows.map(row=>h("tr",{key:row.code,className:"border-b border-slate-800/60"},
          h("td",{className:"py-2.5 px-3 font-mono text-xs text-sky-300"},row.code),
          h("td",{className:"py-2.5 px-3 text-slate-100"},row.name),
          h("td",{className:"py-2.5 px-3 text-right"},`${fmt(row.stock)} ${row.unit}`),
          h("td",{className:"py-2.5 px-3 text-right text-rose-300"},`${fmt(row.holdStock)} ${row.unit}`),
          h("td",{className:"py-2.5 px-3 text-right font-semibold text-emerald-300"},`${fmt(row.availableStock)} ${row.unit}`),
          h("td",{className:"py-2.5 px-3 text-right text-slate-400"},fmt(row.safety)),
          h("td",{className:"py-2.5 px-3 text-right"},row.linked?`${row.lotCount} LOT`:"-"),
          h("td",{className:"py-2.5 px-3"},typeof Badge!=="undefined"?h(Badge,{tone:row.status==="부족"?"amber":"green"},row.status):row.status)
        )))
      )
    );

    const fgTable=h("div",{className:"overflow-x-auto"},
      h("table",{className:"w-full text-sm min-w-[900px]"},
        h("thead",null,h("tr",{className:"text-xs text-slate-400 border-b border-slate-800"},
          ["완제품 LOT","품목","생산량","출하량","현재고","출하고객","상태"].map((x,i)=>h("th",{key:x,className:`py-2 px-3 ${i>=2&&i<=4?"text-right":"text-left"}`},x))
        )),
        h("tbody",null,
          fgRows.length?fgRows.map(row=>h("tr",{key:row.lot,className:"border-b border-slate-800/60"},
            h("td",{className:"py-2.5 px-3 font-mono text-xs text-sky-300"},row.lot),
            h("td",{className:"py-2.5 px-3 text-slate-100"},row.item),
            h("td",{className:"py-2.5 px-3 text-right"},`${fmt(row.produced)} ${row.unit}`),
            h("td",{className:"py-2.5 px-3 text-right text-slate-300"},`${fmt(row.shipped)} ${row.unit}`),
            h("td",{className:"py-2.5 px-3 text-right font-semibold text-emerald-300"},`${fmt(row.remaining)} ${row.unit}`),
            h("td",{className:"py-2.5 px-3 text-xs text-slate-400"},row.customers.length?row.customers.join(", "):"-"),
            h("td",{className:"py-2.5 px-3"},typeof Badge!=="undefined"?h(Badge,{tone:row.status==="출하완료"?"green":row.status==="부분출하"?"blue":"violet"},row.status):row.status)
          )):h("tr",null,h("td",{colSpan:7,className:"py-8 text-center text-slate-500"},"완료된 생산 LOT 재고가 없습니다."))
        )
      )
    );

    return h("div",{className:"flex flex-col gap-4","data-stage3-version":version},
      h("div",{className:"grid grid-cols-1 md:grid-cols-3 gap-3"},
        h("div",{className:"rounded-xl border border-slate-700 bg-slate-900/50 p-4"},h("div",{className:"text-xs text-slate-400"},"원재료 부족"),h("div",{className:"text-2xl font-black mt-1"},`${rawShort.length} 품목`)),
        h("div",{className:"rounded-xl border border-slate-700 bg-slate-900/50 p-4"},h("div",{className:"text-xs text-slate-400"},"완제품 재고 LOT"),h("div",{className:"text-2xl font-black mt-1"},`${fgRows.filter(r=>r.remaining>0).length} LOT`)),
        h("div",{className:"rounded-xl border border-slate-700 bg-slate-900/50 p-4"},h("div",{className:"text-xs text-slate-400"},"완제품 총 잔량"),h("div",{className:"text-2xl font-black mt-1"},`${fmt(fgRemaining)} kg`))
      ),
      h("div",{className:"flex gap-2"},tabButton("raw","원재료 재고",rawRows.length),tabButton("fg","완제품 재고",fgRows.length)),
      h(Panel,{title:tab==="raw"?"원재료 재고 · LOT 자동집계":"완제품 재고 · 생산/출하 자동집계",right:h("span",{className:"text-xs text-slate-400"},tab==="raw"?"IQC - 실투입":"생산완료 - 출하")},tab==="raw"?rawTable:fgTable)
    );
  }

  try{
    InventoryTab=Stage3InventoryTab;
    global.InventoryTab=Stage3InventoryTab;
    global.dispatchEvent(new CustomEvent("qmes:inventory-stage3-view-ready"));
  }catch(error){
    console.error("[QMES] 재고 3단계 화면 연결 실패",error);
  }
})(window);
