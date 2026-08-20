/* QMES inventory physical rack master v3 - photo-confirmed locations including PAI, 2026-08-20. */
(function installInventoryPhysicalLocationMap(root,factory){
  "use strict";
  const api=factory();
  if(root) root.qmesInventoryPhysicalLocations=api;
  if(typeof module==="object"&&module.exports) module.exports=api;
})(typeof window!=="undefined"?window:globalThis,function createInventoryPhysicalLocationMap(){
  "use strict";

  const UNASSIGNED_LOCATION="UNASSIGNED";
  const RAW_LOCATIONS=[
    "A-1-1","A-1-2","A-2-1","A-2-2","A-3-1","A-3-2",
    "A-4-1","A-4-2","A-5-1","A-5-2","A-6-1","A-6-2"
  ];
  const FINISHED_LOCATIONS=["B-1-1","B-1-2","B-2-1","B-2-2","B-3-1","B-3-2"];
  const ALL_LOCATIONS=[...RAW_LOCATIONS,...FINISHED_LOCATIONS];

  // 사진 표찰과 현황판 기준 우선 위치. 수량과 LOT는 기존 DB 값을 그대로 사용한다.
  const RAW_RULES=[
    {id:"PAI",test:(value)=>value.includes("PAI"),locations:["A-1-1"]},
    {id:"SBS_PVDF",test:(value)=>value.includes("SBS")&&value.includes("PVDF"),locations:["A-1-1"]},
    {id:"SBS",test:(value)=>value.includes("SBS"),locations:["A-1-1","A-1-2"]},
    {id:"SBR",test:(value)=>value.includes("SBR"),locations:["A-2-1","A-2-2"]},
    {id:"BYK180",test:(value)=>value.includes("BYK180"),locations:["A-3-2","A-4-1"]},
    {id:"PVDF",test:(value)=>value.includes("PVDF")||value.includes("SOLEF5140"),locations:["A-3-1","A-3-2"]},
    {id:"AOH30",test:(value)=>value.includes("AOH30")||value.includes("BOEHMITE"),locations:["A-4-1","A-4-2"]},
    {id:"NMP",test:(value)=>value.includes("NMP"),locations:["A-5-1","A-5-2","A-6-2"]},
    {id:"KTR201",test:(value)=>value.includes("KTR201"),locations:["A-6-1"]}
  ];

  const text=(value)=>String(value==null?"":value).trim();
  const normalized=(value)=>text(value).toUpperCase().replace(/[\s_()\-+]/g,"");
  const quantity=(row)=>Number(row?.available_qty??row?.quantity??0)||0;
  const locationOf=(row)=>text(row?.location_code||row?.locationCode).toUpperCase();
  const lotOf=(row)=>text(row?.lot_no||row?.lotNo).toUpperCase();
  const itemText=(row)=>`${text(row?.item_code||row?.itemCode)} ${text(row?.item_name||row?.itemName)}`;

  function ruleFor(value){
    const key=normalized(value);
    return RAW_RULES.find((rule)=>rule.test(key))||null;
  }

  function rawCandidates(value){
    return ruleFor(value)?.locations.slice()||[];
  }

  function canonicalRawLocation(value){
    return rawCandidates(value)[0]||UNASSIGNED_LOCATION;
  }

  function locationLabel(value){
    return text(value).toUpperCase()===UNASSIGNED_LOCATION?"위치확인":text(value);
  }

  function sameRawItem(left,right){
    const leftRule=ruleFor(left);
    const rightRule=ruleFor(right);
    return Boolean(leftRule&&rightRule&&leftRule.id===rightRule.id);
  }

  function chooseRawReceiptLocation(value,stockRows){
    const candidates=rawCandidates(value);
    if(!candidates.length) return UNASSIGNED_LOCATION;
    const positive=(stockRows||[]).filter((row)=>quantity(row)>0);
    const sameItem=positive.find((row)=>candidates.includes(locationOf(row))&&sameRawItem(value,itemText(row)));
    if(sameItem) return locationOf(sameItem);
    const occupied=new Set(positive.map(locationOf));
    return candidates.find((location)=>!occupied.has(location))||"";
  }

  function chooseRawIssueLocation(value,lotNo,neededQty,stockRows){
    const lot=text(lotNo).toUpperCase();
    const needed=Math.max(0,Number(neededQty)||0);
    const matches=(stockRows||[]).filter((row)=>
      locationOf(row).startsWith("A-")
      && lotOf(row)===lot
      && quantity(row)>0
      && text(row?.quality_status||row?.qualityStatus).toUpperCase()==="AVAILABLE"
      && (!text(value)||sameRawItem(value,itemText(row)))
    ).sort((a,b)=>quantity(b)-quantity(a));
    const enough=matches.find((row)=>quantity(row)+1e-9>=needed);
    return enough?locationOf(enough):"";
  }

  function chooseFinishedLocation(value,stockRows){
    const target=normalized(value);
    const positive=(stockRows||[]).filter((row)=>quantity(row)>0&&FINISHED_LOCATIONS.includes(locationOf(row)));
    const sameProduct=positive.find((row)=>target&&normalized(itemText(row)).includes(target));
    if(sameProduct) return locationOf(sameProduct);
    const occupied=new Set(positive.map(locationOf));
    return FINISHED_LOCATIONS.find((location)=>!occupied.has(location))||"";
  }

  return {
    unassigned:UNASSIGNED_LOCATION,
    raw:RAW_LOCATIONS.slice(),
    finished:FINISHED_LOCATIONS.slice(),
    all:ALL_LOCATIONS.slice(),
    rawCandidates,
    canonicalRawLocation,
    locationLabel,
    chooseRawReceiptLocation,
    chooseRawIssueLocation,
    chooseFinishedLocation
  };
});
