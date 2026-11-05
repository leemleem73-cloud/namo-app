const test=require('node:test'),assert=require('node:assert/strict'),{bounded,decode,mount}=require('../public/js/qmes-portal-card-layout-20261105.js');
function element(rect={left:0,top:0,width:287,height:120}){
 return {style:{transform:'',position:'',zIndex:''},events:{},children:[],classList:{add(){},remove(){}},setAttribute(){},addEventListener(name,fn){this.events[name]=fn;},append(v){this.children.push(v);},closest:()=>null,setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured;},releasePointerCapture(){this.captured=false;},getBoundingClientRect(){const m=this.style.transform.match(/translate\((-?\d+)px,(-?\d+)px\)/);return {...rect,left:rect.left+(m?Number(m[1]):0),top:rect.top+(m?Number(m[2]):0)};}};
}
function fixture(user='alice',storage=new Map()){
 const stage=element({left:0,top:0,width:1200,height:700}),head=element();
 const cards=['memo','work','guide'].map((name,index)=>{const card=element({left:900,top:100+index*160,width:287,height:130}),handle=element();card.querySelector=()=>handle;return {name,card,handle};});
 const side={querySelector:s=>s==='.side-card'?cards[1].card:cards[2].card};
 const document={head,getElementById:id=>id==='stage'?stage:id==='personal-memo-card'?cards[0].card:null,querySelector:()=>side,createElement:()=>element()};
 const root={document,innerWidth:1400,location:{origin:'https://example.test'},parent:{__QMES_CURRENT_USER__:{id:user},postMessage(){}},events:{},addEventListener(n,f){this.events[n]=f;},requestAnimationFrame:f=>{f();return 1;},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v),removeItem:k=>storage.delete(k)}};
 mount(root);return {root,cards,stage,storage};
}
test('coordinates clamp to visible stage and layout parser ignores unsupported or invalid values',()=>{
 assert.deepEqual(bounded({left:900,top:100},{width:1200,height:700},{width:287,height:130},{x:5000,y:-5000}),{x:5,y:-92});
 assert.deepEqual(decode('invalid'),{});assert.deepEqual(decode(JSON.stringify({version:1,cards:{memo:{x:-4,y:2},work:{x:'oops',y:1},other:{x:1,y:1}}})),{memo:{x:-1,y:1}});
});
test('all three title handles move, persist and restore their account layout',()=>{
 const f=fixture();
 for(const item of f.cards){const event={button:0,pointerId:1,clientX:100,clientY:100,target:item.handle,preventDefault(){}};
 item.handle.events.pointerdown(event);item.handle.events.pointermove({...event,clientX:-100,clientY:150});item.handle.events.pointerup(event);assert.equal(item.card.style.transform,'translate(-200px,50px)');}
 const stored=decode(f.storage.get('namo-portal-card-layout-v1:alice'));assert.equal(Object.keys(stored).length,3);
 const again=fixture('alice',f.storage);assert(again.cards.every(item=>item.card.style.transform==='translate(-200px,50px)'));
 const bob=fixture('bob',f.storage);assert(bob.cards.every(item=>item.card.style.transform==='translate(0px,0px)'));
});
test('buttons do not start dragging; keyboard and reset remain available',()=>{
 const f=fixture(),item=f.cards[0];item.handle.events.pointerdown({button:0,pointerId:1,clientX:0,clientY:0,target:{closest:()=>({})},preventDefault(){throw Error('button intercepted');}});assert(!item.handle.captured);
 item.handle.events.keydown({key:'ArrowLeft',target:item.handle,preventDefault(){}});assert.equal(item.card.style.transform,'translate(-10px,0px)');
 f.stage.children[0].onclick();assert.equal(item.card.style.transform,'translate(0px,0px)');assert(!f.storage.has('namo-portal-card-layout-v1:alice'));
});
