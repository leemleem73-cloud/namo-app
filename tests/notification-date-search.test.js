const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../public/js/qmes-notification-dates-20261021.js','utf8');
const dates=require('../public/js/qmes-notification-dates-20261021.js');
test('KST date includes midnight and excludes next-day boundary correctly',()=>{assert.equal(dates.day('2026-10-20T15:00:00Z'),'2026-10-21');assert.equal(dates.day('2026-10-21T14:59:59Z'),'2026-10-21');assert.equal(dates.day('2026-10-21T15:00:00Z'),'2026-10-22');assert.equal(dates.day('bad'),'');});
test('presets handle week, month-end and leap-year boundaries',()=>{assert.deepEqual(dates.range('week','2026-01-03'),{from:'2025-12-27',to:'2026-01-03'});assert.deepEqual(dates.range('month','2026-03-31'),{from:'2026-02-28',to:'2026-03-31'});assert.equal(dates.range('month','2024-03-31').from,'2024-02-29');assert.deepEqual(dates.range('today','2026-10-21'),{from:'2026-10-21',to:'2026-10-21'});});
test('API ranges reject invalid or reversed dates and preserve optional unfiltered calls',()=>{for(const query of [{from:'2026-02-30'},{from:'2026-10-22',to:'2026-10-21'},{to:"2026-10-21' OR 1=1"}])assert.equal(dates.validateRange(query),null);assert.deepEqual(dates.validateRange({}),{from:null,to:null});assert.deepEqual(dates.validateRange({from:'2026-10-21',to:'2026-10-21'}),{from:'2026-10-21',to:'2026-10-21'});});
test('calendar and category filters combine and generate the historical query',()=>{
 const handlers={},input={value:'',addEventListener:(n,fn)=>handlers[n]=fn},buttons=['month','week','today'].map(p=>({dataset:{notifyPeriod:p},setAttribute(){}}));
 const bar={classList:{add(){}},querySelector:()=>input,querySelectorAll:()=>buttons,addEventListener:(n,fn)=>handlers[n]=fn};
 const make=(kind,date)=>({dataset:{kind,createdAt:date},hidden:false,classList:{toggle(_,hidden){this.owner.hidden=hidden;}}});
 const items=[make('work','2026-10-20T15:00:00Z'),make('iqc approval','2026-10-21T10:00:00Z'),make('work','2026-10-21T15:00:00Z')];items.forEach(i=>i.classList.owner=i);
 const empty={style:{}},list={querySelectorAll:()=>items},panel={classList:{contains:()=>false}};let kind='all';
 const document={getElementById:id=>({notifyPanel:panel,notifyDateLabel:bar,notifyList:list,notifyEmpty:empty}[id]),querySelector:()=>({dataset:{filter:kind}}),createElement:()=>({}),head:{appendChild(){}}};const window={};
 vm.runInNewContext(source,{window,document,Intl,Date});input.value='2026-10-21';handlers.change();assert.equal(window.qmesNotificationDates.query(),'?from=2026-10-21&to=2026-10-21');assert.deepEqual(items.map(i=>i.hidden),[false,false,true]);kind='work';window.qmesNotificationDates.apply();assert.deepEqual(items.map(i=>i.hidden),[false,true,true]);kind='oqc';window.qmesNotificationDates.apply();assert.equal(empty.style.display,'block');
});
test('full HTML and both server modules parse, including embedded print strings',()=>{
 const html=fs.readFileSync(__dirname+'/../public/index.html','utf8');let count=0;for(const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)){if(/src=|application\/json/.test(m[1])||!m[2].trim())continue;new vm.Script(m[2]);count++;}assert.ok(count>5);for(const name of ['qmes-quality-approval-safe.js','qmes-work-dispatch-20261014.js'])new vm.Script(fs.readFileSync(__dirname+'/../'+name,'utf8'));
});

