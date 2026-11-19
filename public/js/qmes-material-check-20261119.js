(async function(){'use strict';
const $=id=>document.getElementById(id),rules=window.qmesScanSequence,params=new URLSearchParams(location.search),demo=params.get('demo')==='1';
let docs=[],active=null,rows=[],done=[],pending=null,iqc=[],links=[],busy=false,audio=null,stream=null,timer=null;
const demoRows=[{name:'NMP',lot:'TEST-NMP-001',plan:'10'},{name:'BYK180',lot:'TEST-BYK-002',plan:'1'},{name:'AOH30',lot:'TEST-AOH-003',plan:'5'}];
const signature=doc=>JSON.stringify((doc.materials||[]).map(row=>[row.name,row.sourceName,row.lot,row.plan,row.actual,row.batchType,row.sourceSemiOrderId,row.semiWorkOrderId]));
async function read(url,options){const res=await fetch(url,{credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(20000),...options});if(res.status===401||res.status===403)throw Error('나모 웹에 로그인한 뒤 다시 열어 주세요.');const value=await res.json();if(!res.ok||!value.success)throw Error(value.message||'조회 실패');return value.data;}
function paint(result){$('notice').className=result.ok?'ok':'bad';$('title').textContent=result.title;$('message').textContent=result.message;}
function unlock(){try{audio||=new (window.AudioContext||window.webkitAudioContext)();audio.resume().catch(()=>{});}catch(_){}}
function alarm(result){paint(result);$('alarmTitle').textContent=result.title;$('alarmText').textContent=result.message;if(!$('alarm').open)$('alarm').showModal();navigator.vibrate?.([150,80,150]);try{if(audio?.state==='running'){for(let i=0;i<2;i++){const o=audio.createOscillator(),g=audio.createGain();o.frequency.value=660;o.connect(g);g.connect(audio.destination);g.gain.value=.12;o.start(audio.currentTime+i*.25);o.stop(audio.currentTime+i*.25+.16);}}}catch(_){}}
$('closeAlarm').onclick=()=>{$('alarm').close();$('scan').focus();};
function render(){const next=rows.findIndex((_,i)=>!done.includes(i));$('steps').replaceChildren(...rows.map((row,i)=>{const li=document.createElement('li');li.textContent=(done.includes(i)?'✓ ':'')+row.name+' / '+row.lot;li.className=i===next?'current':'';return li;}));$('confirm').disabled=!pending||busy;$('check').disabled=!rows.length||busy||next<0;$('camera').disabled=$('check').disabled;$('scan').disabled=$('check').disabled;}
function reset(){rows=active.materials.map((row,line)=>({...row,line})).filter(row=>row.name&&(row.lot||Number(row.plan)>0||Number(row.actual)>0));done=[];pending=null;render();paint({ok:true,title:'1번 원료부터 스캔하세요',message:rows[0]?rows[0].name+' / '+rows[0].lot:'등록된 투입 원료가 없습니다.'});}
async function fresh(){const latest=(await read('/api/qmes/work-orders')).find(doc=>doc.id===active.id);if(!latest||signature(latest)!==signature(active))throw Error('작업지시서가 변경되었습니다. 작업 시작을 다시 눌러 최신 원료·LOT로 확인하세요.');}
async function resolve(raw){
 if(/^https?:|^\//.test(raw)){const url=new URL(raw,location.origin);if(url.origin!==location.origin)throw Error('나모 웹의 원료 QR을 사용해 주세요.');
 const token=url.searchParams.get('s');if(token)return read('/api/qmes/work-material-links/'+encodeURIComponent(token));
 const id=url.searchParams.get('r')||url.searchParams.get('record');const matched=id?iqc.filter(row=>String(row.id)===id):iqc.filter(row=>rules.lot(row.lot)===rules.lot(url.searchParams.get('lot')));
 if(matched.length===1)return {name:matched[0].item,lot:matched[0].lot};
 throw Error('이 QR의 원료를 한 건으로 확인할 수 없습니다. 용기의 LOT 바코드를 스캔해 주세요.');
 }
 const matches=iqc.filter(row=>rules.lot(row.lot)===rules.lot(raw));const names=[...new Set(matches.map(row=>rules.material(row.item)))];
 if(names.length!==1)throw Error('입력한 LOT의 수입검사 원료를 한 종류로 확인할 수 없습니다. 원료 QR을 사용하세요.');
 return {name:matches[0].item,lot:raw};
}
async function validate(scan){
 pending=null;
 // Identity/order checks precede stock reads; they never approve by URL query text alone.
 const preliminary=rules.compare(rows,done,{...scan,kind:'ok'});
 if(!preliminary.ok){alarm(preliminary);return;}
 if(!demo){const expected=rows[preliminary.index],link=links.find(link=>link.line===expected.line);if(!link)throw Error('해당 원료의 QR 연결을 확인할 수 없습니다. 작업지시서를 확인해 주세요.');
 const status=await read('/api/qmes/work-material-links/'+encodeURIComponent(link.token));scan={...scan,kind:status.kind,reason:status.reason};}
 const result=rules.compare(rows,done,scan);if(!result.ok){alarm(result);return;}
 pending={index:result.index,scan};paint(result);
}
async function runDemo(type){
 if(!demo)throw Error('시험 QR은 시험 화면에서만 사용할 수 있습니다.');
 if(!['material','lot','order','duplicate','quality','ok'].includes(type))throw Error('시험 QR 종류를 확인해 주세요.');
 unlock();reset();let scan={...demoRows[0],kind:'ok'};
 if(type==='material')scan={name:'SBR',lot:'TEST-SBR-999',kind:'ok'};
 if(type==='lot')scan.lot='TEST-WRONG-999';
 if(type==='order')scan={...demoRows[1],kind:'ok'};
 if(type==='duplicate')done=[0];
 if(type==='quality')scan={...scan,kind:'bad',reason:'시험용 수입검사 불합격 원료입니다.'};
 await validate(scan);render();
}
async function check(){if(busy||!active)return;unlock();busy=true;pending=null;render();try{if(!demo)await fresh();const raw=$('scan').value.trim();if(!raw)throw Error('QR 또는 LOT를 스캔해 주세요.');if(demo){const url=new URL(raw,location.origin);if(url.origin!==location.origin||url.pathname!=='/qmes-material-check.html'||url.searchParams.get('demo')!=='1')throw Error('시험용 QR을 스캔해 주세요.');await runDemo(url.searchParams.get('sample'));return;}await validate(await resolve(raw));}catch(error){alarm({title:'투입 확인 차단',message:error.message});}finally{busy=false;render();}}
$('check').onclick=check;$('scan').oninput=()=>{pending=null;render();};$('scan').onkeydown=event=>{if(event.key==='Enter'){event.preventDefault();check();}};
$('confirm').onclick=async()=>{if(!pending||busy)return;unlock();const candidate=pending;pending=null;busy=true;render();try{if(!demo){await fresh();await validate(candidate.scan);if(!pending)return;}done.push(candidate.index);pending=null;$('scan').value='';const next=rows.findIndex((_,i)=>!done.includes(i));paint({ok:true,title:next<0?'전체 원료 확인 완료':'다음 원료를 스캔하세요',message:next<0?'모든 원료의 순서·원료명·LOT 확인을 마쳤습니다. 생산 실적이나 재고는 변경하지 않았습니다.':(next+1)+'번 '+rows[next].name+' / '+rows[next].lot});}catch(error){pending=null;alarm({title:'투입 확인 차단',message:error.message});}finally{busy=false;render();}};
$('start').onclick=async()=>{unlock();if(busy)return;busy=true;pending=null;stop();render();try{
 if(demo){active={id:'TEST',materials:demoRows};reset();return;}
 const all=await read('/api/qmes/work-orders');active=all.find(doc=>doc.id===$('workChoice').value);if(!active)throw Error('작업지시서를 선택해 주세요.');
 [iqc,links]=await Promise.all([read('/api/iqc'),read('/api/qmes/work-material-links',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({workId:active.id})})]);iqc=iqc.filter(row=>!row.deleted);reset();
 }catch(error){rows=[];alarm({title:'작업 시작 불가',message:error.message});}finally{busy=false;render();}};
function stop(){clearTimeout(timer);stream?.getTracks().forEach(track=>track.stop());stream=null;$('video').hidden=true;$('camera').textContent='카메라로 스캔';}
$('camera').onclick=async()=>{unlock();if(stream){stop();return;}if(!window.BarcodeDetector||!navigator.mediaDevices?.getUserMedia){alarm({title:'카메라 안내',message:'이 브라우저는 카메라 스캔을 지원하지 않습니다. 바코드 리더 또는 QR 주소·LOT 입력을 사용하세요.'});return;}try{const detector=new BarcodeDetector({formats:['qr_code','code_128','code_39','ean_13']});stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});$('video').srcObject=stream;$('video').hidden=false;await $('video').play();$('camera').textContent='카메라 중지';const tick=async()=>{if(!stream)return;try{const found=await detector.detect($('video'));if(found[0]?.rawValue){$('scan').value=found[0].rawValue;stop();await check();return;}}catch(_){}if(stream)timer=setTimeout(tick,250);};tick();}catch(error){stop();alarm({title:'카메라 확인',message:'카메라 권한을 확인해 주세요.'});}};
window.addEventListener('pagehide',stop);
$('workChoice').onchange=()=>{active=null;rows=[];done=[];pending=null;stop();render();paint({title:'작업 시작 필요',message:'선택한 작업 시작 버튼을 눌러 주세요.'});};
if(demo){$('demoBanner').hidden=false;$('demoTools').hidden=false;$('workChoice').replaceChildren(new Option('가상 작업지시서 · NMP → BYK180 → AOH30','TEST'));active={id:'TEST',materials:demoRows};reset();
 document.querySelectorAll('[data-case]').forEach(button=>button.onclick=()=>runDemo(button.dataset.case));
 const labels={material:'다른 원료 · SBR',lot:'잘못된 LOT · NMP',order:'순서 오류 · BYK180',duplicate:'중복 스캔 · NMP',quality:'불합격 · NMP',ok:'정상 · NMP'};
 const cards=$('demoQrCards');
 for(const [type,label] of Object.entries(labels)){
  const card=document.createElement('article');card.className='demo-qr-card';
  const title=document.createElement('h3');title.textContent=label;card.append(title);
  const mount=document.createElement('div');mount.className='demo-qr-code';card.append(mount);
  const url=new URL('/qmes-material-check.html',location.origin);url.searchParams.set('demo','1');url.searchParams.set('sample',type);
  if(typeof QRCode==='function')new QRCode(mount,{text:url.href,width:180,height:180,correctLevel:QRCode.CorrectLevel.M});
  else mount.textContent='QR을 불러오지 못했습니다. 새로고침해 주세요.';
  const link=document.createElement('a');link.href=url.href;link.textContent='이 QR 시험 열기';card.append(link);cards.append(card);
 }
 const selected=params.get('sample');
 if(labels[selected]){const launch=document.createElement('button');launch.className='primary';launch.textContent='스캔한 시험 QR 확인 · 소리 켜기';launch.onclick=()=>runDemo(selected);$('demoBanner').append(document.createElement('br'),launch);}

}else{try{docs=await read('/api/qmes/work-orders');$('workChoice').replaceChildren(new Option('작업지시서 선택',''),...docs.map(doc=>new Option((doc.fields?.['작업지시번호']||doc.id)+' · '+(doc.fields?.['제품명']||''),doc.id)));if(params.get('work'))$('workChoice').value=params.get('work');}catch(error){$('workChoice').replaceChildren(new Option('로그인 후 다시 열어 주세요',''));alarm({title:'조회할 수 없습니다',message:error.message});}}
})();