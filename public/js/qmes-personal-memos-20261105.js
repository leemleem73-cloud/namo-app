/* Private per-account notes. No memo text is kept in shared browser storage. */
(()=>{
'use strict';
const side=document.querySelector('.right-side');if(!side)return;
const card=document.createElement('section');card.id='personal-memo-card';card.className='pm-card';card.innerHTML='<div class="pm-head"><h2>개인 메모</h2><button type="button" data-pm-open>열기</button></div><p class="pm-private">나만 볼 수 있는 메모</p><div class="pm-preview" aria-live="polite">불러오는 중…</div><button type="button" class="pm-add" data-pm-new>+ 메모 작성</button>';side.prepend(card);
const mobile=document.createElement('button');mobile.type='button';mobile.className='pm-mobile';mobile.textContent='개인 메모';document.body.append(mobile);
const dialog=document.createElement('dialog');dialog.className='pm-dialog';dialog.setAttribute('aria-labelledby','pm-title');
dialog.innerHTML='<header><div><h2 id="pm-title">개인 메모</h2><p>본인 계정에서만 보입니다 · 입력 후 자동저장</p></div><button type="button" data-close>닫기</button></header><div class="pm-main"><nav aria-label="내 메모"><button type="button" class="pm-primary" data-new>+ 메모 작성</button><div class="pm-list"></div></nav><section class="pm-editor"><label>제목<input data-title maxlength="100" placeholder="메모 제목"></label><label class="pm-content">내용<textarea data-content maxlength="5000" placeholder="기억할 내용을 적어 두세요."></textarea></label><div class="pm-tools"><button type="button" data-pin aria-pressed="false">상단 고정</button><button type="button" data-remove>삭제</button><span data-status role="status" aria-live="polite"></span><button type="button" data-save>저장</button></div><div class="pm-confirm" hidden><span>이 메모를 삭제할까요?</span><button type="button" data-delete-yes>삭제</button><button type="button" data-delete-no>취소</button></div></section></div>';
document.body.append(dialog);
const title=dialog.querySelector('[data-title]'),content=dialog.querySelector('[data-content]'),pin=dialog.querySelector('[data-pin]'),status=dialog.querySelector('[data-status]'),list=dialog.querySelector('.pm-list'),preview=card.querySelector('.pm-preview'),confirm=dialog.querySelector('.pm-confirm');
let generation=0;
let owner='',notes=[],active=null,pinned=false,timer=0,inFlight=null,switching=false,loading=null;
const sorted=()=>notes.slice().sort((a,b)=>Number(b.pinned)-Number(a.pinned)||String(b.updated_at).localeCompare(String(a.updated_at)));
const dirty=()=>!!active&&(title.value.trim()!==active.title||content.value!==active.content||pinned!==active.pinned);
function message(text,error=false){status.textContent=text;status.dataset.error=error?'1':'0';}
async function request(path='',body){
 const r=await fetch('/api/personal-memos'+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),...(body?{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const j=await r.json().catch(()=>({}));if(!r.ok||!j.success)throw Object.assign(Error(j.message||'메모를 저장하지 못했습니다.'),{status:r.status});return j.data;
}
function resetPrivate(){owner='';notes=[];active=null;title.value='';content.value='';pinned=false;render();fill();}
function makeItem(note){
 const button=document.createElement('button');button.type='button';button.className='pm-note';button.classList.toggle('selected',active?.id===note.id);
 const heading=document.createElement('b');heading.textContent=(note.pinned?'고정 · ':'')+(note.title||'제목 없는 메모');
 const snippet=document.createElement('span');snippet.textContent=note.content||'내용 없음';button.append(heading,snippet);button.onclick=()=>activate(note);return button;
}
function render(){
 list.replaceChildren();preview.replaceChildren();
 const all=sorted();for(const note of all)list.append(makeItem(note));
 for(const note of all.slice(0,1))preview.append(makeItem(note));
 if(!all.length){list.textContent=owner?'작성한 메모가 없습니다.':'로그인 후 이용해 주세요.';preview.textContent=owner?'기억할 내용을 메모해 보세요.':'메모를 불러오지 못했습니다.';}
 for(const button of [...card.querySelectorAll('button'),dialog.querySelector('[data-new]')])button.disabled=!owner;
}
function fill(){
 const enabled=!!active&&!!owner;title.disabled=content.disabled=!enabled;pin.disabled=dialog.querySelector('[data-remove]').disabled=dialog.querySelector('[data-save]').disabled=!enabled;
 title.value=active?.title||'';content.value=active?.content||'';pinned=active?.pinned||false;pin.setAttribute('aria-pressed',String(pinned));pin.textContent=pinned?'고정됨':'상단 고정';confirm.hidden=true;
 message(active?.version?'저장 완료':active?'입력하면 자동저장됩니다.':'메모를 선택하거나 작성해 주세요.');
}
function flush(){
 clearTimeout(timer);
 if(inFlight)return inFlight;
 if(!dirty())return Promise.resolve(true);
 inFlight=(async()=>{
  try{
   while(dirty()){
    const current=active,payload={ownerId:owner,id:current.id,version:current.version,title:title.value.trim(),content:content.value,pinned};
    message('저장 중…');const saved=await request('',payload);
    if(active?.id!==current.id)return false;
    generation++;active=saved;const index=notes.findIndex(n=>n.id===saved.id);if(index<0)notes.push(saved);else notes[index]=saved;
    render();message('저장 완료');
   }
   return true;
  }catch(e){if(e.status===401||e.status===403)resetPrivate();message(e.message||'저장 실패 · 다시 저장해 주세요.',true);return false;}
  finally{inFlight=null;}
 })();
 return inFlight;
}
function schedule(){generation++;message('저장 대기');clearTimeout(timer);timer=setTimeout(()=>void flush(),650);}
title.addEventListener('input',schedule);content.addEventListener('input',schedule);
pin.onclick=()=>{pinned=!pinned;pin.setAttribute('aria-pressed',String(pinned));pin.textContent=pinned?'고정됨':'상단 고정';schedule();};
async function activate(note){
 if(switching)return;switching=true;
 try{if(!await flush())return;generation++;active=notes.find(n=>n.id===note.id)||note;fill();render();if(!dialog.open)dialog.showModal();}
 finally{switching=false;}
}
async function newNote(){
 if(switching||!owner)return;switching=true;
 try{if(!await flush())return;generation++;active={id:crypto.randomUUID(),title:'',content:'',pinned:false,version:0};fill();render();if(!dialog.open)dialog.showModal();title.focus();}
 finally{switching=false;}
}
async function load(){
 if(loading)return loading;
 loading=(async()=>{const requestedAt=generation;try{const data=await request();if(owner&&owner!==data.ownerId)resetPrivate();else if(owner&&requestedAt!==generation)return;owner=data.ownerId;notes=data.notes;if(active&&!dirty()){active=notes.find(n=>n.id===active.id)||null;fill();}render();if(!active&&notes.length){active=sorted()[0];fill();}else if(!active)fill();}
 catch(e){if(e.status===401||e.status===403)resetPrivate();if(!owner){preview.textContent=e.message;const retry=document.createElement('button');retry.type='button';retry.textContent='다시 조회';retry.onclick=()=>void load();preview.append(retry);}message(e.message,true);}
 finally{loading=null;}})();return loading;
}
async function open(){if(!owner)await load();if(!dialog.open)dialog.showModal();if(!active&&owner)void newNote();}
mobile.onclick=open;card.querySelector('[data-pm-open]').onclick=open;card.querySelector('[data-pm-new]').onclick=newNote;dialog.querySelector('[data-new]').onclick=newNote;
dialog.querySelector('[data-save]').onclick=()=>void flush();
const close=async()=>{if(await flush())dialog.close();};
dialog.querySelector('[data-close]').onclick=close;dialog.addEventListener('cancel',event=>{event.preventDefault();void close();});
dialog.querySelector('[data-remove]').onclick=()=>{confirm.hidden=false;};
dialog.querySelector('[data-delete-no]').onclick=()=>{confirm.hidden=true;};
dialog.querySelector('[data-delete-yes]').onclick=async()=>{
 if(switching||!active)return;switching=true;
 try{clearTimeout(timer);if(!await flush())return;const current=active;if(current.version)await request('/delete',{ownerId:owner,id:current.id,version:current.version});generation++;notes=notes.filter(n=>n.id!==current.id);active=sorted()[0]||null;fill();render();message('삭제 완료');}
 catch(e){if(e.status===401||e.status===403)resetPrivate();message(e.message,true);}
 finally{switching=false;}
};
window.addEventListener('beforeunload',event=>{if(dirty()||inFlight){event.preventDefault();event.returnValue='';}});
window.addEventListener('focus',()=>void load());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&dirty())void flush();});
const style=document.createElement('style');style.textContent=`
#personal-memo-card{padding:13px 14px;color:#244260;background:rgba(255,255,255,.96);border:1px solid #d8e3ed;border-radius:10px;font:12px Pretendard,"Malgun Gothic",sans-serif}
.pm-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.pm-head h2{font-size:14px;margin:0;color:#173b61}.pm-private{font-size:11px;color:#73859a;margin:5px 0 8px}.pm-card button,.pm-dialog button,.pm-mobile{font:inherit;cursor:pointer;color:#244260;border:1px solid #cbd9e7;background:white;border-radius:4px;padding:5px 9px}.pm-preview{max-height:44px;overflow:auto;color:#73859a}.pm-add{margin-top:8px;width:100%;background:#f2f7fc!important}
.pm-note{display:block;width:100%;text-align:left;border:0!important;border-bottom:1px solid #e3ebf3!important;border-radius:0!important;padding:8px!important;background:transparent!important}.pm-note b,.pm-note span{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.pm-note b{font-size:12px;font-weight:600}.pm-note span{font-size:11px;color:#73859a;margin-top:3px}.pm-note.selected{background:#eef6ff!important}
.pm-dialog{padding:0;border:1px solid #d0dce8;border-radius:9px;width:min(740px,calc(100vw - 28px));max-height:88dvh;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif;background:#fff;box-shadow:0 16px 50px #173b6133}.pm-dialog::backdrop{background:#18314b66}.pm-dialog header{display:flex;justify-content:space-between;align-items:center;padding:15px 18px;border-bottom:1px solid #d8e3ed}.pm-dialog h2{margin:0;font-size:18px;color:#173b61}.pm-dialog header p{margin:5px 0 0;color:#73859a;font-size:11px}.pm-main{display:grid;grid-template-columns:200px minmax(0,1fr);min-height:370px}.pm-main nav{padding:12px;border-right:1px solid #d8e3ed;background:#f7fafc}.pm-primary{background:#2f8de4!important;color:white!important;border-color:#2f8de4!important;width:100%}.pm-list{max-height:330px;overflow:auto;margin-top:8px;color:#73859a}.pm-editor{padding:14px;min-width:0;display:flex;flex-direction:column;gap:12px}.pm-editor label{display:flex;flex-direction:column;gap:6px;font-weight:600}.pm-editor input,.pm-editor textarea{box-sizing:border-box;width:100%;font:12px Pretendard,"Malgun Gothic",sans-serif;color:#244260;border:1px solid #cbd9e7;border-radius:4px;padding:9px;background:#fff;outline-color:#2f8de4}.pm-content{flex:1}.pm-content textarea{flex:1;min-height:205px;resize:vertical;line-height:1.65}.pm-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pm-tools [data-status]{flex:1;font-size:11px;color:#64806d;min-width:100px}.pm-tools [data-error="1"]{color:#b42318}.pm-tools [aria-pressed="true"]{background:#eaf4ff;border-color:#2f8de4;color:#1a68ad}.pm-confirm{padding:10px;background:#fff4f3;border:1px solid #f0cfca;border-radius:4px}.pm-confirm[hidden]{display:none}.pm-confirm span{display:block;margin-bottom:8px}.pm-mobile{display:none;position:fixed;right:18px;top:18px;z-index:12;font-size:12px;background:#fff}
@media(max-width:1080px){.pm-mobile{display:block}}@media(max-width:600px){.pm-main{grid-template-columns:1fr}.pm-main nav{border-right:0;border-bottom:1px solid #d8e3ed}.pm-list{max-height:90px}.pm-content textarea{min-height:150px}.pm-dialog{max-height:92dvh}.pm-dialog header{padding:12px}.pm-editor{padding:12px}}
`;document.head.append(style);
void load();
})();
