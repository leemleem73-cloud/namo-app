/* NAMO Talk: 사내 메신저 1차 버전 */
const NAMO_TALK_KEY = "qmes-namo-talk-v1";

function loadNamoTalkMessages() {
  try {
    const raw = localStorage.getItem(NAMO_TALK_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* 무시 */ }
  return {
    "전체공지": [{ id: 1, sender: "관리자", text: "NAMO Talk가 시작되었습니다.", time: new Date().toLocaleString("ko-KR", { hour12: false }) }],
  };
}

function saveNamoTalkMessages(data) {
  try { localStorage.setItem(NAMO_TALK_KEY, JSON.stringify(data)); } catch (e) { /* 무시 */ }
}

function NamoTalkTab() {
  const currentUser = window.__QMES_CURRENT_USER__ || { name: window.__QMES_USER__ || "사용자", dept: "" };
  const allChannels = ["전체공지", "대표", "경영지원부", "연구소", "생산부", "영업부", "품질부"];
  const allowedChannels = allChannels.filter((channel) => channel === "전체공지" || channel === currentUser.dept || currentUser.role === "admin");
  const [channel, setChannel] = useState(allowedChannels[0] || "전체공지");
  const [messages, setMessages] = useState(loadNamoTalkMessages);
  const [text, setText] = useState("");

  const sendMessage = () => {
    const value = text.trim();
    if (!value) return;
    const next = {
      ...messages,
      [channel]: [
        ...(messages[channel] || []),
        {
          id: Date.now(),
          sender: currentUser.name || "사용자",
          dept: currentUser.dept || "",
          text: value,
          time: new Date().toLocaleString("ko-KR", { hour12: false }),
        },
      ],
    };
    setMessages(next);
    saveNamoTalkMessages(next);
    setText("");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 min-h-[640px]">
      <Panel title="NAMO Talk">
        <div className="text-xs text-slate-500 mb-3">{currentUser.name} · {currentUser.dept || "부서 미지정"}</div>
        <div className="flex flex-col gap-1">
          {allowedChannels.map((item) => (
            <button key={item} onClick={() => setChannel(item)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${channel === item ? "bg-sky-600 text-white" : "text-slate-300 hover:bg-slate-800"}`}>
              # {item}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title={`# ${channel}`} right={<span className="text-xs text-emerald-400">온라인</span>}>
        <div className="h-[500px] overflow-y-auto rounded-lg border border-slate-800 bg-slate-950/50 p-4 flex flex-col gap-3">
          {(messages[channel] || []).length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-slate-600">아직 메시지가 없습니다.</div>
          ) : (messages[channel] || []).map((message) => {
            const mine = message.sender === currentUser.name;
            return (
              <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-xl px-3.5 py-2.5 ${mine ? "bg-sky-600 text-white" : "bg-slate-800 text-slate-100"}`}>
                  <div className={`text-[11px] mb-1 ${mine ? "text-sky-100" : "text-slate-400"}`}>{message.sender}{message.dept ? ` · ${message.dept}` : ""}</div>
                  <div className="text-sm whitespace-pre-wrap break-words">{message.text}</div>
                  <div className={`text-[10px] mt-1.5 ${mine ? "text-sky-100" : "text-slate-500"}`}>{message.time}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 flex gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder="메시지를 입력하세요. Enter 전송 / Shift+Enter 줄바꿈"
            className="flex-1 min-h-[46px] max-h-28 resize-y bg-slate-800 border border-slate-700 rounded-lg px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500" />
          <button onClick={sendMessage} className="px-5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-sm font-bold">전송</button>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">1차 버전은 현재 브라우저에 저장됩니다. 다음 단계에서 공용 DB와 실시간 동기화를 연결합니다.</p>
      </Panel>
    </div>
  );
}
