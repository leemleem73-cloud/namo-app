'use strict';
const labels={dashboard:'종합 대시보드',orders:'수주납기 관리',purchase:'구매발주 관리',work:'작업지시서',incoming:'수입검사',process:'공정검사',outgoing:'출하검사',ncr:'부적합',spcTrend:'SPC / Trend',changeControl:'변경관리',lotTrace:'LOT 추적',equipment:'설비관리',instrumentMgmt:'계측기관리',calibrationMgmt:'검교정관리',standard:'문서관리',approval:'전자결재'};
function classify(path,body={}){
 if(/delete|read-all|\/read$|\/search|\/query|\/preview|\/health|\/notifications/i.test(path))return null;
 if(path.startsWith('/api/qmes-sync/')){
  const kind=path.split('/')[3],key=String(body.key||'');
  if(kind==='inventory')return key==='erp:purchase'?'purchase':/^erp:(sales|orders|delivery)/.test(key)?'orders':null;
  return {iqc:'incoming',pqc:'process',oqc:'outgoing',change:'changeControl',changeControl:'changeControl',equipment:'equipment',instrument:'instrumentMgmt',instruments:'instrumentMgmt',calibration:'calibrationMgmt',standard:'standard',approval:'approval',spc:'spcTrend',lot:'lotTrace'}[kind]||null;
 }
 for(const [prefix,page]of [['/api/qmes-change','changeControl'],['/api/qmes-instruments','instrumentMgmt'],['/api/qmes-calibrations','calibrationMgmt'],['/api/qmes/equipment','equipment'],['/api/purchase-orders','purchase'],['/api/qmes/work-orders','work'],['/api/qmes/standard-documents','standard'],['/api/qmes-quality/approvals','approval'],['/api/qmes/ncr','ncr'],['/api/ncr','ncr'],['/api/iqc','incoming'],['/api/pqc','process'],['/api/oqc','outgoing'],['/api/instruments','instrumentMgmt'],['/api/calibrations','calibrationMgmt'],['/api/equipment','equipment'],['/api/change-control','changeControl'],['/api/sales','orders'],['/api/orders','orders']])if(path===prefix||path.startsWith(prefix+'/'))return page;
 return null;
}
function commercial(user){return String(user.role||'').toLowerCase()==='admin'||String(user.department||user.dept||'').replace(/\s/g,'')==='영업부'||['김종혁','김세희','정영기'].includes(String(user.name||'').replace(/\s/g,''));}
module.exports={classify,install(app,{pool,requireLogin}){
 if(app.__qmesModuleNotifications)return;app.__qmesModuleNotifications=true;
 let ready;
 const schema=()=>ready||(ready=pool.query('CREATE TABLE IF NOT EXISTS qmes_module_update_events(id BIGSERIAL PRIMARY KEY,page TEXT NOT NULL,title TEXT NOT NULL,created_at TIMESTAMPTZ NOT NULL DEFAULT NOW());CREATE TABLE IF NOT EXISTS qmes_module_update_reads(user_id UUID NOT NULL,event_id BIGINT NOT NULL REFERENCES qmes_module_update_events(id) ON DELETE CASCADE,read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),PRIMARY KEY(user_id,event_id));CREATE INDEX IF NOT EXISTS qmes_module_update_events_created_idx ON qmes_module_update_events(created_at DESC)').catch(error=>{ready=null;throw error;}));
 app.use((req,res,next)=>{
  if(!['POST','PUT','PATCH'].includes(req.method))return next();

  const original=res.json;let captured=false;
  res.json=function(body){
   const page=classify(req.path,req.body);
   if(page&&!captured&&req.session?.user?.id&&res.statusCode>=200&&res.statusCode<300&&body?.success===true){
    captured=true;
    // Successful writes only; no document contents, identifiers or private fields in the shared feed.
    schema().then(()=>pool.query('INSERT INTO qmes_module_update_events(page,title) VALUES($1,$2)',[page,labels[page]+' 저장·수정 완료'])).catch(error=>console.warn('[QMES update notification]',error.message));
   }
   return original.call(this,body);
  };next();
 });
 app.get('/api/qmes/module-notifications',requireLogin,async(req,res)=>{
  try{
   await schema();const allowed=commercial(req.session.user);
   const rows=await pool.query("SELECT e.* FROM qmes_module_update_events e LEFT JOIN qmes_module_update_reads r ON r.event_id=e.id AND r.user_id=$1 WHERE r.event_id IS NULL AND ($2 OR e.page NOT IN ('orders','purchase')) ORDER BY e.created_at DESC,e.id DESC LIMIT 200",[req.session.user.id,allowed]);
   const count=await pool.query("SELECT COUNT(*)::int AS count FROM qmes_module_update_events e LEFT JOIN qmes_module_update_reads r ON r.event_id=e.id AND r.user_id=$1 WHERE r.event_id IS NULL AND ($2 OR e.page NOT IN ('orders','purchase'))",[req.session.user.id,allowed]);
   res.set('Cache-Control','private, no-store');res.json({success:true,data:rows.rows,unread:count.rows[0].count});
  }catch(error){res.status(500).json({success:false,message:'변경 알림을 불러오지 못했습니다.'});}
 });
 app.post('/api/qmes/module-notifications/:id/read',requireLogin,async(req,res)=>{
  try{if(!/^\d+$/.test(req.params.id))return res.status(400).json({success:false});
   await schema();await pool.query("INSERT INTO qmes_module_update_reads(user_id,event_id) SELECT $1,id FROM qmes_module_update_events WHERE id=$2 AND ($3 OR page NOT IN ('orders','purchase')) ON CONFLICT DO NOTHING",[req.session.user.id,req.params.id,commercial(req.session.user)]);res.json({success:true});
  }catch(error){res.status(500).json({success:false,message:'읽음 처리 실패'});}
 });
 app.post('/api/qmes/module-notifications/read-all',requireLogin,async(req,res)=>{
  try{await schema();await pool.query("INSERT INTO qmes_module_update_reads(user_id,event_id) SELECT $1,id FROM qmes_module_update_events WHERE ($2 OR page NOT IN ('orders','purchase')) ON CONFLICT DO NOTHING",[req.session.user.id,commercial(req.session.user)]);res.json({success:true});
  }catch(error){res.status(500).json({success:false,message:'읽음 처리 실패'});}
 });
 app.post('/api/qmes-quality/notifications/:id/read',requireLogin,async(req,res)=>{
  try{if(!/^\d+$/.test(req.params.id))return res.status(400).json({success:false});
   await pool.query('UPDATE qmes_quality_notifications SET read_at=COALESCE(read_at,NOW()) WHERE id=$1 AND user_id=$2',[req.params.id,req.session.user.id]);res.json({success:true});
  }catch(error){res.status(500).json({success:false,message:'읽음 처리 실패'});}
 });
 // Unified history keeps read notifications and applies deletion only to the current user's inbox.
 let historyReady;
 const historySchema=()=>historyReady||(historyReady=schema().then(()=>pool.query('CREATE TABLE IF NOT EXISTS qmes_notification_states(user_id UUID NOT NULL,source TEXT NOT NULL,source_id BIGINT NOT NULL,read_at TIMESTAMPTZ,deleted_at TIMESTAMPTZ,PRIMARY KEY(user_id,source,source_id))')).catch(error=>{historyReady=null;throw error;}));
 async function unionSql(){
  await historySchema();
  const tables=await pool.query("SELECT to_regclass('qmes_quality_notifications') AS quality,to_regclass('qmes_work_order_dispatch_receipts') AS dispatch");
  let sql="SELECT 'module-update'::text AS source,e.id::text AS id,e.page,e.title,'저장된 변경 사항을 확인해 주세요.'::text AS message,e.created_at,r.read_at FROM qmes_module_update_events e LEFT JOIN qmes_module_update_reads r ON r.event_id=e.id AND r.user_id=$1 WHERE ($2 OR e.page NOT IN ('orders','purchase'))";
  if(tables.rows[0]?.quality)sql+=" UNION ALL SELECT 'quality',n.id::text,CASE WHEN UPPER(COALESCE(a.doc_type,''))='IQC' THEN 'incoming' WHEN UPPER(COALESCE(a.doc_type,'')) IN ('PQC','IPQC') THEN 'process' WHEN UPPER(COALESCE(a.doc_type,''))='OQC' THEN 'outgoing' ELSE n.page END,n.title,n.message,n.created_at,n.read_at FROM qmes_quality_notifications n LEFT JOIN qmes_quality_approvals a ON a.id=n.approval_id WHERE n.user_id=$1";
  if(tables.rows[0]?.dispatch)sql+=" UNION ALL SELECT 'work-dispatch',d.id::text,'work','작업지시 '||d.work_order_id,COALESCE(d.department,'')||' · 발송: '||COALESCE(d.sender_name,''),d.created_at,r.read_at FROM qmes_work_order_dispatch_receipts r JOIN qmes_work_order_dispatches d ON d.id=r.dispatch_id WHERE r.user_id=$1";
  return "SELECT n.*,COALESCE(st.read_at,n.read_at) AS effective_read_at FROM ("+sql+") n LEFT JOIN qmes_notification_states st ON st.user_id=$1 AND st.source=n.source AND st.source_id=n.id::bigint WHERE st.deleted_at IS NULL";
 }
 function validDay(value){if(!value)return true;if(!/^\d{4}-\d{2}-\d{2}$/.test(value))return false;const date=new Date(value+'T00:00:00Z');return Number.isFinite(date.getTime())&&date.toISOString().slice(0,10)===value;}
 app.get('/api/qmes/notification-history',requireLogin,async(req,res)=>{
  try{
   const from=String(req.query.from||''),to=String(req.query.to||''),filter=String(req.query.kind||'all');
   if(!validDay(from)||!validDay(to)||from&&to&&from>to)return res.status(400).json({success:false,message:'조회 날짜를 확인해 주세요.'});
   const union=await unionSql(),args=[req.session.user.id,commercial(req.session.user),from||null,to||null,filter];
   const filtered="SELECT * FROM ("+union+") h WHERE ($3::date IS NULL OR created_at>=($3::date::timestamp AT TIME ZONE 'Asia/Seoul')) AND ($4::date IS NULL OR created_at<(($4::date+INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Seoul')) AND ($5='all' OR page=$5 OR ($5='iqc' AND page='incoming') OR ($5='pqc' AND page='process') OR ($5='oqc' AND page='outgoing') OR ($5='delivery' AND page='orders') OR ($5='approval' AND source='quality'))";
   const count=await pool.query("SELECT COUNT(*)::int AS total FROM ("+filtered+") f",args);
   const total=count.rows[0].total,pages=Math.max(1,Math.ceil(total/10)),page=Math.min(pages,Math.max(1,Math.floor(Number(req.query.page)||1)));
   const rows=await pool.query(filtered+' ORDER BY created_at DESC,source,id DESC LIMIT 10 OFFSET $6',[...args,(page-1)*10]);
   const unread=await pool.query("SELECT COUNT(*)::int AS unread FROM ("+union+") h WHERE effective_read_at IS NULL",args.slice(0,2));
   res.set('Cache-Control','private, no-store');res.json({success:true,data:rows.rows.map(row=>({...row,read_at:row.effective_read_at})),page,pages,total,unread:unread.rows[0].unread});
  }catch(error){console.error('[QMES notification history]',error.message);res.status(500).json({success:false,message:'알림 기록을 불러오지 못했습니다.'});}
 });
 app.post('/api/qmes/notification-history/read-all',requireLogin,async(req,res)=>{
  try{
   const union=await unionSql(),args=[req.session.user.id,commercial(req.session.user)];
   await pool.query("INSERT INTO qmes_notification_states(user_id,source,source_id,read_at) SELECT $1,source,id::bigint,NOW() FROM ("+union+") h ON CONFLICT(user_id,source,source_id) DO UPDATE SET read_at=COALESCE(qmes_notification_states.read_at,EXCLUDED.read_at)",args);
   await pool.query("UPDATE qmes_work_order_dispatch_receipts SET read_at=COALESCE(read_at,NOW()) WHERE user_id=$1",[req.session.user.id]).catch(()=>{});
   res.json({success:true});
  }catch(error){res.status(500).json({success:false,message:'알림 읽음 처리 실패'});}
 });
 app.post('/api/qmes/notification-history/:source/:id/:action',requireLogin,async(req,res)=>{
  try{
   const {source,id,action}=req.params;if(!['module-update','quality','work-dispatch'].includes(source)||!/^\d{1,18}$/.test(id)||!['read','delete'].includes(action))return res.status(400).json({success:false});
   const union=await unionSql(),args=[req.session.user.id,commercial(req.session.user),source,id];
   const found=await pool.query("SELECT id FROM ("+union+") h WHERE source=$3 AND id=$4",args);
   if(!found.rows.length)return res.status(404).json({success:false,message:'해당 알림을 찾을 수 없습니다.'});
   await pool.query("INSERT INTO qmes_notification_states(user_id,source,source_id,read_at,deleted_at) VALUES($1,$2,$3,NOW(),CASE WHEN $4 THEN NOW() ELSE NULL END) ON CONFLICT(user_id,source,source_id) DO UPDATE SET read_at=COALESCE(qmes_notification_states.read_at,EXCLUDED.read_at),deleted_at=CASE WHEN $4 THEN NOW() ELSE qmes_notification_states.deleted_at END",[req.session.user.id,source,id,action==='delete']);
   if(source==='work-dispatch')await pool.query('UPDATE qmes_work_order_dispatch_receipts SET read_at=COALESCE(read_at,NOW()) WHERE dispatch_id=$1 AND user_id=$2',[id,req.session.user.id]);
   res.json({success:true});
  }catch(error){res.status(500).json({success:false,message:'알림 처리 실패'});}
 });

}};
