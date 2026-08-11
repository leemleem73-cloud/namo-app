/* QMES: normalize malformed PQC process numbers to numeric 4-digit sequence and sync renamed keys. */
(function(global){
  "use strict";
  if(global.__QMES_PQC_PROCESS_NO_SEQUENCE_20260811_V4__) return;
  global.__QMES_PQC_PROCESS_NO_SEQUENCE_20260811_V4__=true;

  function prefixFor(date){
    const yymmdd=String(date||"").replace(/-/g,"").slice(2,8);
    return /^\d{6}$/.test(yymmdd) ? `PQC-${yymmdd}-` : "";
  }

  function nextAvailableId(date,excludeGroup){
    const prefix=prefixFor(date);
    if(!prefix) return excludeGroup||"";
    const rows=Array.isArray(global.DB?.insp?.PQC) ? global.DB.insp.PQC : [];
    const used=new Set(rows.map((row)=>String(row.groupId||"").trim()).filter((id)=>id && id!==excludeGroup && /^PQC-\d{6}-\d{4}$/.test(id) && id.startsWith(prefix)));
    let seq=1;
    while(used.has(`${prefix}${String(seq).padStart(4,"0")}`)) seq+=1;
    return `${prefix}${String(seq).padStart(4,"0")}`;
  }

  async function migrateMalformed(){
    if(!Array.isArray(global.DB?.insp?.PQC)) return false;
    const groups=new Map();
    global.DB.insp.PQC.forEach((row)=>{
      const gid=String(row.groupId||"").trim();
      if(!groups.has(gid)) groups.set(gid,[]);
      groups.get(gid).push(row);
    });

    let changed=false;
    for(const [oldId,rows] of groups){
      if(!rows.length) continue;
      if(/^PQC-\d{6}-\d{4}$/.test(oldId)) continue;
      if(!/^PQC-\d{6}-/.test(oldId)) continue;

      const first=rows[0];
      const newId=nextAvailableId(first.date,oldId);
      if(!newId || newId===oldId) continue;

      const oldRows=rows.map((row)=>({...row}));
      rows.forEach((row,index)=>{
        row.groupId=newId;
        row.id=`${newId}-${index+1}`;
        row.sharedSync=true;
      });
      changed=true;

      const lotNo=String(first.lot||"").trim();
      const payload={
        mode:"PQC",
        lotNo,
        rows,
        lotRecord:global.DB.lots?.[lotNo] || null,
        holds:(global.DB.holds||[]).filter((row)=>String(row.target||"").includes(lotNo)),
        savedAt:new Date().toISOString(),
        savedBy:String(first.inspector||global.__QMES_USER__?.name||global.__QMES_USER__||"")
      };

      try{
        if(typeof global.qmesSyncUpsert==="function") await global.qmesSyncUpsert("pqc",newId,payload);
        if(typeof global.qmesSyncTombstoneInspection==="function") await global.qmesSyncTombstoneInspection("pqc",oldId,oldRows,"비정상 공정번호 숫자순번 형식 보정");
        console.info("[QMES] PQC 공정번호 보정:",oldId,"=>",newId);
      }catch(error){
        console.warn("PQC 공정번호 공용 DB 마이그레이션 실패:",oldId,newId,error);
      }
    }

    if(changed){
      if(typeof global.dbSave==="function") global.dbSave();
      global.dispatchEvent(new Event("qmes-pqc-number-normalized"));
    }
    return changed;
  }

  const original=global.qmesCreatePqcDraftForIssuedWorkOrder;
  if(typeof original==="function"){
    global.qmesCreatePqcDraftForIssuedWorkOrder=function(lotNo){
      const created=original.apply(this,arguments);
      if(!created || !Array.isArray(created.rows) || !created.rows.length) return created;
      const first=created.rows[0];
      const oldId=String(first.groupId||created.key||"").trim();
      const newId=nextAvailableId(first.date,oldId);
      if(!newId) return created;
      created.rows.forEach((row,index)=>{ row.groupId=newId; row.id=`${newId}-${index+1}`; });
      created.key=newId;
      if(created.payload) created.payload.rows=created.rows;
      return created;
    };
  }

  async function run(){
    try{
      const changed=await migrateMalformed();
      if(changed && typeof global.qmesSyncPullInspection==="function"){
        global.DB.insp.PQC=await global.qmesSyncPullInspection("pqc",global.DB.insp.PQC||[]);
        if(typeof global.dbSave==="function") global.dbSave();
      }
    }catch(error){ console.warn("PQC 공정번호 정규화 실패:",error); }
  }

  [700,1800,3500].forEach((delay)=>setTimeout(run,delay));
  global.addEventListener("qmes-pqc-reconciled",()=>setTimeout(run,150));
  global.addEventListener("focus",()=>setTimeout(run,150));
})(window);
