/* QMES finished goods inventory integration - 2026-08-07
 * Calculates finished-goods stock from completed production minus shipped quantity.
 * Does not replace existing files; exposes runtime APIs only.
 */
(function installFinishedGoodsInventory(global){
  "use strict";

  function text(value){ return String(value ?? "").trim(); }
  function upper(value){ return text(value).toUpperCase(); }
  function qty(value){
    const raw=text(value).replace(/,/g,"");
    const match=raw.match(/-?\d+(?:\.\d+)?/);
    if(!match)return 0;
    const n=Number(match[0]);
    return Number.isFinite(n)?n:0;
  }
  function sameLot(a,b){ return upper(a)===upper(b) && upper(a)!==""; }
  function completedStatus(value){ return /완료|생산완료|출하완료/.test(text(value)); }

  function shipmentRows(){
    const db=global.DB||{};
    const rows=[];
    (Array.isArray(db.insp?.OQC)?db.insp.OQC:[]).forEach((row)=>{
      const lot=text(row?.lot||row?.lotNo);
      const amount=qty(row?.shipQty??row?.qty);
      const hasShip=Boolean(text(row?.shipDate||row?.shipmentDate||row?.outDate||row?.deliveryDate||row?.shipNo||row?.customer)) || /출하완료|출고완료/.test(text(row?.status||row?.shipmentStatus||row?.shipStatus));
      if(lot && amount>0 && hasShip) rows.push({lot,qty:amount,source:"OQC",customer:text(row?.customer||row?.client||row?.cust),date:text(row?.shipDate||row?.shipmentDate||row?.outDate||row?.deliveryDate)});
    });
    Object.entries(db.lots||{}).forEach(([lotNo,lot])=>{
      const ship=lot?.ship||{};
      const amount=qty(ship?.shipQty??ship?.qty);
      if(amount>0) rows.push({lot:lotNo,qty:amount,source:"LOT",customer:text(ship?.customer),date:text(ship?.shipDate||ship?.date)});
    });
    return rows;
  }

  function buildFinishedGoodsRows(){
    const db=global.DB||{};
    const shipments=shipmentRows();
    const result=[];
    const seen=new Set();
    (Array.isArray(db.batches)?db.batches:[]).forEach((batch)=>{
      const lot=text(batch?.no||batch?.lot||batch?.lotNo);
      if(!lot || seen.has(upper(lot))) return;
      const workOrder=db.woDocs?.[lot]||{};
      const lotRecord=db.lots?.[lot]||{};
      const productionQty=qty(batch?.done||workOrder?.actualQty||workOrder?.prodQty||workOrder?.plan||batch?.plan||lotRecord?.qty);
      if(!(productionQty>0) || !(completedStatus(batch?.status)||completedStatus(workOrder?.status)||completedStatus(lotRecord?.status))) return;
      const lotShipments=shipments.filter((row)=>sameLot(row.lot,lot));
      const shipped=lotShipments.reduce((sum,row)=>sum+row.qty,0);
      const remaining=Math.max(0,Number((productionQty-shipped).toFixed(3)));
      result.push({
        lot,
        item:text(batch?.item||workOrder?.item||lotRecord?.product||lotRecord?.item||"-"),
        unit:text(batch?.unit||workOrder?.unit||"kg")||"kg",
        produced:Number(productionQty.toFixed(3)),
        shipped:Number(shipped.toFixed(3)),
        remaining,
        status:remaining<=0?"출하완료":shipped>0?"부분출하":"재고",
        customers:Array.from(new Set(lotShipments.map((row)=>row.customer).filter(Boolean))),
        shipments:lotShipments
      });
      seen.add(upper(lot));
    });
    return result.sort((a,b)=>a.lot.localeCompare(b.lot));
  }

  function summary(){
    const rows=buildFinishedGoodsRows();
    return {
      lotCount:rows.filter((row)=>row.remaining>0).length,
      totalProduced:Number(rows.reduce((sum,row)=>sum+row.produced,0).toFixed(3)),
      totalShipped:Number(rows.reduce((sum,row)=>sum+row.shipped,0).toFixed(3)),
      totalRemaining:Number(rows.reduce((sum,row)=>sum+row.remaining,0).toFixed(3)),
      rows
    };
  }

  global.qmesBuildFinishedGoodsRows=buildFinishedGoodsRows;
  global.qmesFinishedGoodsInventorySummary=summary;
  global.dispatchEvent(new CustomEvent("qmes:finished-goods-inventory-ready",{detail:summary()}));
})(window);
