/* LOT 통합 추적 간편 화면 */
(function(){
  const tone=v=>/불합격|격리|홀드|차단|반품|이탈/.test(String(v||""))?"red":/대기|검사|진행|근접|확인/.test(String(v||""))?"amber":/합격|완료|정상|사용가능/.test(String(v||""))?"green":"blue";
  const uniq=a=>Array.from(new Set((a||[]).map(v=>String(v||"").trim()).filter(Boolean)));
  const Card=({title,value,sub,kind="sky"})=><div className={`rounded-xl border p-4 border-${kind}-500/40 bg-${kind}-500/10`}><div className={`text-xs font-black text-${kind}-300`}>{title}</div><div className="mt-2 text-xl font-black text-white break-words">{value||"-"}</div>{sub&&<div className="mt-1 text-xs text-slate-400 break-words">{sub}</div>}</div>;

  TraceTab=function TraceTab(){
    const lots=DB.lots||{}, mids=DB.intermediateLots||{}, ids=Object.keys(lots);
    const [mode,setMode]=useState("finished"),[query,setQuery]=useState(""),[selected,setSelected]=useState(ids[0]||""),[rawSelected,setRawSelected]=useState("");
    if(!ids.length)return <Panel title="LOT 추적"><p className="text-sm text-slate-500">등록된 LOT이 없습니다.</p></Panel>;
    const q=query.trim().toLowerCase(), active=lots[selected]?selected:ids[0], lot=lots[active];
    const finished=ids.filter(id=>[id,lots[id].itemName,lots[id].item,lots[id].wo,lots[id].status].concat((lots[id].materials||[]).flatMap(m=>[m.lot,m.name,m.supplier])).join(" ").toLowerCase().includes(q));
    const rawMap={};
    const add=(raw,finishedId,name,supplier,mid)=>{raw=String(raw||"").trim();if(!raw)return;const r=rawMap[raw]||(rawMap[raw]={lot:raw,names:[],suppliers:[],finished:[],mids:[]});r.names.push(name||"원재료");r.suppliers.push(supplier||"");r.finished.push(finishedId||"");r.mids.push(mid||"");};
    Object.entries(lots).forEach(([id,row])=>(row.materials||[]).forEach(m=>add(m.lot,id,m.name,m.supplier,"")));
    Object.entries(mids).forEach(([mid,row])=>(row.parentLots||[]).forEach(raw=>{(row.childLots||[]).forEach(id=>add(raw,id,"","",mid));Object.entries(lots).forEach(([id,l])=>{if(l.binderLot===mid)add(raw,id,"","",mid);});}));
    const raws=Object.values(rawMap).map(r=>({...r,names:uniq(r.names),suppliers:uniq(r.suppliers),finished:uniq(r.finished).filter(id=>lots[id]),mids:uniq(r.mids)})).filter(r=>[r.lot,...r.names,...r.suppliers,...r.finished,...r.mids].join(" ").toLowerCase().includes(q));
    const raw=raws.find(r=>r.lot===rawSelected)||raws[0]||null, affected=raw?raw.finished.map(id=>({id,...lots[id]})):[], shipped=affected.filter(r=>r.ship), customers=uniq(shipped.flatMap(r=>[r.ship?.customer,r.ship?.dest])), risk=affected.filter(r=>/불합격|격리|홀드|차단|반품|이탈/.test(String(r.status||"")));
    const openNcr=()=>{try{sessionStorage.setItem("qmes_current_tab","ncr");}catch(e){}window.location.reload();};
    const materials=lot.materials||[], midId=lot.binderLot||(mids[active]?active:""), mid=midId?mids[midId]:null;
    return <div className="flex flex-col gap-4">
      <Panel title="LOT 통합 추적" right={<span className="text-xs font-black text-sky-300">검색 → 영향 범위 → 조치</span>}>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={()=>{setMode("finished");setQuery("");}} className={`rounded-lg border px-4 py-3 text-sm font-black ${mode==="finished"?"border-sky-400 bg-sky-500/15 text-white":"border-slate-700 bg-slate-800 text-slate-400"}`}>완제품 LOT 조회</button>
          <button onClick={()=>{setMode("raw");setQuery("");}} className={`rounded-lg border px-4 py-3 text-sm font-black ${mode==="raw"?"border-violet-400 bg-violet-500/15 text-white":"border-slate-700 bg-slate-800 text-slate-400"}`}>원료 LOT 역추적</button>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-slate-600 bg-slate-900 px-4 py-3"><Search size={18} className="text-sky-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder={mode==="finished"?"완제품 LOT, 품명, 작업지시 번호 검색":"문제가 발생한 원료 LOT 번호 검색"} className="min-w-0 flex-1 bg-transparent text-base font-bold text-white placeholder-slate-500 focus:outline-none"/></div>
        <div className="mt-3 flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-lg border border-slate-800 p-2">
          {mode==="finished"?finished.slice(0,30).map(id=><button key={id} onClick={()=>setSelected(id)} className={`rounded-lg border px-3 py-2 text-left ${active===id?"border-sky-400 bg-sky-500/15":"border-slate-700 bg-slate-800"}`}><div className="font-mono text-sm font-black text-white">{id}</div><div className="text-xs text-slate-400">{lots[id].itemName||"품명 미등록"}</div></button>):raws.slice(0,30).map(r=><button key={r.lot} onClick={()=>setRawSelected(r.lot)} className={`rounded-lg border px-3 py-2 text-left ${raw?.lot===r.lot?"border-violet-400 bg-violet-500/15":"border-slate-700 bg-slate-800"}`}><div className="font-mono text-sm font-black text-white">{r.lot}</div><div className="text-xs text-slate-400">영향 완제품 {r.finished.length}건</div></button>)}
        </div>
      </Panel>
      {mode==="raw"&&raw&&<>
        <Panel title={`원료 LOT 역추적 — ${raw.lot}`} right={<Badge tone={risk.length?"red":shipped.length?"amber":"green"}>{risk.length?"즉시 확인":shipped.length?"출하 영향 확인":"확인 완료"}</Badge>}>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4"><Card title="1. 원료 LOT" value={raw.lot} sub={raw.names.join(" · ")} kind="violet"/><Card title="2. 중간재" value={`${raw.mids.length}건`} sub={raw.mids.join(" · ")||"직접 투입"}/><Card title="3. 영향 완제품" value={`${affected.length}건`} sub={affected.map(r=>r.id).join(" · ")} kind={risk.length?"rose":"amber"}/><Card title="4. 출하처" value={`${customers.length}곳`} sub={customers.join(" · ")||"미출하"} kind={customers.length?"amber":"emerald"}/></div>
          {(risk.length||shipped.length)&&<div className="mt-4 flex flex-col gap-3 rounded-xl border border-rose-500/50 bg-rose-500/10 px-4 py-3 md:flex-row md:items-center md:justify-between"><div><div className="text-sm font-black text-rose-300">{risk.length?`홀드·격리 상태 LOT ${risk.length}건 확인 필요`:`이미 출하된 LOT ${shipped.length}건 — 고객 영향 확인 필요`}</div><div className="mt-1 text-xs text-slate-400">영향 LOT 확인 후 부적합 등록 및 조치를 진행하세요.</div></div><button onClick={openNcr} className="rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-black text-white">부적합 관리 열기</button></div>}
        </Panel>
        <Panel title="영향받는 완제품 LOT" right={<span className="text-xs text-slate-400">총 {affected.length}건</span>}><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400"><th className="py-2 text-left">완제품 LOT</th><th className="py-2 text-left">품명</th><th className="py-2 text-left">상태</th><th className="py-2 text-left">출하처</th><th></th></tr></thead><tbody>{affected.map(r=><tr key={r.id} className="border-b border-slate-800"><td className="py-3 font-mono font-black text-sky-300">{r.id}</td><td>{r.itemName||"-"}</td><td><Badge tone={tone(r.status)}>{r.status||"미등록"}</Badge></td><td>{r.ship?.customer||r.ship?.dest||"미출하"}</td><td className="text-right"><button onClick={()=>{setSelected(r.id);setMode("finished");setQuery(r.id);}} className="rounded border border-sky-500/50 px-3 py-1.5 text-xs font-bold text-sky-300">LOT 보기</button></td></tr>)}</tbody></table></div></Panel>
      </>}
      {mode==="finished"&&<>
        <Panel title={`완제품 LOT — ${active}`} right={<Badge tone={tone(lot.status)}>{lot.status||"상태 미등록"}</Badge>}>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4"><Card title="품명" value={lot.itemName} sub={lot.item}/><Card title="작업지시" value={lot.wo} kind="violet"/><Card title="생산 수량" value={lot.qty} sub={`현재 단계: ${lot.stage||"-"}`} kind="amber"/><Card title="출하 상태" value={lot.ship?"출하 완료":"미출하"} sub={lot.ship?.customer||"출하 정보 없음"} kind={lot.ship?"emerald":"sky"}/></div>
        </Panel>
        <Panel title="투입 원료" right={<span className="text-xs text-slate-400">총 {materials.length}건</span>}><div className="overflow-x-auto"><table className="w-full min-w-[650px] text-sm"><thead><tr className="border-b border-slate-700 text-xs text-slate-400"><th className="py-2 text-left">원료 LOT</th><th className="py-2 text-left">품명</th><th className="py-2 text-left">공급사</th><th className="py-2 text-right">투입량</th><th className="py-2 text-left">수입검사</th></tr></thead><tbody>{materials.map((m,i)=><tr key={`${m.lot}-${i}`} className="border-b border-slate-800"><td className="py-3 font-mono font-black text-violet-300">{m.lot||"-"}</td><td>{m.name||"-"}</td><td>{m.supplier||"-"}</td><td className="text-right">{m.qty||"-"}</td><td><Badge tone={String(m.iqc||"").includes("합격")?"green":"amber"}>{m.iqc||"미검사"}</Badge></td></tr>)}</tbody></table></div></Panel>
        {midId&&<Panel title="중간재 연결"><div className="grid grid-cols-1 gap-3 md:grid-cols-3"><Card title="중간재 LOT" value={midId} sub={mid?.type||"중간재"} kind="violet"/><Card title="상위 원료" value={`${mid?.parentLots?.length||0}건`} sub={(mid?.parentLots||[]).join(" · ")}/><Card title="하위 완제품" value={`${mid?.childLots?.length||0}건`} sub={(mid?.childLots||[]).join(" · ")||active} kind="emerald"/></div></Panel>}
      </>}
    </div>;
  };
})();
