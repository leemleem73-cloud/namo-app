/* Inventory IQC metadata persistence + detail/QR repair, 2026-08-21. */
(function(){
  'use strict';
  if(window.__QMES_INV_IQC_METADATA_PERSIST_V2__)return;
  window.__QMES_INV_IQC_METADATA_PERSIST_V2__=true;

  const META_KIND='inventory-iqc-metadata-v1';
  const clean=value=>String(value??'').replace(/\s+/g,' ').trim();
  const upper=value=>clean(value).toUpperCase();
  const dateOnly=value=>{
    const match=clean(value).match(/\d{4}-\d{2}-\d{2}/);
    return match?match[0]:'';
  };
  const positiveInt=value=>{
    const match=clean(value).replace(/,/g,'').match(/\d+/);
    const number=match?Number(match[0]):0;
    return Number.isInteger(number)&&number>0?Math.min(500,number):0;
  };
  const normalizeDocument=value=>upper(value).replace(/^IQC:/,'');
  const packagingAliases=[
    'packagingType','packaging_type','packageType','package_type','packType','pack_type',
    'packingType','packing_type','containerType','container_type','packaging','package'
  ];
  const packagingOtherAliases=[
    'packagingTypeOther','packaging_type_other','packageTypeOther','package_type_other',
    'packagingOther','packaging_other'
  ];

  let remoteIqcRows=[];
  let inventoryMetadata=[];
  let transactions=[];
  let iqcLoadedAt=0;
  let metadataLoadedAt=0;
  let transactionsLoadedAt=0;
  let iqcPromise=null;
  let metadataPromise=null;
  let transactionsPromise=null;
  let syncPromise=null;
  let lastFullSyncAt=0;

  function firstValue(row,keys){
    for(const key of keys){
      const value=clean(row?.[key]);
      if(value&&value!=='-')return value;
    }
    return'';
  }

  function packagingParts(row){
    if(!row)return{type:'',other:'',label:''};
    const type=firstValue(row,packagingAliases);
    const other=firstValue(row,packagingOtherAliases);
    return {type,other,label:type==='기타'&&other?`기타(${other})`:type};
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

  async function listSync(type){
    if(typeof window.qmesSyncList==='function')return window.qmesSyncList(type);
    const response=await fetch(`/api/qmes-sync/${encodeURIComponent(type)}`,{credentials:'same-origin'});
    const payload=await response.json().catch(()=>({}));
    if(!response.ok||payload?.success===false)throw new Error(payload?.message||`${type} 공용 DB 조회 실패`);
    return Array.isArray(payload?.data)?payload.data:[];
  }

  async function upsertSync(type,key,payload){
    if(typeof window.qmesSyncUpsert==='function')return window.qmesSyncUpsert(type,key,payload);
    const response=await fetch(`/api/qmes-sync/${encodeURIComponent(type)}`,{
      method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({key,payload})
    });
    const result=await response.json().catch(()=>({}));
    if(!response.ok||result?.success===false)throw new Error(result?.message||`${type} 공용 DB 저장 실패`);
    return result?.data;
  }

  async function loadRemoteIqc(force=false){
    if(!force&&remoteIqcRows.length&&Date.now()-iqcLoadedAt<30000)return remoteIqcRows;
    if(iqcPromise)return iqcPromise;
    iqcPromise=(async()=>{
      try{
        const records=await listSync('iqc');
        const rows=[];
        (records||[]).forEach(record=>{
          const payload=parsePayload(record);
          if(payload?.deleted)return;
          (Array.isArray(payload?.rows)?payload.rows:[]).forEach(row=>{
            if(row)rows.push({...row,__qmesRecordKey:record?.record_key||'',__qmesUpdatedAt:record?.updated_at||''});
          });
        });
        remoteIqcRows=rows;
        iqcLoadedAt=Date.now();
      }catch(error){
        console.warn('[QMES inventory] IQC 공용자료 조회 실패',error?.message||error);
      }finally{
        iqcPromise=null;
      }
      return remoteIqcRows;
    })();
    return iqcPromise;
  }

  async function loadInventoryMetadata(force=false){
    if(!force&&inventoryMetadata.length&&Date.now()-metadataLoadedAt<30000)return inventoryMetadata;
    if(metadataPromise)return metadataPromise;
    metadataPromise=(async()=>{
      try{
        const records=await listSync('inventory');
        inventoryMetadata=(records||[]).map(record=>({
          key:clean(record?.record_key),
          updatedAt:clean(record?.updated_at),
          payload:parsePayload(record)
        })).filter(record=>record.payload?.kind===META_KIND&&!record.payload?.deleted);
        metadataLoadedAt=Date.now();
      }catch(error){
        console.warn('[QMES inventory] IQC 연동기록 조회 실패',error?.message||error);
      }finally{
        metadataPromise=null;
      }
      return inventoryMetadata;
    })();
    return metadataPromise;
  }

  async function loadTransactions(force=false){
    if(!force&&transactions.length&&Date.now()-transactionsLoadedAt<15000)return transactions;
    if(transactionsPromise)return transactionsPromise;
    transactionsPromise=(async()=>{
      try{
        const response=await fetch('/api/inventory/transactions?limit=1000',{credentials:'same-origin'});
        const payload=await response.json().catch(()=>({}));
        if(response.ok&&payload?.success&&Array.isArray(payload.data)){
          transactions=payload.data;
          transactionsLoadedAt=Date.now();
        }
      }catch(error){
        console.warn('[QMES inventory] 입출고 기록 조회 실패',error?.message||error);
      }finally{
        transactionsPromise=null;
      }
      return transactions;
    })();
    return transactionsPromise;
  }

  function allIqcRows(){
    const rows=[];
    const seen=new Set();
    [...localIqcRows(),...remoteIqcRows].forEach(row=>{
      if(!row)return;
      const key=normalizeDocument(row?.inNo||row?.in_no||row?.receiptNo||row?.receipt_no||row?.__qmesRecordKey)
        ||`${upper(row?.lot||row?.lotNo||row?.lot_no)}|${upper(row?.name||row?.material||row?.item||row?.itemName||row?.item_name)}|${dateOnly(row?.recv||row?.inspectedAt)}`;
      if(key&&seen.has(key))return;
      if(key)seen.add(key);
      rows.push(row);
    });
    return rows;
  }

  function txMaterial(tx){return clean(tx?.item_name||tx?.itemName||tx?.item_code||tx?.itemCode);}
  function txLot(tx){return upper(tx?.lot_no||tx?.lotNo);}
  function txReference(tx){return upper(tx?.reference_no||tx?.referenceNo);}
  function rowMaterial(row){return clean(row?.name||row?.material||row?.item||row?.itemName||row?.item_name||row?.code);}
  function rowLot(row){return upper(row?.lot||row?.lotNo||row?.lot_no);}
  function rowInNo(row){return normalizeDocument(row?.inNo||row?.in_no||row?.receiptNo||row?.receipt_no||row?.__qmesRecordKey);}

  function findIqcForTransaction(tx){
    const rows=allIqcRows();
    const reference=normalizeDocument(txReference(tx));
    const lot=txLot(tx);
    const material=upper(txMaterial(tx));
    return rows.find(row=>reference&&reference!=='-'&&rowInNo(row)===reference)
      ||rows.find(row=>lot&&rowLot(row)===lot&&material&&upper(rowMaterial(row))===material)
      ||rows.find(row=>lot&&rowLot(row)===lot)
      ||null;
  }

  function findTransactionForIqc(row,rows=transactions){
    const inNo=rowInNo(row);
    const lot=rowLot(row);
    const material=upper(rowMaterial(row));
    return rows.find(tx=>normalizeDocument(txReference(tx))===inNo&&inNo)
      ||rows.find(tx=>txLot(tx)===lot&&upper(txMaterial(tx))===material&&lot&&material)
      ||rows.find(tx=>txLot(tx)===lot&&lot&&/^IQC:/i.test(clean(tx?.reference_no||tx?.referenceNo)))
      ||null;
  }

  function metadataKey(tx,row){
    const id=clean(tx?.id);
    if(id)return`IQC-TX-${id}`;
    const inNo=rowInNo(row);
    if(inNo)return`IQC-${inNo}`;
    const lot=rowLot(row)||txLot(tx)||'NOLOT';
    const material=upper(rowMaterial(row)||txMaterial(tx)||'ITEM').replace(/[^A-Z0-9가-힣]+/g,'-').slice(0,40);
    return`IQC-${lot}-${material}`;
  }

  function metadataFromIqc(tx,row,previous={}){
    const pack=packagingParts(row);
    const receivedAt=dateOnly(row?.recv||row?.recvDate||row?.recv_date||row?.receivedAt||row?.received_at||row?.date);
    const inspectionDate=dateOnly(row?.inspectedAt||row?.inspected_at||row?.inspectDate||row?.inspect_date||row?.inspectionDate||row?.inspection_date||receivedAt);
    const packageQty=positiveInt(row?.packageQty??row?.package_qty??row?.packQty??row?.pack_qty);
    const inNo=rowInNo(row);
    const next={
      ...previous,
      kind:META_KIND,
      transactionId:clean(tx?.id)||clean(previous?.transactionId),
      referenceNo:clean(tx?.reference_no||tx?.referenceNo)||clean(previous?.referenceNo),
      iqcInNo:inNo||clean(previous?.iqcInNo),
      material:rowMaterial(row)||txMaterial(tx)||clean(previous?.material),
      lot:clean(row?.lot||row?.lotNo||row?.lot_no)||clean(tx?.lot_no||tx?.lotNo)||clean(previous?.lot),
      packagingType:pack.type||clean(tx?.packaging_type||tx?.packagingType)||clean(previous?.packagingType),
      packagingTypeOther:pack.other||clean(tx?.packaging_type_other||tx?.packagingTypeOther)||clean(previous?.packagingTypeOther),
      packagingLabel:pack.label||clean(previous?.packagingLabel),
      packageQty:packageQty||positiveInt(tx?.package_qty||tx?.packageQty)||positiveInt(previous?.packageQty)||0,
      receivedAt:receivedAt||dateOnly(tx?.received_at||tx?.receivedAt)||dateOnly(previous?.receivedAt),
      inspectionDate:inspectionDate||dateOnly(tx?.inspection_date||tx?.inspectionDate)||dateOnly(previous?.inspectionDate),
      totalQuantity:clean(row?.qty||row?.incomingQty||row?.incoming_qty)||clean(tx?.quantity)||clean(previous?.totalQuantity),
      sourceUpdatedAt:clean(row?.__qmesUpdatedAt||row?.updatedAt)||clean(previous?.sourceUpdatedAt),
      syncedAt:new Date().toISOString(),
      source:'IQC'
    };
    if(!next.packagingLabel&&next.packagingType){
      next.packagingLabel=next.packagingType==='기타'&&next.packagingTypeOther
        ?`기타(${next.packagingTypeOther})`:next.packagingType;
    }
    return next;
  }

  function comparable(payload){
    return JSON.stringify({
      transactionId:clean(payload?.transactionId),referenceNo:clean(payload?.referenceNo),iqcInNo:clean(payload?.iqcInNo),
      material:clean(payload?.material),lot:clean(payload?.lot),packagingType:clean(payload?.packagingType),
      packagingTypeOther:clean(payload?.packagingTypeOther),packageQty:positiveInt(payload?.packageQty),
      receivedAt:dateOnly(payload?.receivedAt),inspectionDate:dateOnly(payload?.inspectionDate),totalQuantity:clean(payload?.totalQuantity)
    });
  }

  function metadataForTransaction(tx){
    const id=clean(tx?.id);
    const reference=normalizeDocument(txReference(tx));
    const lot=txLot(tx);
    const material=upper(txMaterial(tx));
    const records=inventoryMetadata.slice().sort((a,b)=>clean(b.updatedAt).localeCompare(clean(a.updatedAt)));
    return records.find(record=>id&&clean(record.payload?.transactionId)===id)?.payload
      ||records.find(record=>reference&&normalizeDocument(record.payload?.referenceNo||record.payload?.iqcInNo)===reference)?.payload
      ||records.find(record=>lot&&upper(record.payload?.lot)===lot&&material&&upper(record.payload?.material)===material)?.payload
      ||null;
  }

  async function persistOne(tx,row){
    if(!tx||!row)return null;
    const key=metadataKey(tx,row);
    const existingRecord=inventoryMetadata.find(record=>record.key===key);
    const existing=existingRecord?.payload||metadataForTransaction(tx)||{};
    const next=metadataFromIqc(tx,row,existing);
    if(existing&&comparable(existing)===comparable(next))return existing;
    try{
      await upsertSync('inventory',key,next);
      inventoryMetadata=[
        {key,updatedAt:new Date().toISOString(),payload:next},
        ...inventoryMetadata.filter(record=>record.key!==key)
      ];
      metadataLoadedAt=Date.now();
      return next;
    }catch(error){
      console.warn('[QMES inventory] 수입검사 연동기록 저장 실패',error?.message||error);
      return existing||null;
    }
  }

  async function syncAll(force=false){
    if(!force&&Date.now()-lastFullSyncAt<20000)return;
    if(syncPromise)return syncPromise;
    syncPromise=(async()=>{
      await Promise.all([loadRemoteIqc(force),loadInventoryMetadata(force),loadTransactions(force)]);
      const pairs=[];
      allIqcRows().forEach(row=>{
        const tx=findTransactionForIqc(row,transactions);
        if(tx)pairs.push({tx,row});
      });
      for(let index=0;index<pairs.length;index+=5){
        await Promise.all(pairs.slice(index,index+5).map(pair=>persistOne(pair.tx,pair.row)));
      }
      lastFullSyncAt=Date.now();
      document.dispatchEvent(new CustomEvent('qmes:inventory-iqc-metadata-synced',{detail:{count:pairs.length}}));
    })().finally(()=>{syncPromise=null;});
    return syncPromise;
  }

  function sheetField(sheet,label){
    return Array.from(sheet.querySelectorAll('.inv-tx-detail-grid>div')).find(node=>clean(node.querySelector('dt')?.textContent)===label)||null;
  }
  function sheetValue(sheet,label){return clean(sheetField(sheet,label)?.querySelector('dd')?.textContent)||'-';}
  function setSheetValue(sheet,label,value){
    const target=sheetField(sheet,label)?.querySelector('dd');
    const next=clean(value)||'-';
    if(!target||clean(target.textContent)===next)return false;
    target.textContent=next;
    return true;
  }

  function findTransactionForSheet(sheet){
    const existing=sheet.__qmesTx;
    if(existing?.id){
      return transactions.find(tx=>clean(tx?.id)===clean(existing.id))||existing;
    }
    const lot=upper(sheetValue(sheet,'LOT'));
    const material=upper(sheetValue(sheet,'원료명'));
    return transactions.find(tx=>txLot(tx)===lot&&upper(txMaterial(tx))===material)
      ||transactions.find(tx=>txLot(tx)===lot)
      ||null;
  }

  function refreshQrSnapshot(sheet){
    const wrap=sheet.querySelector('.inv-tx-barcode');
    wrap?.querySelector('[data-qmes-public-preview-content="1"]')?.remove();
    window.setTimeout(()=>document.dispatchEvent(new CustomEvent('qmes:inventory-qr-ready')),30);
  }

  function applyPrintButtonLabel(sheet){
    const button=sheet.querySelector('.inv-tx-detail-actions .primary');
    if(!button)return;
    button.setAttribute('aria-label','QR 라벨 인쇄');
    button.setAttribute('title','QR 라벨 인쇄');
    button.classList.add('qmes-qr-label-button-clean');
  }

  async function repairSheet(sheet){
    if(!sheet||sheet.dataset.qmesIqcMetaBusy==='1')return;
    sheet.dataset.qmesIqcMetaBusy='1';
    try{
      applyPrintButtonLabel(sheet);
      await Promise.all([syncAll(false),loadInventoryMetadata(false),loadTransactions(false)]);
      const tx=findTransactionForSheet(sheet);
      const iqc=tx?findIqcForTransaction(tx):null;
      let metadata=tx?metadataForTransaction(tx):null;
      if(tx&&iqc)metadata=await persistOne(tx,iqc)||metadata;
      if(!metadata&&iqc)metadata=metadataFromIqc(tx||{},iqc,{});
      if(!metadata&&tx){
        const pack=packagingParts(tx);
        metadata={
          packagingType:pack.type,packagingTypeOther:pack.other,packagingLabel:pack.label,
          packageQty:positiveInt(tx?.package_qty||tx?.packageQty),
          receivedAt:dateOnly(tx?.received_at||tx?.receivedAt),
          inspectionDate:dateOnly(tx?.inspection_date||tx?.inspectionDate)
        };
      }
      if(!metadata)return;

      const packagingLabel=clean(metadata.packagingLabel)
        ||(clean(metadata.packagingType)==='기타'&&clean(metadata.packagingTypeOther)
          ?`기타(${clean(metadata.packagingTypeOther)})`:clean(metadata.packagingType));
      let changed=false;
      changed=setSheetValue(sheet,'포장형태',packagingLabel||'미등록')||changed;
      changed=setSheetValue(sheet,'입고일자',dateOnly(metadata.receivedAt)||'-')||changed;
      changed=setSheetValue(sheet,'검사일자',dateOnly(metadata.inspectionDate)||dateOnly(metadata.receivedAt)||'-')||changed;
      const packageQty=positiveInt(metadata.packageQty);
      if(packageQty)changed=setSheetValue(sheet,'입고 포장수량',`${packageQty} EA`)||changed;

      if(tx){
        sheet.__qmesTx={
          ...tx,
          packaging_type:clean(metadata.packagingType)||tx.packaging_type,
          packaging_type_other:clean(metadata.packagingTypeOther)||tx.packaging_type_other,
          package_qty:packageQty||tx.package_qty,
          received_at:dateOnly(metadata.receivedAt)||tx.received_at,
          inspection_date:dateOnly(metadata.inspectionDate)||tx.inspection_date
        };
      }
      if(sheet.__qmesBase){
        sheet.__qmesBase.packaging=packagingLabel||sheet.__qmesBase.packaging;
        sheet.__qmesBase.received=dateOnly(metadata.receivedAt)||sheet.__qmesBase.received;
        sheet.__qmesBase.inspected=dateOnly(metadata.inspectionDate)||sheet.__qmesBase.inspected;
        if(packageQty)sheet.__qmesBase.packageQty=`${packageQty} EA`;
      }
      if(changed)refreshQrSnapshot(sheet);
      applyPrintButtonLabel(sheet);
    }finally{
      sheet.dataset.qmesIqcMetaBusy='0';
    }
  }

  const style=document.createElement('style');
  style.textContent=`
    .inv-tx-detail-actions .qmes-qr-label-button-clean{font-size:0!important;white-space:nowrap!important;}
    .inv-tx-detail-actions .qmes-qr-label-button-clean::after{content:'QR 라벨 인쇄';font-size:15px;font-weight:800;line-height:1;}
  `;
  document.head.appendChild(style);

  let repairScheduled=false;
  function repairAll(){
    if(repairScheduled)return;
    repairScheduled=true;
    requestAnimationFrame(()=>{
      repairScheduled=false;
      document.querySelectorAll('.inv-tx-detail-sheet').forEach(sheet=>void repairSheet(sheet));
    });
  }

  function invalidateAndSync(){
    iqcLoadedAt=0;
    metadataLoadedAt=0;
    transactionsLoadedAt=0;
    lastFullSyncAt=0;
    window.setTimeout(()=>{void syncAll(true).then(repairAll);},400);
  }

  new MutationObserver(repairAll).observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('qmes:inventory-qr-ready',repairAll);
  document.addEventListener('qmes:inventory-auto-linked',invalidateAndSync);
  document.addEventListener('qmes:data-updated',invalidateAndSync);
  document.addEventListener('qmes:data-changed',invalidateAndSync);
  window.addEventListener('storage',invalidateAndSync);

  window.setTimeout(()=>{void syncAll(true).then(repairAll);},800);
  window.setInterval(()=>{void syncAll(false).then(repairAll);},30000);
  repairAll();
})();
