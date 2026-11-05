const {test}=require('node:test'),assert=require('node:assert/strict'),{PGlite}=require('@electric-sql/pglite');
const files=require('../qmes-iqc-attachments-20261105.cjs'),completion=require('../qmes-iqc-missing-checks-20261105.cjs');
const pdf={name:'원료 COA.pdf',base64:Buffer.from('%PDF-1.7\nIQC COA').toString('base64')};
test('IQC create and edit save five check items and actual COA bytes in one transaction',async()=>{
 const db=new PGlite();try{
 await db.exec("CREATE TABLE iqc(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),item text,items_json jsonb)");
 const pool={connect:async()=>({query:(sql,args)=>db.query(sql,args),release(){}})},data={item:'NMP',items_json:JSON.stringify(['포장상태','외관','라벨','중량','COA 확인'].map(name=>({name,values:[name==='중량'?'100':name==='COA 확인'?'확인':'적합'],judge:'합격'})))};
 const created=await files.write(pool,{data,attachment:pdf,user:'담당자'});assert.equal(created.rows[0].items_json.length,5);
 let result=await db.query('SELECT * FROM qmes_iqc_attachments');assert.equal(result.rows.length,1);assert.equal(result.rows[0].iqc_id,created.rows[0].id);assert.equal(Buffer.from(result.rows[0].content).toString(),'%PDF-1.7\nIQC COA');
 await files.write(pool,{id:created.rows[0].id,data:{...data,item:'NMP 수정'},user:'담당자'});assert.equal((await db.query('SELECT count(*)::int n FROM qmes_iqc_attachments')).rows[0].n,1);
 await files.write(pool,{id:created.rows[0].id,data,attachment:{...pdf,name:'교체 COA.pdf'},user:'담당자'});assert.equal((await db.query('SELECT count(*)::int n FROM qmes_iqc_attachments')).rows[0].n,2);
 await assert.rejects(()=>files.write(pool,{data,attachment:{name:'fake.pdf',base64:Buffer.from('not pdf').toString('base64')}}),/COA/);assert.equal((await db.query('SELECT count(*)::int n FROM iqc')).rows[0].n,1);
 await db.query('DELETE FROM iqc WHERE id=$1',[created.rows[0].id]);assert.equal((await db.query('SELECT count(*)::int n FROM qmes_iqc_attachments')).rows[0].n,0);
 }finally{await db.close();}
});
test('failed attachment insert rolls back the inspection write',async()=>{
 const db=new PGlite();try{await db.exec("CREATE TABLE iqc(id uuid PRIMARY KEY DEFAULT gen_random_uuid(),item text)");
 const pool={connect:async()=>({query:(sql,args)=>{if(sql.startsWith('INSERT INTO qmes_iqc_attachments'))throw Error('disk failure');return db.query(sql,args);},release(){}})};
 await assert.rejects(()=>files.write(pool,{data:{item:'rollback'},attachment:pdf}),/disk failure/);assert.equal((await db.query('SELECT count(*)::int n FROM iqc')).rows[0].n,0);
 }finally{await db.close();}
});
test('packaging completion is auditable, preserves original packaging and does not invent a COA file',()=>{
 const result=completion.plan({incoming_qty:100,judge:'합격',items_json:[{name:'외관',values:['적합'],judge:'합격'}]});
 assert.equal(result.items.find(x=>x.name==='포장상태').judge,'합격');assert.ok(result.items.find(x=>x.name==='포장상태').completionSource.includes('사용자 요청'));
 const ng=completion.plan({incoming_qty:100,judge:'불합격',items_json:[]});assert.equal(ng.judge,'불합격');assert.equal(ng.items[0].judge,'대기');
});

test('registration and edit COA file input forwards bytes only to matching IQC writes and retains selection on failure',async()=>{
 const fs=require('node:fs'),vm=require('node:vm'),src=fs.readFileSync(__dirname+'/../public/js/qmes-iqc-pqc-layout-20261021.js','utf8'),addon=src.slice(src.indexOf('/* IQC COA uploads'));
 const calls=[],root={querySelector:()=>null,after(){}},document={querySelectorAll:()=>[],querySelector:()=>root,getElementById:()=>null,head:{append(){}},body:{},createElement:()=>({files:[],setAttribute(){},addEventListener(){},append(){}})};
 const window={fetch:async(input,options)=>{calls.push({input,options});return {ok:false,status:500}}};
 class FileReader{readAsDataURL(){this.result='data:application/pdf;base64,'+pdf.base64;this.onload();}}
 const ctx={window,document,URL,location:{href:'https://qmes.namochemical.com/',origin:'https://qmes.namochemical.com'},queueMicrotask,FileReader,MutationObserver:class{observe(){}},console};
 vm.runInNewContext(addon,ctx);
 const state=window.qmesIqcFiles.mount(root);state.input.files=[{name:pdf.name,size:15}];
 await window.fetch('/api/iqc',{method:'POST',body:JSON.stringify({item:'NMP'})});
 assert.equal(JSON.parse(calls[0].options.body).attachment.base64,pdf.base64);assert.equal(state.input.files.length,1);
 await window.fetch('/api/pqc',{method:'POST',body:'{}'});assert.equal(calls[1].options.body,'{}');
 state.input.files=[{name:'bad.svg',size:15}];await assert.rejects(()=>window.fetch('/api/iqc',{method:'PUT',body:'{}'}),/COA/);assert.equal(calls.length,2);
});
