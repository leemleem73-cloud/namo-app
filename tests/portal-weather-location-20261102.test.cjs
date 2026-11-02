const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../public/js/qmes-portal-weather-seasons-20261030.js'),'utf8');
const logic=source.slice(source.indexOf('// Weather location and forecast helpers.'),source.lastIndexOf('refresh();setInterval('));
class Node{constructor(){this.children=[];this.textContent='';this.attrs={};}append(...nodes){this.children.push(...nodes);}setAttribute(k,v){this.attrs[k]=v;}}
function env(mode='success'){
 let coords={latitude:37.566543,longitude:126.978321},area='Seoul',denied=mode==='denied';
 const calls=[],nodes=new Map(),cache=new Map([['qmes-chungju-weather-v1',JSON.stringify({at:Date.now(),data:{}})]]);
 const weather={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,new Node());return nodes.get(selector);}};
 const context={navigator:mode==='unsupported'?{}:{geolocation:{getCurrentPosition(ok,fail,options){assert.equal(options.enableHighAccuracy,false);if(denied)fail({code:1});else ok({coords});}}},
 weather,document:{hidden:false,createElement(){return new Node();}},localStorage:{getItem:k=>cache.get(k)||null,setItem:(k,v)=>cache.set(k,v)},AbortController,setTimeout,clearTimeout,console,
 fetch:async(url,options)=>{calls.push({url,options});return {ok:true,json:async()=>({nearest_area:[{areaName:[{value:area}]}],current_condition:[{temp_C:'17',weatherCode:'113'}],weather:[{mintempC:'7',maxtempC:'21'}]})};}};
 vm.runInNewContext(logic+';this.api={weatherCondition,forecastCondition,forecastDayRow,resolveAreaName,getWeatherLocation,refresh};',context);
 return {context,api:context.api,calls,nodes,cache,move(lat,lon,name){coords={latitude:lat,longitude:lon};area=name;},deny(){denied=true;}};
}
async function run(){
 const e=env();await e.api.refresh();
 assert.ok(e.calls[0].url.includes('/37.57,126.98?'));
 assert.equal(e.nodes.get('b').textContent,'서울');assert.equal(e.calls[0].options.credentials,'omit');
 assert.equal(e.cache.has('qmes-local-weather-v2:37.57,126.98'),true);assert.equal(e.cache.has('qmes-local-weather-v2:36.991,127.926'),false);
 await e.api.refresh();assert.equal(e.calls.length,1,'fresh same-location cache skips weather request');
 e.move(35.179554,129.075642,'Busan');await e.api.refresh();assert.ok(e.calls[1].url.includes('/35.18,129.08?'));assert.equal(e.nodes.get('b').textContent,'부산');
 e.deny();await e.api.refresh();assert.ok(e.calls[2].url.includes('/36.991,127.926?'));assert.equal(e.nodes.get('b').textContent,'충주');
 const denied=env('denied');await denied.api.refresh();assert.equal(denied.nodes.get('b').textContent,'충주');
 const unsupported=env('unsupported');await unsupported.api.refresh();assert.equal(unsupported.nodes.get('b').textContent,'충주');
 assert.equal(e.api.weatherCondition(119).label,'흐림');assert.equal(e.api.weatherCondition(296).label,'비');assert.equal(e.api.weatherCondition(332).label,'눈');
 assert.equal(e.api.forecastCondition({hourly:[{time:'0',weatherCode:'113'},{time:'1200',weatherCode:'296'}]}).label,'비');
 assert.equal(e.api.forecastCondition({}).label,'예보 없음');
 const row=e.api.forecastDayRow({date:'2026-11-03',mintempC:'2',maxtempC:'15',hourly:[{time:'1200',weatherCode:'119'}]},1);
 assert.equal(row.children[1].children[0].textContent,'2° / 15°');assert.equal(row.children[1].children[1].textContent,'☁️');assert.equal(row.children[1].children[1].attrs['aria-label'],'예상 날씨: 흐림');
 console.log('PASS: local coordinates, city label, city-isolated cache, relocation, denied/unsupported fallback, forecast icons and accessible daily rows');
}
run().catch(error=>{console.error(error);process.exitCode=1;});
