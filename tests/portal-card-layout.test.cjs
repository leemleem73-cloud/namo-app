const test=require('node:test'),assert=require('node:assert/strict'),{decode,pack,move,overlap,mount}=require('../public/js/qmes-portal-card-layout-20261105.js');
function verify(layout,sizes,rows){for(const [name,p] of Object.entries(layout)){const size=Math.min(rows,sizes[name]);assert(p&&p.col>=0&&p.col<3&&p.row>=0&&p.row+size<=rows);}for(const [a,b] of [['memo','work'],['memo','guide'],['work','guide']])assert(!overlap(layout[a],Math.min(rows,sizes[a]),layout[b],Math.min(rows,sizes[b])));}
test('validates full-screen grid coordinates and safely ignores old orders or invalid positions',()=>{assert.deepEqual(decode('bad'),{});assert.deepEqual(decode(JSON.stringify({version:2,order:['guide']})),{});assert.deepEqual(decode(JSON.stringify({version:3,cards:{memo:{col:0,row:2},work:{col:99,row:0},injected:{col:0,row:0}}})),{memo:{col:0,row:2}});});
test('cards can move to left, center and right without overlapping; occupied slots swap when possible',()=>{
 const sizes={memo:4,work:4,guide:3},rows=15,layout=pack({},sizes,rows);assert.equal(layout.memo.col,0);assert.equal(layout.work.col,2);
 const center=move(layout,sizes,'memo',{col:1,row:0},rows);assert.equal(center.memo.col,1);verify(center,sizes,rows);
 const swapped=move(layout,sizes,'memo',{col:2,row:0},rows);assert.equal(swapped.memo.col,2);assert.equal(swapped.work.col,0);verify(swapped,sizes,rows);
 const left=move(layout,sizes,'work',{col:0,row:6},rows);assert.equal(left.work.col,0);assert.equal(left.work.row,6);verify(left,sizes,rows);
});
test('packing and moves remain bounded and collision-free with changing card heights',()=>{
 for(let rows=3;rows<16;rows++)for(let a=1;a<=rows;a+=2){const sizes={memo:a,work:Math.max(1,rows-a+1),guide:Math.min(rows,5)};let layout=pack({memo:{col:2,row:999},work:{col:2,row:999},guide:{col:2,row:999}},sizes,rows);verify(layout,sizes,rows);for(let i=0;i<9;i++){layout=move(layout,sizes,['memo','work','guide'][i%3],{col:i%3,row:i*3-5},rows);verify(layout,sizes,rows);}}
});
function style(){const values={};return new Proxy(values,{get:(o,k)=>k==='cssText'?JSON.stringify(o):o[k],set:(o,k,v)=>{if(k==='cssText'){for(const key of Object.keys(o))delete o[key];Object.assign(o,JSON.parse(v||'{}'));}else o[k]=v;return true;}});}
function node(){const classes=new Set(),e={style:style(),events:{},children:[],parent:null,attributes:{},className:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on?classes.add(v):classes.delete(v);}},setAttribute(k,v){this.attributes[k]=v;},addEventListener(n,f){this.events[n]=f;},append(...nodes){for(const child of nodes){child.remove();this.children.push(child);child.parent=this;}},remove(){if(this.parent){const i=this.parent.children.indexOf(this);if(i>=0)this.parent.children.splice(i,1);this.parent=null;}},replaceChildren(...nodes){for(const child of this.children)child.parent=null;this.children=[];this.append(...nodes);},closest(){return null;},setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured;},releasePointerCapture(){this.captured=false;},focus(){}};return e;}
function fixture(account='alice',storage=new Map()){
 const side=node(),head=node(),stage=node();stage.getBoundingClientRect=()=>({left:0,top:0,width:1200,height:800});
 const cards=['memo','work','guide'].map(name=>{const card=node(),handle=node();card.name=name;card.querySelector=()=>handle;card.getBoundingClientRect=()=>({left:Number.parseFloat(card.style.left)||900,top:Number.parseFloat(card.style.top)||100,width:Number.parseFloat(card.style.width)||287,height:130});return {name,card,handle};});
 side.append(...cards.map(v=>v.card));side.querySelector=s=>s==='.side-card'?cards[1].card:cards[2].card;
 const document={head,querySelector:()=>side,getElementById:id=>id==='stage'?stage:id==='personal-memo-card'?cards[0].card:null,createElement:()=>node()};
 const root={document,innerWidth:1400,innerHeight:800,location:{origin:'https://example.test'},parent:{__QMES_CURRENT_USER__:{id:account},postMessage(){}},events:{},addEventListener(n,f){this.events[n]=f;},requestAnimationFrame:f=>{f();return 1;},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
 mount(root);return {root,stage,cards,storage,button:stage.children.find(v=>v.className==='portal-grid-toolbar').children[1]};
}
test('full-screen drag persists a left-side position and restores only its account preference',()=>{
 const f=fixture();f.button.onclick();const item=f.cards[1],rect=item.card.getBoundingClientRect(),event={button:0,pointerId:1,clientX:rect.left+20,clientY:rect.top+20,target:item.handle,preventDefault(){}};
 item.handle.events.pointerdown(event);item.handle.events.pointermove({...event,clientX:87,clientY:266});item.handle.events.pointerup(event);
 const saved=decode(f.storage.get('namo-portal-card-grid-v3:alice'));assert.equal(saved.work.col,0);assert.equal(saved.work.row,4);
 const restored=fixture('alice',f.storage);assert.equal(restored.cards[1].card.style.left,item.card.style.left);
 const bob=fixture('bob',f.storage);assert.notEqual(bob.cards[1].card.style.left,item.card.style.left);
});
test('keyboard changes screen columns; ordinary buttons and normal mode never start a drag',()=>{
 const f=fixture(),item=f.cards[0],event={button:0,pointerId:1,clientX:0,clientY:0,target:item.handle,preventDefault(){throw Error('unexpected');}};item.handle.events.pointerdown(event);assert(!item.handle.captured);f.button.onclick();item.handle.events.pointerdown({...event,target:{closest:()=>({})}});assert(!item.handle.captured);
 item.handle.events.keydown({key:'ArrowRight',target:item.handle,preventDefault(){}});const saved=decode(f.storage.get('namo-portal-card-grid-v3:alice'));assert.equal(saved.memo.col,1);
 f.button.onclick();assert.equal(f.button.textContent,'카드 배열');assert.equal(item.handle.tabIndex,-1);
});
