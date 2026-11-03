(function(){'use strict';
const core=window.qmesMaterialStockCore,root=document.getElementById('materialStock');if(!core||!root)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v==null?'미확인':Number(v).toLocaleString('ko-KR',{maximumFractionDigits:6});
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
let snapshot=null,model={rows:[],warnings:[],unallocated:[]},entries=[],page=1,loading=false,loadedAt='',query='',selected='',epoch=0;
async function request(url,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal,...options});const p=await r.json().catch(()=>null);if(!r.ok||p?.success!==true)throw Error(p?.message||(r.status===401?'로그인이 필요합니다.':'조회 또는 저장에 실패했습니다.'));return p.data;}
 finally{clearTimeout(timer);}
}
const typeLabel={retest:'재검사 사용',sample:'샘플 사용',loss:'손실/폐기',adjustment:'재고 조정',opening:'기초재고'};
async function load(){
 if(loading)return;loading=true;const version=epoch;paint();
 try{
  if(window.qmesAuthDataReady?.wait)await window.qmesAuthDataReady.wait();
  const paths=[['/api/iqc','수입검사'],['/api/qmes/work-orders','작업지시'],['/api/trace?keyword=','작업실적'],['/api/qmes-sync/inventory','수불기록'],['/api/qmes-quality-gate/holds?lot=','품질보류']];
  const results=await Promise.all(paths.map(async([url,name])=>{try{return {data:await request(url),name};}catch(error){return {error:name+': '+error.message,data:[],name};}}));
  if(version!==epoch)return;
  entries=core.readEntries(Array.isArray(results[3].data)?results[3].data:[]);
  snapshot={iqc:Array.isArray(results[0].data)?results[0].data:[],orders:Array.isArray(results[1].data)?results[1].data:[],actuals:Array.isArray(results[2].data)?results[2].data:[],entries,holds:results[4].data?.holds||[],sourceErrors:results.filter(r=>r.error).map(r=>r.error)};
  model=core.build(snapshot);loadedAt=new Date().toLocaleString('ko-KR');
 }catch(error){if(version===epoch)model={rows:[],warnings:[error.message],unallocated:[]};}
 finally{if(version===epoch){loading=false;paint();}}
}
function paint(){
 const matches=model.rows.filter(r=>!query||[r.material,r.lot,r.supplier].join(' ').toLowerCase().includes(query.toLowerCase())),pages=Math.max(1,Math.ceil(matches.length/10));page=Math.min(page,pages);
 root.innerHTML='<div class="ms-shell"><header class="ms-head"><strong>재고관리</strong><div><button type="button" data-ms="refresh" '+(loading?'disabled':'')+'>새로고침</button><button type="button" class="primary" data-ms="new" '+(loading||!snapshot?'disabled':'')+'>+ 재검사·샘플 / 재고 기록</button></div></header>'+
 '<div class="ms-policy">수입검사 입고 − 저장된 실투입량 − 확인된 재검사·샘플 사용량 ± 조정 = 장부재고<br><b>과거 재검사·샘플 사용량을 확인해 주세요.</b> 대조 전 수량은 장부재고입니다. 미확인 기록은 수량을 확정하기 전까지 차감하지 않습니다.</div>'+
 (model.warnings.length?'<div class="ms-error" role="alert">일부 자료 조회 실패 · 계산 가용량은 확정할 수 없습니다.<br>'+model.warnings.map(esc).join('<br>')+'</div>':'')+
 '<div class="ms-toolbar"><label>원료 / LOT / 공급업체 <input data-ms-search value="'+esc(query)+'" placeholder="전체"></label><span>'+ (loading?'연결된 입고·투입 자료 조회 중':esc(loadedAt))+'</span></div>'+
 '<div class="ms-totals"><span>LOT <b>'+matches.length+'</b>건</span><span>장부재고 <b>'+fmt(matches.reduce((s,r)=>s+r.balance,0))+'</b> kg</span><span>수량 미확인 기록 <b>'+entries.filter(e=>e.status==='pending').length+'</b>건</span><span>입고·투입 연결 확인 <b>'+model.unallocated.length+'</b>건</span></div>'+
 '<div class="ms-table-wrap"><table class="ms-table"><thead><tr>'+['No.','원료명','원료 LOT','공급업체','입고(kg)','실투입(kg)','재검사·샘플/손실(kg)','조정(kg)','장부재고(kg)','투입 예정(kg)','계산 가용량(kg)','확인 상태','내역'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
 (matches.slice((page-1)*10,page*10).map((r,i)=>'<tr><td>'+((page-1)*10+i+1)+'</td><td>'+esc(r.material)+'</td><td>'+esc(r.lot)+'</td><td>'+esc(r.supplier||'-')+'</td>'+[r.incoming,r.used,r.sample,r.adjust,r.balance,r.reserved,r.available].map(n=>'<td class="'+(n<0?'ms-negative':'')+'">'+fmt(n)+'</td>').join('')+'<td><span class="ms-state '+(r.uncertain||r.quality!=='사용가능'?'warn':'')+'" title="'+esc([...r.issues,...(r.notices||[])].join(' · '))+'">'+esc(r.uncertain?'수량/연결 확인 필요':r.quality)+'</span></td><td><button type="button" data-ms-detail="'+esc(r.key)+'">수불내역</button></td></tr>').join('')||'<tr><td colspan="13">'+(loading?'조회 중입니다.':'등록된 입고 또는 재고 기록이 없습니다.')+'</td></tr>')+'</tbody></table></div>'+
 '<div class="ms-pager">'+Array.from({length:pages},(_,i)=>'<button type="button" data-ms-page="'+(i+1)+'" class="'+(page===i+1?'primary':'')+'">'+(i+1)+'</button>').join('')+'</div>'+
 '<p class="ms-foot">단위 kg · 계획량은 차감하지 않습니다. 품질보류·검사대기·불합격 또는 연결 미확정 LOT는 계산 가용량에서 제외합니다. 기초재고를 등록하면 기준일 시작 시점부터 계산합니다.</p>'+
 '<details class="ms-unallocated"><summary>원료·LOT·공급업체 연결 점검</summary>'+'<div class="ms-table-wrap"><table class="ms-table"><thead><tr>'+['수입검사 원본','원본 원료명','원본 LOT','원본 공급업체','표시 원료명','표시 LOT','연결 공급업체','연결 근거/확인 내용'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+model.rows.flatMap(r=>r.receipts.flatMap(e=>(e.originals||[]).map(o=>'<tr>'+[o.id,o.material,o.lot,o.supplier,r.material,r.lot,r.supplier||'미확인',[...r.issues,...(r.notices||[])].join(' · ')||'원본 일치'].map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>'))).join('')+'</tbody></table></div></details>'+
 (model.unallocated.length?'<details class="ms-unallocated"><summary>연결 확인이 필요한 기록 '+model.unallocated.length+'건</summary>'+model.unallocated.map(e=>'<p>'+esc([e.source,e.id,e.material,e.lot,e.note].filter(Boolean).join(' · '))+'</p>').join('')+'</details>':'')+'</div>';
 root.querySelector('[data-ms-search]').addEventListener('keydown',event=>{if(event.key==='Enter'){query=event.target.value.trim();page=1;paint();}});
}
function showDetails(key){
 const row=model.rows.find(r=>r.key===key);if(!row)return;selected=key;
 const dialog=document.createElement('dialog');dialog.className='ms-dialog';
 const manual=entries.filter(e=>core.lot(e.lot)===row.lot&&core.material(e.material)===core.material(row.material)&&(!e.supplier||core.supplierKey(e.supplier)===core.supplierKey(row.supplier)));
 dialog.innerHTML='<header><strong>'+esc(row.material)+' · '+esc(row.lot)+'</strong><button type="button" data-close>닫기</button></header><div class="ms-dialog-body"><div class="ms-policy">기초재고 '+fmt(row.opening)+' kg'+(row.start?' · '+esc(row.start)+' 시작 기준':' · 전체 저장 이력 기준')+'<br>장부재고 '+fmt(row.balance)+' kg · 미확인 사용량은 반영 전입니다.</div>'+[...row.issues,...(row.notices||[])].map(s=>'<p class="ms-negative">'+esc(s)+'</p>').join('')+
 '<div class="ms-table-wrap"><table class="ms-table"><thead><tr>'+['일자','구분','증감(kg)','연결 기록','내용'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+row.ledger.map(e=>'<tr><td>'+esc(e.date||'일자 미확인')+'</td><td>'+esc(e.kind)+'</td><td>'+ (e.delta===null?'수량 확인 필요':(e.delta>0?'+':'')+fmt(e.delta/1e6))+'</td><td>'+esc(e.source+' · '+e.id)+'</td><td>'+esc(e.note||e.output||'-')+'</td></tr>').join('')+'</tbody></table></div>'+
 '<h3>재검사·샘플·조정 기록</h3><button type="button" class="primary" data-new>+ 기록 추가</button><div class="ms-table-wrap"><table class="ms-table"><thead><tr>'+['일자','구분','기록 수량(kg)','상태','확인 내용','처리'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+manual.map(e=>'<tr><td>'+esc(e.date||'미확인')+'</td><td>'+esc(typeLabel[e.type])+'</td><td>'+fmt(e.quantity)+'</td><td>'+esc({pending:'수량 확인 필요',confirmed:'확인 완료',cancelled:'취소'}[e.status])+'</td><td>'+esc(e.note)+'</td><td><button type="button" data-edit="'+esc(e.id)+'">수정/확정</button></td></tr>').join('')+'</tbody></table></div></div>';
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('[data-new]').onclick=()=>editEntry(null,row,dialog);
 dialog.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editEntry(entries.find(e=>e.id===b.dataset.edit),row,dialog));
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
function editEntry(existing=null,row=null,parent=null){
 const dialog=document.createElement('dialog');dialog.className='ms-dialog ms-entry';
 const id=existing?.id||crypto.randomUUID();
 dialog.innerHTML='<header><strong>재검사·샘플 / 재고 기록</strong><button type="button" data-close>닫기</button></header><form class="ms-dialog-body"><p class="ms-policy">아직 수량을 모르면 “수량 확인 필요”로 보관하세요. “확인 완료”인 수량만 장부재고에 반영합니다.</p><div class="ms-form">'+
 '<label>원료명<input name="material" required value="'+esc(existing?.material||row?.material||'')+'"></label><label>원료 LOT<input name="lot" required value="'+esc(existing?.lot||row?.lot||'')+'"></label><label>공급업체<input name="supplier" value="'+esc(existing?.supplier||row?.supplier||'')+'"></label>'+
 '<label>구분<select name="type">'+Object.entries(typeLabel).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label>'+
 '<label>사용일 / 기초 기준일<input type="date" name="date" value="'+esc(existing?.date||'')+'"></label>'+
 '<label>확인 상태<select name="status"><option value="pending">수량 확인 필요</option><option value="confirmed">확인 완료</option><option value="cancelled">기록 취소</option></select></label>'+
 '<label>수량<input type="number" name="amount" min="0" step="any" placeholder="미확인 시 비워 두세요" value="'+esc(existing?.quantity??'')+'"></label><label>입력 단위<select name="unit"><option value="kg">kg</option><option value="g">g</option></select></label>'+
 '<label>조정 방향<select name="direction"><option value="out">차감</option><option value="in">증가 (재고 조정)</option></select></label>'+
 '<label class="full">사용 사유 / 확인 내용<textarea name="note" required placeholder="예: 재검사에 소량 사용, 사용량 확인 필요">'+esc(existing?.note||'')+'</textarea></label></div><p class="ms-foot">기초재고는 기준일 시작 시점의 실사 수량입니다. 기준일 이전 입고·사용 이력은 계산에서 제외합니다. 취소한 기록은 이력에 남습니다.</p><div class="ms-error" data-error hidden></div><footer><button type="button" data-cancel>취소</button><button type="submit" class="primary">기록 저장</button></footer></form>';
 const form=dialog.querySelector('form');form.elements.type.value=existing?.type||'retest';form.elements.status.value=existing?.status||'pending';form.elements.direction.value=existing?.direction||'out';
 dialog.querySelector('[data-close]').onclick=dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
 form.onsubmit=async event=>{
  event.preventDefault();const button=form.querySelector('[type="submit"]'),error=dialog.querySelector('[data-error]');error.hidden=true;button.disabled=true;
  try{
   const values=Object.fromEntries(new FormData(form)),amount=core.number(values.amount);
   const entry=core.validateEntry({...values,id,quantity:amount===null?null:values.unit==='g'?amount/1000:amount,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()});
   if(!await window.qmesConfirm(entry.status==='confirmed'?'확인한 수량을 재고에 반영하시겠습니까?':'기록을 저장하시겠습니까?'))return;
   const saved=await request('/api/qmes-sync/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key:core.PREFIX+id,payload:{module:'materialStock',schema:1,entry}})});
   if(saved?.record_key!==core.PREFIX+id)throw Error('저장 확인 응답이 올바르지 않습니다.');
   dialog.close();parent?.close();await load();if(typeof window.toast==='function')window.toast(entry.status==='confirmed'?'확인한 수량을 재고에 반영했습니다.':'수불 기록을 저장했습니다.');
  }catch(e){error.textContent=e.message;error.hidden=false;}finally{button.disabled=false;}
 };
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;if(button.dataset.ms==='refresh')load();if(button.dataset.ms==='new')editEntry();if(button.dataset.msDetail)showDetails(button.dataset.msDetail);if(button.dataset.msPage){page=Number(button.dataset.msPage);paint();}});
new MutationObserver(()=>{if(root.classList.contains('active'))load();}).observe(root,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&root.classList.contains('active'))load();});
function clearAccount(){epoch++;loading=false;snapshot=null;loadedAt='';query='';page=1;model={rows:[],warnings:[],unallocated:[]};entries=[];document.querySelectorAll('.ms-dialog').forEach(dialog=>dialog.close());paint();}
window.addEventListener('qmes-authenticated',()=>{clearAccount();if(root.classList.contains('active'))load();});
document.addEventListener('click',event=>{if(event.target.closest?.('[data-auth="logout"]'))clearAccount();},true);
const style=document.createElement('style');style.textContent=`
#materialStock,.ms-dialog{font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px;color:#244260}.ms-shell{background:#fff;border:1px solid #d5dce5;border-radius:8px;overflow:hidden}.ms-head,.ms-dialog>header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid #d5dce5}.ms-head strong,.ms-dialog>header strong{font-size:18px;font-weight:800}.ms-head>div{display:flex;gap:7px}#materialStock button,.ms-dialog button{font:600 12px Pretendard,"Noto Sans KR",Arial,sans-serif;color:#244260;border:1px solid #c7d6e5;border-radius:4px;background:#fff;padding:6px 10px;cursor:pointer}#materialStock button.primary,.ms-dialog button.primary{background:#2f8de4;border-color:#2f8de4;color:#fff}#materialStock button:disabled,.ms-dialog button:disabled{opacity:.5;cursor:default}.ms-policy{margin:14px 16px;padding:10px 12px;background:#f6f9fc;border:1px solid #dce5ee;line-height:1.7;color:#536b83}.ms-policy b{color:#95601a}.ms-toolbar,.ms-totals{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:10px 16px}.ms-toolbar>span{margin-left:auto;color:#708297}.ms-toolbar input{margin-left:8px;width:230px;padding:7px 9px;border:1px solid #c7d6e5;border-radius:4px;font:inherit}.ms-table-wrap{margin:8px 16px;overflow:auto;border:1px solid #d5dce5}.ms-table{width:100%;min-width:1100px;border-collapse:separate;border-spacing:0}.ms-table th,.ms-table td{padding:9px 8px;border:0;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;text-align:center;vertical-align:middle;font-size:12px;white-space:nowrap}.ms-table th{background:#e8f0f8;font-weight:600}.ms-table td{font-weight:400}.ms-table tr>:last-child{border-right:0}.ms-table tbody tr:last-child>td{border-bottom:0}.ms-state{color:#23754b}.ms-state.warn,.ms-negative{color:#b45309!important}.ms-pager{display:flex;justify-content:center;gap:5px;padding:12px}.ms-foot{margin:12px 16px;font-size:11px;color:#708297;line-height:1.6}.ms-error{padding:10px 12px;background:#fff1f2;color:#a02040;margin:10px 16px;border:1px solid #efc8ce}.ms-unallocated{margin:14px 16px;line-height:1.6}.ms-dialog{width:min(1150px,calc(100vw - 36px));max-height:90dvh;overflow:auto;border:1px solid #d5dce5;border-radius:8px;padding:0;background:#fff}.ms-dialog::backdrop{background:#17314c66}.ms-dialog-body{padding:12px}.ms-dialog .ms-table{min-width:760px}.ms-dialog .ms-table td:last-child{white-space:normal;min-width:180px}.ms-entry{width:min(850px,calc(100vw - 36px))}.ms-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:10px 16px}.ms-form label{display:grid;gap:5px;font-weight:600}.ms-form input,.ms-form select,.ms-form textarea{min-width:0;width:100%;box-sizing:border-box;padding:8px;border:1px solid #c7d6e5;border-radius:4px;font:400 12px Pretendard,"Noto Sans KR",Arial,sans-serif}.ms-form .full{grid-column:1/-1}.ms-form textarea{min-height:70px}.ms-entry footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #d5dce5}@media(max-width:750px){.ms-form{grid-template-columns:1fr}.ms-head{align-items:flex-start;flex-direction:column}}
`;document.head.append(style);paint();if(root.classList.contains('active'))load();
})();
