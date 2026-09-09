(()=>{
'use strict';
const $=(s,r=document)=>r.querySelector(s);
function ensureGpsCard(){
  const home=$('.page[data-page="home"]');
  if(!home||$('#namoGpsCard'))return;
  const today=$('.namo-today-card');
  if(!today)return;
  const card=document.createElement('section');
  card.className='namo-gps-card';
  card.id='namoGpsCard';
  card.innerHTML=`<div class="namo-gps-head"><div><div class="namo-gps-title">📍 근무지 위치</div><div class="namo-gps-sub">지정된 근무지 범위 안에서 GPS 위치를 확인해 출퇴근합니다.</div></div><div class="namo-gps-mode">출퇴근 방식 · GPS</div></div><div class="namo-gps-map"><img src="/attendance-enterprise-map-20260909.svg" alt="충주 1공장 GPS 근무지 지도"><button type="button" class="namo-gps-live" id="namoGpsLiveBtn">내 위치 확인</button></div><div class="namo-gps-status"><span id="namoGpsStatus">GPS 위치 확인 전</span><strong>충주 1공장</strong></div>`;
  today.after(card);
  const place=$('#placeCard');
  if(place){
    place.style.cursor='pointer';
    const chev=place.querySelector('.chev');
    if(chev)chev.textContent='지도 보기 ›';
    place.addEventListener('click',openMap);
  }
  $('#namoGpsLiveBtn')?.addEventListener('click',checkGps);
}
function ensureMapOverlay(){
  if($('#namoMapOverlay'))return;
  const overlay=document.createElement('div');
  overlay.className='namo-map-overlay';
  overlay.id='namoMapOverlay';
  overlay.innerHTML=`<div class="namo-map-overlay-inner"><div class="namo-map-top"><button type="button" class="namo-map-back" id="namoMapBack">‹</button><span>충주 1공장 근무지 GPS</span></div><div class="namo-map-body"><img src="/attendance-enterprise-map-20260909.svg" alt="충주 1공장 GPS 지도"><div class="namo-map-note"><b>위치기반 출퇴근</b><br>출근 또는 퇴근 버튼을 누르면 휴대폰의 현재 위치를 확인합니다. 위치 권한이 꺼져 있으면 브라우저에서 위치 권한을 허용해 주세요.<div id="namoMapGpsText" style="margin-top:8px;color:#176dd0;font-weight:800">현재 위치 확인 전</div></div></div></div>`;
  document.body.appendChild(overlay);
  $('#namoMapBack')?.addEventListener('click',closeMap);
}
function openMap(){ensureMapOverlay();$('#namoMapOverlay')?.classList.add('open');}
function closeMap(){$('#namoMapOverlay')?.classList.remove('open');}
function setGpsText(text){const a=$('#namoGpsStatus'),b=$('#namoMapGpsText');if(a)a.textContent=text;if(b)b.textContent=text;}
function checkGps(){
  if(!navigator.geolocation){setGpsText('이 기기에서는 GPS를 사용할 수 없습니다.');return;}
  setGpsText('현재 위치를 확인하는 중입니다...');
  navigator.geolocation.getCurrentPosition(p=>{
    const lat=p.coords.latitude.toFixed(5),lng=p.coords.longitude.toFixed(5),acc=Math.round(p.coords.accuracy||0);
    setGpsText(`현재 위치 확인 완료 · ${lat}, ${lng} · 정확도 약 ${acc}m`);
  },e=>{
    const msg=e.code===1?'위치 권한을 허용해 주세요.':'현재 위치를 확인하지 못했습니다.';
    setGpsText(msg);
  },{enableHighAccuracy:true,timeout:10000,maximumAge:10000});
}
function init(){ensureGpsCard();ensureMapOverlay();document.addEventListener('click',e=>{if(e.target===document.querySelector('#namoMapOverlay'))closeMap();});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,40));else setTimeout(init,40);
})();
