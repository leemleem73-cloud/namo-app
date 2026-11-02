'use strict';
const https=require('node:https');
function fetchJson(url){
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,data)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(data);};
  const request=https.get(url,{headers:{Accept:'application/json','User-Agent':'NAMO-QMES-Weather/1.0'}},response=>{
   if(response.statusCode!==200){response.resume();finish(Error('Weather upstream unavailable'));return;}
   let body='';response.setEncoding('utf8');
   response.on('data',chunk=>{body+=chunk;if(body.length>1048576){finish(Error('Weather response too large'));request.destroy();}});
   response.on('end',()=>{try{finish(null,JSON.parse(body));}catch(error){finish(error);}});
   response.on('error',error=>finish(error));
  });
  const timer=setTimeout(()=>{finish(Error('Weather upstream timeout'));request.destroy();},6000);
  request.on('error',error=>finish(error));
 });
}
function validWeather(data){const value=data?.current_condition?.[0]?.temp_C;return value!=null&&String(value).trim()!==''&&Number.isFinite(Number(value));}
function createHandler(options={}){
 const load=options.fetchJson||fetchJson,now=options.now||Date.now,cache=new Map(),pending=new Map();
 return async function portalWeather(req,res,next){
  if(String(req.path||'')!=='/api/qmes-portal-weather')return next();
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='GET')return res.status(405).json({success:false,message:'GET only'});
  const rawLat=req.query?.lat,rawLon=req.query?.lon;
  if(typeof rawLat!=='string'||typeof rawLon!=='string'||!rawLat.trim()||!rawLon.trim())return res.status(400).json({success:false,message:'Invalid coordinates'});
  const lat=Number(rawLat),lon=Number(rawLon);
  if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)return res.status(400).json({success:false,message:'Invalid coordinates'});
  const key=lat.toFixed(2)+','+lon.toFixed(2);let entry=cache.get(key);
  try{
   if(!entry||now()-entry.at>=600000){
    if(!pending.has(key))pending.set(key,load('https://wttr.in/'+key+'?format=j1&lang=ko').then(data=>{
     if(!validWeather(data))throw Error('Invalid weather response');
     const fresh={data,at:now()};cache.delete(key);cache.set(key,fresh);if(cache.size>128)cache.delete(cache.keys().next().value);return fresh;
    }).finally(()=>pending.delete(key)));
    entry=await pending.get(key);
   }
   return res.json({success:true,data:entry.data,at:entry.at,cached:false});
  }catch(_){
   if(entry&&now()-entry.at<3600000)return res.json({success:true,data:entry.data,at:entry.at,cached:true});
   return res.status(503).json({success:false,message:'날씨 제공처에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'});
  }
 };
}
module.exports=createHandler();module.exports.createHandler=createHandler;
