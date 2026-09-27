/* QMES Purchase Edit Force V2 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Guarantees that every visible 구매발주 "수정" button opens an edit modal.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_EDIT_FORCE_20260928_V2__) return;
  window.__QMES_PURCHASE_EDIT_FORCE_20260928_V2__=true;

  var PORTAL_ID="qmes-purchase-edit-force-20260928-v2";
  var STORE="qmes-erp-purchase-v1";
  var saving=false;

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function num(v){var n=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
  function rowNo(r){return clean(r&&(r.purchaseNo||r.purchase_no||r.no||r.id));}
  function rowDate(r){return clean(r&&(r.orderDate||r.order_date||r.date||r.createdAt||r.created_at)).slice(0,10);}
  function supplier(r){return clean(r&&(r.supplier||r.vendor||r.partner||r.supplierName||r.supplier_name));}
  function item(r){return clean(r&&(r.item||r.material||r.itemName||r.item_name||r.materialName||r.material_name));}
  function spec(r){return clean(r&&(r.spec||r.specification||r.itemSpec||r.item_spec));}
  function qty(r){return num(r&&(r.qty!=null?r.qty:r.quantity!=null?r.quantity:r.orderQty!=null?r.orderQty:r.order_qty));}
  function unit(r){return clean(r&&r.unit)||"kg";}
  function price(r){return num(r&&(r.unitPrice!=null?r.unitPrice:r.unit_price!=null?r.unit_price:r.price));}
  function requested(r){return clean(r&&(r.requestedDueDate||r.requested_due_date||r.due||r.dueDate||r.due_date)).slice(0,10);}
  function confirmed(r){return clean(r&&(r.confirmedDueDate||r.confirmed_due_date||r.expected||r.expectedDate||r.expected_date)).slice(0,10);}
  function owner(r){return clean(r&&(r.requester||r.owner||r.createdBy||r.updatedBy));}
  function notes(r){return clean(r&&(r.notes||r.remark||r.remarks));}
  function currentUserName(){
    var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    try{var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");if(s&&typeof s==="object")u=Object.assign({},u,s);}catch(_){}
    return clean(u&&(u.name||u.userName||u.username||u.uid))||"";
  }
  function readRows(){
    try{
      var v=JSON.parse(localStorage.getItem(STORE)||"[]");
      return Array.isArray(v)?v:(v&&Array.isArray(v.rows)?v.rows:[]);
    }catch(_){return [];}
  }
  function writeRows(rows){
    try{localStorage.setItem(STORE,JSON.stringify(rows));}catch(_){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
  }
  function closePortal(){
    var p=document.getElementById(PORTAL_ID);
    if(p&&p.parentNode)p.parentNode.removeChild(p);
    saving=false;
    try{if(window.qmesFixedCalendar&&window.qmesFixedCalendar.close)window.qmesFixedCalendar.close();}catch(_){}
  }
  function apiJson(url,opt){
    return fetch(url,Object.assign({credentials:"same-origin",cache:"no-store"},opt||{})).then(function(res){
      return res.json().catch(function(){return {success:false,message:"HTTP "+res.status};}).then(function(out){
        if(!res.ok||(out&&out.success===false))throw new Error((out&&out.message)||("요청 실패 ("+res.status+")"));
        return out&&Object.prototype.hasOwnProperty.call(out,"data")?out.data:out;
      });
    });
  }
  function findLocal(no){
    return readRows().find(function(r){return rowNo(r)===no;})||null;
  }
  function rowFromDom(btn){
    var tr=btn.closest("tr");
    if(!tr)return null;
    var no=clean(btn.getAttribute("data-no")||tr.getAttribute("data-no"));
    return no?findLocal(no):null;
  }
  function formHtml(r){
    return '<div class="qpo-modal wide">'+
      '<div class="qpo-modal-head"><h3>'+esc(rowNo(r))+' · 수정</h3><button type="button" class="qpo-x" data-qpo-force-close>×</button></div>'+
      '<div class="qpo-modal-body"><form data-qpo-force-form data-no="'+esc(rowNo(r))+'">'+
      '<div class="qpo-form-grid">'+
      '<div class="qpo-form-field"><label>발주번호</label><input value="'+esc(rowNo(r))+'" disabled></div>'+
      '<div class="qpo-form-field"><label>발주일 *</label><input type="date" name="orderDate" value="'+esc(rowDate(r))+'" required></div>'+
      '<div class="qpo-form-field"><label>협력사 *</label><input name="supplier" value="'+esc(supplier(r))+'" required></div>'+
      '<div class="qpo-form-field"><label>품목명 *</label><input name="item" value="'+esc(item(r))+'" required></div>'+
      '<div class="qpo-form-field"><label>규격</label><input name="spec" value="'+esc(spec(r))+'"></div>'+
      '<div class="qpo-form-field"><label>발주수량 *</label><input type="number" step="any" name="qty" value="'+esc(qty(r))+'" required></div>'+
      '<div class="qpo-form-field"><label>단위</label><select name="unit"><option'+(unit(r)==="kg"?" selected":"")+'>kg</option><option'+(unit(r)==="EA"?" selected":"")+'>EA</option><option'+(unit(r)==="L"?" selected":"")+'>L</option></select></div>'+
      '<div class="qpo-form-field"><label>단가</label><input type="number" step="any" name="price" value="'+esc(price(r))+'"></div>'+
      '<div class="qpo-form-field"><label>요청입고일</label><input type="date" name="requested" value="'+esc(requested(r))+'"></div>'+
      '<div class="qpo-form-field"><label>확정입고일</label><input type="date" name="confirmed" value="'+esc(confirmed(r))+'"></div>'+
      '<div class="qpo-form-field"><label>담당자</label><input name="owner" value="'+esc(owner(r)||currentUserName())+'"></div>'+
      '</div><div class="qpo-modal-actions"><button type="button" class="qpo-action" data-qpo-force-close>취소</button><button type="submit" class="qpo-action blue" data-qpo-force-save>저장</button></div>'+
      '</form></div></div>';
  }
  function openWithRow(r){
    closePortal();
    var p=document.createElement("div");
    p.id=PORTAL_ID;
    p.className="qmes-purchase-ledger-v1 qpo-modal-bg";
    p.innerHTML=formHtml(r);
    p.__qpoBaseRow=r;
    document.body.appendChild(p);
    try{if(window.qmesFixedCalendar&&window.qmesFixedCalendar.scan)window.qmesFixedCalendar.scan(p);}catch(_){}
  }
  function openEdit(btn){
    var no=clean(btn.getAttribute("data-no")||btn.closest("tr")&&btn.closest("tr").getAttribute("data-no"));
    var local=rowFromDom(btn)||findLocal(no);
    if(local){openWithRow(local);return;}
    if(!no){alert("수정할 발주번호를 찾을 수 없습니다.");return;}
    closePortal();
    var loading=document.createElement("div");
    loading.id=PORTAL_ID;
    loading.className="qmes-purchase-ledger-v1 qpo-modal-bg";
    loading.innerHTML='<div class="qpo-modal"><div class="qpo-modal-head"><h3>발주정보 불러오는 중...</h3><button type="button" class="qpo-x" data-qpo-force-close>×</button></div><div class="qpo-modal-body">잠시만 기다려 주세요.</div></div>';
    document.body.appendChild(loading);
    apiJson("/api/purchase-orders?_qmesFresh="+Date.now(),{headers:{"Accept":"application/json","Cache-Control":"no-cache, no-store"}}).then(function(data){
      var rows=Array.isArray(data)?data:(data&&Array.isArray(data.rows)?data.rows:[]);
      if(rows.length)writeRows(rows);
      var r=rows.find(function(x){return rowNo(x)===no;});
      if(!r)throw new Error("수정할 발주를 찾을 수 없습니다.");
      openWithRow(r);
    }).catch(function(e){closePortal();alert(e.message||"발주정보를 불러오지 못했습니다.");});
  }
  function saveShared(rows){
    writeRows(rows);
    if(typeof window.qmesSyncUpsert==="function"){
      return Promise.resolve(window.qmesSyncUpsert("inventory","erp:purchase",{module:"erp",schema:1,kind:"purchase",rows:rows,updatedAt:new Date().toISOString(),updatedBy:currentUserName()})).catch(function(e){console.warn("[Purchase edit force] shared save",e);});
    }
    return Promise.resolve();
  }
  function submit(form){
    if(saving)return;
    var portal=document.getElementById(PORTAL_ID),base=portal&&portal.__qpoBaseRow;
    if(!base){alert("수정할 발주를 찾을 수 없습니다.");return;}
    saving=true;
    var btn=form.querySelector("[data-qpo-force-save]");
    if(btn){btn.disabled=true;btn.textContent="저장 중...";}
    var fd=new FormData(form),q=num(fd.get("qty")),pr=num(fd.get("price")),no=rowNo(base),user=currentUserName();
    var row=Object.assign({},base,{
      id:no,purchaseNo:no,orderDate:clean(fd.get("orderDate")),
      supplier:clean(fd.get("supplier")),item:clean(fd.get("item")),material:clean(fd.get("item")),
      spec:clean(fd.get("spec")),qty:q,unit:clean(fd.get("unit"))||"kg",
      unitPrice:pr,price:pr,amount:q*pr,
      requestedDueDate:clean(fd.get("requested")),due:clean(fd.get("requested")),
      confirmedDueDate:clean(fd.get("confirmed")),expected:clean(fd.get("confirmed")),
      requester:clean(fd.get("owner")),owner:clean(fd.get("owner")),
      updatedAt:new Date().toISOString(),updatedBy:user
    });
    if(!row.orderDate||!row.supplier||!row.item||!(q>0)){saving=false;if(btn){btn.disabled=false;btn.textContent="저장";}alert("필수 항목을 확인해 주세요.");return;}
    apiJson("/api/purchase-orders/"+encodeURIComponent(no),{method:"PUT",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(row)})
      .then(function(saved){
        var actual=saved&&typeof saved==="object"?Object.assign({},row,saved):row;
        var rows=readRows().map(function(x){return rowNo(x)===no?actual:x;});
        return saveShared(rows);
      })
      .then(function(){
        closePortal();
        window.dispatchEvent(new CustomEvent("qmes:purchase-db-refresh"));
        window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"purchase"}}));
      })
      .catch(function(e){saving=false;if(btn){btn.disabled=false;btn.textContent="저장";}alert(e.message||"수정 저장 실패");});
  }

  function isPurchaseEditButton(el){
    if(!(el instanceof Element))return null;
    var btn=el.closest("button");
    if(!btn)return null;
    if(btn.closest("#"+PORTAL_ID))return null;
    var ledger=btn.closest(".qmes-purchase-ledger-v1");
    if(!ledger)return null;
    if(btn.getAttribute("data-action")==="edit")return btn;
    if(clean(btn.textContent)==="수정"&&btn.closest(".qpo-manage"))return btn;
    return null;
  }

  document.addEventListener("click",function(event){
    var btn=isPurchaseEditButton(event.target);
    if(btn){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
      openEdit(btn);
      return;
    }
    var el=event.target instanceof Element?event.target:null;
    if(!el)return;
    var portal=el.closest("#"+PORTAL_ID);
    if(!portal)return;
    if(el.closest("[data-qpo-force-close]")){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();closePortal();return;}
    if(el===portal){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();}
  },true);

  document.addEventListener("submit",function(event){
    var form=event.target instanceof Element?event.target.closest("[data-qpo-force-form]"):null;
    if(!form)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();
    submit(form);
  },true);

  document.addEventListener("keydown",function(event){
    if(event.key==="Escape"&&document.getElementById(PORTAL_ID)){event.preventDefault();closePortal();}
  },true);
})();