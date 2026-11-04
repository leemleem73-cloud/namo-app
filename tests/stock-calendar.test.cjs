const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../public/js/qmes-inspection-date-calendar-20261028.js','utf8');
function setup(width=900,left=100,viewport=1400,kind="orders"){
 const events={},nodes=[];const create=()=>({style:{},attrs:{},listeners:{},innerHTML:'',setAttribute(k,v){this.attrs[k]=v;},getBoundingClientRect(){return {height:340};},querySelectorAll:()=>[],addEventListener(k,fn){this.listeners[k]=fn;},remove(){this.removed=true;},contains:()=>false});
 const win={addEventListener:(name,fn)=>(events[name]??=[]).push(fn)};
 const doc={createElement:()=>{const node=create();nodes.push(node);return node;},getElementById:()=>null,querySelectorAll:()=>[],body:{append(){}},head:{append(){}}};
 const context={window:win,document:doc,MutationObserver:class{observe(){}},Date,Event,innerWidth:viewport,innerHeight:900};
 vm.runInNewContext(source,context);
 const input={value:'',isConnected:true,disabled:false,readOnly:false,attrs:{},dispatched:[],setAttribute(k,v){this.attrs[k]=v;},getBoundingClientRect:()=>({width,left,top:50,bottom:82}),closest:selector=>kind==='stock'?selector==='.ms-entry,.fg-dialog,.sg-inline'?{}:null:selector.includes('data-am-screen="orders"')?{}:null,focus(){},dispatchEvent(event){this.dispatched.push(event.type);}};
 function open(){events.pointerdown[0]({target:{closest:scope=>scope.includes('data-am-screen="orders"')?input:null},preventDefault(){},stopImmediatePropagation(){}});return nodes.find(node=>node.className?.includes(kind==='stock'?'qis-calendar-stock':'qis-calendar-orders'));}
 return {open,input,nodes};
}
test('orders calendar is enlarged, centered on the input and highlights today',()=>{
 const {open,input}=setup(),popup=open();assert.ok(popup);assert.equal(popup.style.width,'400px');assert.equal(popup.style.left,'350px');
 const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});assert.ok(popup.innerHTML.includes('data-day="'+today+'" aria-current="date"'));
 assert.ok(source.includes('.qis-calendar-orders .qis-cal-days button[aria-current=date]{background:#2689ef'));
 popup.listeners.click({stopPropagation(){},target:{closest:()=>({dataset:{day:'2026-11-10'},hasAttribute:()=>false})}});
 assert.equal(input.value,'2026-11-10');assert.deepEqual(input.dispatched,['input','change']);assert.ok(popup.removed);
});
test('calendar stays inside narrow screens and is shared by all order date inputs',()=>{
 const {open}=setup(290,20,360),popup=open();assert.equal(popup.style.width,'320px');assert.equal(popup.style.left,'6px');
 assert.ok(source.includes('#mainWorkspace .am-split[data-am-screen="orders"] input[type="date"]'));
});
test('calendar script compiles',()=>new vm.Script(source));

test('stock calendar fits its date input and uses the shared blue today style',()=>{const {open,input}=setup(256,90,1200,'stock'),popup=open();assert.ok(popup);assert.equal(popup.style.width,'256px');assert.equal(popup.style.left,'90px');const today=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});assert.ok(popup.innerHTML.includes('data-day="'+today+'" aria-current="date"'));assert.ok(source.includes('.ms-entry input[type="date"],.fg-dialog input[type="date"]'));assert.ok(source.includes('background:#2689ef!important;color:#fff!important'));popup.listeners.click({stopPropagation(){},target:{closest:()=>({dataset:{},hasAttribute:name=>name==='data-today'})}});assert.equal(input.value,today);assert.deepEqual(input.dispatched,['input','change']);});
test('stock calendar stays in the viewport and clear preserves a blank optional date',()=>{const {open,input}=setup(400,320,360,'stock'),popup=open();assert.equal(popup.style.width,'348px');assert.equal(popup.style.left,'6px');input.value='2026-11-01';popup.listeners.click({stopPropagation(){},target:{closest:()=>({dataset:{},hasAttribute:name=>name==='data-clear'})}});assert.equal(input.value,'');});
