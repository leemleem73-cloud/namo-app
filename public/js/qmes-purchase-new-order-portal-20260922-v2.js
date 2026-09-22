/* QMES Purchase New Order Portal V2 - 2026-09-22
 * ADD-ONLY. New Purchase form is rendered under document.body so
 * purchase-ledger re-renders cannot remove the open form.
 */
(function(){
  "use strict";
  if(window.__QMES_PURCHASE_NEW_ORDER_PORTAL_20260922_V2__) return;
  window.__QMES_PURCHASE_NEW_ORDER_PORTAL_20260922_V2__=true;

  var PORTAL_ID="qmes-purchase-new-order-portal-20260922-v2";
  var STORE="qmes-erp-purchase-v1";
  var saving=false;

  function clean(v){return String(v==null?"":v).replace(/\s+/g," ").trim();}
  function esc(v){return String(v==null?"":v).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#39;");}
  function num(v){var n=Number(String(v==null?"":v).replace(/[^0-9.-]/g,""));return Number.isFinite(n)?n:0;}
  function today(){var d=new Date();return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");}
  function currentUserName(){
    var u=window.__QMES_CURRENT_USER__||window.__QMES_USER__||{};
    try{var s=JSON.parse(sessionStorage.getItem("qmes-current-user-v1")||"null");if(s&&typeof s==="object")u=Object.assign({},u,s);}catch(_){}
    return clean(u&&(u.name||u.userName||u.username||u.uid))||"";
  }
  function readRows(){
    try{var v=JSON.parse(localStorage.getItem(STORE)||"[]");return Array.isArray(v)?v:(v&&Array.isArray(v.rows)?v.rows:[]);}catch(_){return [];}
  }
  function rowNo(r){return clean(r&&(r.purchaseNo||r.purchase_no||r.no||r.id));}
  function nextNo(){
    var stamp=today().slice(2).replace(/-/g,""),prefix="PO-"+stamp+"-";
    var max=readRows().reduce(function(m,r){var id=rowNo(r),n=id.indexOf(prefix)===0?Number(id.slice(prefix.length)):0;return Number.isFinite(n)?Math.max(m,n):m;},0);
    return prefix+String(max+1).padStart(3,"0");
  }
  function closePortal(){
    document.getElementById(PORTAL_ID)?.remove();
    saving=false;
    try{window.qmesFixedCalendar&&window.qmesFixedCalendar.close&&window.qmesFixedCalendar.close();}catch(_){}
  }
  function openPortal(){
    closePortal();
    var p=document.createElement("div"),user=currentUserName();
    p.id=PORTAL_ID;
    p.className="qmes-purchase-ledger-v1 qpo-modal-bg";
    p.innerHTML=
      '<div class="qpo-modal">'+
      '<div class="qpo-modal-head"><h3>신규 발주 등록</h3><button type="button" class="qpo-x" data-qpo-portal-close>×</button></div>'+
      '<div class="qpo-modal-body"><form data-role="new-form" data-qpo-portal-form>'+
      '<div class="qpo-form-grid">'+
      '<div class="qpo-form-field"><label>발주일 *</label><input type="text" name="orderDate" value="'+esc(today())+'" required autocomplete="off"></div>'+
      '<div class="qpo-form-field"><label>협력사 *</label><input name="supplier" required></div>'+
      '<div class="qpo-form-field"><label>품목명 *</label><input name="item" required></div>'+
      '<div class="qpo-form-field"><label>규격</label><input name="spec"></div>'+
      '<div class="qpo-form-field"><label>발주수량 *</label><input type="number" step="any" name="qty" required></div>'+
      '<div class="qpo-form-field"><label>단위</label><select name="unit"><option>kg</option><option>EA</option><option>L</option></select></div>'+
      '<div class="qpo-form-field"><label>단가</label><input type="number" step="any" name="price"></div>'+
      '<div class="qpo-form-field"><label>요청입고일</label><input type="text" name="requested" autocomplete="off"></div>'+
      '<div class="qpo-form-field"><label>확정입고일</label><input type="text" name="confirmed" autocomplete="off"></div>'+
      '<div class="qpo-form-field"><label>담당자</label><input name="owner" value="'+esc(user)+'"></div>'+
      '<div class="qpo-form-field full"><label>비고</label><textarea name="notes"></textarea></div>'+
      '</div><div class="qpo-modal-actions">'+
      '<button type="button" class="qpo-action" data-qpo-portal-close>취소</button>'+
      '<button type="submit" class="qpo-action blue" data-qpo-portal-save>저장</button>'+
      '</div></form></div></div>';
    document.body.appendChild(p);
    try{window.qmesFixedCalendar&&window.qmesFixedCalendar.scan&&window.qmesFixedCalendar.scan(p);}catch(_){}
    setTimeout(function(){try{window.qmesFixedCalendar&&window.qmesFixedCalendar.scan&&window.qmesFixedCalendar.scan(p);}catch(_){}},0);
  }
  async function apiJson(url,opt){
    var res=await fetch(url,Object.assign({credentials:"same-origin",cache:"no-store"},opt||{}));
    var out=await res.json().catch(function(){return {success:false,message:"HTTP "+res.status};});
    if(!res.ok||(out&&out.success===false)) throw new Error((out&&out.message)||("요청 실패 ("+res.status+")"));
    return out&&Object.prototype.hasOwnProperty.call(out,"data")?out.data:out;
  }
  async function saveShared(rows){
    try{localStorage.setItem(STORE,JSON.stringify(rows));}catch(_){}
    if(typeof window.qmesSyncUpsert==="function"){
      try{await window.qmesSyncUpsert("inventory","erp:purchase",{module:"erp",schema:1,kind:"purchase",rows:rows,updatedAt:new Date().toISOString(),updatedBy:currentUserName()});}catch(e){console.warn("[Purchase portal] shared save",e);}
    }
  }
  async function submit(form){
    if(saving)return;
    saving=true;
    var btn=form.querySelector("[data-qpo-portal-save]");
    if(btn){btn.disabled=true;btn.textContent="저장 중...";}
    try{
      var fd=new FormData(form),q=num(fd.get("qty")),pr=num(fd.get("price")),no=nextNo(),user=currentUserName();
      var row={id:no,purchaseNo:no,orderDate:clean(fd.get("orderDate"))||today(),supplier:clean(fd.get("supplier")),item:clean(fd.get("item")),material:clean(fd.get("item")),spec:clean(fd.get("spec")),qty:q,unit:clean(fd.get("unit"))||"kg",unitPrice:pr,price:pr,amount:q*pr,requestedDueDate:clean(fd.get("requested")),due:clean(fd.get("requested")),confirmedDueDate:clean(fd.get("confirmed")),expected:clean(fd.get("confirmed")),requester:clean(fd.get("owner"))||user,owner:clean(fd.get("owner"))||user,notes:clean(fd.get("notes")),approvalStatus:"구매검토",approval:"구매검토",receiptStatus:"미입고",receiving:"미입고",receivedQty:0,iqcStatus:"계획 대기",iqc:"계획 대기",status:"결재대기",createdAt:new Date().toISOString(),createdBy:user,updatedAt:new Date().toISOString(),updatedBy:user};
      if(!row.supplier)throw new Error("협력사를 입력해 주세요.");
      if(!row.item)throw new Error("품목명을 입력해 주세요.");
      if(!(q>0))throw new Error("발주수량을 입력해 주세요.");
      var saved=await apiJson("/api/purchase-orders",{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(row)});
      var actual=saved&&typeof saved==="object"?Object.assign({},row,saved):row;
      var rows=[actual].concat(readRows().filter(function(x){return rowNo(x)!==rowNo(actual);}));
      await saveShared(rows);
      closePortal();
      window.dispatchEvent(new CustomEvent("qmes:purchase-db-refresh"));
      window.dispatchEvent(new CustomEvent("qmes:erp-data-changed",{detail:{kind:"purchase"}}));
    }catch(e){
      saving=false;
      if(btn){btn.disabled=false;btn.textContent="저장";}
      alert(e&&e.message?e.message:"신규 발주 저장 실패");
    }
  }

  document.addEventListener("click",function(event){
    var el=event.target instanceof Element?event.target:null;
    if(!el)return;
    var newBtn=el.closest('.qmes-purchase-ledger-v1 [data-action="new"]');
    if(newBtn&&!newBtn.closest("#"+PORTAL_ID)){
      event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openPortal();return;
    }
    var portal=el.closest("#"+PORTAL_ID);
    if(!portal)return;
    if(el.closest("[data-qpo-portal-close]")){event.preventDefault();event.stopPropagation();closePortal();return;}
    if(el===portal){event.preventDefault();event.stopPropagation();closePortal();}
  },true);

  document.addEventListener("submit",function(event){
    var form=event.target instanceof Element?event.target.closest("[data-qpo-portal-form]"):null;
    if(!form)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();submit(form);
  },true);

  document.addEventListener("keydown",function(event){
    if(event.key==="Escape"&&document.getElementById(PORTAL_ID)){event.preventDefault();closePortal();}
  },true);
})();