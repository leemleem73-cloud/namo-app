/* Namo Chemical Q-MES Enterprise Inventory auto mode v11 - package barcode batch print, 2026-08-20 */
const INV_STATUS_LABEL={AVAILABLE:'사용가능',IQC_PENDING:'IQC 대기',OQC_PENDING:'OQC 대기',HOLD:'HOLD',NONCONFORM:'부적합',RESERVED:'예약'};
const INV_CATEGORY_LABEL={RM:'원료',PM:'부자재',WIP:'재공품',FG:'완제품'};
const INV_TYPE_LABEL={RECEIPT:'입고',ISSUE:'출고',MOVE:'이동',ADJUSTMENT:'조정',PRODUCTION_ISSUE:'생산투입',PRODUCTION_RECEIPT:'생산완료',SHIPMENT:'출하',RETURN:'반품',HOLD:'보류',RELEASE:'보류해제'};
const INV_MOVEMENT_TYPES=new Set(['RECEIPT','ISSUE','MOVE','PRODUCTION_ISSUE','PRODUCTION_RECEIPT','SHIPMENT','RETURN']);

async function invApi(path,options={}){
  const response=await fetch('/api/inventory'+path,{credentials:'same-origin',...options,headers:{'Content-Type':'application/json',...(options.headers||{})}});
  const payload=await response.json().catch(()=>({success:false,message:'서버 응답을 확인할 수 없습니다.'}));
  if(!response.ok||!payload.success)throw new Error(payload.message||'재고 서버 요청에 실패했습니다.');
  return payload.data;
}
const invNum=v=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:3});
function txDisplayReference(tx){
  const workOrder=String(tx?.work_order_no||'').trim();
  if(workOrder)return workOrder;
  const productionLot=String(tx?.production_lot||'').trim();
  if(productionLot)return productionLot;
  const reference=String(tx?.reference_no||'').trim();
  if(/^PHOTO-RACK-MIGRATION-/i.test(reference))return '랙 위치 자동이전';
  if(/^IQC:/i.test(reference))return '수입검사 자동입고';
  if(/^WOISSUE:/i.test(reference))return '생산투입 자동처리';
  if(/^WO:/i.test(reference))return '생산완료 자동입고';
  if(reference.length>32)return '시스템 자동처리';
  return reference||'-';
}
function txMaterialName(tx){
  const materialName=String(tx?.item_name||'').trim();
  if(materialName)return materialName;
  return String(tx?.item_code||'').trim()||'-';
}
function txPhysicalLocation(tx,value){
  const location=String(value||'').trim().toUpperCase();
  if(!location)return '';
  if(location==='RM'||location==='UNASSIGNED'){
    const map=window.qmesInventoryPhysicalLocations;
    const actual=map?.canonicalRawLocation(`${tx?.item_code||''} ${tx?.item_name||''}`);
    return actual&&actual!=='UNASSIGNED'?actual:'위치확인';
  }
  return location;
}
function txDirectionLabel(tx){
  const type=String(tx?.transaction_type||'').trim().toUpperCase();
  let from=txPhysicalLocation(tx,tx?.from_location);
  let to=txPhysicalLocation(tx,tx?.to_location);
  if(!from){
    if(type==='PRODUCTION_RECEIPT')from='생산완료';
    else if(type==='RETURN')from='반품입고';
    else from='외부입고';
  }
  if(!to){
    if(type==='PRODUCTION_ISSUE')to='생산사용';
    else if(type==='SHIPMENT')to='출하';
    else to='외부출고';
  }
  return `${from} → ${to}`;
}
function txDocumentNo(tx){
  const workOrder=String(tx?.work_order_no||'').trim();
  if(workOrder)return workOrder;
  const productionLot=String(tx?.production_lot||'').trim();
  if(productionLot)return productionLot;
  const reference=String(tx?.reference_no||'').trim();
  if(reference&&!/^PHOTO-RACK-MIGRATION-/i.test(reference))return reference;
  return tx?.id?`TX-${tx.id}`:'-';
}
function txBarcodeValue(tx){
  const safe=(value,fallback)=>String(value||'').trim().toUpperCase().replace(/[^\x20-\x7E]/g,'').replace(/\|/g,'-')||fallback;
  const item=safe(tx?.item_code,'UNKNOWN');
  const lot=safe(tx?.lot_no,'NOLOT');
  const location=safe(txPhysicalLocation(tx,tx?.to_location)||txPhysicalLocation(tx,tx?.from_location),'LOCATION');
  return `ITEM:${item}|LOT:${lot}|LOC:${location}`;
}
function txOperatorLabel(tx){
  const name=String(tx?.operator_name||'').trim();
  const id=String(tx?.operator_id||'').trim();
  return name?(id?`${name} (${id})`:name):(id||'-');
}
const InvBadge=({status})=><span className={'inv-badge inv-'+String(status||'').toLowerCase()}>{INV_STATUS_LABEL[status]||status||'-'}</span>;

function InventoryEnterpriseTab({section='overview'}){
  const [stock,setStock]=useState([]),[summary,setSummary]=useState(null),[transactions,setTransactions]=useState([]),[counts,setCounts]=useState([]),[locations,setLocations]=useState([]),[items,setItems]=useState([]),[reservations,setReservations]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[query,setQuery]=useState(''),[category,setCategory]=useState(''),[status,setStatus]=useState(''),[modal,setModal]=useState(null),[selectedTx,setSelectedTx]=useState(null);
  const load=async()=>{setLoading(true);setError('');try{const [s,sm,t,c,l,i,r]=await Promise.all([invApi('/stock'),invApi('/summary'),invApi('/transactions?limit=300'),invApi('/counts'),invApi('/locations'),invApi('/items'),invApi('/reservations')]);setStock(s||[]);setSummary(sm||{});setTransactions(t||[]);setCounts(c||[]);setLocations(l||[]);setItems(i||[]);setReservations(r||[]);}catch(e){setError(e.message);}finally{setLoading(false);}};
  useEffect(()=>{load();const reload=()=>load();document.addEventListener('qmes:inventory-auto-linked',reload);return()=>document.removeEventListener('qmes:inventory-auto-linked',reload);},[]);
  const filtered=stock.filter(row=>(!category||row.category===category)&&(!status||row.quality_status===status)&&(!query||[row.item_code,row.item_name,row.lot_no,row.location_code].join(' ').toLowerCase().includes(query.toLowerCase())));
  const movementRows=transactions.filter(tx=>INV_MOVEMENT_TYPES.has(tx.transaction_type)&&!/^PHOTO-RACK-MIGRATION-/i.test(String(tx.reference_no||'')));
  const totals=(summary?.totals||[]).reduce((a,row)=>{a[row.category]=row;return a;},{});
  const title={overview:'재고현황',movement:'입출고 관리',lot:'LOT별 재고',production:'생산투입/완료',count:'재고실사',history:'재고이력'}[section]||'재고관리';
  return <div className="inv-shell">
    <div className="inv-title-row"><div><h2>재고관리 · {title}</h2><p>PostgreSQL 중앙 DB · LOT/위치/품질상태/원장 기반 실시간 재고</p></div><div className="inv-actions"><button onClick={load}>새로고침</button>{section==='count'&&<button className="primary" onClick={()=>setModal('count')}>실사등록</button>}</div></div>
    {error&&<div className="inv-error">{error}</div>}
    {loading?<div className="inv-loading">재고 데이터를 불러오는 중...</div>:<>
      {section==='overview'&&<><div className="inv-kpis">{['RM','PM','WIP','FG'].map(code=>{const r=totals[code]||{};return <div className="inv-kpi" key={code}><span>{INV_CATEGORY_LABEL[code]}</span><strong>{invNum(r.total_qty)} <small>kg/EA</small></strong><div>가용 {invNum(r.available_qty)} · 대기 {invNum(r.pending_qty)} · HOLD {invNum(r.hold_qty)}</div></div>})}</div><div className="inv-grid2"><div className="inv-panel"><h3>관리 알림</h3><div className="inv-alerts"><div>검사대기 LOT <b>{summary?.pendingLots||0}</b></div><div>안전재고 미달 <b>{summary?.safetyAlerts?.length||0}</b></div><div>유효기간 30일 이내 <b>{summary?.expiryAlerts?.length||0}</b></div><div>활성 예약 <b>{reservations.length}</b></div></div></div><div className="inv-panel"><h3>최근 재고 처리</h3>{transactions.slice(0,6).map(tx=><div className="inv-recent" key={tx.id}><b>{INV_TYPE_LABEL[tx.transaction_type]||tx.transaction_type}</b><span>{tx.item_code} / {tx.lot_no}</span><strong>{invNum(tx.quantity)} {tx.unit}</strong></div>)}</div></div></>}
      {section==='lot'&&<><InventoryFilters query={query} setQuery={setQuery} category={category} setCategory={setCategory} status={status} setStatus={setStatus}/><StockTable rows={filtered}/></>}
      {section==='movement'&&<div className="inv-panel inv-stock-panel inv-movement-panel"><div className="inv-movement-heading"><h3>자동 입출고 처리 내역</h3><span>일시를 선택하면 상세정보와 바코드를 확인할 수 있습니다.</span></div><TxTable rows={movementRows} onSelect={setSelectedTx}/>{!movementRows.length&&<div className="inv-empty">입출고 처리 내역이 없습니다.</div>}</div>}
      {section==='production'&&<><div className="inv-panel"><h3>생산 예약재고</h3><table><thead><tr><th>작업지시</th><th>품목</th><th>LOT</th><th>위치</th><th>예약수량</th><th>등록자</th></tr></thead><tbody>{reservations.map(r=><tr key={r.id}><td>{r.work_order_no}</td><td>{r.item_code}</td><td>{r.lot_no||'자동선정'}</td><td>{r.location_code||'-'}</td><td className="num">{invNum(r.quantity)}</td><td>{r.reserved_by}</td></tr>)}</tbody></table></div><div className="inv-panel"><h3>생산 관련 원장</h3><TxTable rows={transactions.filter(t=>['PRODUCTION_ISSUE','PRODUCTION_RECEIPT'].includes(t.transaction_type))}/></div></>}
      {section==='count'&&<div className="inv-panel"><h3>재고실사 이력</h3><table><thead><tr><th>실사일</th><th>품목</th><th>LOT</th><th>위치</th><th>장부</th><th>실재고</th><th>차이</th><th>실사자</th></tr></thead><tbody>{counts.map(c=><tr key={c.id}><td>{c.count_date}</td><td>{c.item_code}</td><td>{c.lot_no}</td><td>{c.location_code}</td><td className="num">{invNum(c.book_qty)}</td><td className="num">{invNum(c.actual_qty)}</td><td className={'num '+(Number(c.difference_qty)!==0?'warn':'')}>{invNum(c.difference_qty)}</td><td>{c.counted_by}</td></tr>)}</tbody></table></div>}
      {section==='history'&&<div className="inv-panel"><h3>재고 Transaction 원장</h3><TxTable rows={transactions}/></div>}
    </>}
    {modal==='transaction'&&<InventoryTransactionModal stock={stock} items={items} locations={locations} section={section} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
    {modal==='count'&&<InventoryCountModal stock={stock} onClose={()=>setModal(null)} onSaved={()=>{setModal(null);load();}}/>}
    {selectedTx&&<InventoryTransactionDetailModal tx={selectedTx} onClose={()=>setSelectedTx(null)}/>}
  </div>;
}

function InventoryFilters({query,setQuery,category,setCategory,status,setStatus}){return <div className="inv-filter"><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="원료명 / LOT / 위치 검색"/><select value={category} onChange={e=>setCategory(e.target.value)}><option value="">전체 구분</option>{Object.entries(INV_CATEGORY_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)}><option value="">전체 상태</option>{Object.entries(INV_STATUS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></div>}
function StockTable({rows}){return <div className="inv-panel inv-stock-panel"><table className="inv-stock-table"><colgroup><col/><col/><col/><col/><col/><col/><col/><col/><col/></colgroup><thead><tr><th>구분</th><th>원료명</th><th>LOT</th><th>위치</th><th>품질상태</th><th>현재고</th><th>예약</th><th>가용</th><th>유효기간</th></tr></thead><tbody>{rows.map((r,i)=><tr key={i}><td>{INV_CATEGORY_LABEL[r.category]||r.category}</td><td>{r.item_name}</td><td>{r.lot_no}</td><td>{r.location_code==='UNASSIGNED'?'위치확인':r.location_code}</td><td><InvBadge status={r.quality_status}/></td><td className="num">{invNum(r.quantity)} {r.unit}</td><td className="num">{invNum(r.reserved_qty)}</td><td className="num strong">{invNum(r.available_qty)}</td><td>{r.expiry_date?String(r.expiry_date).slice(0,10):'-'}</td></tr>)}</tbody></table>{!rows.length&&<div className="inv-empty">등록된 재고가 없습니다.</div>}</div>}
function TxTable({rows,onSelect}){return <table className="inv-stock-table inv-movement-table"><colgroup><col/><col/><col/><col/><col/><col/><col/></colgroup><thead><tr><th>일시</th><th>구분</th><th>원료명</th><th>LOT</th><th>수량</th><th>이동 방향</th><th>비고</th></tr></thead><tbody>{rows.map(tx=><tr key={tx.id}><td>{onSelect?<button type="button" className="inv-tx-detail-link" onClick={()=>onSelect(tx)} title="상세정보 및 바코드 보기">{new Date(tx.created_at).toLocaleString('ko-KR')}</button>:new Date(tx.created_at).toLocaleString('ko-KR')}</td><td>{INV_TYPE_LABEL[tx.transaction_type]||tx.transaction_type}</td><td title={txMaterialName(tx)}>{txMaterialName(tx)}</td><td>{tx.lot_no}</td><td className="num">{invNum(tx.quantity)} {tx.unit}</td><td>{txDirectionLabel(tx)}</td><td title={txDisplayReference(tx)}>{txDisplayReference(tx)}</td></tr>)}</tbody></table>}

function InventoryTransactionDetailModal({tx,onClose}){
  const requestedCount=Number(tx?.barcode_qty||tx?.package_qty||1);
  const barcodeCount=Math.min(500,Math.max(1,Number.isInteger(requestedCount)?requestedCount:1));
  const packageQty=Number(tx?.package_qty||barcodeCount);
  const packagingType=String(tx?.packaging_type||'').trim();
  const packagingTypeOther=String(tx?.packaging_type_other||'').trim();
  const packagingLabel=packagingType==='기타'&&packagingTypeOther?`${packagingType}(${packagingTypeOther})`:(packagingType||'-');
  const unitWeight=Number(tx?.unit_weight||0);
  const calculatedWeight=Number(tx?.calculated_weight||0);
  const barcodeRefs=React.useRef([]);
  const barcodeValues=Array.from({length:barcodeCount},(_,index)=>`${txBarcodeValue(tx)}|PKG:${String(index+1).padStart(3,'0')}/${String(barcodeCount).padStart(3,'0')}`);
  const barcodeSignature=barcodeValues.join('||');

  React.useEffect(()=>{
    if(!window.JsBarcode)return;
    barcodeValues.forEach((value,index)=>{
      const element=barcodeRefs.current[index];
      if(element)window.JsBarcode(element,value,{format:'CODE128',displayValue:true,height:64,margin:8,fontSize:13,lineColor:'#0f172a'});
    });
  },[barcodeSignature]);
  React.useEffect(()=>{
    const close=e=>{if(e.key==='Escape')onClose();};
    document.addEventListener('keydown',close);
    return()=>document.removeEventListener('keydown',close);
  },[onClose]);

  const printBarcode=()=>{
    const printWindow=window.open('','_blank',`width=900,height=760`);
    if(!printWindow||!barcodeRefs.current[0])return;
    const doc=printWindow.document;
    doc.title=`${tx.item_code||txMaterialName(tx)} ${tx.lot_no||''} 용기 바코드 ${barcodeCount}매`;
    const style=doc.createElement('style');
    style.textContent='@page{size:A4 portrait;margin:10mm}*{box-sizing:border-box}body{margin:0;font-family:Arial,"Noto Sans KR",sans-serif;color:#0f172a}.label{width:100%;min-height:126mm;border:1.5px solid #cbd5e1;border-radius:10px;padding:10mm;page-break-after:always}.label:last-child{page-break-after:auto}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:10px;margin-bottom:12px}.head h1{font-size:24px;margin:0}.head b{font-size:16px}.grid{display:grid;grid-template-columns:1fr 1fr;border:1px solid #cbd5e1;border-radius:8px;overflow:hidden;margin-bottom:16px}.cell{padding:9px 12px;border-right:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}.cell:nth-child(2n){border-right:0}.cell small{display:block;color:#64748b;font-weight:700;margin-bottom:4px}.cell strong{font-size:16px}.wide{grid-column:1/-1;border-right:0}.barcode{border:1px dashed #94a3b8;border-radius:8px;padding:14px;text-align:center}.barcode svg{max-width:100%;height:82px}.footer{margin-top:10px;font-size:11px;color:#64748b;text-align:right}';
    doc.head.appendChild(style);
    barcodeValues.forEach((value,index)=>{
      const label=doc.createElement('section');
      label.className='label';
      const cells=[
        ['문서번호',txDocumentNo(tx)],['구분',INV_TYPE_LABEL[tx.transaction_type]||tx.transaction_type],
        ['원료명',txMaterialName(tx)],['원료코드',tx.item_code||'-'],
        ['LOT',tx.lot_no||'-'],['총 입고중량',`${invNum(tx.quantity)} ${tx.unit||'kg'}`],
        ['포장형태',packagingLabel],['용기번호',`${index+1} / ${barcodeCount}`],
        ['용기당 중량',unitWeight>0?`${invNum(unitWeight)} kg`:'-'],['계산중량',calculatedWeight>0?`${invNum(calculatedWeight)} kg`:'-'],
        ['이동 방향',txDirectionLabel(tx)],['작업자',txOperatorLabel(tx)],
        ['비고',txDisplayReference(tx)]
      ];
      label.innerHTML=`<div class="head"><div><h1>NAMO Chemical 원료 바코드</h1><b>${txMaterialName(tx)}</b></div><strong>${index+1} / ${barcodeCount}</strong></div><div class="grid">${cells.map((cell,cellIndex)=>`<div class="cell ${cellIndex===10||cellIndex===12?'wide':''}"><small>${cell[0]}</small><strong></strong></div>`).join('')}</div><div class="barcode"><b>원료·LOT·위치·용기 CODE128</b></div><div class="footer">발행 ${new Date().toLocaleString('ko-KR')} · ERP 연동용</div>`;
      Array.from(label.querySelectorAll('.cell strong')).forEach((element,cellIndex)=>{element.textContent=String(cells[cellIndex][1]??'-');});
      const barcodeWrap=label.querySelector('.barcode');
      const barcode=barcodeRefs.current[index]?.cloneNode(true);
      if(barcode)barcodeWrap.appendChild(barcode);
      else{const code=doc.createElement('code');code.textContent=value;barcodeWrap.appendChild(code);}
      doc.body.appendChild(label);
    });
    doc.close();
    printWindow.focus();
    window.setTimeout(()=>{printWindow.print();printWindow.close();},250);
  };

  return <div className="inv-tx-detail-overlay" role="dialog" aria-modal="true" aria-labelledby="inv-tx-detail-title" onMouseDown={e=>{if(e.target===e.currentTarget)onClose();}}><section className="inv-tx-detail-sheet"><div className="inv-tx-detail-head"><div><span>INVENTORY TRANSACTION</span><h3 id="inv-tx-detail-title">입출고 처리 상세</h3></div><button type="button" onClick={onClose} aria-label="닫기">×</button></div><div className="inv-tx-detail-status"><b>처리 완료</b><span>{new Date(tx.created_at).toLocaleString('ko-KR')}</span></div><dl className="inv-tx-detail-grid"><div><dt>문서번호</dt><dd>{txDocumentNo(tx)}</dd></div><div><dt>구분</dt><dd>{INV_TYPE_LABEL[tx.transaction_type]||tx.transaction_type}</dd></div><div><dt>원료명</dt><dd>{txMaterialName(tx)}</dd></div><div><dt>원료코드</dt><dd>{tx.item_code||'-'}</dd></div><div><dt>LOT</dt><dd>{tx.lot_no||'-'}</dd></div><div><dt>총 수량</dt><dd>{invNum(tx.quantity)} {tx.unit}</dd></div><div><dt>포장형태</dt><dd>{packagingLabel}</dd></div><div><dt>입고 포장수량</dt><dd>{packageQty>0?`${packageQty} EA`:'-'}</dd></div><div><dt>용기당 중량</dt><dd>{unitWeight>0?`${invNum(unitWeight)} kg`:'-'}</dd></div><div><dt>바코드 발행수량</dt><dd>{barcodeCount} 매</dd></div><div className="wide"><dt>이동 방향</dt><dd>{txDirectionLabel(tx)}</dd></div><div><dt>작업자</dt><dd>{txOperatorLabel(tx)}</dd></div><div><dt>비고</dt><dd>{txDisplayReference(tx)}</dd></div></dl><div className="inv-tx-barcode"><div><b>원료·LOT·위치·용기 바코드</b><span>ERP 연동용 CODE128 · 총 {barcodeCount}매</span></div>{barcodeValues.map((value,index)=><div key={value} style={{display:index===0?'block':'none'}}><svg ref={element=>{barcodeRefs.current[index]=element;}} aria-label={`재고 용기 바코드 ${value}`}></svg>{!window.JsBarcode&&<code>{value}</code>}</div>)}</div><div className="inv-tx-detail-actions"><button type="button" onClick={onClose}>닫기</button><button type="button" className="primary" onClick={printBarcode}>QR 인쇄</button></div></section></div>;
}

function InventoryTransactionModal({stock,items,locations,section,onClose,onSaved}){
  const defaultType=section==='production'?'PRODUCTION_ISSUE':'RECEIPT';
  const [form,setForm]=useState({transactionType:defaultType,itemCode:'',itemName:'',category:'RM',lotNo:'',quantity:'',unit:'kg',fromLocation:'',toLocation:defaultType==='RECEIPT'?'IQC':'',fromStatus:'AVAILABLE',toStatus:defaultType==='RECEIPT'?'IQC_PENDING':'AVAILABLE',workOrderNo:'',productionLot:'',referenceNo:'',supplier:'',receivedAt:'',expiryDate:'',reason:'',remark:''}),[saving,setSaving]=useState(false),[error,setError]=useState('');
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const submit=async e=>{e.preventDefault();setSaving(true);setError('');try{await invApi('/transactions',{method:'POST',body:JSON.stringify(form)});onSaved();}catch(err){setError(err.message);}finally{setSaving(false);}};
  return <div className="inv-modal"><form onSubmit={submit}><div className="inv-modal-head"><h3>재고 Transaction 등록</h3><button type="button" onClick={onClose}>×</button></div>{error&&<div className="inv-error">{error}</div>}<div className="inv-form-grid"><label>처리유형<select value={form.transactionType} onChange={e=>set('transactionType',e.target.value)}>{Object.entries(INV_TYPE_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>품목코드<input list="inv-items" value={form.itemCode} onChange={e=>set('itemCode',e.target.value)}/><datalist id="inv-items">{items.map(i=><option key={i.item_code} value={i.item_code}>{i.item_name}</option>)}</datalist></label><label>품목명<input value={form.itemName} onChange={e=>set('itemName',e.target.value)}/></label><label>구분<select value={form.category} onChange={e=>set('category',e.target.value)}>{Object.entries(INV_CATEGORY_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>LOT<input required value={form.lotNo} onChange={e=>set('lotNo',e.target.value)}/></label><label>수량<input required type="number" min="0.001" step="0.001" value={form.quantity} onChange={e=>set('quantity',e.target.value)}/></label><label>단위<input value={form.unit} onChange={e=>set('unit',e.target.value)}/></label><label>From 위치<select value={form.fromLocation} onChange={e=>set('fromLocation',e.target.value)}><option value="">없음</option>{locations.map(l=><option key={l.location_code}>{l.location_code}</option>)}</select></label><label>To 위치<select value={form.toLocation} onChange={e=>set('toLocation',e.target.value)}><option value="">없음</option>{locations.map(l=><option key={l.location_code}>{l.location_code}</option>)}</select></label><label>From 상태<select value={form.fromStatus} onChange={e=>set('fromStatus',e.target.value)}>{Object.entries(INV_STATUS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>To 상태<select value={form.toStatus} onChange={e=>set('toStatus',e.target.value)}>{Object.entries(INV_STATUS_LABEL).map(([k,v])=><option key={k} value={k}>{v}</option>)}</select></label><label>작업지시번호<input value={form.workOrderNo} onChange={e=>set('workOrderNo',e.target.value)}/></label><label>생산 LOT<input value={form.productionLot} onChange={e=>set('productionLot',e.target.value)}/></label><label>참조번호<input value={form.referenceNo} onChange={e=>set('referenceNo',e.target.value)}/></label><label>공급사<input value={form.supplier} onChange={e=>set('supplier',e.target.value)}/></label><label>입고일<input type="date" value={form.receivedAt} onChange={e=>set('receivedAt',e.target.value)}/></label><label>유효기간<input type="date" value={form.expiryDate} onChange={e=>set('expiryDate',e.target.value)}/></label><label className="wide">사유/비고<input value={form.reason} onChange={e=>set('reason',e.target.value)} placeholder="재고조정/보류 등 사유"/></label></div><div className="inv-modal-actions"><button type="button" onClick={onClose}>취소</button><button className="primary" disabled={saving}>{saving?'저장 중...':'확정 저장'}</button></div></form></div>;
}
function InventoryCountModal({stock,onClose,onSaved}){const [key,setKey]=useState(''),[actual,setActual]=useState(''),[reason,setReason]=useState(''),[error,setError]=useState('');const row=stock[Number(key)]||null;const submit=async e=>{e.preventDefault();if(!row)return;try{await invApi('/counts',{method:'POST',body:JSON.stringify({itemCode:row.item_code,lotNo:row.lot_no,locationCode:row.location_code,qualityStatus:row.quality_status,actualQty:actual,reason})});onSaved();}catch(err){setError(err.message);}};return <div className="inv-modal"><form onSubmit={submit}><div className="inv-modal-head"><h3>재고실사 등록</h3><button type="button" onClick={onClose}>×</button></div>{error&&<div className="inv-error">{error}</div>}<label>실사대상<select required value={key} onChange={e=>setKey(e.target.value)}><option value="">선택</option>{stock.map((r,i)=><option key={i} value={i}>{r.item_code} / {r.lot_no} / {r.location_code} / {invNum(r.quantity)}</option>)}</select></label><label>실재고<input required type="number" min="0" step="0.001" value={actual} onChange={e=>setActual(e.target.value)}/></label><label>차이 사유<input value={reason} onChange={e=>setReason(e.target.value)}/></label><div className="inv-modal-actions"><button type="button" onClick={onClose}>취소</button><button className="primary">실사 반영</button></div></form></div>}

function InventoryOverviewTab(){return <InventoryEnterpriseTab section="overview"/>}function InventoryMovementTab(){return <InventoryEnterpriseTab section="movement"/>}function InventoryLotTab(){return <InventoryEnterpriseTab section="lot"/>}function InventoryProductionTab(){return <InventoryEnterpriseTab section="production"/>}function InventoryCountTab(){return <InventoryEnterpriseTab section="count"/>}function InventoryHistoryTab(){return <InventoryEnterpriseTab section="history"/>}
