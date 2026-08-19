/* QMES inventory production LOT flow patch - 2026-08-19 */
(function(){
  const OriginalInventoryEnterpriseTab=InventoryEnterpriseTab;
  const text=v=>String(v==null?'':v).trim();
  const upper=v=>text(v).toUpperCase();
  const fmt=v=>Number(v||0).toLocaleString('ko-KR',{maximumFractionDigits:3});

  function lotQc(lot){
    const key=upper(lot);
    const pqcRows=Array.isArray(window.DB?.insp?.PQC)?window.DB.insp.PQC.filter(r=>upper(r?.lot)===key):[];
    const oqcRows=Array.isArray(window.DB?.insp?.OQC)?window.DB.insp.OQC.filter(r=>upper(r?.lot)===key):[];
    const req=['외관','입도(Dmax)','점도','고형분'];
    const latest=new Map();
    pqcRows.forEach(r=>{const c=text(r?.check);if(!c)return;const p=latest.get(c);const nk=`${text(r?.date)} ${text(r?.time)} ${text(r?.id)}`;const pk=p?`${text(p?.date)} ${text(p?.time)} ${text(p?.id)}`:'';if(!p||nk>=pk)latest.set(c,r);});
    const pqcDone=req.every(c=>latest.get(c)&&text(latest.get(c).judge)==='합격');
    const oqcDone=oqcRows.some(r=>text(r?.judge)==='합격');
    return {pqc:pqcDone?'합격':(pqcRows.length?'진행중':'대기'),oqc:oqcDone?'합격':(oqcRows.length?'진행중':'대기')};
  }

  function statusOf(row,qc){
    if(qc.oqc==='합격') return '출하가능';
    if(qc.pqc==='합격') return 'OQC 대기';
    if(row.quality_status==='OQC_PENDING') return 'OQC 대기';
    if(row.category==='FG') return 'PQC 대기';
    if(row.category==='WIP') return '생산중';
    return '생산대기';
  }

  function ProductionLotFlow(){
    const [stock,setStock]=useState([]),[transactions,setTransactions]=useState([]),[reservations,setReservations]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[openLot,setOpenLot]=useState('');
    const load=async()=>{setLoading(true);setError('');try{const [s,t,r]=await Promise.all([invApi('/stock'),invApi('/transactions?limit=500'),invApi('/reservations')]);setStock(s||[]);setTransactions(t||[]);setReservations(r||[]);}catch(e){setError(e.message);}finally{setLoading(false);}};
    useEffect(()=>{load();},[]);

    const map=new Map();
    stock.filter(r=>['FG','WIP'].includes(r.category)).forEach(r=>{const lot=upper(r.lot_no);if(!lot)return;map.set(lot,{lot,itemCode:r.item_code,itemName:r.item_name,qty:Number(r.quantity||0),available:Number(r.available_qty||0),location:r.location_code||'-',quality_status:r.quality_status||'',unit:r.unit||'kg',workOrder:'',last:''});});
    transactions.filter(t=>['PRODUCTION_ISSUE','PRODUCTION_RECEIPT'].includes(t.transaction_type)).forEach(t=>{const lot=upper(t.production_lot||t.lot_no);if(!lot)return;const old=map.get(lot)||{lot,itemCode:t.item_code,itemName:t.item_name||'',qty:0,available:0,location:t.to_location||t.from_location||'-',quality_status:t.to_status||'',unit:t.unit||'kg',workOrder:'',last:''};old.workOrder=old.workOrder||t.work_order_no||'';old.last=t.created_at||old.last;if(t.transaction_type==='PRODUCTION_RECEIPT'&&Number(t.quantity)>0)old.qty=Math.max(old.qty,Number(t.quantity));map.set(lot,old);});
    reservations.forEach(r=>{const lot=upper(r.lot_no);if(!lot)return;const old=map.get(lot)||{lot,itemCode:r.item_code,itemName:r.item_name||'',qty:Number(r.quantity||0),available:0,location:r.location_code||'-',quality_status:'',unit:r.unit||'kg',workOrder:r.work_order_no||'',last:r.created_at||''};old.workOrder=old.workOrder||r.work_order_no||'';map.set(lot,old);});

    const rows=Array.from(map.values()).map(r=>{const qc=lotQc(r.lot);return {...r,qc,status:statusOf(r,qc)};}).sort((a,b)=>a.lot.localeCompare(b.lot)*-1);
    const stages=['생산대기','생산중','PQC 대기','OQC 대기','출하가능'];
    const counts=stages.reduce((o,s)=>(o[s]=rows.filter(r=>r.status===s).length,o),{});

    return <div className="inv-shell">
      <div className="inv-title-row"><div><h2>재고관리 · 생산투입/완료</h2><p>LOT 상태 중심 · 생산 → PQC → OQC → 출하가능 흐름</p></div><div className="inv-actions"><button onClick={load}>새로고침</button></div></div>
      {error&&<div className="inv-error">{error}</div>}
      {loading?<div className="inv-loading">생산 LOT 현황을 불러오는 중...</div>:<>
        <div style={{display:'grid',gridTemplateColumns:'repeat(5,minmax(0,1fr))',gap:12,marginBottom:18}}>
          {stages.map(s=><div className="inv-panel" key={s} style={{padding:'16px 18px',margin:0}}><div style={{fontSize:13,color:'#64748b',fontWeight:800}}>{s}</div><div style={{fontSize:28,fontWeight:900,marginTop:4}}>{counts[s]||0}<span style={{fontSize:13,fontWeight:700,marginLeft:5}}>LOT</span></div></div>)}
        </div>
        <div className="inv-panel"><h3>생산 LOT 진행현황</h3><table><thead><tr><th>상태</th><th>작업지시</th><th>품목</th><th>생산 LOT</th><th>생산량</th><th>현재위치</th><th>PQC</th><th>OQC</th><th>출하가능량</th><th>상세</th></tr></thead><tbody>{rows.map(r=><React.Fragment key={r.lot}><tr><td><b>{r.status}</b></td><td>{r.workOrder||'-'}</td><td>{r.itemName||r.itemCode||'-'}</td><td><b>{r.lot}</b></td><td className="num">{fmt(r.qty)} {r.unit}</td><td>{r.location}</td><td>{r.qc.pqc}</td><td>{r.qc.oqc}</td><td className="num strong">{r.status==='출하가능'?fmt(r.available||r.qty):'0'} {r.unit}</td><td><button onClick={()=>setOpenLot(openLot===r.lot?'':r.lot)}>{openLot===r.lot?'닫기':'이력'}</button></td></tr>{openLot===r.lot&&<tr><td colSpan="10" style={{padding:0}}><div style={{padding:'16px 20px',background:'#f8fafc'}}><b>{r.lot} LOT 이력</b><div style={{marginTop:10}}><TxTable rows={transactions.filter(t=>upper(t.production_lot||t.lot_no)===r.lot)}/></div></div></td></tr>}</React.Fragment>)}</tbody></table>{!rows.length&&<div className="inv-empty">표시할 생산 LOT가 없습니다.</div>}</div>
      </>}
    </div>;
  }

  InventoryEnterpriseTab=function InventoryEnterpriseTabPatched(props){
    if((props?.section||'overview')==='production') return <ProductionLotFlow/>;
    return <OriginalInventoryEnterpriseTab {...props}/>;
  };
})();
