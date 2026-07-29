/* NAMO Talk: QMES 업무 메신저 1차 UI */
const NAMO_TALK_KEY = "qmes-namo-talk-v3";

const NAMO_TALK_ROOMS = [
  { id:"전체공지", name:"전체 공지", type:"공지", unread:0, preview:"대화가 없습니다.", time:"" },
  { id:"품질부", name:"품질부", type:"부서", unread:0, preview:"대화가 없습니다.", time:"" },
  { id:"생산부", name:"생산부", type:"부서", unread:0, preview:"대화가 없습니다.", time:"" },
  { id:"연구소", name:"연구소", type:"부서", unread:0, preview:"대화가 없습니다.", time:"" },
];

const NAMO_TALK_META = {};

function loadNamoTalkMessages() {
  try {
    const raw = localStorage.getItem(NAMO_TALK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 저장 오류는 무시 */ }
  return {};
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
  const [channel, setChannel] = useState("전체공지");
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
  const unreadCount = NAMO_TALK_ROOMS.reduce((sum, room) => sum + room.unread, 0);

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
              {["전체","안 읽음","LOT"].map(item=><button key={item} onClick={()=>setFilter(item)} className={`rounded-md px-2 py-2 text-xs font-semibold ${filter===item?"bg-slate-700 text-white":"text-slate-500 hover:text-slate-300"}`}>{item}{item==="안 읽음"&&unreadCount>0&&<span className="ml-1 text-red-400">{unreadCount}</span>}</button>)}
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
            <div className="ml-auto flex items-center gap-2 text-xs text-slate-400"><span>참여자 0명</span><button className="w-8 h-8 rounded-lg hover:bg-slate-800">⌕</button><button className="w-8 h-8 rounded-lg hover:bg-slate-800">⋮</button></div>
          </div>

          <div className="flex-1 min-h-[490px] max-h-[530px] overflow-y-auto p-5 space-y-4">
            {(messages[channel] || []).length===0?<div className="h-full flex items-center justify-center text-sm text-slate-600">대화가 초기화되었습니다. 새 메시지를 입력해 주세요.</div>:(messages[channel] || []).map(message=>{
              const mine=message.sender===currentUser.name;
              return <div key={message.id} className={`flex gap-2.5 ${mine?"justify-end":"justify-start"}`}>
                {!mine&&<div className="w-8 h-8 shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">{message.sender?.[0]||"?"}</div>}
                <div className={`max-w-[78%] ${mine?"items-end":"items-start"} flex flex-col`}>
                  <div className="mb-1 text-[11px] text-slate-500">{message.sender}{message.dept?` · ${message.dept}`:""}</div>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-6 shadow-lg ${mine?"rounded-tr-md bg-sky-600 text-white":"rounded-tl-md bg-slate-800 text-slate-100"}`}>
                    <div className="whitespace-pre-wrap break-words">{message.text}</div>
                  </div>
                  <div className="mt-1.5 text-[10px] text-slate-600">{message.time}</div>
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
            <p className="mt-2 text-[10px] text-slate-600">현재 대화는 이 브라우저에 저장됩니다. 회원등록현황 연동은 다음 단계에서 적용합니다.</p>
          </div>
        </section>

        <aside className="border-t xl:border-t-0 xl:border-l border-slate-800 bg-slate-900/70 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4"><h3 className="font-black text-white">업무 정보</h3><button className="text-xs text-sky-400 hover:text-sky-300">작업지시서 보기</button></div>
          {meta?<div />:<div className="rounded-xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-600">회원등록현황을 참조해<br/>참여자와 대화방을 구성할 예정입니다.</div>}
        </aside>
      </div>
    </div>
  );
}
