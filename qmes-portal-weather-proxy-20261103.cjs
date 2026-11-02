'use strict';
const https=require('node:https');
function fetchJson(url){
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,data)=>{if(settled)return;settled=true;clearTimeout(timer);error?reject(error):resolve(data);};
  const request=https.get(url,{headers:{Accept:'application/json','User-Agent':'NAMO-QMES/1.1 (https://qmes.namochemical.com/)'}},response=>{
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
function metCode(symbol){
 const value=String(symbol||'');
 if(/thunder/.test(value))return 200;
 if(/snow|sleet/.test(value))return 338;
 if(/rain/.test(value))return 296;
 if(/fog/.test(value))return 248;
 if(/partlycloudy|fair/.test(value))return 116;
 if(/cloudy/.test(value))return 119;
 if(/clearsky/.test(value))return 113;
 return null;
}
function normalizeMetForecast(payload,now=Date.now()){
 const series=payload?.properties?.timeseries;
 if(!Array.isArray(series)||!series.length)throw Error('Empty MET forecast');
 const usable=series.filter(row=>{
  const value=row?.data?.instant?.details?.air_temperature;
  return value!=null&&Number.isFinite(Number(value))&&Number.isFinite(Date.parse(row.time));
 });
 const first=usable.filter(row=>Date.parse(row.time)>=now-3600000).sort((a,b)=>Math.abs(Date.parse(a.time)-now)-Math.abs(Date.parse(b.time)-now))[0];
 if(!first||Math.abs(Date.parse(first.time)-now)>10800000)throw Error('Outdated MET forecast');
 const local=time=>new Date(Date.parse(time)+32400000).toISOString().slice(0,10);
 const today=local(new Date(now).toISOString()),days=new Map();
 const symbol=row=>row.data.next_1_hours?.summary?.symbol_code||row.data.next_6_hours?.summary?.symbol_code||row.data.next_12_hours?.summary?.symbol_code;
 for(const row of usable){
  const date=local(row.time);if(date<today)continue;
  if(!days.has(date))days.set(date,[]);days.get(date).push(row);
 }
 const details=first.data.instant.details;
 return {source:'metno',provider:'MET Norway',forecastNote:'일별 최저·최고는 제공된 시간대의 예보 기준입니다.',
 current_condition:[{temp_C:String(details.air_temperature),humidity:details.relative_humidity??'-',windspeedKmph:Number.isFinite(Number(details.wind_speed))?String(Math.round(Number(details.wind_speed)*3.6)):'-',weatherCode:metCode(symbol(first)),localObsDateTime:first.time+' (예보)'}],
 weather:[...days.entries()].sort(([a],[b])=>a.localeCompare(b)).slice(0,3).map(([date,rows])=>{
  const temperatures=rows.map(r=>Number(r.data.instant.details.air_temperature));
  const noon=rows.reduce((best,row)=>Math.abs((Date.parse(row.time)+32400000)%86400000-43200000)<Math.abs((Date.parse(best.time)+32400000)%86400000-43200000)?row:best);
  return {date,mintempC:String(Math.round(Math.min(...temperatures))),maxtempC:String(Math.round(Math.max(...temperatures))),weatherCode:metCode(symbol(noon))};
 })};
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
    if(!pending.has(key))pending.set(key,(async()=>{
     try{return normalizeMetForecast(await load('https://api.met.no/weatherapi/locationforecast/2.0/compact?lat='+lat.toFixed(2)+'&lon='+lon.toFixed(2)),now());}
     catch(_){return await load('https://wttr.in/'+key+'?format=j1&lang=ko');}
    })().then(data=>{
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

module.exports.normalizeMetForecast=normalizeMetForecast;
module.exports.metCode=metCode;
