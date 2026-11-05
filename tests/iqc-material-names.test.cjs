const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../public/js/qmes-iqc-receipt-choices-20261029.js','utf8');
function fixture(current='',rows=[]){
 class El{
  constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.dataset={};this.style={setProperty(){}};this.listeners={};this._value='';}
  get options(){return this.children;}get lastElementChild(){return this.children.at(-1);}get selectedIndex(){return this.children.findIndex(o=>o.value===this.value);}
  get value(){return this._value;}set value(v){this._value=this.tagName==='SELECT'&&!this.children.some(o=>o.value===String(v))?'':String(v);}
  append(...xs){this.children.push(...xs);for(const x of xs)x.parent=this;}
  insertBefore(x,ref){const n=this.children.indexOf(ref);this.children.splice(n<0?this.children.length:n,0,x);}
  replaceChildren(...xs){this.children=[];this.append(...xs);this.value=xs[0]?.value||'';}
  before(x){this.wrapper=x;}setAttribute(k,v){this[k]=v;}addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}
  dispatchEvent(e){for(const f of this.listeners[e.type]||[])f(e);return true;}focus(){}replaceWith(){}
 }
 function Option(label,value){const e=new El('option');e.textContent=label;e.value=value;return e;}
 const control=new El('select');control.id='incomingMaterialName';control.append(new Option('선택',''));if(current)control.append(new Option(current,current));control.value=current;
 const document={querySelectorAll:()=>[control],getElementById:()=>null,createElement:t=>new El(t),head:new El('head')};
 class Event{constructor(type){this.type=type;}}
 const ctx={document,window:{},fetch:async()=>({ok:true,json:async()=>({success:true,data:rows})}),Option,Event,console};
 vm.runInNewContext(source,ctx);const manual=control.wrapper.children.find(e=>e.tagName==='INPUT');
 return {control,manual,Event};
}
test('material choices contain all photographed grades, and manual typing is the actual save-control value',async()=>{
 const f=fixture();await new Promise(setImmediate);
 const names=f.control.options.map(o=>o.value);
 for(const n of ['바인더 (PAI)','NMP','Boehmite (AOH30)','SBR (ADC30-G)','PVdF (Solef5130)','PVdF (Solef5140)','SBS (KTR201)','BYK180 (분산제)','__manual__'])assert.ok(names.includes(n),n);
 f.control.value='__manual__';f.control.dispatchEvent(new f.Event('change'));assert.equal(f.control.value,'');assert.equal(f.manual.hidden,false);
 f.manual.value='신규 연구 샘플 A';f.manual.dispatchEvent(new f.Event('input'));
 assert.equal(f.control.value,'신규 연구 샘플 A');assert.notEqual(f.control.value,'__manual__');
 f.manual.value='';f.manual.dispatchEvent(new f.Event('input'));assert.equal(f.control.value,'');
});
test('history aliases share proposed names while existing saved spelling and unknown grades remain untouched',async()=>{
 const f=fixture('PVDF (Solef 5130)',[{item:'PVDF (Solef 5130)'},{item:'PVdF (Solef5140)'},{item:'PVDF (Solef9999)'},{item:'AOH30 (Boehmite)'},{item:'분산제'},{item:'연구 샘플 B'}]);
 await new Promise(setImmediate);
 assert.equal(f.control.value,'PVDF (Solef 5130)');
 const names=f.control.options.map(o=>o.value);
 assert.equal(names.filter(v=>v==='Boehmite (AOH30)').length,1);
 assert.equal(names.filter(v=>v==='BYK180 (분산제)').length,1);
 assert.ok(names.includes('PVDF (Solef9999)'));assert.ok(names.includes('연구 샘플 B'));
 f.control.value='PVdF (Solef5140)';f.control.dispatchEvent(new f.Event('change'));assert.equal(f.control.value,'PVdF (Solef5140)');assert.equal(f.manual.hidden,true);
});
