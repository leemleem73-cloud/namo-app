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
