/* NAMO QMES guest full sandbox runtime - 2026-09-14
 * guest / 1234 only: all UI functions may run, but browser storage and API writes
 * are isolated from Namo Chemical production data.
 */
(function installQmesGuestSandboxRuntime(global){
  'use strict';
  if(global.__QMES_GUEST_FULL_SANDBOX_RUNTIME_20260914__)return;
  global.__QMES_GUEST_FULL_SANDBOX_RUNTIME_20260914__=true;

  var USER_KEY='qmes-current-user-v1';
  var storageProto=global.Storage&&global.Storage.prototype;
  if(!storageProto)return;

  var previousGet=storageProto.getItem;
  var previousSet=storageProto.setItem;
  var previousRemove=storageProto.removeItem;
  var previousClear=storageProto.clear;
  var previousFetch=global.fetch.bind(global);

  var demoLocal=new Map();
  var demoSession=new Map();
  var seededLocal=new Set();
  var seededSession=new Set();

  var knownDemoLocalKeys=[
    'qmes-local-shipment-dashboard-v8-clean',
    'qmes-erp-sales-v1',
    'qmes-erp-plan-v1',
    'qmes-erp-purchase-v1',
    'qmes-erp-shipping-v1'
  ];

  function parse(value){try{return JSON.parse(String(value||''));}catch(_error){return null;}}
  function currentUser(){
    try{return parse(previousGet.call(global.sessionStorage,USER_KEY));}catch(_error){return null;}
  }
  function isGuest(user){
    return !!(user&&(
      String(user.role||'').toLowerCase()==='guest'||
      String(user.id||'').toLowerCase()==='guest'||
      String(user.uid||'').toUpperCase()==='GUEST'
    ));
  }
  function guestActive(){return isGuest(currentUser());}

  function seedLocalKey(name){
    if(seededLocal.has(name))return;
    seededLocal.add(name);
    try{
      var value=previousGet.call(global.localStorage,name);
      if(value!=null)demoLocal.set(name,String(value));
    }catch(_error){}
  }
  function seedSessionKey(name){
    if(seededSession.has(name))return;
    seededSession.add(name);
    try{
      var value=previousGet.call(global.sessionStorage,name);
      if(value!=null)demoSession.set(name,String(value));
    }catch(_error){}
  }
  function seedKnownDemo(){knownDemoLocalKeys.forEach(seedLocalKey);}

  storageProto.getItem=function(key){
    var name=String(key==null?'':key);
    if(!guestActive())return previousGet.call(this,key);
    if(this===global.localStorage){
      seedLocalKey(name);
      return demoLocal.has(name)?demoLocal.get(name):null;
    }
    if(this===global.sessionStorage){
      if(name===USER_KEY)return previousGet.call(this,key);
      seedSessionKey(name);
      return demoSession.has(name)?demoSession.get(name):null;
    }
    return previousGet.call(this,key);
  };

  storageProto.setItem=function(key,value){
    var name=String(key==null?'':key);
    var text=String(value==null?'':value);
    if(!guestActive())return previousSet.call(this,key,value);
    if(this===global.localStorage){
      seedLocalKey(name);
      demoLocal.set(name,text);
      return;
    }
    if(this===global.sessionStorage){
      if(name===USER_KEY)return previousSet.call(this,key,value);
      seedSessionKey(name);
      demoSession.set(name,text);
      return;
    }
    return previousSet.call(this,key,value);
  };

  storageProto.removeItem=function(key){
    var name=String(key==null?'':key);
    if(!guestActive())return previousRemove.call(this,key);
    if(this===global.localStorage){seedLocalKey(name);demoLocal.delete(name);return;}
    if(this===global.sessionStorage){
      if(name===USER_KEY)return previousRemove.call(this,key);
      seedSessionKey(name);demoSession.delete(name);return;
    }
    return previousRemove.call(this,key);
  };

  storageProto.clear=function(){
    if(!guestActive())return previousClear.call(this);
    if(this===global.localStorage){demoLocal.clear();seededLocal.clear();return;}
    if(this===global.sessionStorage){demoSession.clear();seededSession.clear();return;}
    return previousClear.call(this);
  };

  function apiResponse(data,message,status){
    var code=status||200;
    return new Response(JSON.stringify({success:code>=200&&code<300,message:message||'OK',data:data}),{
      status:code,
      headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'}
    });
  }
  function urlOf(input){
    try{
      if(typeof input==='string')return new URL(input,global.location.href);
      if(input&&input.url)return new URL(input.url,global.location.href);
    }catch(_error){}
    return null;
  }
  function requestMethod(input,init){return String((init&&init.method)||(input&&input.method)||'GET').toUpperCase();}
  async function requestBody(input,init){
    try{
      var body=init&&init.body;
      if(body==null&&input instanceof Request)body=await input.clone().text();
      if(typeof body==='string')return parse(body)||body;
      return body||null;
    }catch(_error){return null;}
  }

  global.fetch=async function qmesGuestSandboxFetch(input,init){
    var url=urlOf(input);
    var method=requestMethod(input,init);
    if(!guestActive()||!url||url.origin!==global.location.origin)return previousFetch(input,init);

    if(url.pathname==='/api/auth/logout'){
      demoLocal.clear();demoSession.clear();seededLocal.clear();seededSession.clear();
      return previousFetch(input,init);
    }

    if(url.pathname.startsWith('/api/')&&method!=='GET'&&method!=='HEAD'){
      var body=await requestBody(input,init);
      return apiResponse({demo:true,sandbox:true,method:method,path:url.pathname,payload:body},'DEMO 샌드박스 저장 완료',200);
    }

    return previousFetch(input,init);
  };

  function refreshBadge(){
    if(!guestActive())return;
    seedKnownDemo();
    var badge=document.getElementById('qmes-guest-demo-badge');
    if(badge)badge.innerHTML='<b>DEMO</b><span>게스트 · 독립 샌드박스 · 모든 기능 사용 가능</span>';
    document.documentElement.setAttribute('data-qmes-demo','true');
    global.__QMES_DEMO_MODE__=true;
    global.__QMES_DEMO_SANDBOX__={local:demoLocal,session:demoSession,reset:function(){demoLocal.clear();demoSession.clear();seededLocal.clear();seededSession.clear();seedKnownDemo();}};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refreshBadge,{once:true});
  else refreshBadge();
  global.addEventListener('load',refreshBadge,{once:true});
})(window);
