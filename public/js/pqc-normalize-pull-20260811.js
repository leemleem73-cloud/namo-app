/* QMES: normalize malformed PQC group IDs and keep PQC rows in inspection-date order. */
(function(global){
  "use strict";
  if(global.__QMES_PQC_NORMALIZE_PULL_20260811_V2__) return;
  global.__QMES_PQC_NORMALIZE_PULL_20260811_V2__=true;

  const original=global.qmesSyncPullInspection;
  if(typeof original!=="function") return;

  function normalize(rows){
    if(!Array.isArray(rows)) return rows;
    const usedByDate=new Map();
    rows.forEach((row)=>{
      const gid=String(row?.groupId||"").trim();
      const date=String(row?.date||"").slice(0,10);
      if(!/^PQC-\d{6}-\d{4}$/.test(gid) || !date) return;
      if(!usedByDate.has(date)) usedByDate.set(date,new Set());
      usedByDate.get(date).add(gid);
    });

    const remap=new Map();
    rows.forEach((row)=>{
      const oldId=String(row?.groupId||"").trim();
      if(!/^PQC-\d{6}-/.test(oldId) || /^PQC-\d{6}-\d{4}$/.test(oldId)) return;
      if(remap.has(oldId)) return;
      const date=String(row?.date||"").slice(0,10);
      const compact=date.replace(/-/g,"");
      if(!/^\d{8}$/.test(compact)) return;
      const prefix=`PQC-${compact.slice(2)}-`;
      const used=usedByDate.get(date)||new Set();
      let seq=1;
      let candidate=`${prefix}${String(seq).padStart(4,"0")}`;
      while(used.has(candidate)){
        seq+=1;
        candidate=`${prefix}${String(seq).padStart(4,"0")}`;
      }
      used.add(candidate);
      usedByDate.set(date,used);
      remap.set(oldId,candidate);
    });

    const counters=new Map();
    const normalized=rows.map((row)=>{
      const oldId=String(row?.groupId||"").trim();
      const newId=remap.get(oldId);
      if(!newId) return row;
      const next=(counters.get(newId)||0)+1;
      counters.set(newId,next);
      return {...row,groupId:newId,id:`${newId}-${next}`};
    });

    return normalized
      .map((row,index)=>({row,index}))
      .sort((a,b)=>{
        const ad=String(a.row?.date||a.row?.shipDate||"").slice(0,10);
        const bd=String(b.row?.date||b.row?.shipDate||"").slice(0,10);
        if(ad!==bd) return ad.localeCompare(bd);
        const ag=String(a.row?.groupId||a.row?.id||"");
        const bg=String(b.row?.groupId||b.row?.id||"");
        if(ag!==bg) return ag.localeCompare(bg);
        return a.index-b.index;
      })
      .map((entry)=>entry.row);
  }

  global.qmesSyncPullInspection=async function(type,localRows){
    const rows=await original.apply(this,arguments);
    return String(type||"").toLowerCase()==="pqc" ? normalize(rows) : rows;
  };
})(window);
