/* QMES finished goods inventory integration - 2026-08-12
 * Calculates finished-goods stock from completed production minus shipped quantity.
 * IMPORTANT: one OQC certificate contains multiple inspection rows, but shipment
 * quantity must be counted only once per OQC group/certificate.
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
  function normalizeDate(value){ return text(value).slice(0,10); }

  function oqcGroupKey(row,index){
    const group=upper(row?.groupId);
    if(group) return `OQC-GROUP|${group}`;
    const shipNo=upper(row?.shipNo||row?.shipmentNo||row?.outNo);
    if(shipNo) return `OQC-SHIP|${shipNo}`;
    const lot=upper(row?.lot||row?.lotNo);
    const date=normalizeDate(row?.shipDate||row?.shipmentDate||row?.outDate||row?.deliveryDate||row?.date);
    const customer=upper(row?.customer||row?.client||row?.cust);
    const amount=qty(row?.shipQty??row?.qty);
    return `OQC-FALLBACK|${lot}|${date}|${customer}|${amount.toFixed(3)}|${index}`;
  }

  function shipmentKey(row){
    if(row?.groupKey) return row.groupKey;
    const explicit=upper(row?.shipNo||row?.shipmentNo||row?.outNo||row?.id);
    if(explicit)return `ID|${explicit}`;
    return [upper(row?.lot),normalizeDate(row?.date),upper(row?.customer),Number(row?.qty||0).toFixed(3)].join("|");
  }

  function shipmentRows(){
    const db=global.DB||{};
    const candidates=[];

    /* OQC has one row per inspection item. Count shipment only once per groupId. */
    const oqcSeen=new Set();
    (Array.isArray(db.insp?.OQC)?db.insp.OQC:[]).forEach((row,index)=>{
      const lot=text(row?.lot||row?.lotNo);
      const amount=qty(row?.shipQty??row?.qty);
      const hasShip=Boolean(text(row?.shipDate||row?.shipmentDate||row?.outDate||row?.deliveryDate||row?.shipNo||row?.customer)) || /출하완료|출고완료/.test(text(row?.status||row?.shipmentStatus||row?.shipStatus));
      if(!lot || !(amount>0) || !hasShip) return;
      const groupKey=oqcGroupKey(row,index);
      if(oqcSeen.has(groupKey)) return;
      oqcSeen.add(groupKey);
      candidates.push({
        id:text(row?.shipNo||row?.shipmentNo||row?.outNo||row?.groupId||row?.id),
        shipNo:text(row?.shipNo||row?.shipmentNo||row?.outNo),
        groupKey,
        lot,
        qty:amount,
        source:"OQC",
        customer:text(row?.customer||row?.client||row?.cust),
        date:normalizeDate(row?.shipDate||row?.shipmentDate||row?.outDate||row?.deliveryDate||row?.date)
      });
    });

    Object.entries(db.lots||{}).forEach(([lotNo,lot])=>{
      const ship=lot?.ship||{};
      const amount=qty(ship?.shipQty??ship?.qty);
      if(amount>0) candidates.push({
        id:text(ship?.shipNo||ship?.shipmentNo||ship?.outNo||ship?.id),
        shipNo:text(ship?.shipNo||ship?.shipmentNo||ship?.outNo),
        lot:lotNo,qty:amount,source:"LOT",customer:text(ship?.customer),date:normalizeDate(ship?.shipDate||ship?.date)
      });
    });

    const unique=new Map();
    candidates.forEach((row)=>{
      /* LOT snapshot and OQC certificate can describe the same shipment. */
      const lotDateQty=[upper(row.lot),normalizeDate(row.date),Number(row.qty||0).toFixed(3)].join("|");
      const sameShipment=Array.from(unique.values()).find((existing)=>
        upper(existing.lot)===upper(row.lot) &&
        normalizeDate(existing.date)===normalizeDate(row.date) &&
        Number(existing.qty||0).toFixed(3)===Number(row.qty||0).toFixed(3)
      );
      if(sameShipment){
        if(sameShipment.source==="LOT" && row.source==="OQC"){
          for(const [key,value] of unique.entries()){
            if(value===sameShipment){ unique.delete(key); break; }
          }
          unique.set(shipmentKey(row),row);
        }
        return;
      }
      unique.set(shipmentKey(row)||lotDateQty,row);
    });
    return Array.from(unique.values());
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
      const overShipped=shipped>productionQty;
      const remaining=Math.max(0,Number((productionQty-shipped).toFixed(3)));
      result.push({
        lot,
        item:text(batch?.item||workOrder?.item||lotRecord?.product||lotRecord?.item||"-"),
        unit:text(batch?.unit||workOrder?.unit||"kg")||"kg",
        produced:Number(productionQty.toFixed(3)),
        shipped:Number(shipped.toFixed(3)),
        remaining,
        overShipped,
        status:overShipped?"출하수량확인":remaining<=0?"출하완료":shipped>0?"부분출하":"재고",
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
      overShippedLots:rows.filter((row)=>row.overShipped).map((row)=>row.lot),
      rows
    };
  }

  global.qmesBuildFinishedGoodsRows=buildFinishedGoodsRows;
  global.qmesFinishedGoodsInventorySummary=summary;
  global.dispatchEvent(new CustomEvent("qmes:finished-goods-inventory-ready",{detail:summary()}));
})(window);
