/* NAMO QMES mobile-only inventory + LOT trace workspace — 2026-09-03 */
(function installQmesMobileInventoryTrace(){
  'use strict';
  if (window.__QMES_MOBILE_INVENTORY_TRACE_20260903__) return;
  window.__QMES_MOBILE_INVENTORY_TRACE_20260903__ = true;

  const params = new URLSearchParams(location.search);
  const tab = String(params.get('tab') || '').toLowerCase();
  if (tab !== 'inv' && tab !== 'trace') return;

  const isInventory = tab === 'inv';
  const clean = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  const num = (v) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const match = clean(v).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };
  const fmt = (v, digits = 3) => Number(v || 0).toLocaleString('ko-KR', { maximumFractionDigits:digits });
  const esc = (v) => clean(v).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const dateText = (v) => clean(v) ? clean(v).slice(0,10) : '-';
  const dtText = (v) => {
    const s = clean(v);
    if (!s) return '-';
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? s.slice(0,16).replace('T',' ') : d.toLocaleString('ko-KR', {year:'2-digit',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hour12:false});
  };
  const uniq = (list) => Array.from(new Set((list || []).map(clean).filter(Boolean)));

  const CATEGORY = {RM:'원료',PM:'부자재',WIP:'재공품',FG:'완제품'};
  const STATUS = {AVAILABLE:'사용가능',IQC_PENDING:'IQC 대기',OQC_PENDING:'OQC 대기',HOLD:'HOLD',NONCONFORM:'부적합',RESERVED:'예약'};
  const TX = {RECEIPT:'입고',ISSUE:'출고',MOVE:'이동',ADJUSTMENT:'조정',PRODUCTION_ISSUE:'생산투입',PRODUCTION_RECEIPT:'생산완료',SHIPMENT:'출하',RETURN:'반품',HOLD:'보류',RELEASE:'보류해제'};

  const state = {
    stock:[], summary:{}, transactions:[], locations:[], items:[],
    invView:'stock', invQuery:'', invCategory:'', invStatus:'',
    workorders:[], workByLot:new Map(), iqc:[], pqc:[], oqc:[], traceStock:[], traceTx:[], traceQuery:'',
    scan:null
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials:'same-origin', cache:'no-store',
      headers:{'Content-Type':'application/json', ...(options.headers || {})},
      ...options
    });
    const payload = await response.json().catch(() => null);
    if (response.status === 401) {
      location.replace('/index.html?mobileLogin=1');
      throw new Error('AUTH');
    }
    if (!response.ok || payload?.success === false) throw new Error(payload?.message || `HTTP ${response.status}`);
    return payload?.data !== undefined ? payload.data : payload;
  }

  function recordPayload(record) {
    let value = record?.payload;
    if (value && typeof value === 'object') return value;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch (_) { return {}; }
    }
    return {};
  }

  function activeRecords(records) {
    return (Array.isArray(records) ? records : []).filter((record) => !recordPayload(record).deleted);
  }

  function first(obj, keys, fallback = '') {
    for (const key of keys) {
      const value = obj?.[key];
      if (value !== undefined && value !== null && clean(value) !== '') return value;
    }
    return fallback;
  }

  function statusTone(value) {
    const s = clean(value).toUpperCase();
    if (/NONCONFORM|HOLD|불합격|부적합|차단|격리|이상/.test(s)) return 'danger';
    if (/PENDING|대기|검사|진행/.test(s)) return 'warn';
    if (/AVAILABLE|합격|완료|정상|사용가능/.test(s)) return 'ok';
    return 'info';
  }

  function addStyles() {
    if (document.getElementById('qmit-style')) return;
    const style = document.createElement('style');
    style.id = 'qmit-style';
    style.textContent = `
      .qmit-shell{display:flex;flex-direction:column;gap:10px}.qmit-tools{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:7px}.qmit-search{min-width:0;height:45px;border:1px solid #d9e2e8;border-radius:10px;background:#fff;display:flex;align-items:center;padding:0 10px}.qmit-search input{width:100%;min-width:0;border:0;outline:0;background:transparent;color:#193248;font-size:14px}.qmit-btn{min-height:43px;padding:0 11px;border:1px solid #d9e2e8;border-radius:10px;background:#fff;color:#31506a;font-size:8.7px;font-weight:950;white-space:nowrap;cursor:pointer}.qmit-btn.primary{border-color:#0d5eb8;background:#0d5eb8;color:#fff}.qmit-btn.soft{border-color:#b8d3e6;background:#f2f8fc;color:#0f6198}.qmit-btn.danger{border-color:#e8cbd0;background:#fff7f8;color:#a53342}.qmit-filters{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:7px}.qmit-filters select,.qmit-filters button{width:100%;height:40px;padding:0 9px;border:1px solid #dce4eb;border-radius:9px;background:#fff;color:#43586c;font-size:8.5px;font-weight:850}.qmit-tabs{display:grid;grid-template-columns:1fr 1fr;border:1px solid #dce4eb;border-radius:10px;overflow:hidden;background:#fff}.qmit-tabs button{min-height:40px;border:0;border-right:1px solid #e5eaef;background:#fff;color:#718195;font-size:9px;font-weight:900}.qmit-tabs button:last-child{border-right:0}.qmit-tabs button.active{background:#eef6fc;color:#0d5f9a}.qmit-note{padding:10px 11px;border:1px solid #dce4eb;border-radius:10px;background:#fff;color:#65778a;font-size:8.5px;font-weight:750;line-height:1.55}.qmit-note.warn{border-color:#e9d9ad;background:#fffaf0;color:#765d20}.qmit-note.error{border-color:#eccfd4;background:#fff7f8;color:#a23342}
      .qmit-grid{display:grid;grid-template-columns:1fr;gap:9px}.qmit-card{overflow:hidden;border:1px solid #dce4eb;border-radius:12px;background:#fff;box-shadow:0 3px 11px rgba(20,46,67,.025)}.qmit-card-head{display:flex;align-items:flex-start;gap:9px;padding:11px;border-bottom:1px solid #edf1f4}.qmit-card-head>div{min-width:0;flex:1}.qmit-card-head strong{display:block;color:#18344b;font-size:12px;font-weight:950;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qmit-card-head small{display:block;margin-top:4px;color:#7c8a98;font-size:8.3px;font-weight:750;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.qmit-badges{flex:none;display:flex;gap:4px;flex-wrap:wrap;justify-content:flex-end}.qmit-badge{min-height:21px;padding:4px 6px;border-radius:6px;background:#edf1f4;color:#536475;font-size:7px;font-weight:950}.qmit-badge.ok{background:#e7f6e4;color:#277c2b}.qmit-badge.warn{background:#fff1db;color:#9a6104}.qmit-badge.danger{background:#fde8eb;color:#a83342}.qmit-badge.info{background:#e6f0fd;color:#0f5db4}.qmit-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));padding:3px 11px 8px}.qmit-field{min-width:0;padding:8px 6px 7px;border-bottom:1px solid #f0f3f5}.qmit-field:nth-child(odd){padding-left:0}.qmit-field:nth-child(even){padding-right:0}.qmit-field label{display:block;color:#929daa;font-size:7.4px;font-weight:850}.qmit-field b{display:block;margin-top:4px;color:#334c62;font-size:9.4px;font-weight:900;line-height:1.35;word-break:break-word}.qmit-actions{display:flex;gap:6px;justify-content:flex-end;padding:9px 11px 10px;background:#fbfcfd}.qmit-actions .qmit-btn{min-height:34px;padding:0 10px}.qmit-empty{padding:42px 16px;border:1px dashed #d5dee5;border-radius:12px;background:#fff;text-align:center;color:#8794a1}.qmit-empty strong{display:block;color:#526879;font-size:12px;font-weight:950}.qmit-empty span{display:block;margin-top:6px;font-size:8.8px;font-weight:750;line-height:1.6}
      .qmit-tx{position:relative;padding:11px 11px 11px 29px;border-bottom:1px solid #edf1f4;background:#fff}.qmit-tx:last-child{border-bottom:0}.qmit-tx:before{content:"";position:absolute;left:12px;top:17px;width:7px;height:7px;border-radius:50%;background:#3b8bc1}.qmit-tx:after{content:"";position:absolute;left:15px;top:26px;bottom:-11px;width:1px;background:#dde6ec}.qmit-tx:last-child:after{display:none}.qmit-tx-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.qmit-tx-head strong{font-size:9.5px;font-weight:950;color:#294157}.qmit-tx-head time{font-size:7.7px;color:#8794a1;font-weight:750}.qmit-tx p{margin:5px 0 0;color:#5f7184;font-size:8.6px;font-weight:750;line-height:1.5}.qmit-tx b{color:#1e3c55}.qmit-section{overflow:hidden;border:1px solid #dce4eb;border-radius:12px;background:#fff}.qmit-section-title{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:11px;border-bottom:1px solid #e8edf1;background:#fbfcfd}.qmit-section-title strong{font-size:10.5px;font-weight:950;color:#263f55}.qmit-section-title span{font-size:7.8px;color:#81909e;font-weight:800}.qmit-section-body{padding:10px}.qmit-kpis{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.qmit-kpi{padding:10px;border:1px solid #e1e7ec;border-radius:9px;background:#f9fbfc}.qmit-kpi span{display:block;color:#81909e;font-size:7.6px;font-weight:800}.qmit-kpi strong{display:block;margin-top:5px;color:#203c53;font-size:13px;font-weight:950;line-height:1.3;word-break:break-word}.qmit-material{padding:9px 0;border-bottom:1px solid #edf1f4}.qmit-material:last-child{border-bottom:0}.qmit-material-head{display:flex;align-items:center;justify-content:space-between;gap:8px}.qmit-material-head strong{color:#29465e;font-size:9.8px;font-weight:950}.qmit-material-head b{font-size:8.5px;color:#0f669f}.qmit-material p{margin:4px 0 0;color:#718195;font-size:8.3px;font-weight:750;line-height:1.5}.qmit-related{display:grid;grid-template-columns:1fr;gap:7px}.qmit-related-card{padding:10px;border:1px solid #e0e7ec;border-radius:9px;background:#fff}.qmit-related-card strong{display:block;color:#294359;font-size:10px;font-weight:950}.qmit-related-card span{display:block;margin-top:4px;color:#748497;font-size:8.3px;font-weight:750;line-height:1.45}.qmit-related-card .qmit-actions{padding:8px 0 0;background:transparent}
      .qmit-code{padding:12px;border:1px solid #dbe5eb;border-radius:10px;background:#f8fafc;font-family:monospace;color:#244058;font-size:10px;font-weight:850;line-height:1.55;word-break:break-all}.qmit-scan{position:fixed;inset:0;z-index:150;display:flex;flex-direction:column;background:#071522}.qmit-scan video{width:100%;height:100%;object-fit:cover}.qmit-scan-box{position:absolute;left:12%;right:12%;top:28%;height:34%;border:2px solid rgba(255,255,255,.85);border-radius:18px;box-shadow:0 0 0 9999px rgba(0,0,0,.32)}.qmit-scan-bar{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;justify-content:space-between;padding:calc(12px + env(safe-area-inset-top)) 12px 12px;background:linear-gradient(rgba(0,0,0,.6),transparent);color:#fff}.qmit-scan-bar strong{font-size:13px;font-weight:950}.qmit-scan-bar button{height:39px;padding:0 12px;border:1px solid rgba(255,255,255,.55);border-radius:9px;background:rgba(0,0,0,.25);color:#fff;font-size:9px;font-weight:900}.qmit-scan-help{position:absolute;left:12%;right:12%;bottom:calc(28px + env(safe-area-inset-bottom));padding:10px;border-radius:9px;background:rgba(5,20,34,.74);color:#fff;text-align:center;font-size:9px;font-weight:800;line-height:1.5}
      @media(max-width:380px){.qmit-tools{grid-template-columns:minmax(0,1fr) auto}.qmit-tools .qmit-btn.primary{grid-column:1/-1}.qmit-filters{grid-template-columns:1fr 1fr}.qmit-filters button{grid-column:1/-1}.qmit-fields{grid-template-columns:1fr}.qmit-field{padding-left:0!important;padding-right:0!important}}
      @media(min-width:700px){.qmit-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.qmit-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}.qmit-related{grid-template-columns:repeat(2,minmax(0,1fr))}.qmit-tools{gap:9px}.qmit-search{height:48px}.qmit-btn{min-height:46px;font-size:9.7px}.qmit-card-head{padding:14px}.qmit-fields{padding:4px 14px 10px}.qmit-field label{font-size:8.5px}.qmit-field b{font-size:10.6px}}
    `;
    document.head.appendChild(style);
  }

  function setPage(title, desc) {
    const pageTitle = document.getElementById('pageTitle');
    const headTitle = document.getElementById('headTitle');
    const pageDesc = document.getElementById('pageDesc');
    if (pageTitle) pageTitle.textContent = title;
    if (headTitle) headTitle.textContent = title;
    if (pageDesc) pageDesc.textContent = desc;
    const toolbar = document.getElementById('toolbar');
    if (toolbar) toolbar.style.display = 'none';
    const content = document.querySelector('.content');
    if (content) content.innerHTML = '<div id="qmitRoot" class="qmit-shell"></div>';
  }

  function setSummary(aLabel,aValue,bLabel,bValue,cLabel,cValue) {
    const a = document.getElementById('sumAll'), b = document.getElementById('sum2'), c = document.getElementById('sum3');
    const bLabelNode = document.getElementById('sum2Label'), cLabelNode = document.getElementById('sum3Label');
    const aLabelNode = a?.parentElement?.querySelector('span');
    if (aLabelNode) aLabelNode.textContent = aLabel;
    if (bLabelNode) bLabelNode.textContent = bLabel;
    if (cLabelNode) cLabelNode.textContent = cLabel;
    if (a) a.textContent = aValue;
    if (b) b.textContent = bValue;
    if (c) c.textContent = cValue;
  }

  function loading(show, text) {
    const box = document.getElementById('loading'), label = document.getElementById('loadingText');
    if (label && text) label.textContent = text;
    if (box) box.classList.toggle('show', Boolean(show));
  }

  function message(text, type = '') {
    const root = document.getElementById('qmitRoot');
    if (!root) return;
    let box = document.getElementById('qmitMessage');
    if (!box) {
      box = document.createElement('div');
      box.id = 'qmitMessage';
      root.prepend(box);
    }
    box.className = `qmit-note${type ? ` ${type}` : ''}`;
    box.textContent = text;
    box.style.display = text ? 'block' : 'none';
  }

  function parseScan(raw) {
    const text = clean(raw);
    if (!text) return {raw:'',lot:'',item:'',loc:''};
    try {
      const hash = text.includes('#') ? text.slice(text.indexOf('#') + 1) : '';
      const encoded = hash.startsWith('d=') ? hash.slice(2) : '';
      if (encoded) {
        const normalized = encoded.replace(/-/g,'+').replace(/_/g,'/');
        const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
        const binary = atob(padded);
        const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
        const data = JSON.parse(new TextDecoder().decode(bytes));
        if (data?.v === 1) return {raw:text, lot:clean(data.l).toUpperCase(), item:clean(data.m).toUpperCase(), loc:clean(data.loc).toUpperCase(), qr:data};
      }
    } catch (_) {}
    const item = text.match(/(?:^|\|)ITEM:([^|]+)/i)?.[1] || '';
    const lot = text.match(/(?:^|\|)LOT:([^|]+)/i)?.[1] || '';
    const loc = text.match(/(?:^|\|)LOC:([^|]+)/i)?.[1] || '';
    if (lot) return {raw:text, lot:clean(lot).toUpperCase(), item:clean(item).toUpperCase(), loc:clean(loc).toUpperCase()};
    return {raw:text, lot:text.toUpperCase(), item:'', loc:''};
  }

  function stopScanner() {
    const scan = state.scan;
    if (!scan) return;
    try { scan.stream?.getTracks?.().forEach((track) => track.stop()); } catch (_) {}
    if (scan.raf) cancelAnimationFrame(scan.raf);
    scan.host?.remove();
    state.scan = null;
  }

  async function startScanner(callback) {
    if (!('BarcodeDetector' in window) || !navigator.mediaDevices?.getUserMedia) {
      message('이 브라우저는 카메라 바코드 스캔을 지원하지 않습니다. 바코드/LOT 입력창에 직접 입력하거나 휴대용 스캐너를 사용하세요.','warn');
      return;
    }
    try {
      const formats = await BarcodeDetector.getSupportedFormats?.().catch(() => []) || [];
      const preferred = ['qr_code','code_128'].filter((format) => !formats.length || formats.includes(format));
      const detector = new BarcodeDetector(preferred.length ? {formats:preferred} : undefined);
      const stream = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      const host = document.createElement('div');
      host.className = 'qmit-scan';
      host.innerHTML = '<video playsinline muted></video><div class="qmit-scan-box"></div><div class="qmit-scan-bar"><strong>LOT · QR · 바코드 스캔</strong><button type="button">닫기</button></div><div class="qmit-scan-help">코드를 사각형 안에 맞춰 주세요. 인식되면 자동으로 조회합니다.</div>';
      document.body.appendChild(host);
      const video = host.querySelector('video');
      video.srcObject = stream;
      await video.play();
      state.scan = {host,stream,raf:0};
      host.querySelector('button').addEventListener('click', stopScanner);
      let last = 0;
      const loop = async (now) => {
        if (!state.scan) return;
        if (now - last > 180) {
          last = now;
          try {
            const codes = await detector.detect(video);
            if (codes?.length) {
              const value = clean(codes[0].rawValue);
              stopScanner();
              if (value) callback(value);
              return;
            }
          } catch (_) {}
        }
        if (state.scan) state.scan.raf = requestAnimationFrame(loop);
      };
      state.scan.raf = requestAnimationFrame(loop);
    } catch (error) {
      stopScanner();
      message(`카메라를 열 수 없습니다: ${error.message || '권한을 확인하세요.'}`,'warn');
    }
  }

  function barcodeValue(row) {
    return `ITEM:${clean(row.item_code).toUpperCase() || 'UNKNOWN'}|LOT:${clean(row.lot_no).toUpperCase() || 'NOLOT'}|LOC:${clean(row.location_code || row.to_location || row.from_location).toUpperCase() || 'LOCATION'}`;
  }

  function openCode(row) {
    const editor = document.getElementById('editor'), title = document.getElementById('editorTitle'), sub = document.getElementById('editorSub'), body = document.getElementById('editorBody'), error = document.getElementById('formError');
    if (!editor || !body) return;
    if (error) { error.classList.remove('show'); error.textContent=''; }
    if (title) title.textContent='재고 바코드 정보';
    if (sub) sub.textContent='ITEM · LOT · LOCATION';
    const code = barcodeValue(row);
    body.innerHTML = `<div class="form-note">PC 재고관리와 같은 ITEM / LOT / 위치 값을 사용합니다. 현장 스캐너 입력값으로도 그대로 조회할 수 있습니다.</div><div class="qmit-code" id="qmitCodeText">${esc(code)}</div><div class="form-grid" style="margin-top:12px"><div class="form-field"><label>품목</label><input value="${esc(row.item_name || row.item_code)}" readonly></div><div class="form-field"><label>LOT</label><input value="${esc(row.lot_no)}" readonly></div><div class="form-field"><label>위치</label><input value="${esc(row.location_code || row.to_location || row.from_location)}" readonly></div><div class="form-field"><label>수량</label><input value="${esc(`${fmt(row.quantity)} ${row.unit || ''}`)}" readonly></div><div class="form-actions"><button type="button" id="qmitCodeClose">닫기</button><button class="save" type="button" id="qmitCodeCopy">코드 복사</button></div></div>`;
    document.getElementById('qmitCodeClose')?.addEventListener('click',()=>{editor.classList.remove('open');editor.setAttribute('aria-hidden','true');});
    document.getElementById('qmitCodeCopy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(code);message('바코드 조회값을 복사했습니다.');}catch(_){message('복사 권한을 사용할 수 없습니다.','warn');}});
    editor.classList.add('open'); editor.setAttribute('aria-hidden','false');
  }

  function locationOptions(selected = '') {
    const list = state.locations || [];
    return `<option value="">없음</option>${list.map((loc)=>`<option value="${esc(loc.location_code)}" ${clean(loc.location_code)===clean(selected)?'selected':''}>${esc(loc.location_code)} · ${esc(loc.location_name || '')}</option>`).join('')}`;
  }

  function statusOptions(selected = 'AVAILABLE') {
    return Object.entries(STATUS).map(([key,label])=>`<option value="${key}" ${key===selected?'selected':''}>${esc(label)}</option>`).join('');
  }

  function categoryOptions(selected = 'RM') {
    return Object.entries(CATEGORY).map(([key,label])=>`<option value="${key}" ${key===selected?'selected':''}>${esc(label)}</option>`).join('');
  }

  function openInventoryTransaction(type = 'RECEIPT', row = null) {
    const editor = document.getElementById('editor'), title = document.getElementById('editorTitle'), sub = document.getElementById('editorSub'), body = document.getElementById('editorBody'), error = document.getElementById('formError');
    if (!editor || !body) return;
    const source = row || {};
    const receipt = type === 'RECEIPT', move = type === 'MOVE';
    if (error) { error.classList.remove('show'); error.textContent=''; }
    if (title) title.textContent = receipt ? '재고 입고 등록' : move ? '재고 위치 이동' : '재고 출고 등록';
    if (sub) sub.textContent = 'PostgreSQL 중앙 재고 DB';
    const itemCode = clean(source.item_code), itemName = clean(source.item_name), category = clean(source.category || 'RM'), unit = clean(source.unit || 'kg');
    body.innerHTML = `<div class="form-note">저장 즉시 PC 재고관리와 같은 중앙 DB에 반영됩니다. 출고·이동은 현재 LOT의 재고수량을 초과할 수 없습니다.</div><form class="form-grid" id="qmitTxForm">
      <input type="hidden" name="transactionType" value="${esc(type)}">
      <div class="form-field"><label>품목코드 *</label><input name="itemCode" list="qmitItemList" value="${esc(itemCode)}" ${row?'readonly':''}><datalist id="qmitItemList">${state.items.map((item)=>`<option value="${esc(item.item_code)}">${esc(item.item_name)}</option>`).join('')}</datalist></div>
      <div class="form-field"><label>품목명 *</label><input name="itemName" value="${esc(itemName)}" ${row?'readonly':''}></div>
      <div class="form-field"><label>구분</label><select name="category">${categoryOptions(category)}</select></div>
      <div class="form-field"><label>LOT *</label><input name="lotNo" value="${esc(source.lot_no || '')}" ${row?'readonly':''}></div>
      <div class="form-field"><label>수량 *</label><input name="quantity" type="number" min="0.001" step="0.001" inputmode="decimal" value=""></div>
      <div class="form-field"><label>단위</label><input name="unit" value="${esc(unit)}"></div>
      <div class="form-field"><label>From 위치</label><select name="fromLocation" ${receipt?'disabled':''}>${locationOptions(receipt?'':source.location_code)}</select></div>
      <div class="form-field"><label>To 위치</label><select name="toLocation" ${type==='ISSUE'?'disabled':''}>${locationOptions(receipt?'IQC':move?'': '')}</select></div>
      <div class="form-field"><label>From 상태</label><select name="fromStatus" ${receipt?'disabled':''}>${statusOptions(clean(source.quality_status || 'AVAILABLE'))}</select></div>
      <div class="form-field"><label>To 상태</label><select name="toStatus" ${type==='ISSUE'?'disabled':''}>${statusOptions(receipt?'IQC_PENDING':clean(source.quality_status || 'AVAILABLE'))}</select></div>
      <div class="form-field"><label>작업지시번호</label><input name="workOrderNo"></div>
      <div class="form-field"><label>참조번호</label><input name="referenceNo"></div>
      <div class="form-field"><label>공급사</label><input name="supplier" value="${esc(source.supplier || '')}"></div>
      <div class="form-field"><label>입고일</label><input name="receivedAt" type="date" value="${receipt?new Date().toISOString().slice(0,10):''}"></div>
      <div class="form-field"><label>유효기간</label><input name="expiryDate" type="date" value="${esc(dateText(source.expiry_date)==='-'?'':dateText(source.expiry_date))}"></div>
      <div class="form-section"><strong>포장 / 바코드 정보</strong><div class="judge-grid"><div class="form-field"><label>포장형태</label><select name="packagingType"><option value="">선택</option><option>Drum</option><option>IBC</option><option>Pail</option><option>Bag</option><option>기타</option></select></div><div class="form-field"><label>포장수량 (EA)</label><input name="packageQty" type="number" min="1" step="1"></div><div class="form-field"><label>용기당 중량</label><input name="unitWeight" type="number" min="0" step="0.001"></div><div class="form-field"><label>바코드 발행수량</label><input name="barcodeQty" type="number" min="1" step="1"></div></div></div>
      <div class="form-field full"><label>사유 / 비고</label><textarea name="reason"></textarea></div>
      <div class="form-actions"><button type="button" id="qmitTxCancel">취소</button><button class="save" type="submit">확정 저장</button></div>
    </form>`;
    const form = document.getElementById('qmitTxForm');
    form.elements.itemCode?.addEventListener('change',(event)=>{
      const found = state.items.find((item)=>clean(item.item_code).toUpperCase()===clean(event.target.value).toUpperCase());
      if (!found) return;
      form.elements.itemName.value = found.item_name || '';
      form.elements.category.value = found.category || 'RM';
      form.elements.unit.value = found.unit || 'kg';
    });
    document.getElementById('qmitTxCancel')?.addEventListener('click',()=>{editor.classList.remove('open');editor.setAttribute('aria-hidden','true');});
    form.addEventListener('submit', saveInventoryTransaction);
    editor.classList.add('open'); editor.setAttribute('aria-hidden','false');
  }

  async function saveInventoryTransaction(event) {
    event.preventDefault();
    const form = event.currentTarget, fd = new FormData(form), type = clean(fd.get('transactionType'));
    const payload = {
      transactionType:type,
      itemCode:clean(fd.get('itemCode')).toUpperCase(), itemName:clean(fd.get('itemName')),
      category:clean(fd.get('category')).toUpperCase() || 'RM', lotNo:clean(fd.get('lotNo')).toUpperCase(),
      quantity:num(fd.get('quantity')), unit:clean(fd.get('unit')) || 'kg',
      fromLocation:type==='RECEIPT'?'':clean(fd.get('fromLocation')).toUpperCase(),
      toLocation:type==='ISSUE'?'':clean(fd.get('toLocation')).toUpperCase(),
      fromStatus:type==='RECEIPT'?'':clean(fd.get('fromStatus')).toUpperCase(),
      toStatus:type==='ISSUE'?'':clean(fd.get('toStatus')).toUpperCase(),
      workOrderNo:clean(fd.get('workOrderNo')), productionLot:'', referenceNo:clean(fd.get('referenceNo')),
      supplier:clean(fd.get('supplier')), receivedAt:clean(fd.get('receivedAt')), expiryDate:clean(fd.get('expiryDate')),
      packagingType:clean(fd.get('packagingType')), packageQty:num(fd.get('packageQty')) || null,
      unitWeight:num(fd.get('unitWeight')) || null, barcodeQty:num(fd.get('barcodeQty')) || null,
      reason:clean(fd.get('reason')), remark:'MOBILE QMES'
    };
    const error = document.getElementById('formError');
    const fail = (text) => { if(error){error.textContent=text;error.classList.add('show');} };
    if (!payload.itemCode || !payload.itemName || !payload.lotNo || payload.quantity <= 0) return fail('품목코드, 품목명, LOT, 0보다 큰 수량을 입력하세요.');
    if (type !== 'RECEIPT' && !payload.fromLocation) return fail('출고 위치를 선택하세요.');
    if (type !== 'ISSUE' && !payload.toLocation) return fail('입고/이동 위치를 선택하세요.');
    if (type === 'MOVE' && payload.fromLocation === payload.toLocation && payload.fromStatus === payload.toStatus) return fail('이동 전·후 위치 또는 품질상태가 같아 이동할 수 없습니다.');
    loading(true,'재고 처리를 저장하는 중입니다.');
    try {
      await api('/api/inventory/transactions',{method:'POST',body:JSON.stringify(payload)});
      const editor = document.getElementById('editor');
      if (editor) { editor.classList.remove('open'); editor.setAttribute('aria-hidden','true'); }
      await loadInventory();
      message(`${TX[type] || type} 처리가 중앙 재고 DB에 저장되었습니다.`);
    } catch (e) {
      if (e.message !== 'AUTH') fail(`저장 실패: ${e.message}`);
    } finally { loading(false); }
  }

  function inventoryDirection(tx) {
    let from = clean(tx.from_location), to = clean(tx.to_location);
    const type = clean(tx.transaction_type).toUpperCase();
    if (!from) from = type === 'PRODUCTION_RECEIPT' ? '생산완료' : type === 'RETURN' ? '반품입고' : '외부입고';
    if (!to) to = type === 'PRODUCTION_ISSUE' ? '생산사용' : type === 'SHIPMENT' ? '출하' : '외부출고';
    return `${from} → ${to}`;
  }

  function filteredStock() {
    let q = clean(state.invQuery).toLowerCase();
    if (q) {
      const parsed = parseScan(q);
      if (parsed.lot && (q.includes('|lot:') || q.includes('#d='))) q = parsed.lot.toLowerCase();
    }
    return state.stock.filter((row)=>{
      const categoryOk = !state.invCategory || clean(row.category) === state.invCategory;
      const statusOk = !state.invStatus || clean(row.quality_status) === state.invStatus;
      const searchOk = !q || [row.item_code,row.item_name,row.lot_no,row.location_code,row.supplier].join(' ').toLowerCase().includes(q);
      return categoryOk && statusOk && searchOk;
    });
  }

  function stockCard(row) {
    const status = clean(row.quality_status), category = clean(row.category), available = num(row.available_qty), quantity = num(row.quantity), reserved = num(row.reserved_qty);
    return `<article class="qmit-card"><div class="qmit-card-head"><div><strong>${esc(row.item_name || row.item_code)}</strong><small>${esc(row.item_code)} · LOT ${esc(row.lot_no)}</small></div><div class="qmit-badges"><span class="qmit-badge info">${esc(CATEGORY[category] || category || '-')}</span><span class="qmit-badge ${statusTone(status)}">${esc(STATUS[status] || status || '-')}</span></div></div><div class="qmit-fields"><div class="qmit-field"><label>보관 위치</label><b>${esc(row.location_code || '-')}</b></div><div class="qmit-field"><label>현재고</label><b>${fmt(quantity)} ${esc(row.unit || '')}</b></div><div class="qmit-field"><label>예약수량</label><b>${fmt(reserved)} ${esc(row.unit || '')}</b></div><div class="qmit-field"><label>가용 / 잔량</label><b>${fmt(available)} ${esc(row.unit || '')}</b></div><div class="qmit-field"><label>공급사</label><b>${esc(row.supplier || '-')}</b></div><div class="qmit-field"><label>유효기간</label><b>${esc(dateText(row.expiry_date))}</b></div></div><div class="qmit-actions"><button class="qmit-btn" data-code="${esc(row.item_code)}|${esc(row.lot_no)}|${esc(row.location_code)}">바코드</button><button class="qmit-btn soft" data-move="${esc(row.item_code)}|${esc(row.lot_no)}|${esc(row.location_code)}|${esc(status)}">이동</button><button class="qmit-btn danger" data-issue="${esc(row.item_code)}|${esc(row.lot_no)}|${esc(row.location_code)}|${esc(status)}">출고</button></div></article>`;
  }

  function transactionCard(tx) {
    return `<article class="qmit-card"><div class="qmit-card-head"><div><strong>${esc(TX[tx.transaction_type] || tx.transaction_type || '재고 처리')}</strong><small>${esc(tx.item_code)} · LOT ${esc(tx.lot_no)}</small></div><div class="qmit-badges"><span class="qmit-badge info">${fmt(tx.quantity)} ${esc(tx.unit || '')}</span></div></div><div class="qmit-fields"><div class="qmit-field"><label>처리일시</label><b>${esc(dtText(tx.created_at))}</b></div><div class="qmit-field"><label>이동 방향</label><b>${esc(inventoryDirection(tx))}</b></div><div class="qmit-field"><label>작업지시</label><b>${esc(tx.work_order_no || tx.production_lot || '-')}</b></div><div class="qmit-field"><label>참조번호</label><b>${esc(tx.reference_no || '-')}</b></div><div class="qmit-field"><label>작업자</label><b>${esc(tx.operator_name || tx.operator_id || '-')}</b></div><div class="qmit-field"><label>비고</label><b>${esc(tx.reason || tx.remark || '-')}</b></div></div><div class="qmit-actions"><button class="qmit-btn" data-tx-code="${esc(tx.id)}">바코드 조회</button></div></article>`;
  }

  function bindInventoryActions() {
    const root = document.getElementById('qmitRoot');
    if (!root) return;
    const findRow = (token) => {
      const [item,lot,loc,status] = clean(token).split('|');
      return state.stock.find((row)=>clean(row.item_code)===item && clean(row.lot_no)===lot && clean(row.location_code)===loc && (!status || clean(row.quality_status)===status));
    };
    root.querySelectorAll('[data-code]').forEach((button)=>button.addEventListener('click',()=>{const row=findRow(button.dataset.code);if(row)openCode(row);}));
    root.querySelectorAll('[data-move]').forEach((button)=>button.addEventListener('click',()=>{const row=findRow(button.dataset.move);if(row)openInventoryTransaction('MOVE',row);}));
    root.querySelectorAll('[data-issue]').forEach((button)=>button.addEventListener('click',()=>{const row=findRow(button.dataset.issue);if(row)openInventoryTransaction('ISSUE',row);}));
    root.querySelectorAll('[data-tx-code]').forEach((button)=>button.addEventListener('click',()=>{const tx=state.transactions.find((row)=>String(row.id)===String(button.dataset.txCode));if(tx)openCode({...tx,location_code:tx.to_location || tx.from_location});}));
  }

  function renderInventory() {
    const root = document.getElementById('qmitRoot');
    if (!root) return;
    const rows = filteredStock();
    const viewRows = state.transactions.filter((tx)=>!/PHOTO-RACK-MIGRATION-/i.test(clean(tx.reference_no))).slice(0,100);
    root.innerHTML = `<div id="qmitMessage" class="qmit-note" style="display:none"></div><div class="qmit-tools"><label class="qmit-search"><input id="qmitInvSearch" type="search" placeholder="원료명 · LOT · 위치 · 바코드 입력" value="${esc(state.invQuery)}" autocomplete="off"></label><button class="qmit-btn" id="qmitInvScan" type="button">카메라 스캔</button><button class="qmit-btn primary" id="qmitInvReceipt" type="button">입고 등록</button></div><div class="qmit-filters"><select id="qmitCategory"><option value="">전체 구분</option>${Object.entries(CATEGORY).map(([key,label])=>`<option value="${key}" ${state.invCategory===key?'selected':''}>${esc(label)}</option>`).join('')}</select><select id="qmitStatus"><option value="">전체 상태</option>${Object.entries(STATUS).map(([key,label])=>`<option value="${key}" ${state.invStatus===key?'selected':''}>${esc(label)}</option>`).join('')}</select><button id="qmitInvReset" type="button">필터 초기화</button></div><div class="qmit-tabs"><button type="button" data-inv-view="stock" class="${state.invView==='stock'?'active':''}">LOT별 현재고</button><button type="button" data-inv-view="tx" class="${state.invView==='tx'?'active':''}">최근 입출고</button></div>${state.invView==='stock' ? `<div class="qmit-note">중앙 PostgreSQL 재고 DB 기준 · ${rows.length}개 재고 위치가 조회되었습니다. 가용/잔량은 현재고에서 예약수량을 제외한 값입니다.</div><div class="qmit-grid">${rows.length?rows.map(stockCard).join(''):'<div class="qmit-empty"><strong>조건에 맞는 재고가 없습니다.</strong><span>검색어 또는 필터를 변경해 주세요.</span></div>'}</div>` : `<div class="qmit-note">최근 재고 Transaction ${viewRows.length}건을 최신순으로 표시합니다.</div><div class="qmit-grid">${viewRows.length?viewRows.map(transactionCard).join(''):'<div class="qmit-empty"><strong>입출고 이력이 없습니다.</strong><span>재고 처리가 등록되면 여기에 표시됩니다.</span></div>'}</div>`}`;
    document.getElementById('qmitInvSearch')?.addEventListener('input',(event)=>{state.invQuery=event.target.value;renderInventory();});
    document.getElementById('qmitInvScan')?.addEventListener('click',()=>startScanner((raw)=>{const parsed=parseScan(raw);state.invQuery=parsed.lot || raw;renderInventory();message(`스캔 완료: ${parsed.lot || raw}`);}));
    document.getElementById('qmitInvReceipt')?.addEventListener('click',()=>openInventoryTransaction('RECEIPT'));
    document.getElementById('qmitCategory')?.addEventListener('change',(event)=>{state.invCategory=event.target.value;renderInventory();});
    document.getElementById('qmitStatus')?.addEventListener('change',(event)=>{state.invStatus=event.target.value;renderInventory();});
    document.getElementById('qmitInvReset')?.addEventListener('click',()=>{state.invQuery='';state.invCategory='';state.invStatus='';renderInventory();});
    root.querySelectorAll('[data-inv-view]').forEach((button)=>button.addEventListener('click',()=>{state.invView=button.dataset.invView;renderInventory();}));
    bindInventoryActions();
  }

  async function loadInventory() {
    loading(true,'중앙 재고 DB를 불러오는 중입니다.');
    try {
      const [stock,summary,transactions,locations,items] = await Promise.all([
        api('/api/inventory/stock'), api('/api/inventory/summary'), api('/api/inventory/transactions?limit=300'), api('/api/inventory/locations'), api('/api/inventory/items')
      ]);
      state.stock = Array.isArray(stock) ? stock : [];
      state.summary = summary || {};
      state.transactions = Array.isArray(transactions) ? transactions : [];
      state.locations = Array.isArray(locations) ? locations : [];
      state.items = Array.isArray(items) ? items : [];
      const uniqueLots = new Set(state.stock.map((row)=>`${row.item_code}|${row.lot_no}`)).size;
      const availableLots = new Set(state.stock.filter((row)=>clean(row.quality_status)==='AVAILABLE' && num(row.available_qty)>0).map((row)=>`${row.item_code}|${row.lot_no}`)).size;
      const holdLots = new Set(state.stock.filter((row)=>['HOLD','NONCONFORM'].includes(clean(row.quality_status))).map((row)=>`${row.item_code}|${row.lot_no}`)).size;
      setSummary('재고 LOT',fmt(uniqueLots,0),'사용가능 LOT',fmt(availableLots,0),'HOLD/부적합',fmt(holdLots,0));
      renderInventory();
    } catch (error) {
      renderInventory();
      if (error.message !== 'AUTH') message(`재고 데이터를 불러오지 못했습니다: ${error.message}`,'error');
    } finally { loading(false); }
  }

  function workorderRows(records) {
    const list=[]; const map=new Map();
    activeRecords(records).forEach((record)=>{
      const payload=recordPayload(record);
      if (!payload.batch && !payload.doc) return;
      const lot=clean(payload.lotNo || payload.batch?.no || payload.batch?.lot || payload.batch?.lotNo || record.record_key).toUpperCase();
      if (!lot || /^(PROCESS|WORKER):/i.test(lot)) return;
      const work={lot,payload,record,batch:payload.batch||{},doc:payload.doc||{},lotRecord:payload.lotRecord||null,item:clean(payload.batch?.itemName||payload.batch?.item||payload.doc?.item||payload.lotRecord?.itemName||payload.lotRecord?.item)};
      list.push(work); map.set(lot,work);
    });
    return {list,map};
  }

  function materialRows(work) {
    if (!work) return [];
    const lotMaterials = Array.isArray(work.lotRecord?.materials) ? work.lotRecord.materials : [];
    if (lotMaterials.length) return lotMaterials.map((row)=>({
      lot:clean(first(row,['lot','lotNo','materialLot','supplierLot'])).toUpperCase(), name:clean(first(row,['name','material','materialName','itemName'])), supplier:clean(row.supplier), qty:first(row,['qty','act','actualQty','usedQty']), remaining:first(row,['remaining','remainingQty']), containerNo:clean(row.containerNo), iqc:clean(row.iqc)
    }));
    const pools=[work.doc?.inputs,work.doc?.materials,work.doc?.materialRows,work.doc?.rawMaterials,work.doc?.recipeMaterials,work.doc?.ingredients];
    const source=pools.find(Array.isArray)||[];
    return source.map((row)=>({
      lot:clean(first(row,['lot','lotNo','materialLot','supplierLot'])).toUpperCase(), name:clean(first(row,['name','material','materialName','itemName'])), supplier:clean(row.supplier), qty:first(row,['act','actualQty','usedQty','inputQty','qty','std']), remaining:first(row,['remaining','remainingQty']), containerNo:clean(row.containerNo), iqc:clean(row.iqc)
    }));
  }

  function inspectionGroups(records) {
    const map=new Map();
    activeRecords(records).forEach((record)=>{
      const payload=recordPayload(record), rows=Array.isArray(payload.rows)?payload.rows:[];
      if (!rows.length) return;
      const key=clean(record.record_key || rows[0].groupId || clean(rows[0].id).replace(/-\d+$/,''));
      if (!key) return;
      map.set(key,{key,payload,record,rows,lot:clean(payload.lotNo||rows[0].lot).toUpperCase()});
    });
    return map;
  }

  function latestGroup(groups, lot) {
    return Array.from(groups.values()).filter((group)=>group.lot===lot).sort((a,b)=>{
      const da=clean(a.rows[0]?.date||a.rows[0]?.shipDate||a.record.updated_at), db=clean(b.rows[0]?.date||b.rows[0]?.shipDate||b.record.updated_at);
      return db.localeCompare(da) || b.key.localeCompare(a.key);
    })[0] || null;
  }

  function groupJudge(group) {
    if (!group?.rows?.length) return '미검사';
    if (group.rows.every((row)=>clean(row.judge)==='합격')) return '합격';
    if (group.rows.some((row)=>/불합격|부적합|NG|FAIL/i.test(clean(row.judge)))) return '불합격';
    return clean(group.rows[0].judge) || '검사대기';
  }

  function iqcForLot(rawLot) {
    const matches=[];
    activeRecords(state.iqc).forEach((record)=>{
      const payload=recordPayload(record);
      (Array.isArray(payload.rows)?payload.rows:[]).forEach((row)=>{if(clean(row.lot).toUpperCase()===rawLot)matches.push(row);});
    });
    return matches.sort((a,b)=>clean(b.inspectedAt||b.recv).localeCompare(clean(a.inspectedAt||a.recv)))[0] || null;
  }

  function oqcShipment(lot, group) {
    const row=group?.rows?.[0] || {};
    const work=state.workByLot.get(lot);
    const ship=work?.lotRecord?.ship || work?.batch?.ship || {};
    return {
      customer:clean(ship.customer || row.customer), qty:num(ship.shipQty ?? ship.qty ?? row.shipQty), date:clean(ship.shipDate || ship.date || row.shipDate), destination:clean(ship.destination || row.destination), shipNo:clean(ship.shipNo || group?.key)
    };
  }

  function traceTransactions(lots) {
    const set=new Set((lots||[]).map((v)=>clean(v).toUpperCase()));
    return state.traceTx.filter((tx)=>set.has(clean(tx.lot_no).toUpperCase()) || set.has(clean(tx.work_order_no).toUpperCase()) || set.has(clean(tx.production_lot).toUpperCase())).slice(0,80);
  }

  function traceTimeline(rows) {
    if (!rows.length) return '<div class="qmit-empty"><strong>재고 원장 연결 기록이 없습니다.</strong><span>해당 LOT의 중앙 재고 Transaction이 아직 등록되지 않았습니다.</span></div>';
    return rows.map((tx)=>`<div class="qmit-tx"><div class="qmit-tx-head"><strong>${esc(TX[tx.transaction_type]||tx.transaction_type)} · ${fmt(tx.quantity)} ${esc(tx.unit||'')}</strong><time>${esc(dtText(tx.created_at))}</time></div><p><b>${esc(tx.item_code||'-')} / ${esc(tx.lot_no||'-')}</b><br>${esc(inventoryDirection(tx))}${tx.operator_name?` · ${esc(tx.operator_name)}`:''}</p></div>`).join('');
  }

  function traceHeaderKpis(work,pqc,oqc) {
    const plan=num(work?.batch?.plan), done=num(work?.batch?.done ?? work?.batch?.productionQty), status=clean(work?.lotRecord?.status||work?.batch?.status||'-');
    return `<div class="qmit-kpis"><div class="qmit-kpi"><span>제품명</span><strong>${esc(work?.item||'-')}</strong></div><div class="qmit-kpi"><span>생산실적</span><strong>${fmt(done)} / ${fmt(plan)} ${esc(work?.batch?.unit||'kg')}</strong></div><div class="qmit-kpi"><span>PQC</span><strong>${esc(groupJudge(pqc))}</strong></div><div class="qmit-kpi"><span>OQC / LOT 상태</span><strong>${esc(`${groupJudge(oqc)} · ${status}`)}</strong></div></div>`;
  }

  function materialHtml(material) {
    const iqc=iqcForLot(material.lot), judge=clean(iqc?.judge||material.iqc||'미검사');
    return `<div class="qmit-material"><div class="qmit-material-head"><strong>${esc(material.name||'원재료')} · ${esc(material.lot||'LOT 미등록')}</strong><span class="qmit-badge ${statusTone(judge)}">${esc(judge)}</span></div><p>공급사 ${esc(material.supplier||iqc?.supplier||'-')} · 투입 ${esc(material.qty==null||clean(material.qty)===''?'-':material.qty)}${material.remaining!=null&&clean(material.remaining)!==''?` · 잔량 ${esc(material.remaining)}`:''}${material.containerNo?` · 용기 ${esc(material.containerNo)}`:''}</p></div>`;
  }

  function renderFinishedTrace(work) {
    const root=document.getElementById('qmitTraceResult'); if(!root)return;
    const lot=work.lot, pqc=latestGroup(inspectionGroups(state.pqc),lot), oqc=latestGroup(inspectionGroups(state.oqc),lot), shipment=oqcShipment(lot,oqc), materials=materialRows(work);
    const remainderRows=Object.values(work.payload?.remainders||{});
    const linkedLots=[lot,...materials.map((m)=>m.lot)].filter(Boolean), txRows=traceTransactions(linkedLots);
    root.innerHTML=`<section class="qmit-section"><div class="qmit-section-title"><strong>완제품 LOT · ${esc(lot)}</strong><span>${esc(clean(work.batch?.status||work.lotRecord?.status)||'상태 확인')}</span></div><div class="qmit-section-body">${traceHeaderKpis(work,pqc,oqc)}</div></section><section class="qmit-section"><div class="qmit-section-title"><strong>품질 · 출하 연결</strong><span>IQC → PQC → OQC → 출하</span></div><div class="qmit-section-body"><div class="qmit-kpis"><div class="qmit-kpi"><span>PQC 검사번호</span><strong>${esc(pqc?.key||'미등록')}</strong></div><div class="qmit-kpi"><span>OQC 검사번호</span><strong>${esc(oqc?.key||'미등록')}</strong></div><div class="qmit-kpi"><span>고객사 / 출하량</span><strong>${esc(shipment.customer||'-')}${shipment.qty?` · ${fmt(shipment.qty)} kg`:''}</strong></div><div class="qmit-kpi"><span>출하일 / 납품처</span><strong>${esc(shipment.date||'-')}${shipment.destination?` · ${esc(shipment.destination)}`:''}</strong></div></div><div class="qmit-actions" style="padding:11px 0 0;background:transparent"><button class="qmit-btn soft" data-go-tab="pqc">PQC 열기</button><button class="qmit-btn soft" data-go-tab="oqc">OQC 열기</button><button class="qmit-btn" data-go-tab="inv">재고 열기</button></div></div></section><section class="qmit-section"><div class="qmit-section-title"><strong>투입 원료 · 잔량</strong><span>${materials.length}개 원료</span></div><div class="qmit-section-body">${materials.length?materials.map(materialHtml).join(''):'<div class="qmit-empty"><strong>원료 LOT 연결정보가 없습니다.</strong><span>작업지시 실투입 LOT가 저장되면 자동으로 표시됩니다.</span></div>'}${remainderRows.length?`<div style="margin-top:10px;padding-top:9px;border-top:1px solid #edf1f4">${remainderRows.map((r)=>`<div class="qmit-material"><div class="qmit-material-head"><strong>잔량 · ${esc(r.name||r.lot||'-')}</strong><b>${fmt(r.remainingQty)} ${esc(r.unit||'kg')}</b></div><p>LOT ${esc(r.lot||'-')} · 용기 ${esc(r.containerNo||'BULK')} · 사용 ${fmt(r.usedQty)} · 상태 ${esc(r.status||'-')}</p></div>`).join('')}</div>`:''}</div></section><section class="qmit-section"><div class="qmit-section-title"><strong>재고 이동 이력</strong><span>${txRows.length}건</span></div><div>${traceTimeline(txRows)}</div></section>`;
    bindTraceButtons();
    setSummary('완제품 LOT','1','투입 원료',fmt(materials.length,0),'재고 이력',fmt(txRows.length,0));
  }

  function renderRawTrace(rawLot, affected) {
    const root=document.getElementById('qmitTraceResult'); if(!root)return;
    const stocks=state.traceStock.filter((row)=>clean(row.lot_no).toUpperCase()===rawLot), currentQty=stocks.reduce((sum,row)=>sum+num(row.quantity),0), available=stocks.reduce((sum,row)=>sum+num(row.available_qty),0);
    const oqcGroups=inspectionGroups(state.oqc), shipments=affected.map((work)=>({work,group:latestGroup(oqcGroups,work.lot)})).map(({work,group})=>({lot:work.lot,...oqcShipment(work.lot,group),judge:groupJudge(group),status:clean(work.lotRecord?.status||work.batch?.status)}));
    const customers=uniq(shipments.map((s)=>s.customer));
    root.innerHTML=`<section class="qmit-section"><div class="qmit-section-title"><strong>원료 LOT 역추적 · ${esc(rawLot)}</strong><span>영향범위 확인</span></div><div class="qmit-section-body"><div class="qmit-kpis"><div class="qmit-kpi"><span>현재고</span><strong>${fmt(currentQty)} / 가용 ${fmt(available)}</strong></div><div class="qmit-kpi"><span>보관 위치</span><strong>${esc(uniq(stocks.map((r)=>r.location_code)).join(' · ')||'-')}</strong></div><div class="qmit-kpi"><span>영향 완제품</span><strong>${fmt(affected.length,0)} LOT</strong></div><div class="qmit-kpi"><span>출하 고객</span><strong>${esc(customers.join(' · ')||'미출하')}</strong></div></div></div></section><section class="qmit-section"><div class="qmit-section-title"><strong>영향받는 완제품 LOT</strong><span>${affected.length}건</span></div><div class="qmit-section-body"><div class="qmit-related">${affected.length?affected.map((work)=>{const ship=shipments.find((s)=>s.lot===work.lot)||{};return`<article class="qmit-related-card"><strong>${esc(work.lot)} · ${esc(work.item||'-')}</strong><span>상태 ${esc(ship.status||work.batch?.status||'-')} · OQC ${esc(ship.judge||'미검사')}${ship.customer?` · 고객 ${esc(ship.customer)}`:''}</span><div class="qmit-actions"><button class="qmit-btn soft" data-trace-finished="${esc(work.lot)}">완제품 LOT 보기</button></div></article>`}).join(''):'<div class="qmit-empty"><strong>영향 완제품이 없습니다.</strong><span>최근 공유 작업지시 범위에서는 이 원료 LOT를 사용한 완제품을 찾지 못했습니다.</span></div>'}</div></div></section><section class="qmit-section"><div class="qmit-section-title"><strong>원료 LOT 중앙 재고</strong><span>${stocks.length}개 위치</span></div><div class="qmit-section-body">${stocks.length?stocks.map((row)=>`<div class="qmit-material"><div class="qmit-material-head"><strong>${esc(row.item_name||row.item_code)} · ${esc(row.location_code)}</strong><span class="qmit-badge ${statusTone(row.quality_status)}">${esc(STATUS[row.quality_status]||row.quality_status)}</span></div><p>현재 ${fmt(row.quantity)} ${esc(row.unit||'')} · 예약 ${fmt(row.reserved_qty)} · 가용 ${fmt(row.available_qty)}</p></div>`).join(''):'<div class="qmit-empty"><strong>현재 재고가 없습니다.</strong><span>소진된 LOT이거나 중앙 재고에 아직 등록되지 않았습니다.</span></div>'}</div></section>`;
    root.querySelectorAll('[data-trace-finished]').forEach((button)=>button.addEventListener('click',()=>{const input=document.getElementById('qmitTraceInput');if(input)input.value=button.dataset.traceFinished;state.traceQuery=button.dataset.traceFinished;runTrace(button.dataset.traceFinished);}));
    setSummary('원료 LOT','1','영향 완제품',fmt(affected.length,0),'출하 고객',fmt(customers.length,0));
  }

  function renderInventoryOnlyTrace(query, stocks, txRows) {
    const root=document.getElementById('qmitTraceResult');if(!root)return;
    root.innerHTML=`<section class="qmit-section"><div class="qmit-section-title"><strong>재고 LOT · ${esc(query)}</strong><span>작업지시 연결 없음</span></div><div class="qmit-section-body">${stocks.map((row)=>`<div class="qmit-material"><div class="qmit-material-head"><strong>${esc(row.item_name||row.item_code)} · ${esc(row.location_code)}</strong><span class="qmit-badge ${statusTone(row.quality_status)}">${esc(STATUS[row.quality_status]||row.quality_status)}</span></div><p>현재 ${fmt(row.quantity)} ${esc(row.unit||'')} · 가용 ${fmt(row.available_qty)} · 공급사 ${esc(row.supplier||'-')}</p></div>`).join('')}</div></section><section class="qmit-section"><div class="qmit-section-title"><strong>재고 이동 이력</strong><span>${txRows.length}건</span></div><div>${traceTimeline(txRows)}</div></section><div class="qmit-note warn">중앙 재고에서는 LOT를 찾았지만 최근 공유 작업지시 데이터 범위에서는 생산 연결정보를 찾지 못했습니다.</div>`;
    setSummary('재고 LOT','1','재고 위치',fmt(stocks.length,0),'재고 이력',fmt(txRows.length,0));
  }

  function bindTraceButtons() {
    document.querySelectorAll('[data-go-tab]').forEach((button)=>button.addEventListener('click',()=>location.assign(`/mobile-work.html?tab=${encodeURIComponent(button.dataset.goTab)}&v=20260903-invtrace1`)));
  }

  function runTrace(raw) {
    const parsed=parseScan(raw), query=clean(parsed.lot||raw).toUpperCase();
    state.traceQuery=query;
    const result=document.getElementById('qmitTraceResult');
    if (!query) { if(result)result.innerHTML='<div class="qmit-empty"><strong>LOT를 입력하세요.</strong><span>완제품 LOT, 원료 LOT, QR 또는 바코드를 입력하면 양방향 추적합니다.</span></div>';return; }
    const exact=state.workByLot.get(query);
    if (exact) { renderFinishedTrace(exact); return; }
    const affected=state.workorders.filter((work)=>materialRows(work).some((material)=>material.lot===query));
    if (affected.length) { renderRawTrace(query,affected); return; }
    const stocks=state.traceStock.filter((row)=>clean(row.lot_no).toUpperCase()===query), txRows=traceTransactions([query]);
    if (stocks.length || txRows.length) { renderInventoryOnlyTrace(query,stocks,txRows); return; }
    if (result) result.innerHTML='<div class="qmit-empty"><strong>연결된 LOT 정보를 찾지 못했습니다.</strong><span>최근 공유 작업지시·검사 기록과 중앙 재고 원장을 확인했습니다. 과거 작업지시는 공유 조회 범위 밖일 수 있습니다.</span></div>';
    setSummary('검색 LOT','1','연결 결과','0','재고 이력','0');
  }

  function renderTraceShell() {
    const root=document.getElementById('qmitRoot');if(!root)return;
    root.innerHTML=`<div id="qmitMessage" class="qmit-note" style="display:none"></div><div class="qmit-tools"><label class="qmit-search"><input id="qmitTraceInput" type="search" placeholder="완제품 LOT · 원료 LOT · QR · 바코드" value="${esc(state.traceQuery)}" autocomplete="off"></label><button class="qmit-btn" id="qmitTraceScan" type="button">카메라 스캔</button><button class="qmit-btn primary" id="qmitTraceGo" type="button">LOT 추적</button></div><div class="qmit-note">완제품 LOT를 입력하면 원료·IQC·PQC·OQC·출하·재고이력을 순방향으로, 원료 LOT를 입력하면 영향 완제품과 출하 고객을 역추적합니다.</div><div id="qmitTraceResult"><div class="qmit-empty"><strong>LOT 통합 추적</strong><span>LOT 번호 또는 현장 QR/바코드를 입력해 주세요.</span></div></div>`;
    const input=document.getElementById('qmitTraceInput');
    const go=()=>{state.traceQuery=clean(input?.value);runTrace(state.traceQuery);};
    input?.addEventListener('keydown',(event)=>{if(event.key==='Enter'){event.preventDefault();go();}});
    document.getElementById('qmitTraceGo')?.addEventListener('click',go);
    document.getElementById('qmitTraceScan')?.addEventListener('click',()=>startScanner((raw)=>{const parsed=parseScan(raw);if(input)input.value=parsed.lot||raw;state.traceQuery=parsed.lot||raw;runTrace(state.traceQuery);message(`스캔 완료: ${parsed.lot||raw}`);}));
  }

  async function loadTraceData() {
    loading(true,'LOT 추적 데이터를 연결하는 중입니다.');
    try {
      const [work,iqc,pqc,oqc,stock,transactions] = await Promise.all([
        api('/api/qmes-sync/workorder'), api('/api/qmes-sync/iqc'), api('/api/qmes-sync/pqc'), api('/api/qmes-sync/oqc'), api('/api/inventory/stock'), api('/api/inventory/transactions?limit=1000')
      ]);
      const parsed=workorderRows(work);
      state.workorders=parsed.list;state.workByLot=parsed.map;state.iqc=Array.isArray(iqc)?iqc:[];state.pqc=Array.isArray(pqc)?pqc:[];state.oqc=Array.isArray(oqc)?oqc:[];state.traceStock=Array.isArray(stock)?stock:[];state.traceTx=Array.isArray(transactions)?transactions:[];
      const qualityCount=inspectionGroups(state.pqc).size+inspectionGroups(state.oqc).size;
      setSummary('공유 작업지시',fmt(state.workorders.length,0),'PQC/OQC 기록',fmt(qualityCount,0),'재고 원장',fmt(state.traceTx.length,0));
      renderTraceShell();
    } catch (error) {
      renderTraceShell();
      if (error.message !== 'AUTH') message(`LOT 추적 데이터를 불러오지 못했습니다: ${error.message}`,'error');
    } finally { loading(false); }
  }

  async function start() {
    addStyles();
    stopScanner();
    if (isInventory) {
      setPage('재고관리','중앙 DB · LOT · 위치 · 품질상태 · 입출고 모바일 관리');
      await loadInventory();
    } else {
      setPage('LOT 통합 추적','완제품 LOT ↔ 원료 LOT · 품질 · 출하 · 재고 양방향 추적');
      await loadTraceData();
    }
  }

  window.addEventListener('beforeunload', stopScanner);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(start,220),{once:true});
  else setTimeout(start,220);
})();
