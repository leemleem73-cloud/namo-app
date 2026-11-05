const test=require('node:test'),assert=require('node:assert/strict'),{decode,clampPoint,toNormalized,fromNormalized,legacy,snap,mount}=require('../public/js/qmes-portal-card-layout-20261105.js');
test('full canvas includes exact left, top, right and bottom edges without column snapping',()=>{
 const screen={width:1200,height:800},size={width:287,height:130};
 assert.deepEqual(clampPoint({x:-100,y:-100},screen,size),{x:0,y:0});
 assert.deepEqual(clampPoint({x:5000,y:5000},screen,size),{x:913,y:670});
 for(const x of [0,1,37,183,401,912,913]){const p={x,y:117};const normalized=toNormalized(p,screen,size),actual=fromNormalized(normalized,screen,size);assert(Math.abs(actual.x-x)<.0001);assert.equal(actual.y,117);}
});
test('position data is validated and old left-column cards migrate to the actual left edge',()=>{
 assert.deepEqual(decode('bad'),{});assert.deepEqual(decode(JSON.stringify({version:4,cards:{memo:{x:0,y:.2},work:{x:2,y:0}}})),{memo:{x:0,y:.2}});
 const old=JSON.stringify({version:3,cards:{memo:{col:0,row:1},work:{col:2,row:0}}}),migrated=legacy(old,{width:1200,height:800},{memo:{height:130},work:{height:130}});assert.equal(migrated.memo.x,0);assert.equal(migrated.work.x,1);
});
function style(){const values={};return new Proxy(values,{get:(o,k)=>k==='cssText'?JSON.stringify(o):o[k],set:(o,k,v)=>{if(k==='cssText'){for(const key of Object.keys(o))delete o[key];Object.assign(o,JSON.parse(v||'{}'));}else o[k]=v;return true;}});}
function node(){const classes=new Set(),e={style:style(),events:{},children:[],parent:null,attributes:{},className:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on?classes.add(v):classes.delete(v);}},setAttribute(k,v){this.attributes[k]=v;},addEventListener(n,f){this.events[n]=f;},append(...nodes){for(const child of nodes){child.remove();this.children.push(child);child.parent=this;}},remove(){if(this.parent){const i=this.parent.children.indexOf(this);if(i>=0)this.parent.children.splice(i,1);this.parent=null;}},replaceChildren(...nodes){for(const child of this.children)child.parent=null;this.children=[];this.append(...nodes);},closest(){return null;},setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured;},releasePointerCapture(){this.captured=false;},focus(){}};return e;}
function fixture(account='alice',storage=new Map()){
 const side=node(),head=node(),stage=node();stage.getBoundingClientRect=()=>({left:0,top:0,width:1200,height:800});
 const cards=['memo','work','guide'].map(name=>{const card=node(),handle=node();card.name=name;card.querySelector=()=>handle;card.getBoundingClientRect=()=>({left:Number.isFinite(Number.parseFloat(card.style.left))?Number.parseFloat(card.style.left):900,top:Number.isFinite(Number.parseFloat(card.style.top))?Number.parseFloat(card.style.top):100,width:Number.parseFloat(card.style.width)||287,height:130});return {name,card,handle};});
 side.append(...cards.map(v=>v.card));side.querySelector=s=>s==='.side-card'?cards[1].card:cards[2].card;
 const document={head,querySelector:()=>side,getElementById:id=>id==='stage'?stage:id==='personal-memo-card'?cards[0].card:null,createElement:()=>node()};
 const root={document,innerWidth:1400,innerHeight:800,location:{origin:'https://example.test'},parent:{__QMES_CURRENT_USER__:{id:account},postMessage(){}},events:{},addEventListener(n,f){this.events[n]=f;},requestAnimationFrame:f=>{f();return 1;},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
 mount(root);return {root,stage,cards,storage,button:stage.children.find(v=>v.className==='portal-free-toolbar').children[1]};
}

test('pointer drag reaches any pixel and account positions restore without affecting other accounts',()=>{
 const f=fixture();f.button.onclick();const item=f.cards[1],rect=item.card.getBoundingClientRect(),event={button:0,pointerId:1,clientX:rect.left+20,clientY:rect.top+20,target:item.handle,preventDefault(){}};
 item.handle.events.pointerdown(event);item.handle.events.pointermove({...event,clientX:20,clientY:20});item.handle.events.pointerup(event);
 assert.equal(item.card.style.left,'0px');assert.equal(item.card.style.top,'0px');const saved=decode(f.storage.get('namo-portal-card-free-v4:alice'));assert.deepEqual(saved.work,{x:0,y:0});
 const restored=fixture('alice',f.storage);assert.equal(restored.cards[1].card.style.left,'0px');assert.equal(restored.cards[1].card.style.top,'0px');
 assert.notEqual(fixture('bob',f.storage).cards[1].card.style.left,'0px');
 item.handle.events.pointerdown({...event,clientX:20,clientY:20});item.handle.events.pointermove({...event,clientX:203,clientY:137,altKey:true});item.handle.events.pointerup(event);assert.equal(item.card.style.left,'183px');assert.equal(item.card.style.top,'117px');
});
test('keyboard reaches corners and buttons never start a drag',()=>{
 const f=fixture(),item=f.cards[0],event={button:0,pointerId:1,clientX:0,clientY:0,target:item.handle,preventDefault(){throw Error('unexpected');}};item.handle.events.pointerdown(event);assert(!item.handle.captured);f.button.onclick();item.handle.events.pointerdown({...event,target:{closest:()=>({})}});assert(!item.handle.captured);
 item.handle.events.keydown({key:'Home',target:item.handle,preventDefault(){}});assert.equal(item.card.style.left,'0px');assert.equal(item.card.style.top,'0px');
 item.handle.events.keydown({key:'End',target:item.handle,preventDefault(){}});assert.equal(item.card.style.left,'913px');assert.equal(item.card.style.top,'670px');
});
test('cancelled movement restores original placement',()=>{
 const f=fixture();f.button.onclick();const item=f.cards[0],rect=item.card.getBoundingClientRect(),oldLeft=item.card.style.left,oldTop=item.card.style.top,event={button:0,pointerId:2,clientX:rect.left+10,clientY:rect.top+10,target:item.handle,preventDefault(){}};
 item.handle.events.pointerdown(event);item.handle.events.pointermove({...event,clientX:650,clientY:500});item.handle.events.pointercancel(event);assert.equal(item.card.style.left,oldLeft);assert.equal(item.card.style.top,oldTop);
});

test('nearby card edges and centers snap to exact matching lines',()=>{
 const screen={width:1200,height:800},size={width:100,height:100};
 const edge=snap({x:402,y:103},screen,size,[{x:400,y:100,width:300,height:230}]);assert.equal(edge.point.x,400);assert.equal(edge.point.y,100);assert.equal(edge.x.guide,400);assert.equal(edge.y.guide,100);
 const center=snap({x:498,y:353},screen,size,[{x:400,y:300,width:300,height:200}]);assert.equal(center.point.x,500);assert.equal(center.x.guide,550);assert.equal(center.point.y,350);assert.equal(center.y.guide,400);
 const right=snap({x:599,y:500},screen,size,[{x:400,y:100,width:300,height:100}]);assert.equal(right.point.x,600);assert.equal(right.x.guide,700);
});
test('consistent 16px spacing and screen center are offered without restricting faraway positions',()=>{
 const screen={width:1200,height:800},size={width:100,height:100},other=[{x:100,y:100,width:200,height:100}];
 const adjacent=snap({x:315,y:215},screen,size,other);assert.deepEqual(adjacent.point,{x:316,y:216});
 const centered=snap({x:554,y:346},screen,size,[]);assert.deepEqual(centered.point,{x:550,y:350});
 const free=snap({x:183,y:417},screen,size,[]);assert.deepEqual(free.point,{x:183,y:417});assert.equal(free.x,null);assert.equal(free.y,null);
});
test('alignment stays steady near a line and releases when dragged farther away',()=>{
 const screen={width:1200,height:800},size={width:100,height:100},others=[{x:200,y:100,width:100,height:100}];
 const first=snap({x:205,y:407},screen,size,others);assert.equal(first.point.x,200);
 const held=snap({x:211,y:407},screen,size,others,first);assert.equal(held.point.x,200);
 const released=snap({x:215,y:407},screen,size,others,held);assert.equal(released.point.x,215);
});

test('drag displays alignment guides and clears them after dropping',()=>{
 const f=fixture();f.button.onclick();const item=f.cards[1],rect=item.card.getBoundingClientRect(),event={button:0,pointerId:7,clientX:rect.left+20,clientY:rect.top+20,target:item.handle,preventDefault(){}};
 item.handle.events.pointerdown(event);item.handle.events.pointermove({...event,clientX:23,clientY:123});
 const x=f.stage.children.find(node=>node.className==='portal-align-guide portal-align-x'),y=f.stage.children.find(node=>node.className==='portal-align-guide portal-align-y');
 assert.equal(x.hidden,false);assert.equal(y.hidden,false);assert.equal(x.style.left,'0px');
 item.handle.events.pointerup(event);assert.equal(x.hidden,true);assert.equal(y.hidden,true);assert.equal(item.card.style.left,'0px');
});
