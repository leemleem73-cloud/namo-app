/* NAMO QMES mobile-only PQC/OQC entry editor — 2026-09-03 */
(function installQmesMobileQualityEntry(){
  'use strict';
  if (window.__QMES_MOBILE_QUALITY_ENTRY_20260903__) return;
  window.__QMES_MOBILE_QUALITY_ENTRY_20260903__ = true;

  const params = new URLSearchParams(location.search);
  const tab = String(params.get('tab') || '').toLowerCase();
  if (tab !== 'pqc' && tab !== 'oqc') return;

  const mode = tab.toUpperCase();
  const isOqc = mode === 'OQC';
  const clean = (v) => String(v == null ? '' : v).replace(/\s+/g, ' ').trim();
  const num = (v) => {
    if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
    const match = clean(v).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/);
    return match ? Number(match[0]) : 0;
  };
  const esc = (v) => clean(v).replace(/[&<>"']/g, (ch) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const today = () => new Date().toISOString().slice(0, 10);
  const timeText = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  const SPECS = {
    '점도': {spec:'1,500±300 cP', lo:1200, hi:1800},
    '고형분': {spec:'20.0±1.0 wt%', lo:19, hi:21},
    '입도(Dmax)': {spec:'<10 µm', hi:10},
    '수분': {spec:'<2,000 ppm', hi:2000},
    '접착력': {spec:'≥400 gf/12.7mm', lo:400},
    '절연저항': {spec:'≥200 MΩ (Overflow)', lo:200},
    '외관': {spec:'이물질 혼입 없을 것'},
    '전해액 안정성': {spec:'탈리 / 미탈리'}
  };
  const PQC_ITEMS = ['점도','고형분','입도(Dmax)','외관'];
  const OQC_ITEMS = ['외관','입도(Dmax)','점도','고형분','접착력','절연저항','수분','전해액 안정성'];
  const ITEMS = isOqc ? OQC_ITEMS : PQC_ITEMS;

  const state = {
    records: [],
    groups: new Map(),
    workorders: [],
    workByLot: new Map(),
    currentGroup: '',
    user: '',
    observer: null
  };

  async function api(path, options = {}) {
    const response = await fetch(path, {
      credentials:'same-origin',
      cache:'no-store',
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

  function activePayloadRecords(records) {
    return (Array.isArray(records) ? records : []).filter((record) => !recordPayload(record).deleted);
  }

  function groupKey(row) {
    return clean(row?.groupId) || [clean(row?.lot), clean(row?.date || row?.shipDate)].filter(Boolean).join('|') || clean(row?.id).replace(/-\d+$/, '');
  }

  function parseGroups(records) {
    const map = new Map();
    activePayloadRecords(records).forEach((record) => {
      const payload = recordPayload(record);
      const rows = Array.isArray(payload.rows) ? payload.rows : [];
      const key = clean(record.record_key || record.recordKey) || groupKey(rows[0]);
      if (!key || !rows.length) return;
      map.set(key, {key, record, payload, rows});
    });
    return map;
  }

  function parseWorkorders(records) {
    const list = [];
    const map = new Map();
    activePayloadRecords(records).forEach((record) => {
      const payload = recordPayload(record);
      if (!payload.batch) return;
      const lot = clean(payload.lotNo || payload.batch.no || payload.batch.lot || payload.batch.lotNo);
      if (!lot) return;
      const item = clean(payload.batch.itemName || payload.batch.item || payload.doc?.item || payload.lotRecord?.itemName || payload.lotRecord?.item);
      const row = {lot, payload, record, batch:payload.batch, item};
      list.push(row);
      map.set(lot, row);
    });
    list.sort((a,b) => clean(b.batch?.due || b.payload?.doc?.date).localeCompare(clean(a.batch?.due || a.payload?.doc?.date)) || b.lot.localeCompare(a.lot));
    return {list,map};
  }

  function productionComplete(work) {
    if (!work) return false;
    const status = clean(work.batch?.status);
    const plan = num(work.batch?.plan ?? work.batch?.qty ?? work.batch?.amount);
    const done = num(work.batch?.done ?? work.batch?.productionQty ?? work.batch?.prodQty);
    return /완료|생산완료|출하완료/.test(status) || (plan > 0 && done >= plan);
  }

  function hasActiveHold(payload, lot) {
    return (Array.isArray(payload?.holds) ? payload.holds : []).some((hold) => clean(hold.target).includes(lot) && /차단|보류|격리|대기/.test(clean(hold.status)) && !/해제|완료/.test(clean(hold.status)));
  }

  function pqcPassed(lot) {
    const rows = [];
    state.groups.forEach((group) => {
      if (clean(group.rows?.[0]?.lot) === lot) rows.push(...group.rows);
    });
    if (!rows.length) return false;
    const latestKey = Array.from(state.groups.values())
      .filter((g) => clean(g.rows?.[0]?.lot) === lot)
      .sort((a,b) => clean(b.rows?.[0]?.date).localeCompare(clean(a.rows?.[0]?.date)) || b.key.localeCompare(a.key))[0]?.key;
    const latest = latestKey ? state.groups.get(latestKey)?.rows || [] : [];
    return latest.length > 0 && latest.every((row) => clean(row.judge) === '합격');
  }

  function judgeItem(item, values) {
    const vals = (values || []).map(clean).filter(Boolean);
    if (!vals.length) return '불합격';
    if (item === '외관') return vals.every((v) => v === '이상없음' || v === '정상') ? '합격' : '불합격';
    if (item === '전해액 안정성') return vals.every((v) => v === '미탈리') ? '합격' : '불합격';
    if (item === '절연저항' && vals.some((v) => /overflow/i.test(v))) return '합격';
    const spec = SPECS[item] || {};
    const nums = vals.map((v) => Number(v.replace(/,/g,'')));
    if (nums.some((v) => !Number.isFinite(v))) return '불합격';
    return nums.every((v) => (spec.lo == null || v >= spec.lo) && (spec.hi == null || v <= spec.hi)) ? '합격' : '불합격';
  }

  function valuesFor(group, item, count) {
    const row = group?.rows?.find((entry) => clean(entry.check) === item);
    let values = Array.isArray(row?.measurements) ? row.measurements.map(clean) : clean(row?.value).split('/').map(clean).filter(Boolean);
    if (!values.length) {
      if (item === '외관') values = Array(count).fill('이상없음');
      else if (item === '전해액 안정성') values = Array(count).fill('미탈리');
      else if (item === '절연저항') values = Array(count).fill('Overflow');
      else values = Array(count).fill('');
    }
    while (values.length < count) values.push(values[values.length - 1] || '');
    return values.slice(0,count);
  }

  function nextNo(date) {
    const prefix = mode;
    const part = clean(date || today()).replace(/-/g,'').slice(2);
    const used = new Set(Array.from(state.groups.keys()));
    let seq = 1;
    let key = '';
    do { key = `${prefix}-${part}-${String(seq++).padStart(4,'0')}`; } while (used.has(key));
    return key;
  }

  function lotOptions(selected) {
    const options = state.workorders.map((work) => {
      const label = `${work.lot}${work.item ? ` · ${work.item}` : ''}${productionComplete(work) ? '' : ' · 생산미완료'}`;
      return `<option value="${esc(work.lot)}" ${work.lot === selected ? 'selected' : ''}>${esc(label)}</option>`;
    }).join('');
    const extra = selected && !state.workByLot.has(selected) ? `<option value="${esc(selected)}" selected>${esc(selected)}</option>` : '';
    return `<option value="">작업지시 LOT 선택</option>${extra}${options}`;
  }

  function measurementCell(item, value, index) {
    if (item === '외관') return `<select name="m__${esc(item)}__${index}"><option value="이상없음" ${value==='이상없음'?'selected':''}>이상없음</option><option value="이상있음" ${value==='이상있음'?'selected':''}>이상있음</option></select>`;
    if (item === '전해액 안정성') return `<select name="m__${esc(item)}__${index}"><option value="미탈리" ${value==='미탈리'?'selected':''}>미탈리</option><option value="탈리" ${value==='탈리'?'selected':''}>탈리</option></select>`;
    return `<input name="m__${esc(item)}__${index}" type="text" inputmode="${item==='절연저항'?'text':'decimal'}" value="${esc(value)}" placeholder="${index+1}회">`;
  }

  function measurementTable(group) {
    const count = isOqc ? 3 : null;
    return ITEMS.map((item) => {
      const itemCount = isOqc ? 3 : (item === '외관' ? 1 : 3);
      const values = valuesFor(group,item,itemCount);
      const cells = values.map((value,index) => `<div class="qmq-measure">${measurementCell(item,value,index)}</div>`).join('');
      return `<div class="qmq-item"><div class="qmq-item-head"><div><strong>${esc(item)}</strong><span>${esc(SPECS[item]?.spec || '-')}</span></div><b data-judge="${esc(item)}">-</b></div><div class="qmq-values">${cells}</div></div>`;
    }).join('');
  }

  function addStyles() {
    if (document.getElementById('qmes-mobile-quality-entry-style')) return;
    const style = document.createElement('style');
    style.id = 'qmes-mobile-quality-entry-style';
    style.textContent = `
      .qmq-item{padding:11px 0;border-bottom:1px solid #edf1f4}.qmq-item:last-child{border-bottom:0}.qmq-item-head{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:7px}.qmq-item-head strong{display:block;color:#263e54;font-size:10.5px;font-weight:950}.qmq-item-head span{display:block;margin-top:3px;color:#81909e;font-size:7.7px;font-weight:750}.qmq-item-head b{min-width:43px;padding:4px 7px;border-radius:6px;background:#eef2f5;color:#596979;font-size:7.5px;font-weight:950;text-align:center}.qmq-item-head b.pass{background:#e7f6e5;color:#27802a}.qmq-item-head b.fail{background:#fde7ea;color:#ad3140}.qmq-values{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}.qmq-values:has(.qmq-measure:only-child){grid-template-columns:1fr}.qmq-measure input,.qmq-measure select{width:100%;min-height:43px;padding:8px;border:1px solid #d6e0e7;border-radius:9px;background:#fff;color:#1b344a;font-size:14px;outline:0}.qmq-overall{margin:10px 0 0;padding:11px;border-radius:9px;background:#f5f8fa;color:#4f6376;font-size:9px;font-weight:850}.qmq-overall.pass{background:#eff9ef;color:#257c33}.qmq-overall.fail{background:#fff1f2;color:#a53443}.qmq-gate{margin:0 0 11px;padding:10px 11px;border-radius:9px;background:#fff8e9;color:#78591a;font-size:8.6px;font-weight:800;line-height:1.55}.qmq-gate.ok{background:#f1faf4;color:#317047}.qmq-row{display:grid;grid-template-columns:1fr;gap:10px}.qmq-actions{position:sticky;bottom:0;display:grid;grid-template-columns:1fr 1.4fr;gap:8px;margin-top:15px;padding-top:11px;background:linear-gradient(rgba(255,255,255,.25),#fff 20%);border-top:1px solid #edf1f4}.qmq-actions button{min-height:49px;border:1px solid #d8e1e8;border-radius:10px;background:#fff;color:#42596d;font-size:10px;font-weight:950}.qmq-actions .save{border-color:#0d5eb8;background:#0d5eb8;color:#fff}.qmq-card-action{min-height:34px;padding:0 11px;border:1px solid #b7d4e8;border-radius:8px;background:#f2f8fc;color:#0d6199;font-size:8.6px;font-weight:900}.record-actions.qmq-added{display:flex;justify-content:flex-end;gap:7px;padding:9px 11px 10px;background:#fbfcfd}
      @media(min-width:700px){.qmq-row{grid-template-columns:repeat(2,minmax(0,1fr))}.qmq-row .full,.qmq-items,.qmq-overall,.qmq-gate,.qmq-actions{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function editorNodes() {
    return {
      editor: document.getElementById('editor'),
      title: document.getElementById('editorTitle'),
      sub: document.getElementById('editorSub'),
      body: document.getElementById('editorBody'),
      error: document.getElementById('formError')
    };
  }

  function closeEditor() {
    const {editor,error} = editorNodes();
    if (editor) { editor.classList.remove('open'); editor.setAttribute('aria-hidden','true'); }
    if (error) { error.classList.remove('show'); error.textContent = ''; }
    state.currentGroup = '';
  }

  function showError(text) {
    const {error} = editorNodes();
    if (!error) return;
    error.textContent = text;
    error.classList.add('show');
  }

  function currentUserFromPage() {
    const text = clean(document.getElementById('userName')?.textContent).replace(/님$/,'');
    return text && text !== '확인 중' && text !== '로그인 필요' ? text : state.user || '';
  }

  function renderEditor(groupKeyValue) {
    const nodes = editorNodes();
    if (!nodes.editor || !nodes.body) return;
    const group = groupKeyValue ? state.groups.get(groupKeyValue) : null;
    state.currentGroup = group?.key || '';
    const representative = group?.rows?.[0] || {};
    const lot = clean(representative.lot);
    const work = state.workByLot.get(lot);
    const inspectionDate = clean(representative.date || work?.payload?.doc?.date || work?.batch?.due || today()).slice(0,10) || today();
    const shipDate = clean(representative.shipDate || today()).slice(0,10) || today();
    const inspectionNo = group?.key || nextNo(inspectionDate);
    const product = clean(representative.product || work?.item);
    const gateOk = lot ? productionComplete(work) : false;
    const holdBlocked = lot && work ? hasActiveHold(work.payload,lot) : false;
    const oqcGateOk = !isOqc || (gateOk && !holdBlocked);
    const customer = clean(representative.customer || work?.payload?.lotRecord?.ship?.customer);
    const shipQty = num(representative.shipQty || work?.payload?.lotRecord?.qty || work?.batch?.qty || work?.batch?.done);
    nodes.title.textContent = group ? `${isOqc?'출하':'공정'}검사 수정` : `${isOqc?'출하':'공정'}검사 신규등록`;
    nodes.sub.textContent = '모바일 · iPad 전용';
    if (nodes.error) { nodes.error.textContent=''; nodes.error.classList.remove('show'); }
    nodes.body.innerHTML = `<form id="qmqForm" class="form-grid qmq-row">
      <div class="qmq-gate ${gateOk && oqcGateOk ? 'ok':''}" id="qmqGate">${lot ? (gateOk ? (holdBlocked ? '활성 HOLD가 있어 출하 게이트가 차단되어 있습니다.' : '생산실적 완료 LOT입니다.') : '생산실적 완료 전에는 검사 저장이 차단됩니다.') : '작업지시 LOT를 선택하면 생산 게이트를 확인합니다.'}</div>
      <div class="form-field"><label>${isOqc?'출하번호':'공정번호'}</label><input name="inspectionNo" value="${esc(inspectionNo)}" readonly></div>
      <div class="form-field"><label>검사일자 *</label><input name="date" type="date" value="${esc(inspectionDate)}" ${group?'readonly':''}></div>
      <div class="form-field"><label>작업지시 LOT *</label><select name="lot" id="qmqLot">${lotOptions(lot)}</select></div>
      <div class="form-field"><label>제품명 *</label><input name="product" id="qmqProduct" value="${esc(product)}" ${isOqc?'readonly':''}></div>
      ${isOqc ? `<div class="form-field"><label>출하일자 *</label><input name="shipDate" type="date" value="${esc(shipDate)}"></div><div class="form-field"><label>고객사 *</label><input name="customer" value="${esc(customer)}"></div><div class="form-field"><label>출하수량 (kg) *</label><input name="shipQty" type="number" min="0" step="0.001" inputmode="decimal" value="${shipQty || ''}"></div><div class="form-field"><label>납품처</label><input name="destination" value="${esc(representative.destination || work?.payload?.lotRecord?.ship?.destination || '')}"></div>` : ''}
      <div class="form-field"><label>검사자 *</label><input name="inspector" value="${esc(representative.inspector || currentUserFromPage())}"></div>
      <div class="form-field full"><label>특이사항</label><textarea name="remarks">${esc(representative.remarks || '')}</textarea></div>
      <div class="form-section qmq-items"><strong>검사항목 · 측정값</strong>${measurementTable(group)}<div class="qmq-overall" id="qmqOverall">전체 판정: 확인 중</div></div>
      <div class="qmq-actions"><button type="button" id="qmqCancel">취소</button><button class="save" type="submit">${isOqc?'출하검사 저장':'공정검사 저장'}</button></div>
    </form>`;
    const form = document.getElementById('qmqForm');
    form.addEventListener('input', refreshJudges);
    form.addEventListener('change', refreshJudges);
    form.addEventListener('submit', saveQuality);
    document.getElementById('qmqCancel')?.addEventListener('click', closeEditor);
    document.getElementById('qmqLot')?.addEventListener('change', handleLotChange);
    refreshJudges();
    nodes.editor.classList.add('open');
    nodes.editor.setAttribute('aria-hidden','false');
  }

  function handleLotChange(event) {
    const lot = clean(event.target.value);
    const work = state.workByLot.get(lot);
    const form = event.target.form;
    if (form && work) {
      if (form.product) form.product.value = isOqc && work.item === '절연 슬러리' ? '' : work.item;
      const dateValue = clean(work.payload?.doc?.date || work.batch?.due || today()).slice(0,10);
      if (form.date && dateValue) form.date.value = dateValue;
      if (isOqc && form.shipQty && !form.shipQty.value) form.shipQty.value = num(work.payload?.lotRecord?.qty || work.batch?.done || work.batch?.qty) || '';
      if (form.inspectionNo && !state.currentGroup) form.inspectionNo.value = nextNo(form.date.value);
    }
    const gate = document.getElementById('qmqGate');
    if (gate) {
      const complete = productionComplete(work);
      const holdBlocked = lot && work ? hasActiveHold(work.payload,lot) : false;
      gate.classList.toggle('ok',complete && !holdBlocked);
      gate.textContent = !lot ? '작업지시 LOT를 선택하면 생산 게이트를 확인합니다.' : !complete ? '생산실적 완료 전에는 검사 저장이 차단됩니다.' : holdBlocked ? '활성 HOLD가 있어 출하 게이트가 차단되어 있습니다.' : '생산실적 완료 LOT입니다.';
    }
    refreshJudges();
  }

  function measurementValues(form,item) {
    const count = isOqc ? 3 : (item === '외관' ? 1 : 3);
    const values=[];
    for(let index=0; index<count; index += 1) values.push(clean(form.elements[`m__${item}__${index}`]?.value));
    return values;
  }

  function refreshJudges() {
    const form = document.getElementById('qmqForm');
    if (!form) return;
    let allPass = true;
    let complete = true;
    ITEMS.forEach((item) => {
      const values = measurementValues(form,item);
      if (values.some((v)=>!v)) complete = false;
      const judge = judgeItem(item,values);
      if (judge !== '합격') allPass = false;
      const badge = document.querySelector(`[data-judge="${CSS.escape(item)}"]`);
      if (badge) { badge.textContent = judge; badge.className = judge === '합격' ? 'pass' : 'fail'; }
    });
    const overall = document.getElementById('qmqOverall');
    if (overall) {
      const value = complete && allPass ? '합격' : complete ? '불합격' : '입력대기';
      overall.textContent = `전체 판정: ${value}`;
      overall.className = `qmq-overall ${value==='합격'?'pass':value==='불합격'?'fail':''}`;
    }
  }

  async function saveQuality(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    const lot = clean(fd.get('lot'));
    const work = state.workByLot.get(lot);
    const date = clean(fd.get('date'));
    const inspector = clean(fd.get('inspector'));
    const product = clean(fd.get('product'));
    if (!lot || !work || !date || !inspector || (!isOqc && !product)) {
      showError('작업지시 LOT, 검사일자, 제품명, 검사자를 확인하세요.');
      return;
    }
    if (!productionComplete(work)) {
      showError('생산실적 완료 전에는 공정/출하검사를 저장할 수 없습니다.');
      return;
    }
    if (isOqc && hasActiveHold(work.payload,lot)) {
      showError('활성 HOLD가 있어 출하 게이트가 차단되어 있습니다.');
      return;
    }
    const valuesByItem = {};
    let complete = true;
    ITEMS.forEach((item) => { valuesByItem[item] = measurementValues(form,item); if(valuesByItem[item].some((v)=>!v)) complete=false; });
    if (!complete) {
      showError(isOqc ? '출하검사 8개 항목의 측정값을 3회씩 모두 입력하세요.' : '점도·고형분·입도는 3회, 외관은 1회 측정값을 모두 입력하세요.');
      return;
    }
    const customer = clean(fd.get('customer'));
    const shipQty = num(fd.get('shipQty'));
    const shipDate = clean(fd.get('shipDate'));
    if (isOqc && (!shipDate || !customer || shipQty <= 0)) {
      showError('출하일자, 고객사, 출하수량을 확인하세요.');
      return;
    }
    const baseNo = state.currentGroup || clean(fd.get('inspectionNo')) || nextNo(date);
    const time = timeText();
    const rows = ITEMS.map((item,index) => {
      const values = valuesByItem[item];
      const nums = values.map((v)=>Number(v.replace(/,/g,''))).filter(Number.isFinite);
      return {
        id:`${baseNo}-${index+1}`,
        groupId:baseNo,
        date,
        shipDate:isOqc?shipDate:'',
        time,
        lot,
        product:isOqc && product === '절연 슬러리' ? '' : product,
        check:item,
        ...(isOqc ? {customer,shipQty,destination:clean(fd.get('destination'))} : {}),
        value:values.join(' / '),
        measurements:values,
        average:item === '외관' || item === '전해액 안정성' || nums.length !== values.length ? null : nums.reduce((a,b)=>a+b,0)/nums.length,
        judge:judgeItem(item,values),
        note:isOqc?'OQC':'PQC/OQC',
        remarks:clean(fd.get('remarks')),
        inspector,
        source:'MOBILE QMES'
      };
    });
    const overallJudge = rows.every((row)=>row.judge==='합격') ? '합격' : '불합격';
    let lotRecord = work.payload?.lotRecord ? {...work.payload.lotRecord} : null;
    let holds = Array.isArray(work.payload?.holds) ? work.payload.holds.map((row)=>({...row})) : [];
    if (overallJudge === '불합격') {
      const existing = holds.some((hold)=>clean(hold.target).includes(lot) && /차단|보류|격리|대기/.test(clean(hold.status)));
      if (!existing) holds.unshift({id:`HLD-M-${Date.now()}`,target:lot,type:'제품 Lot',gate:isOqc?'출하 게이트':'공정 게이트',reason:`${isOqc?'출하':'공정'}검사 부적합 항목 발생`,since:time,cond:'재검사 합격 + 품질부장 승인',status:'차단중',ncr:'-'});
      if (lotRecord) lotRecord.status = `홀드 — 부적합 발생 (${isOqc?'출하':'공정'} 게이트 차단)`;
    } else if (lotRecord) {
      if (isOqc) {
        lotRecord.ship = {customer,qty:shipQty,shipQty,shipDate,date:shipDate,destination:clean(fd.get('destination')),shipNo:baseNo,inspector,confirmedAt:new Date().toISOString()};
        lotRecord.stage='출하';
        lotRecord.status='출하완료';
      } else {
        lotRecord.stage='생산';
        if (!/홀드/.test(clean(lotRecord.status))) lotRecord.status='PQC 합격 — OQC 대기';
      }
    }
    const previous = state.currentGroup ? state.groups.get(state.currentGroup)?.payload || {} : {};
    const payload = {...previous,mode,lotNo:lot,rows,lotRecord,holds,savedAt:new Date().toISOString(),savedBy:inspector};
    const loading = document.getElementById('loading');
    const loadingText = document.getElementById('loadingText');
    if (loadingText) loadingText.textContent=`${isOqc?'출하':'공정'}검사를 저장하는 중입니다.`;
    if (loading) loading.classList.add('show');
    try {
      await api(`/api/qmes-sync/${tab}`,{method:'POST',body:JSON.stringify({key:baseNo,payload})});
      closeEditor();
      await reloadState();
      const refresh = document.getElementById('refreshBtn');
      if (refresh) refresh.click();
      const message = document.getElementById('message');
      if (message) { message.textContent=`${isOqc?'출하':'공정'}검사 ${baseNo} 저장 완료 · PC 공용 DB와 동기화됩니다.`; message.className='message show'; }
      setTimeout(injectCardActions,250);
    } catch (error) {
      if (error.message !== 'AUTH') showError(`저장 실패: ${error.message}`);
    } finally {
      if (loading) loading.classList.remove('show');
    }
  }

  function findGroupForCard(card) {
    const title = clean(card.querySelector('.record-title strong')?.textContent);
    if (state.groups.has(title)) return title;
    for (const [key,group] of state.groups) {
      const row = group.rows?.[0] || {};
      if (title === clean(row.groupId) || title === clean(row.lot) || title === clean(row.id).replace(/-\d+$/,'')) return key;
    }
    return '';
  }

  function injectCardActions() {
    const list = document.getElementById('recordList');
    if (!list) return;
    list.querySelectorAll('.record').forEach((card) => {
      if (card.querySelector('.qmq-card-action')) return;
      const key = findGroupForCard(card);
      if (!key) return;
      let actions = card.querySelector('.record-actions');
      if (!actions) {
        actions = document.createElement('div');
        actions.className='record-actions qmq-added';
        card.appendChild(actions);
      }
      const button = document.createElement('button');
      button.type='button';
      button.className='qmq-card-action';
      button.textContent='수정';
      button.addEventListener('click',()=>renderEditor(key));
      actions.appendChild(button);
    });
  }

  async function reloadState() {
    const [qualityRecords,workRecords,user] = await Promise.all([
      api(`/api/qmes-sync/${tab}`).catch(()=>[]),
      api('/api/qmes-sync/workorder').catch(()=>[]),
      api('/api/auth/me').catch(()=>null)
    ]);
    state.records = Array.isArray(qualityRecords) ? qualityRecords : [];
    state.groups = parseGroups(state.records);
    const work = parseWorkorders(workRecords);
    state.workorders=work.list;
    state.workByLot=work.map;
    state.user=clean(user?.user?.name || user?.name || user?.user?.loginId || user?.loginId);
  }

  function replaceCreateButton() {
    const old = document.getElementById('createBtn');
    if (!old) return;
    const button = old.cloneNode(true);
    old.replaceWith(button);
    button.classList.add('show');
    button.textContent='신규등록';
    button.addEventListener('click',()=>renderEditor(''));
  }

  async function start() {
    addStyles();
    try {
      await reloadState();
      replaceCreateButton();
      injectCardActions();
      const list=document.getElementById('recordList');
      if (list) {
        state.observer=new MutationObserver(()=>injectCardActions());
        state.observer.observe(list,{childList:true,subtree:true});
      }
      document.getElementById('refreshBtn')?.addEventListener('click',()=>setTimeout(async()=>{await reloadState();injectCardActions();},350));
    } catch (error) {
      console.warn('QMES mobile quality editor init failed:',error);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(start,50),{once:true});
  else setTimeout(start,50);
})();
