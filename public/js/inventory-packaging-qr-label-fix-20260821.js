/* Inventory packaging resolver + QR print button cleanup, 2026-08-21. */
(function(){
  'use strict';
  if(window.__QMES_INV_PACKAGING_QR_LABEL_FIX_20260821__)return;
  window.__QMES_INV_PACKAGING_QR_LABEL_FIX_20260821__=true;

  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  const upper=value=>clean(value).toUpperCase();
  const normalizeDocument=value=>upper(value).replace(/^IQC:/,'').replace(/^IQC:/,'');
  const packagingAliases=[
    'packagingType','packaging_type','packageType','package_type','packType','pack_type',
    'packingType','packing_type','containerType','container_type','packaging','package'
  ];
  const packagingOtherAliases=[
    'packagingTypeOther','packaging_type_other','packageTypeOther','package_type_other',
    'packagingOther','packaging_other'
  ];
  const knownPackaging=['드럼','포대','말통','캔','IBC','박스','병','파렛트','탱크로리'];

  let remoteRows=[];
  let remoteLoadedAt=0;
  let remotePromise=null;

  function firstValue(row,keys){
    for(const key of keys){
      const value=clean(row?.[key]);
      if(value&&value!=='-')return value;
    }
    return'';
  }

  function packagingValue(row){
    if(!row)return'';
    const type=firstValue(row,packagingAliases);
    const other=firstValue(row,packagingOtherAliases);
    return type==='기타'&&other?`기타(${other})`:type;
  }

  function inferredPackaging(...sources){
    const text=sources.map(clean).filter(Boolean).join(' ');
    if(!text)return'';
    return knownPackaging.find(type=>new RegExp(`(^|[\\s·,/()])${type}($|[\\s·,/()0-9])`,'i').test(text))||'';
  }

  function parsePayload(record){
    const raw=record?.payload;
    if(raw&&typeof raw==='object')return raw;
    if(typeof raw==='string'){
      try{return JSON.parse(raw);}catch(error){return{};}
    }
    return{};
  }

  function localIqcRows(){
    const db=window.DB||{};
    const rows=[];
    [db.iqc,db.insp?.IQC,db.iqcRecords,db.inspections?.IQC].forEach(list=>{
      if(Array.isArray(list))list.forEach(row=>{if(row&&!rows.includes(row))rows.push(row);});
    });
    return rows;
  }

  async function loadRemoteIqc(force=false){
    if(!force&&remoteRows.length&&Date.now()-remoteLoadedAt<30000)return remoteRows;
    if(remotePromise)return remotePromise;
    remotePromise=(async()=>{
      try{
        const response=await fetch('/api/qmes-sync/iqc',{credentials:'same-origin'});
        const payload=await response.json().catch(()=>({}));
        if(!response.ok||payload?.success===false)return remoteRows;
        const records=Array.isArray(payload?.data)?payload.data:[];
        const rows=[];
        records.forEach(record=>{
          const body=parsePayload(record);
          if(body?.deleted)return;
          (Array.isArray(body?.rows)?body.rows:[]).forEach(row=>{
            if(!row)return;
            rows.push({...row,__qmesRecordKey:record?.record_key||'',__qmesUpdatedAt:record?.updated_at||''});
          });
        });
        remoteRows=rows;
        remoteLoadedAt=Date.now();
      }catch(error){
        console.warn('[QMES inventory] IQC 포장형태 조회 실패',error?.message||error);
      }finally{
        remotePromise=null;
      }
      return remoteRows;
    })();
    return remotePromise;
  }

  function allIqcRows(){
    const seen=new Set();
    const rows=[];
    [...remoteRows,...localIqcRows()].forEach(row=>{
      if(!row)return;
      const key=normalizeDocument(row?.inNo||row?.in_no||row?.receiptNo||row?.receipt_no||row?.__qmesRecordKey)
        ||`${upper(row?.lot||row?.lotNo||row?.lot_no)}|${upper(row?.name||row?.material||row?.item||row?.itemName||row?.item_name)}|${clean(row?.recv||row?.inspectedAt)}`;
      if(key&&seen.has(key))return;
      if(key)seen.add(key);
      rows.push(row);
    });
    return rows;
  }

  function sheetValue(sheet,label){
    const field=Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label);
    return clean(field?.querySelector('dd')?.textContent)||'-';
  }

  function sheetField(sheet,label){
    return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;
  }

  function latestWithPackaging(rows){
    return rows
      .filter(row=>packagingValue(row))
      .sort((left,right)=>clean(right?.__qmesUpdatedAt||right?.updatedAt||right?.recv||right?.inspectedAt).localeCompare(clean(left?.__qmesUpdatedAt||left?.updatedAt||left?.recv||left?.inspectedAt)))[0]||null;
  }

  function resolvePackaging(sheet){
    const tx=sheet.__qmesTx||{};
    const base=sheet.__qmesBase||{};
    const documentNo=normalizeDocument(base.documentNo||tx?.reference_no||tx?.referenceNo);
    const lot=upper(base.lot||sheetValue(sheet,'LOT')||tx?.lot_no||tx?.lotNo);
    const material=upper(base.material||sheetValue(sheet,'원료명')||tx?.item_name||tx?.itemName||tx?.item_code||tx?.itemCode);
    const rows=allIqcRows();

    const exactDocument=rows.filter(row=>{
      const rowNo=normalizeDocument(row?.inNo||row?.in_no||row?.receiptNo||row?.receipt_no||row?.__qmesRecordKey);
      return documentNo&&documentNo!=='-'&&rowNo===documentNo;
    });
    const exactLotMaterial=rows.filter(row=>
      lot&&lot!=='-'&&upper(row?.lot||row?.lotNo||row?.lot_no)===lot&&
      material&&material!=='-'&&upper(row?.name||row?.material||row?.item||row?.itemName||row?.item_name)===material
    );
    const exactLot=rows.filter(row=>lot&&lot!=='-'&&upper(row?.lot||row?.lotNo||row?.lot_no)===lot);
    const sameMaterial=rows.filter(row=>material&&material!=='-'&&upper(row?.name||row?.material||row?.item||row?.itemName||row?.item_name)===material);

    const source=latestWithPackaging(exactDocument)
      ||latestWithPackaging(exactLotMaterial)
      ||latestWithPackaging(exactLot)
      ||latestWithPackaging(sameMaterial);

    return packagingValue(source)
      ||firstValue(tx,packagingAliases)
      ||inferredPackaging(tx?.remark,tx?.reason,source?.remarks,source?.note)
      ||'';
  }

  function refreshQrSnapshot(sheet){
    const wrap=sheet.querySelector('.inv-tx-barcode');
    const preview=wrap?.querySelector('[data-qmes-public-preview-content="1"]');
    if(preview)preview.remove();
    document.dispatchEvent(new CustomEvent('qmes:inventory-qr-ready'));
  }

  function updatePackaging(sheet,value){
    const field=sheetField(sheet,'포장형태');
    const target=field?.querySelector('dd');
    if(!target)return false;
    const next=value||'미등록';
    if(clean(target.textContent)===next)return false;
    target.textContent=next;
    if(sheet.__qmesBase)sheet.__qmesBase.packaging=next;
    if(sheet.__qmesData)sheet.__qmesData.packaging=next;
    if(sheet.__qmesTx&&value&&!clean(sheet.__qmesTx.packaging_type))sheet.__qmesTx.packaging_type=value;
    refreshQrSnapshot(sheet);
    return true;
  }

  function applyPrintButtonLabel(sheet){
    const button=sheet.querySelector('.inv-tx-detail-actions .primary');
    if(!button)return;
    button.setAttribute('aria-label','QR 라벨 인쇄');
    button.setAttribute('title','QR 라벨 인쇄');
    button.classList.add('qmes-qr-label-button-clean');
  }

  async function repairSheet(sheet){
    if(!sheet||sheet.dataset.qmesPackagingBusy==='1')return;
    sheet.dataset.qmesPackagingBusy='1';
    try{
      applyPrintButtonLabel(sheet);
      await loadRemoteIqc(false);
      const resolved=resolvePackaging(sheet);
      updatePackaging(sheet,resolved);
      applyPrintButtonLabel(sheet);
    }finally{
      sheet.dataset.qmesPackagingBusy='0';
    }
  }

  const style=document.createElement('style');
  style.textContent=`
    .inv-tx-detail-actions .qmes-qr-label-button-clean{font-size:0!important;white-space:nowrap!important;}
    .inv-tx-detail-actions .qmes-qr-label-button-clean::after{content:'QR 라벨 인쇄';font-size:15px;font-weight:800;line-height:1;}
  `;
  document.head.appendChild(style);

  let scheduled=false;
  function repairAll(){
    if(scheduled)return;
    scheduled=true;
    requestAnimationFrame(()=>{
      scheduled=false;
      document.querySelectorAll('.inv-tx-detail-sheet').forEach(sheet=>void repairSheet(sheet));
    });
  }

  new MutationObserver(repairAll).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('qmes:inventory-qr-ready',repairAll);
  document.addEventListener('qmes:data-updated',()=>{remoteLoadedAt=0;repairAll();});
  window.addEventListener('storage',()=>{remoteLoadedAt=0;repairAll();});
  repairAll();
})();
