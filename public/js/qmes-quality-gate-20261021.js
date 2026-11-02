(function () {
'use strict';
if (window.__qmesLotGate20261021) return;
window.__qmesLotGate20261021 = true;
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style = document.createElement('style');
style.textContent = ".qgate-open{border:1px solid #cfdfef;border-radius:5px;padding:0 15px;height:36px;background:#fff;color:#16446c;font-family:Pretendard,\"Noto Sans KR\",Arial,sans-serif;font-size:12px;font-weight:700;cursor:pointer;margin:0 0 10px 8px}\n.qgate-dialog{box-sizing:border-box;width:min(1180px,calc(100vw - 40px));max-height:90dvh;margin:auto;padding:0;border:1px solid #d5dfe9;border-radius:7px;background:#fff;color:#244260;box-shadow:0 18px 50px #173b6133;font-family:Pretendard,\"Noto Sans KR\",Arial,sans-serif;font-size:12px;font-weight:500;line-height:1.5;overflow:auto}\n.qgate-dialog::backdrop{background:rgba(24,49,75,.4)}\n.qgate-header{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid #d8e0e9}\n.qgate-dialog h2{display:flex;align-items:center;gap:10px;margin:0;color:#173b61;font-size:18px;font-weight:800;line-height:24px;letter-spacing:-.4px}\n.qgate-dialog h2:before{content:\"\";width:3px;height:24px;flex:none;background:#166fbb;border-radius:2px}\n.qgate-dialog button,.qgate-dialog input,.qgate-dialog select,.qgate-dialog textarea{box-sizing:border-box;font-family:inherit;font-size:12px;font-weight:600;color:#244260;border:1px solid #cfd9e5;border-radius:4px;background:#fff}\n.qgate-dialog button{height:30px;padding:0 12px;line-height:normal;cursor:pointer}\n.qgate-dialog button.primary{background:#2f8de4;border-color:#2f8de4;color:#fff}\n.qgate-dialog button:disabled{opacity:.55;cursor:wait}\n.qgate-dialog button:hover:not(:disabled){filter:brightness(.97)}\n.qgate-dialog :is(button,input,select,textarea,summary):focus-visible{outline:2px solid #2f8de4;outline-offset:2px}\n.qgate-content{padding:16px 20px 20px}\n.qgate-note{margin:0;color:#64748b;font-size:12px;font-weight:500;line-height:1.7}\n.qgate-policy{padding:10px 12px;background:#f8fafc;border:1px solid #e1e7ee;border-radius:4px}\n.qgate-toolbar{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px 0}\n.qgate-filter{display:flex;flex-direction:column;gap:5px;font-size:11px;font-weight:700;color:#64748b}\n.qgate-dialog input,.qgate-dialog select{height:32px;padding:0 9px}\n.qgate-filter input{width:260px;max-width:100%;font-weight:500}\n.qgate-toolbar-actions{display:flex;gap:6px;margin-left:auto}\n.qgate-meta{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 8px}\n.qgate-count{font-weight:700;color:#31516f}\n.qgate-error{color:#b42318;font-size:12px;font-weight:600;white-space:pre-wrap}\n.qgate-error:empty{display:none}.qgate-error:not(:empty){margin:8px 0;padding:9px 12px;background:#fff5f4;border:1px solid #f1cfca;border-radius:4px}\n.qgate-scroll{overflow:auto;max-height:42dvh;border:1px solid #d5dce5;border-radius:4px}\n.qgate-dialog table{border-collapse:collapse;table-layout:fixed;width:100%;min-width:850px;font-size:12px}\n.qgate-dialog th,.qgate-dialog td{padding:10px 9px;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;text-align:center;vertical-align:middle;overflow-wrap:anywhere;line-height:1.6;font-weight:500}\n.qgate-dialog th:last-child,.qgate-dialog td:last-child{border-right:0}.qgate-dialog tbody tr:last-child td{border-bottom:0}\n.qgate-dialog th{position:sticky;top:0;background:#edf3f9;color:#244260;font-weight:600}\n.qgate-dialog td:nth-child(3),.qgate-dialog td:nth-child(5){text-align:left}\n.qgate-dialog td strong{font-weight:700}.qgate-dialog td .qgate-lot{color:#174d7b}\n.qgate-empty{padding:28px 12px!important;text-align:center!important;color:#7a8c9e;font-weight:500!important}\n.qgate-status{display:inline-block;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:700}\n.qgate-status.blocked{background:#fff1f0;color:#b42318}.qgate-status.released{background:#edf8f1;color:#23754b}\n.qgate-release{margin:0 0 14px;border:1px solid #d5dce5;border-radius:4px;background:#fff}\n.qgate-release[hidden]{display:none}\n.qgate-release-title{display:block;padding:9px 12px;background:#edf3f9;border-bottom:1px solid #d5dce5;font-size:12px;font-weight:700}\n.qgate-release-fields{padding:12px}\n.qgate-release label{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:12px;font-weight:600}\n.qgate-release label[hidden]{display:none}\n.qgate-dialog textarea{width:100%;min-height:80px;resize:vertical;padding:9px;font-weight:500;line-height:1.6}\n.qgate-tools{display:flex;justify-content:flex-end;gap:6px;flex-wrap:wrap;margin-top:10px}\n.qgate-history-panel{margin-top:14px;border:1px solid #d5dce5;border-radius:4px}\n.qgate-history-panel summary{padding:10px 12px;background:#f5f8fb;color:#31516f;font-size:12px;font-weight:700;cursor:pointer}\n.qgate-history{margin:0;max-height:200px;overflow:auto;padding:12px;white-space:pre-wrap;overflow-wrap:anywhere;color:#52657b;font-family:inherit;font-size:12px;font-weight:500;line-height:1.8}\n.qgate-block{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:90vw;padding:16px 20px;border:1px solid #fda29b;background:#fff1f0;color:#912018;border-radius:8px;box-shadow:0 5px 30px #0002}.qgate-block button{margin-left:10px;background:white;border:1px solid #eaa;padding:5px}\n@media(max-width:600px){.qgate-dialog{width:calc(100vw - 20px);max-height:94dvh}.qgate-header{padding:12px}.qgate-content{padding:12px}.qgate-toolbar{align-items:stretch}.qgate-filter{width:100%}.qgate-filter input{width:100%}.qgate-toolbar-actions{margin-left:0;width:100%;justify-content:flex-end}.qgate-permission{font-size:11px}}";
/* ncr-quality-header-fit-20261023 */
style.textContent += '#ncr .qgate-open{margin:0!important;position:static!important;float:none!important;flex:0 0 auto;align-self:center;height:36px;padding:0 15px;border:1px solid #cfdfef;border-radius:5px;background:#fff;color:#16446c;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px;font-weight:700;line-height:normal}#ncr .ncr-head-actions{flex-wrap:wrap;align-items:center;justify-content:flex-end}#ncr .ncr-equipment-card{width:100%;min-width:0}';
document.head.appendChild(style);
let dialog, state, selected, loadController, loadSerial=0, lastMessage = '';
async function request(url, body, signal) {
 const response = await fetch('/api/qmes-quality-gate' + url, { credentials:'same-origin', cache:'no-store', signal,
  ...(body ? { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body) } : {}) });
 const result = await response.json();
 if (!response.ok || !result.success) throw Error(result.message || '품질 통제 요청에 실패했습니다.');
 return result.data || result;
}
function error(message) { dialog.querySelector('.qgate-error').textContent = message || ''; }
function render(data) {
 state = data;
 dialog.querySelector('.qgate-count').textContent='조회 '+data.holds.length+'건';
 const body = dialog.querySelector('tbody');
 body.innerHTML = data.holds.map(h => '<tr><td>'+esc(h.id)+'</td><td><strong class="qgate-lot">'+esc(h.lot)+'</strong></td><td>'+esc(h.reason)+'</td><td>'+esc(new Date(h.created_at).toLocaleString('ko-KR'))+'</td><td>'+ (h.released_at ? '<span class="qgate-status released">해제</span> · '+esc(h.released_by)+'<br>'+esc(h.release_reason) : '<span class="qgate-status blocked">보류 · 차단 중</span>')+'</td><td>'+(!h.released_at && data.canRelease ? '<button type="button" data-release="'+esc(h.id)+'">해제 승인</button>' : '')+'</td></tr>').join('') || '<tr><td colspan="6" class="qgate-empty">보류 내역이 없습니다.</td></tr>';
 dialog.querySelector('.qgate-history').textContent = data.events.map(e => new Date(e.occurred_at).toLocaleString('ko-KR')+' · '+({HOLD:'자동 보류',MANUAL_HOLD:'수동 보류',BLOCK:'처리 차단',RELEASE:'해제 승인'}[e.action]||e.action)+' · '+(e.lot||'')+' · '+(e.actor||'시스템')+' · '+(e.detail?.reason||'')).join('\n') || '이력이 없습니다.';
 dialog.querySelector('.qgate-permission').textContent = data.canRelease ? '해제 권한: 관리자 또는 품질부 부장 이상' : '해제 승인은 관리자 또는 품질부 부장 이상에게 요청하세요.';
}
function stopLoading(){
 loadSerial++;loadController?.abort();loadController=null;
}
async function load() {
 const serial=++loadSerial;
 loadController?.abort();const controller=new AbortController();loadController=controller;
 let timedOut=false;
 const timer=setTimeout(()=>{timedOut=true;controller.abort();},15000);
 error('');state=null;selected=null;
 dialog.querySelector('.qgate-release').hidden=true;
 dialog.querySelector('.qgate-count').textContent='조회 중…';
 dialog.querySelector('.qgate-scroll').setAttribute('aria-busy','true');
 dialog.querySelector('tbody').innerHTML='<tr><td colspan="6" class="qgate-empty">보류 내역을 불러오는 중입니다…</td></tr>';
 dialog.querySelector('.qgate-history').textContent='이력을 불러오는 중입니다…';
 dialog.querySelector('.qgate-permission').textContent='';
 try {
  const data=await request('/holds?lot='+encodeURIComponent(dialog.querySelector('[name="lot"]').value.trim()),null,controller.signal);
  if(serial!==loadSerial||!dialog.open)return;
  render(data);
 }catch(e) {
  if(serial!==loadSerial||!dialog.open)return;
  error(timedOut?'조회가 지연되고 있습니다. 조회 버튼을 눌러 다시 시도해 주세요.':e.message);
  dialog.querySelector('.qgate-count').textContent='조회 실패';
  dialog.querySelector('tbody').innerHTML='<tr><td colspan="6" class="qgate-empty">내역을 불러오지 못했습니다. 다시 조회해 주세요.</td></tr>';
  dialog.querySelector('.qgate-history').textContent='이력을 불러오지 못했습니다.';
 }finally{
  clearTimeout(timer);
  if(serial===loadSerial){loadController=null;dialog.querySelector('.qgate-scroll').setAttribute('aria-busy','false');}
 }
}
function ensureDialog() {

 if (!dialog) {
  dialog = document.createElement('dialog'); dialog.className='qgate-dialog';
  dialog.setAttribute('aria-labelledby','qgate-title');
  dialog.innerHTML="<div class=\"qgate-header\"><h2 id=\"qgate-title\">품질 보류 / 해제</h2><button type=\"button\" class=\"qgate-close\">닫기</button></div><div class=\"qgate-content\"><p class=\"qgate-note qgate-policy\">보류 LOT는 원료 투입·공정 완료·출하 확정이 차단되며, 연결된 완제품에도 적용됩니다.<br>검사 결과를 합격으로 수정하거나 NCR을 종결해도 자동 해제되지 않습니다. 최신 재검사 합격 후 별도 승인이 필요합니다.</p><div class=\"qgate-toolbar\"><label class=\"qgate-filter\">LOT 번호<input name=\"lot\" aria-label=\"LOT 번호\" placeholder=\"전체 또는 LOT 번호 입력\" autocomplete=\"off\"></label><div class=\"qgate-toolbar-actions\"><button type=\"button\" data-load>조회</button><button type=\"button\" class=\"primary\" data-hold>+ 보류 등록</button></div></div><div class=\"qgate-meta\"><span class=\"qgate-count\" role=\"status\" aria-live=\"polite\">조회 대기</span><p class=\"qgate-permission qgate-note\"></p></div><div class=\"qgate-error\" role=\"alert\"></div><div class=\"qgate-release\" hidden><strong class=\"qgate-release-title\"></strong><div class=\"qgate-release-fields\"><label>재검사 종류 <select name=\"kind\"><option value=\"iqc\">수입검사 IQC</option><option value=\"pqc\">공정검사 PQC</option><option value=\"oqc\">출하검사 OQC</option></select></label><textarea name=\"reason\" maxlength=\"2000\" aria-label=\"처리 사유\" placeholder=\"보류 사유 또는 조치 내용과 해제 승인 사유\"></textarea><div class=\"qgate-tools\"><button type=\"button\" data-cancel>취소</button><button type=\"button\" class=\"primary\" data-submit>처리</button></div></div></div><div class=\"qgate-scroll\" aria-busy=\"false\"><table><colgroup><col style=\"width:65px\"><col style=\"width:150px\"><col><col style=\"width:155px\"><col style=\"width:220px\"><col style=\"width:110px\"></colgroup><thead><tr><th>번호</th><th>LOT 번호</th><th>차단 사유</th><th>등록일시</th><th>상태 / 승인 사유</th><th>처리</th></tr></thead><tbody><tr><td colspan=\"6\" class=\"qgate-empty\">조회 대기</td></tr></tbody></table></div><details class=\"qgate-history-panel\"><summary>보류·차단·해제 이력 (최근 100건)</summary><pre class=\"qgate-history\"></pre></details></div>";
  document.body.appendChild(dialog);
  dialog.querySelector('.qgate-close').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{stopLoading();state=null;selected=null;});
  dialog.querySelector('[data-load]').onclick=load;
  dialog.querySelector('[name="lot"]').onkeydown=e=>{if(e.key==='Enter')load();};
  dialog.querySelector('[data-cancel]').onclick=()=>{dialog.querySelector('.qgate-release').hidden=true;};
  dialog.querySelector('[data-hold]').onclick=()=>{
   const lot=dialog.querySelector('[name="lot"]').value.trim();
   if(!lot)return error('보류할 LOT 번호를 입력하세요.');
   selected={lot}; showForm('보류 등록 · '+lot,false);
  };
  dialog.querySelector('tbody').onclick=e=>{
   const button=e.target.closest('[data-release]');if(!button)return;
   selected=state?.holds.find(h=>String(h.id)===button.dataset.release);if(!selected)return;
   showForm('해제 승인 · '+selected.lot+' · 보류번호 '+selected.id,true);
   if(['iqc','pqc','oqc'].includes(selected.kind)){
    dialog.querySelector('[name="kind"]').value=selected.kind;dialog.querySelector('[name="kind"]').disabled=true;
   }
  };
  dialog.querySelector('[data-submit]').onclick=async function(){
   const reason=dialog.querySelector('[name="reason"]').value.trim();
   if(!reason)return error('처리 사유를 입력하세요.');
   this.disabled=true;error('');
   try{
    await request(selected.id?'/release':'/hold',{id:selected.id,lot:selected.lot,reason,retestKind:dialog.querySelector('[name="kind"]').value});
    dialog.querySelector('.qgate-release').hidden=true;await load();
   }catch(e){error(e.message);}finally{this.disabled=false;}
  };
 }
 return dialog;
}
function open() {
 ensureDialog();
 if(!dialog.open)dialog.showModal();
 dialog.querySelector('[name="lot"]').focus();
 void load();
}
function showForm(title, release){
 error('');dialog.querySelector('.qgate-release').hidden=false;dialog.querySelector('.qgate-release-title').textContent=title;
 dialog.querySelector('[name="reason"]').value='';const kind=dialog.querySelector('[name="kind"]');kind.disabled=false;kind.parentElement.hidden=!release;
 dialog.querySelector('[data-submit]').textContent=release?'재검사 확인 및 해제 승인':'보류 등록';
}
function attach(){
 for(const id of ['ncr','iqc','pqc','oqc']){
  const root=document.getElementById(id);if(!root)continue;
  const target=id==='ncr'?root.querySelector('.ncr-head-actions, .ncr-editor-toolbar > span, .ncr-editor-top'):root;
  if(!target)continue;
  let button=root.querySelector('.qgate-open');
  if(!button){button=document.createElement('button');button.type='button';button.className='qgate-open';button.textContent='품질 보류 / 해제';button.onclick=open;}
  if(button.parentElement!==target){if(id==='ncr')target.appendChild(button);else target.prepend(button);}
 }
}
const originalFetch=window.fetch;
window.fetch=async function(...args){
 const response=await originalFetch.apply(this,args);
 if(response.status===409||response.status===503){
  const url=String(args[0]?.url||args[0]||'');
  if(url.includes('/api/'))response.clone().json().then(data=>{
   const message=String(data.message||'');
   if(data.code!=='QUALITY_GATE_BLOCKED'&&!message.includes('[QUALITY_GATE]')&&!message.includes('품질 차단 상태'))return;
   if(message===lastMessage&&document.querySelector('.qgate-block'))return;lastMessage=message;
   document.querySelector('.qgate-block')?.remove();const notice=document.createElement('div');notice.className='qgate-block';notice.setAttribute('role','alert');
   notice.appendChild(document.createTextNode('저장되지 않았습니다. '+message.replace('[QUALITY_GATE]','')));
   const view=document.createElement('button');view.textContent='보류 내역';view.onclick=open;
   const close=document.createElement('button');close.textContent='닫기';close.onclick=()=>notice.remove();notice.append(view,close);document.body.appendChild(notice);
  }).catch(()=>{});
 }
 return response;
};
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;queueMicrotask(()=>{queued=false;attach();});}).observe(document.body,{childList:true,subtree:true});
ensureDialog();attach();window.qmesOpenQualityGate=open;
})();
