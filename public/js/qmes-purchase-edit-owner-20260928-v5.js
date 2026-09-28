/* QMES Purchase Edit Owner V5 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Loaded before legacy edit patches so this compact editor owns Purchase edit.
 * Uses the same qmesFixedCalendar owner as Sales/Delivery.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_EDIT_OWNER_20260928_V5__) return;
  window.__QMES_PURCHASE_EDIT_OWNER_20260928_V5__=true;

  var ID="qmes-purchase-edit-owner-v5";
  var STORE="qmes-erp-purchase-v1";
  var opening=false,saving=false;

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function num(v){var n=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
  function rowNo(r){return clean(r&&(r.purchaseNo||r.purchase_no||r.no||r.id));}
  function val(r,a,b,c,d){return r&&(r[a]!=null?r[a]:r[b]!=null?r[b]:r[c]!=null?r[c]:r[d]);}

  function rowsLocal(){
    if(Array.isArray(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__)&&window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__.length) return window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__;
    try{
      var v=JSON.parse(localStorage.getItem(STORE)||"[]");
      return Array.isArray(v)?v:(v&&Array.isArray(v.rows)?v.rows:[]);
    }catch(_){return [];}
  }
  function saveLocal(rows){
    try{localStorage.setItem(STORE,JSON.stringify(rows));}catch(_){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
  }
  function currentUser(){
    var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    try{
      var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");
      if(s&&typeof s==="object")u=Object.assign({},u,s);
    }catch(_){}
    return clean(u.name||u.userName||u.username||u.uid);
  }
  async function api(url,opt){
    var r=await fetch(url,Object.assign({credentials:"same-origin",cache:"no-store"},opt||{}));
    var o=await r.json().catch(function(){return {success:false,message:"HTTP "+r.status};});
    if(!r.ok||(o&&o.success===false)) throw new Error((o&&o.message)||("요청 실패 ("+r.status+")"));
    return o&&Object.prototype.hasOwnProperty.call(o,"data")?o.data:o;
  }
  function syncRows(data){
    var arr=Array.isArray(data)?data:[];
    var rec=arr.find(function(x){return clean(x&&(x.record_key||x.recordKey||x.key))==="erp:purchase";});
    var p=rec&&rec.payload&&typeof rec.payload==="object"?rec.payload:null;
    return p&&Array.isArray(p.rows)?p.rows:[];
  }
  async function getRow(no){
    var local=rowsLocal().find(function(x){return rowNo(x)===no;});
    if(local)return local;
    try{
      var data=await api("/api/qmes-sync/inventory?_qmesPurchaseEdit="+Date.now(),{headers:{"Accept":"application/json","Cache-Control":"no-cache"}});
      var rows=syncRows(data);
      if(rows.length)saveLocal(rows);
      return rows.find(function(x){return rowNo(x)===no;})||null;
    }catch(_){return null;}
  }
  function close(){
    var old=document.getElementById(ID);
    if(old)old.remove();
    opening=false;
    saving=false;
    try{window.qmesFixedCalendar&&window.qmesFixedCalendar.close&&window.qmesFixedCalendar.close();}catch(_){}
  }
  function style(){
    return '<style>'+
      '#'+ID+'{position:fixed!important;inset:0!important;z-index:2147483646!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:12px!important;background:rgba(15,23,42,.48)!important}'+
      '#'+ID+',#'+ID+' *{box-sizing:border-box!important;font-family:Pretendard,"Noto Sans KR","Malgun Gothic",Arial,sans-serif!important}'+
      '#'+ID+' .pe5-card{width:min(680px,92vw)!important;max-height:80vh!important;overflow:auto!important;background:#fff!important;border:1px solid #d8e0e9!important;border-radius:12px!important;box-shadow:0 22px 70px rgba(15,23,42,.32)!important;color:#111827!important}'+
      '#'+ID+' .pe5-head{position:sticky!important;top:0!important;z-index:4!important;display:flex!important;align-items:center!important;justify-content:space-between!important;padding:10px 14px!important;border-bottom:1px solid #e2e8f0!important;background:#fff!important}'+
      '#'+ID+' h2{margin:0!important;font-size:15px!important;font-weight:950!important;color:#0f172a!important}'+
      '#'+ID+' .pe5-x{width:30px!important;height:30px!important;border:0!important;background:transparent!important;font-size:22px!important;cursor:pointer!important}'+
      '#'+ID+' .pe5-body{padding:11px 14px 13px!important}'+
      '#'+ID+' .pe5-grid{display:grid!important;grid-template-columns:1fr 1fr!important;gap:7px 10px!important}'+
      '#'+ID+' label{display:block!important;margin:0 0 3px!important;color:#475569!important;font-size:10px!important;font-weight:900!important}'+
      '#'+ID+' input,#'+ID+' select{display:block!important;width:100%!important;height:34px!important;padding:0 9px!important;border:1px solid #cbd5e1!important;border-radius:7px!important;background:#fff!important;color:#111827!important;font-size:12px!important;font-weight:700!important}'+
      '#'+ID+' input[disabled]{background:#f8fafc!important;color:#475569!important}'+
      '#'+ID+' .pe5-actions{display:flex!important;justify-content:flex-end!important;gap:7px!important;margin-top:11px!important;padding-top:10px!important;border-top:1px solid #eef2f7!important}'+
      '#'+ID+' .pe5-btn{height:34px!important;padding:0 14px!important;border-radius:7px!important;font-size:11px!important;font-weight:900!important;cursor:pointer!important}'+
      '#'+ID+' .pe5-cancel{border:1px solid #cbd5e1!important;background:#fff!important;color:#334155!important}'+
      '#'+ID+' .pe5-save{border:1px solid #1596cf!important;background:#1596cf!important;color:#fff!important}'+
      '@media(max-width:700px){#'+ID+' .pe5-card{width:96vw!important;max-height:88vh!important}#'+ID+' .pe5-grid{grid-template-columns:1fr!important}}'+
      '</style>';
  }
  function makeModal(r){
    var no=rowNo(r);
    var od=clean(val(r,"orderDate","order_date","date","createdAt")).slice(0,10);
    var sup=clean(val(r,"supplier","vendor","partner","supplierName"));
    var it=clean(val(r,"item","material","itemName","materialName"));
    var sp=clean(val(r,"spec","specification","itemSpec","item_spec"));
    var q=num(val(r,"qty","quantity","orderQty","order_qty"));
    var un=clean(r.unit)||"kg";
    var pr=num(val(r,"unitPrice","unit_price","price","price"));
    var req=clean(val(r,"requestedDueDate","requested_due_date","due","dueDate")).slice(0,10);
    var conf=clean(val(r,"confirmedDueDate","confirmed_due_date","expected","expectedDate")).slice(0,10);
    var own=clean(val(r,"requester","owner","createdBy","updatedBy"))||currentUser();

    var modal=document.createElement("div");
    modal.id=ID;
    modal.className="qmes-purchase-ledger-v1";
    modal.__base=r;
    modal.innerHTML=style()+
      '<div class="pe5-card" role="dialog" aria-modal="true" aria-label="구매발주 수정">'+
      '<div class="pe5-head"><h2>'+esc(no)+' · 구매발주 수정</h2><button type="button" class="pe5-x" data-pe5-close>×</button></div>'+
      '<form class="pe5-body" data-role="edit-form" data-no="'+esc(no)+'" data-pe5-form>'+
      '<div class="pe5-grid">'+
      '<div><label>발주번호</label><input value="'+esc(no)+'" disabled></div>'+
      '<div><label>발주일 *</label><input type="text" name="orderDate" value="'+esc(od)+'" autocomplete="off" placeholder="YYYY-MM-DD" required></div>'+
      '<div><label>협력사 *</label><input name="supplier" value="'+esc(sup)+'" required></div>'+
      '<div><label>품목명 *</label><input name="item" value="'+esc(it)+'" required></div>'+
      '<div><label>규격</label><input name="spec" value="'+esc(sp)+'"></div>'+
      '<div><label>발주수량 *</label><input type="number" step="any" name="qty" value="'+esc(q)+'" required></div>'+
      '<div><label>단위</label><select name="unit"><option'+(un==="kg"?" selected":"")+'>kg</option><option'+(un==="EA"?" selected":"")+'>EA</option><option'+(un==="L"?" selected":"")+'>L</option></select></div>'+
      '<div><label>단가</label><input type="number" step="any" name="price" value="'+esc(pr)+'"></div>'+
      '<div><label>요청입고일</label><input type="text" name="requested" value="'+esc(req)+'" autocomplete="off" placeholder="YYYY-MM-DD"></div>'+
      '<div><label>확정입고일</label><input type="text" name="confirmed" value="'+esc(conf)+'" autocomplete="off" placeholder="YYYY-MM-DD"></div>'+
      '<div><label>담당자</label><input name="owner" value="'+esc(own)+'"></div>'+
      '</div>'+
      '<div class="pe5-actions"><button type="button" class="pe5-btn pe5-cancel" data-pe5-close>취소</button><button type="submit" class="pe5-btn pe5-save">저장</button></div>'+
      '</form></div>';

    document.body.appendChild(modal);

    modal.querySelectorAll("[data-pe5-close]").forEach(function(btn){
      btn.addEventListener("click",function(e){e.preventDefault();close();});
    });
    modal.addEventListener("click",function(e){if(e.target===modal)close();});
    var form=modal.querySelector("[data-pe5-form]");
    form.addEventListener("submit",saveForm);

    try{
      if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
        window.qmesFixedCalendar.scan(modal);
      }
    }catch(_){}
    [0,30,120].forEach(function(ms){
      setTimeout(function(){
        try{
          if(window.qmesFixedCalendar&&typeof window.qmesFixedCalendar.scan==="function"){
            window.qmesFixedCalendar.scan(modal);
          }
        }catch(_){}
      },ms);
    });
  }
  async function open(no){
    if(opening)return;
    opening=true;
    close();
    opening=true;
    var row=await getRow(no);
    if(!row){opening=false;alert("수정할 발주 데이터를 찾을 수 없습니다.");return;}
    makeModal(row);
    opening=false;
  }
  async function saveForm(e){
    e.preventDefault();
    e.stopPropagation();
    if(saving)return;

    var modal=document.getElementById(ID);
    var base=modal&&modal.__base;
    if(!base)return;
    var form=e.currentTarget;
    var button=form.querySelector(".pe5-save");
    saving=true;
    if(button){button.disabled=true;button.textContent="저장 중...";}

    try{
      var fd=new FormData(form);
      var q=num(fd.get("qty")),pr=num(fd.get("price")),no=rowNo(base),user=currentUser();
      var row=Object.assign({},base,{
        id:no,purchaseNo:no,
        orderDate:clean(fd.get("orderDate")),
        supplier:clean(fd.get("supplier")),
        item:clean(fd.get("item")),material:clean(fd.get("item")),
        spec:clean(fd.get("spec")),
        qty:q,unit:clean(fd.get("unit"))||"kg",
        unitPrice:pr,price:pr,amount:q*pr,
        requestedDueDate:clean(fd.get("requested")),due:clean(fd.get("requested")),
        confirmedDueDate:clean(fd.get("confirmed")),expected:clean(fd.get("confirmed")),
        requester:clean(fd.get("owner")),owner:clean(fd.get("owner")),
        updatedAt:new Date().toISOString(),updatedBy:user
      });
      if(!row.orderDate||!row.supplier||!row.item||!(q>0)) throw new Error("필수 항목을 확인해 주세요.");

      var saved=await api("/api/purchase-orders/"+encodeURIComponent(no),{
        method:"PUT",
        headers:{"Content-Type":"application/json","Accept":"application/json"},
        body:JSON.stringify(row)
      });
      var actual=saved&&typeof saved==="object"?Object.assign({},row,saved):row;

      var rows=rowsLocal(),found=false;
      rows=rows.map(function(x){
        if(rowNo(x)===no){found=true;return actual;}
        return x;
      });
      if(!found)rows.unshift(actual);
      saveLocal(rows);

      if(typeof window.qmesSyncUpsert==="function"){
        try{
          await window.qmesSyncUpsert("inventory","erp:purchase",{
            module:"erp",schema:1,kind:"purchase",rows:rows,
            updatedAt:new Date().toISOString(),updatedBy:user
          });
        }catch(_){}
      }

      close();
      window.dispatchEvent(new CustomEvent("qmes:purchase-db-refresh"));
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"purchase"}}));
    }catch(err){
      saving=false;
      if(button){button.disabled=false;button.textContent="저장";}
      alert(err&&err.message?err.message:"수정 저장 실패");
    }
  }
  function editButtonFromEvent(e){
    var path=typeof e.composedPath==="function"?e.composedPath():[];
    for(var i=0;i<path.length;i++){
      var n=path[i];
      if(n&&n.nodeType===1&&n.tagName==="BUTTON"){
        if(n.getAttribute("data-action")==="edit")return n;
        if(clean(n.textContent)==="수정"&&(n.closest(".qpo-manage")||n.closest(".qmes-purchase-ledger-v1")))return n;
      }
    }
    return null;
  }
  function ownEvent(e){
    var btn=editButtonFromEvent(e);
    if(!btn)return;
    var no=clean(btn.getAttribute("data-no")||(btn.closest("tr")&&btn.closest("tr").getAttribute("data-no")));
    if(!no)return;
    e.preventDefault();
    e.stopPropagation();
    if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    if(e.type==="pointerdown")open(no);
  }

  // This file is deliberately loaded BEFORE v1/v2/v3/v4 legacy edit patches.
  // Register first on window capture so older handlers never open the oversized modal.
  window.addEventListener("pointerdown",ownEvent,true);
  window.addEventListener("mousedown",ownEvent,true);
  window.addEventListener("click",ownEvent,true);

  window.__qmesPurchaseEditOwnerV5={open:open,close:close};
})();