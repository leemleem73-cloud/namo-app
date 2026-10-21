const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../public/js/qmes-selection-lifecycle-20261021.js'),'utf8');
function box(){return {checked:true,indeterminate:true};}
function section(id,{stored=false,detached=false}={}){
 const row=box(),all=box(),businessOption=box(),ids=new Set(['record-1']);
 const actions=[{hidden:false,disabled:false,style:{setProperty(){}}}],bar={hidden:false};
 const count={textContent:'1'},dock={hidden:false,inert:false,visible:true,classList:{remove(){dock.visible=false;}},setAttribute(k,v){dock[k]=v;},querySelector(){return count;}};
 const offPage=box();
 const s={id,row,all,businessOption,ids,offPage,actions,bar,dock,count,_workDockCount:1,
  _inspectionAllRows:detached?[{querySelector:()=>offPage}]:[],
  querySelectorAll(selector){
   if(selector.includes('.iqc-select-row'))return [row,all];
   if(selector.includes('.iqc-bulk-delete'))return actions;
   if(selector.includes('.wo-bulk-controls'))return [bar];
   throw Error('Unexpected broad checkbox selector: '+selector);
  },querySelector:()=>dock};
 if(stored)s._resetListSelection=()=>{ids.clear();row.checked=false;all.checked=false;};
 return s;
}
function lifecycle(sections){
 const window={},document={querySelectorAll:selector=>{assert.equal(selector,'.module-page');return sections;}};
 vm.runInNewContext(code,{window,document});return window.qmesSelectionLifecycle;
}
test('only the active menu keeps its checks and stored selection across repeated menu changes',()=>{
 const work=section('work',{stored:true}),purchase=section('purchase',{stored:true}),ncr=section('ncr',{stored:true});
 const lifecycleApi=lifecycle([work,purchase,ncr]);lifecycleApi.clearInactive('purchase');
 assert.equal(work.ids.size,0);assert.equal(work.row.checked,false);assert.equal(ncr.ids.size,0);
 assert.equal(purchase.ids.size,1);assert.equal(purchase.row.checked,true);
 lifecycleApi.clearInactive('work');assert.equal(purchase.ids.size,0);assert.equal(work.ids.size,0);assert.equal(work.row.checked,false);
});
test('detached inspection rows, whole-page checks, action controls and dock are reset together',()=>{
 const process=section('process',{detached:true}),incoming=section('incoming');
 incoming._iqcSelectedIds=new Set(['other-page']);
 lifecycle([process,incoming]).clearInactive('ncr');
 assert.equal(process.offPage.checked,false);assert.equal(process.all.indeterminate,false);
 assert.equal(process.actions[0].hidden,true);assert.equal(process.actions[0].disabled,true);
 assert.equal(process.bar.hidden,true);assert.equal(process.dock.visible,false);assert.equal(process.dock.inert,true);
 assert.equal(process.count.textContent,'0');assert.equal(incoming._iqcSelectedIds.size,0);
});
test('business option checkboxes are preserved while row selections are cleared',()=>{
 const equipment=section('equipment');lifecycle([equipment]).clearInactive('work');
 assert.equal(equipment.row.checked,false);assert.equal(equipment.businessOption.checked,true);
});
test('existing incoming reset hook is honored and active page is untouched',()=>{
 const incoming=section('incoming'),active=section('work');let resets=0;
 incoming._resetIncomingSelection=()=>resets++;
 lifecycle([incoming,active]).clearInactive('work');
 assert.equal(resets,1);assert.equal(active.row.checked,true);assert.equal(active.dock.visible,true);
});
