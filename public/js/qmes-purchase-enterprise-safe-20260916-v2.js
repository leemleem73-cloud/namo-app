/* NAMO QMES - purchase enterprise safe view v2 (2026-09-16)
 * Additive, purchase-page-only UI layer.
 * No background POST/PUT/DELETE, no data rebuild, no dashboard/global layout override.
 */
(function(){
  'use strict';
  if(window.__QMES_PURCHASE_ENTERPRISE_SAFE_V2__) return;
  window.__QMES_PURCHASE_ENTERPRISE_SAFE_V2__ = true;

  const VERSION = '20260916-v2';
  const STORAGE_KEY = 'qmes-erp-purchase-v1';
  const HOST_CLASS = 'qpx-enterprise-host';
  const ROOT_CLASS = 'qpx-enterprise-safe-v2';
  const clean = v => String(v == null ? '' : v).replace(/\s+/g,' ').trim();
  const num = v => {
    if(typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const n = Number(String(v == null ? '' : v).replace(/[^0-9.-]/g,''));
    return Number.isFinite(n) ? n : 0;
  };
  const esc = v => String(v == null ? '' : v)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const lower = v => clean(v).toLowerCase();
  const wonFmt = new Intl.NumberFormat('ko-KR');
  const qtyFmt = new Intl.NumberFormat('ko-KR',{maximumFractionDigits:3});
  const won = v => wonFmt.format(Math.round(num(v))) + '원';
  const qty = v => qtyFmt.format(num(v));

  const state = {
    rows: [],
    tab: '전체',
    from: '',
    to: '',
    supplier: '',
    item: '',
    poStatus: '전체',
    receiptStatus: '전체',
    q: '',
    page: 1,
    pageSize: 10,
    root: null,
    formOpen: false,
    dataSig: '',
    toastTimer: 0,
    syncBusy: false
  };

  function monthRange(){
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const last = new Date(y,d.getMonth()+1,0).getDate();
    return [y+'-'+m+'-01', y+'-'+m+'-'+String(last).padStart(2,'0')];
  }
  [state.from,state.to] = monthRange();

  function findRoot(){
    const root = document.querySelector('.qmes-purchase-live');
    if(!root) return null;
    const header = root.querySelector('.qmes-purchase-page-head,.qerp-head');
    const headerText = clean(header && header.textContent);
    const rootText = clean(root.textContent).slice(0,1200);
    if(/구매\s*[·ㆍ]?\s*발주관리|구매\s*발주\s*현황|신규\s*구매\s*발주/.test(headerText)) return root;
    if(root.querySelector('.qmes-purchase-page-head') && /구매/.test(rootText) && /발주/.test(rootText)) return root;
    return null;
  }

  function rawNo(r){ return clean(r.purchaseNo || r.purchase_no || r.no || r.id); }
  function orderDate(r){ return clean(r.orderDate || r.order_date || r.date || r.createdAt || r.created_at).slice(0,10); }
  function requestedDue(r){ return clean(r.requestedDueDate || r.requested_due_date || r.due || r.dueDate || r.due_date).slice(0,10); }
  function supplierOf(r){ return clean(r.supplier || r.vendor || r.partner || r.supplierName || r.supplier_name); }
  function itemOf(r){ return clean(r.item || r.material || r.itemName || r.item_name || r.materialName || r.material_name); }
  function specOf(r){ return clean(r.spec || r.specification || r.itemSpec || r.item_spec); }
  function unitOf(r){ return clean(r.unit || 'kg') || 'kg'; }
  function orderedQty(r){ return num(r.qty ?? r.quantity ?? r.orderQty ?? r.order_qty); }
  function receivedQty(r){ return num(r.receivedQty ?? r.received_qty ?? r.receiptQty ?? r.receipt_qty); }
  function unitPrice(r){ return num(r.unitPrice ?? r.unit_price ?? r.price); }
  function supplyAmount(r){
    const v = num(r.supplyAmount ?? r.supply_amount ?? r.amount);
    return v || Math.round(orderedQty(r) * unitPrice(r));
  }
  function vatAmount(r){
    const v = num(r.vatAmount ?? r.vat_amount ?? r.vat);
    return v || Math.round(supplyAmount(r) * 0.1);
  }
  function totalAmount(r){
    const v = num(r.totalAmount ?? r.total_amount ?? r.total);
    return v || supplyAmount(r) + vatAmount(r);
  }
  function approvalText(r){ return clean(r.approvalStatus || r.approval_status || r.approval || r.status); }
  function receiptText(r){ return clean(r.receiptStatus || r.receipt_status || r.receipt || r.inboundStatus || r.inbound_status); }
  function iqcText(r){ return clean(r.iqcStatus || r.iqc_status || r.iqc || ''); }
  function iqcRequired(r){
    const v = r.iqcRequired ?? r.iqc_required;
    if(v === false || v === 0 || lower(v) === 'false' || clean(v) === 'N') return false;
    return true;
  }
  function isApprovalPending(r){
    const t = approvalText(r);
    return /결재대기|결재\s*대기|승인대기|상신|구매검토|검토중|대기/.test(t) &&
      !/완료|승인완료|결재완료|발주완료/.test(t);
  }
  function isReceiptComplete(r){
    const oq = orderedQty(r), rq = receivedQty(r), t = receiptText(r);
    return /입고완료|완료/.test(t) || (oq > 0 && rq >= oq);
  }
  function isPartial(r){
    const oq = orderedQty(r), rq = receivedQty(r), t = receiptText(r);
    return /부분입고/.test(t) || (rq > 0 && oq > rq);
  }
  function isIqcPending(r){
    if(!iqcRequired(r)) return false;
    const t = iqcText(r);
    if(!t) return isReceiptComplete(r) || isPartial(r);
    return !/완료|합격|적합|pass|기존\s*erp\s*반영/.test(lower(t));
  }
  function poStatus(r){
    if(isApprovalPending(r)) return '결재대기';
    const t = approvalText(r);
    if(/취소|반려/.test(t)) return t.includes('반려') ? '반려' : '취소';
    return '발주완료';
  }
  function receiptStatus(r){
    if(isReceiptComplete(r)) return '입고완료';
    if(isPartial(r)) return '부분입고';
    return '미입고';
  }
  function iqcStatus(r){
    if(!iqcRequired(r)) return '대상아님';
    const t = iqcText(r);
    if(/검사중|진행/.test(t)) return '검사중';
    if(/완료|합격|적합|pass|기존\s*erp\s*반영/.test(lower(t))) return '완료';
    return '대기';
  }
  function rowKey(r,i){ return rawNo(r) || ('ROW-'+i); }

  function normalizeRows(input){
    let rows = Array.isArray(input) ? input : [];
    return rows.filter(r=>r && typeof r === 'object' && rawNo(r))
      .slice()
      .sort((a,b)=>{
        const d = orderDate(b).localeCompare(orderDate(a));
        return d || rawNo(b).localeCompare(rawNo(a),undefined,{numeric:true});
      });
  }

  function sourceRows(){
    if(Array.isArray(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__) && window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__.length){
      return normalizeRows(window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__);
    }
    try{
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if(Array.isArray(parsed)) return normalizeRows(parsed);
      if(Array.isArray(parsed && parsed.rows)) return normalizeRows(parsed.rows);
    }catch(_){}
    return [];
  }

  function dataSignature(rows){
    return rows.map((r,i)=>[
      rowKey(r,i), orderDate(r), orderedQty(r), receivedQty(r), unitPrice(r),
      approvalText(r), receiptText(r), iqcText(r), clean(r.updatedAt || r.updated_at)
    ].join('|')).join('~');
  }

  function saveReadCache(rows){
    try{ localStorage.setItem(STORAGE_KEY,JSON.stringify(rows)); }catch(_){}
    window.__QMES_PURCHASE_AUTHORITATIVE_ROWS__ = rows;
  }

  function css(){
    if(document.getElementById('qpx-enterprise-safe-v2-style')) return;
    const s = document.createElement('style');
    s.id = 'qpx-enterprise-safe-v2-style';
    s.textContent = `
.qmes-purchase-live.${ROOT_CLASS}{font-family:inherit!important;position:relative!important}
.qmes-purchase-live.${ROOT_CLASS} [data-qpx-hidden-original="1"]{display:none!important}
.qmes-purchase-live.${ROOT_CLASS} .${HOST_CLASS}{display:block!important;color:#17324d;min-width:0}
.qmes-purchase-live.${ROOT_CLASS}.qpx-modal-open .${HOST_CLASS}{display:none!important}
.qmes-purchase-live.${ROOT_CLASS} .qpx-shell{display:flex;flex-direction:column;gap:12px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-head{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;padding:2px 2px 0}
.qmes-purchase-live.${ROOT_CLASS} .qpx-title{margin:0;font-size:23px;line-height:1.25;font-weight:900;color:#172f48;letter-spacing:-.5px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-sub{margin-top:5px;font-size:12px;color:#647b91;font-weight:650}
.qmes-purchase-live.${ROOT_CLASS} .qpx-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.qmes-purchase-live.${ROOT_CLASS} .qpx-btn{height:36px;padding:0 14px;border:1px solid #c6d6e5;border-radius:7px;background:#fff;color:#35516c;font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap}
.qmes-purchase-live.${ROOT_CLASS} .qpx-btn:hover{background:#f4f9fd;border-color:#8cb8da}
.qmes-purchase-live.${ROOT_CLASS} .qpx-btn.primary{background:#1483c9;border-color:#1483c9;color:#fff;box-shadow:0 2px 5px rgba(20,131,201,.18)}
.qmes-purchase-live.${ROOT_CLASS} .qpx-btn.primary:hover{background:#0d72b5}
.qmes-purchase-live.${ROOT_CLASS} .qpx-btn:disabled{opacity:.55;cursor:default}
.qmes-purchase-live.${ROOT_CLASS} .qpx-cards{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card{min-height:88px;border:1px solid #dce6ef;border-radius:9px;background:#fff;display:flex;align-items:center;gap:13px;padding:14px 16px;box-shadow:0 1px 3px rgba(24,55,84,.05);cursor:pointer}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card:hover{border-color:#afd0ea;box-shadow:0 3px 9px rgba(24,55,84,.08)}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card-icon{width:44px;height:44px;border-radius:10px;display:grid;place-items:center;font-size:22px;font-weight:900;flex:none}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card:nth-child(1) .qpx-card-icon{background:#edf6ff;color:#1477c7}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card:nth-child(2) .qpx-card-icon{background:#ecfbf2;color:#159659}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card:nth-child(3) .qpx-card-icon{background:#fff5e8;color:#dd7c11}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card:nth-child(4) .qpx-card-icon{background:#f3efff;color:#6d4acb}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card-label{font-size:12px;font-weight:850;color:#405872}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card-count{font-size:20px;line-height:1.05;font-weight:950;color:#172f48;margin-top:2px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-card-money{font-size:10px;color:#74879a;margin-top:4px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-filter{border:1px solid #dce6ef;border-radius:9px;background:#fff;padding:14px 16px;box-shadow:0 1px 3px rgba(24,55,84,.04)}
.qmes-purchase-live.${ROOT_CLASS} .qpx-filter-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:900;color:#203a53;margin-bottom:12px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-filter-grid{display:grid;grid-template-columns:1.2fr .85fr 1.15fr .8fr .8fr 1.3fr auto auto;gap:8px;align-items:end}
.qmes-purchase-live.${ROOT_CLASS} .qpx-field{min-width:0}
.qmes-purchase-live.${ROOT_CLASS} .qpx-field>span{display:block;font-size:10px;font-weight:800;color:#64798d;margin:0 0 5px 2px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-field input,.qmes-purchase-live.${ROOT_CLASS} .qpx-field select{width:100%;height:34px;border:1px solid #cbd9e6;border-radius:6px;background:#fff;color:#263f58;padding:0 9px;font-size:11px;outline:none;box-sizing:border-box}
.qmes-purchase-live.${ROOT_CLASS} .qpx-field input:focus,.qmes-purchase-live.${ROOT_CLASS} .qpx-field select:focus{border-color:#45a1dc;box-shadow:0 0 0 2px rgba(69,161,220,.10)}
.qmes-purchase-live.${ROOT_CLASS} .qpx-date-wrap{display:flex;align-items:center;gap:5px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-date-wrap input{min-width:0}
.qmes-purchase-live.${ROOT_CLASS} .qpx-filter .qpx-btn{height:34px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-list-card{border:1px solid #dce6ef;border-radius:9px;background:#fff;overflow:hidden;box-shadow:0 1px 3px rgba(24,55,84,.04)}
.qmes-purchase-live.${ROOT_CLASS} .qpx-tabs{display:flex;align-items:center;gap:5px;padding:10px 12px 9px;border-bottom:1px solid #e3ebf2;overflow-x:auto}
.qmes-purchase-live.${ROOT_CLASS} .qpx-tab{height:31px;padding:0 11px;border:1px solid #d6e1eb;border-radius:6px;background:#f7f9fb;color:#526a81;font-size:10px;font-weight:850;cursor:pointer;white-space:nowrap}
.qmes-purchase-live.${ROOT_CLASS} .qpx-tab.active{background:#2386c8;border-color:#2386c8;color:#fff}
.qmes-purchase-live.${ROOT_CLASS} .qpx-tab em{font-style:normal;margin-left:4px;padding:1px 6px;border-radius:10px;background:rgba(30,116,179,.10);color:#2375b0}
.qmes-purchase-live.${ROOT_CLASS} .qpx-tab.active em{background:rgba(255,255,255,.22);color:#fff}
.qmes-purchase-live.${ROOT_CLASS} .qpx-total-right{margin-left:auto;font-size:10px;color:#718397;font-weight:800;white-space:nowrap}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table-scroll{overflow:auto;max-height:calc(100vh - 430px);min-height:255px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table{width:100%;min-width:1420px;border-collapse:separate;border-spacing:0;font-size:10px}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table th{position:sticky;top:0;z-index:2;height:36px;padding:0 7px;background:#f0f5f9;border-bottom:1px solid #d4e0ea;color:#3f5870;font-size:10px;font-weight:900;text-align:center;white-space:nowrap}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table td{height:38px;padding:5px 7px;border-bottom:1px solid #edf2f6;color:#334e67;text-align:center;white-space:nowrap;background:#fff}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table tbody tr:nth-child(even) td{background:#fbfdfe}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table tbody tr:hover td{background:#f1f8fd}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table .left{text-align:left}
.qmes-purchase-live.${ROOT_CLASS} .qpx-table .num{text-align:right;font-variant-numeric:tabular-nums}
.qmes-purchase-live.${ROOT_CLASS} .qpx-link{border:0;background:transparent;color:#1b70b3;font-size:10px;font-weight:850;padding:0;cursor:pointer;text-decoration:none}
.qmes-purchase-live.${ROOT_CLASS} .qpx-link:hover{text-decoration:underline}
.qmes-purchase-live.${ROOT_CLASS} .qpx-badge{display:inline-flex;align-items:center;justify-content:center;min-width:50px;height:23px;padding:0 8px;border-radius:12px;font-size:9px;font-weight:900}
.qmes-purchase-live.${ROOT_CLASS} .qpx-badge.gray{background:#eef1f4;color:#647485}
.qmes-purchase-live.${ROOT_CLASS} .qpx-badge.orange{background:#fff1df;color:#d87b15}
.qmes-purchase-live.${ROOT_CLASS} .qpx-badge.green{background:#e7f8ed;color:#18864b}
.qmes-purchase-live.${ROOT_CLASS} .qpx-badge.purple{background:#f0ebff;color:#6945c0}
.qmes-purchase-live.${ROOT_CLASS} .qpx-badge.blue{background:#e7f4ff;color:#187bc0}
.qmes-purchase-live.${ROOT_CLASS} .qpx-badge.red{background:#ffeaea;color:#c94444}
.qmes-purchase-live.${ROOT_CLASS} .qpx-manage{display:flex;gap:5px;justify-content:center}
.qmes-purchase-live.${ROOT_CLASS} .qpx-manage button{height:25px;padding:0 10px;border:1px solid #c5d6e5;border-radius:5px;background:#fff;color:#37536d;font-size:9px;font-weight:900;cursor:pointer}
.qmes-purchase-live.${ROOT_CLASS} .qpx-manage button:first-child{background:#2187c7;border-color:#2187c7;color:#fff}
.qmes-purchase-live.${ROOT_CLASS} .qpx-empty{height:210px;text-align:center;color:#8797a6!important;font-size:11px!important}
.qmes-purchase-live.${ROOT_CLASS} .qpx-foot{display:flex;align-items:center;gap:10px;padding:10px 12px;border-top:1px solid #e4ecf3}
.qmes-purchase-live.${ROOT_CLASS} .qpx-page-size{height:31px;border:1px solid #cddae6;border-radius:6px;background:#fff;padding:0 8px;font-size:10px;color:#415c75}
.qmes-purchase-live.${ROOT_CLASS} .qpx-pages{display:flex;gap:4px;margin:auto}
.qmes-purchase-live.${ROOT_CLASS} .qpx-page{width:30px;height:30px;border:1px solid #d4e0ea;border-radius:5px;background:#fff;color:#50677e;font-size:10px;font-weight:850;cursor:pointer}
.qmes-purchase-live.${ROOT_CLASS} .qpx-page.active{background:#2584c5;border-color:#2584c5;color:#fff}
.qmes-purchase-live.${ROOT_CLASS} .qpx-range{font-size:10px;color:#6d8195;font-weight:750}
.qmes-purchase-live.${ROOT_CLASS}.qpx-modal-open::before{content:"";position:fixed;inset:0;background:rgba(18,43,66,.48);z-index:99980}
.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card{position:fixed!important;left:50%!important;top:50%!important;transform:translate(-50%,-50%)!important;width:min(1440px,94vw)!important;max-height:92vh!important;overflow:auto!important;z-index:99990!important;border:0!important;border-radius:10px!important;background:#fff!important;box-shadow:0 24px 70px rgba(10,35,58,.28)!important;padding:0 18px 18px!important;display:block!important}
.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card .qerp-form{padding:14px 4px 6px!important;display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px 14px!important}
.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card .qerp-field{min-width:0!important}
.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card input,.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card select,.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card textarea{width:100%!important;box-sizing:border-box!important}
.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card button[type="submit"]{background:#1184da!important;border-color:#1184da!important;color:#fff!important;font-weight:900!important}
.qmes-purchase-live.${ROOT_CLASS} .qpx-modal-head{position:sticky;top:0;z-index:5;margin:0 -18px 8px;padding:13px 18px;background:linear-gradient(135deg,#0d669f,#1189d6);color:#fff;display:flex;align-items:center;justify-content:space-between;gap:12px;border-radius:10px 10px 0 0}
.qmes-purchase-live.${ROOT_CLASS} .qpx-modal-head h3{margin:0;font-size:19px;font-weight:950}
.qmes-purchase-live.${ROOT_CLASS} .qpx-modal-head p{margin:3px 0 0;font-size:10px;opacity:.9}
.qmes-purchase-live.${ROOT_CLASS} .qpx-modal-close{width:34px;height:34px;border:0;border-radius:6px;background:rgba(255,255,255,.12);color:#fff;font-size:24px;line-height:1;cursor:pointer}
.qmes-purchase-live.${ROOT_CLASS} .qpx-steps{display:flex;gap:8px;align-items:center;justify-content:flex-end;flex-wrap:wrap}
.qmes-purchase-live.${ROOT_CLASS} .qpx-step{display:inline-flex;align-items:center;gap:6px;font-size:10px;font-weight:850;opacity:.86}
.qmes-purchase-live.${ROOT_CLASS} .qpx-step b{width:22px;height:22px;border-radius:50%;background:#fff;color:#147abc;display:grid;place-items:center}
.qpx-detail-overlay{position:fixed;inset:0;z-index:100020;background:rgba(18,43,66,.48);display:grid;place-items:center;padding:24px}
.qpx-detail{width:min(820px,94vw);max-height:88vh;overflow:auto;border-radius:10px;background:#fff;box-shadow:0 24px 70px rgba(10,35,58,.28)}
.qpx-detail-head{padding:14px 17px;background:linear-gradient(135deg,#0d669f,#1189d6);color:#fff;display:flex;justify-content:space-between;align-items:center;border-radius:10px 10px 0 0}
.qpx-detail-head strong{font-size:16px}.qpx-detail-head button{border:0;background:transparent;color:#fff;font-size:24px;cursor:pointer}
.qpx-detail-body{padding:17px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.qpx-detail-item{border:1px solid #e0e8ef;border-radius:7px;padding:10px}.qpx-detail-item span{display:block;font-size:9px;color:#718498;font-weight:800;margin-bottom:4px}.qpx-detail-item b{font-size:12px;color:#263f57;word-break:break-word}
.qpx-toast{position:fixed;right:24px;bottom:24px;z-index:100030;background:#173d5e;color:#fff;padding:11px 15px;border-radius:7px;font-size:11px;font-weight:800;box-shadow:0 8px 24px rgba(0,0,0,.18)}
@media(max-width:1300px){
.qmes-purchase-live.${ROOT_CLASS} .qpx-filter-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
.qmes-purchase-live.${ROOT_CLASS} .qpx-cards{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:850px){
.qmes-purchase-live.${ROOT_CLASS} .qpx-filter-grid{grid-template-columns:1fr 1fr}
.qmes-purchase-live.${ROOT_CLASS} .qpx-cards{grid-template-columns:1fr 1fr}
.qmes-purchase-live.${ROOT_CLASS} .qpx-head{flex-direction:column}
.qmes-purchase-live.${ROOT_CLASS} .qpx-form-card .qerp-form{grid-template-columns:1fr 1fr!important}
.qpx-detail-body{grid-template-columns:1fr 1fr}
}
`;
    document.head.appendChild(s);
  }

  function setHiddenOriginal(root,formCard){
    Array.from(root.children).forEach(child=>{
      if(child.classList && child.classList.contains(HOST_CLASS)){
        child.removeAttribute('data-qpx-hidden-original');
        return;
      }
      if(formCard && (child === formCard || child.contains(formCard))){
        child.removeAttribute('data-qpx-hidden-original');
        return;
      }
      child.setAttribute('data-qpx-hidden-original','1');
    });
  }

  function clearRoot(root){
    if(!root) return;
    root.classList.remove(ROOT_CLASS,'qpx-modal-open');
    root.querySelectorAll('[data-qpx-hidden-original="1"]').forEach(n=>n.removeAttribute('data-qpx-hidden-original'));
    root.querySelectorAll('.qpx-form-card').forEach(n=>n.classList.remove('qpx-form-card'));
    root.querySelectorAll('.qpx-modal-head').forEach(n=>n.remove());
  }

  function originalForm(root){
    return root ? root.querySelector('.qerp-card .qerp-form') : null;
  }

  function originalCreateButton(root){
    if(!root) return null;
    const buttons = Array.from(root.querySelectorAll('.qmes-purchase-page-head button,.qerp-head button'));
    return buttons.find(b=>!b.closest('.'+HOST_CLASS) &&
      /신규\s*발주|발주서\s*생성|구매\s*발주\s*등록|등록\s*닫기|입력\s*닫기/.test(clean(b.textContent))) || null;
  }

  function decorateForm(root,form){
    if(!form) return null;
    const card = form.closest('.qerp-card') || form.parentElement;
    if(!card) return null;
    card.classList.add('qpx-form-card');
    root.classList.add('qpx-modal-open');
    let head = card.querySelector(':scope > .qpx-modal-head');
    if(!head){
      head = document.createElement('div');
      head.className = 'qpx-modal-head';
      head.innerHTML = `
        <div><h3>신규 구매 발주 등록</h3><p>MRP·작업지시·협력사·IQC를 하나의 발주번호로 연결합니다.</p></div>
        <div class="qpx-steps">
          <span class="qpx-step"><b>1</b>기본정보</span>
          <span class="qpx-step"><b>2</b>품목등록</span>
          <span class="qpx-step"><b>3</b>품질요구사항</span>
          <span class="qpx-step"><b>4</b>결재상신</span>
          <button type="button" class="qpx-modal-close" aria-label="닫기">×</button>
        </div>`;
      card.insertBefore(head,card.firstChild);
    }
    const title = form.querySelector('button[type="submit"]');
    if(title && /저장|등록|생성|결재/.test(clean(title.textContent))) title.textContent = '결재상신 및 저장';
    return card;
  }

  function getMetrics(rows){
    return {
      '결재대기': rows.filter(isApprovalPending),
      '발주완료': rows.filter(r=>!isApprovalPending(r)),
      '부분입고': rows.filter(isPartial),
      '입고완료': rows.filter(isReceiptComplete),
      'IQC대기': rows.filter(isIqcPending)
    };
  }

  function statusBadge(text,type){
    return `<span class="qpx-badge ${type || 'gray'}">${esc(text)}</span>`;
  }

  function renderCards(groups){
    const cards = [
      ['결재대기','▤',groups['결재대기']],
      ['발주완료','🛒',groups['발주완료']],
      ['부분입고','□',groups['부분입고']],
      ['IQC대기','△',groups['IQC대기']]
    ];
    return cards.map(([name,icon,rows])=>{
      const money = rows.reduce((s,r)=>s+totalAmount(r),0);
      return `<button type="button" class="qpx-card" data-qpx-card="${esc(name)}">
        <span class="qpx-card-icon">${icon}</span>
        <span><span class="qpx-card-label">${esc(name)}</span>
        <span class="qpx-card-count">${rows.length}건</span>
        <span class="qpx-card-money">총 ${won(money)}</span></span>
      </button>`;
    }).join('');
  }

  function filteredRows(rows){
    const f = state.from, t = state.to;
    const q = lower(state.q), sup = lower(state.supplier), item = lower(state.item);
    return rows.filter(r=>{
      const d = orderDate(r);
      if(f && d && d < f) return false;
      if(t && d && d > t) return false;
      if(sup && !lower(supplierOf(r)).includes(sup)) return false;
      const itemText = itemOf(r)+' '+specOf(r);
      if(item && !lower(itemText).includes(item)) return false;
      if(state.poStatus !== '전체' && poStatus(r) !== state.poStatus) return false;
      if(state.receiptStatus !== '전체' && receiptStatus(r) !== state.receiptStatus) return false;
      if(state.tab === '결재대기' && !isApprovalPending(r)) return false;
      if(state.tab === '발주완료' && isApprovalPending(r)) return false;
      if(state.tab === '부분입고' && !isPartial(r)) return false;
      if(state.tab === '입고완료' && !isReceiptComplete(r)) return false;
      if(state.tab === 'IQC대기' && !isIqcPending(r)) return false;
      if(q){
        const hay = [
          rawNo(r),supplierOf(r),itemOf(r),specOf(r),approvalText(r),
          receiptText(r),iqcText(r),clean(r.mrp || r.mrpNo || r.mrp_no),
          clean(r.workOrder || r.work_order || r.workOrderNo || r.work_order_no)
        ].join(' ').toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function tabs(groups,total){
    const specs = [
      ['전체',total],
      ['결재대기',groups['결재대기'].length],
      ['발주완료',groups['발주완료'].length],
      ['부분입고',groups['부분입고'].length],
      ['입고완료',groups['입고완료'].length],
      ['IQC대기',groups['IQC대기'].length]
    ];
    return specs.map(([name,count])=>
      `<button type="button" class="qpx-tab${state.tab===name?' active':''}" data-qpx-tab="${esc(name)}">${esc(name)} <em>${count}</em></button>`
    ).join('');
  }

  function tableRows(rows,start){
    if(!rows.length) return `<tr><td colspan="16" class="qpx-empty">조회 조건에 해당하는 구매 발주가 없습니다.</td></tr>`;
    return rows.map((r,i)=>{
      const no = rawNo(r);
      const rt = receiptStatus(r);
      const it = iqcStatus(r);
      const ap = poStatus(r);
      const rb = rt==='입고완료' ? statusBadge(rt,'green') : rt==='부분입고' ? statusBadge(rt,'orange') : statusBadge(rt,'gray');
      const ib = it==='완료' ? statusBadge(it,'green') : it==='검사중' ? statusBadge(it,'blue') : it==='대상아님' ? statusBadge(it,'gray') : statusBadge(it,'purple');
      const ab = ap==='결재대기' ? statusBadge(ap,'orange') : /반려|취소/.test(ap) ? statusBadge(ap,'red') : statusBadge(ap,'blue');
      return `<tr data-qpx-row="${esc(rowKey(r,start+i))}">
        <td><input type="checkbox" aria-label="${esc(no)} 선택"></td>
        <td><button type="button" class="qpx-link qpc-date-link" data-purchase-no="${esc(no)}">${esc(orderDate(r)||'-')}</button></td>
        <td><button type="button" class="qpx-link qpc-date-link" data-purchase-no="${esc(no)}">${esc(no)}</button></td>
        <td class="left">${esc(supplierOf(r)||'-')}</td>
        <td class="left">${esc(itemOf(r)||'-')}${specOf(r)?' ('+esc(specOf(r))+')':''}</td>
        <td class="num">${qty(orderedQty(r))}</td>
        <td>${esc(unitOf(r))}</td>
        <td class="num">${wonFmt.format(Math.round(unitPrice(r)))}</td>
        <td class="num">${wonFmt.format(Math.round(supplyAmount(r)))}</td>
        <td class="num">${wonFmt.format(Math.round(vatAmount(r)))}</td>
        <td class="num">${wonFmt.format(Math.round(totalAmount(r)))}</td>
        <td>${esc(requestedDue(r)||'-')}</td>
        <td>${rb}</td><td>${ib}</td><td>${ab}</td>
        <td><span class="qpx-manage">
          <button type="button" data-qpx-detail="${esc(no)}">상세</button>
          <button type="button" class="qpc-edit-btn" data-purchase-no="${esc(no)}">수정</button>
        </span></td>
      </tr>`;
    }).join('');
  }

  function render(host){
    const rows = state.rows;
    const groups = getMetrics(rows);
    const filtered = filteredRows(rows);
    const pages = Math.max(1,Math.ceil(filtered.length/state.pageSize));
    if(state.page > pages) state.page = pages;
    const start = (state.page-1)*state.pageSize;
    const view = filtered.slice(start,start+state.pageSize);
    const pageButtons = [];
    const lo = Math.max(1,state.page-2), hi = Math.min(pages,lo+4);
    const first = Math.max(1,hi-4);
    for(let p=first;p<=hi;p++) pageButtons.push(`<button type="button" class="qpx-page${p===state.page?' active':''}" data-qpx-page="${p}">${p}</button>`);
    const suppliers = Array.from(new Set(rows.map(supplierOf).filter(Boolean))).sort((a,b)=>a.localeCompare(b,'ko'));
    const supplierOptions = ['<option value="">전체</option>'].concat(suppliers.map(v=>`<option value="${esc(v)}"${state.supplier===v?' selected':''}>${esc(v)}</option>`)).join('');

    host.innerHTML = `<div class="qpx-shell" data-qpx-version="${VERSION}">
      <div class="qpx-head">
        <div><h2 class="qpx-title">구매 · 발주관리</h2><div class="qpx-sub">MRP 부족수량 → 구매검토·결재 → 협력사 발주 → 입고·IQC까지 연결</div></div>
        <div class="qpx-actions">
          <button type="button" class="qpx-btn" data-qpx-sync>구매 DB 연동</button>
          <button type="button" class="qpx-btn" data-qpx-export>⇩ 엑셀 다운로드</button>
          <button type="button" class="qpx-btn primary" data-qpx-create>＋ 신규 구매 발주</button>
        </div>
      </div>
      <div class="qpx-cards">${renderCards(groups)}</div>
      <div class="qpx-filter">
        <div class="qpx-filter-title">⌕ 검색 조건</div>
        <div class="qpx-filter-grid">
          <label class="qpx-field"><span>기간</span><span class="qpx-date-wrap"><input type="date" data-qpx-filter="from" value="${esc(state.from)}"><b>~</b><input type="date" data-qpx-filter="to" value="${esc(state.to)}"></span></label>
          <label class="qpx-field"><span>거래처</span><select data-qpx-filter="supplier">${supplierOptions}</select></label>
          <label class="qpx-field"><span>품목명</span><input data-qpx-filter="item" value="${esc(state.item)}" placeholder="품목명 또는 규격 입력"></label>
          <label class="qpx-field"><span>발주상태</span><select data-qpx-filter="po"><option>전체</option><option${state.poStatus==='결재대기'?' selected':''}>결재대기</option><option${state.poStatus==='발주완료'?' selected':''}>발주완료</option></select></label>
          <label class="qpx-field"><span>입고상태</span><select data-qpx-filter="receipt"><option>전체</option><option${state.receiptStatus==='미입고'?' selected':''}>미입고</option><option${state.receiptStatus==='부분입고'?' selected':''}>부분입고</option><option${state.receiptStatus==='입고완료'?' selected':''}>입고완료</option></select></label>
          <label class="qpx-field"><span>통합검색</span><input data-qpx-filter="q" value="${esc(state.q)}" placeholder="발주번호, 거래처명, 품목명 등 검색"></label>
          <button type="button" class="qpx-btn primary" data-qpx-search>⌕ 조회</button>
          <button type="button" class="qpx-btn" data-qpx-reset>↻ 초기화</button>
        </div>
      </div>
      <div class="qpx-list-card">
        <div class="qpx-tabs">${tabs(groups,rows.length)}<span class="qpx-total-right">총 ${filtered.length}건</span></div>
        <div class="qpx-table-scroll"><table class="qpx-table">
          <thead><tr><th><input type="checkbox" aria-label="전체 선택"></th><th>발주일 ↓</th><th>발주번호</th><th>거래처명</th><th>품목명 (규격)</th><th>발주수량</th><th>단위</th><th>단가 (원)</th><th>공급가액 (원)</th><th>부가세 (원)</th><th>합계 (원)</th><th>납기일</th><th>입고상태</th><th>IQC</th><th>결재</th><th>관리</th></tr></thead>
          <tbody>${tableRows(view,start)}</tbody>
        </table></div>
        <div class="qpx-foot">
          <select class="qpx-page-size" data-qpx-pagesize><option value="10"${state.pageSize===10?' selected':''}>10개씩 보기</option><option value="20"${state.pageSize===20?' selected':''}>20개씩 보기</option><option value="50"${state.pageSize===50?' selected':''}>50개씩 보기</option></select>
          <div class="qpx-pages">
            <button type="button" class="qpx-page" data-qpx-page="1">«</button>
            <button type="button" class="qpx-page" data-qpx-page="${Math.max(1,state.page-1)}">‹</button>
            ${pageButtons.join('')}
            <button type="button" class="qpx-page" data-qpx-page="${Math.min(pages,state.page+1)}">›</button>
            <button type="button" class="qpx-page" data-qpx-page="${pages}">»</button>
          </div>
          <span class="qpx-range">총 ${filtered.length}건 중 ${filtered.length?start+1:0}-${Math.min(start+view.length,filtered.length)}건</span>
        </div>
      </div>
    </div>`;
  }

  function readFilters(host){
    state.from = clean(host.querySelector('[data-qpx-filter="from"]')?.value);
    state.to = clean(host.querySelector('[data-qpx-filter="to"]')?.value);
    state.supplier = clean(host.querySelector('[data-qpx-filter="supplier"]')?.value);
    state.item = clean(host.querySelector('[data-qpx-filter="item"]')?.value);
    state.poStatus = clean(host.querySelector('[data-qpx-filter="po"]')?.value) || '전체';
    state.receiptStatus = clean(host.querySelector('[data-qpx-filter="receipt"]')?.value) || '전체';
    state.q = clean(host.querySelector('[data-qpx-filter="q"]')?.value);
    state.page = 1;
  }

  function resetFilters(){
    [state.from,state.to] = monthRange();
    state.supplier=''; state.item=''; state.poStatus='전체'; state.receiptStatus='전체'; state.q=''; state.tab='전체'; state.page=1;
  }

  function toast(message){
    document.querySelectorAll('.qpx-toast').forEach(n=>n.remove());
    const t = document.createElement('div');
    t.className = 'qpx-toast';
    t.textContent = message;
    document.body.appendChild(t);
    clearTimeout(state.toastTimer);
    state.toastTimer = setTimeout(()=>t.remove(),2400);
  }

  function showDetail(no){
    const row = state.rows.find(r=>rawNo(r)===no);
    if(!row) return;
    document.querySelectorAll('.qpx-detail-overlay').forEach(n=>n.remove());
    const overlay = document.createElement('div');
    overlay.className = 'qpx-detail-overlay';
    const fields = [
      ['발주번호',rawNo(row)],['발주일',orderDate(row)],['협력사',supplierOf(row)],
      ['품목명',itemOf(row)],['규격',specOf(row)||'-'],['발주수량',qty(orderedQty(row))+' '+unitOf(row)],
      ['단가',won(unitPrice(row))],['공급가액',won(supplyAmount(row))],['부가세',won(vatAmount(row))],
      ['합계금액',won(totalAmount(row))],['요청납기',requestedDue(row)||'-'],['협력사 확정 납기',clean(row.confirmedDueDate||row.confirmed_due_date||row.expected)||'-'],
      ['입고상태',receiptStatus(row)],['입고수량',qty(receivedQty(row))+' '+unitOf(row)],['IQC',iqcStatus(row)],
      ['결재',poStatus(row)],['MRP/구매요청',clean(row.mrp||row.mrpNo||row.mrp_no)||'-'],['작업지시',clean(row.workOrder||row.work_order||row.workOrderNo||row.work_order_no)||'-'],
      ['입고창고',clean(row.warehouse||row.receiptWarehouse||row.receipt_warehouse)||'-'],['결제조건',clean(row.paymentTerms||row.payment_terms)||'-'],['특기사항',clean(row.notes||row.note||'-')]
    ];
    overlay.innerHTML = `<div class="qpx-detail"><div class="qpx-detail-head"><strong>구매 발주 상세 · ${esc(no)}</strong><button type="button" data-qpx-detail-close>×</button></div><div class="qpx-detail-body">${fields.map(([k,v])=>`<div class="qpx-detail-item"><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('')}</div></div>`;
    document.body.appendChild(overlay);
  }

  function downloadCsv(){
    const rows = filteredRows(state.rows);
    const header = ['발주일','발주번호','거래처명','품목명','규격','발주수량','단위','단가','공급가액','부가세','합계','납기일','입고상태','IQC','결재'];
    const body = rows.map(r=>[
      orderDate(r),rawNo(r),supplierOf(r),itemOf(r),specOf(r),orderedQty(r),unitOf(r),
      unitPrice(r),supplyAmount(r),vatAmount(r),totalAmount(r),requestedDue(r),
      receiptStatus(r),iqcStatus(r),poStatus(r)
    ]);
    const csv = '\uFEFF'+[header,...body].map(cols=>cols.map(v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"').join(',')).join('\r\n');
    const blob = new Blob([csv],{type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href=url; a.download='QMES_구매발주_'+new Date().toISOString().slice(0,10)+'.csv';
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  }

  async function syncDb(){
    if(state.syncBusy) return;
    state.syncBusy = true;
    const button = state.root?.querySelector('.'+HOST_CLASS+' [data-qpx-sync]');
    if(button){ button.disabled=true; button.textContent='연동 중...'; }
    try{
      const response = await fetch('/api/purchase-orders',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});
      if(!response.ok) throw new Error('HTTP '+response.status);
      const json = await response.json();
      const rows = normalizeRows(Array.isArray(json) ? json : (json.rows || json.data || json.items || []));
      saveReadCache(rows);
      state.rows = rows;
      state.dataSig = dataSignature(rows);
      state.page = 1;
      const host = state.root?.querySelector('.'+HOST_CLASS);
      if(host) render(host);
      toast('구매 DB 연동 완료 · '+rows.length+'건');
    }catch(error){
      console.warn('[QMES purchase enterprise] DB read failed',error);
      toast('DB 연동을 완료하지 못했습니다. 현재 저장 데이터를 유지합니다.');
    }finally{
      state.syncBusy = false;
      const b = state.root?.querySelector('.'+HOST_CLASS+' [data-qpx-sync]');
      if(b){ b.disabled=false; b.textContent='구매 DB 연동'; }
    }
  }

  function openCreate(){
    const root = state.root || findRoot();
    const button = originalCreateButton(root);
    if(!button){ toast('기존 구매 발주 등록 화면을 찾지 못했습니다.'); return; }
    button.click();
    setTimeout(schedule,0); setTimeout(schedule,80); setTimeout(schedule,180);
  }

  function closeOriginalForm(){
    const root = state.root || findRoot();
    const button = originalCreateButton(root);
    if(button) button.click();
    else{
      const form = originalForm(root);
      const cancel = form && Array.from(form.querySelectorAll('button')).find(b=>/취소|닫기/.test(clean(b.textContent)));
      if(cancel) cancel.click();
    }
    setTimeout(schedule,0); setTimeout(schedule,100);
  }

  function handleClick(event){
    const t = event.target instanceof Element ? event.target : null;
    if(!t) return;

    const detailClose = t.closest('[data-qpx-detail-close],.qpx-detail-overlay');
    if(detailClose){
      if(t.closest('.qpx-detail') && !t.closest('[data-qpx-detail-close]')) return;
      document.querySelectorAll('.qpx-detail-overlay').forEach(n=>n.remove());
      return;
    }

    const root = findRoot();
    if(!root) return;

    if(t.closest('.qpx-modal-close')){ event.preventDefault(); closeOriginalForm(); return; }
    const host = t.closest('.'+HOST_CLASS);
    if(!host) return;

    const card = t.closest('[data-qpx-card]');
    if(card){ state.tab=clean(card.dataset.qpxCard)||'전체'; state.page=1; render(host); return; }
    const tab = t.closest('[data-qpx-tab]');
    if(tab){ state.tab=clean(tab.dataset.qpxTab)||'전체'; state.page=1; render(host); return; }
    if(t.closest('[data-qpx-create]')){ openCreate(); return; }
    if(t.closest('[data-qpx-sync]')){ syncDb(); return; }
    if(t.closest('[data-qpx-export]')){ downloadCsv(); return; }
    if(t.closest('[data-qpx-search]')){ readFilters(host); render(host); return; }
    if(t.closest('[data-qpx-reset]')){ resetFilters(); render(host); return; }
    const detail = t.closest('[data-qpx-detail]');
    if(detail){ showDetail(clean(detail.dataset.qpxDetail)); return; }
    const page = t.closest('[data-qpx-page]');
    if(page){ state.page=Math.max(1,num(page.dataset.qpxPage)); render(host); return; }
  }

  function handleChange(event){
    const t = event.target instanceof Element ? event.target : null;
    if(!t) return;
    const host = t.closest('.'+HOST_CLASS);
    if(!host) return;
    if(t.matches('[data-qpx-pagesize]')){
      state.pageSize = Math.max(10,num(t.value)||10);
      state.page = 1;
      render(host);
    }
  }

  function ensure(){
    const root = findRoot();
    if(!root){
      if(state.root){ clearRoot(state.root); state.root=null; state.formOpen=false; }
      return;
    }
    if(state.root && state.root !== root) clearRoot(state.root);
    state.root = root;
    css();
    root.classList.add(ROOT_CLASS);

    const form = originalForm(root);
    const formCard = form ? decorateForm(root,form) : null;
    state.formOpen = !!form;
    if(!form){
      root.classList.remove('qpx-modal-open');
      root.querySelectorAll('.qpx-form-card').forEach(n=>n.classList.remove('qpx-form-card'));
      root.querySelectorAll('.qpx-modal-head').forEach(n=>n.remove());
    }

    let host = root.querySelector(':scope > .'+HOST_CLASS);
    if(!host){
      host = document.createElement('section');
      host.className = HOST_CLASS;
      root.insertBefore(host,root.firstChild);
    }
    setHiddenOriginal(root,formCard);
    if(form){
      host.style.display='none';
    }else{
      host.style.display='';
      const latest = sourceRows();
      const sig = dataSignature(latest);
      if(!host.firstChild || sig !== state.dataSig){
        state.rows = latest;
        state.dataSig = sig;
        render(host);
      }
    }
  }

  let scheduled = false;
  function schedule(){
    if(scheduled) return;
    scheduled = true;
    requestAnimationFrame(()=>{ scheduled=false; ensure(); });
  }

  function start(){
    css();
    document.addEventListener('click',handleClick,true);
    document.addEventListener('change',handleChange,true);
    window.addEventListener('qmes:navigate-tab',()=>{setTimeout(schedule,0);setTimeout(schedule,100);});
    window.addEventListener('storage',e=>{if(e.key===STORAGE_KEY) schedule();});
    window.addEventListener('focus',schedule);
    const observer = new MutationObserver(mutations=>{
      let relevant = false;
      for(const m of mutations){
        const target = m.target instanceof Element ? m.target : m.target.parentElement;
        if(target && (target.closest('.'+HOST_CLASS) || target.closest('.qpx-detail-overlay'))) continue;
        relevant = true; break;
      }
      if(relevant) schedule();
    });
    observer.observe(document.body,{childList:true,subtree:true});
    schedule();
    setTimeout(schedule,150);
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
