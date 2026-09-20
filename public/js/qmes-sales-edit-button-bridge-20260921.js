/* QMES Sales edit-button bridge - 2026-09-21
 * ADD-ONLY. Routes the current Sales ledger "수정" button to the existing
 * Sales Edit Force V2 modal. Historical Sales modules are not replaced.
 */
(function(){
  "use strict";
  if(window.__QMES_SALES_EDIT_BUTTON_BRIDGE_20260921_V2__) return;
  window.__QMES_SALES_EDIT_BUTTON_BRIDGE_20260921_V2__=true;

  const SALES="qmes-erp-sales-v1";
  const META="qmes-sales-order-meta-v1";
  const clean=v=>String(v==null?"":v).replace(/\s+/g," ").trim();
  const read=(k,f)=>{try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(_){return f}};
  const write=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch(_){}};
  const esc=v=>String(v==null?"":v).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

  function visibleId(row){
    const meta=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:{};
    return clean(meta.salesOrderIdOverride)||clean(row&&row.id);
  }

  function ensureLocalRow(row){
    if(!row||typeof row!=="object") return "";
    const id=visibleId(row);
    let list=read(SALES,[]);
    if(!Array.isArray(list)) list=[];

    const index=list.findIndex(item=>{
      const meta=item&&item.orderMeta&&typeof item.orderMeta==="object"?item.orderMeta:{};
      const shown=clean(meta.salesOrderIdOverride)||clean(item&&item.id);
      return clean(item&&item.id)===clean(row.id)||shown===id;
    });

    if(index<0){
      list.unshift({...row});
      write(SALES,list);
    }

    const map=read(META,{});
    if(map&&typeof map==="object"&&!Array.isArray(map)){
      const meta=row&&row.orderMeta&&typeof row.orderMeta==="object"?row.orderMeta:null;
      if(meta&&id&&!map[id]){
        map[id]={...meta};
        write(META,map);
      }
    }
    return id;
  }

  function clickExistingEditor(row,attempt){
    const id=ensureLocalRow(row);
    if(!id){
      window.alert("수주 데이터를 찾지 못했습니다.");
      return;
    }

    if(!window.__QMES_SALES_EDIT_MODAL_FORCE_V2__){
      if((attempt||0)<60){
        setTimeout(()=>clickExistingEditor(row,(attempt||0)+1),100);
      }else{
        window.alert("수주 수정 기능을 불러오지 못했습니다. 화면을 새로고침한 후 다시 시도해 주세요.");
      }
      return;
    }

    const host=document.createElement("div");
    host.className="qmes-sales-stable";
    host.setAttribute("aria-hidden","true");
    host.style.cssText="position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;";
    host.innerHTML='<table><thead><tr><th>수주번호</th><th>관리</th></tr></thead><tbody><tr><td>'+esc(id)+'</td><td><button type="button" class="qmes-sales-edit-btn" data-qmes-sales-edit="'+esc(id)+'">수정</button></td></tr></tbody></table>';
    document.body.appendChild(host);

    const button=host.querySelector(".qmes-sales-edit-btn");
    if(button) button.click();

    setTimeout(()=>{
      host.remove();
      if(!document.getElementById("qmes-sales-edit-force-v2")){
        window.alert("수주 수정창을 열지 못했습니다. 다시 한 번 수정 버튼을 눌러 주세요.");
      }
    },350);
  }

  function open(row){
    clickExistingEditor(row,0);
  }

  window.qmesSalesEditDirectV18={open};

  window.addEventListener("click",event=>{
    const target=event.target;
    if(!(target instanceof Element)) return;
    const button=target.closest(".qmes-sales-ledger-v4 .qrl-actions button");
    if(!button||clean(button.textContent)!=="수정") return;

    const tr=button.closest("tr");
    const links=tr?Array.from(tr.querySelectorAll(".qrl-link")):[];
    const id=clean(links[1]?.textContent||links[0]?.textContent);
    if(!id) return;

    const list=read(SALES,[]);
    const map=read(META,{});
    const row=(Array.isArray(list)?list:[]).find(item=>{
      const m=map&&typeof map==="object"&&!Array.isArray(map)
        ? (map[clean(item&&item.workOrder)]||map[clean(item&&item.id)]||item&&item.orderMeta||{})
        : (item&&item.orderMeta||{});
      const shown=clean(m&&m.salesOrderIdOverride)||clean(item&&item.id);
      return shown===id||clean(item&&item.id)===id;
    });

    if(row){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      setTimeout(()=>clickExistingEditor(row,0),0);
    }
  },true);
})();