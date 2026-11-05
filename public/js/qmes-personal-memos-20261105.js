/* Private per-account notes. No memo text is kept in shared browser storage. */
(()=>{
'use strict';
const side=document.querySelector('.right-side');if(!side)return;
const card=document.createElement('section');card.id='personal-memo-card';card.className='pm-card';card.innerHTML='<div class="pm-head"><h2>개인 메모</h2><button type="button" data-pm-open>전체보기</button></div><p class="pm-private">나만 볼 수 있는 메모 <span data-pm-count></span></p><div class="pm-preview" aria-live="polite">불러오는 중…</div><button type="button" class="pm-add" data-pm-new>+ 메모 작성</button>';side.prepend(card);
const mobile=document.createElement('button');mobile.type='button';mobile.className='pm-mobile';mobile.textContent='개인 메모';document.body.append(mobile);
const dialog=document.createElement('dialog');dialog.className='pm-dialog';dialog.setAttribute('aria-labelledby','pm-title');
dialog.innerHTML='<header><div><h2 id="pm-title">개인 메모</h2><p>본인 계정에서만 보입니다 · 입력 후 자동저장</p></div><button type="button" data-close>닫기</button></header><div class="pm-main"><nav aria-label="내 메모"><button type="button" class="pm-primary" data-new>+ 메모 작성</button><div class="pm-list"></div></nav><section class="pm-editor"><label>제목<input data-title maxlength="100" placeholder="메모 제목"></label><div class="pm-format"><label>메모 색상<select data-paper><option value="yellow">노랑</option><option value="white">흰색</option><option value="blue">하늘</option><option value="pink">분홍</option><option value="green">연두</option></select></label><label>글씨체<select data-font><option value="default">기본</option><option value="gothic">맑은 고딕</option><option value="serif">명조</option></select></label><label>크기<select data-size><option value="12">12</option><option value="14">14</option><option value="16">16</option><option value="18">18</option></select></label><button type="button" data-bold aria-pressed="false">굵게</button></div><label class="pm-content">내용<textarea data-content maxlength="5000" placeholder="기억할 내용을 적어 두세요."></textarea></label><div class="pm-tools"><button type="button" data-pin aria-pressed="false">상단 고정</button><button type="button" data-remove>삭제</button><span data-status role="status" aria-live="polite"></span><button type="button" data-save>저장</button></div><div class="pm-confirm" hidden><span>이 메모를 삭제할까요?</span><button type="button" data-delete-yes>삭제</button><button type="button" data-delete-no>취소</button></div></section></div>';
document.body.append(dialog);
const title=dialog.querySelector('[data-title]'),content=dialog.querySelector('[data-content]'),pin=dialog.querySelector('[data-pin]'),status=dialog.querySelector('[data-status]'),list=dialog.querySelector('.pm-list'),preview=card.querySelector('.pm-preview'),confirm=dialog.querySelector('.pm-confirm');
const paper=dialog.querySelector('[data-paper]'),font=dialog.querySelector('[data-font]'),size=dialog.querySelector('[data-size]'),bold=dialog.querySelector('[data-bold]');
const defaults={paper:'white',font:'default',size:14,bold:false};
const colors={yellow:'#faf6e9',white:'#ffffff',blue:'#f0f6fc',pink:'#fcf2f5',green:'#f2f7ee'},fonts={default:'Pretendard,"Malgun Gothic",sans-serif',gothic:'"Malgun Gothic",sans-serif',serif:'Georgia,"Batang",serif'};
const format=value=>({...defaults,...(value||{})});
let appearance={...defaults};
function paintFormat(){const editor=dialog.querySelector('.pm-editor');editor.style.setProperty('--pm-paper',colors[appearance.paper]||colors.yellow);editor.style.setProperty('--pm-font',fonts[appearance.font]||fonts.default);editor.style.setProperty('--pm-size',appearance.size+'px');editor.style.setProperty('--pm-weight',appearance.bold?'700':'400');bold.setAttribute('aria-pressed',String(appearance.bold));}
let generation=0;
let owner='',notes=[],active=null,pinned=false,timer=0,inFlight=null,switching=false,loading=null;
const sorted=()=>notes.slice().sort((a,b)=>Number(b.pinned)-Number(a.pinned)||String(b.updated_at).localeCompare(String(a.updated_at)));
const dirty=()=>!!active&&(title.value.trim()!==active.title||content.value!==active.content||pinned!==active.pinned||JSON.stringify(appearance)!==JSON.stringify(format(active.appearance)));
function message(text,error=false){status.textContent=text;status.dataset.error=error?'1':'0';}
async function request(path='',body){
 const r=await fetch('/api/personal-memos'+path,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(15000),...(body?{method:'POST',keepalive:true,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{})});
 const j=await r.json().catch(()=>({}));if(!r.ok||!j.success)throw Object.assign(Error(j.message||'메모를 저장하지 못했습니다.'),{status:r.status});return j.data;
}
function resetPrivate(){owner='';notes=[];active=null;title.value='';content.value='';pinned=false;render();fill();}
function makeItem(note){
 const button=document.createElement('button');button.type='button';button.className='pm-note';button.classList.toggle('selected',active?.id===note.id);button.dataset.noteId=note.id;const style=format(note.appearance);button.style.setProperty('--pm-paper',colors[style.paper]||colors.yellow);button.style.setProperty('--pm-font',fonts[style.font]||fonts.default);button.style.setProperty('--pm-size',style.size+'px');button.style.setProperty('--pm-weight',style.bold?'700':'400');
 const heading=document.createElement('b');heading.textContent=(note.pinned?'고정 · ':'')+(note.title||'제목 없는 메모');
 const snippet=document.createElement('span');snippet.textContent=note.content||'내용 없음';button.append(heading,snippet);button.onclick=()=>activate(note);return button;
}
function render(){
 list.replaceChildren();preview.replaceChildren();
 const all=sorted();for(const note of all)list.append(makeItem(note));
 for(const note of all)preview.append(makeItem(note));
 card.querySelector('[data-pm-count]').textContent=all.length?'· '+all.length+'개':'';
 if(!all.length){list.textContent=owner?'작성한 메모가 없습니다.':'로그인 후 이용해 주세요.';preview.textContent=owner?'기억할 내용을 메모해 보세요.':'메모를 불러오지 못했습니다.';}
 for(const button of [...card.querySelectorAll('button'),dialog.querySelector('[data-new]')])button.disabled=!owner;
}
function fill(){
 const enabled=!!active&&!!owner;title.disabled=content.disabled=!enabled;pin.disabled=dialog.querySelector('[data-remove]').disabled=dialog.querySelector('[data-save]').disabled=!enabled;
 title.value=active?.title||'';content.value=active?.content||'';pinned=active?.pinned||false;pin.setAttribute('aria-pressed',String(pinned));pin.textContent=pinned?'고정됨':'상단 고정';confirm.hidden=true;
 appearance=format(active?.appearance);paper.value=appearance.paper;font.value=appearance.font;size.value=String(appearance.size);paintFormat();for(const field of [paper,font,size,bold])field.disabled=!enabled;
 message(active?.version?'저장 완료':active?'입력하면 자동저장됩니다.':'메모를 선택하거나 작성해 주세요.');
}
function flush(){
 clearTimeout(timer);
 if(inFlight)return inFlight;
 if(!dirty())return Promise.resolve(true);
 inFlight=(async()=>{
  try{
   while(dirty()){
    const current=active,payload={ownerId:owner,id:current.id,version:current.version,title:title.value.trim(),content:content.value,pinned,appearance:{...appearance}};
    message('저장 중…');const saved=await request('',payload);
    if(!saved?.appearance||JSON.stringify(format(saved.appearance))!==JSON.stringify(payload.appearance))throw Error('메모 양식을 저장하지 못했습니다. 잠시 후 다시 저장해 주세요.');
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
for(const select of [paper,font,size])select.addEventListener('change',()=>{appearance={...appearance,paper:paper.value,font:font.value,size:Number(size.value)};paintFormat();schedule();});
bold.onclick=()=>{appearance={...appearance,bold:!appearance.bold};paintFormat();schedule();};
pin.onclick=()=>{pinned=!pinned;pin.setAttribute('aria-pressed',String(pinned));pin.textContent=pinned?'고정됨':'상단 고정';schedule();};
async function activate(note){
 if(switching)return;switching=true;
 try{if(!await flush())return;generation++;active=notes.find(n=>n.id===note.id)||note;fill();render();if(!dialog.open)dialog.showModal();}
 finally{switching=false;}
}
async function newNote(){
 if(switching||!owner)return;switching=true;
 try{if(!await flush())return;generation++;active={id:crypto.randomUUID(),title:'',content:'',pinned:false,version:0,appearance:{...defaults}};fill();render();if(!dialog.open)dialog.showModal();title.focus();}
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
dialog.querySelector('[data-save]').onclick=async()=>{
 const button=dialog.querySelector('[data-save]');
 if(!active||(!title.value.trim()&&!content.value.trim())){message('메모 내용을 입력해 주세요.',true);content.focus();return;}
 button.disabled=true;
 try{if(await flush()){render();dialog.close();card.querySelector('[data-pm-count]').textContent='· 저장 완료';preview.querySelector('[data-note-id="'+active.id+'"]')?.scrollIntoView?.({block:'nearest'});}}
 finally{button.disabled=!active;}
};
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
.pm-head{display:flex;justify-content:space-between;align-items:center;gap:8px}.pm-head h2{font-size:14px;margin:0;color:#173b61}.pm-private{font-size:11px;color:#73859a;margin:5px 0 8px}.pm-card button,.pm-dialog button,.pm-mobile{font:inherit;cursor:pointer;color:#244260;border:1px solid #cbd9e7;background:white;border-radius:4px;padding:5px 9px}.pm-preview{max-height:112px;overflow:auto;color:#73859a}.pm-add{margin-top:8px;width:100%;background:#f2f7fc!important}
.pm-note{display:block;width:100%;text-align:left;border:0!important;border-bottom:1px solid #e3ebf3!important;border-radius:0!important;padding:8px!important;background:var(--pm-paper,#fff8ce)!important}.pm-note b,.pm-note span{display:block;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.pm-note b{font-size:var(--pm-size,14px);font-weight:var(--pm-weight,400);font-family:var(--pm-font,inherit)}.pm-note span{font-size:var(--pm-size,14px);font-weight:var(--pm-weight,400);font-family:var(--pm-font,inherit);color:#73859a;margin-top:3px}.pm-note.selected{outline:1px solid #b3cce6;outline-offset:-1px}
.pm-dialog{padding:0;border:1px solid #d0dce8;border-radius:9px;width:min(740px,calc(100vw - 28px));max-height:88dvh;color:#244260;font:12px Pretendard,"Malgun Gothic",sans-serif;background:#fff;box-shadow:0 16px 50px #173b6133}.pm-dialog::backdrop{background:#18314b66}.pm-dialog header{display:flex;justify-content:space-between;align-items:center;padding:15px 18px;border-bottom:1px solid #d8e3ed}.pm-dialog h2{margin:0;font-size:18px;color:#173b61}.pm-dialog header p{margin:5px 0 0;color:#73859a;font-size:11px}.pm-main{display:grid;grid-template-columns:200px minmax(0,1fr);min-height:370px}.pm-main nav{padding:12px;border-right:1px solid #d8e3ed;background:#f7fafc}.pm-primary{background:#2f8de4!important;color:white!important;border-color:#2f8de4!important;width:100%}.pm-list{max-height:330px;overflow:auto;margin-top:8px;color:#73859a}.pm-editor{padding:14px;min-width:0;display:flex;flex-direction:column;gap:12px}.pm-editor label{display:flex;flex-direction:column;gap:6px;font-weight:600}.pm-editor input,.pm-editor textarea{box-sizing:border-box;width:100%;font:12px Pretendard,"Malgun Gothic",sans-serif;color:#244260;border:1px solid #cbd9e7;border-radius:4px;padding:9px;background:#fff;outline-color:#2f8de4}.pm-format{display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap}.pm-format label{font-size:11px}.pm-format select{height:30px;border:1px solid #cbd9e7;border-radius:4px;padding:0 5px;color:#244260;background:#fff;font:inherit}.pm-editor [data-title],.pm-editor [data-content]{background:var(--pm-paper,#fff8ce);font-family:var(--pm-font,inherit);font-size:var(--pm-size,14px);font-weight:var(--pm-weight,400)}.pm-format [aria-pressed="true"]{background:#dceeff;border-color:#2f8de4;font-weight:700}.pm-content{flex:1}.pm-content textarea{flex:1;min-height:205px;resize:vertical;line-height:1.65}.pm-tools{display:flex;align-items:center;gap:6px;flex-wrap:wrap}.pm-tools [data-status]{flex:1;font-size:11px;color:#64806d;min-width:100px}.pm-tools [data-error="1"]{color:#b42318}.pm-tools [aria-pressed="true"]{background:#eaf4ff;border-color:#2f8de4;color:#1a68ad}.pm-confirm{padding:10px;background:#fff4f3;border:1px solid #f0cfca;border-radius:4px}.pm-confirm[hidden]{display:none}.pm-confirm span{display:block;margin-bottom:8px}.pm-mobile{display:none;position:fixed;right:18px;top:18px;z-index:12;font-size:12px;background:#fff}
@media(max-width:1080px){.pm-mobile{display:block}}@media(max-width:600px){.pm-main{grid-template-columns:1fr}.pm-main nav{border-right:0;border-bottom:1px solid #d8e3ed}.pm-list{max-height:90px}.pm-content textarea{min-height:150px}.pm-dialog{max-height:92dvh}.pm-dialog header{padding:12px}.pm-editor{padding:12px}}

/* Restrained memo surface: paper colors stay subtle, controls share the portal typography. */
#personal-memo-card{border:1px solid #dfe7ef!important;border-radius:14px!important;background:rgba(255,255,255,.98)!important;box-shadow:0 8px 26px rgba(23,59,97,.08)!important;padding:16px!important}
#personal-memo-card .pm-head h2{font-size:14px;font-weight:600;letter-spacing:-.25px;border-left:3px solid #3984bd;padding-left:8px}
#personal-memo-card .pm-head button{border:0;background:#f3f6f9;border-radius:6px;font-size:11px;padding:5px 8px;color:#51677e}
#personal-memo-card .pm-private{margin:8px 0 10px;color:#8493a2;font-size:10px}
#personal-memo-card .pm-preview{max-height:128px;padding:1px}
#personal-memo-card .pm-note{margin:0 0 6px;border:1px solid #e4eaf0!important;border-radius:8px!important;padding:10px!important;background:var(--pm-paper,#fff)!important}
#personal-memo-card .pm-note span{margin-top:5px;color:#617489;line-height:1.5}
#personal-memo-card .pm-add{margin-top:7px;border:1px solid #d5e4f0;background:#f4f8fc!important;border-radius:7px;padding:8px;color:#2d6d9f;font-size:12px}
.pm-dialog{border:1px solid #dce5ee;border-radius:14px;box-shadow:0 24px 70px #173b6133}
.pm-dialog header{padding:18px 20px}.pm-dialog h2{font-size:17px;font-weight:600;letter-spacing:-.3px}.pm-dialog header p{margin-top:6px;color:#8a98a8}
.pm-dialog [data-close]{border:0;background:#f3f6f9;color:#617489;border-radius:6px}
.pm-main{grid-template-columns:188px minmax(0,1fr)}.pm-main nav{background:#f8fafc;padding:14px}
.pm-primary{background:#fff!important;border:1px solid #d0dfeb!important;color:#3475a7!important;border-radius:7px!important;padding:8px!important}
.pm-list .pm-note{border-bottom:1px solid #e6edf3!important;border-radius:6px!important;margin-top:4px}
.pm-editor{padding:20px;gap:14px;background:#fff}.pm-editor label{font-size:11px;color:#6d7e90;font-weight:500}
.pm-format{padding:9px 10px;background:#f7f9fb;border:1px solid #e8edf3;border-radius:8px;gap:12px}
.pm-format select{height:28px;max-width:115px;border:0;background:transparent;font-size:12px;color:#344d65}.pm-format [data-bold]{border:1px solid #d8e1eb;border-radius:6px;background:#fff;padding:5px 9px}
.pm-editor [data-title],.pm-editor [data-content]{border:1px solid #dfe7ef;border-radius:8px;color:#2a4158;padding:11px 12px;line-height:1.7}
.pm-editor [data-title]:focus,.pm-editor [data-content]:focus{border-color:#78abd1;box-shadow:0 0 0 3px #eaf3fb;outline:0}
.pm-tools{gap:8px;padding-top:3px}.pm-tools button{border-radius:6px;padding:6px 10px}.pm-tools [data-save]{background:#2f7fb9;border-color:#2f7fb9;color:#fff}.pm-tools [data-remove]{border-color:#eadbd9;color:#a45f59}.pm-tools [data-status]{color:#7a8b9c;font-size:10px}
@media(max-width:600px){.pm-main{grid-template-columns:1fr}.pm-editor{padding:14px}.pm-format{gap:8px}.pm-dialog header{padding:14px}}

`;document.head.append(style);
void load();
})();
