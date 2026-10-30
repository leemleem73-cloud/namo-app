(()=>{'use strict';
const cards=document.querySelector('.right-side');if(!cards)return;
const images=[["기존 배경","공장 야경","factory"],["기존 배경","공장 일출","sunrise"],["기존 배경","산업단지","industrial"],["기존 배경","기본 일러스트","original"],["봄","봄꽃",2132180],["여름","푸른 바다",8651029],["가을","가을 숲",589821],["겨울","설경",19287524],["동물","고양이",104827],["동물","강아지",1805164],["자연","산과 호수",15328416],["자연","초록 숲",10751486],["바다","해변",8651078],["바다","파도",8651029],["도시","도시 야경",35557555],["도시","반짝이는 도시",13027719],["봄","꽃이 핀 들판",37087646],["봄","봄 초원",32893151],["봄","꽃밭",29274400],["가을","낙엽 숲",5941129],["자연","숲속 폭포",11008002],["자연","시원한 폭포",18619085],["바다","해변 노을",36190355],["바다","붉은 노을",1024994]];
const trigger=document.createElement('button');trigger.type='button';trigger.className='portal-wallpaper-gallery-trigger';trigger.textContent='▧  배경 선택하기';trigger.setAttribute('aria-haspopup','dialog');cards.prepend(trigger);
const legacy={factory:'https://commons.wikimedia.org/wiki/Special:FilePath/Wesseling_Refinery_at_Dusk%2C_March_2018.jpg?width=640',sunrise:'https://commons.wikimedia.org/wiki/Special:FilePath/Sunrise_Texas.jpg?width=640',industrial:'https://www.carburos.com/-/media/images/1440x810/masthead/909216872-refinery-16x9.jpg?as=0&w=640',original:'/qmes-login-illustration-pro.svg'};
const imageUrl=(id,width)=>legacy[id]||'https://images.pexels.com/photos/'+id+'/pexels-photo-'+id+'.jpeg?auto=compress&cs=tinysrgb&w='+width;
function positionTrigger(){const box=cards.getBoundingClientRect(),stage=document.getElementById('stage').getBoundingClientRect();trigger.style.position='fixed';trigger.style.zIndex='12';trigger.style.left=(box.left+(box.width-trigger.offsetWidth)/2)+'px';trigger.style.top=Math.max(8,stage.top+14)+'px';}
requestAnimationFrame(positionTrigger);window.addEventListener('resize',positionTrigger);window.addEventListener('scroll',positionTrigger,true);if(typeof ResizeObserver!=='undefined')new ResizeObserver(positionTrigger).observe(cards);
trigger.addEventListener('click',()=>{
 const dialog=document.createElement('dialog');dialog.className='portal-wallpaper-gallery';
 const header=document.createElement('header');header.innerHTML='<h2>배경 선택하기</h2><button type="button" data-gallery-close aria-label="닫기">×</button>';dialog.append(header);
 const tabs=document.createElement('div');tabs.className='wallpaper-gallery-tabs';tabs.setAttribute('aria-label','배경 카테고리');dialog.append(tabs);
 const grid=document.createElement('div');grid.className='wallpaper-gallery-images';dialog.append(grid);
 const status=document.createElement('p');status.className='wallpaper-gallery-status';status.setAttribute('role','status');dialog.append(status);
 const footer=document.createElement('footer');footer.innerHTML='<button type="button" data-gallery-upload>내 사진 선택</button><span>무료 사진 · <a href="https://www.pexels.com/license/" target="_blank" rel="noopener noreferrer">Pexels</a></span>';dialog.append(footer);
 let busy=false,closed=false;
 function paint(category){grid.replaceChildren();tabs.querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.textContent===category)));
 images.filter(item=>category==='전체'||item[0]===category).forEach(([cat,name,id])=>{
 const tile=document.createElement('button');tile.type='button';tile.className='wallpaper-gallery-tile';const img=document.createElement('img');img.src=imageUrl(id,480);img.alt=name;img.loading='lazy';const title=document.createElement('span');title.textContent=name;tile.append(img,title);grid.append(tile);
 img.onerror=()=>{img.remove();tile.disabled=true;title.textContent=name+' · 연결 대기';};
 tile.onclick=async()=>{if(busy)return;busy=true;status.textContent='배경을 불러오는 중입니다…';try{
 if(legacy[id]){localStorage.setItem('qmes-portal-wallpaper-v1',id);window.qmesApplyWallpaper?.(id);try{window.parent.qmesApplyWallpaper?.(id);}catch(_){}const stage=document.getElementById('stage');stage.dataset.wallpaper=id;stage.style.setProperty('--qmes-wallpaper',document.documentElement.style.getPropertyValue('--qmes-initial-wallpaper'));dialog.close();return;}
 const url=imageUrl(id,1920);await new Promise((resolve,reject)=>{const image=new Image(),timer=setTimeout(()=>reject(Error('timeout')),12000);image.onload=()=>{clearTimeout(timer);resolve();};image.onerror=()=>{clearTimeout(timer);reject(Error('load'));};image.src=url;});
 if(closed)return;localStorage.setItem('qmes-portal-wallpaper-gallery-v1',url);localStorage.setItem('qmes-portal-wallpaper-v1','gallery');
 window.qmesApplyWallpaper?.('gallery');try{window.parent.qmesApplyWallpaper?.('gallery');}catch(_){}
 const stage=document.getElementById('stage');stage.dataset.wallpaper='gallery';stage.style.setProperty('--qmes-wallpaper','linear-gradient(90deg,rgba(8,34,55,.38),rgba(8,34,55,.12)),url("'+url+'")');
 dialog.close();
 }catch(_){status.textContent='사진을 불러오지 못했습니다. 다른 사진을 선택해 주세요.';}finally{busy=false;}};
 });}
 ['전체','기존 배경','봄','여름','가을','겨울','동물','자연','바다','도시'].forEach(name=>{const b=document.createElement('button');b.type='button';b.textContent=name;b.onclick=()=>paint(name);tabs.append(b);});paint('전체');
 header.querySelector('button').onclick=()=>dialog.close();footer.querySelector('button').onclick=()=>document.getElementById('wallpaper-file')?.click();
 dialog.addEventListener('close',()=>{closed=true;dialog.remove();trigger.focus();},{once:true});document.body.append(dialog);dialog.showModal();
});
const style=document.createElement('style');style.textContent=`
.portal-wallpaper-gallery-trigger{align-self:flex-end;display:flex;align-items:center;gap:7px;padding:9px 14px;border:1px solid #ffffff70;border-radius:9px;background:#ffffffed;color:#294e68;font:600 12px "Malgun Gothic",sans-serif;box-shadow:0 4px 16px #17334b20;cursor:pointer}
.portal-wallpaper-gallery{box-sizing:border-box;width:min(820px,calc(100vw - 32px));max-height:85dvh;padding:22px;border:1px solid #d7e4ef;border-radius:16px;background:#f8fbfe;color:#28475f;box-shadow:0 18px 60px #18344840;font:12px "Malgun Gothic",sans-serif}
.portal-wallpaper-gallery::backdrop{background:#102d485e}.portal-wallpaper-gallery header{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px}.portal-wallpaper-gallery h2{font-size:18px;margin:0}.portal-wallpaper-gallery header button{border:0;background:transparent;color:#45627b;font-size:25px;cursor:pointer}
.wallpaper-gallery-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:16px}.wallpaper-gallery-tabs button{border:1px solid #d4e0ec;background:#fff;border-radius:16px;padding:7px 13px;color:#45637d;cursor:pointer}.wallpaper-gallery-tabs button[aria-pressed=true]{color:#fff;border-color:#2787bd;background:#2787bd}
.wallpaper-gallery-images{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;max-height:52dvh;overflow:auto;padding:2px}.wallpaper-gallery-tile{display:flex;flex-direction:column;overflow:hidden;padding:0;border:1px solid #d7e3ed;border-radius:10px;background:#fff;color:#365a75;cursor:pointer;text-align:left}.wallpaper-gallery-tile img{width:100%;aspect-ratio:16/9;object-fit:contain;background:#eaf0f5}.wallpaper-gallery-tile span{padding:9px 11px}.wallpaper-gallery-tile:hover{border-color:#258fc3;box-shadow:0 3px 12px #24577720}.wallpaper-gallery-tile:disabled{opacity:.5;cursor:default}.wallpaper-gallery-status{min-height:18px;color:#647d92;margin:10px 0}.portal-wallpaper-gallery footer{display:flex;align-items:center;justify-content:space-between;gap:12px}.portal-wallpaper-gallery footer button{border:1px solid #cbdbe8;border-radius:6px;padding:8px 12px;color:#365b78;background:#fff;cursor:pointer}.portal-wallpaper-gallery footer span{font-size:10px;color:#8194a4}.portal-wallpaper-gallery footer a{color:inherit}
@media(max-width:600px){.wallpaper-gallery-images{grid-template-columns:repeat(2,minmax(0,1fr))}.portal-wallpaper-gallery{padding:16px}}
`;style.textContent+='html[data-qmes-wallpaper="gallery"] .stage[data-wallpaper="gallery"]{background-size:100% 100%,contain!important;background-repeat:no-repeat!important;background-position:center!important;background-color:#163448!important}';document.head.append(style);
})();