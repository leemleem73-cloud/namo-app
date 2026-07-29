/* NAMO Talk Supabase backend adapter.
 * Configure window.QMES_SUPABASE_CONFIG before this script or store
 * qmes_supabase_url / qmes_supabase_anon_key in localStorage.
 */
(function(){
  const state={client:null,enabled:false,channel:null,lastError:null};

  function config(){
    const globalCfg=window.QMES_SUPABASE_CONFIG||{};
    return {
      url:globalCfg.url||localStorage.getItem('qmes_supabase_url')||'',
      anonKey:globalCfg.anonKey||localStorage.getItem('qmes_supabase_anon_key')||''
    };
  }

  function mapRow(row){
    const created=new Date(row.created_at||Date.now());
    return {
      id:row.id,
      createdAt:created.getTime(),
      sender:row.sender_name,
      dept:row.sender_dept||'',
      text:row.message_text||'',
      time:created.toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit',hour12:false}),
      kind:row.message_kind||'text',
      fileName:row.file_name||'',
      fileType:row.file_type||'',
      fileData:row.file_url||''
    };
  }

  async function init(){
    if(state.enabled&&state.client)return true;
    const cfg=config();
    if(!cfg.url||!cfg.anonKey||!window.supabase?.createClient){
      state.enabled=false;
      return false;
    }
    try{
      state.client=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:false}});
      const {error}=await state.client.from('namo_talk_messages').select('id').limit(1);
      if(error)throw error;
      state.enabled=true;
      state.lastError=null;
      return true;
    }catch(error){
      state.enabled=false;
      state.lastError=error;
      console.warn('[NAMO Talk] Supabase 연결 실패',error);
      return false;
    }
  }

  async function loadAll(){
    if(!(await init()))return null;
    const {data,error}=await state.client.from('namo_talk_messages').select('*').order('created_at',{ascending:true}).limit(2000);
    if(error)throw error;
    return (data||[]).reduce((acc,row)=>{
      (acc[row.room_id]||(acc[row.room_id]=[])).push(mapRow(row));
      return acc;
    },{});
  }

  async function send(roomId,payload){
    if(!(await init()))return null;
    const row={
      room_id:roomId,
      sender_name:payload.sender,
      sender_dept:payload.dept||'',
      message_text:payload.text||'',
      message_kind:payload.kind||'text',
      file_name:payload.fileName||null,
      file_type:payload.fileType||null,
      file_url:payload.fileData||null,
      client_message_id:String(payload.id||Date.now())
    };
    const {data,error}=await state.client.from('namo_talk_messages').insert(row).select().single();
    if(error)throw error;
    return mapRow(data);
  }

  async function markRead(roomId,userName){
    if(!(await init()))return false;
    const {error}=await state.client.from('namo_talk_reads').upsert({room_id:roomId,user_name:userName,read_at:new Date().toISOString()},{onConflict:'room_id,user_name'});
    if(error)throw error;
    return true;
  }

  async function subscribe(onInsert){
    if(!(await init()))return null;
    if(state.channel)await state.client.removeChannel(state.channel);
    state.channel=state.client.channel('namo-talk-realtime').on('postgres_changes',{event:'INSERT',schema:'public',table:'namo_talk_messages'},payload=>onInsert(payload.new.room_id,mapRow(payload.new))).subscribe();
    return state.channel;
  }

  async function unsubscribe(){
    if(state.client&&state.channel){await state.client.removeChannel(state.channel);state.channel=null;}
  }

  window.NamoTalkBackend={init,loadAll,send,markRead,subscribe,unsubscribe,isEnabled:()=>state.enabled,getError:()=>state.lastError,getConfig:config};
})();