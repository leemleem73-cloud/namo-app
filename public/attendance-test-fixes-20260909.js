(()=>{
'use strict';

const nativeFetch=window.fetch.bind(window);
const cleanText=v=>String(v??'').trim();
const titleOf=u=>cleanText(u?.title||u?.position||u?.jobTitle||u?.grade||'');
const isManager=u=>/부장/.test(titleOf(u));
const isInactive=u=>['REJECTED','INACTIVE','DISABLED','DELETED','WITHDRAWN'].includes(String(u?.status||'APPROVED').toUpperCase());
const keyOf=u=>String(u?.id||u?.uid||u?.email||u?.name||'');

function arrayFromPayload(payload){
  if(Array.isArray(payload))return payload;
  if(Array.isArray(payload?.data))return payload.data;
  return null;
}

async function loadDirectory(){
  for(const url of ['/api/attendance/directory','/api/admin/users']){
    try{
      const r=await nativeFetch(url,{credentials:'same-origin',cache:'no-store'});
      const p=await r.json();
      const list=arrayFromPayload(p);
      if(Array.isArray(list)&&list.length)return list;
    }catch(_error){}
  }
  return [];
}

function normalizedUser(u){
  if(!u)return u;
  const title=titleOf(u);
  return {...u,title:title||u?.title||''};
}

function buildReviewerList(reviewers,directory){
  const allReviewers=(reviewers||[]).filter(Boolean).map(normalizedUser);
  const allDirectory=(directory||[]).filter(Boolean).map(normalizedUser);

  const executives=allReviewers.filter(u=>!isManager(u)).slice(0,3);
  let manager=allReviewers.find(isManager);
  if(!manager){
    manager=allDirectory.find(u=>!isInactive(u)&&u?.email&&isManager(u));
  }

  const merged=[...executives];
  if(manager)merged.push(manager);

  // Preserve any existing valid reviewer entries if fewer than four were assembled,
  // but keep the manager inside the first four positions so reviewerCandidates().slice(0,4)
  // always shows the requested "임원 3명 + 부장 1명" structure when data exists.
  for(const u of allReviewers){
    if(merged.length>=4)break;
    const key=keyOf(u);
    if(!merged.some(x=>keyOf(x)===key))merged.splice(Math.max(0,merged.length-(manager?1:0)),0,u);
  }

  const deduped=[];
  for(const u of merged){
    const key=keyOf(u);
    if(!key||deduped.some(x=>keyOf(x)===key))continue;
    deduped.push(u);
  }

  if(manager){
    const managerKey=keyOf(manager);
    const withoutManager=deduped.filter(u=>keyOf(u)!==managerKey&&!isManager(u)).slice(0,3);
    return [...withoutManager,manager].slice(0,4);
  }
  return deduped.slice(0,4);
}

window.fetch=async function(input,init){
  const url=typeof input==='string'?input:String(input?.url||'');
  const response=await nativeFetch(input,init);
  if(!/\/api\/attendance\/reviewers(?:\?|$)/.test(url))return response;

  try{
    const payload=await response.clone().json();
    const reviewers=arrayFromPayload(payload);
    if(!Array.isArray(reviewers))return response;

    const directory=await loadDirectory();
    const nextList=buildReviewerList(reviewers,directory);
    const nextPayload=Array.isArray(payload)?nextList:{...payload,data:nextList};
    const headers=new Headers(response.headers);
    headers.set('content-type','application/json; charset=utf-8');
    headers.delete('content-length');
    return new Response(JSON.stringify(nextPayload),{
      status:response.status,
      statusText:response.statusText,
      headers
    });
  }catch(_error){
    return response;
  }
};
})();
