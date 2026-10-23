/* NAMO QMES mobile detail controller - live DOM page bridge - 2026-10-23 */
(function(){
"use strict";
if(window.__NAMO_QMES_MOBILE_SHELL_20261023__)return;
window.__NAMO_QMES_MOBILE_SHELL_20261023__=true;

const p=new URLSearchParams(location.search);
const page=p.get("mobilePage")||"";
const isMobile=p.get("mobile")==="1"||window.matchMedia("(max-width:768px)").matches;
if(!isMobile||!page)return;

const titles={
  work:"작업지시서",
  incoming:"수입검사",
  process:"공정검사",
  outgoing:"출하검사",
  lotTrace:"LOT 추적",
  pop:"현장 입력",
  equipment:"설비관리",
  standard:"기준서",
  adminEmployees:"회원관리"
};



function renderNativeMobileWorkList(){
  if(page!=="work")return;
  const section=document.getElementById("work");
  const table=section?.querySelector(".work-list-table");
  const tbody=table?.querySelector("tbody");
  if(!section||!table||!tbody)return;

  let native=section.querySelector("#qmes-mobile-work-native");
  if(!native){
    native=document.createElement("div");
    native.id="qmes-mobile-work-native";
    native.innerHTML=
      '<div class="qmwn-head">'+
        '<div><strong>작업지시서</strong><small>생산 작업지시 조회 및 등록</small></div>'+
        '<div class="qmwn-actions"><button type="button" class="qmwn-export">엑셀</button><button type="button" class="qmwn-new">+ 신규등록</button></div>'+
      '</div>'+
      '<div class="qmwn-search"><input type="search" placeholder="작업지시번호 · 제품명 · LOT 검색"><button type="button">검색</button></div>'+
      '<div class="qmwn-summary"><span>작업지시 현황</span><b class="qmwn-count">0건</b></div>'+
      '<div class="qmwn-list"></div>';
    section.prepend(native);

    native.querySelector(".qmwn-new").onclick=()=>section.querySelector(".new-btn")?.click();
    native.querySelector(".qmwn-export").onclick=()=>section.querySelector(".export-btn")?.click();
    const search=native.querySelector(".qmwn-search input");
    native.querySelector(".qmwn-search button").onclick=()=>drawNativeWorkCards(search.value);
    search.addEventListener("input",()=>drawNativeWorkCards(search.value));
  }

  function drawNativeWorkCards(query=""){
    const q=String(query||"").trim().toLowerCase();
    const headers=Array.from(table.querySelectorAll("thead th")).map(th=>String(th.textContent||"").replace(/\s+/g," ").trim());
    const rows=Array.from(tbody.querySelectorAll("tr")).filter(tr=>tr.cells&&tr.cells.length>1);
    const list=native.querySelector(".qmwn-list");
    list.replaceChildren();
    let shown=0;

    rows.forEach(row=>{
      const cells=Array.from(row.cells);
      const values=cells.map(td=>String(td.innerText||td.textContent||"").replace(/\s+/g," ").trim());
      const whole=values.join(" ").toLowerCase();
      if(q&&!whole.includes(q))return;

      const get=(name,alts=[])=>{
        const names=[name,...alts];
        for(const n of names){
          const idx=headers.findIndex(h=>h===n||h.includes(n));
          if(idx>=0)return values[idx]||"-";
        }
        return "-";
      };

      const no=get("작업지시번호");
      const product=get("제품명");
      const lot=get("생산 LOT",["LOT NO"]);
      const status=get("진행상태",["상태"]);
      const customer=get("고객사");
      const period=get("작업기간",["작업일자"]);
      const qty=get("계획수량",["계획수량(kg)"]);

      const card=document.createElement("article");
      card.className="qmwn-card";
      card.innerHTML=
        '<div class="qmwn-card-top"><div><span class="qmwn-kicker">'+escapeHtml(status)+'</span><strong>'+escapeHtml(no)+'</strong></div><button type="button" class="qmwn-detail">상세</button></div>'+
        '<div class="qmwn-main"><b>'+escapeHtml(product)+'</b><span>LOT '+escapeHtml(lot)+'</span></div>'+
        '<dl>'+
          '<div><dt>고객사</dt><dd>'+escapeHtml(customer)+'</dd></div>'+
          '<div><dt>작업기간</dt><dd>'+escapeHtml(period)+'</dd></div>'+
          '<div><dt>계획수량</dt><dd>'+escapeHtml(qty)+'</dd></div>'+
        '</dl>';

      card.querySelector(".qmwn-detail").onclick=()=>{
        const clickable=Array.from(row.querySelectorAll("a,button")).find(el=>!/삭제|인쇄/.test(String(el.textContent||"")));
        if(clickable){clickable.click();return;}
        row.click();
      };
      list.appendChild(card);
      shown++;
    });

    native.querySelector(".qmwn-count").textContent=shown+"건";
    if(!shown){
      const empty=document.createElement("div");
      empty.className="qmwn-empty";
      empty.textContent="조회된 작업지시가 없습니다.";
      list.appendChild(empty);
    }
  }

  drawNativeWorkCards(native.querySelector(".qmwn-search input")?.value||"");
}
function escapeHtml(value){
  return String(value??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
}

function prepareMobileWorkCards(){
  if(page!=="work")return;
  const table=document.querySelector("#work .work-list-table");
  if(!table)return;
  const headers=Array.from(table.querySelectorAll("thead th")).map(th=>String(th.textContent||"").replace(/\s+/g," ").trim());
  table.classList.add("qmes-mobile-card-table");
  table.querySelectorAll("tbody tr").forEach(row=>{
    if(row.dataset.qmesMobilePrepared==="1")return;
    row.dataset.qmesMobilePrepared="1";
    Array.from(row.children).forEach((cell,index)=>{
      cell.setAttribute("data-mobile-label",headers[index]||("항목 "+(index+1)));
    });
  });
}

function openSelectedPage(){
  const menu=document.querySelector('.sidebar .menu[data-page="'+CSS.escape(page)+'"]');
  if(menu){ menu.click(); return true; }
  const target=document.getElementById(page);
  if(!target)return false;
  document.querySelectorAll(".module-page").forEach(el=>el.classList.remove("active"));
  target.classList.add("active");
  return true;
}

function addMobileShell(){
  document.body.classList.add("qmes-mobile-work-view");
  ["qmes-mobile-attendance","qmes-mobile-menu-toggle","qmes-mobile-menu-backdrop"].forEach(id=>document.getElementById(id)?.remove());
  if(document.getElementById("qmes-mobile-workbar"))return;
  const bar=document.createElement("div");
  bar.id="qmes-mobile-workbar";
  bar.innerHTML='<button type="button" class="qmw-back">‹</button><strong class="qmw-title"></strong><button type="button" class="qmw-home">메인</button>';
  bar.querySelector(".qmw-title").textContent=titles[page]||"QMES";
  bar.querySelector(".qmw-back").onclick=()=>location.assign("/mobile.html");
  bar.querySelector(".qmw-home").onclick=()=>location.assign("/mobile.html");
  document.body.appendChild(bar);
}

function boot(){
  addMobileShell();
  [0,120,350,700].forEach(ms=>setTimeout(()=>{openSelectedPage();prepareMobileWorkCards();renderNativeMobileWorkList();},ms));
  const root=document.getElementById("work");
  if(root&&page==="work"){
    new MutationObserver(()=>{prepareMobileWorkCards();renderNativeMobileWorkList();}).observe(root,{childList:true,subtree:true});
  }
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",boot,{once:true});else boot();
})();