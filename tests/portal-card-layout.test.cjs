const test=require('node:test'),assert=require('node:assert/strict'),{decode,reorder,mount}=require('../public/js/qmes-portal-card-layout-20261105.js');
function style(){const values={};return new Proxy(values,{get:(o,k)=>k==='cssText'?JSON.stringify(o):o[k],set:(o,k,v)=>{if(k==='cssText'){for(const key of Object.keys(o))delete o[key];Object.assign(o,JSON.parse(v||'{}'));}else o[k]=v;return true;}});}
function node(){
 const classes=new Set();
 const e={style:style(),events:{},children:[],parent:null,attributes:{},className:'',classList:{add:v=>classes.add(v),remove:v=>classes.delete(v),toggle(v,on){on?classes.add(v):classes.delete(v);}},
 setAttribute(k,v){this.attributes[k]=v;},addEventListener(n,f){this.events[n]=f;},append(...nodes){for(const child of nodes){child.remove();this.children.push(child);child.parent=this;}},
 insertBefore(child,target){if(child===target)return;child.remove();const at=this.children.indexOf(target);this.children.splice(at<0?this.children.length:at,0,child);child.parent=this;},
 remove(){if(this.parent){const at=this.parent.children.indexOf(this);if(at>=0)this.parent.children.splice(at,1);this.parent=null;}},
 closest(){return null;},setPointerCapture(){this.captured=true;},hasPointerCapture(){return this.captured;},releasePointerCapture(){this.captured=false;},focus(){this.focused=true;}};
 Object.defineProperty(e,'nextElementSibling',{get(){return this.parent?.children[this.parent.children.indexOf(this)+1]||null;}});return e;
}
function fixture(account='alice',storage=new Map()){
 const side=node(),head=node(),cards=['memo','work','guide'].map(name=>{const card=node(),handle=node();card.name=name;card.querySelector=()=>handle;card.getBoundingClientRect=()=>{if(card.style.position==='fixed')return {left:Number.parseFloat(card.style.left),top:Number.parseFloat(card.style.top),width:287,height:130};let y=100;for(const child of side.children){if(child===card)break;if(child.name&&child.style.position!=='fixed')y+=142;if(child.className==='portal-card-slot')y+=Number.parseFloat(child.style.height)+12;}return {left:900,top:y,width:287,height:130};};return {name,card,handle};});
 side.append(...cards.map(v=>v.card));side.querySelector=s=>s==='.side-card'?cards[1].card:cards[2].card;
 const document={head,querySelector:()=>side,getElementById:id=>id==='personal-memo-card'?cards[0].card:null,createElement:()=>node()};
 const root={document,innerWidth:1400,innerHeight:800,location:{origin:'https://example.test'},parent:{__QMES_CURRENT_USER__:{id:account},postMessage(){}},events:{},addEventListener(n,f){this.events[n]=f;},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)}};
 mount(root);const bar=side.children.find(v=>v.className==='portal-arrange-bar');return {root,side,cards,button:bar.children[1],storage,order:()=>side.children.filter(v=>v.name).map(v=>v.name)};
}
test('order storage validates known cards, removes duplicates and retains omitted cards',()=>{assert.deepEqual(decode('bad'),['memo','work','guide']);assert.deepEqual(decode(JSON.stringify({version:2,order:['guide','guide','injected']})),['guide','memo','work']);assert.deepEqual(reorder(['memo','work','guide'],'memo',null),['work','guide','memo']);});
test('phone arrangement mode toggles and keyboard swaps slots with per-account persistence',()=>{
 const f=fixture();assert.equal(f.button.textContent,'카드 배열');f.button.onclick();assert.equal(f.button.textContent,'완료');
 const item=f.cards[1];item.handle.events.keydown({key:'ArrowUp',target:item.handle,preventDefault(){}});assert.deepEqual(f.order(),['work','memo','guide']);
 const again=fixture('alice',f.storage);assert.deepEqual(again.order(),['work','memo','guide']);assert.deepEqual(fixture('bob',f.storage).order(),['memo','work','guide']);
 f.button.onclick();assert.equal(f.button.textContent,'카드 배열');assert.equal(item.handle.tabIndex,-1);
});
test('drag uses a slot and commits only on drop; cancelled drag restores the original order',()=>{
 const f=fixture();f.button.onclick();const item=f.cards[0],event={button:0,pointerId:1,clientX:920,clientY:120,target:item.handle,preventDefault(){}};
 item.handle.events.pointerdown(event);assert(f.side.children.some(v=>v.className==='portal-card-slot'));
 item.handle.events.pointermove({...event,clientY:790});item.handle.events.pointerup(event);assert.deepEqual(f.order(),['work','guide','memo']);assert(!f.side.children.some(v=>v.className==='portal-card-slot'));assert.equal(item.card.style.position,undefined);
 item.handle.events.pointerdown({...event,clientY:450});item.handle.events.pointermove({...event,clientY:10});item.handle.events.pointercancel(event);assert.deepEqual(f.order(),['work','guide','memo']);
});
test('normal mode and interactive buttons never start a drag',()=>{
 const f=fixture(),item=f.cards[0],event={button:0,pointerId:1,clientX:0,clientY:0,target:item.handle,preventDefault(){throw Error('unexpected drag');}};
 item.handle.events.pointerdown(event);assert(!item.handle.captured);f.button.onclick();item.handle.events.pointerdown({...event,target:{closest:()=>({})}});assert(!item.handle.captured);
});
