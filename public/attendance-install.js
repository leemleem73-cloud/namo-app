(()=>{
'use strict';
let deferredPrompt=null;
const isStandalone=()=>window.matchMedia?.('(display-mode: standalone)').matches||window.navigator.standalone===true;
function toast(msg){const e=document.getElementById('toast');if(e){e.textContent=msg;e.classList.add('show');setTimeout(()=>e.classList.remove('show'),2600)}else alert(msg)}
function button(){return document.getElementById('attendanceInstallBtn')}
function setInstalled(){const b=button();if(!b)return;b.textContent='NAMO 근태 앱 설치됨';b.disabled=true;b.style.opacity='.65'}
async function install(){if(isStandalone()){setInstalled();return}if(deferredPrompt){deferredPrompt.prompt();const result=await deferredPrompt.userChoice.catch(()=>null);deferredPrompt=null;if(result?.outcome==='accepted')setInstalled();return}const ua=navigator.userAgent||'';if(/iphone|ipad|ipod/i.test(ua)){toast('Safari 하단 공유 버튼 → 홈 화면에 추가를 선택하세요.');return}toast('Chrome 오른쪽 위 ⋮ → 앱 설치 또는 홈 화면에 추가를 선택하세요.')}
function init(){if('serviceWorker' in navigator)navigator.serviceWorker.register('/attendance-sw.js').catch(()=>{});const b=button();if(!b)return;b.addEventListener('click',install);if(isStandalone())setInstalled();window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredPrompt=e;b.disabled=false;b.textContent='휴대폰에 NAMO 근태 설치'});window.addEventListener('appinstalled',()=>{deferredPrompt=null;setInstalled();toast('NAMO 근태 앱이 설치되었습니다.')})}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();