const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../public/js/qmes-iqc-pqc-layout-20261021.js','utf8');
const start=source.indexOf('function singleIqcChecks'),end=source.indexOf('  const original',start);
const ctx={};vm.runInNewContext(source.slice(start,end)+(()=>{const index=fs.readFileSync(__dirname+'/../public/index.html','utf8');return index.slice(index.indexOf('function evaluateIqcItems'),index.indexOf('function iqcJudge'));})(),ctx);
function fixture(){
 const head={children:[]},cols=[],rows=[];
 function cell(parent,extra={}){const node={textContent:'',...extra,remove(){parent.splice(parent.indexOf(node),1);}};parent.push(node);return node;}
 for(let i=0;i<8;i++){cell(head.children);cell(cols,{style:{setProperty(name,value){this[name]=value;}}});}
 for(const name of ['외관','라벨','중량','COA 확인']){
  const row={children:[]};for(let i=0;i<8;i++)cell(row.children,i===4||i===5||i===6?{input:{value:name==='중량'?'150':'적합',attrs:{},setAttribute(k,v){this.attrs[k]=v;}}}:{});
  row.name=name;row.originalFirst=row.children[4];row.originalJudge=row.children[7];
  row.querySelector=selector=>selector==='.item'?{textContent:name}:row.children.find(cell=>cell.input)?.input;
  rows.push(row);
 }
 const table={dataset:{},querySelector:()=>head,querySelectorAll:selector=>selector==='colgroup col'?cols:rows};return {table,head,cols,rows};
}
test('four IQC checks each retain one original result control and their manual judgment',()=>{
 const {table,head,cols,rows}=fixture();ctx.singleIqcChecks(table);
 assert.equal(table.dataset.iqcSingleCheck,'1');assert.equal(head.children.length,6);assert.equal(head.children[4].textContent,'확인 결과');assert.ok(!head.children.some(cell=>/[123]차/.test(cell.textContent)));
 assert.equal(cols.length,6);assert.equal(cols.map(col=>Number(col.style.width.replace('%',''))).reduce((a,b)=>a+b,0),100);
 for(const row of rows){assert.equal(row.children.length,6);assert.equal(row.children[4],row.originalFirst);assert.equal(row.children[5],row.originalJudge);assert.equal(row.children.filter(cell=>cell.input).length,1);}
 assert.equal(rows[2].children[4].input.placeholder,'확인 중량 (kg)');
 ctx.singleIqcChecks(table);assert.equal(rows[0].children.length,6);
});
test('one saved result per check is compatible with IQC judgments, including COA failure',()=>{
 const items=['외관','라벨','중량','COA 확인'].map(name=>({name,values:[name==='중량'?'150':name==='COA 확인'?'확인':'적합'],judge:'합격'}));
 assert.equal(ctx.evaluateIqcItems(items),'합격');items[3].values=['미확인'];assert.equal(ctx.evaluateIqcItems(items),'불합격');items[3].values=['확인'];items[1].judge='대기';assert.equal(ctx.evaluateIqcItems(items),'대기');
});
test('PQC and OQC markup passes through unchanged',()=>{
 const context={window:{standardInspectionForm:type=>'original:'+type}};
 const first=source.slice(start,source.indexOf('  const style = document.createElement',end));vm.runInNewContext("(function(){"+first+"})();",context);
 assert.equal(context.window.standardInspectionForm('process'),'original:process');assert.equal(context.window.standardInspectionForm('outgoing'),'original:outgoing');
});
test('complete layout script compiles',()=>new vm.Script(source));

