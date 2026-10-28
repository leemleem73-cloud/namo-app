'use strict';
const labels={dashboard:'종합 대시보드',orders:'수주납기 관리',purchase:'구매발주 관리',work:'작업지시서',incoming:'수입검사',process:'공정검사',outgoing:'출하검사',ncr:'부적합',spcTrend:'SPC / Trend',changeControl:'변경관리',lotTrace:'LOT 추적',equipment:'설비관리',instrumentMgmt:'계측기관리',calibrationMgmt:'검교정관리',standard:'문서관리',approval:'전자결재'};
function classify(path,body={}){
 if(/delete|read-all|\/read$|\/search|\/query|\/preview|\/health|\/notifications/i.test(path))return null;
 if(path.startsWith('/api/qmes-sync/')){
  const kind=path.split('/')[3],key=String(body.key||'');
  if(kind==='inventory')return key==='erp:purchase'?'purchase':/^erp:(sales|orders|delivery)/.test(key)?'orders':null;
  return {iqc:'incoming',pqc:'process',oqc:'outgoing',change:'changeControl',changeControl:'changeControl',equipment:'equipment',instrument:'instrumentMgmt',instruments:'instrumentMgmt',calibration:'calibrationMgmt',standard:'standard',approval:'approval',spc:'spcTrend',lot:'lotTrace'}[kind]||null;
 }
 for(const [prefix,page]of [['/api/purchase-orders','purchase'],['/api/qmes/work-orders','work'],['/api/qmes/standard-documents','standard'],['/api/qmes-quality/approvals','approval'],['/api/qmes/ncr','ncr'],['/api/ncr','ncr'],['/api/iqc','incoming'],['/api/pqc','process'],['/api/oqc','outgoing'],['/api/instruments','instrumentMgmt'],['/api/calibrations','calibrationMgmt'],['/api/equipment','equipment'],['/api/change-control','changeControl'],['/api/sales','orders'],['/api/orders','orders']])if(path===prefix||path.startsWith(prefix+'/'))return page;
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
}};
