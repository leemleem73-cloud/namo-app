/* Read-only LOT graph from saved work orders, inspections, material actuals and shipping. */
(()=>{'use strict';
const root=document.querySelector('#lotTrace');if(!root)return;
const $=selector=>root.querySelector(selector),norm=v=>{const value=String(v??'').trim().toUpperCase();return ['-','NULL','UNDEFINED'].includes(value)?'':value;},esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse=v=>{if(typeof v==='string'){try{return JSON.parse(v);}catch(_){return {};}}return v||{};};
const unpack=v=>{v=parse(v);return Array.isArray(v)?v:Array.isArray(v.rows)?v.rows:Array.isArray(v.data)?v.data:[];};
const lot=order=>norm(order.fields?.['생산 LOT NO']),mid=order=>order.productionType==='중간배치';
const midKey=v=>norm(v).replace(/^MB-?/,'');
let mode='raw',serial=0,controller=null,last=null;
function status(text,detail){$('.lot-hero-status b').textContent=text;$('.lot-hero-status small').textContent=detail;}
function invalidate(){serial++;controller?.abort();controller=null;last=null;}
function reset(next=mode){invalidate();mode=next;for(const [id,value] of [['lotRawMode','raw'],['lotIntermediateMode','intermediate'],['lotFinishedMode','finished']])$('#'+id).classList.toggle('active',mode===value);$('#lotQueryInput').value='';$('#lotQueryLabel').textContent=mode==='raw'?'원자재 LOT':mode==='intermediate'?'중간재 배치번호':'완제품 LOT';$('#lotQueryInput').placeholder=mode==='raw'?'원자재 LOT 입력':mode==='intermediate'?'중간재 배치번호 입력':'완제품 LOT 입력';$('#lotHelp').textContent='저장된 작업지시서의 투입 LOT와 생산 LOT, 검사·출하 기록을 연결합니다. 계획 투입과 실제 투입은 구분해 확인하세요.';$('#lotSummary').replaceChildren();$('#lotResultTitle').textContent='LOT 추적 결과';$('#lotResultMeta').textContent='조회할 LOT를 입력하세요.';$('#lotResultBody').innerHTML='<div class="lot-empty"><b>LOT 조회 대기</b><span>LOT 번호를 입력한 후 조회해주세요.</span></div>';status('조회 대기','저장된 연결정보 기준');}
async function read(url,label,signal){try{const res=await fetch(url,{credentials:'same-origin',cache:'no-store',signal});const json=await res.json();if(!res.ok||json.success===false||!Array.isArray(json.data))throw Error(json.message||'응답 오류');return {label,rows:json.data};}catch(error){if(signal.aborted)throw error;return {label,rows:[],error:error.message||'조회 실패'};}}
function judgement(row){
 const items=unpack(row.items_json||row.items||[]);const explicit=[row.judge,row.overall,row.finalJudge,...items.filter(x=>/판정/.test(String(x.name||''))).map(x=>x.judge||x.value)].map(norm).filter(Boolean);
 const failed=v=>/불합격|부적합|FAIL|NG/.test(v),passed=v=>/^(합격|적합|PASS|OK)$/.test(v);
 if(Number(row.fail)>0||explicit.some(failed)||items.some(x=>failed(norm(x.judge))))return '불합격';
 if(row.measurements&&typeof evaluatePqcMeasurements==='function'){const result=evaluatePqcMeasurements(row.measurements).overall;return result;}
 if(explicit.some(passed))return '합격';
 if(explicit.some(v=>/대기|미확인|미검사/.test(v)))return '대기';
 return '미확인';
}
function syncRows(records){return records.flatMap(record=>{const p=parse(record.payload);return p.deleted?[]:unpack(p).filter(row=>!row.deleted);});}
function graphData(sources,q,requested){
 const [actual,work,iqc,pqc,oqc,pqcSync,oqcSync,inventory]=sources;
 const orders=work.rows.filter(row=>!row.deleted),edges=[];const known=new Set();
 for(const order of orders){const output=lot(order);if(!output)continue;known.add(output);for(const material of order.materials||[]){const savedMid=material.name==='중간배치'?orders.find(row=>mid(row)&&midKey(lot(row))===midKey(material.lot)):null;const input=savedMid?lot(savedMid):norm(material.lot);if(input){known.add(input);edges.push({input,output});}}}
 for(const row of actual.rows){const input=norm(row.lotNo),output=norm(row.finishedLot);if(input)known.add(input);if(output)known.add(output);if(input&&output)edges.push({input,output});}
 const groups=[{type:'iqc',title:'수입검사 (IQC)',rows:iqc.rows},{type:'pqc',title:'공정검사 (PQC)',rows:[...syncRows(pqcSync.rows),...pqc.rows]},{type:'oqc',title:'출하검사 (OQC)',rows:[...syncRows(oqcSync.rows),...oqc.rows]}];
 const shipping=inventory.rows.filter(row=>row.record_key==='erp:shipping').flatMap(row=>unpack(row.payload));
 const shipLot=row=>norm(row.lot||row.finishedLot||row.productionLot||(known.has(norm(row.workOrder))?row.workOrder:''));
 const candidates=requested==='intermediate'?orders.filter(mid).map(lot):requested==='finished'?[...orders.filter(row=>!mid(row)).map(lot),...actual.rows.map(row=>norm(row.finishedLot)),...groups.filter(g=>g.type!=='iqc').flatMap(g=>g.rows.map(row=>norm(row.lot))),...shipping.map(shipLot)]:[...edges.map(e=>e.input),...iqc.rows.map(row=>norm(row.lot))];
 const equal=v=>requested==='intermediate'?midKey(v)===midKey(q):v===q;
 const exact=candidates.filter(equal),seeds=new Set(exact.length?exact:candidates.filter(v=>v&&(requested==='intermediate'?midKey(v).includes(midKey(q)):v.includes(q))));
 function expand(start,reverse){const visited=new Set(start),queue=[...start];for(let i=0;i<queue.length;i++)for(const e of edges){const from=reverse?e.output:e.input,to=reverse?e.input:e.output;if(from===queue[i]&&!visited.has(to)){visited.add(to);queue.push(to);}}return visited;}
 const produced=requested==='finished'?seeds:expand(seeds,false),all=expand(produced,true);
 // Resolve legacy MB-prefixed material references only against saved intermediate producers.
 for(const order of orders.filter(mid)){const output=lot(order);if([...all].some(v=>midKey(v)===midKey(output))){for(const value of expand(new Set([output]),true))all.add(value);}}
 const linkedOrders=orders.filter(order=>all.has(lot(order)));
 const selected=groups.map(group=>{const seen=new Set();return {...group,rows:group.rows.filter(row=>{if(!all.has(norm(row.lot)))return false;const key=JSON.stringify([row.id||'',norm(row.lot),row.date,row.check||'',row.judge||'',row.items_json||row.items||'']);if(seen.has(key))return false;seen.add(key);return true;})};});
 return {q,requested,orders:linkedOrders,actual:actual.rows.filter(row=>all.has(norm(row.finishedLot))&&all.has(norm(row.lotNo))),groups:selected,shipping:shipping.filter(row=>all.has(shipLot(row))),seeds,errors:sources.filter(s=>s.error),sources};
}
function table(title,headers,rows){return '<div class="lot-detail-box"><div class="lot-detail-title">'+esc(title)+' ('+rows.length+'건)</div>'+(rows.length?'<div style="overflow:auto"><table class="lot-detail-table"><thead><tr>'+headers.map(v=>'<th>'+esc(v)+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(v=>'<td>'+esc(v??'-')+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p class="lot-trace-empty">연결된 기록이 없습니다.</p>')+'</div>';}
function render(data){const {orders,actual,groups,shipping,errors}=data,range=$('#lotRange').value,production=range!=='출하 이력',shipment=range!=='생산 이력';
 const names={raw:'원자재 LOT 추적 결과',intermediate:'중간재 배치 추적 결과',finished:'완제품 LOT 역추적 결과'};$('#lotResultTitle').textContent=names[data.requested];
 const inspections=groups.reduce((sum,g)=>sum+g.rows.length,0),found=data.seeds.size>0;
 $('#lotResultMeta').textContent='작업지시 '+orders.length+'건 · 검사 '+inspections+'건 · 출하 '+shipping.length+'건';
 status(errors.length?'일부 조회 실패':found?'연결 조회':'연결 정보 없음',errors.length?'조회되지 않은 자료가 있습니다.':'저장된 연결정보 기준');
 $('#lotSummary').innerHTML=[['조회 LOT',data.q],['작업지시',orders.length+'건'],['검사기록',inspections+'건'],['출하기록',shipping.length+'건']].map(([k,v])=>'<div class="lot-stat"><div class="k">'+esc(k)+'</div><div class="v">'+esc(v)+'</div></div>').join('');
 let html='';if(production){html+=table('작업지시 / 생산 LOT',['작업지시번호','생산구분','제품명','생산 LOT','진행상태'],orders.map(row=>[row.fields?.['작업지시번호']||row.id,row.productionType||'완제품',row.fields?.['제품명'],lot(row),row.fields?.['진행상태']]));
 html+=table('중간재 제조 / 사용량 (완료 작업지시 기준)',['중간재 LOT','종류','실제 제조량(kg)','완료 실투입량(kg)','계산 잔량(kg)'],orders.filter(mid).map(row=>{const made=Number(row.intermediateBatch?.actualQty)||0,used=data.sources[1].rows.filter(order=>!mid(order)&&order.fields?.['진행상태']==='완료').flatMap(order=>order.materials||[]).filter(m=>m.name==='중간배치'&&midKey(m.lot)===midKey(lot(row))).reduce((sum,m)=>sum+(Number(m.actual)||0),0);return [lot(row),row.intermediateBatch?.kind,made||'미확정',used,made?made-used:'미확정'];}));
 html+=table('작업지시서 원료 연결',['작업지시번호','생산 LOT','원재료명','원재료 LOT','계획량(kg)','실투입량(kg)'],orders.flatMap(row=>(row.materials||[]).filter(m=>norm(m.lot)).map(m=>[row.fields?.['작업지시번호']||row.id,lot(row),m.name,m.lot,m.plan??'-',m.actual??'-'])));
 html+=table('작업실적 / 실제 투입',['생산일','원재료 LOT','원료명','공급업체','실투입량','생산 LOT'],actual.map(row=>[String(row.workDate||'').slice(0,10),row.lotNo,row.material,row.supName,row.inputQty??'-',row.finishedLot]));}
 for(const group of groups.filter(g=>production&&g.type!=='oqc'||shipment&&g.type==='oqc'))html+=table(group.title,['검사일','LOT','품목','업체 / 고객사','판정'],group.rows.map(row=>[String(row.date||'').slice(0,10),row.lot,row.item||row.product,row.supplier||row.customer,judgement(row)]));
 if(shipment)html+=table('출하 / 납품 기록',['출하번호','완제품 LOT','고객사','제품명','출하일','출하수량','진행상태'],shipping.map(row=>[row.shipmentNo||row.no||row.id,row.lot||row.finishedLot||row.productionLot,row.customer,row.product||row.item,row.actualShipDate||row.shipDate||row.date,row.shipmentQty??row.qty??row.quantity??'-',row.deliveryStatus||row.delivery||row.status||row.shipping]));
 $('#lotResultBody').innerHTML=(errors.length?'<p class="lot-trace-warning">일부 자료 조회 실패: '+errors.map(s=>esc(s.label)).join(', ')+' · 누락 여부를 확인하세요.</p>':'')+(!found?'<div class="lot-empty"><b>조회 결과 없음</b><span>LOT 번호와 저장된 연결정보를 확인해주세요.</span></div>':'<div class="lot-detail-grid">'+html+'</div><p class="lot-trace-note">작업지시 연결은 계획을 포함합니다. 실투입·검사·출하 기록이 없는 단계는 완료로 판단하지 않습니다.</p>');}
async function search(){const q=norm($('#lotQueryInput').value);if(!q){toast('LOT 번호를 입력해주세요.');return;}invalidate();const request=serial,requested=mode;controller=new AbortController();const activeController=controller,signal=activeController.signal,timer=setTimeout(()=>activeController.abort(),20000);status('조회 중','서버 연결정보 조회');$('#lotResultBody').textContent='LOT 연결정보를 조회하고 있습니다.';$('#lotSummary').replaceChildren();
 try{const paths=[['/api/trace?keyword='+encodeURIComponent(q),'작업실적'],['/api/qmes/work-orders','작업지시'],['/api/iqc','수입검사'],['/api/pqc','공정검사'],['/api/oqc','출하검사'],['/api/qmes-sync/pqc','공정검사 공용기록'],['/api/qmes-sync/oqc','출하검사 공용기록'],['/api/qmes-sync/inventory','출하실적']];const sources=await Promise.all(paths.map(([url,label])=>read(url,label,signal)));if(request!==serial||mode!==requested||norm($('#lotQueryInput').value)!==q)return;last=graphData(sources,q,requested);render(last);}catch(error){if(request!==serial)return;status('조회 실패','다시 조회해주세요.');$('#lotResultMeta').textContent='조회 실패';$('#lotResultBody').textContent=signal.aborted?'조회 시간이 초과되었습니다. 다시 조회해주세요.':'LOT 정보를 불러오지 못했습니다.';}finally{clearTimeout(timer);}}
// Own only LOT controls before the legacy document-level intermediate handler.
window.addEventListener('click',event=>{const button=event.target.closest?.('#lotTrace button');if(!button)return;const modes={lotRawMode:'raw',lotIntermediateMode:'intermediate',lotFinishedMode:'finished'};if(!modes[button.id]&&!['lotSearchBtn','lotResetBtn'].includes(button.id))return;event.preventDefault();event.stopImmediatePropagation();if(modes[button.id])reset(modes[button.id]);else if(button.id==='lotResetBtn')reset();else search();},true);
window.addEventListener('keydown',event=>{if(event.key==='Enter'&&event.target.id==='lotQueryInput'){event.preventDefault();event.stopImmediatePropagation();search();}},true);
$('#lotRange').addEventListener('change',()=>{if(last)render(last);});$('#lotQueryInput').addEventListener('input',()=>{invalidate();status('재조회 필요','LOT 번호가 변경되었습니다.');});
const style=document.createElement('style');style.textContent='#lotTrace .lot-detail-grid{grid-template-columns:minmax(0,1fr)!important}#lotTrace .lot-detail-box{min-width:0}#lotTrace .lot-trace-warning{margin:14px;padding:12px;background:#fff7e8;color:#8a5511;border-radius:6px}#lotTrace .lot-trace-note{padding:12px;color:#63758a;font-size:12px}';document.head.append(style);
reset();
})();
