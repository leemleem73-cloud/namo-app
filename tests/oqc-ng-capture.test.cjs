const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(__dirname+'/../public/js/qmes-oqc-sequential-block-20261021.js','utf8');
function fixture(detail=false){
 const names=['외관','입도(Dmax)','점도','수분율','고형분','접착력','절연저항','전해액 안정성'];
 const values=['이상없음','7','1140','200','20','500','Overflow','미탈리'];
 const rows=names.map((name,index)=>{
  const inputs=Array.from({length:3},()=>({value:values[index],disabled:false,dataset:{},classList:{contains:()=>!detail},setAttribute(){},removeAttribute(){}}));
  const judge={textContent:''},classes=new Set();return {inputs,judge,classes,
   classList:{toggle:(c,v)=>v?classes.add(c):classes.delete(c)},
   querySelector:s=>s==='[data-oqc-value],.std-measure'?inputs[0]:s==='th,.item'?{textContent:name}:s==='[data-oqc-item-judge]'&&detail?judge:null,
   querySelectorAll:()=>inputs,lastElementChild:{appendChild(){throw Error('Unexpected locked label');}}};
 });
 // Release only locks previously owned by this feature; preserve independent disabled controls.
 rows[4].inputs[0].disabled=true;rows[4].inputs[0].dataset.oqcSequentialLock='owned';
 rows[5].inputs[0].disabled=true;rows[5].inputs[0].dataset.oqcSequentialLock='previously-disabled';
 let warning=null;
 const parent={querySelector:()=>warning,insertBefore:w=>warning=w},table={querySelectorAll:()=>rows,parentElement:parent,parentNode:parent};
 const document={head:{appendChild(){}},body:{},querySelectorAll:()=>[table],addEventListener(){},createElement:()=>({setAttribute(){},lastElementChild:{textContent:''},remove(){warning=null;}})};
 vm.runInNewContext(source,{document,window:{qmesOqcRules:require('../public/js/qmes-oqc-rules-20261019.js')},MutationObserver:class{observe(){}},queueMicrotask});
 return {rows,warning};
}
for(const detail of [false,true])test((detail?'edit':'registration')+' allows later evidence after NG and preserves unrelated locks',()=>{
 const f=fixture(detail);assert.equal(f.rows[3].inputs[0].disabled,false);assert.equal(f.rows[4].inputs[0].disabled,false);assert.equal(f.rows[5].inputs[0].disabled,true);assert(f.rows.every(r=>!r.classes.has('oqc-sequential-locked')));assert(f.warning.lastElementChild.textContent.includes('모두 입력하고 저장'));assert(f.warning.lastElementChild.textContent.includes('출하 차단은 유지'));if(detail){assert.equal(f.rows[2].judge.textContent,'불합격');assert.equal(f.rows[3].judge.textContent,'합격');}
});
test('NG registration retains all eight measurements and fails overall without pretending to ship',()=>{
 const {normalizeRegistration,makePayload}=require('../qmes-oqc-registration-20261021.js'),rules=require('../public/js/qmes-oqc-rules-20261019.js');
 const vals=['이상없음','7','1140','200','20','500','Overflow','미탈리'];
 const measurements=Object.fromEntries(rules.items.map((item,i)=>[item,Array(3).fill(vals[i])]));
 const n=normalizeRegistration({requestId:'12345678-1234-1234-1234-123456789abc',fields:{date:'2026-11-04',lot:'NG-LOT',inspector:'담당자'},measurements});
 const p=makePayload(n,{id:'u1',name:'담당자'},'2026-11-04T00:00:00Z');
 assert.equal(p.overall,'불합격');assert.equal(p.rows.length,8);assert.equal(p.rows[2].judge,'불합격');assert.deepEqual(p.rows[7].measurements,['미탈리','미탈리','미탈리']);assert(p.rows.every(r=>r.shippingStatus!=='출하완료'));
});
