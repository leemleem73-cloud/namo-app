'use strict';
const {randomUUID,createHash}=require('node:crypto');
const invalid=m=>Object.assign(Error(m),{status:400});
function validate(file){
 if(file===undefined||file===null)return null;
 if(!file||typeof file.name!=='string'||file.name.length>200||!file.name.trim()||typeof file.base64!=='string'||file.base64.length>7000000)throw invalid('COA 파일을 확인해 주세요.');
 if(!/^[A-Za-z0-9+/]*={0,2}$/.test(file.base64))throw invalid('COA 파일 형식이 올바르지 않습니다.');
 const bytes=Buffer.from(file.base64,'base64');
 if(!bytes.length||bytes.length>5*1024*1024||bytes.toString('base64')!==file.base64)throw invalid('COA 파일은 5MB 이하로 첨부해 주세요.');
 let mime,ext;
 if(bytes.subarray(0,5).toString()==='%PDF-'){mime='application/pdf';ext='pdf';}
 else if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mime='image/png';ext='png';}
 else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255){mime='image/jpeg';ext='jpg';}
 else throw invalid('COA는 PDF, JPG, PNG 파일로 첨부해 주세요.');
 if(!new RegExp('\\.'+(ext==='jpg'?'jpe?g':ext)+'$','i').test(file.name))throw invalid('COA 파일 확장자와 내용을 확인해 주세요.');
 return {name:file.name.replace(/[\\/\r\n\x00-\x1f]/g,'_').trim(),mime,bytes,hash:createHash('sha256').update(bytes).digest('hex')};
}
async function ensure(db){await db.query(`CREATE TABLE IF NOT EXISTS qmes_oqc_attachments(id text PRIMARY KEY,sources jsonb NOT NULL,name text NOT NULL,mime text NOT NULL,content bytea NOT NULL,sha256 text NOT NULL,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT now())`);}
async function save(db,sources,input,user){
 const file=validate(input);if(!file)return null;
 await ensure(db);
 const id=randomUUID();
 await db.query('INSERT INTO qmes_oqc_attachments(id,sources,name,mime,content,sha256,created_by) VALUES($1,$2::jsonb,$3,$4,$5,$6,$7)',[id,JSON.stringify(sources.map(t=>({recordKey:t.recordKey,rowId:t.rowId}))),file.name,file.mime,file.bytes,file.hash,String(user||'')]);
 return {id,name:file.name};
}

const labelId=/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const norm=value=>String(value??'').trim().toUpperCase();
const dateOf=value=>String(value??'').slice(0,10);
const html=value=>String(value??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function sourceIds(input){
 if(!Array.isArray(input)||!input.length||input.length>100)return null;
 const sources=input.map(source=>({recordKey:source?.recordKey,rowId:source?.rowId}));
 if(sources.some(source=>[source.recordKey,source.rowId].some(value=>typeof value!=='string'||!value.trim()||value.length>250)))return null;
 return [...new Map(sources.map(source=>[JSON.stringify(source),source])).values()].sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
}
async function labelRows(pool,sources){
 const result=await pool.query(`SELECT record_key,payload FROM qmes_sync_records
  WHERE record_type='oqc' AND record_key=ANY($1::text[])`,[[...new Set(sources.map(source=>source.recordKey))]]);
 const records=new Map(result.rows.map(row=>[row.record_key,row.payload]));
 const rows=sources.map(source=>{
  const payload=records.get(source.recordKey);
  return !payload?.deleted&&Array.isArray(payload?.rows)?payload.rows.find(row=>row&&!row.deleted&&String(row.id)===source.rowId):null;
 });
 if(rows.some(row=>!row))return null;
 const [first]=rows;
 if(!norm(first.lot)||norm(first.lot)==='-'||!dateOf(first.date)||rows.some(row=>
  norm(row.lot)!==norm(first.lot)||dateOf(row.date)!==dateOf(first.date)||
  (norm(row.product)&&norm(first.product)&&norm(row.product)!==norm(first.product))||
  (norm(row.customer)&&norm(first.customer)&&norm(row.customer)!==norm(first.customer))))return null;
 return rows;
}
function pairs(entries){
 return '<dl>'+entries.map(([key,value])=>'<dt>'+html(key)+'</dt><dd>'+html(value==null||value===''?'—':value)+'</dd>').join('')+'</dl>';
}
function panel(title,entries){
 return '<details class="history"><summary>'+title+'</summary>'+entries+'</details>';
}
function table(labels,rows,empty='연결된 기록이 없습니다.'){
 if(!rows.length)return '<div class="files">'+html(empty)+'</div>';
 return '<table><thead><tr>'+labels.map(label=>'<th scope="col">'+html(label)+'</th>').join('')+
 '</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(value=>'<td>'+html(value==null||value===''?'—':value)+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
}
async function loadInternalHistory(pool,record){
 const lot=norm(record.lot);
 const results=await Promise.allSettled([
  pool.query(`SELECT d.document FROM qmes_work_order_documents d
   WHERE upper(btrim(d.document->'fields'->>'생산 LOT NO'))=$1
   AND NOT EXISTS(SELECT 1 FROM qmes_work_order_deletions x WHERE x.id=d.id)`,[lot]),
  pool.query(`SELECT w.work_date::text AS date,w.prod_qty,m.material,m.lot_no,m.input_qty
   FROM worklog w LEFT JOIN worklog_materials m ON m.worklog_id=w.id
   WHERE upper(btrim(w.finished_lot))=$1 ORDER BY w.work_date DESC,m.seq`,[lot]),
  pool.query(`SELECT occurred_on::text AS date,report_no,status FROM qmes_ncr_reports
   WHERE upper(btrim(lot))=$1 ORDER BY occurred_on DESC`,[lot]),
  pool.query(`SELECT created_at::date::text AS date,change_no,status FROM qmes_change_requests
   WHERE deleted_at IS NULL AND upper(btrim(target))=$1 ORDER BY created_at DESC`,[lot])
 ]);
 const rowsAt=index=>results[index].status==='fulfilled'?results[index].value.rows:[];
 const orders=rowsAt(0).map(row=>row.document).filter(doc=>doc&&!doc.deleted&&
  (!norm(record.product)||!norm(doc.fields?.['제품명'])||norm(doc.fields?.['제품명'])===norm(record.product)));
 const actual=rowsAt(1);
 const materials=actual.filter(row=>row.material&&Number(String(row.input_qty).replace(/,/g,''))>0)
  .map(row=>[row.material,row.lot_no,row.input_qty]);
 const actualKeys=new Set(materials.map(row=>JSON.stringify(row.slice(0,2).map(norm))));
 for(const order of orders){
  for(const material of order.materials||[]){
   const name=material.sourceName||material.name;
   if(Number(String(material.actual).replace(/,/g,''))>0&&!actualKeys.has(JSON.stringify([norm(name),norm(material.lot)]))){
    materials.push([name,material.lot,material.actual]);
   }
  }
 }
 const production=orders.map(doc=>[doc.fields?.['작업일자'],doc.fields?.['작업지시번호']||doc.id,doc.fields?.['진행상태']]);
 if(!production.length)for(const day of new Set(actual.map(row=>row.date)))production.push([day,'—','실적 등록']);
 const quality=[...rowsAt(2).map(row=>['NCR',row.date,row.report_no,row.status]),...rowsAt(3).map(row=>['변경',row.date,row.change_no,row.status])];
 const error='이력을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.';
 return panel('원재료 추적',table(['원재료명','원료 LOT','실투입량(kg)'],materials,results.slice(0,2).some(r=>r.status==='rejected')?error:undefined))+
  panel('생산이력',table(['작업일','작업지시번호','진행상태'],production,results.slice(0,2).some(r=>r.status==='rejected')?error:undefined))+
  panel('NCR / 변경이력',table(['구분','일자','문서번호','상태'],quality,results.slice(2).some(r=>r.status==='rejected')?error:undefined));
}
function renderLabelReport(rows,files,token,history){
 const rules=require('./public/js/qmes-oqc-rules-20261019.js');
 const record=rows[0];
 const shipment=rows.map(row=>row.stockShipment).find(value=>value?.id&&value.completed===true&&Number(value.quantity)>0&&
  norm(value.lot)===norm(record.lot)&&norm(value.product)===norm(record.product)&&dateOf(value.inspectionDate)===dateOf(record.date)&&
  (!norm(value.customer)||norm(value.customer)===norm(record.customer)));
 const legacyShipment=rows.find(row=>row.shippingStatus==='출하완료'&&dateOf(row.actualShipDate||row.shipDate)&&Number(String(row.shipQty??'').replace(/,/g,''))>0);
 const completed=shipment|| (legacyShipment?{shipDate:legacyShipment.actualShipDate||legacyShipment.shipDate,quantity:legacyShipment.shipQty,customer:legacyShipment.customer}:null);
 const overall=rules.summarizeRows(rows).overall;
 const checks=rules.items.map(name=>{
  const matching=rows.filter(row=>rules.canonical(row.check)===name);
  if(!matching.length)return [name,'—','대기'];
  const results=matching.map(row=>rules.evaluateItem(name,rules.rowValues(row),rules.standardRevisionForDate(row.date,row.standardRevision)));
  const decision=results.includes('불합격')?'불합격':results.includes('대기')?'대기':'합격';
  const values=matching.map(row=>rules.rowValues(row).filter(value=>String(value??'').trim()).join(' / ')).filter(Boolean);
  return [name,[...new Set(values)].join(' · ')||'—',decision];
 });
 const links=files.map(file=>`<a href="/oqc-label/${token}/coa/${encodeURIComponent(file.id)}">${html(file.name)}</a>`).join('');
 return require('./qmes-iqc-attachments-20261105.cjs').reportPage(`<div class="report-grid">
  <section class="receipt"><h2>출하검사 정보</h2>${pairs([['제품명',record.product],['완제품 LOT',record.lot],
   ['검사일자',dateOf(record.date)],['검사 판정',overall]])}</section>
  <div class="documents">${panel('검사이력 · 출하검사 성적서',table(['검사항목','측정 결과','판정'],checks))}
  ${panel('출하 CoA','<div class="files">'+(links||'첨부된 CoA가 없습니다.')+'</div>')}
  ${history}
  ${panel('출하이력',completed?pairs([['출하일',dateOf(completed.shipDate)],['수량',completed.quantity+' kg'],['고객사',completed.customer||record.customer]]):'<div class="files">연결된 출하완료 기록이 없습니다.</div>')}
  </div></div>`,{title:'출하검사 조회'});
}
function installLabelRoutes(app,{pool,requireLogin}){
 let ready;
 const ensureLabels=()=>ready||(ready=pool.query('CREATE TABLE IF NOT EXISTS qmes_oqc_label_links(token uuid PRIMARY KEY, source_key text UNIQUE NOT NULL, sources jsonb NOT NULL)').catch(error=>{ready=null;throw error;}));
 const headers=res=>{
  res.set('Cache-Control','private, no-store');
  res.set('Referrer-Policy','no-referrer');
  res.set('X-Robots-Tag','noindex, nofollow');
  res.set('X-Content-Type-Options','nosniff');
  res.set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'");
 };
 async function resolve(token){
  if(!labelId.test(token))return null;
  await ensureLabels();
  const result=await pool.query('SELECT sources FROM qmes_oqc_label_links WHERE token=$1',[token]);
  const sources=sourceIds(result.rows[0]?.sources);
  if(!sources)return null;
  const rows=await labelRows(pool,sources);
  return rows?{sources,rows}:null;
 }
 const attached=`EXISTS (SELECT 1 FROM jsonb_array_elements(a.sources) entry
  JOIN jsonb_array_elements($1::jsonb) selected ON entry->>'recordKey'=selected->>'recordKey' AND entry->>'rowId'=selected->>'rowId')`;
 app.post('/api/qmes/oqc/label-links',requireLogin,async(req,res)=>{
  headers(res);
  const sources=sourceIds(req.body?.sources);
  if(!sources)return res.status(400).json({success:false,message:'저장된 출하검사 기록을 확인해 주세요.'});
  try{
   if(!await labelRows(pool,sources))return res.status(404).json({success:false,message:'출하검사 기록을 찾을 수 없습니다.'});
   await ensureLabels();
   const json=JSON.stringify(sources);
   const result=await pool.query(`INSERT INTO qmes_oqc_label_links(token,source_key,sources) VALUES($1,$2,$3)
    ON CONFLICT(source_key) DO UPDATE SET sources=EXCLUDED.sources RETURNING token`,[randomUUID(),createHash('sha256').update(json).digest('hex'),json]);
   res.json({success:true,path:'/oqc-label/'+result.rows[0].token});
  }catch(error){console.error('[OQC QR issue]',error);res.status(500).json({success:false,message:'출하 QR 링크를 발행하지 못했습니다.'});}
 });
 app.get('/oqc-label/:token',async(req,res)=>{
  headers(res);
  try{
   const report=await resolve(req.params.token);
   if(!report)return res.status(404).send('QR에 연결된 출하검사 기록이 없습니다.');
   await ensure(pool);
   const files=await pool.query('SELECT id,name FROM qmes_oqc_attachments a WHERE '+attached+' ORDER BY created_at DESC',[JSON.stringify(report.sources)]);
   const history=req.session?.user?await loadInternalHistory(pool,report.rows[0]):
    panel('원재료 추적 · 생산이력 · NCR / 변경이력','<div class="files"><a href="/" target="_blank" rel="noopener">나모 웹 로그인</a>로그인한 뒤 이 페이지를 새로고침하면 내부 이력을 확인할 수 있습니다.</div>');
   res.send(renderLabelReport(report.rows,files.rows,req.params.token,history));
  }catch(error){console.error('[OQC QR view]',error);res.status(500).send('출하검사 성적서를 불러오지 못했습니다.');}
 });
 app.get('/oqc-label/:token/coa/:id',async(req,res)=>{
  headers(res);
  try{
   const report=await resolve(req.params.token);
   if(!report||!labelId.test(req.params.id))return res.status(404).send('첨부파일이 없습니다.');
   await ensure(pool);
   const result=await pool.query('SELECT name,mime,content FROM qmes_oqc_attachments a WHERE id=$2 AND '+attached,[JSON.stringify(report.sources),req.params.id]);
   const file=result.rows[0];
   if(!file)return res.status(404).send('첨부파일이 없습니다.');
   res.set('Content-Security-Policy',"default-src 'none'; sandbox");
   res.set('Content-Disposition',"inline; filename*=UTF-8''"+encodeURIComponent(file.name).replace(/['()]/g,ch=>'%'+ch.charCodeAt(0).toString(16)));
   res.type(file.mime).send(file.content);
  }catch(error){console.error('[OQC QR CoA]',error);res.status(500).send('CoA 파일을 열지 못했습니다.');}
 });
}
function install(app,{pool,requireLogin}){
 installLabelRoutes(app,{pool,requireLogin});
 app.get('/api/qmes/oqc/attachments',requireLogin,async(req,res)=>{
  try{await ensure(pool);const r=await pool.query('SELECT id,sources,name,created_at FROM qmes_oqc_attachments ORDER BY created_at DESC,id DESC');res.json({success:true,data:r.rows});}
  catch(e){res.status(500).json({success:false,message:'COA 첨부파일을 불러오지 못했습니다.'});}
 });
 app.get('/api/qmes/oqc/attachments/:id',requireLogin,async(req,res)=>{
  try{
   await ensure(pool);
   const r=await pool.query(`SELECT a.* FROM qmes_oqc_attachments a WHERE id=$1 AND EXISTS(SELECT 1 FROM jsonb_array_elements(a.sources) s JOIN qmes_sync_records r ON r.record_type='oqc' AND r.record_key=s->>'recordKey' CROSS JOIN LATERAL jsonb_array_elements(CASE WHEN jsonb_typeof(r.payload->'rows')='array' THEN r.payload->'rows' ELSE '[]'::jsonb END) item WHERE coalesce(r.payload->>'deleted','false')<>'true' AND item->>'id'=s->>'rowId')`,[req.params.id]);
   const file=r.rows[0];if(!file)return res.status(404).json({success:false,message:'COA 첨부파일이 없습니다.'});
   res.setHeader('Content-Type',file.mime);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');
   res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");
   res.setHeader('Content-Disposition',"inline; filename=COA."+({ 'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'}[file.mime]||'bin')+"; filename*=UTF-8''"+encodeURIComponent(file.name));
   res.send(file.content);
  }catch(e){res.status(500).json({success:false,message:'COA 파일을 열지 못했습니다.'});}
 });
}
module.exports={validate,save,install};
