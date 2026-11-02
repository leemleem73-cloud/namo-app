const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/js/qmes-chemical-enterprise-ui-20261022.js'),'utf8');
const rules=require('../public/js/qmes-oqc-rules-20261019.js');
const ctx={window:{qmesOqcRules:rules}};
vm.runInNewContext("const fmt=v=>Number(v).toLocaleString('en-US',{maximumFractionDigits:3});"+source.slice(source.indexOf('function spcNumber'),source.indexOf('function trendSvg')),ctx);
test('SPC uses strict outgoing numeric parsing, without rescaling decimals',()=>{
 for(const value of ['',null,undefined,' ','Overflow','12abc','1,49'])assert.equal(ctx.spcNumber(value),null);
 assert.equal(ctx.spcNumber('0'),0);
 assert.equal(ctx.spcNumber('1,498'),1498);
 assert.equal(ctx.spcNumber('20.126'),20.126);
 assert.equal(ctx.spcFmt(null),'-');
});
test('SPC averages first outgoing check per LOT/date, excluding blanks and extra slots',()=>{
 const rows=[
 {date:'2026-10-06',lot:'A',product:'P',check:'점도',measurements:['1,498','',null]},
 {date:'2026-10-06',lot:'B',product:'P',check:'점도',measurements:['1500','1502','1504','9999']},
 {date:'2026-10-06',lot:'A',product:'P',check:'점도',measurements:['9999','9999','9999']},
 {deleted:true,date:'2026-10-06',lot:'C',check:'점도',measurements:['1']}];
 const flat=ctx.flattenMeasurements(rows,'OQC');
 assert.equal(flat.length,4);
 const summary=ctx.spcOverviewRows(flat,'점도');
 assert.equal(summary.length,2);
 assert.equal(summary.find(x=>x.lot==='A').value,1498);
 assert.equal(summary.find(x=>x.lot==='B').value,1502);
});
test('SPC preserves decimal precision and outgoing value fallback and aliases',()=>{
 const flat=ctx.flattenMeasurements([
 {date:'2026-10-06',lot:'C',check:'고형분',measurements:['20.126','20.224','20.202']},
 {date:'2026-10-06',lot:'D',check:'수분',measurements:[],value:'435.5 / 449.3 / 417.1'}],'OQC');
 assert.equal(flat.length,6);
 assert.equal(flat[3].item,'수분율');
 assert.ok(Math.abs(ctx.stats(flat.filter(x=>x.lot==='C'),'고형분').avg-20.184)<1e-10);
});
test('complete enterprise UI compiles',()=>new vm.Script(source));
const selectionRows=[
 {date:'2026-10-15',customer:'고객 A',product:'NBA',lot:'LOT-A',check:'점도',measurements:['1300','1400','1500']},
 {date:'2026-10-06',customer:'고객 A',product:'NBA',lot:'LOT-B',check:'점도',measurements:['1500','1600','1700']},
 {date:'2026-10-15',customer:'고객 A',product:'NBA',lot:'LOT-C',check:'점도',measurements:['1600','1700','1800']},
 {date:'2026-10-15',customer:'고객 B',product:'NBA',lot:'LOT-D',check:'점도',measurements:['1200','1250','1300']}
];
test('selection uses date, customer, product and LOT; graph scope does not change details',()=>{
 const raw=ctx.flattenMeasurements(selectionRows,'OQC'),overview=ctx.spcOverviewRows(raw,'점도');
 const chosen=overview.find(r=>r.lot==='LOT-A'),key=ctx.spcRowKey(chosen);
 const all=ctx.spcSelection(raw,overview,key,'all','점도');
 assert.equal(all.row.lot,'LOT-A');assert.equal(all.raw.length,3);
 assert.equal(all.chart.length,2);assert.equal(all.chart[1].count,6);
 assert.equal(all.chart[1].lot.includes('LOT-D'),false);
 const date=ctx.spcSelection(raw,overview,key,'date','점도');
 assert.equal(date.chart.length,3);assert.equal(date.chart[0].value,1300);
 assert.ok(date.chart.every(r=>r.lot==='LOT-A'));
 assert.equal(date.row.value,1400);
 assert.equal(ctx.spcSelection(raw,overview,'removed','all','점도').row,null);
});
// Render the real paintSpc function and drive its actual click/change listeners.
function renderHarness(){
 const root={dataset:{spcItem:'점도'},html:'',nodes:[],get innerHTML(){return this.html;},set innerHTML(html){
  this.html=html;this.nodes=[];
  for(const match of html.matchAll(/<(button|input|select)\b([^>]*)>/g)){
   const attrs={};for(const a of match[2].matchAll(/([\w-]+)="([^"]*)"/g))attrs[a[1]]=a[2];
   const node={attrs,dataset:{},listeners:{},value:attrs.value||'',disabled:/\bdisabled\b/.test(match[2]),addEventListener(type,fn){this.listeners[type]=fn;}};
   for(const [key,value] of Object.entries(attrs))if(key.startsWith('data-'))node.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;
   if(match[1]==='select'){
    const body=html.slice(match.index+match[0].length).split('</select>')[0];
    const selected=body.match(/<option value="([^"]*)" selected/);node.value=selected?selected[1]:'';
   }
   this.nodes.push(node);
  }
 },querySelectorAll(selector){return this.nodes.filter(n=>(n.attrs.class||'').split(' ').includes(selector.slice(1)));},querySelector(selector){return this.querySelectorAll(selector)[0]||null;}};
 const runtime={window:{qmesOqcRules:rules},document:{getElementById:()=>root},requestAnimationFrame:fn=>fn(),Date,console};
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 runtime.esc=esc;runtime.fmt=v=>Number(v).toLocaleString('en-US',{maximumFractionDigits:3});
 vm.runInNewContext(source.slice(source.indexOf('function spcNumber'),source.indexOf('  const changeQueries')),runtime);
 runtime.fixture=selectionRows;
 vm.runInNewContext('spcRows=fixture;spcLoadedAt=Date.now();renderSpc();',runtime);
 return {root,runtime};
}
test('real product clicks highlight one row and show only its detail; modes preserve selection',()=>{
 const {root}=renderHarness();
 assert.equal((root.html.match(/class="spc-row-selected"/g)||[]).length,0);
 const clickLot=lot=>root.querySelectorAll('.spc-product-link').find(n=>JSON.parse(decodeURIComponent(n.dataset.spcRow))[3]===lot).listeners.click();
 clickLot('LOT-A');
 assert.equal((root.html.match(/class="spc-row-selected"/g)||[]).length,1);
 let detail=root.html.split('선택한 출하검사 상세')[1];
 assert.ok(detail.includes('LOT-A'));assert.ok(!detail.includes('LOT-B'));assert.ok(!detail.includes('LOT-C'));
 assert.ok(root.html.includes('전체 날짜 추이'));
 root.querySelectorAll('.spc-graph-mode').find(n=>n.dataset.spcMode==='date').listeners.click();
 assert.equal(root.dataset.spcGraphMode,'date');
 assert.equal((root.html.match(/class="spc-row-selected"/g)||[]).length,1);
 assert.ok(root.html.includes('측정 1'));
 clickLot('LOT-B');
 detail=root.html.split('선택한 출하검사 상세')[1];assert.ok(detail.includes('LOT-B'));assert.ok(!detail.includes('LOT-A'));
 root.querySelector('.spc-customer').value='고객 B';root.querySelector('.spc-customer').listeners.change();
 assert.equal(root.dataset.spcSelectedRow,undefined);
 assert.ok(!root.html.includes('선택한 출하검사 상세'));
 assert.equal((root.html.match(/class="spc-row-selected"/g)||[]).length,0);
});
