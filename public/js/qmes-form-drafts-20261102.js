/* Local, account-separated form drafts. A draft never submits or approves a record. */
(function(factory){
  'use strict';
  const core=factory();
  if(typeof module==='object'&&module.exports)module.exports=core;
  if(typeof window==='undefined'||!window.document)return;
  if(window.qmesFormDrafts)return;
  core.install(window);
})(function(){
  'use strict';
  const PREFIX='qmes-form-draft-v1:',TTL=30*24*60*60*1000;
  const labels={orders:'수주납기',purchase:'구매발주',work:'작업지시서',incoming:'수입검사',process:'공정검사',outgoing:'출하검사',standard:'문서관리',equipment:'설비관리',changeControl:'변경관리',instrumentMgmt:'계측기관리',calibrationMgmt:'검교정관리',ncr:'부적합'};
  const paths={orders:/^\/api\/(?:qmes\/orders|qmes-sync\/orders?|orders)(?:\/[^/]+)?$/,purchase:/^\/api\/purchase-orders(?:\/[^/]+)?$/,work:/^\/api\/qmes\/work-orders(?:\/[^/]+)?$/,incoming:/^\/api\/iqc(?:\/[^/]+)?$/,process:/^\/api\/(?:qmes-sync\/pqc\/(?:save-row|register)|qmes\/inspections\/process(?:\/[^/]+)?)$/,outgoing:/^\/api\/(?:qmes-sync\/oqc\/(?:save-row|register)|qmes\/inspections\/outgoing(?:\/[^/]+)?)$/,standard:/^\/api\/qmes\/standard-documents(?:\/[^/]+)?$/,changeControl:/^\/api\/qmes-change(?:\/[^/]+)?$/,instrumentMgmt:/^\/api\/qmes-instruments(?:\/[^/]+)?$/,calibrationMgmt:/^\/api\/qmes-calibrations(?:\/[^/]+)?$/,equipment:/^\/api\/(?:qmes\/equipment|qmes-sync\/equipment)(?:\/[^/]+)?$/,ncr:/^\/api\/(?:qmes\/ncr|qmes-ncr)(?:\/[^/]+)?$/};
  function keyOf(actor,module,mode,record){return PREFIX+[actor,module,mode,record||'new'].map(encodeURIComponent).join(':');}
  function signature(fields,rows){return JSON.stringify({fields,rows});}
  function repository(storage,now=Date.now){
    return {
      read(key,actor){
        let value;try{value=JSON.parse(storage.getItem(key)||'null');}catch(_){return null;}
        if(!value)return null;
        if(value.version!==1||value.actor!==actor||!Array.isArray(value.fields)||!Number.isFinite(value.at)||now()-value.at>TTL){if(value.actor===actor)storage.removeItem(key);return null;}
        return value;
      },
      write(key,value){const text=JSON.stringify(value);if(text.length>1500000)throw Error('임시저장 용량을 초과했습니다.');storage.setItem(key,text);},
      remove(key){storage.removeItem(key);},
      finish(key,actor,revision){if(!storage.getItem(key))return true;const value=this.read(key,actor);if(!value||value.revision!==revision)return false;this.remove(key);return true;}
    };
  }
  function successful(response,body){return response.ok&&body&&body.success!==false&&body.data?.created!==false;}
  function isRecordWrite(module,path,method){return /^(POST|PUT|PATCH)$/.test(method)&&!/(?:delete|action|approval|photo|attachment|send)/i.test(path)&&!!paths[module]?.test(path);}
  function install(win){
    const doc=win.document,repo=repository(win.localStorage),contexts=new WeakMap();
    let active=null,queued=false,authorized='',restoring=0,serial=0;
    const sessionId=win.crypto?.randomUUID?.()||Date.now()+'-'+Math.random();
    const revision=()=>sessionId+':'+(++serial);
    const clean=value=>String(value||'').replace(/\s+/g,' ').trim();
    const actor=()=>String(win.__QMES_CURRENT_USER__?.id||win.__QMES_CURRENT_USER__?.uid||win.__QMES_CURRENT_USER__?.loginId||win.__QMES_CURRENT_USER__?.employeeNo||'');
    const allowed=()=>authorized&&actor()===authorized&&!doc.getElementById('qauth-login');
    const visible=node=>!!node&&node.isConnected&&!node.hidden&&win.getComputedStyle(node).display!=='none'&&node.getClientRects().length>0;
    function locate(){
      const modal=[...doc.querySelectorAll('.qce-modal-bg[data-qmes-draft-module],.eq-wo-overlay[data-qmes-draft-module],#ncr .ncr-editor-shell[data-qmes-draft-module]')].filter(visible).pop();
      if(modal)return {host:modal,root:modal.querySelector('.ncr-editor-main')||modal,module:modal.dataset.qmesDraftModule,mode:modal.dataset.qmesDraftMode||(modal.dataset.qmesDraftRecord==='new'?'new':'edit'),record:modal.dataset.qmesDraftRecord||'new'};
      const standalone=doc.getElementById('namo-purchase-new-enterprise');
      if(visible(standalone))return {host:standalone,root:standalone,module:'purchase',mode:'new',record:'new'};
      const workspace=doc.getElementById('mainWorkspace');
      if(!workspace?.classList.contains('active')||!visible(workspace))return null;
      const split=workspace.querySelector('.am-split[data-am-screen]');
      if(!split)return null;
      const module=split.dataset.amScreen,root=split.querySelector('.am-detail-pane');
      if(!labels[module]||!root)return null;
      const rawMode=split.dataset.amMode||(/신규|새.*등록/.test(root.querySelector('.title-wrap b')?.textContent||'')?'new':'edit');
      const mode=rawMode==='new'?'new':'edit';
      const record=mode==='new'?'new':split.dataset.amRecord||split.querySelector('.am-list-item.active')?.dataset.amRecordId;
      // Never share a draft between two edits whose record identity is unknown.
      if(mode!=='new'&&!record)return null;
      return {host:split,root,module,mode,record:record||'new'};
    }
    function controls(root){return [...root.querySelectorAll('input,select,textarea')].filter(el=>!el.closest('[data-qmes-draft-bar],.std-document-preview,.am-list-pane')&&(el.type==='hidden'||visible(el))&&!el.disabled&&!el.readOnly&&!['password','file','submit','button','reset'].includes(el.type)&&!(el.type==='hidden'&&!el.matches('[data-standard-field],[data-k],[data-pqc-field],[data-oqc-field],[data-oqc-registration-field]'))&&!/password|token|secret|csrf|auth/i.test([el.id,el.name].join(' ')));}
    function identifiers(root){
      const counts=new Map();return controls(root).map(el=>{
        const hint=el.dataset.standardField||el.dataset.pqcField||el.dataset.oqcRegistrationField||el.dataset.oqcField||el.dataset.k||el.id||el.name||el.className||el.getAttribute('placeholder')||el.tagName;
        const base=el.tagName+'|'+el.type+'|'+hint,index=counts.get(base)||0;counts.set(base,index+1);
        return {el,key:base+'|'+index};
      });
    }
    function snapshot(ctx){
      if(!visible(ctx.root)&&ctx.latest)return ctx.latest;
      const fields=identifiers(ctx.root).map(({el,key})=>({key,type:el.type,value:el.value,checked:!!el.checked}));
      const data={fields,rows:{work:ctx.root.querySelectorAll('#workMaterialTable tbody tr').length,purchase:ctx.root.querySelectorAll('#npo-tbody>tr').length},files:[...ctx.root.querySelectorAll('input[type=file]')].flatMap(el=>[...(el.files||[])].map(file=>file.name))};
      ctx.latest=data;return data;
    }
    function bar(ctx){
      let node=ctx.root.querySelector('[data-qmes-draft-bar]');
      if(!node){node=doc.createElement('div');node.dataset.qmesDraftBar='1';node.className='qmes-draft-bar';node.setAttribute('role','status');const head=ctx.root.querySelector('.am-detail-top,h3,header');if(head)head.after(node);else ctx.root.prepend(node);}
      return node;
    }
    function show(ctx,message,recover){
      if(!allowed()||!ctx.root.isConnected)return;
      const node=bar(ctx);if(node.dataset.message===message&&node.dataset.recover===String(!!recover))return;
      node.dataset.message=message;node.dataset.recover=String(!!recover);node.replaceChildren();
      const text=doc.createElement('span');text.textContent=message;node.append(text);
      const save=doc.createElement('button');save.type='button';save.textContent='임시저장';save.dataset.qmesDraftSave='1';save.onclick=event=>{event?.preventDefault();event?.stopPropagation();saveDraft(ctx);};node.append(save);
      if(recover){
        const restore=doc.createElement('button');restore.type='button';restore.textContent='복구';restore.onclick=()=>restoreDraft(ctx);node.append(restore);
        const discard=doc.createElement('button');discard.type='button';discard.textContent='버리기';discard.onclick=()=>{if(!win.confirm('임시저장한 내용을 버리시겠습니까? 현재 입력 중인 내용은 유지됩니다.'))return;repo.remove(ctx.key);ctx.pending=null;ctx.dirty=false;ctx.baseline=signature(snapshot(ctx).fields,snapshot(ctx).rows);show(ctx,'임시저장을 버렸습니다.',false);};node.append(discard);
      }
    }
    function saveDraft(ctx){
      ensure();
      if(!allowed()||active!==ctx||ctx.actor!==authorized||restoring)return;
      if(ctx.pending&&!win.confirm('이전에 임시저장한 내용이 있습니다. 현재 입력 내용으로 덮어쓰시겠습니까?'))return;
      win.clearTimeout(ctx.timer);
      const data=snapshot(ctx),nextRevision=revision();
      const value={version:1,actor:ctx.actor,module:ctx.module,mode:ctx.mode,record:ctx.record,revision:nextRevision,at:Date.now(),...data};
      try{
        repo.write(ctx.key,value);
        ctx.pending=null;ctx.dirty=true;ctx.revision=nextRevision;ctx.last=signature(data.fields,data.rows);
        show(ctx,'임시저장 완료 · '+new Date(value.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+' · 같은 브라우저에서 30일간 보관됩니다.'+(data.files.length?' 첨부파일은 다시 선택해 주세요.':''),false);
      }catch(_){show(ctx,'임시저장 실패 · 브라우저 저장 공간을 확인해 주세요. 현재 입력 내용은 유지됩니다.',!!ctx.pending);}
    }
    function flush(ctx=active){
      if(!ctx||!ctx.dirty||ctx.pending||restoring||!allowed()||ctx.actor!==authorized)return;
      const data=snapshot(ctx),sig=signature(data.fields,data.rows);
      if(sig===ctx.last){try{const prior=repo.read(ctx.key,ctx.actor);if(prior&&prior.revision!==ctx.revision)repo.write(ctx.key,{...prior,revision:ctx.revision});}catch(_){show(ctx,'브라우저 임시저장 공간이 부족합니다. 정식 저장을 눌러 주세요.',false);}return;}
      if(sig===ctx.baseline){repo.remove(ctx.key);ctx.dirty=false;ctx.last=sig;show(ctx,'입력 변경 시 자동으로 임시저장됩니다.',false);return;}
      const value={version:1,actor:ctx.actor,module:ctx.module,mode:ctx.mode,record:ctx.record,revision:ctx.revision,at:Date.now(),...data};
      try{repo.write(ctx.key,value);ctx.last=sig;show(ctx,'임시저장됨 · '+new Date(value.at).toLocaleTimeString('ko-KR',{hour:'2-digit',minute:'2-digit'})+(data.files.length?' · 첨부파일은 복구 시 다시 선택해 주세요.':''),false);}catch(_){show(ctx,'브라우저 임시저장 공간이 부족합니다. 정식 저장을 눌러 주세요.',false);}
    }
    function ensure(){
      queued=false;if(win.qmesLastView?.isRestoring?.())return;
      if(!allowed()){if(active?.root.isConnected)active.root.querySelector('[data-qmes-draft-bar]')?.remove();active=null;return;}
      const found=locate();if(!found){if(active)flush(active);active=null;return;}
      const key=keyOf(authorized,found.module,found.mode,found.record);
      if(active&&active.root===found.root&&active.key===key)return;
      if(active)flush(active);
      let ctx=contexts.get(found.root);
      if(!ctx||ctx.key!==key){
        ctx={...found,key,actor:authorized,dirty:false,pending:null,revision:revision(),timer:null};const data=snapshot(ctx);ctx.baseline=ctx.last=signature(data.fields,data.rows);contexts.set(found.root,ctx);
        let prior;try{prior=repo.read(key,authorized);}catch(_){}
        if(prior){ctx.pending=prior;show(ctx,'작성 중 임시저장 · '+new Date(prior.at).toLocaleString('ko-KR')+(prior.files?.length?' · 첨부파일은 다시 선택해 주세요.':''),true);}
        else show(ctx,'입력 변경 시 자동으로 임시저장됩니다.',false);
      }
      active=ctx;
    }
    function schedule(){if(!queued){queued=true;win.requestAnimationFrame(ensure);}}
    function setRows(ctx,prior){
      const specs=[['work','#workMaterialTable tbody','#workRowAdd','.row-del'],['purchase','#npo-tbody','#npo-add','.remove']];
      specs.forEach(([key,selector,addSelector,removeSelector])=>{
        const body=ctx.root.querySelector(selector),add=ctx.root.querySelector(addSelector),target=Math.min(200,Number(prior.rows?.[key])||0);if(!body||!target)return;
        for(let n=0;n<200&&body.children.length<target&&add;n++){const count=body.children.length;add.click();if(body.children.length===count)break;}
        for(let n=0;n<200&&body.children.length>target;n++){const count=body.children.length;body.lastElementChild.querySelector(removeSelector)?.click();if(body.children.length===count)break;}
      });
    }
    function applyFields(ctx,prior){
      const saved=new Map(prior.fields.map(field=>[field.key,field]));
      identifiers(ctx.root).forEach(({el,key})=>{
        const field=saved.get(key);if(!field||field.type!==el.type)return;
        let changed=false;
        if(['checkbox','radio'].includes(el.type)){changed=el.checked!==field.checked;el.checked=field.checked;}
        else {if(el.tagName==='SELECT'&&field.value&&![...el.options].some(option=>option.value===field.value))el.add(new Option(field.value,field.value));changed=el.value!==field.value;el.value=field.value;}
        if(changed){el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));}
        if(el.dataset.standardField){const button=ctx.root.querySelector('[data-standard-choice="'+el.dataset.standardField+'"]');if(button?.firstElementChild)button.firstElementChild.textContent=el.value;}
      });
    }
    async function restoreDraft(ctx){
      if(!allowed()||active!==ctx||!ctx.pending)return;
      const prior=ctx.pending;restoring++;
      try{
        setRows(ctx,prior);applyFields(ctx,prior);
        await new Promise(resolve=>win.requestAnimationFrame(()=>win.requestAnimationFrame(resolve)));
        if(!allowed()||active!==ctx)return;
        // Material selections can replace dependent LOT controls on the next frame.
        applyFields(ctx,prior);ctx.pending=null;ctx.dirty=true;ctx.revision=revision();ctx.last='';
        show(ctx,'임시저장을 복구했습니다.'+(prior.files?.length?' 첨부파일은 다시 선택해 주세요.':''),false);
      }finally{restoring--;}
      flush(ctx);
    }
    function changed(event){
      if(restoring||win.qmesLastView?.isRestoring?.()||!allowed()||!event.target.matches?.('input,select,textarea'))return;
      ensure();const ctx=active;if(!ctx||!ctx.root.contains(event.target)||event.target.closest('[data-qmes-draft-bar],.am-list-pane,.std-document-preview'))return;
      // Typing after declining to recover starts a new draft; never silently apply old values.
      ctx.pending=null;ctx.dirty=true;ctx.revision=revision();snapshot(ctx);win.clearTimeout(ctx.timer);ctx.timer=win.setTimeout(()=>flush(ctx),600);
    }
    function beginSave(root){ensure();if(!active||!allowed()||active.pending||!(root===active.host||root===active.root||root.contains(active.root)||active.root.contains(root)))return null;flush(active);return {ctx:active,key:active.key,actor:active.actor,revision:active.revision};}
    function completeSave(token){
      if(!token||!allowed()||authorized!==token.actor||token.ctx.revision!==token.revision)return;
      try{if(!repo.finish(token.key,token.actor,token.revision))return;}catch(_){return;}
      const ctx=token.ctx;ctx.pending=null;ctx.dirty=false;const now=snapshot(ctx);ctx.baseline=ctx.last=signature(now.fields,now.rows);show(ctx,'정식 저장 완료 · 임시저장을 정리했습니다.',false);
    }
    const previousFetch=win.fetch;
    win.fetch=function(input,options){
      let token=null;
      try{
        const url=new URL(typeof input==='string'||input instanceof URL?String(input):input.url,win.location.href),method=String(options?.method||input?.method||'GET').toUpperCase();
        if(url.origin===win.location.origin&&active&&allowed()&&!active.pending&&!active.host.hasAttribute('data-qmes-draft-manual-commit')&&isRecordWrite(active.module,url.pathname,method)){
          flush(active);token={ctx:active,key:active.key,actor:active.actor,revision:active.revision};
        }
      }catch(_){}
      const promise=previousFetch.apply(this,arguments);
      promise.then(response=>{if(response.status===401)flush();}).catch(()=>{});
      if(token)promise.then(response=>{if(!response.ok)return;response.clone().json().then(body=>{
        if(successful(response,body))completeSave(token);
      }).catch(()=>{});}).catch(()=>{});
      return promise;
    };
    function authorize(){const gate=win.qmesAuthDataReady;Promise.resolve(gate?.wait()).then(()=>{authorized=actor();schedule();});}
    const style=doc.createElement('style');style.textContent='.qmes-draft-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:8px 0;padding:7px 10px;border:1px solid #d9e6f0;border-radius:5px;background:#f5faff;color:#57738b;font:12px/1.5 "Malgun Gothic",sans-serif}.qmes-draft-bar>span{flex:1;min-width:160px}.qmes-draft-bar>button{flex:none;border:1px solid #c9dcea;border-radius:4px;background:#fff;color:#27628e;padding:3px 9px;cursor:pointer;font:inherit}';doc.head.append(style);
    function boot(){doc.addEventListener('input',changed,true);doc.addEventListener('change',changed,true);doc.addEventListener('click',event=>{if(event.target.closest?.('[data-auth="logout"]'))flush();schedule();},true);new MutationObserver(schedule).observe(doc.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class','hidden','data-am-record','data-am-mode']});authorize();}
    win.addEventListener('qmes-authenticated',authorize);win.addEventListener('pagehide',()=>flush());win.addEventListener('beforeunload',()=>flush());doc.addEventListener('visibilitychange',()=>{if(doc.hidden)flush();});
    win.qmesFormDrafts={flush:()=>flush(),rescan:schedule,beginSave,completeSave};
    if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  }
  return {keyOf,signature,repository,successful,isRecordWrite,install,TTL};
});
