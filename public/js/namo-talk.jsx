/* NAMO Talk: QMES 업무 메신저 1차 UI */
const NAMO_TALK_KEY = "qmes-namo-talk-v2";

const NAMO_TALK_ROOMS = [
  { id:"품질부", name:"품질부", type:"부서", unread:3, preview:"점도 재측정 부탁드립니다.", time:"08:42" },
  { id:"생산부", name:"생산부", type:"부서", unread:1, preview:"생산 준비 완료했습니다.", time:"08:40" },
  { id:"연구소", name:"연구소", type:"부서", unread:0, preview:"신규 원료 테스트 결과 공유", time:"어제" },
  { id:"LOT-SBR240729001", name:"LOT-SBR240729001 업무방", type:"LOT", unread:2, preview:"점도 재측정 결과 공유합니다.", time:"08:41" },
  { id:"전체공지", name:"전체 공지", type:"공지", unread:0, preview:"안전교육 일정 안내", time:"07-26" },
];

const NAMO_TALK_META = {
  "LOT-SBR240729001": {
    workOrder:"WO-20260729-01",
    lot:"SBR240729001",
    product:"SBR 바인더",
    customer:"현대자동차",
    process:"바인더 혼합 공정",
    productionStatus:"생산중",
    inspectionStatus:"PQC 검사중",
    approvalStatus:"결재 진행중",
    participants:["임흥배 · 품질부", "김철수 · 생산부", "이영희 · 품질부", "홍길동 · 생산부", "박민수 · 연구소"],
    files:["점도측정결과_20260729.jpg", "점도측정표_20260729.xlsx"],
  },
};

function loadNamoTalkMessages() {
  try {
    const raw = localStorage.getItem(NAMO_TALK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 저장 오류는 무시 */ }

  return {
    "전체공지":[
      { id:1, sender:"관리자", dept:"관리부", text:"NAMO Talk가 시작되었습니다. 업무 관련 대화와 LOT 이력을 이곳에서 관리합니다.", time:"2026. 7. 29. 08:00" },
    ],
    "품질부":[
      { id:2, sender:"임흥배", dept:"품질부", text:"오늘 PQC 검사 일정 확인 부탁드립니다.", time:"2026. 7. 29. 08:25" },
      { id:3, sender:"이영희", dept:"품질부", text:"확인했습니다. 오전 생산 LOT부터 순서대로 진행하겠습니다.", time:"2026. 7. 29. 08:27" },
    ],
    "생산부":[
      { id:4, sender:"김철수", dept:"생산부", text:"SBR 배치 생산 준비 완료했습니다.", time:"2026. 7. 29. 08:30" },
    ],
    "연구소":[
      { id:5, sender:"박민수", dept:"연구소", text:"신규 원료 테스트 결과 공유드립니다.", time:"2026. 7. 28. 16:20" },
    ],
    "LOT-SBR240729001":[
      { id:6, sender:"임흥배", dept:"품질부", text:"해당 LOT 점도 측정값이 기준 대비 높게 나와 재측정 요청드립니다.", time:"2026. 7. 29. 08:30" },
      { id:7, sender:"김철수", dept:"생산부", text:"확인했습니다. 지금 샘플 재측정 진행하겠습니다.", time:"2026. 7. 29. 08:31" },
      { id:8, sender:"김철수", dept:"생산부", text:"점도 재측정 결과 공유합니다. 기준 범위 내로 확인되었습니다.", time:"2026. 7. 29. 08:35", attachment:"점도측정결과_20260729.jpg" },
      { id:9, sender:"임흥배", dept:"품질부", text:"확인했습니다. 합격 처리 후 생산 진행 부탁드립니다.", time:"2026. 7. 29. 08:40" },
      { id:10, sender:"김철수", dept:"생산부", text:"네, 생산 진행하겠습니다.", time:"2026. 7. 29. 08:41" },
    ],
  };
}

function saveNamoTalkMessages(data) {
  try { localStorage.setItem(NAMO_TALK_KEY, JSON.stringify(data)); } catch (e) { /* 저장 오류는 무시 */ }
}

function NamoTalkBadge({children, tone="sky"}) {
  const toneClass = tone === "green" ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : tone === "amber" ? "bg-amber-500/15 text-amber-300 border-amber-500/30" : "bg-sky-500/15 text-sky-300 border-sky-500/30";
  return <span className={`inline-flex items-center rounded-md border px-2 py-1 text-[11px] font-semibold ${toneClass}`}>{children}</span>;
}

function NamoTalkTab() {
  const currentUser = window.__QMES_CURRENT_USER__ || { name: window.__QMES_USER__ || "사용자", dept:"" };
  const [channel, setChannel] = useState("LOT-SBR240729001");
  const [messages, setMessages] = useState(loadNamoTalkMessages);
  const [text, setText] = useState("");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("전체");

  const visibleRooms = NAMO_TALK_ROOMS.filter(room => {
    const matchesQuery = !query.trim() || room.name.toLowerCase().includes(query.trim().toLowerCase()) || room.preview.toLowerCase().includes(query.trim().toLowerCase());
    const matchesFilter = filter === "전체" || (filter === "안 읽음" && room.unread > 0) || (filter === "LOT" && room.type === "LOT");
    return matchesQuery && matchesFilter;
  });

  const selectedRoom = NAMO_TALK_ROOMS.find(room => room.id === channel) || NAMO_TALK_ROOMS[0];
  const meta = NAMO_TALK_META[channel];

  const sendMessage = () => {
    const value = text.trim();
    if (!value) return;
    const next = {
      ...messages,
      [channel]: [
        ...(messages[channel] || []),
        {
          id:Date.now(),
          sender:currentUser.name || "사용자",
          dept:currentUser.dept || "",
          text:value,
          time:new Date().toLocaleString("ko-KR", { hour12:false }),
        },
      ],
    };
    setMessages(next);
    saveNamoTalkMessages(next);
    setText("");
  };

  return (
    <div className="min-h-[690px] rounded-2xl border border-slate-800 bg-slate-950/40 overflow-hidden shadow-2xl shadow-black/20">
      <div className="grid grid-cols-1 xl:grid-cols-[300px_minmax(0,1fr)_330px] min-h-[690px]">
        <aside className="border-b xl:border-b-0 xl:border-r border-slate-800 bg-slate-900/75">
          <div className="p-4 border-b border-slate-800">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">NAMO Talk</h2>
                <p className="text-xs text-slate-500 mt-1">{currentUser.name} · {currentUser.dept || "부서 미지정"}</p>
              </div>
              <button type="button" className="w-9 h-9 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-lg">＋</button>
            </div>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">⌕</span>
              <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="대화방 검색" className="w-full h-10 rounded-lg border border-slate-700 bg-slate-950/70 pl-9 pr-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500" />
            </div>
            <div className="grid grid-cols-3 gap-1 mt-3 rounded-lg bg-slate-950/60 p-1">
              {["전체","안 읽음","LOT"].map(item=><button key={item} onClick={()=>setFilter(item)} className={`rounded-md px-2 py-2 text-xs font-semibold ${filter===item?"bg-slate-700 text-white":"text-slate-500 hover:text-slate-300"}`}>{item}{item==="안 읽음"&&<span className="ml-1 text-red-400">5</span>}</button>)}
            </div>
          </div>

          <div className="max-h-[525px] overflow-y-auto p-2">
            {visibleRooms.map(room=><button key={room.id} onClick={()=>setChannel(room.id)} className={`w-full rounded-xl p-3 mb-1 text-left transition-colors ${channel===room.id?"bg-slate-800 ring-1 ring-sky-500/30":"hover:bg-slate-800/60"}`}>
              <div className="flex gap-3">
                <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs ${room.type==="LOT"?"bg-sky-600/20 text-sky-300":room.type==="공지"?"bg-amber-500/20 text-amber-300":"bg-emerald-500/15 text-emerald-300"}`}>{room.type==="LOT"?"LOT":room.type==="공지"?"공지":"팀"}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2"><span className="truncate text-sm font-bold text-slate-100">{room.name}</span><span className="ml-auto text-[10px] text-slate-500">{room.time}</span></div>
                  <div className="mt-1 flex items-center gap-2"><span className="truncate text-xs text-slate-500">{room.preview}</span>{room.unread>0&&<span className="ml-auto min-w-[20px] h-5 px-1.5 rounded-full bg-red-500 text-white text-[10px] leading-5 text-center">{room.unread}</span>}</div>
                </div>
              </div>
            </button>)}
          </div>
        </aside>

        <section className="min-w-0 flex flex-col bg-[radial-gradient(circle_at_top,rgba(14,165,233,.08),transparent_35%)]">
          <div className="px-5 py-4 border-b border-slate-800 bg-slate-900/40 flex items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xs font-black ${selectedRoom.type==="LOT"?"bg-sky-600 text-white":"bg-slate-800 text-slate-300"}`}>{selectedRoom.type==="LOT"?"LOT":"CHAT"}</div>
            <div className="min-w-0">
              <div className="flex items-center gap-2"><h3 className="truncate font-black text-white">{selectedRoom.name}</h3><span className="text-amber-300">★</span></div>
              <p className="truncate text-xs text-slate-500 mt-1">{meta?`작업지시번호 ${meta.workOrder} · 생산 LOT ${meta.lot} · 제품명 ${meta.product}`:"QMES 업무 대화방"}</p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400"><span>참여자 {meta?.participants?.length || 4}명</span><button className="w-8 h-8 rounded-lg hover:bg-slate-800">⌕</button><button className="w-8 h-8 rounded-lg hover:bg-slate-800">⋮</button></div>
          </div>

          <div className="flex-1 min-h-[490px] max-h-[530px] overflow-y-auto p-5 space-y-4">
            <div className="flex justify-center"><span className="rounded-full bg-slate-900/80 border border-slate-800 px-3 py-1 text-[11px] text-slate-500">2026-07-29 (화)</span></div>
            {(messages[channel] || []).length===0?<div className="h-full flex items-center justify-center text-sm text-slate-600">아직 메시지가 없습니다.</div>:(messages[channel] || []).map(message=>{
              const mine=message.sender===currentUser.name;
              return <div key={message.id} className={`flex gap-2.5 ${mine?"justify-end":"justify-start"}`}>
                {!mine&&<div className="w-8 h-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">{message.sender?.[0]||"?"}</div>}
                <div className={`max-w-[78%] ${mine?"items-end":"items-start"} flex flex-col`}>
                  <div className="mb-1 text-[11px] text-slate-500">{message.sender}{message.dept?` · ${message.dept}`:""}</div>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${mine?"rounded-tr-md bg-sky-600 text-white":"rounded-tl-md bg-slate-800 text-slate-100"}`}>
                    <div className="whitespace-pre-wrap break-words">{message.text}</div>
                    {message.attachment&&<div className="mt-3 rounded-lg border border-white/10 bg-black/15 p-3 flex items-center gap-3"><div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">📎</div><div className="min-w-0"><div className="truncate text-xs font-semibold">{message.attachment}</div><div className="text-[10px] opacity-60 mt-1">첨부파일</div></div></div>}
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-600">읽음 {meta?.participants?.length || 4}명 · {message.time}</div>
                </div>
              </div>;
            })}
          </div>

          <div className="border-t border-slate-800 bg-slate-900/55 p-3">
            <div className="flex items-end gap-2">
              <div className="flex gap-1"><button className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-sky-500" title="파일 첨부">📎</button><button className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-sky-500" title="사진 첨부">▧</button><button className="w-10 h-10 rounded-lg border border-slate-700 bg-slate-800 text-slate-300 hover:border-sky-500" title="사용자 호출">@</button></div>
              <textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} placeholder="메시지를 입력하세요. Enter 전송 / Shift+Enter 줄바꿈" className="flex-1 min-h-[42px] max-h-28 resize-y rounded-lg border border-slate-700 bg-slate-950/80 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-sky-500" />
              <button onClick={sendMessage} className="h-10 px-5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-black">전송</button>
            </div>
            <p className="mt-2 text-[10px] text-slate-600">1차 버전은 현재 브라우저에 저장됩니다. 공용 DB 및 실시간 동기화는 2차 개발에서 연결합니다.</p>
          </div>
        </section>

        <aside className="border-t xl:border-t-0 xl:border-l border-slate-800 bg-slate-900/70 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4"><h3 className="font-black text-white">업무 정보</h3><button className="text-xs text-sky-400 hover:text-sky-300">작업지시서 보기</button></div>
          {meta?<>
            <div className="rounded-xl border border-slate-800 bg-slate-950/45 p-4 space-y-3">
              {[["작업지시번호",meta.workOrder],["생산 LOT",meta.lot],["제품명",meta.product],["고객사",meta.customer],["공정명",meta.process]].map(([label,value])=><div key={label} className="grid grid-cols-[92px_1fr] gap-2 text-xs"><span className="text-slate-500">{label}</span><span className="text-right font-semibold text-slate-200 break-all">{value}</span></div>)}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-2"><NamoTalkBadge>{meta.productionStatus}</NamoTalkBadge><NamoTalkBadge tone="sky">{meta.inspectionStatus}</NamoTalkBadge><NamoTalkBadge tone="green">{meta.approvalStatus}</NamoTalkBadge></div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold text-white">참여자 <span className="text-slate-500">{meta.participants.length}</span></h4><button className="text-xs text-sky-400">+ 초대</button></div>
              <div className="space-y-2.5">{meta.participants.map((person,index)=><div key={person} className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs text-white">{person[0]}</div><div className="min-w-0 flex-1 text-xs text-slate-300 truncate">{person}</div><span className={`w-2 h-2 rounded-full ${index<4?"bg-emerald-400":"bg-slate-600"}`}/></div>)}</div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
              <div className="flex items-center justify-between mb-3"><h4 className="text-sm font-bold text-white">첨부파일 <span className="text-slate-500">{meta.files.length}</span></h4><button className="text-xs text-sky-400">모두 다운로드</button></div>
              <div className="space-y-2">{meta.files.map(file=><button key={file} className="w-full rounded-lg border border-slate-800 bg-slate-900/70 p-3 text-left hover:border-sky-500/50"><div className="flex items-center gap-2"><span>📄</span><span className="min-w-0 flex-1 truncate text-xs text-slate-300">{file}</span><span className="text-slate-600">↓</span></div></button>)}</div>
            </div>

            <div className="mt-4 rounded-xl border border-slate-800 bg-slate-950/45 p-4">
              <h4 className="text-sm font-bold text-white mb-3">빠른 액션</h4>
              <div className="grid grid-cols-2 gap-2"><button className="rounded-lg bg-red-500/15 border border-red-500/30 px-3 py-2.5 text-xs font-bold text-red-300">긴급 알림</button><button className="rounded-lg bg-amber-500/15 border border-amber-500/30 px-3 py-2.5 text-xs font-bold text-amber-300">할 일 등록</button><button className="rounded-lg bg-emerald-500/15 border border-emerald-500/30 px-3 py-2.5 text-xs font-bold text-emerald-300">일정 등록</button><button className="rounded-lg bg-sky-500/15 border border-sky-500/30 px-3 py-2.5 text-xs font-bold text-sky-300">업무 요청</button></div>
            </div>
          </>:<div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-600">일반 대화방입니다.<br/>LOT 업무방을 선택하면 작업 정보가 표시됩니다.</div>}
        </aside>
      </div>
    </div>
  );
}
