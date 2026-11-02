const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../public/js/qmes-lot-documents-20261102.js');
const graphSource=fs.readFileSync(require.resolve('../public/js/qmes-lot-trace-linked-20261021.js'),'utf8');
const helpers=graphSource.slice(graphSource.indexOf('const $='),graphSource.indexOf("let mode='raw'"));
const graphFunctions=graphSource.slice(graphSource.indexOf('function judgement'),graphSource.indexOf('function table('));
const context={root:{querySelector(){}},window:{}};vm.runInNewContext(helpers+graphFunctions+';this.graphData=graphData;',context);
const sources=Array.from({length:9},(_,index)=>({label:String(index),rows:[]}));
sources[1].rows=[
 {id:'W1',workDate:'2026-11-02',productionType:'중간배치',fields:{'작업지시번호':'WO-1','생산 LOT NO':'MID-1','제품명':'중간재'},materials:[{name:'원료',lot:'RAW-1',plan:10,actual:9}]},
 {id:'W2',workDate:'2026-11-02',fields:{'작업지시번호':'WO-2','생산 LOT NO':'FIN-1','제품명':'완제품'},materials:[{name:'중간배치',lot:'MID-1',plan:5,actual:5}]},
 {id:'W3',fields:{'작업지시번호':'WO-3','생산 LOT NO':'FIN-10'},materials:[{name:'원료',lot:'RAW-10'}]}
];
sources[2].rows=[{id:1,date:'2026-11-01',lot:'RAW-1',items_json:JSON.stringify([{name:'외관',value:'이상없음',judge:'합격'}])},{id:2,lot:'RAW-10'}];
sources[3].rows=[{id:3,lot:'FIN-1',date:'2026-11-02',measurements:{점도:[11,12,13]}}];
sources[4].rows=[{id:4,lot:'FIN-1',date:'2026-11-02',check:'외관',value:'이상없음'},{id:5,lot:'FIN-1',date:'2026-11-02',check:'점도',value:'12'}];
sources[8].rows=[{id:6,report_no:'NCR-6',created_by_id:'USER-1',lot:'FIN-1',description:'부적합 내용',status:'OPEN'},{id:7,lot:'RAW-1'},{id:8,lot:'FIN-10'},{id:9,lot:'ONLY-NCR'}];
const traced=context.graphData(sources,'FIN-1','finished');
assert.deepEqual([...traced.lots].sort(),['FIN-1','MID-1','RAW-1']);
assert.deepEqual(traced.ncr.map(r=>r.id),[6,7]);assert.equal(traced.orders.length,2);assert.equal(traced.groups[2].rows.length,1);
const docs=core.documents(traced);assert.equal(docs.filter(d=>d.type==='work').length,2);assert.equal(docs.filter(d=>d.type==='oqc').length,1);assert.equal(docs.some(d=>d.lot==='FIN-10'),false);
const outgoing=docs.find(d=>d.type==='oqc');assert.match(core.preview(outgoing),/외관/);assert.match(core.preview(outgoing),/점도/);assert.match(core.preview(outgoing),/12/);
assert.match(core.preview(docs.find(d=>d.type==='iqc')),/이상없음/);
assert.match(core.preview(docs.find(d=>d.type==='work')),/RAW-1/);
const only=context.graphData(sources,'ONLY-NCR','raw');assert.equal(only.seeds.size,1);assert.equal(core.documents(only).length,1);
const missing=context.graphData(sources,'NO-SUCH-LOT','finished');assert.equal(missing.seeds.size,0);assert.equal(core.documents(missing).length,0);
const partial=sources.map(s=>({...s}));partial[8]={label:'부적합보고서',rows:[],error:'권한 없음'};assert.equal(context.graphData(partial,'FIN-1','finished').errors.length,1);
const escaped=core.preview({type:'ncr',title:'<img src=x onerror=evil()>',lot:'<script>evil()</script>',date:'',status:'',record:{description:'<svg onload=evil()>'}});assert.doesNotMatch(escaped,/<script>|<img|<svg/);assert.match(escaped,/&lt;svg/);

class Node{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.listeners={};this.parts={};this.dataset={};this.attrs={};this.isConnected=true;this.open=false;this.value='';this.textContent='';this.innerHTML='';}
 append(...nodes){for(const n of nodes){n.parent=this;n.isConnected=true;this.children.push(n);}}
 before(node){const siblings=this.parent.children;node.parent=this.parent;node.isConnected=true;siblings.splice(siblings.indexOf(this),0,node);}
 remove(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.isConnected=false;}
 replaceChildren(...nodes){this.children=[];this.append(...nodes);}
 setAttribute(k,v){this.attrs[k]=v;}
 addEventListener(type,fn){this.listeners[type]=fn;}
 querySelector(selector){return this.parts[selector]||(this.parts[selector]=new Node());}
 showModal(){this.open=true;}
 close(){this.open=false;this.listeners.close?.();}
 focus(){this.focused=true;}
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function ui(){
 const container=new Node(),result=new Node();container.append(result);const listeners={},requests=[],body=new Node();
 const document={body,head:new Node(),activeElement:new Node('button'),getElementById:id=>id==='lotResultBody'?result:null,querySelector:()=>container.children.find(n=>n.className==='ltd-panel')||null,createElement:tag=>new Node(tag),addEventListener(type,fn){(listeners[type]||=[]).push(fn);}};
 const win={document,setTimeout,clearTimeout,addEventListener(){},fetch(url,options){return new Promise(resolve=>requests.push({url,options,resolve}));}};
 core.install(win);const send=(type,detail)=>{for(const listener of listeners[type]||[])listener({detail});};
 send('qmes-lot-result',traced);let panel=document.querySelector();assert.ok(panel);assert.match(panel.querySelector('.ltd-list').innerHTML,/NCR-6/);
 panel.querySelector('select').value='ncr';panel.querySelector('select').onchange();assert.doesNotMatch(panel.querySelector('.ltd-list').innerHTML,/WO-1/);
 let workIndex=docs.findIndex(d=>d.type==='work');panel.onclick({target:{closest:()=>({dataset:{ltdDocument:String(workIndex)}})}});
 let dialog=body.children.find(n=>n.open);assert.ok(dialog);assert.match(dialog.innerHTML,/原料|원료 투입내역/);assert.equal(requests.length,0,'opening work order is read-only and makes no write request');
 dialog.querySelector('[data-ltd-close]').onclick();assert.equal(dialog.open,false);
 const legacyIndex=docs.findIndex(d=>d.type==='ncr'&&!d.record.created_by_id);panel.onclick({target:{closest:()=>({dataset:{ltdDocument:String(legacyIndex)}})}});
 dialog=body.children.find(n=>n.open);assert.match(dialog.innerHTML,/첨부파일 연결정보/);assert.equal(requests.length,0,'never look up report attachments using a legacy nonconform ID');dialog.close();
 const ncrIndex=docs.findIndex(d=>d.type==='ncr');panel.onclick({target:{closest:()=>({dataset:{ltdDocument:String(ncrIndex)}})}});
 dialog=body.children.find(n=>n.open);assert.equal(requests[0].url,'/api/qmes-ncr/reports/6/attachments');assert.equal(requests[0].options.method,undefined);
 requests[0].resolve({ok:true,json:async()=>({success:true,data:[{id:14,file_name:'현장 사진.jpg'}]})});await tick();
 const attachment=dialog.querySelector('.ltd-attachments').children[0];assert.equal(attachment.href,'/api/qmes-ncr/attachments/14/download');assert.equal(attachment.textContent,'현장 사진.jpg');
 send('qmes-lot-reset');assert.equal(document.querySelector(),null);assert.equal(dialog.open,false);
 send('qmes-lot-result',traced);panel=document.querySelector();panel.onclick({target:{closest:()=>({dataset:{ltdDocument:String(ncrIndex)}})}});
 const pending=requests[1];send('qmes-lot-reset');assert.equal(pending.options.signal.aborted,true);pending.resolve({ok:true,json:async()=>({success:true,data:[{id:99,file_name:'stale'}]})});await tick();assert.equal(body.children.some(n=>n.open),false);
 assert.equal(requests.every(r=>!r.options.method),true);
 console.log('PASS: exact and transitive LOT links, NCR-only match, grouped inspection detail, partial failures, escaped previews, filtering, read-only viewers, attachment downloads, stale-view cancellation');
}
ui().catch(error=>{console.error(error);process.exitCode=1;});
