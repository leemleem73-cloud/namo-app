(function(){
  const num=v=>{const n=Number(String(v??'').replace(/,/g,''));return Number.isFinite(n)?n:0;};
  const lots=()=>window.DB?.lots||{};
  const oqcRows=()=>Array.isArray(window.DB?.insp?.OQC)?window.DB.insp.OQC:[];

  function shipmentQtyForLot(lotNo, lot){
    const explicitShipQty=num(lot?.ship?.qty ?? lot?.shipQty ?? lot?.shippedQty);
    if(explicitShipQty>0) return explicitShipQty;

    const matching=oqcRows().filter(r=>String(r?.lot||'').trim()===String(lotNo||'').trim());
    const oqcQty=Math.max(0,...matching.map(r=>num(r?.qty ?? r?.shipQty ?? r?.shipmentQty)));
    if(oqcQty>0) return oqcQty;

    return 0;
  }

  function normalizeFinishedGoods(){
    Object.entries(lots()).forEach(([lotNo,lot])=>{
      const produced=num(lot?.qty ?? lot?.productionQty ?? lot?.doneQty);
      let shipped=shipmentQtyForLot(lotNo,lot);
      if(produced>0 && shipped>produced){
        console.warn('[QMES] 출하량 오류 보정', {lot:lotNo, produced, shipped});
        shipped=produced;
      }
      lot.shippedQty=shipped;
      lot.currentQty=Math.max(0, produced-shipped);
      lot.inventoryStatus=shipped>produced?'출하수량확인':(lot.currentQty<=0&&produced>0?'소진':'정상');
    });
  }

  normalizeFinishedGoods();
  window.qmesNormalizeFinishedGoodsInventory=normalizeFinishedGoods;
})();
