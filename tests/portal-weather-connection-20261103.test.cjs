const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {createHandler}=require('../qmes-portal-weather-proxy-20261103.cjs');
const data={current_condition:[{temp_C:'14',weatherCode:'113'}],weather:[{date:'2026-11-03',mintempC:'4',maxtempC:'15'}]};
function response(){return {code:200,setHeader(){},status(code){this.code=code;return this;},json(body){this.body=body;return this;}};}
test('weather relay validates coordinates, rounds them and shares a cached request',async()=>{
 let count=0,url;const handler=createHandler({fetchJson:async value=>{count++;url=value;return data;}});
 const req={path:'/api/qmes-portal-weather',method:'GET',query:{lat:'36.991',lon:'127.926'}};
 const a=response(),b=response();await Promise.all([handler(req,a,()=>{}),handler(req,b,()=>{})]);
 assert.equal(count,1);assert.equal(a.body.data,data);assert.ok(url.includes('36.99,127.93'));
 await handler(req,response(),()=>{});assert.equal(count,1);
 const bad=response();await handler({...req,query:{lat:'',lon:'127'}},bad,()=>{});assert.equal(bad.code,400);
 const invalid=response();await handler({...req,query:{lat:'91',lon:'127'}},invalid,()=>{});assert.equal(invalid.code,400);
 let next=false;await handler({...req,path:'/other'},response(),()=>next=true);assert.ok(next);
});
test('relay returns recent same-location cache on outage and explicit failure after expiry',async()=>{
 let now=1000,fail=false;const handler=createHandler({now:()=>now,fetchJson:async()=>{if(fail)throw Error('offline');return data;}});
 const req={path:'/api/qmes-portal-weather',method:'GET',query:{lat:'36.99',lon:'127.93'}};
 await handler(req,response(),()=>{});fail=true;now+=700000;
 const stale=response();await handler(req,stale,()=>{});assert.equal(stale.body.cached,true);assert.equal(stale.body.at,1000);
 const other=response();await handler({...req,query:{lat:'37.5',lon:'127'}},other,()=>{});assert.equal(other.code,503);
 now+=3600000;const expired=response();await handler(req,expired,()=>{});assert.equal(expired.code,503);
});
const source=fs.readFileSync(__dirname+'/../public/js/qmes-portal-weather-seasons-20261030.js','utf8');
function helpers(overrides={}){
 const context={navigator:{},setTimeout:()=>1,clearTimeout(){},AbortController,Date,...overrides};
 vm.runInNewContext(source.slice(source.indexOf('function getWeatherLocation(){'),source.indexOf('// Location-specific weather state.')),context);
 vm.runInNewContext(source.slice(source.indexOf('async function fetchWeatherJson'),source.indexOf('async function refresh(){')),context);
 return context;
}
test('browser location cannot wait forever and late GPS cannot replace a completed fallback',async()=>{
 let timer,success;const ctx=helpers({navigator:{geolocation:{getCurrentPosition:fn=>success=fn}},setTimeout:fn=>{timer=fn;return 1;}});
 const pending=ctx.getWeatherLocation();timer();const place=await pending;assert.equal(place.fallback,true);
 success({coords:{latitude:37.5,longitude:127}});assert.equal(place.key,'chungju-default');
 const gps=helpers({navigator:{geolocation:{getCurrentPosition:fn=>fn({coords:{latitude:37.5678,longitude:126.978}})}}});
 const position=await gps.getWeatherLocation();assert.equal(position.lat,37.57);assert.equal(position.fallback,false);
});
test('client uses site relay first and direct provider only as compatibility fallback',async()=>{
 const urls=[];const ctx=helpers({fetch:async url=>{urls.push(url);return {ok:true,json:async()=>({success:true,data,at:1000})};}});
 const place={lat:36.99,lon:127.93};const result=await ctx.loadWeather(place);assert.equal(result.data,data);assert.equal(urls.length,1);assert.ok(urls[0].startsWith('/api/qmes-portal-weather?'));
 ctx.fetch=async url=>{urls.push(url);if(url.startsWith('/api/'))throw Error('relay restarting');return {ok:true,json:async()=>data};};
 const direct=await ctx.loadWeather(place);assert.equal(direct.data,data);assert.ok(urls.at(-1).startsWith('https://wttr.in/36.99,127.93'));
});
test('failed refresh exposes reconnect and retries in one minute',async()=>{
 const nodes=new Map();const node=key=>{if(!nodes.has(key))nodes.set(key,{textContent:'',hidden:true});return nodes.get(key);};
 const timers=[];const ctx={document:{hidden:false},weather:{querySelector:node},getWeatherLocation:async()=>({lat:36.99,lon:127.93,key:'place',fallback:false}),getCityLabel:async()=>'',localStorage:{getItem:()=>null,setItem(){}},loadWeather:async()=>{throw Error('offline');},setTimeout:(fn,ms)=>{timers.push({fn,ms});return timers.length;},clearTimeout(){},Date};
 vm.runInNewContext("let saved,areaLabel='현재 위치',activeLocationKey='',refreshing=false,lastWeatherError='',retryTimer;"+source.slice(source.indexOf('async function refresh(){'),source.indexOf('refresh();setInterval')),ctx);
 await ctx.refresh();assert.equal(node('.portal-weather-current').textContent,'날씨 연결 실패');assert.equal(node('.portal-weather-retry').hidden,false);assert.equal(node('.portal-weather-retry').disabled,false);assert.equal(timers.at(-1).ms,60000);
});
test('complete weather script compiles',()=>new vm.Script(source));
