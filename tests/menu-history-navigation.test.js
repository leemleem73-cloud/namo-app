const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../public/js/qmes-menu-history-20261021.js'),'utf8');
function app(){
 let active='incoming',index=0;
 const entries=[{existing:'preserved'}],winEvents={},docEvents={};
 const menuPages=new Set(['incoming','work','outgoing','adminEmployees']);
 const window={addEventListener(name,handler){winEvents[name]=handler;}};
 const history={
  get state(){return entries[index];},
  replaceState(state){entries[index]=state;},
  pushState(state){entries.splice(index+1);entries.push(state);index++;},
  back(){if(index>0){index--;winEvents.popstate({state:entries[index]});}},
  forward(){if(index<entries.length-1){index++;winEvents.popstate({state:entries[index]});}},
 };
 function navigate(page){
  if(page==='adminEmployees')return;
  active=page;window.qmesMenuHistory?.record(page);
 }
 const document={
  querySelector(selector){
   if(selector.includes('.menu.active'))return {dataset:{page:active}};
   const page=selector.match(/data-page="([^"]+)"/)?.[1];
   return menuPages.has(page)?{click(){navigate(page);}}:null;
  },
  addEventListener(name,handler){docEvents[name]=handler;},
 };
 vm.runInNewContext(code,{window,document,history});
 return {window,history,entries,navigate,active:()=>active,key(key,extra={}){
  const event={key,target:{closest(){return null;}},preventDefault(){this.prevented=true;},...extra};
  docEvents.keydown(event);return event;
 }};
}
test('menu back/forward follows visits without creating replay entries',()=>{
 const a=app();a.navigate('work');a.navigate('outgoing');
 assert.equal(a.entries.length,3);
 a.history.back();assert.equal(a.active(),'work');
 a.history.back();assert.equal(a.active(),'incoming');
 a.history.forward();assert.equal(a.active(),'work');
 assert.equal(a.entries.length,3);
 assert.equal(a.history.state.existing,'preserved');
});
test('same menu is not duplicated and new visits replace forward history',()=>{
 const a=app();a.navigate('work');a.navigate('work');assert.equal(a.entries.length,2);
 a.navigate('outgoing');a.history.back();a.navigate('incoming');
 a.history.forward();assert.equal(a.active(),'incoming');assert.equal(a.entries.length,3);
});
test('Backspace navigates outside inputs and preserves editing and native modified shortcuts',()=>{
 const a=app();a.navigate('work');
 a.key('Backspace',{target:{closest(){return {};}}});assert.equal(a.active(),'work');
 a.key('Backspace',{ctrlKey:true});assert.equal(a.active(),'work');
 a.key('Backspace',{defaultPrevented:true});assert.equal(a.active(),'work');
 assert.equal(a.key('Backspace').prevented,true);assert.equal(a.active(),'incoming');
 a.key('BrowserForward');assert.equal(a.active(),'work');
});
test('permission-denied navigation does not create a visit',()=>{
 const a=app();a.navigate('adminEmployees');assert.equal(a.active(),'incoming');assert.equal(a.entries.length,1);
 a.window.qmesMenuHistory.record('missing');assert.equal(a.entries.length,1);
});
