/* QMES work order enhanced inquiry, additive and read-only; existing create/edit/delete/API unchanged. */
(function(){
'use strict';
if(window.__namoWorkInquiry20261013)return;
window.__namoWorkInquiry20261013=true;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Resolve the saved work-order material row at scan time, even before IQC is linked.
const workMaterialLinks=new Map();
async function prepareWorkIqcQr(records){
 for(const record of records||[]){
  const response=await fetch('/api/qmes/work-material-links',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({workId:record.id}),signal:AbortSignal.timeout(15000)});
  const result=await response.json();
  if(!response.ok||!result.success||!Array.isArray(result.data))throw Error(result.message||'원료 QR 연결을 발행하지 못했습니다.');
  for(const link of result.data)workMaterialLinks.set(String(record.id)+'|'+link.line,link);
 }
}
window.qmesPrepareWorkMaterialQr=prepareWorkIqcQr;
function printLotQRCode(lot,name,work,line){
 if(!String(lot??'').trim()||!String(name??'').trim())return '<span class="iqc-qr-unlinked">원료명·LOT 확인 필요</span>';
 const linked=workMaterialLinks.get(String(work)+'|'+line);
 if(!linked||linked.lot!==String(lot).trim()||linked.name!==String(name).trim())throw Error('저장된 원료 정보와 인쇄 정보가 다릅니다. 작업지시서를 다시 열어 주세요.');
 const url=new URL('/qmes-material-scan.html',location.origin);
 url.searchParams.set('s',linked.token);
 url.searchParams.set('w',String(work??'').trim());
 url.searchParams.set('i',String(line));
 // Preserve the printed identity so a later row edit cannot silently retarget an old QR.
 url.searchParams.set('lot',String(lot).trim());
 url.searchParams.set('material',String(name).trim());
 if(typeof window.QRCode!=='function')throw Error('QR 모듈을 불러오지 못했습니다.');
 const mount=document.createElement('div');
 new window.QRCode(mount,{text:url.href,width:192,height:192,correctLevel:window.QRCode.CorrectLevel?.M});
 const image=mount.querySelector('canvas')?.toDataURL('image/png')||mount.querySelector('img')?.src;
 if(!image||!image.startsWith('data:image/'))throw Error('원료·반제품 QR 생성 실패');
 return '<img src="'+image+'" alt="작업지시 원료·반제품 재고 조회 QR코드" width="192" height="192">';
}
window.namoPrintWorkOrder=printWorkOrderDocument;
function printWorkOrderDocument(record,reservedWindow,renderOnly=false){
 if(!record||!record.id){window.alert('저장된 작업지시서를 선택해 주세요.');return false;}
 const f=record.fields||{},materials=Array.isArray(record.materials)?record.materials:[];
 const safe=v=>esc(v===undefined||v===null||String(v).trim()===''?'-':v);
 const num=v=>{const t=String(v??'').trim().replace(/,/g,'');const n=Number(t);return t&&Number.isFinite(n)?n:0};
 const qty=n=>n.toLocaleString('ko-KR',{maximumFractionDigits:3});
 const planned=materials.reduce((total,m)=>total+num(m.plan),0);
 const used=materials.reduce((total,m)=>total+num(m.actual),0);
 const timestamp=new Date().toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false});
 const companyLogo="data:image/png;base64,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";
 const pageCount=1+Math.ceil(materials.length/6);
 const printHeader='<div class="print-page-meta"><span>'+safe(timestamp)+'</span><span>작업지시서 '+safe(f['작업지시번호']||record.id)+'</span></div>';
 const meta=[
  ['작업지시번호',record.fields?.['작업지시번호']||record.id,'작업일자',record.workDate],
  ['고객사',f['고객사'],'제품명',f['제품명']],
  ['생산 LOT NO',f['생산 LOT NO'],'설비명',f['설비명']],
  ['계획수량 (kg)',f['계획수량'],'작업자',f['작업자']],
  ['작업기간',f['작업기간'],'생산구분',record.productionType],
  ['진행상태',f['진행상태'],'중간배치 종류',record.intermediateBatch?.kind]
 ];
 const rows=materials.map((m,i)=>{
  const name=m.name==='중간배치'&&m.batchType?String(m.name)+' ('+String(m.batchType)+')':m.name;
  const ratio=planned>0?qty(num(m.plan)/planned*100)+'%':'-';
  return '<tr><td>'+safe(i+1)+'</td><td>'+safe(name)+'</td><td>'+safe(m.lot)+'</td><td>'+safe(m.plan)+'</td><td>'+safe(m.actual)+'</td><td>'+ratio+'</td></tr>';
 }).join('');
 const qrPages=Array.from({length:Math.ceil(materials.length/6)},(_,page)=>{
  const cards=materials.slice(page*6,page*6+6).map((m,offset)=>{
   const i=page*6+offset,name=m.name==='중간배치'&&m.batchType?m.name+' ('+m.batchType+')':m.name;
   const itemCode=window.qmesItemCodes?.codeFor(m)||'-';
   const qr=printLotQRCode(m.lot,m.name,record.id,i);
   return '<div class="qr-card"><h3>'+safe(i+1)+'. '+safe(name)+'</h3><div class="qr-card-content"><div class="qr-card-code">'+qr+'</div><dl><dt>원료명</dt><dd>'+safe(name)+'</dd><dt>품목코드</dt><dd>'+safe(itemCode)+'</dd><dt>LOT NO</dt><dd>'+safe(m.lot)+'</dd><dt>계획량</dt><dd>'+safe(m.plan)+' kg</dd><dt>실투입량</dt><dd>'+safe(m.actual)+' kg</dd></dl></div></div>';
  }).join('');
  return '<main class="paper qr-paper">'+printHeader+'<div class="brand"><img class="print-company-logo" src="'+companyLogo+'" alt="나모케미칼(주)"><small>(주)나모케미칼<br>원료 QR 확인표</small></div><h1>작업지시서 원료 QR<small>MATERIAL QR CHECK SHEET</small></h1><div class="qr-reference"><div><b>작업지시번호</b><span>'+safe(f['작업지시번호']||record.id)+'</span></div><div><b>제품명</b><span>'+safe(f['제품명'])+'</span></div><div><b>생산 LOT</b><span>'+safe(f['생산 LOT NO'])+'</span></div></div><p class="qr-guide">원료별 QR을 스캔하여 LOT와 현재 재고 정보를 확인하세요.</p><div class="qr-grid">'+cards+'</div><div class="footer"><span class="print-page-number">'+(page+2)+' / '+pageCount+'</span></div></main>';
 }).join('');
 const steps=[
  ['01','A탱크 원료 투입','NMP / 분산제 / 세라믹 투입'],
  ['02','High Shear','A탱크 선분산 진행'],
  ['03','A탱크 추가 투입','바인더 / SBR 추가 후 Mixing'],
  ['04','교차 순환','A↔B 탱크 교차 순환 Mixing']
 ];
 const html=`<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>작업지시서 ${safe(record.fields?.['작업지시번호']||record.id)}</title>
<style>
@page{size:A4 portrait;margin:0}
.work-print-document{break-after:page;page-break-after:always}.work-print-document:last-of-type{break-after:auto;page-break-after:auto}
.qr-paper{break-before:page;page-break-before:always}
.qr-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:4mm;margin-top:4mm}
.qr-card{border:1px solid #cad6e3;min-height:60mm;padding:4mm;break-inside:avoid;page-break-inside:avoid}
.qr-card h3{font-size:11pt;margin:0 0 3mm;color:#1f4366;border-bottom:1px solid #d4e0eb;padding-bottom:2mm}
.qr-card-content{display:flex;align-items:center;gap:4mm;min-width:0}
.qr-card-code{flex:0 0 29mm;background:#fff;padding:1mm}
.qr-card-code img{display:block;width:27mm;height:27mm;image-rendering:pixelated}
.qr-card dl{display:grid;grid-template-columns:17mm minmax(0,1fr);margin:0;gap:2mm 1mm;flex:1;min-width:0;font-size:9pt;line-height:1.5}
.qr-card dt{font-weight:700;color:#31516f}.qr-card dd{margin:0;overflow-wrap:anywhere}
.qr-reference{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));padding:3mm 0;border-bottom:1px solid #cad6e3;font-size:9pt;line-height:1.8}
.qr-reference>div{display:flex;align-items:center;justify-content:center;gap:2mm;min-width:0;padding:0 2mm;text-align:center}.qr-reference>div+div{border-left:1px solid #dce5ed}.qr-reference b{flex:none}.qr-reference span{min-width:0;overflow-wrap:anywhere}.qr-guide{font-size:8.5pt;color:#667e94;margin:3mm 0}
@media screen{body{background:#edf2f7!important}.paper{width:210mm;max-width:none!important;min-height:297mm;background:#fff;padding:12mm;margin:6mm auto!important;box-shadow:0 1px 8px #203a5220}.qr-paper{margin-top:10mm!important}}

*{box-sizing:border-box}html,body{margin:0;padding:0;background:#fff;color:#1d314a;font-family:"Malgun Gothic","Noto Sans KR",Arial,sans-serif;-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-size:10pt}.paper{max-width:210mm;margin:auto;display:flex;flex-direction:column}.paper>*{flex-shrink:0}.paper>.footer{margin-top:auto}
.actions{display:flex;justify-content:flex-end;gap:7px;margin:12px 0}.actions button{padding:9px 14px;border:1px solid #bbcadb;border-radius:5px;background:white;cursor:pointer;font-weight:700}.actions button:first-child{background:#164b7a;color:#fff;border-color:#164b7a}
.brand{display:flex;justify-content:space-between;align-items:center;border-top:4px solid #174d7c;padding:12px 2px}
.print-company-logo{display:block;width:48mm;max-width:55%;height:auto;object-fit:contain;object-position:left center}.print-page-meta{display:flex;justify-content:space-between;align-items:center;gap:8mm;padding:0 0 2mm;font-size:8pt;line-height:1.4;color:#1d314a}.print-page-meta>span:last-child{text-align:right}.print-page-number{font-size:8pt;color:#1d314a}.brand small{font-size:8pt;color:#6e8398;text-align:right}
h1{font-size:20pt;letter-spacing:4px;margin:0;padding:10px 0 13px;text-align:center;border-block:1px solid #c9d7e5;color:#1b3c5d}
h1 small{display:block;letter-spacing:2px;font-size:8pt;color:#7b8c9b;font-weight:500;margin-top:4px}
h2{font-size:10pt;color:#1f4366;background:#eaf1f8;border:1px solid #c9d7e5;border-bottom:0;margin:15px 0 0;padding:8px 10px}
table{border-collapse:collapse;table-layout:fixed;width:100%}th,td{border:1px solid #cad6e3;font-size:9pt;padding:7px 6px;overflow-wrap:anywhere;vertical-align:middle}
.meta th{background:#f3f7fb;width:17%;color:#31516f;text-align:center}.meta td{width:33%}
.material th{background:#edf3f9;color:#31516f;text-align:center;font-size:8.5pt}.material td{text-align:center}
.material th:nth-child(1){width:6%}.material th:nth-child(2){width:28%}.material th:nth-child(3){width:20%}.material th:nth-child(4){width:16%}.material th:nth-child(5){width:16%}.material th:nth-child(6){width:14%}
.material tfoot td{background:#f4f8fb;font-weight:800}
.iqc-qr-unlinked{display:block;font-size:8pt;color:#a34a22;white-space:normal;line-height:1.5}
h2.process-steps-title{border-bottom:1px solid #c9d7e5;margin-bottom:3mm}
.steps{display:grid;grid-template-columns:1fr 1fr;gap:7px}
.step{border:1px solid #d4e0eb;display:flex;gap:8px;align-items:center;min-height:49px;padding:8px}
.step b{font-size:8pt;color:#1a659b}.step strong{display:block;font-size:9pt}.step small{display:block;font-size:8pt;color:#667e94;margin-top:3px}
.note{min-height:56px;border:1px solid #cad6e3;padding:10px;line-height:1.55;white-space:pre-wrap;overflow-wrap:anywhere}
.footer{display:flex;justify-content:center;border-top:1px solid #ccd9e6;margin-top:15px;padding-top:8px;font-size:8pt;color:#688096}
tr{break-inside:avoid}thead{display:table-header-group}
@media print{.actions{display:none!important}.paper{width:210mm;max-width:none;min-height:297mm;padding:12mm;zoom:1}.paper>.footer{margin-top:auto}h2{break-after:avoid;margin-top:12px;padding:7px 9px}.brand{padding:9px 2px}h1{padding:10px 0 12px}table th,table td{padding:6px 5px;font-size:8.5pt}.material th{font-size:8pt}.step{min-height:42px;padding:7px}.note{min-height:46px;padding:9px}.footer{margin-top:12px;padding-top:7px}}
</style></head><body><article class="work-print-document"><main class="paper">
<div class="actions"><button type="button" onclick="window.print()">인쇄하기</button><button type="button" onclick="window.close()">닫기</button></div>
${printHeader}<div class="brand"><img class="print-company-logo" src="${companyLogo}" alt="나모케미칼(주)"><small>(주)나모케미칼<br>QMES · PRODUCTION MANAGEMENT</small></div>
<h1>작업지시서<small>WORK ORDER</small></h1>
<h2>01. 작업 기본정보</h2>
<table class="meta"><tbody>${meta.map(x=>'<tr><th>'+safe(x[0])+'</th><td>'+safe(x[1])+'</td><th>'+safe(x[2])+'</th><td>'+safe(x[3])+'</td></tr>').join('')}</tbody></table>
<h2>02. 원료 투입계획</h2>
<table class="material"><thead><tr><th>NO</th><th>원료명</th><th>원료 LOT NO</th><th>계획투입량(kg)</th><th>실투입량(kg)</th><th>투입비율</th></tr></thead>
<tbody>${rows||'<tr><td colspan="6">등록된 원료가 없습니다.</td></tr>'}</tbody>
<tfoot><tr><td colspan="3">합계</td><td>${qty(planned)}</td><td>${qty(used)}</td><td>${planned>0?'100%':'-'}</td></tr></tfoot></table>
<h2 class="process-steps-title">03. 기본 공정순서</h2>
<div class="steps">${steps.map(x=>'<div class="step"><b>STEP '+safe(x[0])+'</b><div><strong>'+safe(x[1])+'</strong><small>'+safe(x[2])+'</small></div></div>').join('')}</div>
<h2>04. 비고</h2><div class="note">${safe(record.note)}</div>
<div class="footer"><span class="print-page-number">1 / ${pageCount}</span></div>
</main>${qrPages}</article><script>window.addEventListener('load',function(){window.focus()});</script></body></html>`;
 if(renderOnly)return html;
 // Direct native print preview. No intermediate about:blank popup window.
 try{
  document.getElementById('qmes-single-work-print-frame')?.remove();
  const frame=document.createElement('iframe');
  frame.id='qmes-single-work-print-frame';
  frame.title='작업지시서 인쇄';
  frame.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
  let printed=false;
  let expiry=null;
  const cleanup=()=>{if(expiry)clearTimeout(expiry);frame.remove();};
  frame.addEventListener('load',()=>{
   if(printed||!frame.contentDocument?.querySelector('.paper'))return;
   printed=true;
   const target=frame.contentWindow;
   target.addEventListener('afterprint',()=>setTimeout(cleanup,500),{once:true});
   Promise.all([frame.contentDocument.fonts?.ready,...Array.from(frame.contentDocument.images,image=>image.decode().catch(()=>{}))]).then(()=>{
    setTimeout(()=>{
     try{target.focus();target.print();}
     catch(error){console.error('[QMES work print]',error);cleanup();window.alert('인쇄 화면을 열지 못했습니다.');}
    },200);
   });
  });
  document.body.appendChild(frame);
  frame.srcdoc=html;
  expiry=setTimeout(cleanup,120000);
  return true;
 }catch(error){console.error('[QMES work print]',error);window.alert('인쇄 화면을 열지 못했습니다.');return false;}
}
const labels=['고객사','제품명','생산 LOT','진행상태','시작일자','종료일자','작업지시번호','설비명'];
const indices=[2,4,5,10,9,9,3,6];
function init(){
 const section=document.getElementById('work');
 if(!section)return;
 const shell=section.querySelector('.module-shell'),tbody=shell?.querySelector('.work-list-table tbody');
 if(!shell||!tbody||section.querySelector('#namo-work-inquiry'))return;
 let head=shell.querySelector('.nwi-header');
 if(!head){
   head=document.createElement('div');head.className='nwi-header';
   head.innerHTML='<div class="nwi-title"><strong>작업지시서 등록 및 조회</strong></div>';
   const existingToolbar=shell.querySelector('.module-toolbar');
   existingToolbar?.querySelector('.filters')?.remove();
   if(existingToolbar)head.appendChild(existingToolbar);
   shell.prepend(head);
 }
 section.querySelector('.page-head')?.remove();
 const panel=document.createElement('div');panel.id='namo-work-inquiry';
 panel.innerHTML='<div class="nwi-grid">'+labels.map((l,i)=>'<label><span>'+esc(l)+'</span>'+([1,2,3,6].includes(i)?'<select data-filter="'+i+'" aria-label="'+esc(l)+' 선택"><option value="">전체</option>'+(i===3?'<option>대기</option><option>진행</option><option>완료</option>':'')+'</select>':'<input data-filter="'+i+'" type="'+(i===4||i===5?'date':'text')+'" placeholder="전체">')+'</label>').join('')+'</div><div class="nwi-actions"><span class="nwi-count" aria-live="polite"></span><button type="button" class="btn" id="nwi-clear">조건 지우기</button><button type="button" class="btn primary" id="nwi-search">조회</button></div>';
 head.insertAdjacentElement('afterend',panel);
 // Date-range UI only: keep original start/end filters and their search behavior.
 (function installInstructionPeriod(){
  const start=panel.querySelector('[data-filter="4"]'),end=panel.querySelector('[data-filter="5"]');
  if(!start||!end)return;
  const startLabel=start.closest('label'),endLabel=end.closest('label');
  const rangeLabel=document.createElement('label');
  rangeLabel.className='nwi-period-label';
  rangeLabel.innerHTML='<span>작업기간</span><button type="button" class="nwi-period-trigger" aria-label="작업기간 달력 열기" aria-expanded="false"><span class="nwi-period-value">기간 선택</span><span class="nwi-period-icon">▦</span></button>';
  startLabel.before(rangeLabel);startLabel.hidden=true;endLabel.hidden=true;
  const pop=document.createElement('div');pop.className='nwi-period-popup';pop.hidden=true;
  pop.innerHTML='<div class="nwi-period-presets" role="group" aria-label="작업기간 빠른 선택">'+['올해','오늘까지','오늘','전일','주간','전주','당월','이전달'].map(name=>'<button type="button" class="nwi-period-preset">'+name+'</button>').join('')+'</div><div class="nwi-period-months"></div><div class="nwi-period-footer"><span class="nwi-period-summary">기간을 선택하세요</span><div><button type="button" class="btn nwi-period-cancel">취소</button><button type="button" class="btn primary nwi-period-ok">확인</button></div></div>';
  rangeLabel.after(pop);
  const fmt=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
  const parse=v=>v?new Date(v+'T12:00:00'):null;
  const today=new Date(),firstOfMonth=new Date(today.getFullYear(),today.getMonth(),1),todayLocal=new Date(today.getFullYear(),today.getMonth(),today.getDate());let base=new Date(firstOfMonth),a=new Date(firstOfMonth),b=new Date(todayLocal);
  const trigger=rangeLabel.querySelector('.nwi-period-trigger'),value=rangeLabel.querySelector('.nwi-period-value');
  value.textContent=fmt(a)+' ~ '+fmt(b);
  function redraw(){
   const months=pop.querySelector('.nwi-period-months');months.innerHTML='';
   for(let k=0;k<2;k++){
    const d=new Date(base.getFullYear(),base.getMonth()+k,1),y=d.getFullYear(),m=d.getMonth();
    const block=document.createElement('div');block.className='nwi-period-month';
    const top=document.createElement('div');top.className='nwi-period-month-head';
    const prev=document.createElement('button');prev.type='button';prev.textContent='‹';prev.setAttribute('aria-label','이전 달');prev.onclick=()=>{base=new Date(base.getFullYear(),base.getMonth()-1,1);redraw()};
    const next=document.createElement('button');next.type='button';next.textContent='›';next.setAttribute('aria-label','다음 달');next.onclick=()=>{base=new Date(base.getFullYear(),base.getMonth()+1,1);redraw()};
    const title=document.createElement('strong');title.textContent=y+'.'+String(m+1).padStart(2,'0');top.append(prev,title,next);block.appendChild(top);
    const grid=document.createElement('div');grid.className='nwi-period-days';
    ['일','월','화','수','목','금','토'].forEach(w=>{const x=document.createElement('b');x.textContent=w;grid.appendChild(x)});
    const first=new Date(y,m,1).getDay(),days=new Date(y,m+1,0).getDate();
    for(let i=0;i<first;i++)grid.appendChild(document.createElement('i'));
    for(let n=1;n<=days;n++){
     const date=new Date(y,m,n),key=fmt(date),btn=document.createElement('button');btn.type='button';btn.textContent=n;
     if((a&&key===fmt(a))||(b&&key===fmt(b)))btn.classList.add('selected');
     else if(a&&b&&date>a&&date<b)btn.classList.add('between');
     btn.onclick=()=>{if(!a||b){a=date;b=null}else if(date<a){b=a;a=date}else{b=date}redraw()};
     grid.appendChild(btn);
    }
    block.appendChild(grid);months.appendChild(block);
   }
   pop.querySelector('.nwi-period-summary').textContent=a?(fmt(a)+(b?' ~ '+fmt(b):' ~ 종료일 선택')):'시작일과 종료일을 선택하세요';
  }
  function weekMonday(d){const x=new Date(d.getFullYear(),d.getMonth(),d.getDate());x.setDate(x.getDate()-((x.getDay()+6)%7));return x}
  function preset(name){
   const y=today.getFullYear(),m=today.getMonth(),day=today.getDate();
   if(name==='올해'){a=new Date(y,0,1);b=new Date(y,11,31)}
   else if(name==='오늘까지'){a=new Date(y,0,1);b=new Date(todayLocal)}
   else if(name==='오늘'){a=new Date(todayLocal);b=new Date(todayLocal)}
   else if(name==='전일'){a=new Date(y,m,day-1);b=new Date(a)}
   else if(name==='주간'){a=weekMonday(today);b=new Date(a);b.setDate(b.getDate()+6)}
   else if(name==='전주'){b=weekMonday(today);b.setDate(b.getDate()-1);a=new Date(b);a.setDate(a.getDate()-6)}
   else if(name==='당월'){a=new Date(y,m,1);b=new Date(y,m+1,0)}
   else if(name==='이전달'){a=new Date(y,m-1,1);b=new Date(y,m,0)}
   else return;
   base=new Date(a.getFullYear(),a.getMonth(),1);redraw();
  }
  pop.querySelectorAll('.nwi-period-preset').forEach(btn=>btn.addEventListener('click',()=>preset(btn.textContent.trim())));
  function close(){pop.hidden=true;trigger.setAttribute('aria-expanded','false')}
  trigger.onclick=()=>{if(!pop.hidden){close();return}a=parse(start.value);b=parse(end.value);if(!a&&!b&&value.textContent!=='기간 선택'){a=new Date(firstOfMonth);b=new Date(todayLocal)}if(a)base=new Date(a.getFullYear(),a.getMonth(),1);redraw();pop.hidden=false;trigger.setAttribute('aria-expanded','true')};
  pop.querySelector('.nwi-period-cancel').onclick=close;
  pop.querySelector('.nwi-period-ok').onclick=()=>{if(!a||!b)return;start.value=fmt(a);end.value=fmt(b);value.textContent=fmt(a)+' ~ '+fmt(b);close();filter()};
  document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!rangeLabel.contains(e.target))close()});
  // Search must not silently change the date filters after the results are rendered.
  // Dates are applied only when the user confirms a range in the period picker.
  panel.querySelector('#nwi-clear').addEventListener('click',()=>{value.textContent='기간 선택';a=null;b=null;close()});
 })();

 const listHead=document.createElement('div');listHead.className='nwi-list-head';
 listHead.innerHTML='<span>▸ 작업지시 현황</span><span id="nwi-list-total">총 0건</span>';
 const tableWrap=shell.querySelector('.module-body');if(tableWrap)shell.insertBefore(listHead,tableWrap);
 const detail=document.createElement('div');detail.id='namo-work-detail';detail.style.scrollMarginTop='96px';
 detail.innerHTML='<div class="nwd-head">작업지시 상세내역</div><div class="nwd-content">상단 작업지시 목록에서 항목을 선택하세요.</div>';
 shell.insertAdjacentElement('afterend',detail);
 // Hide only the equipment-name search control; retain its internal empty filter for index compatibility.
 const equipmentSearch=panel.querySelector('[data-filter="7"]');if(equipmentSearch){equipmentSearch.value='';equipmentSearch.closest('label').hidden=true;equipmentSearch.closest('label').style.display='none';}
 const controls=[...panel.querySelectorAll('[data-filter]')];let activeId='',activeTab='materials',activeRecord=null;
 const getRows=()=>[...tbody.children].filter(tr=>tr.tagName==='TR'&&tr.cells.length>1);
 // Respect the native hidden state even when another stylesheet sets table-row display.
 if(!document.getElementById('nwi-hidden-row-style')){
  const style=document.createElement('style');style.id='nwi-hidden-row-style';
  style.textContent='#work .work-list-table tbody tr[hidden]{display:none!important}';
  style.textContent+="#work .work-list-table tbody td:last-child{text-align:center!important;vertical-align:middle!important;padding:4px!important}#work .work-list-table .work-row-actions{display:flex!important;align-items:center!important;justify-content:center!important;gap:5px!important;width:100%!important;margin:0!important}#work .work-list-table .work-row-actions>.btn{display:inline-flex!important;align-items:center!important;justify-content:center!important;height:24px!important;min-height:24px!important;min-width:0!important;padding:0 8px!important;margin:0!important;font-size:10px!important;line-height:1!important}#work .work-list-table tbody td:nth-child(8){white-space:normal!important;overflow-wrap:anywhere;line-height:1.3!important}";
  style.textContent+='\n#work .module-shell>.module-body{scrollbar-width:none!important}#work .module-shell>.module-body::-webkit-scrollbar{height:0!important}#work .work-list-table tbody tr[data-nwi-visible="true"]:not(:has(~ tr[data-nwi-visible="true"]))>td{border-bottom:0!important}\n';
  style.textContent+='\n#work .work-list-table tbody tr[data-work-saved] td:nth-child(3){color:#0874d1!important;text-decoration:underline!important;text-underline-offset:2px!important;font-weight:600!important;cursor:pointer!important}\n';
  style.textContent+='\n#work .work-list-table tbody tr[data-work-saved] td:nth-child(2),#work .work-list-table tbody tr[data-work-saved] td:nth-child(2) *{color:#222!important;text-decoration:none!important;cursor:default!important;font-weight:400!important}\n';
  style.textContent+='\n#work .work-list-table th.wo-select-col,#work .work-list-table td.wo-select-col{width:34px!important;min-width:34px!important;max-width:34px!important;padding:0!important;text-align:center!important;vertical-align:middle!important}\n#work .work-list-table thead th:nth-child(2),#work .work-list-table tbody td:nth-child(2){width:52px!important;min-width:44px!important;max-width:52px!important;padding:4px!important;text-align:center!important}\n#work .work-list-table .wo-bulk-all,#work .work-list-table .wo-bulk-check{position:static!important;transform:none!important;display:inline-block!important;margin:0!important;vertical-align:middle!important;width:14px!important;height:14px!important}\n';document.head.appendChild(style);
 }
 function ensureRowPrintButtons(){
  getRows().forEach(tr=>{
   const actions=tr.cells[tr.cells.length-1];
   if(!actions||actions.querySelector('.work-order-print-btn'))return;
   let group=actions.querySelector('.work-row-actions');
   if(!group){
    group=document.createElement('span');
    group.className='work-row-actions';
    while(actions.firstChild)group.appendChild(actions.firstChild);
    actions.appendChild(group);
   }
   const print=document.createElement('button');
   print.type='button';
   print.className='btn work-order-print-btn';
   print.textContent='인쇄';
   print.title='해당 작업지시서 인쇄';
   print.addEventListener('click',async e=>{
    e.preventDefault();e.stopPropagation();
    const id=String(tr.dataset.workSaved||'');
    const record=typeof readWorkOrders==='function'
      ?readWorkOrders().find(x=>String(x?.id||'')===id):null;
    if(!record){window.alert('저장된 작업지시서를 찾을 수 없습니다. 다시 조회해 주세요.');return;}
    if(print.disabled)return;
    print.disabled=true;
    try{await prepareWorkIqcQr([record]);printWorkOrderDocument(record);}
    catch(error){console.error('[Work order IQC QR]',error);window.alert(error.message||'QR 연결 실패');}
    finally{print.disabled=false;}
   });
   group.prepend(print);
  });
 }
 let workPage=1,lastWorkQuery='',hasSearched=true;
 try{workPage=Math.max(1,Number(sessionStorage.getItem('namo-work-list-page'))||1);}catch(_){}
 const pager=document.createElement('div');pager.className='nwi-pagination';pager.setAttribute('aria-label','작업지시서 페이지');pager.style.cssText='display:flex;justify-content:center;gap:6px;padding:12px';tableWrap.insertAdjacentElement('afterend',pager);
 function syncFilterChoices(){
  const rows=getRows();
  [0,1,2,3,6].forEach(index=>{
   const select=panel.querySelector('[data-filter="'+index+'"]');if(!select||select.tagName!=='SELECT')return;
   const values=new Set(index===3?['대기','진행','완료']:[]);
   rows.forEach(row=>{const value=row.cells[indices[index]]?.textContent.trim();if(value&&value!=='-')values.add(value);});
   const current=select.value;if(current)values.add(current);
   const items=[...values].sort((a,b)=>a.localeCompare(b,'ko',{numeric:true}));
   const signature=JSON.stringify(items);if(select.dataset.nwiChoices===signature)return;
   select.dataset.nwiChoices=signature;
   select.replaceChildren(new Option('전체',''),...items.map(value=>new Option(value,value)));select.value=current;
  });
 }
 function filter(){
  syncFilterChoices();
  ensureRowPrintButtons();
  const q=controls.map(x=>x.value.trim().toLowerCase());
  const range=panel.querySelector('.nwi-period-value')?.textContent||'';
  const found=range.match(/(\\d{4}-\\d{2}-\\d{2})\\s*~\\s*(\\d{4}-\\d{2}-\\d{2})/);
  if(found&&(controls[4].value||controls[5].value)){
   if(!q[4])q[4]=found[1];
   if(!q[5])q[5]=found[2];
  }
  const queryKey=JSON.stringify(q);
  if(lastWorkQuery&&lastWorkQuery!==queryKey)workPage=1;
  lastWorkQuery=queryKey;
  const rows=getRows();
  const hasActiveFilters=q.some(v=>v!=='');
  const matching=!hasSearched?[]:!hasActiveFilters?rows:rows.filter(tr=>{
   const vals=[...tr.cells].map(td=>td.textContent.trim().toLowerCase());
   return q.every((v,i)=>!v||(i===0?v.split(/[,，]/).map(name=>name.trim()).filter(Boolean).some(name=>(vals[indices[0]]||'')===name):i===4?((vals[9]||'').split('~')[0].trim()>=v):i===5?((vals[9]||'').split('~').pop().trim()<=v):(vals[indices[i]]||'').includes(v)));
  });
  // Count the rows actually present, without changing how records are loaded.
  // Some legacy work-order rows do not carry data-work-saved/data-row.
  const availableRows=getRows();
  const effectiveMatching=matching;
  const count=effectiveMatching.length,pages=Math.max(1,Math.ceil(count/10));
  workPage=Math.min(Math.max(1,workPage),pages);
  const visible=new Set(effectiveMatching.slice((workPage-1)*10,workPage*10));
  // Apply the final page decision once per row, including unmatched records.
  tbody.dataset.nwiPaged=hasSearched?'true':'false';
  tbody.dataset.nwiPage=String(workPage);
  availableRows.forEach(tr=>{
   const show=visible.has(tr);
   tr.dataset.nwiVisible=show?'true':'false';
   tr.hidden=!show;
   tr.style.display=show?'table-row':'none';
  });
  pager.replaceChildren();
  if(!hasSearched){
   panel.querySelector('.nwi-count').textContent='';
   const total=section.querySelector('#nwi-list-total');if(total)total.textContent='';
   return;
  }
  for(const [page,label]of [[workPage-1,'‹'],...Array.from({length:pages},(_,i)=>[i+1,String(i+1)]),[workPage+1,'›']]){
   const button=document.createElement('button');
   button.type='button';button.textContent=label;
   button.className='btn'+(page===workPage?' active':'');
   button.disabled=page<1||page>pages;
   button.setAttribute('aria-label',label==='‹'?'이전 페이지':label==='›'?'다음 페이지':page+'페이지');
   if(page===workPage)button.style.cssText='background:#2f7de1;color:#fff';
   button.onclick=()=>{workPage=page;filter();};
   pager.appendChild(button);
  }
  panel.querySelector('.nwi-count').textContent='조회 '+count+'건';
  const total=section.querySelector('#nwi-list-total');if(total)total.textContent='총 '+count+'건';
 }
 panel.querySelector('#nwi-search').addEventListener('click',()=>{
  // Hide the table while its current-page rows are being reconciled, avoiding a 23-row flash.
  tbody.classList.add('nwi-reconciling');
  hasSearched=true;workPage=1;filter();
  // The initial search can race with the existing asynchronous work-order render.
  // Reconcile only this mounted table; never reload or rewrite saved records.
  requestAnimationFrame(()=>{if(tbody.isConnected)filter();});
  setTimeout(()=>{if(tbody.isConnected && hasSearched)filter();},120);
  setTimeout(()=>{if(tbody.isConnected && hasSearched)filter();},450);
  requestAnimationFrame(()=>{requestAnimationFrame(()=>{tbody.classList.remove('nwi-reconciling');});});
 });
 panel.querySelector('#nwi-clear').addEventListener('click',()=>{controls.forEach(x=>x.value='');hasSearched=false;workPage=1;filter()});
 controls.forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();hasSearched=true;workPage=1;filter()}}));
 controls.filter(x=>x.tagName==='SELECT').forEach(select=>select.addEventListener('change',()=>{hasSearched=true;workPage=1;filter();}));
 function draw(row,order){
  const cells=[...row.cells].map(c=>c.textContent.trim()),fields=order?.fields||{};
  const value=(name,index)=>fields[name]??cells[index]??'-';
  const vals=[['작업지시번호',fields['작업지시번호']||order?.id||cells[3]||'-'],['고객사',value('고객사',2)],['제품명',value('제품명',4)],['생산 LOT',value('생산 LOT NO',5)],['설비명',value('설비명',6)],['작업자',value('작업자',7)],['계획수량',value('계획수량',8)],['작업기간',value('작업기간',9)],['진행상태',value('진행상태',10)],['작업일자',order?.workDate||'-'],['생산구분',order?.productionType||'-'],['비고',order?.note||'-']];
  const materials=Array.isArray(order?.materials)?order.materials:[];
  const tabs=[['materials','원재료 투입내역'],['progress','생산진행 현황'],['trace','LOT 추적정보']];
  const materialStyle=name=>{
   const [fill, , ink]=window.namoWorkMaterialColors(name);
   return 'background-color:'+fill+'!important;color:'+ink+'!important';
  };
  function materialTotal(field){
   const values=materials.map(material=>String(material[field]??'').trim().replace(/,/g,''))
    .filter(Boolean).map(Number).filter(Number.isFinite);
   if(!values.length)return '—';
   return values.reduce((total,value)=>total+value,0)
    .toLocaleString('ko-KR',{minimumFractionDigits:2,maximumFractionDigits:2})+' kg';
  }
  const totals=materials.length
   ? '<tfoot style="background:#f3f7fb;font-weight:700"><tr><td colspan="3">합계</td><td>'+materialTotal('plan')+'</td><td>'+materialTotal('actual')+'</td><td></td></tr></tfoot>'
   : '';
  const mats=order?'<div style="overflow-x:auto"><table class="nwd-material-table" style="table-layout:fixed;width:100%"><colgroup><col style="width:4%"><col style="width:19.2%"><col style="width:19.2%"><col style="width:19.2%"><col style="width:19.2%"><col style="width:19.2%"></colgroup><thead><tr><th>NO</th><th>원료명</th><th>원료 LOT NO</th><th>계획투입량 (kg)</th><th>실투입량 (kg)</th><th>비고</th></tr></thead><tbody>'+(materials.length?materials.map((m,i)=>'<tr><td>'+(i+1)+'</td><td style="'+materialStyle(m.name)+'">'+esc(m.name)+'</td><td>'+esc(m.lot)+'</td><td>'+esc(m.plan)+'</td><td>'+esc(m.actual)+'</td><td style="white-space:normal;overflow-wrap:anywhere">'+esc(m.remark||'—')+'</td></tr>').join(''):'<tr><td colspan="6">등록된 원료가 없습니다.</td></tr>')+'</tbody>'+totals+'</table></div>':'<p>원료 정보 조회 중입니다.</p>';
  const content=activeTab==='materials'?mats:activeTab==='progress'?'<p>진행상태: '+esc(value('진행상태',10))+' · 세부 실적은 생산진행 현황에서 확인하세요.</p>':'<p>생산 LOT: '+esc(value('생산 LOT NO',5))+' · 검사/출하 연결정보는 LOT 추적관리에서 확인하세요.</p>';
  detail.querySelector('.nwd-head').textContent='작업지시 상세내역  '+(fields['작업지시번호']||order?.id||cells[3]);
  detail.querySelector('.nwd-content').innerHTML=(order?'<div style="display:flex;gap:8px;margin-bottom:12px"><a class="btn" href="/qmes-material-check.html?work='+encodeURIComponent(order.id)+'" target="_blank" rel="noopener">원료 투입 순서 확인</a><a class="btn" href="/qmes-material-check.html?demo=1" target="_blank" rel="noopener">스캔 알림 시험</a></div>':'')+'<div class="nwd-grid">'+vals.map(v=>'<div class="nwd-cell"><b>'+esc(v[0])+'</b><span>'+esc(v[1])+'</span></div>').join('')+'</div><div class="nwd-tabs">'+tabs.map(([key,title])=>'<button type="button" data-nwd-tab="'+key+'" class="nwd-tab '+(activeTab===key?'active':'')+'">'+title+'</button>').join('')+'</div>'+content;
 }
 async function openWorkDetail(row){
  if(!row?.dataset.workSaved)return;
  window.qmesMenuHistory?.capture();
  activeId=String(row.dataset.workSaved);activeTab='materials';
  const cached=typeof window.qmesGetWorkOrders==='function'?window.qmesGetWorkOrders():[];
  activeRecord=cached.find(x=>String(x.id)===activeId)||null;
  getRows().forEach(r=>r.classList.toggle('nwi-selected',r===row));
  draw(row,activeRecord);
  const scrollTarget=activeId;
  requestAnimationFrame(()=>{
   if(!detail.isConnected||activeId!==scrollTarget)return;
   const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
   detail.scrollIntoView({behavior:reduceMotion?'instant':'smooth',block:'start',inline:'nearest'});
  });
  window.qmesMenuHistory?.recordView('work','detail:'+activeId,'work');
  const requestedId=activeId;
  try{
   await window.qmesAuthDataReady?.wait();
   const res=await fetch('/api/qmes/work-orders',{credentials:'same-origin',cache:'no-store'});
   if(!res.ok)throw new Error('조회 실패');
   const body=await res.json();if(!body.success)throw new Error('조회 실패');
   const order=(Array.isArray(body.data)?body.data:[]).find(x=>String(x.id)===requestedId);
   if(order&&row.isConnected&&activeId===requestedId){activeRecord=order;draw(row,order);}
   else if(!order&&activeId===requestedId&&!activeRecord){detail.querySelector('.nwd-content').textContent='작업지시서 원본을 찾을 수 없습니다. 목록을 새로 조회해 주세요.';}
  }catch(err){console.warn('[work inquiry] detail fetch:',err);if(activeId===requestedId&&!activeRecord)detail.querySelector('.nwd-content').textContent='상세내역을 불러오지 못했습니다. 다시 선택해 주세요.';}
 }
 window.qmesMenuHistory?.register('work',{
  page:'work',
  capture:()=>({id:activeId,tab:activeTab}),
  reset:()=>{activeId='';activeRecord=null;getRows().forEach(row=>row.classList.remove('nwi-selected'));detail.querySelector('.nwd-head').textContent='작업지시 상세내역';detail.querySelector('.nwd-content').textContent='상단 작업지시 목록에서 항목을 선택하세요.';},
  restore:snapshot=>{
   const row=getRows().find(row=>String(row.dataset.workSaved)===snapshot.id);
   if(!row)return false;
   openWorkDetail(row);activeTab=snapshot.tab;draw(row,activeRecord);return true;
  }
 });
 window.namoOpenWorkInquiryDetail=openWorkDetail;
 tbody.addEventListener('click',e=>{
  const row=e.target.closest('tr[data-work-saved]');
  if(!row||row.cells[1]?.contains(e.target)||e.target.closest('button,input,select')||(e.target.closest('a')&&!row.cells[3]?.contains(e.target)))return;
  e.stopImmediatePropagation();e.preventDefault();openWorkDetail(row);
 },true);
 detail.addEventListener('click',e=>{const tab=e.target.closest('[data-nwd-tab]');if(!tab||!activeId)return;activeTab=tab.dataset.nwdTab;const row=getRows().find(x=>x.dataset.workSaved===activeId);if(row)draw(row,activeRecord);});
 let queued=false;
 const refreshCurrentTable=()=>{
  if(!tbody.isConnected || section.querySelector('.work-list-table tbody')!==tbody){
   observer.disconnect();
   if(window.namoWorkInquiryRefresh===refreshCurrentTable)window.namoWorkInquiryRefresh=null;
   window.namoWorkInquiryInit?.();
   return;
  }
  filter();
 };
 const observer=new MutationObserver(()=>{
  if(queued)return;
  queued=true;
  requestAnimationFrame(()=>{queued=false;refreshCurrentTable();});
 });
 window.namoWorkInquiryRefresh=refreshCurrentTable;
 observer.observe(tbody,{childList:true});
 refreshCurrentTable();
}
window.namoWorkInquiryInit=init;
function boot(){init();if(document.getElementById('namo-work-inquiry'))return;const obs=new MutationObserver(()=>{if(document.querySelector('#work .work-list-table')){init();if(document.getElementById('namo-work-inquiry'))obs.disconnect()}});obs.observe(document.body,{childList:true,subtree:true});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
/* QMES work order checkbox actions, isolated from other modules. */
(function(){
'use strict';
const selected=new Set();let busy=false,queued=false;
const section=()=>document.getElementById('work');
const rows=()=>Array.from(section()?.querySelectorAll('tr[data-work-saved]')||[]);
const pageRows=()=>rows().filter(r=>!r.hidden&&r.dataset.nwiVisible!=='false'&&r.style.display!=='none');
function update(){
 const live=new Set(rows().map(r=>r.dataset.workSaved));
 for(const id of selected)if(!live.has(id))selected.delete(id);
 rows().forEach(r=>{const x=r.querySelector('.wo-bulk-check');if(x)x.checked=selected.has(r.dataset.workSaved)});
 const all=section()?.querySelector('.wo-bulk-all');if(all){const visible=pageRows(),checked=visible.filter(r=>selected.has(r.dataset.workSaved)).length;all.checked=visible.length>0&&checked===visible.length;all.indeterminate=checked>0&&checked<visible.length}
 const bar=section()?.querySelector('.wo-bulk-controls');if(bar){bar.hidden=!selected.size;bar.querySelector('.wo-bulk-print').textContent='선택 인쇄 ('+selected.size+')';bar.querySelector('.wo-bulk-delete').textContent='선택 삭제 ('+selected.size+')';bar.querySelectorAll('button').forEach(x=>x.disabled=busy);const root=section();if(typeof window.qmesIncomingSelectionDock==='function'&&(root._workDockCount!==selected.size||!bar.closest('.iqc-selection-dock'))){window.qmesIncomingSelectionDock(root,[bar],selected.size);root._workDockCount=selected.size}}
}
function scan(){
 const root=section(),table=root?.querySelector('.work-list-table');if(!table)return;
 root._resetListSelection=()=>{selected.clear();update();};
 const tools=root.querySelector('#namo-work-inquiry .nwi-actions');
 if(tools&&!root.querySelector('.wo-bulk-controls')){
  const bar=document.createElement('span');bar.className='wo-bulk-controls';bar.hidden=true;
  bar.innerHTML='<button type="button" class="btn wo-bulk-print">선택 인쇄</button><button type="button" class="btn wo-bulk-delete">선택 삭제</button>';
  const clear=tools.querySelector('#nwi-clear');if(clear)tools.insertBefore(bar,clear);else tools.appendChild(bar);bar.querySelector('.wo-bulk-print').onclick=print;bar.querySelector('.wo-bulk-delete').onclick=remove;
 }
 const th=table.querySelector('thead th.wo-select-col');if(th&&!th.querySelector('.wo-bulk-all')){
  const c=document.createElement('input');c.type='checkbox';c.className='wo-bulk-all';c.setAttribute('aria-label','현재 페이지 전체 선택');c.onclick=e=>e.stopPropagation();c.onchange=()=>{pageRows().forEach(r=>c.checked?selected.add(r.dataset.workSaved):selected.delete(r.dataset.workSaved));update()};th.prepend(c)
 }
 rows().forEach(r=>{const td=r.cells[0];if(!td||td.querySelector('.wo-bulk-check'))return;
  const c=document.createElement('input');c.type='checkbox';c.className='wo-bulk-check';c.setAttribute('aria-label','작업지시서 '+r.dataset.workSaved+' 선택');c.onclick=e=>e.stopPropagation();c.onchange=e=>{e.stopPropagation();c.checked?selected.add(r.dataset.workSaved):selected.delete(r.dataset.workSaved);update()};td.prepend(c)
 });update()
}
async function print(){
 try{
 const saved=typeof window.qmesGetWorkOrders==='function'?window.qmesGetWorkOrders():[];
 const docs=[...selected].map(id=>saved.find(r=>String(r?.id)===id)).filter(Boolean);
 if(!docs.length){alert('선택한 작업지시서 데이터를 찾지 못했습니다.');return}
 if(!await window.qmesConfirmPrint('작업지시서',docs.length))return;
 await window.qmesPrepareWorkMaterialQr(docs);
 const pages=docs.map(r=>window.namoPrintWorkOrder(r,null,true));
 const parts=pages.map(page=>page.match(/<article class="work-print-document">[\s\S]*?<\/article>/)?.[0]).filter(Boolean);
 if(parts.length!==docs.length){alert('선택 인쇄 문서를 준비하지 못했습니다.');return}
 let html=pages[0].replace(parts[0],parts.join('\n'));
 const count=(html.match(/<span class="print-page-number">/g)||[]).length;let pageNo=0;
 html=html.replace(/<span class="print-page-number">[^<]*<\/span>/g,()=>'<span class="print-page-number">'+(++pageNo)+' / '+count+'</span>');
 // Each complete work-print-document keeps its body and QR appendix together.
 html=html.replace(/<title>[^<]*<\/title>/,'<title>작업지시서 선택 인쇄 ('+docs.length+'건)</title>');
 html=html.replace(/<script>window\.addEventListener\('load'[\s\S]*?<\/script>/,'');
 const old=document.getElementById('qmes-bulk-print-frame');if(old)old.remove();
 const frame=document.createElement('iframe');frame.id='qmes-bulk-print-frame';frame.setAttribute('aria-hidden','true');
 frame.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;border:0;opacity:0;pointer-events:none';
 let printed=false;
 const cleanup=()=>{if(frame.isConnected)frame.remove()};
 const expiry=setTimeout(cleanup,120000);
 frame.addEventListener('load',()=>{
  if(printed||!frame.contentDocument?.querySelector('.paper'))return;
  printed=true;
  const w=frame.contentWindow;
  w.addEventListener('afterprint',()=>{clearTimeout(expiry);setTimeout(cleanup,600)},{once:true});
  Promise.all([frame.contentDocument.fonts?.ready,...Array.from(frame.contentDocument.images,image=>image.decode().catch(()=>{}))]).then(()=>setTimeout(()=>{try{w.focus();w.print()}catch(err){clearTimeout(expiry);cleanup();alert('인쇄 미리보기 오류: '+err.message)}},200));
 });
 document.body.appendChild(frame);
 frame.srcdoc=html;
 }catch(error){console.error('[QMES bulk print]',error);alert('선택 인쇄 오류: '+error.message)}
}
async function remove(){
 if(busy)return;
 const ids=[...selected];if(!ids.length||!await window.qmesConfirm('선택한 작업지시서 '+ids.length+'건을 삭제하시겠습니까?'))return;
 busy=true;update();let count=0;
 try{
  for(const id of ids){
   try{await workApi('DELETE','/'+encodeURIComponent(id));selected.delete(id);count++;
    if(typeof workSharedRows!=='undefined'&&Array.isArray(workSharedRows))workSharedRows=workSharedRows.filter(r=>String(r?.id)!==id);
   }catch(e){alert('작업지시서 '+id+' 삭제 실패: '+e.message);break}
  }
  if(typeof workSharedRows!=='undefined'&&Array.isArray(workSharedRows))try{localStorage.setItem(WORK_LOCAL_KEY,JSON.stringify(workSharedRows))}catch(e){}
  if(typeof refreshSharedWorkOrders==='function')await refreshSharedWorkOrders();
  if(typeof renderSavedWorkOrders==='function')renderSavedWorkOrders();
  if(count&&typeof toast==='function')toast('작업지시서 '+count+'건 삭제 완료');
 }finally{busy=false;scan()}
}
const style=document.createElement('style');style.textContent='.wo-bulk-check,.wo-bulk-all{width:15px;height:15px;margin-right:8px;vertical-align:middle;accent-color:#2563eb;cursor:pointer}.wo-bulk-controls{display:inline-flex;gap:7px;margin-right:10px}.wo-bulk-controls[hidden]{display:none!important}.wo-bulk-controls .wo-bulk-print{background:#eaf3ff;color:#245482;border:1px solid #c8daed}.wo-bulk-controls .wo-bulk-delete{background:#fff1f1;color:#b23535;border:1px solid #e9cccc}';document.head.appendChild(style);
const observer=new MutationObserver(ms=>{if(queued||!ms.some(m=>m.target.closest?.('#work')||[...m.addedNodes].some(n=>n.nodeType===1&&(n.id==='work'||n.querySelector?.('#work')))))return;queued=true;requestAnimationFrame(()=>{queued=false;scan()})});observer.observe(document.body,{childList:true,subtree:true});scan();
})();

;(function(){if(document.querySelector('script[data-qmes-wo-mail]'))return;const script=document.createElement('script');script.dataset.qmesWoMail='1';script.src='./js/qmes-workorder-mail-composer-20261015.js?v=1';document.head.appendChild(script)})();

/* work-iqc-selection-column-parity-20261023 */
(function(){
 const style=document.createElement('style');style.id='work-iqc-selection-column-parity-20261023';
 style.textContent='html body #work table.work-list-table colgroup>col:first-child{width:34px!important}html body #work table.work-list-table colgroup>col:nth-child(2){width:52px!important}html body #work table.work-list-table :is(thead,tbody)>tr>:first-child{box-sizing:border-box!important;width:34px!important;min-width:34px!important;max-width:34px!important;padding:0!important;text-align:center!important;vertical-align:middle!important}html body #work table.work-list-table :is(thead,tbody)>tr>:nth-child(2){box-sizing:border-box!important;width:52px!important;min-width:52px!important;max-width:52px!important;padding:4px!important;text-align:center!important;vertical-align:middle!important}html body #work table.work-list-table :is(.wo-bulk-all,.wo-bulk-check){width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;max-width:13px!important;max-height:13px!important;margin:0!important;padding:0!important;vertical-align:middle!important}';
 document.head.appendChild(style);
})();
