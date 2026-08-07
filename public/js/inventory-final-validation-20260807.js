/* QMES Stage 7 final inventory validation report - read only */
(function(global){
  "use strict";
  const num=v=>{const n=Number(String(v??0).replace(/,/g,""));return Number.isFinite(n)?n:0;};
  const round=v=>Number(num(v).toFixed(3));
  function run(){
    const raw=typeof global.qmesBuildInventoryLotRows==="function"?global.qmesBuildInventoryLotRows():[];
    const fg=typeof global.qmesBuildFinishedGoodsRows==="function"?global.qmesBuildFinishedGoodsRows():[];
    const base=typeof global.qmesValidateInventoryLotFlow==="function"?global.qmesValidateInventoryLotFlow():null;
    const rawReport=raw.map(r=>({
      type:"원재료",item:r.name,lot:r.lot,inbound:round(r.received),outbound:round(r.used),expected:round(Math.max(0,num(r.received)-num(r.used))),actual:round(r.remaining),ok:Math.abs(Math.max(0,num(r.received)-num(r.used))-num(r.remaining))<=0.001,status:r.status
    }));
    const fgReport=fg.map(r=>({
      type:"완제품",item:r.item,lot:r.lot,inbound:round(r.produced),outbound:round(r.shipped),expected:round(Math.max(0,num(r.produced)-num(r.shipped))),actual:round(r.remaining),ok:Math.abs(Math.max(0,num(r.produced)-num(r.shipped))-num(r.remaining))<=0.001,status:r.status
    }));
    const rows=[...rawReport,...fgReport];
    const mismatch=rows.filter(r=>!r.ok);
    return {
      ok:mismatch.length===0&&(!base||base.ok),
      checkedAt:new Date().toISOString(),
      summary:{totalLots:rows.length,rawLots:rawReport.length,finishedLots:fgReport.length,mismatch:mismatch.length,errors:base?.counts?.errors||0,warnings:base?.counts?.warnings||0},
      rows,mismatch,base
    };
  }
  global.qmesRunFinalInventoryValidation=run;
  global.qmesFinalInventoryValidation=run();
  global.dispatchEvent(new CustomEvent("qmes:inventory-final-validation-ready",{detail:global.qmesFinalInventoryValidation}));
})(window);
