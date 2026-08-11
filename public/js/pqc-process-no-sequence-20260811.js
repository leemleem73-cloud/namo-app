/* QMES: normalize auto-issued PQC process number to PQC-YYMMDD-0001 style (date + 4-digit sequence). */
(function(global){
  "use strict";
  if(global.__QMES_PQC_PROCESS_NO_SEQUENCE_20260811__) return;
  global.__QMES_PQC_PROCESS_NO_SEQUENCE_20260811__=true;

  function nextGroupId(date,lotNo,excludeGroup){
    const yymmdd=String(date||"").replace(/-/g,"").slice(2,8);
    if(!/^\d{6}$/.test(yymmdd)) return excludeGroup || "";
    const prefix=`PQC-${yymmdd}-`;
    const rows=Array.isArray(global.DB?.insp?.PQC) ? global.DB.insp.PQC : [];
    const sameLot=rows.find((row)=>String(row.lot||"").trim()===String(lotNo||"").trim() && /^PQC-\d{6}-\d{4}$/.test(String(row.groupId||"")));
    if(sameLot) return String(sameLot.groupId);
    const used=new Set(rows.map((row)=>String(row.groupId||"")).filter((id)=>id!==excludeGroup && id.startsWith(prefix)));
    let seq=1;
    while(used.has(`${prefix}${String(seq).padStart(4,"0")}`)) seq+=1;
    return `${prefix}${String(seq).padStart(4,"0")}`;
  }

  function normalizeCreated(created){
    if(!created || !Array.isArray(created.rows) || !created.rows.length) return created;
    const first=created.rows[0];
    const oldId=String(first.groupId||created.key||"");
    const newId=nextGroupId(first.date,first.lot,oldId);
    if(!newId || newId===oldId) return created;
    created.rows.forEach((row,index)=>{ row.groupId=newId; row.id=`${newId}-${index+1}`; });
    created.key=newId;
    if(created.payload) created.payload.rows=created.rows;
    return created;
  }

  const original=global.qmesCreatePqcDraftForIssuedWorkOrder;
  if(typeof original==="function"){
    global.qmesCreatePqcDraftForIssuedWorkOrder=function(lotNo){
      const created=original.apply(this,arguments);
      return normalizeCreated(created);
    };
  }

  global.qmesNormalizePendingPqcNumbers=function(){
    if(!Array.isArray(global.DB?.insp?.PQC)) return false;
    const groups=new Map();
    global.DB.insp.PQC.forEach((row)=>{
      const gid=String(row.groupId||"");
      if(!groups.has(gid)) groups.set(gid,[]);
      groups.get(gid).push(row);
    });
    let changed=false;
    for(const [gid,rows] of groups){
      if(/^PQC-\d{6}-\d{4}$/.test(gid)) continue;
      if(!rows.length || !rows.every((row)=>String(row.judge||"").trim()==="검사대기")) continue;
      const first=rows[0];
      const newId=nextGroupId(first.date,first.lot,gid);
      if(!newId || newId===gid) continue;
      rows.forEach((row,index)=>{ row.groupId=newId; row.id=`${newId}-${index+1}`; });
      changed=true;
    }
    if(changed && typeof global.dbSave==="function") global.dbSave();
    return changed;
  };

  setTimeout(()=>{ try{ global.qmesNormalizePendingPqcNumbers(); }catch(error){ console.warn("PQC 공정번호 정규화 실패:",error); } },400);
})(window);
