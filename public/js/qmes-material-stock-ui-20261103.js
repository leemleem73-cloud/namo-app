(function(){'use strict';
const core=window.qmesMaterialStockCore,pageRoot=document.getElementById('materialStock');if(!core||!pageRoot)return;
const root=document.createElement('div');root.id='materialStockRaw';pageRoot.append(root);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=v=>v==null?'미확인':Number(v).toLocaleString('ko-KR',{maximumFractionDigits:6});
const today=()=>new Date().toLocaleDateString('sv-SE',{timeZone:'Asia/Seoul'});
let snapshot=null,model={rows:[],warnings:[],unallocated:[]},entries=[],page=1,loading=false,loadedAt='',query='',selected='',epoch=0;
let receiptOrder='';
async function request(url,options={}){
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{const r=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:controller.signal,...options});const p=await r.json().catch(()=>null);if(!r.ok||p?.success!==true)throw Error(p?.message||(r.status===401?'로그인이 필요합니다.':'조회 또는 저장에 실패했습니다.'));return p.data;}
 finally{clearTimeout(timer);}
}
const typeLabel={retest:'재검사 사용',sample:'샘플 사용',loss:'손실/폐기',adjustment:'재고 조정',opening:'기초재고'};

const stockColumns=[{id:'no',label:'No.',filter:false,width:76,min:76,max:90},...[
 ['material','원료명',false,190],['lot','원료 LOT',false,180],['supplier','공급업체',false,200],['incoming','입고(kg)',true,140],['used','실투입(kg)',true,140],['sample','재검사·샘플/손실(kg)',true,210],['adjust','수량 조정(kg)',true,140],['balance','재고(kg)',true,160],['available','사용 가능 재고(kg)',true,175]
].map(([id,label,numeric,width])=>({id,label,numeric,width,min:120})),{id:'state',label:'확인 상태',width:210,get:r=>r.uncertain?'수량/연결 확인 필요':r.quality},{id:'actions',label:'내역 / 빠른 입력',filter:false,width:240,min:220,max:300}];
const stockGrid=window.qmesStockGrid?.create(stockColumns,{kind:'raw',storage:{getItem:key=>window.localStorage.getItem(key),setItem:(key,value)=>window.localStorage.setItem(key,value)},account:()=>String(window.__QMES_CURRENT_USER__?.id||window.__QMES_USER__?.id||'session')});
const gridCell=(row,type,value)=>window.qmesStockGrid?.cell(row,type,value)||fmt(value);
async function saveGridMovement(row,values,id){
 const version=epoch;if(loading||!snapshot)throw Error('자료 조회가 끝난 후 다시 저장해주세요.');
 const entry=core.validateEntry(window.qmesStockGrid.makeEntry('raw',row,values,{id,user:window.__QMES_CURRENT_USER__?.name||window.__QMES_USER__?.name||''}));
 if(window.qmesConfirm&&!(await window.qmesConfirm((entry.status==='confirmed'?'재고에 반영':'미확인 기록으로 저장')+'하시겠습니까?\n'+row.material+' · '+row.lot+'\n'+(entry.quantity==null?'수량 미확인':fmt(entry.quantity)+' kg')+' · '+entry.note)))return false;
 if(version!==epoch)throw Error('계정이 변경되었습니다. 다시 조회해주세요.');
 const key=core.PREFIX+id,saved=await request('/api/qmes-sync/inventory',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({key,payload:{module:'materialStock',schema:1,entry}})});
 if(saved?.record_key!==key)throw Error('저장 결과를 확인하지 못했습니다. 같은 입력으로 다시 시도해주세요.');return version===epoch;
}
function stockTableMarkup(matches){
 const headers=stockGrid?.headers()||stockColumns.map(c=>'<th>'+esc(c.label)+'</th>').join(''),cols=stockGrid?.cols(model.rows)||'';
 return '<div class="ms-table-wrap"><table class="ms-table ms-stock-table">'+cols+'<thead><tr>'+headers+'</tr></thead><tbody>'+(matches.slice((page-1)*10,page*10).map((r,i)=>'<tr data-sg-row="'+esc(r.key)+'"><td>'+((page-1)*10+i+1)+'</td><td>'+esc(r.material)+'</td><td>'+esc(r.lot)+'<small style="display:block;color:#64748b">'+esc(core.warehouseInfo(r).code||'창고 미지정/혼재')+'</small></td><td>'+esc(r.supplier||'-')+'</td>'+[r.incoming,r.used].map((n,i)=>'<td title="'+(i===0?'수입검사 입고에서 자동 집계':'작업지시서 실투입량에서 자동 집계')+'">'+fmt(n)+'</td>').join('')+'<td>'+gridCell(r,'sample',r.sample)+'</td><td title="실사 차이 등을 정정한 증감 수량입니다.">'+fmt(r.adjust)+'</td><td>'+gridCell(r,'adjustment',r.balance)+'</td><td title="검사·보류·수량 연결 확인 상태를 반영한 참고 수량입니다. 0이 실제 재고가 없다는 뜻은 아닙니다.">'+fmt(r.available)+'</td><td><span class="ms-state '+(r.uncertain||r.quality!=='사용가능'?'warn':'')+'" title="'+esc([...r.issues,...(r.notices||[])].join(' · '))+'">'+esc(r.uncertain?'수량/연결 확인 필요':r.quality)+'</span></td><td><div class="sg-row-actions"><button type="button" data-ms-detail="'+esc(r.key)+'">입고·사용 내역</button><button type="button" data-sg-quick="'+esc(r.key)+'" '+(loading?'disabled':'')+'>빠른 입력</button></div></td></tr>').join('')||'<tr><td colspan="12">'+(loading?'조회 중입니다.':'조건에 맞는 재고 기록이 없습니다.')+'</td></tr>')+'</tbody></table></div>';
}


const deletingUsageEntries=new Set();let dataVersion=0;
async function deleteUsageEntry(entry,row,parent,button){
 if(!entry||button.disabled||deletingUsageEntries.has(entry.id))return;const version=epoch,error=parent.querySelector('[data-delete-error]'),controls=[...parent.querySelectorAll('button')].map(b=>[b,b.disabled]);deletingUsageEntries.add(entry.id);error.hidden=true;controls.forEach(([b])=>b.disabled=true);
 try{
  if(typeof window.qmesConfirm!=='function')throw Error('삭제 확인창을 불러오지 못했습니다. 새로고침 후 다시 시도해주세요.');
  if(!(await window.qmesConfirm('이 사용 기록을 삭제하시겠습니까?\n'+row.material+' · '+row.lot+'\n'+(typeLabel[entry.type]||entry.type)+' · '+fmt(entry.quantity)+' kg\n삭제 후 재고가 다시 계산됩니다.')))return;
  if(version!==epoch)throw Error('계정이 변경되었습니다. 다시 열어주세요.');
  const result=await request('/api/qmes-sync/inventory/delete-entry',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({kind:'raw',id:entry.id,expectedEntry:entry})});
  if(result?.recordKey!==core.PREFIX+entry.id)throw Error('삭제 결과를 확인하지 못했습니다. 새로고침 후 확인해주세요.');if(version!==epoch)return;
  const reopen=parent.open&&pageRoot.classList.contains('active');dataVersion++;entries=entries.filter(e=>e.id!==entry.id);if(snapshot){snapshot={...snapshot,entries};model=core.build(snapshot);}parent.close();paint();await load();
  if(version===epoch){if(reopen&&pageRoot.classList.contains('active')&&model.rows.some(r=>r.key===row.key))showDetails(row.key);window.toast?.('사용 기록을 삭제했습니다.');}
 }catch(e){if(version===epoch){error.textContent=e.message;error.hidden=false;}}
 finally{deletingUsageEntries.delete(entry.id);controls.forEach(([b,disabled])=>b.disabled=disabled);}
}

async function readStockSnapshot(signal){
  const paths=[['/api/iqc','수입검사'],['/api/qmes/work-orders','작업지시'],['/api/trace?keyword=','작업실적'],['/api/qmes-sync/inventory','수불기록'],['/api/qmes-quality-gate/holds?lot=','품질보류']];
  const results=await Promise.all(paths.map(async([url,name])=>{try{return {data:await request(url,{signal}),name};}catch(error){return {error:name+': '+error.message,data:[],name};}}));
  return {iqc:Array.isArray(results[0].data)?results[0].data:[],orders:Array.isArray(results[1].data)?results[1].data:[],actuals:Array.isArray(results[2].data)?results[2].data:[],entries:core.readEntries(Array.isArray(results[3].data)?results[3].data:[]),holds:results[4].data?.holds||[],sourceErrors:results.filter(r=>r.error).map(r=>r.error)};
}
async function load(){
 if(loading)return;loading=true;const version=epoch,readVersion=++dataVersion;paint();
 try{
  if(window.qmesAuthDataReady?.wait)await window.qmesAuthDataReady.wait();
  const fresh=await readStockSnapshot();
  if(version!==epoch||readVersion!==dataVersion)return;
  snapshot=fresh;entries=fresh.entries;
  model=core.build(snapshot);loadedAt=new Date().toLocaleString('ko-KR');
 }catch(error){if(version===epoch)model={rows:[],warnings:[error.message],unallocated:[]};}
 finally{if(version===epoch){loading=false;paint();}}
}
function pagerMarkup(current,total){
 const button=(target,label,disabled=false)=>'<button type="button" data-ms-page="'+target+'"'+(disabled?' disabled':'')+'>'+label+'</button>';
 return '<nav class="ms-pager" aria-label="재고관리 페이지">'+button(Math.max(1,current-1),'‹',current===1)+Array.from({length:total},(_,i)=>'<button type="button" data-ms-page="'+(i+1)+'" class="'+(current===i+1?'primary':'')+'"'+(current===i+1?' aria-current="page"':'')+'>'+(i+1)+'</button>').join('')+button(Math.min(total,current+1),'›',current===total)+'</nav>';
}
function lastReceiptDate(row){
 return (row.receipts||[]).map(receipt=>receipt.date).filter(date=>/^\d{4}-\d{2}-\d{2}$/.test(date)).sort().at(-1)||'';
}
function sortedByReceipt(rows,direction){
 return [...rows].sort((a,b)=>{
  const first=lastReceiptDate(a),second=lastReceiptDate(b);
  if(!first||!second)return Number(!first)-Number(!second);
  return direction==='newest'?second.localeCompare(first):first.localeCompare(second);
 });
}
function quickSortMarkup(){
 const sort=stockGrid?.sort;
 const active=receiptOrder||(sort?.id==='material'?'name-'+sort.direction:'');
 return '<label class="ms-sort-control"><span>정렬</span><select data-ms-sort aria-label="원료 재고 정렬">'+
 [['','기본 정렬'],['name-asc','원료명 오름차순 ↑'],['name-desc','원료명 내림차순 ↓'],['newest','최근 입고순 ↓'],['oldest','오래된 입고순 ↑']]
 .map(([value,label])=>'<option value="'+value+'"'+(value===active?' selected':'')+'>'+label+'</option>').join('')+'</select></label>';
}
function paint(){
 window.qmesStockGrid?.capture(root);
 const searched=model.rows.filter(r=>!query||[r.material,r.lot,r.supplier,core.warehouseInfo(r).code].join(' ').toLowerCase().includes(query.toLowerCase())),filtered=stockGrid?.apply(searched)||searched,matches=receiptOrder?sortedByReceipt(filtered,receiptOrder):filtered,pages=Math.max(1,Math.ceil(matches.length/10));page=Math.min(page,pages);
 root.innerHTML='<div class="ms-shell"><header class="ms-head"><strong>재고관리</strong><div><button type="button" data-ms="refresh" '+(loading?'disabled':'')+'>새로고침</button><button type="button" class="primary" data-ms="new" '+(loading||!snapshot?'disabled':'')+'>+ 재검사·샘플 / 재고 기록</button></div></header>'+
 '<div class="ms-policy">수입검사 입고와 생산 투입·재검사·샘플 사용 기록을 반영한 재고입니다.<br><b>과거 재검사·샘플 사용량을 확인해 주세요.</b> 미확인 사용 기록은 수량을 확인한 뒤 재고에 반영합니다.</div>'+
 (model.warnings.length?'<div class="ms-error" role="alert">일부 자료 조회 실패 · 입고·사용 연결 정보를 확인해주세요.<br>'+model.warnings.map(esc).join('<br>')+'</div>':'')+
 '<div class="ms-toolbar"><label>원료 / LOT / 공급업체 / 창고 <input data-ms-search value="'+esc(query)+'" placeholder="전체"></label><span>'+ (loading?'연결된 입고·투입 자료 조회 중':esc(loadedAt))+'</span></div>'+
 '<div class="ms-totals"><span>LOT <b>'+matches.length+'</b>건</span><span>재고 <b>'+fmt(matches.reduce((s,r)=>s+r.balance,0))+'</b> kg</span><span>수량 미확인 기록 <b>'+entries.filter(e=>e.status==='pending').length+'</b>건</span><span>입고·투입 연결 확인 <b>'+model.unallocated.length+'</b>건</span></div>'+
 (stockGrid?.tools().replace('<button type="button" data-sg-clear>',()=>quickSortMarkup()+'<button type="button" data-sg-clear>')||quickSortMarkup())+stockTableMarkup(matches)+
 pagerMarkup(page,pages)+
 '<p class="ms-foot">단위 kg · 계획량은 차감하지 않습니다. 품질보류·검사대기·불합격 및 연결 확인 사항은 확인 상태에서 확인하세요. 기초재고를 등록하면 기준일 시작 시점부터 계산합니다.</p>'+
 '<details class="ms-unallocated"><summary>원료·LOT·공급업체 연결 점검</summary>'+'<div class="ms-table-wrap"><table class="ms-table ms-audit-table"><colgroup><col style="width:10%"><col style="width:12%"><col style="width:13%"><col style="width:13%"><col style="width:12%"><col style="width:10%"><col style="width:13%"><col style="width:17%"></colgroup><thead><tr>'+['수입검사 원본','원본 원료명','원본 LOT','원본 공급업체','표시 원료명','표시 LOT','연결 공급업체','연결 근거/확인 내용'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+model.rows.flatMap(r=>r.receipts.flatMap(e=>(e.originals||[]).map(o=>'<tr>'+[o.id,o.material,o.lot,o.supplier,r.material,r.lot,r.supplier||'미확인',[...r.issues,...(r.notices||[])].join(' · ')||'원본 일치'].map(value=>'<td>'+esc(value)+'</td>').join('')+'</tr>'))).join('')+'</tbody></table></div></details>'+
 (model.unallocated.length?'<details class="ms-unallocated"><summary>연결 확인이 필요한 기록 '+model.unallocated.length+'건</summary>'+model.unallocated.map(e=>'<p>'+esc([e.source,e.id,e.material,e.lot,e.note].filter(Boolean).join(' · '))+'</p>').join('')+'</details>':'')+'</div>';
 root.querySelector('[data-ms-search]').addEventListener('keydown',event=>{if(event.key==='Enter'){query=event.target.value.trim();page=1;paint();}});
 const sortSelect=root.querySelector('[data-ms-sort]');
 sortSelect.onchange=()=>{
  const value=sortSelect.value;
  receiptOrder=['newest','oldest'].includes(value)?value:'';
  stockGrid?.setSort('material',value.startsWith('name-')?value.slice(5):null);
  page=1;paint();root.querySelector('[data-ms-sort]')?.focus();
 };
 if(stockGrid)window.qmesStockGrid.mount(root,{grid:stockGrid,kind:'raw',rows:model.rows,tableSelector:'.ms-stock-table',onChange:()=>{if(stockGrid.sort)receiptOrder='';page=1;paint();},onSave:saveGridMovement,onSaved:async()=>{window.toast?.('재고 기록을 저장했습니다.');await load();}});
}
function sourceInfo(event){
 if(event.source==='수입검사')return {title:'수입검사 · '+(event.date||'입고일 미확인'),detail:'입고량 '+(event.qty==null?'미확인':fmt(event.qty/1e6)+' kg')+' · 검사 '+(event.judge||'대기')+(event.note?' · '+event.note:'')};
 if(event.source==='작업지시')return {title:'작업지시서 · '+(event.documentNo||event.id||'번호 미확인'),detail:'생산 LOT '+(event.output||'미입력')+(event.product?' · '+event.product:'')};
 if(event.source==='작업실적')return {title:'작업실적 · '+(event.date||'일자 미확인'),detail:'생산 LOT '+(event.output||'미입력')};
 return {title:event.kind+' 기록',detail:event.note||'직접 등록한 사용·조정 기록'};
}
function usageOrder(event,row){
 const matches=(snapshot?.orders||[]).filter(order=>!order.deleted&&!/취소/.test(String(order.fields?.['진행상태']||''))).filter(order=>event.source==='작업지시'?String(order.id)===String(event.id):event.output&&core.lot(order.fields?.['생산 LOT NO'])===core.lot(event.output)&&order.materials?.some(m=>core.lot(m.lot)===core.lot(row.lot)&&core.material(m.sourceName||m.name)===core.material(row.material)));
 if(matches.length!==1)return {order:null,material:null};
 const order=matches[0],materials=(order.materials||[]).filter(m=>core.lot(m.lot)===core.lot(row.lot)&&core.material(m.sourceName||m.name)===core.material(row.material));
 const indexed=event.source==='작업지시'?order.materials?.[event.index]:null;
 return {order,material:indexed&&materials.includes(indexed)?indexed:materials.length===1?materials[0]:null};
}
function ledgerSections(row){
 const receipts=row.ledger.map((event,index)=>({event,index})).filter(({event})=>event.source==='수입검사');
 const uses=row.ledger.map((event,index)=>({event,index})).filter(({event})=>['작업지시','작업실적'].includes(event.source));
 const head=(title,count,total)=>'<div class="ms-ledger-section-head"><h4>'+title+'</h4><span class="ms-ledger-total">'+count+'건 · 합계 '+fmt(total)+' kg</span></div>';
 const table=(widths,headers,body,empty)=>'<div class="ms-table-wrap"><table class="ms-table ms-ledger-table"><colgroup>'+widths.map(width=>'<col style="width:'+width+'%">').join('')+'</colgroup><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+(body||'<tr><td colspan="'+headers.length+'">'+empty+'</td></tr>')+'</tbody></table></div>';
 const receiptRows=receipts.map(({event:e,index})=>{const original=snapshot?.iqc.find(r=>String(r.id)===String(e.id));const weights=e.qty==null?(e.originals||[]).map(r=>core.number(r.quantity)).filter(n=>n>0).map(fmt):[];return '<tr><td>'+esc(e.date||'일자 미확인')+'</td><td>'+esc(row.material)+'</td><td>'+esc(row.lot)+'</td><td>'+esc(row.supplier||'미확인')+'</td><td>'+fmt(e.qty==null?null:e.qty/1e6)+'</td><td>'+esc(e.judge||'대기')+'</td><td>'+esc(original?.inspector||'—')+'</td><td class="ms-source-cell">수입검사'+(e.note?'<small>'+esc(e.note)+'</small>':'')+(weights.length?'<small>원본 입고 중량 '+weights.map(esc).join(' / ')+' kg</small>':'')+'</td></tr>';}).join('');
 const useRows=uses.map(({event:e,index})=>{const {order,material}=usageOrder(e,row),fields=order?.fields||{},plan=core.number(material?.plan),documentNo=fields['작업지시번호']||e.documentNo;return '<tr><td>'+esc(e.date||'일자 미확인')+'</td><td class="ms-source-cell">'+esc(documentNo||'작업실적')+(e.source==='작업실적'?'<small>저장된 작업실적 기준</small>':'')+'</td><td>'+esc(fields['제품명']||e.product||'미확인')+'</td><td>'+esc(e.output||'미입력')+'</td><td>'+fmt(plan)+'</td><td>'+fmt(e.qty==null?null:e.qty/1e6)+'</td><td>'+esc(fields['작업자']||'—')+'</td><td>'+esc(fields['진행상태']||'미확인')+'</td></tr>';}).join('');
 const journal=row.ledger.map(e=>{const info=sourceInfo(e);return '<tr><td>'+esc(e.date||'일자 미확인')+'</td><td>'+esc(e.kind)+'</td><td>'+(e.delta==null?'미확인':e.delta>0?fmt(e.delta/1e6):'—')+'</td><td>'+(e.delta==null?'미확인':e.delta<0?fmt(-e.delta/1e6):'—')+'</td><td class="ms-source-cell">'+esc(info.title)+'<small>'+esc(info.detail)+'</small></td></tr>';}).join('');
 return '<section class="ms-ledger-section" data-ledger-section="journal"><h3>입고·사용 기록</h3>'+table([13,13,15,15,44],['일자','구분','입고·증가(kg)','사용·차감(kg)','입고·사용 근거'],journal,'표시할 입고·사용 기록이 없습니다.')+'</section><section class="ms-ledger-section ms-usage-summary"><h3>사용 내역</h3><p class="ms-ledger-note">수입검사 입고 내용과 작업지시서 생산 투입 내용을 아래에서 바로 확인할 수 있습니다.</p><section class="ms-ledger-section" data-ledger-section="receipts">'+head('입고 내역 · 수입검사',receipts.length,row.incoming)+table([10,13,14,16,11,9,11,16],['입고일','원료명','원료 LOT','공급업체','입고량(kg)','검사 판정','검사자','입고 근거'],receiptRows,'연결된 수입검사 입고 내역이 없습니다.')+'</section>'+
 '<section class="ms-ledger-section" data-ledger-section="production">'+head('생산 사용 내역 · 작업지시서 투입',uses.length,row.used)+'<p class="ms-ledger-note">계획투입량은 참고값이며, 재고는 실투입량만 차감합니다.</p>'+table([10,18,15,14,11,11,12,9],['작업일','작업지시번호 / 사용 근거','제품명','생산 LOT','계획투입량(kg)','실투입량(kg)','작업자','진행상태'],useRows,'연결된 생산 투입 내역이 없습니다. 재검사·샘플 사용은 아래에서 별도로 추가하세요.')+'</section></section>';
}
function showDetails(key){
 const row=model.rows.find(r=>r.key===key);if(!row)return;selected=key;
 const dialog=document.createElement('dialog');dialog.className='ms-dialog ms-ledger-dialog';
 const manual=entries.filter(e=>core.lot(e.lot)===row.lot&&core.material(e.material)===core.material(row.material)&&(!e.supplier||core.supplierKey(e.supplier)===core.supplierKey(row.supplier)));
 dialog.innerHTML='<header><strong>입고·사용 내역</strong><button type="button" data-close>닫기</button></header><div class="ms-dialog-body">'+
 '<div class="ms-material-info">'+[['원료명',row.material],['원료 LOT',row.lot],['공급업체',row.supplier||'미확인 (수입검사 원본 확인 필요)']].map(([label,value])=>'<div><b>'+label+'</b><span>'+esc(value)+'</span></div>').join('')+'</div>'+
 '<div class="ms-policy">입고는 수입검사, 생산 사용은 작업지시서의 실투입량을 기준으로 표시합니다.<br>기초재고 '+fmt(row.opening)+' kg'+(row.start?' · '+esc(row.start)+' 시작 기준':' · 전체 저장 이력 기준')+' / 현재 재고 <b>'+fmt(row.balance)+' kg</b> · 미확인 사용량은 반영 전입니다.</div>'+[...row.issues,...(row.notices||[])].map(s=>'<p class="ms-ledger-note">'+esc(s)+'</p>').join('')+
 ledgerSections(row)+
 '<section class="ms-ledger-section"><div class="ms-ledger-section-head"><h3>재검사·샘플 사용 / 재고 조정</h3><button type="button" class="primary" data-new>+ 사용 기록 추가</button></div><div class="ms-table-wrap"><table class="ms-table ms-manual-table"><colgroup>'+[12,12,12,14,32,18].map(width=>'<col style="width:'+width+'%">').join('')+'</colgroup><thead><tr>'+['일자','구분','수량(kg)','확인 상태','사용 사유 / 확인 내용','처리'].map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+
 (manual.map(e=>'<tr><td>'+esc(e.date||'미확인')+'</td><td>'+esc(typeLabel[e.type])+'</td><td>'+fmt(e.quantity)+'</td><td>'+esc({pending:'수량 확인 필요',confirmed:'확인 완료',cancelled:'취소'}[e.status])+'</td><td>'+esc(e.note)+'</td><td><div class="stock-entry-actions"><button type="button" data-edit="'+esc(e.id)+'">수정/확정</button><button type="button" class="stock-delete" data-delete-entry="'+esc(e.id)+'">삭제</button></div></td></tr>').join('')||'<tr><td colspan="6">등록된 재검사·샘플 사용 기록이 없습니다. 사용한 양을 확인하면 위 버튼으로 추가하세요.</td></tr>')+'</tbody></table></div><p class="ms-error" data-delete-error role="alert" hidden></p></section></div>';
 
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.querySelector('[data-new]').onclick=()=>editEntry(null,row,dialog);
 dialog.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>editEntry(entries.find(e=>e.id===b.dataset.edit),row,dialog));
 dialog.querySelectorAll('[data-delete-entry]').forEach(b=>b.onclick=()=>deleteUsageEntry(manual.find(e=>e.id===b.dataset.deleteEntry),row,dialog,b));
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});document.body.append(dialog);dialog.showModal();
}
function attachStockSuggestions(form,specs){
 if(!form.querySelectorAll)return;
 const controllers=[];
 const outside=event=>controllers.forEach(c=>{if(!c.wrap.contains(event.target))c.close();});
 const release=()=>controllers.forEach(c=>c.release());
 document.addEventListener?.('pointerdown',outside,true);document.addEventListener?.('pointerup',release,true);document.addEventListener?.('pointercancel',release,true);
 form.closest?.('dialog')?.addEventListener('close',()=>{controllers.forEach(c=>c.close());document.removeEventListener?.('pointerdown',outside,true);document.removeEventListener?.('pointerup',release,true);document.removeEventListener?.('pointercancel',release,true);},{once:true});
 form.setAttribute('autocomplete','off');
 form.querySelectorAll('input,textarea').forEach(field=>{field.setAttribute('autocomplete','off');field.setAttribute('autocorrect','off');field.setAttribute('spellcheck','false');});
 for(const [name,suggestions] of Object.entries(specs)){
  const field=form.elements[name];if(!field)continue;
  const wrap=document.createElement('div'),list=document.createElement('div'),id='stock-options-'+crypto.randomUUID();
  wrap.className='ms-stock-input';list.className='ms-stock-options';list.id=id;list.hidden=true;list.setAttribute('role','listbox');list.setAttribute('aria-label','입력값 선택');
  field.parentNode.insertBefore(wrap,field);wrap.append(field,list);field.setAttribute('role','combobox');field.setAttribute('aria-autocomplete','list');field.setAttribute('aria-controls',id);field.setAttribute('aria-expanded','false');
  let options=[],index=-1,interacting=false,closeTimer=null;
  const cancelClose=()=>{if(closeTimer!==null){clearTimeout(closeTimer);closeTimer=null;}};
  const close=()=>{cancelClose();interacting=false;list.hidden=true;index=-1;field.setAttribute('aria-expanded','false');field.removeAttribute('aria-activedescendant');};
  controllers.push({wrap,close,release:()=>{const wasInteracting=interacting;interacting=false;if(wasInteracting&&!list.hidden&&!wrap.contains(document.activeElement))field.focus({preventScroll:true});}});
  list.addEventListener('pointerdown',()=>{interacting=true;cancelClose();});
  const select=i=>{const item=options[i];if(!item)return;if(item.apply)item.apply(form);else field.value=item.value;close();field.dispatchEvent(new Event('change',{bubbles:true}));};
  const highlight=()=>{list.querySelectorAll('[role="option"]').forEach((b,i)=>{b.setAttribute('aria-selected',String(i===index));});if(index>=0){const option=list.children[index];field.setAttribute('aria-activedescendant',option.id);option.scrollIntoView?.({block:'nearest'});}else field.removeAttribute('aria-activedescendant');};
  const open=()=>{
   const query=field.value.trim().toLowerCase();options=suggestions(form).filter(item=>!query||[item.value,item.detail].join(' ').toLowerCase().includes(query)).slice(0,30);index=-1;list.replaceChildren();
   if(!options.length){close();return;}
   options.forEach((item,i)=>{const button=document.createElement('button'),title=document.createElement('span');button.type='button';button.id=id+'-'+i;button.setAttribute('role','option');button.setAttribute('aria-selected','false');title.textContent=item.value;button.append(title);if(item.detail){const detail=document.createElement('small');detail.textContent=item.detail;button.append(detail);}button.onmousedown=e=>e.preventDefault();button.onclick=()=>select(i);list.append(button);});
   list.hidden=false;field.setAttribute('aria-expanded','true');field.removeAttribute('aria-activedescendant');
  };
  field.addEventListener('focus',()=>{cancelClose();if(list.hidden)open();});field.addEventListener('input',open);field.addEventListener('blur',()=>{cancelClose();if(list.hidden)return;closeTimer=setTimeout(()=>{closeTimer=null;if(!interacting&&!wrap.contains(document.activeElement))close();},120);});
  field.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();return;}if(!['ArrowDown','ArrowUp','Enter'].includes(event.key))return;if(list.hidden){if(event.key==='Enter')return;open();}if(list.hidden)return;event.preventDefault();if(event.key==='Enter'){if(index>=0)select(index);return;}index=(index+(event.key==='ArrowDown'?1:-1)+options.length)%options.length;highlight();});
 }
}
function editEntry(existing=null,row=null,parent=null){
 const dialog=document.createElement('dialog');dialog.className='ms-dialog ms-entry stock-entry';
 const id=existing?.id||crypto.randomUUID();
 dialog.innerHTML='<header><strong>원료 재검사·샘플 / 재고 기록</strong><button type="button" data-close>닫기</button></header><form class="ms-dialog-body" autocomplete="off"><p class="ms-policy">아직 수량을 모르면 “수량 확인 필요”로 보관하세요. “확인 완료”인 수량만 재고에 반영합니다.</p><div class="ms-form">'+
 '<label class="full">재고 대상<select data-stock-kind '+(existing?'disabled':'')+'><option value="raw">원료</option><option value="finished">완제품</option></select></label>'+
 '<label>원료명<input name="material" required value="'+esc(existing?.material||row?.material||'')+'"></label><label>원료 LOT<input name="lot" required value="'+esc(existing?.lot||row?.lot||'')+'"></label><label>공급업체<input name="supplier" value="'+esc(existing?.supplier||row?.supplier||'')+'"></label>'+
 '<label>구분<select name="type">'+Object.entries(typeLabel).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join('')+'</select></label>'+
 '<label>사용일 / 기초 기준일<input type="date" name="date" value="'+esc(existing?.date||'')+'"></label>'+
 '<label>확인 상태<select name="status"><option value="pending">수량 확인 필요</option><option value="confirmed">확인 완료</option><option value="cancelled">기록 취소</option></select></label>'+
 '<label>수량<input type="number" name="amount" min="0" step="any" placeholder="미확인 시 비워 두세요" value="'+esc(existing?.quantity??'')+'"></label><label>입력 단위<select name="unit"><option value="kg">kg</option><option value="g">g</option></select></label>'+
 '<label>조정 방향<select name="direction"><option value="out">차감</option><option value="in">증가 (재고 조정)</option></select></label>'+
 '<label class="full">사용 사유 / 확인 내용<textarea name="note" required placeholder="예: 재검사에 소량 사용, 사용량 확인 필요">'+esc(existing?.note||'')+'</textarea></label></div><p class="ms-foot">기초재고는 기준일 시작 시점의 실사 수량입니다. 기준일 이전 입고·사용 이력은 계산에서 제외합니다. 취소한 기록은 이력에 남습니다.</p><div class="ms-error" data-error hidden></div><footer><button type="button" data-cancel>취소</button><button type="submit" class="primary">기록 저장</button></footer></form>';
 const form=dialog.querySelector('form');form.elements.type.value=existing?.type||'retest';form.elements.status.value=existing?.status||'pending';form.elements.direction.value=existing?.direction||'out';
 const candidates=()=>model.rows.map(r=>({value:r.material,detail:r.lot+' · '+(r.supplier||'공급업체 미확인'),apply:f=>{f.elements.material.value=r.material;f.elements.lot.value=r.lot;f.elements.supplier.value=r.supplier||'';},row:r}));
 attachStockSuggestions(form,{
  material:()=>candidates(),
  lot:f=>candidates().filter(c=>!f.elements.material.value||core.material(c.row.material)===core.material(f.elements.material.value)).map(c=>({...c,value:c.row.lot,detail:c.row.material+' · '+(c.row.supplier||'공급업체 미확인')})),
  supplier:f=>[...new Set(model.rows.filter(r=>(!f.elements.material.value||core.material(r.material)===core.material(f.elements.material.value))&&(!f.elements.lot.value||core.lot(r.lot)===core.lot(f.elements.lot.value))).map(r=>r.supplier).filter(Boolean))].map(value=>({value,detail:'수입검사 공급업체'}))
 });
 const stockKind=dialog.querySelector('[data-stock-kind]');stockKind.onchange=async()=>{
  if(stockKind.value!=='finished'||existing)return;const error=dialog.querySelector('[data-error]');error.hidden=true;stockKind.disabled=true;
  try{if(typeof window.qmesFinishedStock?.openRecord!=='function')throw Error('완제품 기록 화면을 불러오지 못했습니다. 새로고침 후 다시 선택해주세요.');
   if(await window.qmesFinishedStock.openRecord()){dialog.close();parent?.close();}
  }catch(e){error.textContent=e.message;error.hidden=false;}finally{stockKind.disabled=false;stockKind.value='raw';}
 };
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
root.addEventListener('click',event=>{const button=event.target.closest('button');if(!button||button.disabled)return;if(button.dataset.ms==='refresh')load();if(button.dataset.ms==='new')editEntry();if(button.dataset.msDetail)showDetails(button.dataset.msDetail);if(button.dataset.msPage){page=Number(button.dataset.msPage);paint();}});
window.qmesStockInputStyle={attach:attachStockSuggestions};
window.qmesRawStock={openRecord:()=>{editEntry();return true;},async checkFifo(lot,warehouse,signal){
 await window.qmesAuthDataReady?.wait();
 return core.fifoCheck(core.build(await readStockSnapshot(signal)),lot,warehouse);
},async checkMaterialFifo(lot,material,signal){
 await window.qmesAuthDataReady?.wait();
 const snapshot=await readStockSnapshot(signal);
 return core.materialFifoCheck(core.build({...snapshot,iqc:snapshot.iqc.filter(core.isFifoReceipt)}),lot,material);
}};
new MutationObserver(()=>{if(pageRoot.classList.contains('active'))load();}).observe(pageRoot,{attributes:true,attributeFilter:['class']});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&pageRoot.classList.contains('active'))load();});
root.addEventListener('click',event=>{if(event.target.closest('[data-sg-clear]'))receiptOrder='';},true);
function clearAccount(){receiptOrder='';window.qmesStockGrid?.clear(root);stockGrid?.resetAccount();epoch++;loading=false;snapshot=null;loadedAt='';query='';page=1;model={rows:[],warnings:[],unallocated:[]};entries=[];document.querySelectorAll('.ms-dialog').forEach(dialog=>dialog.close());paint();}
window.addEventListener('qmes-authenticated',()=>{clearAccount();if(pageRoot.classList.contains('active'))load();});
document.addEventListener('click',event=>{if(event.target.closest?.('[data-auth="logout"]'))clearAccount();},true);
 const style=document.createElement('style');style.textContent=`
.ms-sort-control{position:relative;display:inline-flex;align-items:center;gap:7px;margin-right:8px;color:#516982;font:600 12px Pretendard,"Noto Sans KR",Arial,sans-serif}
.ms-sort-control::after{content:"";position:absolute;right:12px;top:50%;width:6px;height:6px;border-right:1.5px solid #3c668f;border-bottom:1.5px solid #3c668f;transform:translateY(-70%) rotate(45deg);pointer-events:none}
#materialStock .ms-sort-control select{appearance:none;box-sizing:border-box;min-width:144px;height:30px;padding:0 28px 0 10px;border:1px solid #cfdbea;border-radius:4px;background:#fff;color:#244260;font:inherit;cursor:pointer}
#materialStock .ms-sort-control select:hover{border-color:#93b7d8;background:#f6faff}
#materialStock .ms-sort-control select:focus-visible{outline:2px solid #2f8de4;outline-offset:2px}

.ms-stock-input{position:relative;min-width:0}.ms-stock-input>input{width:100%}.ms-stock-options[hidden]{display:none!important}.ms-stock-options{position:absolute;top:calc(100% + 3px);left:0;right:0;z-index:30;max-height:220px;overflow:auto;background:#fff;border:1px solid #c7d6e5;border-radius:4px;box-shadow:0 4px 12px #2442601f;padding:3px}html body .ms-dialog .ms-stock-options button,html body .fg-dialog .ms-stock-options button{display:block;width:100%;padding:8px 10px;border:0;border-bottom:1px solid #e7edf4;border-radius:0;background:#fff;color:#244260;text-align:left;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px;font-weight:400;line-height:1.5;white-space:normal}html body .ms-dialog .ms-stock-options button:last-child,html body .fg-dialog .ms-stock-options button:last-child{border-bottom:0}html body .ms-dialog .ms-stock-options button:hover,html body .fg-dialog .ms-stock-options button:hover,html body .ms-dialog .ms-stock-options button[aria-selected=true],html body .fg-dialog .ms-stock-options button[aria-selected=true]{background:#e8f0f8;color:#166fbb}.ms-stock-options small{display:block;font-size:11px;color:#708297;font-weight:400}.ms-stock-input>input:focus-visible{outline:2px solid #72afe9;outline-offset:1px;border-color:#72afe9}
#materialStock,.ms-dialog{font-family:Pretendard,"Noto Sans KR",Arial,sans-serif;font-size:12px;color:#244260}.ms-shell{background:#fff;border:1px solid #d5dce5;border-radius:8px;overflow:hidden}.ms-head,.ms-dialog>header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px 18px;border-bottom:1px solid #d5dce5}.ms-head strong,.ms-dialog>header strong{font-size:18px;font-weight:800}.ms-head>div{display:flex;gap:7px}#materialStock button,.ms-dialog button{font:600 12px Pretendard,"Noto Sans KR",Arial,sans-serif;color:#244260;border:1px solid #c7d6e5;border-radius:4px;background:#fff;padding:6px 10px;cursor:pointer}#materialStock button.primary,.ms-dialog button.primary{background:#2f8de4;border-color:#2f8de4;color:#fff}#materialStock button:disabled,.ms-dialog button:disabled{opacity:.5;cursor:default}.ms-policy{margin:14px 16px;padding:10px 12px;background:#f6f9fc;border:1px solid #dce5ee;line-height:1.7;color:#536b83}.ms-policy b{color:#95601a}.ms-toolbar,.ms-totals{display:flex;align-items:center;gap:16px;flex-wrap:wrap;padding:10px 16px}.ms-toolbar>span{margin-left:auto;color:#708297}.ms-toolbar input{margin-left:8px;width:230px;padding:7px 9px;border:1px solid #c7d6e5;border-radius:4px;font:inherit}.ms-table-wrap{margin:8px 16px;overflow:auto;border:1px solid #d5dce5}.ms-table{width:100%;min-width:1100px;border-collapse:separate;border-spacing:0}.ms-table th,.ms-table td{padding:9px 8px;border:0;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5;text-align:center;vertical-align:middle;font-size:12px;white-space:nowrap}.ms-table th{background:#e8f0f8;font-weight:600}.ms-table td{font-weight:400}.ms-table tr>:last-child{border-right:0}.ms-table tbody tr:last-child>td{border-bottom:0}.ms-state{color:#23754b}.ms-state.warn,.ms-negative{color:#b45309!important}.ms-pager{display:flex;justify-content:center;gap:5px;padding:12px}.ms-foot{margin:12px 16px;font-size:11px;color:#708297;line-height:1.6}.ms-error{padding:10px 12px;background:#fff1f2;color:#a02040;margin:10px 16px;border:1px solid #efc8ce}.ms-unallocated{margin:14px 16px;line-height:1.6}.ms-dialog{width:min(1150px,calc(100vw - 36px));max-height:90dvh;overflow:auto;border:1px solid #d5dce5;border-radius:8px;padding:0;background:#fff}.ms-dialog::backdrop{background:#17314c66}.ms-dialog-body{padding:12px}.ms-dialog .ms-table{min-width:760px}.ms-dialog .ms-table td:last-child{white-space:normal;min-width:180px}.ms-entry{width:min(850px,calc(100vw - 36px))}.ms-form{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;padding:10px 16px}.ms-form label{display:grid;gap:5px;font-weight:600}.ms-form input,.ms-form select,.ms-form textarea{min-width:0;width:100%;box-sizing:border-box;padding:8px;border:1px solid #c7d6e5;border-radius:4px;font:400 12px Pretendard,"Noto Sans KR",Arial,sans-serif}.ms-form .full{grid-column:1/-1}.ms-form textarea{min-height:70px}.ms-entry footer{display:flex;justify-content:flex-end;gap:8px;padding:12px 16px;border-top:1px solid #d5dce5}@media(max-width:750px){.ms-form{grid-template-columns:1fr}.ms-head{align-items:flex-start;flex-direction:column}}

/* Match work-order / sales list typography and single-owner neutral grid. */
html body #app #materialStock .ms-shell{border:1px solid #d5dce5!important;border-radius:8px!important;background:#fff!important}
html body #app #materialStock .ms-table-wrap,html body .ms-dialog .ms-table-wrap{border:1px solid #d5dce5!important;border-radius:0!important;box-shadow:none!important}
html body #app #materialStock table.ms-table,html body .ms-dialog table.ms-table{border:0!important;border-collapse:separate!important;border-spacing:0!important;box-shadow:none!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important}
html body #app #materialStock table.ms-table :is(thead,tbody,tr),html body .ms-dialog table.ms-table :is(thead,tbody,tr){border:0!important;box-shadow:none!important}
html body #app #materialStock table.ms-table :is(th,td),html body .ms-dialog table.ms-table :is(th,td){border:0!important;border-right:1px solid #d5dce5!important;border-bottom:1px solid #d5dce5!important;font-family:Pretendard,"Noto Sans KR",Arial,sans-serif!important;font-size:12px!important;font-style:normal!important;text-align:center!important;vertical-align:middle!important;box-shadow:none!important}
html body #app #materialStock table.ms-table thead th,html body .ms-dialog table.ms-table thead th{height:34px!important;min-height:34px!important;padding:6px 12px!important;background:#e8f0f8!important;color:#244260!important;font-weight:600!important;line-height:20px!important}
html body #app #materialStock table.ms-table tbody td,html body .ms-dialog table.ms-table tbody td{height:46px!important;min-height:46px!important;padding:8px 12px!important;background:#fff!important;color:#344054;font-weight:400!important;line-height:1.4!important}
html body #app #materialStock table.ms-table tr>:last-child,html body .ms-dialog table.ms-table tr>:last-child{border-right:0!important}
html body #app #materialStock table.ms-table tbody tr:last-child>td,html body .ms-dialog table.ms-table tbody tr:last-child>td{border-bottom:0!important}
html body #app #materialStock table.ms-table tbody tr:hover>td{background:#eef6ff!important}
html body #app #materialStock table.ms-table :is(span,b,strong),html body .ms-dialog table.ms-table :is(span,b,strong){font-size:12px!important;font-family:inherit!important;font-weight:400!important}
html body #app #materialStock table.ms-table button,html body .ms-dialog table.ms-table button{height:25px!important;padding:3px 8px!important;border:1px solid #c7d6e5!important;border-radius:4px!important;background:#fff!important;font-family:inherit!important;font-size:11px!important;font-weight:600!important;color:#315f94!important}
html body #app #materialStock .ms-pager{display:flex!important;justify-content:center!important;gap:5px!important;border:0!important;padding:10px 16px 20px!important;background:#fff!important}
html body #app #materialStock .ms-pager button{min-width:25px!important;height:25px!important;padding:2px 8px!important;border:1px solid #c7d6e5!important;border-radius:4px!important;background:#fff!important;font-size:12px!important;font-weight:600!important;line-height:19px!important;color:#415267!important}
html body #app #materialStock .ms-pager button[aria-current="page"]{background:#166fbb!important;border-color:#166fbb!important;color:#fff!important}
html body #app #materialStock .ms-pager button:disabled{opacity:.45!important;cursor:default!important}
html body #app #materialStock .ms-pager button:focus-visible{outline:2px solid #2689ef;outline-offset:2px}
html body #app #materialStock table.ms-stock-table{table-layout:fixed!important;min-width:1520px!important}
html body #app #materialStock table.ms-audit-table{table-layout:fixed!important;min-width:1200px!important}
html body .ms-dialog table.ms-ledger-table,html body .ms-dialog table.ms-manual-table{table-layout:fixed!important;min-width:820px!important}
html body #app #materialStock table.ms-table th,html body .ms-dialog table.ms-table th{white-space:nowrap!important}
html body #app #materialStock table.ms-table td,html body .ms-dialog table.ms-table td{overflow-wrap:anywhere!important}
html body #app #materialStock table.ms-table td:nth-child(2),html body #app #materialStock table.ms-table td:nth-child(3),html body #app #materialStock table.ms-table td:nth-child(4){white-space:normal!important}
html body #app #materialStock table.ms-audit-table td,html body .ms-dialog table.ms-ledger-table td:nth-child(n+4),html body .ms-dialog table.ms-manual-table td:nth-child(5){white-space:normal!important}

.ms-ledger-dialog{width:min(1320px,calc(100vw - 36px))}
.ms-ledger-dialog .ms-dialog-body{padding:16px 18px}
.ms-material-info{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));border-top:1px solid #d5dce5;border-left:1px solid #d5dce5}
.ms-material-info>div{display:grid;grid-template-columns:90px minmax(0,1fr);min-height:42px;border-right:1px solid #d5dce5;border-bottom:1px solid #d5dce5}
.ms-material-info b{display:flex;align-items:center;justify-content:center;background:#e8f0f8;border-right:1px solid #d5dce5;font-size:12px;font-weight:600}
.ms-material-info span{display:flex;align-items:center;justify-content:center;padding:8px 10px;overflow-wrap:anywhere;text-align:center;background:#fff;font-size:12px;font-weight:400}
.ms-ledger-dialog .ms-policy{margin:12px 0;line-height:1.65}
.ms-ledger-section{margin-top:18px}
.ms-ledger-section h3{margin:0;font-size:13px;font-weight:600}
.ms-ledger-section-head{display:flex;justify-content:space-between;align-items:center;gap:12px}
.ms-usage-summary h4{margin:0;font-size:12px;font-weight:600}.ms-usage-summary>.ms-ledger-section{margin-top:14px}
.ms-ledger-total{font-size:12px;color:#526d88;font-weight:400}
.ms-ledger-dialog .ms-table-wrap{margin:8px 0 0}
.ms-ledger-note{margin:6px 0;color:#95601a;font-size:11px}
html body .ms-ledger-dialog table.ms-ledger-table{min-width:1120px!important}
html body .ms-ledger-dialog table.ms-table tbody .ms-source-cell{text-align:center!important;white-space:normal!important}
.ms-source-cell small{display:block;margin-top:4px;color:#708297;font-size:11px;line-height:1.5}
html body .ms-ledger-dialog table.ms-table button.ms-source-link{border:0!important;background:transparent!important;padding:0!important;height:auto!important;font-size:12px!important;color:#126fc0!important;text-decoration:underline;text-underline-offset:2px;white-space:normal}
@media(max-width:850px){.ms-material-info{grid-template-columns:1fr}}
`;style.textContent+="html body dialog.stock-entry{width:min(850px,calc(100vw - 36px))!important;max-height:90dvh!important;padding:0!important;border:1px solid #d5dce5!important;border-radius:8px!important;background:#fff!important;color:#244260!important;font:400 12px Pretendard,\"Noto Sans KR\",Arial,sans-serif!important}html body dialog.stock-entry>header{display:flex!important;align-items:center!important;justify-content:space-between!important;gap:12px!important;padding:15px 18px!important;border-bottom:1px solid #d5dce5!important}html body dialog.stock-entry>header strong{font-size:16px!important;font-weight:600!important}html body dialog.stock-entry>form,html body dialog.stock-entry>.fg-body{padding:18px!important}html body dialog.stock-entry .fg-form{padding:0!important}html body dialog.stock-entry :is(.ms-policy,.fg-policy){margin:0 0 16px!important;padding:10px 12px!important;background:#f6f9fc!important;border:1px solid #dce5ee!important;color:#536b83!important;font-size:12px!important;line-height:1.7!important}html body dialog.stock-entry :is(.ms-form,.fg-form-grid){display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:12px!important;padding:0!important}html body dialog.stock-entry :is(.ms-form,.fg-form-grid)>label{display:grid!important;gap:5px!important;font-size:12px!important;font-weight:600!important;color:#244260!important}html body dialog.stock-entry :is(.full,.fg-wide){grid-column:1/-1!important}html body dialog.stock-entry :is(input,select,textarea){width:100%!important;min-width:0!important;box-sizing:border-box!important;min-height:36px!important;padding:8px!important;border:1px solid #c7d6e5!important;border-radius:4px!important;background:#fff!important;color:#244260!important;font:400 12px Pretendard,\"Noto Sans KR\",Arial,sans-serif!important}html body dialog.stock-entry textarea{min-height:70px!important;resize:vertical}html body dialog.stock-entry :is(.ms-foot,.fg-note){margin:12px 0!important;color:#708297!important;font-size:11px!important;line-height:1.7!important}html body dialog.stock-entry form>footer{display:flex!important;justify-content:flex-end!important;gap:8px!important;margin:16px -18px -18px!important;padding:12px 18px!important;border-top:1px solid #d5dce5!important}html body dialog.stock-entry>header>button,html body dialog.stock-entry form>footer>button{height:32px!important;padding:6px 10px!important;border:1px solid #c7d6e5!important;border-radius:4px!important;background:#fff!important;color:#244260!important;font:600 12px Pretendard,\"Noto Sans KR\",Arial,sans-serif!important}html body dialog.stock-entry form>footer>button:is(.primary,.fg-primary){background:#2f8de4!important;border-color:#2f8de4!important;color:#fff!important}html body dialog.stock-entry::backdrop{background:#203a5266!important}@media(max-width:750px){html body dialog.stock-entry :is(.ms-form,.fg-form-grid){grid-template-columns:1fr!important}}";style.textContent+=".stock-entry-actions{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}html body .ms-dialog button.stock-delete,html body .fg-dialog button.stock-delete{color:#b42318!important;border-color:#efb8c4!important;background:#fff5f5!important}";document.head.append(style);paint();if(pageRoot.classList.contains('active'))load();
})();
