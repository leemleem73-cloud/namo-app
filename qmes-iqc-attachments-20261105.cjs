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
function reportPage(body,{title='수입검사 조회'}={}){
 return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>나모 ${escapeHtml(title)}</title><style>
 *{box-sizing:border-box}
 body{margin:0;background:#f1f5f9;color:#172f48;font:15px/1.5 'Malgun Gothic','맑은 고딕',system-ui,sans-serif}
 main{max-width:1100px;margin:auto;padding:28px 16px 36px}
 .report-header{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;padding:18px 22px;background:#fff;border:1px solid #dbe5ef;border-top:3px solid #254c79;border-radius:10px}
 .company-logo{display:block;width:180px;max-width:100%;height:auto}
 h1{margin:0;color:#173d66;font-size:22px}
 .report-grid :is(h2,summary,dt,dd,table,th,td,time,a){font-family:inherit;font-size:inherit;line-height:inherit}
 .report-grid{display:grid;grid-template-columns:minmax(0,1fr);gap:16px;align-items:start;margin-top:16px}
 .documents{display:grid;gap:12px;min-width:0}
 .receipt,.history{min-width:0;background:#fff;border:1px solid #dbe5ef;border-radius:8px;overflow:hidden}
 h2,.history summary{margin:0;padding:12px 16px;color:#173d66;font-weight:700}
 h2,.history[open] summary{background:#edf3f9;border-bottom:1px solid #dbe5ef}
 .history summary{cursor:pointer}
 .history summary:hover{background:#edf3f9}
 .history summary:focus-visible,.files a:focus-visible{outline:2px solid #2474be;outline-offset:-2px}
 dl{display:grid;grid-template-columns:minmax(90px,2fr) minmax(0,3fr);margin:0}
 dt,dd{margin:0;padding:10px 12px;border-bottom:1px solid #e4ebf2;overflow-wrap:anywhere}
 dt{background:#f6f9fc;font-weight:650}
 .receipt :is(dt,dd){display:grid;place-content:center;text-align:center}
 .receipt dt{border-right:1px solid #dbe5ef}
 dl>:nth-last-child(-n+2){border-bottom:0}
 table{width:100%;border-collapse:collapse;table-layout:fixed}
 .inspection-edge{width:30%}
 .oqc-results .result-item{width:25%}
 .oqc-results .result-judgment{width:18%}
 .oqc-results .measurement-values{display:block;overflow-x:auto;white-space:nowrap;font-variant-numeric:tabular-nums}
 @media(max-width:520px){.oqc-results :is(th,td){padding-inline:4px}.oqc-results .measurement-values{font-size:12px}}
 th,td{padding:10px 6px;text-align:center;overflow-wrap:anywhere;border-bottom:1px solid #e4ebf2}
 thead th{background:#f6f9fc}
 .inspection-date>*{background:#fff}
 .inspection-date time{font-variant-numeric:tabular-nums;white-space:nowrap}
 tbody tr:last-child td{border-bottom:0}
 .files{display:grid;gap:8px;padding:12px 16px}
 .files a{color:#135997;text-decoration:underline;overflow-wrap:anywhere}
 .pass{color:#08653f;font-weight:700}
 .fail{color:#a32424;font-weight:700}
 @media(max-width:420px){main{padding:14px 10px 24px}.report-header{padding:12px 14px}.company-logo{width:145px}h1{font-size:18px}}
 @media print{body{background:#fff}main{max-width:none;padding:0}.report-grid{grid-template-columns:1fr}tr{break-inside:avoid}}
 </style></head><body><main><header class="report-header"><img class="company-logo" src="/assets/namo-login-company-logo-20261016.svg" alt="나모케미칼(주)"><h1>${escapeHtml(title)}</h1></header>${body}</main></body></html>`;
}

function mobileReport(row,files,token){
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
 const info=[['입고일자',dates(row.date)],['공급업체',row.supplier],['원재료명',row.item],
  ['원료 LOT',row.lot],['입고 중량',row.incoming_qty==null?'—':row.incoming_qty+' kg']];
 return reportPage(`<div class="report-grid"><section class="receipt"><h2>입고정보</h2><dl>${info.map(([label,value])=>
  '<dt>'+label+'</dt><dd>'+escapeHtml(value||'—')+'</dd>').join('')}</dl></section>
 <div class="documents"><details class="history"><summary>IQC 성적서</summary>
 <table><colgroup><col class="inspection-edge"><col><col class="inspection-edge"></colgroup><thead>
 <tr class="inspection-date"><th scope="row">검사일</th><td></td><td><time>${escapeHtml(dates(metadata?.inspectionDate||row.date))}</time></td></tr>
 <tr><th scope="col">검사항목</th><th scope="col">확인 결과</th><th scope="col">판정</th></tr></thead><tbody>${rows}</tbody></table>
 </details>
 <details class="history"><summary>공급업체 CoA</summary><div class="files">${links||'첨부된 CoA가 없습니다.'}</div></details></div></div>`);
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
   res.send(mobileReport(row,files.rows,token));
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
module.exports={write,install,reportPage};
