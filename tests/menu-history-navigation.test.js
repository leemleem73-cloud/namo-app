const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const code=fs.readFileSync(path.join(__dirname,'../public/js/qmes-menu-history-20261021.js'),'utf8');
function app({panels}={}){
 let active='incoming',index=0,mutate;
 const entries=[{existing:'preserved'}],winEvents={},docEvents={};
 const menuPages=new Set(['incoming','work','outgoing','ncr','equipment','purchase','adminEmployees']);
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
  window.qmesMenuHistory?.beforeMenu();
  active=page;window.qmesMenuHistory?.record(page);
 }
 const document={
  body:panels?{}:null,
  querySelector(selector){
   if(panels&&panels[selector])return panels[selector];
   if(selector.includes('.menu.active'))return {dataset:{page:active}};
   const page=selector.match(/data-page="([^"]+)"/)?.[1];
   return menuPages.has(page)?{click(){navigate(page);}}:null;
  },
  addEventListener(name,handler){docEvents[name]=handler;},
 };
 vm.runInNewContext(code,{window,document,history,queueMicrotask,MutationObserver:panels?class{constructor(handler){mutate=handler;}observe(){}}:undefined});
 return {window,history,entries,navigate,flushPanels:async()=>{mutate?.();await new Promise(setImmediate);},emitPop:state=>winEvents.popstate({state}),active:()=>active,key(key,extra={}){
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

test('NCR detail returns to its list before the previous menu, and forward restores the edited view',()=>{
 const a=app();let view='list',form=null,restored=0;
 a.window.qmesMenuHistory.register('incoming',{
  page:'incoming',capture:()=>({view,form}),
  reset:()=>{view='list';form=null;},
  restore:s=>{view=s.view;form=s.form;restored++;}
 });
 // The same adapter protocol is used for the NCR renderer.
 a.window.qmesMenuHistory.capture();
 view='detail';form={number:'NCR-20260120-001',value:'draft',save(){return 'wired';}};
 a.window.qmesMenuHistory.recordView('incoming','edit:1','incoming');
 form.value='changed';
 a.history.back();assert.equal(view,'list');assert.equal(a.active(),'incoming');
 a.history.forward();assert.equal(view,'detail');assert.equal(form.value,'changed');assert.equal(form.save(),'wired');assert.equal(restored,1);
 assert.equal(a.entries.length,2);
});
test('a detail remains reachable when navigating to another menu and back',()=>{
 const a=app();let detail='A';
 a.window.qmesMenuHistory.register('incoming',{page:'incoming',capture:()=>({detail}),reset:()=>{detail='';},restore:s=>{detail=s.detail;}});
 a.window.qmesMenuHistory.recordView('incoming','detail:A','incoming');
 a.navigate('work');a.history.back();assert.equal(a.active(),'incoming');assert.equal(detail,'A');
 a.history.back();assert.equal(a.active(),'incoming');assert.equal(detail,'');
 a.history.forward();assert.equal(detail,'A');a.history.forward();assert.equal(a.active(),'work');
 assert.equal(a.entries.length,3);
});
test('successive detail records replay the selected record without adding history',()=>{
 const a=app();let id='A';
 const h=a.window.qmesMenuHistory;
 h.register('incoming',{page:'incoming',capture:()=>({id}),reset:()=>{id='';},restore:s=>{id=s.id;h.recordView('incoming','detail:'+id,'incoming');}});
 h.recordView('incoming','detail:A','incoming');h.capture();id='B';h.recordView('incoming','detail:B','incoming');
 a.history.back();assert.equal(id,'A');a.history.forward();assert.equal(id,'B');assert.equal(a.entries.length,3);
});
test('shared workspace snapshots preserve live form objects and handlers across navigation',()=>{
 const a=app();let form={value:'unsaved',click(){return this.value;}},restored;
 a.window.qmesWorkspaceHistory={capture:()=>({form}),restore:s=>{restored=s.form;form=s.form;return true;}};
 a.window.qmesMenuHistory.openWorkspace('incoming');
 a.navigate('work');a.history.back();
 assert.equal(restored,form);assert.equal(restored.click(),'unsaved');assert.equal(a.entries.length,3);
});
test('a detail entry without its in-memory snapshot safely returns to the list',()=>{
 const a=app();a.emitPop({qmesMenuPage:'incoming',qmesViewKey:'edit:old',qmesAdapter:'missing',qmesEntryId:'expired'});
 assert.equal(a.history.state.qmesViewKey,'list');assert.equal(a.active(),'incoming');
});

test('actual NCR renderer adapter restores the report, controller and live field values',()=>{
 const a=app();a.navigate('ncr');
 const ncr=fs.readFileSync(path.join(__dirname,'../public/js/namo-qmes-ncr-20261020.js'),'utf8');
 const hook=ncr.slice(ncr.indexOf("var renderedView='list'"),ncr.indexOf("render();if(root.classList.contains('active'))"));
 const root={childNodes:[],classList:{contains:()=>a.active()==='ncr'},replaceChildren(...nodes){this.childNodes=nodes;}};
 const context=vm.createContext({window:a.window,root,Array});
 vm.runInContext("var view='list',selected=null;function render(){root.childNodes=[{view,selected,value:'initial'}];}"+hook,context);
 vm.runInContext("view='edit';selected={id:1,report_no:'NCR-20260120-001'};render();",context);
 root.childNodes[0].value='unsaved input';
 assert.equal(a.history.state.qmesViewKey,'edit:1');
 a.history.back();assert.equal(vm.runInContext('view',context),'list');assert.equal(a.active(),'ncr');
 a.history.forward();assert.equal(vm.runInContext('selected.report_no',context),'NCR-20260120-001');
 assert.equal(root.childNodes[0].value,'unsaved input');assert.equal(a.entries.length,3);
});

test('equipment panel observer restores detail nodes and hides them on list navigation',async()=>{
 const child={value:'detail field'},panel={className:'show',hidden:false,isConnected:true,childNodes:[child],firstElementChild:child,parentNode:{appendChild(){}},
  getAttribute(){return null;},removeAttribute(){},setAttribute(){},replaceChildren(...nodes){this.childNodes=nodes;this.firstElementChild=nodes[0];}};
 panel.classList={contains:name=>panel.className.includes(name),remove:()=>{panel.className='';}};
 const a=app({panels:{'#eqDetail':panel}});
 a.navigate('equipment');panel.className='show';await a.flushPanels();
 assert.equal(a.history.state.qmesAdapter,'equipment-detail');
 a.history.back();assert.equal(a.active(),'equipment');assert.equal(panel.className,'');
 a.history.forward();await a.flushPanels();
 assert.equal(panel.childNodes[0],child);assert.equal(panel.className,'show');assert.equal(a.entries.length,3);
});
