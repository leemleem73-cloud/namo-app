/* QMES Stage 5 LOT inventory validation - 2026-08-07
 * Validates: IQC receipt -> material usage -> production -> shipment -> remaining stock.
 * Read-only validator. It does not mutate business records.
 */
(function installInventoryLotValidator(global){
  "use strict";

  const text=(v)=>String(v??"").trim();
  const upper=(v)=>text(v).toUpperCase();
  const qty=(v)=>{
    const raw=text(v).replace(/,/g,"");
    const m=raw.match(/-?\d+(?:\.\d+)?/);
    if(!m)return 0;
    const n=Number(m[0]);
    return Number.isFinite(n)?n:0;
  };

  function push(list,type,code,message,detail){
    list.push({type,code,message,detail:detail||null});
  }

  function validate(){
    const issues=[];
    const warnings=[];
    const info=[];
    const rawRows=typeof global.qmesBuildInventoryLotRows==="function"?global.qmesBuildInventoryLotRows():[];
    const fgRows=typeof global.qmesBuildFinishedGoodsRows==="function"?global.qmesBuildFinishedGoodsRows():[];
    const db=global.DB||{};

    if(typeof global.qmesBuildInventoryLotRows!=="function") push(issues,"error","RAW_API_MISSING","원재료 LOT 재고 계산 API가 없습니다.");
    if(typeof global.qmesBuildFinishedGoodsRows!=="function") push(issues,"error","FG_API_MISSING","완제품 재고 계산 API가 없습니다.");

    (Array.isArray(rawRows)?rawRows:[]).forEach((row)=>{
      const received=qty(row.received);
      const used=qty(row.used);
      const remaining=qty(row.remaining);
      const expected=Math.max(0,Number((received-used).toFixed(3)));
      if(received<0||used<0||remaining<0){
        push(issues,"error","RAW_NEGATIVE",`원료 LOT ${row.lot}에 음수 수량이 있습니다.`,{received,used,remaining});
      }
      if(Math.abs(expected-remaining)>0.001){
        push(issues,"error","RAW_BALANCE_MISMATCH",`원료 LOT ${row.lot} 수불이 맞지 않습니다.`,{received,used,remaining,expected});
      }
      if(used>received+0.001){
        push(issues,"error","RAW_OVERUSE",`원료 LOT ${row.lot} 사용량이 입고량을 초과했습니다.`,{received,used});
      }
      if(row.hold&&remaining>0){
        push(warnings,"warning","RAW_HOLD_STOCK",`원료 LOT ${row.lot}에 홀드 잔량이 있습니다.`,{remaining});
      }
    });

    (Array.isArray(fgRows)?fgRows:[]).forEach((row)=>{
      const produced=qty(row.produced);
      const shipped=qty(row.shipped);
      const remaining=qty(row.remaining);
      const expected=Math.max(0,Number((produced-shipped).toFixed(3)));
      if(produced<0||shipped<0||remaining<0){
        push(issues,"error","FG_NEGATIVE",`완제품 LOT ${row.lot}에 음수 수량이 있습니다.`,{produced,shipped,remaining});
      }
      if(Math.abs(expected-remaining)>0.001){
        push(issues,"error","FG_BALANCE_MISMATCH",`완제품 LOT ${row.lot} 수불이 맞지 않습니다.`,{produced,shipped,remaining,expected});
      }
      if(shipped>produced+0.001||row.overShipped){
        push(issues,"error","FG_OVERSHIP",`완제품 LOT ${row.lot} 출하량이 생산량을 초과했습니다.`,{produced,shipped});
      }
    });

    const workOrders=db.woDocs&&typeof db.woDocs==="object"?Object.entries(db.woDocs):[];
    workOrders.forEach(([woNo,wo])=>{
      (Array.isArray(wo?.inputs)?wo.inputs:[]).forEach((input)=>{
        const lot=text(input?.materialLot||input?.lot);
        const act=qty(input?.act);
        if(!lot||!(act>0))return;
        const linked=(Array.isArray(rawRows)?rawRows:[]).some((r)=>upper(r.lot)===upper(lot));
        if(!linked){
          push(warnings,"warning","INPUT_LOT_NOT_IN_IQC",`작업지시 ${woNo}의 원료 LOT ${lot}가 IQC 합격 재고에서 확인되지 않습니다.`,{workOrder:woNo,lot,used:act});
        }
      });
    });

    const completedBatches=(Array.isArray(db.batches)?db.batches:[]).filter((b)=>/완료|생산완료|출하완료/.test(text(b?.status)));
    completedBatches.forEach((batch)=>{
      const lot=text(batch?.no||batch?.lot||batch?.lotNo);
      if(!lot)return;
      const linked=(Array.isArray(fgRows)?fgRows:[]).some((r)=>upper(r.lot)===upper(lot));
      if(!linked){
        push(warnings,"warning","COMPLETED_LOT_NOT_IN_FG",`생산완료 LOT ${lot}가 완제품 재고 계산에 포함되지 않았습니다.`,{lot});
      }
    });

    push(info,"info","SUMMARY","LOT 수불 검증 완료",{
      rawLots:Array.isArray(rawRows)?rawRows.length:0,
      finishedLots:Array.isArray(fgRows)?fgRows.length:0,
      workOrders:workOrders.length,
      completedBatches:completedBatches.length
    });

    return {
      ok:issues.length===0,
      checkedAt:new Date().toISOString(),
      counts:{errors:issues.length,warnings:warnings.length,rawLots:rawRows.length||0,finishedLots:fgRows.length||0},
      errors:issues,
      warnings,
      info
    };
  }

  global.qmesValidateInventoryLotFlow=validate;
  global.qmesInventoryLotValidation=validate();
  global.dispatchEvent(new CustomEvent("qmes:inventory-lot-validation-ready",{detail:global.qmesInventoryLotValidation}));
})(window);
