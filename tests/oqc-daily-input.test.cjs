const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const core=require('../public/js/qmes-oqc-revision-core-20261104.js'),rules=require('../public/js/qmes-oqc-rules-20261019.js');
test('same Korea day keeps revision but updates modification time and author',()=>{
 const before=[{id:'a',remarks:'a',revision:3,modifiedAt:'2026-11-04T23:00:00Z'}],after=[{...before[0],remarks:'b'}];
 const result=core.applyGroup(before,after,'담당자','2026-11-05T04:00:00Z');assert.equal(result.revision,3);assert.equal(result.modifiedAt,'2026-11-05T04:00:00.000Z');assert.equal(result.modifiedBy,'담당자');assert.equal(result.changed,true);
});
test('Korea midnight creates exactly one new revision',()=>{
 const b=[{id:'a',remarks:'a',revision:3,modifiedAt:'2026-11-05T14:59:59Z'}];
 const a=core.applyGroup(b,[{...b[0],remarks:'b'}],'담당자','2026-11-05T15:00:00Z');assert.equal(a.revision,4);
 const again=core.applyGroup(a.rows,[{...a.rows[0],remarks:'c'}],'담당자','2026-11-06T04:00:00Z');assert.equal(again.revision,4);
});
test('registration day remains Rev0; inspection date never sets revision day',()=>{
 const b=[{id:'a',date:'2020-01-01',remarks:'',...core.initial('2026-11-05T00:00:00Z')}];
 const a=core.applyGroup(b,[{...b[0],remarks:'edited'}],'담당자','2026-11-05T05:00:00Z');assert.equal(a.revision,0);assert.equal(a.modifiedAt,'2026-11-05T05:00:00.000Z');
 const next=core.applyGroup(a.rows,[{...a.rows[0],remarks:'tomorrow'}],'담당자','2026-11-06T05:00:00Z');assert.equal(next.revision,1);
});
test('renamed legacy items evaluate using stored measurements and identify actual missing samples',()=>{
 const vals=['이상없음','7','1500','200','20','500','Overflow','미탈리'];
 const rows=rules.items.map((check,i)=>({check,measurements:Array(3).fill(vals[i]),judge:'대기'}));
 rows[1].check='입도 (Dmax)';rows[3].check='수분';rows[7].check='전해액안정성';
 assert.equal(rules.summarizeRows(rows).overall,'합격');
 rows[6].measurements=['Overflow','','Overflow'];const missing=rules.summarizeRows(rows);assert.equal(missing.overall,'대기');assert(missing.pending.includes('절연저항 2차 미입력'));
 rows[2].measurements=['1140','1500','1500'];assert.equal(rules.summarizeRows(rows).overall,'불합격');
});
test('edit resistance controls offer Overflow and preserve existing numeric measurements',()=>{
 const source=fs.readFileSync(__dirname+'/../public/js/qmes-outgoing-detail-20261019.js','utf8');
 const fn=source.slice(source.indexOf('function measurementCell('),source.indexOf('// Hide the generated import reminder'));
 const ctx={esc:v=>String(v)};vm.runInNewContext(fn,ctx);
 for(let i=0;i<3;i++){const html=ctx.measurementCell('절연저항',i,'300',false);assert(html.startsWith('<select'));assert(html.includes('Overflow'));assert(html.includes('value="300" selected'));assert(html.includes('data-oqc-value="'+i+'"'));}
});
for(const file of ['qmes-oqc-registration-auto-judge-20261021-v2.js','qmes-oqc-sequential-block-20261021.js'])test(file+' coalesces rapid typing to one animation frame',()=>{
 const callbacks=[],events={},document={head:{appendChild(){}},body:{},createElement:()=>({}),querySelectorAll:()=>[],addEventListener:(name,fn)=>events[name]=fn};
 const ctx={document,window:{qmesOqcRules:rules},requestAnimationFrame:fn=>{callbacks.push(fn);return callbacks.length;},MutationObserver:class{observe(){}}};
 vm.runInNewContext(fs.readFileSync(__dirname+'/../public/js/'+file,'utf8'),ctx);
 for(let i=0;i<100;i++)events.input({target:{closest:()=>true,matches:()=>true}});
 assert.equal(callbacks.length,1);callbacks[0]();
});
