/* QMES: iPad PQC save must complete the existing pending work-order certificate, not create a duplicate. */
(function(global){
  "use strict";
  if(global.__QMES_PQC_IPAD_PENDING_LINK_20260811__) return;
  global.__QMES_PQC_IPAD_PENDING_LINK_20260811__=true;

  const original=global.qmesSyncUpsert;
  if(typeof original!=="function") return;

  global.qmesSyncUpsert=async function(type,key,payload){
    if(String(type||"").toLowerCase()!=="pqc" || !payload || !Array.isArray(payload.rows)) {
      return original.apply(this,arguments);
    }

    const ipadRows=payload.rows;
    const lotNo=String(payload.lotNo || ipadRows[0]?.lot || "").trim();
    const isIpad=ipadRows.some((row)=>String(row.source||"").toUpperCase().includes("IPAD"));
    if(!lotNo || !isIpad || typeof DB==="undefined" || !Array.isArray(DB.insp?.PQC)) {
      return original.apply(this,arguments);
    }

    const all=DB.insp.PQC;
    const ipadGroup=String(ipadRows[0]?.groupId || key || "").trim();
    const candidates=all.filter((row)=>String(row.lot||"").trim()===lotNo && String(row.groupId||"").trim()!==ipadGroup);
    const pending=candidates.find((row)=>{
      const group=String(row.groupId||"").trim();
      const groupRows=all.filter((x)=>String(x.groupId||"").trim()===group);
      return group && groupRows.length && groupRows.every((x)=>{
        const source=String(x.source||"").toUpperCase();
        const value=String(x.value||"").trim();
        const inspector=String(x.inspector||"").trim();
        return !source.includes("IPAD") && !value && !inspector;
      });
    });

    if(!pending) return original.apply(this,arguments);

    const targetGroup=String(pending.groupId||"").trim();
    const oldPending=all.filter((row)=>String(row.groupId||"").trim()===targetGroup);
    const ipadSet=new Set(ipadRows);
    DB.insp.PQC=all.filter((row)=>!oldPending.includes(row) && !ipadSet.has(row));

    ipadRows.forEach((row,index)=>{
      row.groupId=targetGroup;
      row.id=`${targetGroup}-${index+1}`;
      row.sharedSync=true;
    });
    DB.insp.PQC=[...ipadRows,...DB.insp.PQC];
    if(typeof dbSave==="function") dbSave();

    const linkedPayload={...payload,rows:ipadRows,savedAt:new Date().toISOString()};
    const result=await original.call(this,"pqc",targetGroup,linkedPayload);

    if(ipadGroup && ipadGroup!==targetGroup && typeof global.qmesSyncTombstoneInspection==="function") {
      try { await global.qmesSyncTombstoneInspection("pqc",ipadGroup,[],"iPad 현장입력을 기존 검사대기 성적서에 통합"); } catch(error) { console.warn("PQC 임시 신규번호 정리 실패:",error); }
    }
    global.dispatchEvent(new CustomEvent("qmes-pqc-record-updated",{detail:{groupId:targetGroup,lotNo,source:"IPAD POP"}}));
    console.info("[QMES] iPad PQC 입력을 기존 검사대기 성적서에 연결:",targetGroup,lotNo);
    return result;
  };
})(window);
