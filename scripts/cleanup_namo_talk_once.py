from pathlib import Path
import re


def read(path):
    return Path(path).read_text(encoding="utf-8")


def write(path, text):
    Path(path).write_text(text, encoding="utf-8")


def required(text, old, new, label):
    if old not in text:
        raise RuntimeError(f"required pattern not found: {label}")
    return text.replace(old, new, 1)


# Router/header
path = "public/js/router.jsx"
s = read(path)
s = s.replace('    if(saved==="namoTalk")return "dash";\n', '    if(!TABS.some(item=>item.id===saved))return "dash";\n')
s = re.sub(r'\n  const \[talkOpen,setTalkOpen\]=useState\([^\n]*\);', '', s)
s = re.sub(r'\n  const \[talkTargetRoom,setTalkTargetRoom\]=useState\([^\n]*\);', '', s)
s = re.sub(r'\n  const \[namoUnread,setNamoUnread\]=useState\([^\n]*\);', '', s)
s = re.sub(r'\n  useEffect\(\(\)=>\{safeStorageSet\("qmes_namo_talk_open",talkOpen\?"1":"0"\);\},\[talkOpen\]\);', '', s)
s = re.sub(r'\n  useEffect\(\(\)=>\{\n    const updateUnread=event=>setNamoUnread\([\s\S]*?\n  \},\[\]\);', '', s, count=1)
s = s.replace('  window.__QMES_CLOSE_NAMO_TALK__=()=>setTalkOpen(false);\n', '')
s = re.sub(r'\n\s*<button type="button" onClick=\{\(\)=>\{setTalkTargetRoom\(""\);setTalkOpen\(true\);\}\}[\s\S]*?</button>', '', s, count=1)
s = re.sub(r'\n\s*<button type="button" onClick=\{\(\)=>setTalkOpen\(value=>!value\)\}[\s\S]*?</button>', '', s, count=1)
s = re.sub(r'\n\s*<div style=\{\{[^\n]*\}\}>\{user\.name\?\.\[0\]\|\|"사"\}</div>', '', s, count=1)
s = s.replace('{user.name} ({user.dept})', '{displayUserName} ({user.dept})')
s = re.sub(r'\n\s*\{talkOpen&&<NamoTalkTab[^\n]*\}', '', s)
s = re.sub(r'\n\s*<NamoTalkNotifier[^\n]*', '', s)
if 'const displayUserName=' not in s:
    marker = '  const closeAccountModal=()=>setProfileOpen(false);'
    s = required(s, marker, '  const displayUserName=String(user?.name||"").trim()==="임임흥배"?"임흥배":String(user?.name||"").trim();\n' + marker, 'display name marker')
if 'aria-label="모바일 전용 화면 열기"' not in s:
    marker = '          <div className="qmes-header-controls">'
    mobile = '          <button type="button" onClick={()=>{window.location.href="/mobile.html";}} className="qmes-btn qmes-btn-primary !border !border-slate-500 !bg-slate-700 !text-white !shadow-sm hover:!bg-slate-600" aria-label="모바일 전용 화면 열기" title="모바일 전용" style={{display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",fontWeight:800}}>\n            <span>모바일 전용</span>\n          </button>\n'
    s = required(s, marker, mobile + marker, 'header controls marker')
write(path, s)

# HTML bootstrap
path = "public/index.html"
lines = read(path).splitlines()
lines = [line for line in lines if 'namo-talk' not in line.lower() and 'namo-emoticons-gel-20260731.js' not in line]
s = "\n".join(lines) + "\n"
s = re.sub(r'/js/router\.jsx\?v=[^"\']+', '/js/router.jsx?v=20260910-talk-removed-name-fix', s)
write(path, s)

# Server entry
path = "server.js"
s = read(path)
s = s.replace("require('./namo-talk-standalone-server.js');\n", '')
start = s.find('function installNamoMobileHeaderEntry()')
call = 'installNamoMobileHeaderEntry();'
end = s.find(call, start)
if start != -1 and end != -1:
    end += len(call)
    clean = '''function installNamoMobileHeaderEntry() {
  const routerPath = path.join(__dirname, 'public', 'js', 'router.jsx');
  let source = fs.readFileSync(routerPath, 'utf8');
  if (source.includes('aria-label="모바일 전용 화면 열기"')) return;
  const controlsAnchor = '          <div className="qmes-header-controls">';
  if (!source.includes(controlsAnchor)) return;
  const mobileButton = [
    '          <button type="button" onClick={()=>{window.location.href="/mobile.html";}} className="qmes-btn qmes-btn-primary !border !border-slate-500 !bg-slate-700 !text-white !shadow-sm hover:!bg-slate-600" aria-label="모바일 전용 화면 열기" title="모바일 전용" style={{display:"inline-flex",alignItems:"center",gap:6,whiteSpace:"nowrap",fontWeight:800}}>',
    '            <span>모바일 전용</span>',
    '          </button>',
  ].join('\\n');
  source = source.replace(controlsAnchor, `${mobileButton}\\n${controlsAnchor}`);
  fs.writeFileSync(routerPath, source, 'utf8');
}
installNamoMobileHeaderEntry();'''
    s = s[:start] + clean + s[end:]
write(path, s)

# Header helper
path = "public/js/qmes-user-dropdown-restore-20260812.js"
s = read(path)
start = s.find('function syncHeaderActions(){')
end = s.find('function syncBellButton(){', start)
if start != -1 and end != -1:
    clean = '''function syncHeaderActions(){
    const reference=getReferenceAction();
    if(!reference)return false;
    const targets=Array.from(document.querySelectorAll(PROFILE_BUTTON_SELECTOR));
    targets.forEach(button=>copyReferenceStyle(button,reference));
    const shell=document.querySelector('.qmes-header-right');
    if(shell)shell.style.gap='6px';
    return targets.length>0;
  }
  '''
    s = s[:start] + clean + s[end:]
write(path, s)

# Legacy source: remove NAMO Talk DB schema/migrations/routes, keep production DB itself untouched.
path = "server-legacy-20260903.js"
s = read(path)
a = s.find('    CREATE TABLE IF NOT EXISTS namo_talk_messages (')
b = s.find('    CREATE TABLE IF NOT EXISTS audit_logs (', a)
if a != -1 and b != -1:
    s = s[:a] + s[b:]
a = s.find('    ALTER TABLE namo_talk_messages ADD COLUMN IF NOT EXISTS sender_uid')
last = "    ALTER TABLE namo_talk_reads ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW();\n"
b = s.find(last, a)
if a != -1 and b != -1:
    s = s[:a] + s[b + len(last):]
a = s.find('function mapNamoTalkMessage(row) {')
b = s.find("app.get('/api/backup', requireLogin", a)
if a != -1 and b != -1:
    s = s[:a] + s[b:]
s = s.replace('    name: user.name,', "    name: user.name === '임임흥배' ? '임흥배' : user.name,", 1)
marker = '    app.listen(port, () => {'
if "uid = 'U-0009' AND name = '임임흥배'" not in s and marker in s:
    migration = "    await db(\"UPDATE users SET name = '임흥배' WHERE uid = 'U-0009' AND name = '임임흥배'\");\n    await db(\"UPDATE qmes_sessions SET sess = jsonb_set(sess, '{user,name}', to_jsonb('임흥배'::text), false) WHERE sess #>> '{user,name}' = '임임흥배'\");\n\n"
    s = s.replace(marker, migration + marker, 1)
write(path, s)

# Dedicated Talk files and deployment markers
for item in [
    'namo-talk-standalone-server.js',
    'public/js/namo-talk-backend.js',
    'public/js/namo-talk-header-contrast-20260814.js',
    'public/js/namo-talk.jsx',
    'public/namo-talk-draft.html',
    'public/namo-talk-standalone-20260814.html',
    'supabase/namo-talk.sql',
    'tests/namo-talk-standalone-integration.js',
    'public/assets/namo-emoticons-gel-20260731.js',
    'public/assets/namo-emoticons-qmes-20260731.webp',
    'public/assets/namo-emoticons-transparent-20260731.webp',
    'DEPLOY_TRIGGER_20260908_NAMO_TALK_STANDALONE.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_CONVERSATIONS.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_EMPLOYEE_RECOVERY.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_FULL_DIRECTORY_3MENU.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_GEL_STICKER_FIX.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_PRESENCE_EXPIRY.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_PROFILE_SYNC.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_PURPLE_DEFAULT.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_ROSTER_SOURCE.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_ROUTE_INSTALL.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_ROUTE_ORDER_FIX.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_STAGE3_FEATURES.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_STATUS_PROFILE_NOTIFY.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_STICKER_SHEET_API.txt',
    'DEPLOY_TRIGGER_20260909_NAMO_TALK_UNREAD_API.txt',
]:
    p = Path(item)
    if p.exists():
        p.unlink()

# Remove this one-time mechanism from the resulting repository commit.
Path('.github/workflows/repo-cleanup-once.yml').unlink(missing_ok=True)
Path(__file__).unlink(missing_ok=True)
