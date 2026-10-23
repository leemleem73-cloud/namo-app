(function () {
'use strict';
if (window.__qmesLotGate20261021) return;
window.__qmesLotGate20261021 = true;
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const style = document.createElement('style');
style.textContent = '.qgate-open{border:1px solid #b9c9da;border-radius:6px;padding:8px 13px;background:#fff;color:#174d7b;font:600 13px inherit;cursor:pointer;margin:0 0 10px 8px}.qgate-dialog{width:min(1100px,95vw);max-height:90vh;border:1px solid #cbd5e1;border-radius:10px;padding:24px;color:#172b44;box-shadow:0 20px 70px #0003}.qgate-dialog::backdrop{background:#15273988}.qgate-dialog h2{margin:0 0 8px}.qgate-dialog button,.qgate-dialog input,.qgate-dialog select,.qgate-dialog textarea{font:inherit;padding:8px;border:1px solid #cbd5e1;border-radius:5px;background:#fff;color:#172b44}.qgate-dialog button{cursor:pointer}.qgate-dialog button:disabled{opacity:.5;cursor:wait}.qgate-tools{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.qgate-scroll{overflow:auto;max-height:42vh}.qgate-dialog table{border-collapse:collapse;width:100%;font-size:13px;min-width:700px}.qgate-dialog th,.qgate-dialog td{padding:10px;border-bottom:1px solid #dce4ee;text-align:left}.qgate-dialog th{background:#f1f5f9}.qgate-note{font-size:13px;color:#52657b;line-height:1.6}.qgate-error{color:#b42318;white-space:pre-wrap;margin:10px 0}.qgate-dialog textarea{width:100%;min-height:75px;box-sizing:border-box}.qgate-release{background:#edf6ff;padding:14px;margin:14px 0}.qgate-close{float:right}.qgate-block{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:2147483647;max-width:90vw;padding:16px 20px;border:1px solid #fda29b;background:#fff1f0;color:#912018;border-radius:8px;box-shadow:0 5px 30px #0002}.qgate-block button{margin-left:10px;background:white;border:1px solid #eaa;padding:5px}';
/* ncr-quality-header-fit-20261023 */
style.textContent += '#ncr .qgate-open{margin:0!important;position:static!important;float:none!important;flex:0 0 auto;align-self:center;height:36px;padding:0 15px;border:1px solid #cfdfef;border-radius:5px;background:#fff;color:#16446c;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px;font-weight:700;line-height:normal}#ncr .ncr-head-actions{flex-wrap:wrap;align-items:center;justify-content:flex-end}#ncr .ncr-equipment-card{width:100%;min-width:0}';
document.head.appendChild(style);
let dialog, state, selected, lastMessage = '';
async function request(url, body) {
 const response = await fetch('/api/qmes-quality-gate' + url, { credentials:'same-origin', cache:'no-store',
  ...(body ? { method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body) } : {}) });
 const result = await response.json();
 if (!response.ok || !result.success) throw Error(result.message || '품질 통제 요청에 실패했습니다.');
 return result.data || result;
}
function error(message) { dialog.querySelector('.qgate-error').textContent = message || ''; }
function render(data) {
 state = data;
 const body = dialog.querySelector('tbody');
 body.innerHTML = data.holds.map(h => '<tr><td>'+esc(h.id)+'</td><td><strong>'+esc(h.lot)+'</strong></td><td>'+esc(h.reason)+'</td><td>'+esc(new Date(h.created_at).toLocaleString('ko-KR'))+'</td><td>'+ (h.released_at ? '해제 · '+esc(h.released_by)+'<br>'+esc(h.release_reason) : '<strong style="color:#b42318">차단 중</strong>')+'</td><td>'+(!h.released_at && data.canRelease ? '<button type="button" data-release="'+esc(h.id)+'">해제 승인</button>' : '')+'</td></tr>').join('') || '<tr><td colspan="6">보류 내역이 없습니다.</td></tr>';
 dialog.querySelector('.qgate-history').textContent = data.events.map(e => new Date(e.occurred_at).toLocaleString('ko-KR')+' · '+({HOLD:'자동 보류',MANUAL_HOLD:'수동 보류',BLOCK:'처리 차단',RELEASE:'해제 승인'}[e.action]||e.action)+' · '+(e.lot||'')+' · '+(e.actor||'시스템')+' · '+(e.detail?.reason||'')).join('\n') || '이력이 없습니다.';
 dialog.querySelector('.qgate-permission').textContent = data.canRelease ? '해제 권한: 관리자 또는 품질부 부장 이상' : '해제 승인은 관리자 또는 품질부 부장 이상에게 요청하세요.';
}
async function load() {
 error('');
 try { render(await request('/holds?lot='+encodeURIComponent(dialog.querySelector('[name="lot"]').value.trim()))); }
 catch(e) { error(e.message); }
}
function open() {
 if (!dialog) {
  dialog = document.createElement('dialog'); dialog.className='qgate-dialog';
  dialog.innerHTML='<button type="button" class="qgate-close">닫기</button><h2>품질 보류 / 해제</h2><p class="qgate-note">보류 LOT는 원료 투입·공정 완료·출하 확정이 차단됩니다. 연결된 완제품에도 적용됩니다.<br>검사 합격으로 수정하거나 NCR을 종결해도 자동 해제되지 않습니다. 최신 재검사 합격 후 별도 승인이 필요합니다.</p><div class="qgate-tools"><input name="lot" aria-label="LOT 번호" placeholder="LOT 번호 (빈칸: 전체)"><button type="button" data-load>조회</button><button type="button" data-hold>이 LOT 보류 등록</button></div><p class="qgate-permission qgate-note"></p><div class="qgate-error" role="alert"></div><div class="qgate-release" hidden><strong class="qgate-release-title"></strong><p><label>재검사 종류 <select name="kind"><option value="iqc">수입검사 IQC</option><option value="pqc">공정검사 PQC</option><option value="oqc">출하검사 OQC</option></select></label></p><textarea name="reason" maxlength="2000" aria-label="처리 사유" placeholder="보류 사유 또는 조치 내용과 해제 승인 사유"></textarea><div class="qgate-tools"><button type="button" data-submit>처리</button><button type="button" data-cancel>취소</button></div></div><div class="qgate-scroll"><table><thead><tr><th>번호</th><th>LOT</th><th>차단 사유</th><th>등록일시</th><th>상태 / 승인 사유</th><th>처리</th></tr></thead><tbody></tbody></table></div><details style="margin-top:18px"><summary>보류·차단·해제 이력 (최근 100건)</summary><pre class="qgate-history" style="white-space:pre-wrap;font:12px/1.8 inherit"></pre></details>';
  document.body.appendChild(dialog);
  dialog.querySelector('.qgate-close').onclick=()=>dialog.close();
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
   selected=state.holds.find(h=>String(h.id)===button.dataset.release);if(!selected)return;
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
 if(!dialog.open)dialog.showModal();
 load();
}
function showForm(title, release){
 error('');dialog.querySelector('.qgate-release').hidden=false;dialog.querySelector('.qgate-release-title').textContent=title;
 dialog.querySelector('[name="reason"]').value='';const kind=dialog.querySelector('[name="kind"]');kind.disabled=false;kind.parentElement.hidden=!release;
 dialog.querySelector('[data-submit]').textContent=release?'재검사 확인 및 해제 승인':'보류 등록';
}
function attach(){
 for(const id of ['ncr','lotTrace','iqc','pqc','oqc']){
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
let queued=false;new MutationObserver(()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;attach();},100);}).observe(document.body,{childList:true,subtree:true});
attach();window.qmesOpenQualityGate=open;
})();
