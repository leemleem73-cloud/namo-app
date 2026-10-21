const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const code=fs.readFileSync(process.env.HISTORY_SOURCE||__dirname+'/../public/js/qmes-menu-history-20261021.js','utf8');
function app(){
 let active='incoming',index=0;const entries=[{}],events={},docEvents={},pages={incoming:1,work:1};
 const window={addEventListener:(name,fn)=>events[name]=fn};
 const history={get state(){return entries[index]},replaceState:s=>entries[index]=s,pushState:s=>{entries.splice(index+1);entries.push(s);index++},back(){if(index>0)events.popstate({state:entries[--index]})},forward(){if(index<entries.length-1)events.popstate({state:entries[++index]})}};
 function navigate(page){window.qmesMenuHistory.beforeMenu();active=page;window.qmesMenuHistory.record(page)}
 function pager(page){const node={querySelectorAll:()=>[1,2,3].map(n=>button(page,n,node))};return node;}
 function button(page,n,node){const b={textContent:String(n),disabled:false,classList:{contains:()=>pages[page]===n},getAttribute:()=>null,closest:s=>s==='button'?b:s==='.ip-pagination'?node:s==='.module-page'?{id:page}:null,click(){docEvents.click?.({target:b});pages[page]=n}};return b;}
 const document={querySelector(s){if(s.includes('.menu.active'))return {dataset:{page:active}};const menu=s.match(/data-page="([^"]+)"/);if(menu)return {click:()=>navigate(menu[1])};const p=s.match(/^#(incoming|work) \.ip-pagination$/);return p?pager(p[1]):null;},addEventListener:(name,fn)=>docEvents[name]=fn};
 vm.runInNewContext(code,{window,document,history,queueMicrotask});
 return {window,history,entries,pages,navigate,async click(page,n){button(page,n,pager(page)).click();await new Promise(setImmediate);}};
}
test('1 → 2 → 3 returns through 2 → 1 and forward, without duplicate entries',async()=>{const a=app();await a.click('incoming',2);await a.click('incoming',3);assert.equal(a.entries.length,3);a.history.back();assert.equal(a.pages.incoming,2);a.history.back();assert.equal(a.pages.incoming,1);a.history.forward();assert.equal(a.pages.incoming,2);a.history.forward();assert.equal(a.pages.incoming,3);assert.equal(a.entries.length,3);});
test('clicking current page does not add history',async()=>{const a=app();await a.click('incoming',1);assert.equal(a.entries.length,1);await a.click('incoming',2);await a.click('incoming',2);assert.equal(a.entries.length,2);});
test('detail → Back restores its original list page before previous pagination',async()=>{const a=app();await a.click('incoming',2);let detail=null;const h=a.window.qmesMenuHistory;h.register('incoming',{page:'incoming',capture:()=>({detail}),reset:()=>detail=null,restore:s=>{detail=s.detail}});h.capture();detail='IQC detail';h.recordView('incoming','detail:42','incoming');a.history.back();assert.equal(detail,null);assert.equal(a.pages.incoming,2);a.history.back();assert.equal(a.pages.incoming,1);a.history.forward();assert.equal(a.pages.incoming,2);a.history.forward();assert.equal(detail,'IQC detail');assert.equal(a.entries.length,3);});
test('pagination remains associated with its menu and new choices truncate forward history',async()=>{const a=app();await a.click('incoming',2);a.navigate('work');await a.click('work',3);a.history.back();assert.equal(a.pages.work,1);a.history.back();assert.equal(a.pages.incoming,2);a.history.back();assert.equal(a.pages.incoming,1);await a.click('incoming',3);a.history.forward();assert.equal(a.pages.incoming,3);assert.equal(a.entries.length,2);});

