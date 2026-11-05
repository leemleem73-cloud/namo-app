/* Private per-account notes. No memo text is kept in shared browser storage. */
(()=>{
'use strict';
const side=document.querySelector('.right-side');if(!side)return;
const card=document.createElement('section');card.id='personal-memo-card';card.className='pm-card';card.innerHTML='<div class="pm-head"><h2>개인 메모</h2><button type="button" data-pm-open>전체보기</button></div><p class="pm-private">나만 볼 수 있는 메모 <span data-pm-count></span></p><div class="pm-preview" aria-live="polite">불러오는 중…</div><button type="button" class="pm-add" data-pm-new>+ 메모 작성</button>';side.prepend(card);
const mobile=document.createElement('button');mobile.type='button';mobile.className='pm-mobile';mobile.textContent='개인 메모';document.body.append(mobile);
const dialog=document.createElement('dialog');dialog.className='pm-dialog';dialog.setAttribute('aria-labelledby','pm-title');
dialog.innerHTML='<header><div class="pm-dialog-title"><span class="pm-dialog-symbol" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><rect x="5" y="3" width="14" height="18" rx="3"/><path d="M9 3v18M12 8h4m-4 4h4m-4 4h3"/></svg></span><div><span class="pm-eyebrow">나만의 기록</span><h2 id="pm-title">개인 메모</h2><p>본인 계정에서만 보입니다 · 입력 후 자동저장</p></div></div><button type="button" data-close>닫기</button></header><div class="pm-main"><nav aria-label="내 메모"><div class="pm-list-caption">메모 목록</div><button type="button" class="pm-primary" data-new>+ 메모 작성</button><div class="pm-list"></div></nav><section class="pm-editor"><label>제목<input data-title maxlength="100" placeholder="메모 제목"></label><div class="pm-dates" aria-live="polite"><span data-created></span><span data-updated></span></div><div class="pm-format"><label>메모 색상<select data-paper><option value="white">흰색</option><option value="yellow">버터 노랑</option><option value="sand">샌드 베이지</option><option value="peach">살구</option><option value="pink">로즈 분홍</option><option value="lilac">라일락</option><option value="lavender">라벤더</option><option value="blue">하늘</option><option value="teal">아쿠아</option><option value="mint">민트</option><option value="green">연두</option><option value="gray">연회색</option></select></label><label>글씨체<select data-font><option value="default">기본</option><option value="gothic">맑은 고딕</option><option value="serif">명조</option></select></label><label>크기<select data-size><option value="14">14</option><option value="16">16</option><option value="18">18</option><option value="20">20</option><option value="24">24</option></select></label><label>정렬<select data-align><option value="left">왼쪽 정렬</option><option value="center">가운데 정렬</option><option value="right">오른쪽 정렬</option></select></label><label>모양<select data-shape><option value="rounded">둥근 모서리</option><option value="square">반듯한 모서리</option></select></label><button type="button" data-bold aria-pressed="false">굵게</button></div><label class="pm-content">내용<textarea data-content maxlength="5000" placeholder="기억할 내용을 적어 두세요."></textarea></label><div class="pm-tools"><button type="button" data-pin aria-pressed="false">상단 고정</button><button type="button" data-remove>삭제</button><button type="button" data-today>오늘 날짜 넣기</button><span data-status role="status" aria-live="polite"></span><button type="button" data-save>저장</button></div><div class="pm-confirm" hidden><span>이 메모를 삭제할까요?</span><button type="button" data-delete-yes>삭제</button><button type="button" data-delete-no>취소</button></div></section></div>';
document.body.append(dialog);
const title=dialog.querySelector('[data-title]'),content=dialog.querySelector('[data-content]'),pin=dialog.querySelector('[data-pin]'),status=dialog.querySelector('[data-status]'),list=dialog.querySelector('.pm-list'),preview=card.querySelector('.pm-preview'),confirm=dialog.querySelector('.pm-confirm');
const paper=dialog.querySelector('[data-paper]'),font=dialog.querySelector('[data-font]'),size=dialog.querySelector('[data-size]'),bold=dialog.querySelector('[data-bold]');
const align=dialog.querySelector('[data-align]'),shape=dialog.querySelector('[data-shape]'),today=dialog.querySelector('[data-today]');
const defaults={paper:'white',font:'default',size:16,bold:false,align:'left',shape:'rounded'};
const colors={white:'#ffffff',yellow:'#fff4bf',sand:'#f1e6d8',peach:'#ffead8',pink:'#ffe8ef',lilac:'#f4e5fa',lavender:'#eee9fb',blue:'#e6f0ff',teal:'#def1f3',mint:'#ddf4e9',green:'#eaf3d5',gray:'#edf0f4'},fonts={default:'Pretendard,"Malgun Gothic",sans-serif',gothic:'"Malgun Gothic",sans-serif',serif:'Georgia,"Batang",serif'};
const format=value=>{const result={...defaults,...(value||{})};if(result.size<14)result.size=14;return result;};
function dateTime(value){if(!value||!Number.isFinite(Date.parse(value)))return '—';return new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).format(new Date(value));}
function renderDates(){dialog.querySelector('[data-created]').textContent='작성일 '+(active?.created_at?dateTime(active.created_at):'저장 후 표시');dialog.querySelector('[data-updated]').textContent='최종 수정 '+(active?.updated_at?dateTime(active.updated_at):'저장 후 표시');}
let appearance={...defaults};
function paintFormat(){const editor=dialog.querySelector('.pm-editor');editor.style.setProperty('--pm-paper',colors[appearance.paper]||colors.yellow);editor.style.setProperty('--pm-font',fonts[appearance.font]||fonts.default);editor.style.setProperty('--pm-size',appearance.size+'px');editor.style.setProperty('--pm-weight',appearance.bold?'700':'400');editor.style.setProperty('--pm-align',appearance.align);editor.style.setProperty('--pm-radius',appearance.shape==='square'?'3px':'12px');bold.setAttribute('aria-pressed',String(appearance.bold));}
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
 const button=document.createElement('button');button.type='button';button.className='pm-note';button.classList.toggle('selected',active?.id===note.id);button.dataset.noteId=note.id;const style=format(note.appearance);button.style.setProperty('--pm-paper',colors[style.paper]||colors.yellow);button.style.setProperty('--pm-font',fonts[style.font]||fonts.default);button.style.setProperty('--pm-size',style.size+'px');button.style.setProperty('--pm-weight',style.bold?'700':'400');button.style.setProperty('--pm-align',style.align);button.style.setProperty('--pm-radius',style.shape==='square'?'3px':'12px');
 const heading=document.createElement('b');heading.textContent=(note.pinned?'고정 · ':'')+(note.title||'제목 없는 메모');
 const snippet=document.createElement('span');snippet.textContent=note.content||'내용 없음';const stamp=document.createElement('small');stamp.className='pm-note-date';stamp.textContent=dateTime(note.updated_at||note.created_at);button.append(heading,snippet,stamp);button.onclick=()=>activate(note);return button;
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
 appearance=format(active?.appearance);paper.value=appearance.paper;font.value=appearance.font;size.value=String(appearance.size);align.value=appearance.align;shape.value=appearance.shape;paintFormat();renderDates();for(const field of [paper,font,size,bold,align,shape,today])field.disabled=!enabled;
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
    generation++;active=saved;renderDates();const index=notes.findIndex(n=>n.id===saved.id);if(index<0)notes.push(saved);else notes[index]=saved;
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
for(const select of [paper,font,size,align,shape])select.addEventListener('change',()=>{appearance={...appearance,paper:paper.value,font:font.value,size:Number(size.value),align:align.value,shape:shape.value};paintFormat();schedule();});
today.onclick=()=>{
 const text=new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'}),start=Number.isInteger(content.selectionStart)?content.selectionStart:content.value.length,end=Number.isInteger(content.selectionEnd)?content.selectionEnd:start;
 if(content.value.length-(end-start)+text.length>5000){message('메모 내용은 5,000자까지 입력할 수 있습니다.',true);return;}
 if(typeof content.setRangeText==='function')content.setRangeText(text,start,end,'end');else content.value=content.value.slice(0,start)+text+content.value.slice(end);
 content.focus();schedule();
};
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


/* Notebook editor: calm navy accents, a quiet toolbar and one continuous paper surface. */
.pm-dialog{width:min(820px,calc(100vw - 28px));max-height:90dvh;overflow:auto;border:1px solid #d9e1e9;border-radius:16px;box-shadow:0 28px 90px rgba(15,35,56,.25);background:#fff}
.pm-dialog::backdrop{background:rgba(18,35,53,.42);backdrop-filter:blur(3px)}
.pm-dialog header{padding:20px 24px;border-bottom:1px solid #e9edf2;background:#fff}
.pm-dialog-title{display:flex;gap:13px;align-items:center}.pm-dialog-symbol{width:42px;height:46px;border-radius:10px;background:#f0f4f8;display:grid;place-items:center;flex:none}.pm-dialog-symbol svg{width:23px;height:23px;stroke:#3f5c76;stroke-width:1.4;stroke-linecap:round;stroke-linejoin:round}
.pm-eyebrow{display:block;color:#94a1ae;font-size:10px;letter-spacing:.5px;margin-bottom:4px}.pm-dialog h2{font-size:19px;font-weight:600;letter-spacing:-.5px;color:#263c52}.pm-dialog header p{font-size:10px;color:#91a0ae;margin-top:6px}
.pm-dialog [data-close]{padding:7px 10px;border:1px solid #e7ecf1;background:#fff;color:#778796;font-size:11px}
.pm-main{grid-template-columns:196px minmax(0,1fr);min-height:420px}.pm-main nav{background:#f8fafb;border-right:1px solid #e7ecf1;padding:20px 14px}.pm-list-caption{font-size:11px;color:#8392a1;margin:0 6px 13px;letter-spacing:.2px}
.pm-primary{background:#344f68!important;border:1px solid #344f68!important;color:#fff!important;border-radius:8px!important;padding:9px 10px!important;font-size:12px!important;box-shadow:0 3px 8px #203b5410}
.pm-list{margin-top:14px}.pm-list .pm-note{background:var(--pm-paper,#fff)!important;border:1px solid #e4eaf0!important;border-radius:8px!important;padding:10px!important;margin:7px 0}.pm-list .pm-note.selected{outline:1px solid #9fb6c9;box-shadow:0 2px 7px #203b5408}.pm-list .pm-note span{font-size:11px;color:#8a98a6}
.pm-editor{padding:22px 24px;gap:17px}.pm-editor label{color:#84919e;font-size:10px;letter-spacing:.1px}
.pm-editor [data-title]{background:transparent!important;border:0!important;border-bottom:1px solid #e5eaf0!important;border-radius:0!important;padding:8px 0 12px!important;font-size:calc(var(--pm-size,14px) + 3px);color:#2c4359;box-shadow:none!important}
.pm-format{padding:9px 10px;gap:12px;background:#fafbfc;border:1px solid #e9edf2;border-radius:8px}.pm-format label{font-size:10px;color:#8c99a6;gap:4px}.pm-format select{font-size:11px;border:1px solid #e3e9ef;border-radius:5px;background:#fff;padding:0 6px;min-width:50px;height:27px;color:#53697e}.pm-format [data-bold]{font-size:11px;height:28px;border-radius:5px;border-color:#e3e9ef;color:#53697e}
.pm-content{border:1px solid #e1e7ed;border-radius:11px;padding:12px 14px;background:var(--pm-paper,#fff);box-shadow:0 3px 12px #203b5405;gap:11px!important}.pm-content textarea{min-height:225px;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;line-height:1.85!important;outline:none!important;color:#344c62}.pm-editor input::placeholder,.pm-content textarea::placeholder{color:#b2bdc7}
.pm-tools{padding-top:0;gap:8px}.pm-tools button{font-size:11px;border-color:#e1e7ed;border-radius:7px;padding:7px 10px;color:#6b7f91;background:#fff}.pm-tools [data-save]{padding:8px 20px;border:1px solid #344f68;background:#344f68;color:#fff;box-shadow:0 3px 9px #203b5418}.pm-tools [data-remove]{color:#a47772;border-color:#eadfdc}.pm-tools [data-status]{font-size:10px;color:#8b9aa8}.pm-tools [data-error="1"]{color:#b42318}
#personal-memo-card{box-shadow:0 10px 30px rgba(23,48,72,.09)!important}.pm-head h2{color:#2b4359!important}.pm-head button:hover,.pm-tools button:hover{filter:brightness(.98)}
@media(max-width:600px){.pm-dialog{width:calc(100vw - 20px);border-radius:12px}.pm-dialog header{padding:15px}.pm-dialog-symbol{width:34px;height:38px}.pm-dialog h2{font-size:17px}.pm-main{grid-template-columns:1fr;min-height:0}.pm-main nav{padding:12px}.pm-list-caption{display:none}.pm-editor{padding:15px;gap:13px}.pm-content textarea{min-height:165px}.pm-format{gap:8px}}


/* Readable controls and persistent note formatting. */
#personal-memo-card .pm-preview,.pm-list{font-size:13px;color:#526a80}
#personal-memo-card .pm-head h2{font-size:16px!important;font-weight:600!important;color:#243c53!important}
#personal-memo-card .pm-head button,#personal-memo-card .pm-add{font-size:13px!important;font-weight:500!important;color:#315573!important}
#personal-memo-card .pm-private{font-size:12px!important;color:#5b7085!important;line-height:1.6}
#personal-memo-card .pm-note,.pm-dialog .pm-note{border-radius:var(--pm-radius,12px)!important;text-align:var(--pm-align,left)!important}
.pm-note b,.pm-note span{text-align:var(--pm-align,left)!important}
.pm-note-date{display:block;font:12px Pretendard,"Malgun Gothic",sans-serif!important;color:#4f6579;margin-top:7px;line-height:1.5;text-align:var(--pm-align,left)}
.pm-dialog{width:min(900px,calc(100vw - 28px));max-height:92dvh}.pm-dialog h2{font-size:21px;color:#243c53}.pm-dialog header p,.pm-eyebrow,.pm-list-caption{font-size:12px!important;color:#5b7085!important;line-height:1.6}
.pm-dialog [data-close],.pm-primary{font-size:13px!important;font-weight:500!important}.pm-main{grid-template-columns:210px minmax(0,1fr)}
.pm-editor label{font-size:12px!important;font-weight:600!important;color:#486177!important;line-height:1.5}
.pm-format{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr));align-items:end;gap:10px 12px;padding:12px}
.pm-format select{width:100%;max-width:none;min-width:0;height:33px;font-size:13px!important;color:#314d65!important;border-color:#cfdbe6}
.pm-format [data-bold]{height:33px;font-size:13px!important;font-weight:600;color:#314d65;align-self:end}
.pm-dates{display:flex;gap:6px 18px;flex-wrap:wrap;font-size:12px;line-height:1.6;color:#536c82}
.pm-content{border-radius:var(--pm-radius,12px)!important}
.pm-editor [data-title],.pm-editor [data-content]{text-align:var(--pm-align,left)!important;color:#233c53!important}
.pm-editor [data-title]::placeholder,.pm-editor [data-content]::placeholder{color:#5a7086!important}
.pm-tools button{font-size:13px!important;min-height:34px;padding:7px 11px!important;font-weight:500}.pm-tools [data-save]{font-weight:600}.pm-tools [data-status]{font-size:12px!important;color:#526c80!important}.pm-tools [data-error="1"]{color:#b42318!important}
.pm-list .pm-note span{font-size:13px!important;color:#526a80!important}.pm-note b{color:#283f55}.pm-confirm{font-size:13px}
@media(max-width:600px){.pm-main{grid-template-columns:1fr}.pm-format{grid-template-columns:repeat(2,minmax(0,1fr))}.pm-editor{padding:14px}.pm-tools [data-status]{flex-basis:100%;order:5}}

`;document.head.append(style);
void load();
})();
