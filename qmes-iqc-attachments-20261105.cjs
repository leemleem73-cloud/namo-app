'use strict';
const {randomUUID}=require('node:crypto');
const {validate}=require('./qmes-oqc-attachments-20261104.cjs');
async function ensure(db){await db.query('CREATE TABLE IF NOT EXISTS qmes_iqc_attachments(id text PRIMARY KEY,iqc_id uuid NOT NULL REFERENCES iqc(id) ON DELETE CASCADE,name text NOT NULL,mime text NOT NULL,content bytea NOT NULL,sha256 text NOT NULL,created_by text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp())');}
async function write(pool,{data,id,attachment,user}){
 const file=validate(attachment),keys=Object.keys(data),vals=Object.values(data);
 const client=await pool.connect();try{
  await client.query('BEGIN');await client.query('SELECT pg_advisory_xact_lock(20261021,731)');
  const result=id?await client.query('UPDATE iqc SET '+keys.map((k,i)=>k+'=$'+(i+1)).join(',')+' WHERE id=$'+(keys.length+1)+' RETURNING *',[...vals,id]):await client.query('INSERT INTO iqc ('+keys.join(',')+') VALUES ('+keys.map((_,i)=>'$'+(i+1)).join(',')+') RETURNING *',vals);
  if(!result.rows[0])throw Object.assign(Error('수입검사 기록이 없습니다.'),{status:404});
  if(file){await ensure(client);await client.query('INSERT INTO qmes_iqc_attachments(id,iqc_id,name,mime,content,sha256,created_by) VALUES($1,$2,$3,$4,$5,$6,$7)',[randomUUID(),result.rows[0].id,file.name,file.mime,file.bytes,file.hash,String(user||'')]);}
  await client.query('COMMIT');return result;
 }catch(e){await client.query('ROLLBACK').catch(()=>{});throw e;}finally{client.release();}
}

const uuidPattern=/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const escapeHtml=value=>String(value??'—').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function reportPage(body){
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>나모 수입검사 성적서</title><style>
 *{box-sizing:border-box}body{margin:0;background:#f1f5f9;color:#172f48;font:15px/1.55 system-ui,sans-serif}main{max-width:680px;margin:auto;padding:20px 14px 32px}section{margin-top:14px;background:#fff;border:1px solid #d7e2ee;border-radius:8px;overflow:hidden}header small{color:#506a82;font-weight:700}h1{font-size:23px;margin:3px 0}h2{font-size:16px;margin:0;padding:11px 14px;background:#eaf1f8;border-bottom:1px solid #d7e2ee}dl{display:grid;grid-template-columns:minmax(96px,1fr) minmax(0,2fr);margin:0}dt,dd{margin:0;padding:9px 12px;border-bottom:1px solid #e4ebf2;overflow-wrap:anywhere}dt{font-weight:650}dl>:nth-last-child(-n+2){border-bottom:0}table{width:100%;border-collapse:collapse;table-layout:fixed}th,td{padding:9px 8px;text-align:center;overflow-wrap:anywhere;border-bottom:1px solid #e4ebf2}th{font-size:13px;background:#f6f9fc}tbody tr:last-child td{border-bottom:0}.files{display:grid;gap:8px;padding:12px 14px}.files a{color:#135997;text-decoration:underline;overflow-wrap:anywhere}.pass{color:#08653f;font-weight:700}.fail{color:#a32424;font-weight:700}.company-logo{display:block;width:172px;max-width:70%;height:auto}.history,.iqc-status{margin-top:10px;background:#fff;border:1px solid #e3eaf2;border-radius:8px;overflow:hidden}.history summary{cursor:pointer;padding:12px 14px;color:#173d66;font-weight:700}.history[open] summary{background:#edf3f9;border-bottom:1px solid #e3eaf2}.history dl+dl{border-top:1px solid #e3eaf2}.history-message{margin:12px 14px;color:#52677c}.iqc-status{padding:10px 14px;display:flex;justify-content:space-between;gap:12px;overflow-wrap:anywhere}@media print{body{background:#fff}main{max-width:none;padding:0}tr{break-inside:avoid}}
 </style></head><body><main><header><img class="company-logo" src="/assets/namo-login-company-logo-20261016.svg" alt="나모케미칼(주)"><h1>원료 LOT 조회</h1></header>${body}</main></body></html>`;
}

const cleanLot=value=>String(value??'').trim().toUpperCase();
function historyCard(title,labels,rows,message='연결된 기록이 없습니다.'){
 const body=rows.length?rows.map(row=>'<dl>'+labels.map((label,index)=>
  '<dt>'+label+'</dt><dd>'+escapeHtml(row[index]??'—')+'</dd>').join('')+'</dl>').join(''):
  '<p class="history-message">'+escapeHtml(message)+'</p>';
 return '<details class="history"><summary>'+title+'</summary>'+body+'</details>';
}
async function loadHistory(pool,row){
 const lot=cleanLot(row.lot);
 if(!lot||lot==='-')return {message:'원료 LOT 번호가 없어 이력을 연결할 수 없습니다.'};
 const duplicates=await pool.query('SELECT 1 FROM iqc WHERE upper(btrim(lot))=$1 AND id<>$2 LIMIT 1',[lot,row.id]);
 if(duplicates.rows.length)return {message:'같은 LOT의 입고 건이 여러 개여서 투입 이력을 이 입고 건에 연결할 수 없습니다.'};
 const actual=await pool.query(
  `SELECT w.work_date::text AS date,w.finished_lot AS output,m.input_qty AS qty
   FROM worklog_materials m JOIN worklog w ON w.id=m.worklog_id
   WHERE upper(btrim(m.lot_no))=$1 AND w.work_date >= $2
   ORDER BY w.work_date DESC,w.id,m.seq`,[lot,row.date]);
 const saved=await pool.query(
  `SELECT d.document FROM qmes_work_order_documents d
   WHERE NOT EXISTS (SELECT 1 FROM qmes_work_order_deletions x WHERE x.id=d.id)
   AND EXISTS (SELECT 1 FROM jsonb_array_elements(CASE WHEN jsonb_typeof(d.document->'materials')='array'
     THEN d.document->'materials' ELSE '[]'::jsonb END) m WHERE upper(btrim(m->>'lot'))=$1)`,[lot]);
 const positive=value=>Number(String(value??'').replace(/,/g,''))>0;
 const orders=new Map();
 for(const {document:doc} of saved.rows){
  const fields=doc.fields||{};
  const date=String(fields['작업일자']||'').slice(0,10);
  const output=cleanLot(fields['생산 LOT NO']);
  const inputs=(doc.materials||[]).filter(m=>cleanLot(m.lot)===lot&&positive(m.actual));
  if(!output||output==='-'||!date||date<row.date||!inputs.length)continue;
  orders.set(output,[date,fields['작업지시번호']||doc.id,fields['제품명'],output,fields['진행상태']]);
 }
 const actualRows=actual.rows.filter(r=>positive(r.qty)&&cleanLot(r.output)&&cleanLot(r.output)!=='-');
 const inputs=actualRows.map(r=>[r.date,cleanLot(r.output),r.qty]);
 for(const [output,values] of orders){
  if(!actualRows.some(r=>cleanLot(r.output)===output)){
   const order=saved.rows.find(({document})=>(document.fields?.['작업지시번호']||document.id)===values[1])?.document;
   const qty=(order?.materials||[]).filter(m=>cleanLot(m.lot)===lot&&positive(m.actual)).reduce((total,m)=>total+Number(String(m.actual).replace(/,/g,'')),0);
   inputs.push([values[0],output,Number(qty.toFixed(6))]);
  }
 }
 const production=[...orders.values()];
 for(const r of actualRows){
  const output=cleanLot(r.output);
  if(!orders.has(output)){
   orders.set(output,[]);
   production.push([r.date,'—','—',output,'실적 등록']);
  }
 }
 const outputs=[...orders.keys()];
 const results=await Promise.allSettled([
  pool.query(`SELECT payload FROM qmes_sync_records
    WHERE (record_type='inventory' AND record_key='erp:shipping') OR record_type='oqc'`),
  pool.query(`SELECT occurred_on::text AS date,report_no,status FROM qmes_ncr_reports
    WHERE upper(btrim(lot))=ANY($1::text[]) ORDER BY occurred_on DESC`,[[lot,...outputs]]),
  pool.query(`SELECT coalesce(approved_at::date,created_at::date)::text AS date,change_no,status
    FROM qmes_change_requests WHERE deleted_at IS NULL AND upper(btrim(target))=ANY($1::text[])
    ORDER BY created_at DESC`,[[lot,...outputs]])
 ]);
 const rowsAt=i=>results[i].status==='fulfilled'?results[i].value.rows:[];
 const shipping=new Map();
 const savedShipping=new Set();
 for(const {payload} of rowsAt(0)){
  if(payload?.deleted)continue;
  const rows=Array.isArray(payload)?payload:Array.isArray(payload?.rows)?payload.rows:[];
  for(const record of rows){
   if(record.deleted||record.cancelled)continue;
   const shipment=record.stockShipment||{};
   const output=cleanLot(record.finishedLot||record.productionLot||record.lot);
   const status=record.shippingStatus||shipment.status||record.deliveryStatus||record.status||record.delivery;
   const date=String(record.actualShipDate||shipment.shipDate||record.shipDate||'').slice(0,10);
   const quantity=record.shipQty??shipment.shipQty??shipment.qty??record.shipmentQty??record.qty??record.quantity;
   if(!outputs.includes(output)||!['출하완료','납품완료','배송완료'].includes(status)||!date||date<row.date||!positive(quantity))continue;
   const customer=String(record.customer||shipment.customer||'').trim();
   const key=JSON.stringify([output,date,customer,String(quantity).replace(/,/g,'')]);
   const number=record.shipmentNo||record.shippingNo;
   if(number)savedShipping.add(key);
   shipping.set(number?key+'|'+number:key,[date,quantity,customer||'—',output]);
  }
 }
 for(const key of savedShipping)shipping.delete(key);
 const changes=rowsAt(2).map(r=>['변경',r.date,r.change_no,r.status]);
 const ncr=rowsAt(1).map(r=>['NCR',r.date,r.report_no,r.status]);
 return {inputs,production,shipping:[...shipping.values()],quality:[...ncr,...changes],
  shipFailed:results[0].status==='rejected',qualityFailed:results.slice(1).some(r=>r.status==='rejected')};
}
function mobileReport(row,files,token,history){
 const items=Array.isArray(row.items_json)?row.items_json:[];
 const metadata=items.find(item=>item?.name==='비고');
 const key=name=>String(name??'').replace(/\s/g,'').toUpperCase();
 const checks=['포장상태','외관','라벨','중량','COA 확인'].map(name=>{
  const saved=items.find(item=>key(item?.name)===key(name));
  return {...saved,name};
 });
 const dates=value=>value instanceof Date?value.toISOString().slice(0,10):String(value??'').slice(0,10)||'—';
 const resultClass=value=>value==='합격'?'pass':value==='불합격'?'fail':'';
 const rows=checks.map(item=>{
  const values=item.values||item.measurements;
  const recorded=Array.isArray(values)?values.filter(value=>value!=null&&value!=='').join(' / '):'';
  const result=item.judge||item.result||'—';
  return `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(String(item.value??'').trim()||recorded||'—')}</td><td class="${resultClass(result)}">${escapeHtml(result)}</td></tr>`;
 }).join('');
 const links=files.map(file=>`<a href="/iqc-label/${token}/coa/${encodeURIComponent(file.id)}">${escapeHtml(file.name)}</a>`).join('');
 const decision=row.judge||'대기';
 const note=history.message;
 const unavailable='일부 기록을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.';
 return reportPage(`<div class="iqc-status"><strong>${escapeHtml(row.lot)}</strong><span class="${resultClass(decision)}">수입검사 ${escapeHtml(decision)}</span></div>
 <details class="history" open><summary>검사이력 · IQC 성적서</summary><dl><dt>검사일</dt><dd>${escapeHtml(dates(metadata?.inspectionDate||row.date))}</dd></dl>
 <table><thead><tr><th scope="col">검사항목</th><th scope="col">확인 결과</th><th scope="col">판정</th></tr></thead><tbody>${rows}</tbody></table>
 <h2>공급업체 CoA</h2><div class="files">${links||'첨부된 CoA가 없습니다.'}</div></details>
 ${historyCard('원재료 추적',['투입일','생산 LOT','실투입량(kg)'],history.inputs||[],note)}
 ${historyCard('생산이력',['작업일','작업지시번호','제품명','생산 LOT','진행상태'],history.production||[],note)}
 ${historyCard('출하이력',['출하일','수량(kg)','고객사','완제품 LOT'],history.shipping||[],note||(history.shipFailed?unavailable:undefined))}
 ${historyCard('NCR / 변경이력',['구분','일자','문서번호','상태'],history.quality||[],note||(history.qualityFailed?unavailable:undefined))}
 ${history.qualityFailed&&history.quality?.length?'<p class="history-message">'+unavailable+'</p>':''}`);

}
function installMobileReport(app,{pool,requireLogin}){
 let ready;
 const ensureLinks=()=>ready||(ready=pool.query('CREATE TABLE IF NOT EXISTS qmes_iqc_label_links(iqc_id uuid PRIMARY KEY REFERENCES iqc(id) ON DELETE CASCADE, token uuid UNIQUE NOT NULL)').catch(error=>{ready=null;throw error;}));
 const headers=res=>{
  res.set('Cache-Control','private, no-store');
  res.set('Referrer-Policy','no-referrer');
  res.set('X-Robots-Tag','noindex, nofollow');
  res.set('X-Content-Type-Options','nosniff');
  res.set('Content-Security-Policy',"default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; frame-ancestors 'none'; base-uri 'none'");
 };
 app.post('/api/qmes/iqc/label-links',requireLogin,async(req,res)=>{
  headers(res);
  const id=String(req.body?.recordId??'');
  if(!uuidPattern.test(id))return res.status(400).json({success:false,message:'수입검사 기록 번호를 확인해 주세요.'});
  try{
   await ensureLinks();
   const result=await pool.query('INSERT INTO qmes_iqc_label_links(iqc_id,token) SELECT id,$2 FROM iqc WHERE id=$1 ON CONFLICT(iqc_id) DO UPDATE SET token=qmes_iqc_label_links.token RETURNING token',[id,randomUUID()]);
   const token=result.rows[0]?.token;
   if(!token)return res.status(404).json({success:false,message:'수입검사 기록이 없습니다.'});
   res.json({success:true,path:'/iqc-label/'+token});
  }catch(error){console.error('[IQC label issue]',error);res.status(500).json({success:false,message:'QR 열람 링크를 발행하지 못했습니다.'});}
 });
 app.get('/iqc-label/:token',async(req,res)=>{
  headers(res);
  const token=req.params.token;
  const missing=()=>res.status(404).send(reportPage('<p>QR에 연결된 수입검사 기록이 없습니다.</p>'));
  if(!uuidPattern.test(token))return missing();
  try{
   await ensureLinks();
   const result=await pool.query('SELECT i.id,i.item,i.supplier,i.lot,i.date::text AS date,i.incoming_qty,i.inspector,i.judge,i.items_json FROM qmes_iqc_label_links l JOIN iqc i ON i.id=l.iqc_id WHERE l.token=$1',[token]);
   const row=result.rows[0];
   if(!row)return missing();
   await ensure(pool);
   const files=await pool.query('SELECT id,name FROM qmes_iqc_attachments WHERE iqc_id=$1 ORDER BY created_at DESC,id',[row.id]);
   const history=await loadHistory(pool,row).catch(error=>{
    console.error('[IQC label history]',error);
    return {message:'연결 이력을 불러오지 못했습니다. 잠시 후 다시 확인해 주세요.'};
   });
   res.send(mobileReport(row,files.rows,token,history));
  }catch(error){console.error('[IQC label view]',error);res.status(500).send(reportPage('<p>수입검사 성적서를 불러오지 못했습니다. 다시 열어 주세요.</p>'));}
 });
 app.get('/iqc-label/:token/coa/:id',async(req,res)=>{
  headers(res);
  const {token,id}=req.params;
  if(!uuidPattern.test(token)||!uuidPattern.test(id))return res.status(404).send('첨부파일이 없습니다.');
  try{
   await ensureLinks();
   await ensure(pool);
   const result=await pool.query('SELECT a.name,a.mime,a.content FROM qmes_iqc_label_links l JOIN qmes_iqc_attachments a ON a.iqc_id=l.iqc_id WHERE l.token=$1 AND a.id=$2',[token,id]);
   const file=result.rows[0];
   if(!file)return res.status(404).send('첨부파일이 없습니다.');
   res.set('Content-Security-Policy',"default-src 'none'; sandbox");
   res.set('Content-Disposition',"inline; filename*=UTF-8''"+encodeURIComponent(file.name).replace(/['()]/g,ch=>'%'+ch.charCodeAt(0).toString(16)));
   res.type(file.mime).send(file.content);
  }catch(error){console.error('[IQC label CoA]',error);res.status(500).send('CoA 파일을 열지 못했습니다.');}
 });
}
function install(app,{pool,requireLogin}){
 installMobileReport(app,{pool,requireLogin});
 app.get('/api/qmes/iqc/attachments',requireLogin,async(req,res)=>{try{await ensure(pool);const r=await pool.query('SELECT a.id,a.iqc_id,a.name,a.created_at FROM qmes_iqc_attachments a JOIN iqc i ON i.id=a.iqc_id ORDER BY a.created_at DESC,a.id DESC');res.json({success:true,data:r.rows});}catch(e){res.status(500).json({success:false,message:'수입검사 COA 조회 실패'});}});
 app.get('/api/qmes/iqc/attachments/:id',requireLogin,async(req,res)=>{try{
  await ensure(pool);const r=await pool.query('SELECT a.* FROM qmes_iqc_attachments a JOIN iqc i ON i.id=a.iqc_id WHERE a.id=$1',[req.params.id]),f=r.rows[0];if(!f)return res.status(404).json({success:false,message:'COA 첨부파일이 없습니다.'});
  res.setHeader('Content-Type',f.mime);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Cache-Control','private, no-store');res.setHeader('Content-Security-Policy',"default-src 'none'; sandbox");res.setHeader('Content-Disposition',"inline; filename=COA."+({'application/pdf':'pdf','image/png':'png','image/jpeg':'jpg'}[f.mime]||'bin')+"; filename*=UTF-8''"+encodeURIComponent(f.name));res.send(f.content);
 }catch(e){res.status(500).json({success:false,message:'COA 파일을 열지 못했습니다.'});}});
}
module.exports={write,install};
