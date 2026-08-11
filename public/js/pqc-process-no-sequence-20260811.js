/* QMES: normalize PQC process number to PQC-YYMMDD-0001 style for pending drafts. */
(function(global){
  "use strict";
  if(global.__QMES_PQC_PROCESS_NO_SEQUENCE_20260811_V2__) return;
  global.__QMES_PQC_PROCESS_NO_SEQUENCE_20260811_V2__=true;

  function expectedId(date){
    const yymmdd=String(date||"").replace(/-/g,"").slice(2,8);
    return /^\d{6}$/.test(yymmdd) ? `PQC-${yymmdd}-0001` : "";
  }

  function normalizeCreated(created){
    if(!created || !Array.isArray(created.rows) || !created.rows.length) return created;
    const first=created.rows[0];
    const newId=expectedId(first.date);
    if(!newId) return created;
    created.rows.forEach((row,index)=>{ row.groupId=newId; row.id=`${newId}-${index+1}`; });
    created.key=newId;
    if(created.payload) created.payload.rows=created.rows;
    return created;
  }

  const original=global.qmesCreatePqcDraftForIssuedWorkOrder;
  if(typeof original==="function"){
    global.qmesCreatePqcDraftForIssuedWorkOrder=function(lotNo){
      return normalizeCreated(original.apply(this,arguments));
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
      if(!rows.length || !rows.every((row)=>String(row.judge||"").trim()==="검사대기")) continue;
      const newId=expectedId(rows[0].date);
      if(!newId || newId===gid) continue;
      rows.forEach((row,index)=>{ row.groupId=newId; row.id=`${newId}-${index+1}`; });
      changed=true;
    }
    if(changed){
      if(typeof global.dbSave==="function") global.dbSave();
      global.dispatchEvent(new Event("qmes-pqc-number-normalized"));
    }
    return changed;
  };

  function run(){
    try{ global.qmesNormalizePendingPqcNumbers(); }
    catch(error){ console.warn("PQC 공정번호 정규화 실패:",error); }
  }
  setTimeout(run,700);
  global.addEventListener("qmes-pqc-reconciled",()=>setTimeout(run,100));
  global.addEventListener("focus",()=>setTimeout(run,100));
})(window);
