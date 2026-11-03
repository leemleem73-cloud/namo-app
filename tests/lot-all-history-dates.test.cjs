const test=require('node:test'),assert=require('node:assert/strict');
const finder=require('../public/js/qmes-lot-date-search-20261102.js'),sheet=require('../public/js/qmes-lot-daily-sheet-20261102.js');
const sources=()=>Array.from({length:9},(_,i)=>({rows:[],label:'source '+i}));
test('2025 receipt/inspection dates are included without inventing a work order',()=>{
 const s=sources();s[2].rows=[{id:'iqc-2025',date:'2025-09-11',lot:'002708935',item:'분산제',judge:'합격',items_json:[{name:'외관',value:'적합',judge:'합격'}]}];
 assert.ok(finder.sheetDatesFromSources(s).includes('2025-09-11'));
 const result=sheet.buildDay(s,'2025-09-11',()=>{throw Error('must not fabricate production links');});
 assert.equal(result.orders.length,0);assert.equal(result.lotCount,0);assert.equal(result.inspectionCount,1);assert.equal(result.entries[0].eventLot,'2708935');assert.equal(result.entries[0].lot,'-');
 const html=sheet.markup(result);assert.ok(html.includes('분산제'));assert.ok(html.includes('2025-09-11'));assert.ok(html.includes('수입검사'));
});
test('all-history dates combine saved production, sync inspections and shipping and reject deleted records',()=>{
 const s=sources();s[0].rows=[{workDate:'2025-10-06',finishedLot:'F'}];s[1].rows=[{workDate:'2026-10-06',fields:{'생산 LOT NO':'F2'}}];s[5].rows=[{payload:{rows:[{date:'2025-12-01'},{date:'2025-12-02',deleted:true}]}}];s[7].rows=[{record_key:'erp:shipping',payload:{rows:[{date:'2025-11-01'}]}},{record_key:'erp:sales',payload:{rows:[{date:'2024-01-01'}]}}];
 const dates=finder.sheetDatesFromSources(s);assert.ok(dates.includes('2025-10-06'));assert.ok(dates.includes('2026-10-06'));assert.ok(dates.includes('2025-12-01'));assert.ok(dates.includes('2025-11-01'));assert.ok(!dates.includes('2025-12-02'));assert.ok(!dates.includes('2024-01-01'));
});
test('legacy actual-only production date displays recorded LOT without a fake planned quantity',()=>{
 const s=sources();s[0].rows=[{workDate:'2025-10-06',finishedLot:'FIN',lotNo:'RAW',inputQty:10,material:'NMP',worker:'작업자'}];
 const result=sheet.buildDay(s,'2025-10-06',()=>({actual:s[0].rows,groups:[],ncr:[],shipping:[]}));
 assert.equal(result.orders.length,0);assert.equal(result.lotCount,1);assert.equal(result.overviewRecords[0][4],'-');assert.ok(result.entries.some(e=>e.type==='작업실적'));
});
