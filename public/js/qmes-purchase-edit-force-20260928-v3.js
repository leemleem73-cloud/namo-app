/* QMES Purchase Edit Force V3 - 2026-09-28
 * ADD-ONLY / NO OVERWRITE.
 * Earliest window-capture handler + top-level body portal.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_EDIT_FORCE_20260928_V3__) return;
  window.__QMES_PURCHASE_EDIT_FORCE_20260928_V3__=true;

  var ID="qmes-purchase-edit-force-v3";
  var STORE="qmes-erp-purchase-v1";
  var opening=false,saving=false;

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function num(v){var n=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
  function rowNo(r){return clean(r&&(r.purchaseNo||r.purchase_no||r.no||r.id));}
  function val(r,a,b,c,d){return r&&(r[a]!=null?r[a]:r[b]!=null?r[b]:r[c]!=null?r[c]:r[d]);}
  function rowsLocal(){
    if(Array.isArray(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__)&&window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__.length) return window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__;
    try{var v=JSON.parse(localStorage.getItem(STORE)||"[]");return Array.isArray(v)?v:(v&&Array.isArray(v.rows)?v.rows:[]);}catch(_){return [];}
  }
  function saveLocal(rows){
    try{localStorage.setItem(STORE,JSON.stringify(rows));}catch(_){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__=rows;
  }
  function currentUser(){
    var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    try{var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");if(s&&typeof s==="object")u=Object.assign({},u,s);}catch(_){}
    return clean(u.name||u.userName||u.username||u.uid);
  }
  function buttonFromEvent(e){
    var path=typeof e.composedPath==="function"?e.composedPath():[];
    for(var i=0;i<path.length;i++){
      var n=path[i];
      if(n&&n.nodeType===1&&n.tagName==="BUTTON"){
        if(n.getAttribute("data-action")==="edit") return n;
        if(clean(n.textContent)==="수정"&&(n.closest(".qpo-manage")||n.closest(".qmes-purchase-ledger-v1"))) return n;
      }
    }
    var t=e.target&&e.target.nodeType===1?e.target:null;
    var b=t&&t.closest?t.closest("button"):null;
    if(!b)return null;
    if(b.getAttribute("data-action")==="edit")return b;
    if(clean(b.textContent)==="수정"&&(b.closest(".qpo-manage")||b.closest(".qmes-purchase-ledger-v1")))return b;
    return null;
  }
  function close(){
    var old=document.getElementById(ID);if(old)old.remove();
    opening=false;saving=false;
  }
  async function api(url,opt){
    var r=await fetch(url,Object.assign({credentials:"same-origin",cache:"no-store"},opt||{}));
    var o=await r.json().catch(function(){return {success:false,message:"HTTP "+r.status};});
    if(!r.ok||(o&&o.success===false))throw new Error((o&&o.message)||("요청 실패 ("+r.status+")"));
    return o&&Object.prototype.hasOwnProperty.call(o,"data")?o.data:o;
  }
  function syncRows(data){
    var arr=Array.isArray(data)?data:[];
    var rec=arr.find(function(x){return clean(x&&(x.record_key||x.recordKey||x.key))==="erp:purchase";});
    var p=rec&&rec.payload&&typeof rec.payload==="object"?rec.payload:null;
    return p&&Array.isArray(p.rows)?p.rows:[];
  }
  async function getRow(no){
    var r=rowsLocal().find(function(x){return rowNo(x)===no;});
    if(r)return r;
    try{
      var data=await api("/api/qmes-sync/inventory?_qmesEdit="+Date.now(),{headers:{"Accept":"application/json","Cache-Control":"no-cache"}});
      var rows=syncRows(data);
      if(rows.length)saveLocal(rows);
      return rows.find(function(x){return rowNo(x)===no;})||null;
    }catch(_){return null;}
  }
  function style(){
    return '<style>'+
    '#'+ID+'{position:fixed!important;inset:0!important;z-index:2147483647!important;background:rgba(10,25,40,.48)!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:20px!important}'+
    '#'+ID+' .pe3-box{width:min(980px,96vw)!important;max-height:92vh!important;overflow:auto!important;background:#fff!important;border-radius:12px!important;box-shadow:0 24px 80px rgba(0,0,0,.35)!important;font-family:Pretendard,Arial,sans-serif!important}'+
    '#'+ID+' .pe3-head{position:sticky;top:0;z-index:2;background:#fff;padding:16px 18px;border-bottom:1px solid #d8e2ea;display:flex;align-items:center;justify-content:space-between}'+
    '#'+ID+' h3{margin:0;font-size:19px;color:#17324a}#'+ID+' .pe3-x{border:0;background:none;font-size:26px;cursor:pointer}'+
    '#'+ID+' .pe3-body{padding:18px}#'+ID+' .pe3-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}'+
    '#'+ID+' label{display:block;font-weight:800;color:#5d7080;margin-bottom:5px}#'+ID+' input,#'+ID+' select{width:100%;box-sizing:border-box;border:1px solid #c9d6e0;border-radius:7px;padding:10px;background:#fff}'+
    '#'+ID+' .pe3-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:18px}#'+ID+' button.pe3-btn{border:1px solid #bfd0dc;background:#fff;border-radius:7px;padding:9px 18px;font-weight:800;cursor:pointer}#'+ID+' button.pe3-save{background:#1596cf;color:#fff;border-color:#1596cf}'+
    '@media(max-width:800px){#'+ID+' .pe3-grid{grid-template-columns:1fr}}'+
    '</style>';
  }
  function modal(r){
    var no=rowNo(r),od=clean(val(r,"orderDate","order_date","date","createdAt")).slice(0,10);
    var sup=clean(val(r,"supplier","vendor","partner","supplierName"));
    var it=clean(val(r,"item","material","itemName","materialName"));
    var sp=clean(val(r,"spec","specification","itemSpec","item_spec"));
    var q=num(val(r,"qty","quantity","orderQty","order_qty"));
    var un=clean(r.unit)||"kg";
    var pr=num(val(r,"unitPrice","unit_price","price","price"));
    var req=clean(val(r,"requestedDueDate","requested_due_date","due","dueDate")).slice(0,10);
    var conf=clean(val(r,"confirmedDueDate","confirmed_due_date","expected","expectedDate")).slice(0,10);
    var own=clean(val(r,"requester","owner","createdBy","updatedBy"))||currentUser();
    var p=document.createElement("div");p.id=ID;p.__base=r;
    p.innerHTML=style()+'<div class="pe3-box"><div class="pe3-head"><h3>'+esc(no)+' · 구매발주 수정</h3><button type="button" class="pe3-x" data-pe3-close>×</button></div><div class="pe3-body"><form data-pe3-form>'+
      '<div class="pe3-grid">'+
      '<div><label>발주번호</label><input value="'+esc(no)+'" disabled></div>'+
      '<div><label>발주일 *</label><input type="date" name="orderDate" value="'+esc(od)+'" required></div>'+
      '<div><label>협력사 *</label><input name="supplier" value="'+esc(sup)+'" required></div>'+
      '<div><label>품목명 *</label><input name="item" value="'+esc(it)+'" required></div>'+
      '<div><label>규격</label><input name="spec" value="'+esc(sp)+'"></div>'+
      '<div><label>발주수량 *</label><input type="number" step="any" name="qty" value="'+esc(q)+'" required></div>'+
      '<div><label>단위</label><select name="unit"><option'+(un==="kg"?" selected":"")+'>kg</option><option'+(un==="EA"?" selected":"")+'>EA</option><option'+(un==="L"?" selected":"")+'>L</option></select></div>'+
      '<div><label>단가</label><input type="number" step="any" name="price" value="'+esc(pr)+'"></div>'+
      '<div><label>요청입고일</label><input type="date" name="requested" value="'+esc(req)+'"></div>'+
      '<div><label>확정입고일</label><input type="date" name="confirmed" value="'+esc(conf)+'"></div>'+
      '<div><label>담당자</label><input name="owner" value="'+esc(own)+'"></div>'+
      '</div><div class="pe3-actions"><button type="button" class="pe3-btn" data-pe3-close>취소</button><button type="submit" class="pe3-btn pe3-save" data-pe3-save>저장</button></div>'+
      '</form></div></div>';
    document.body.appendChild(p);
  }
  async function open(no){
    if(opening)return;opening=true;close();opening=true;
    var r=await getRow(no);
    if(!r){opening=false;alert("수정할 발주 데이터를 찾을 수 없습니다.");return;}
    modal(r);opening=false;
  }
  async function submit(form){
    if(saving)return;
    var p=document.getElementById(ID),base=p&&p.__base;if(!base)return;
    saving=true;var b=form.querySelector("[data-pe3-save]");if(b){b.disabled=true;b.textContent="저장 중...";}
    try{
      var fd=new FormData(form),no=rowNo(base),q=num(fd.get("qty")),pr=num(fd.get("price")),user=currentUser();
      var row=Object.assign({},base,{id:no,purchaseNo:no,orderDate:clean(fd.get("orderDate")),supplier:clean(fd.get("supplier")),item:clean(fd.get("item")),material:clean(fd.get("item")),spec:clean(fd.get("spec")),qty:q,unit:clean(fd.get("unit"))||"kg",unitPrice:pr,price:pr,amount:q*pr,requestedDueDate:clean(fd.get("requested")),due:clean(fd.get("requested")),confirmedDueDate:clean(fd.get("confirmed")),expected:clean(fd.get("confirmed")),requester:clean(fd.get("owner")),owner:clean(fd.get("owner")),updatedAt:new Date().toISOString(),updatedBy:user});
      if(!row.orderDate||!row.supplier||!row.item||!(q>0))throw new Error("필수 항목을 확인해 주세요.");
      var saved=await api("/api/purchase-orders/"+encodeURIComponent(no),{method:"PUT",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(row)});
      var actual=saved&&typeof saved==="object"?Object.assign({},row,saved):row;
      var rows=rowsLocal();var found=false;
      rows=rows.map(function(x){if(rowNo(x)===no){found=true;return actual;}return x;});if(!found)rows.unshift(actual);
      saveLocal(rows);
      if(typeof window.qmesSyncUpsert==="function"){try{await window.qmesSyncUpsert("inventory","erp:purchase",{module:"erp",schema:1,kind:"purchase",rows:rows,updatedAt:new Date().toISOString(),updatedBy:user});}catch(_){}}
      close();
      window.dispatchEvent(new CustomEvent("qmes:purchase-db-refresh"));
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"purchase"}}));
    }catch(e){saving=false;if(b){b.disabled=false;b.textContent="저장";}alert(e.message||"수정 저장 실패");}
  }

  function earliest(e){
    var btn=buttonFromEvent(e);if(!btn)return;
    var no=clean(btn.getAttribute("data-no")||(btn.closest("tr")&&btn.closest("tr").getAttribute("data-no")));
    if(!no)return;
    e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();
    open(no);
  }
  window.addEventListener("pointerdown",earliest,true);
  window.addEventListener("mousedown",earliest,true);
  window.addEventListener("click",earliest,true);

  document.addEventListener("click",function(e){
    var t=e.target&&e.target.nodeType===1?e.target:null;if(!t)return;
    var p=t.closest("#"+ID);if(!p)return;
    if(t.closest("[data-pe3-close]")){e.preventDefault();e.stopPropagation();close();}
  },true);
  document.addEventListener("submit",function(e){
    var f=e.target&&e.target.matches&&e.target.matches("[data-pe3-form]")?e.target:null;if(!f)return;
    e.preventDefault();e.stopPropagation();submit(f);
  },true);

  window.__qmesPurchaseEditForceV3=open;
})();