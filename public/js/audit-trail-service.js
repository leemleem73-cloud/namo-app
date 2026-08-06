/* QMES audit trail service.
   Records who changed what, when, and why without coupling to a single screen. */
(function installAuditTrail(global){
  const STORAGE_KEY = "qmes-audit-trail-v1";
  const MAX_RECORDS = 5000;
  const nowIso = () => new Date().toISOString();
  const currentUser = () => {
    const user = global.__QMES_CURRENT_USER__ || {};
    return { id:user.id || user.uid || "-", uid:user.uid || "-", name:user.name || String(global.__QMES_USER__ || "관리자"), dept:user.dept || user.department || "-", role:user.role || "user" };
  };
  const readLocal = () => { try { const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); return Array.isArray(parsed) ? parsed : []; } catch (error) { console.warn("[QMES] Audit Trail 로드 실패", error); return []; } };
  const writeLocal = (rows) => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(rows.slice(-MAX_RECORDS))); } catch (error) { console.warn("[QMES] Audit Trail 저장 실패", error); } };
  const cloneSafe = (value) => { try { return JSON.parse(JSON.stringify(value)); } catch (error) { return String(value ?? ""); } };
  function recordAudit(entry){
    const row = { id:`AUD-${Date.now()}-${Math.random().toString(36).slice(2,8).toUpperCase()}`, at:nowIso(), user:currentUser(), module:String(entry?.module || "SYSTEM"), action:String(entry?.action || "UPDATE"), entityType:String(entry?.entityType || "DATA"), entityId:String(entry?.entityId || "-"), reason:String(entry?.reason || ""), before:cloneSafe(entry?.before ?? null), after:cloneSafe(entry?.after ?? null), metadata:cloneSafe(entry?.metadata ?? {}), source:String(entry?.source || "web") };
    const rows = readLocal(); rows.push(row); writeLocal(rows); global.dispatchEvent(new CustomEvent("qmes:audit-recorded", { detail:row })); return row;
  }
  function listAudit(filters){
    const f = filters || {};
    return readLocal().filter((row) => !f.module || row.module === f.module).filter((row) => !f.action || row.action === f.action).filter((row) => !f.entityType || row.entityType === f.entityType).filter((row) => !f.entityId || row.entityId === f.entityId).filter((row) => !f.userName || String(row.user?.name || "").includes(f.userName)).filter((row) => !f.dateFrom || row.at.slice(0,10) >= f.dateFrom).filter((row) => !f.dateTo || row.at.slice(0,10) <= f.dateTo).sort((a,b) => b.at.localeCompare(a.at));
  }
  function diffObject(before, after){
    const a = before && typeof before === "object" ? before : {}; const b = after && typeof after === "object" ? after : {};
    return Array.from(new Set([...Object.keys(a), ...Object.keys(b)])).sort().reduce((result, key) => { const oldValue = cloneSafe(a[key]); const newValue = cloneSafe(b[key]); if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) result[key] = { before:oldValue, after:newValue }; return result; }, {});
  }
  function recordChange(options){ const before = options?.before ?? null; const after = options?.after ?? null; return recordAudit({ ...options, before, after, metadata:{ ...(options?.metadata || {}), diff:diffObject(before, after) } }); }
  function recordLotValidation(workOrderNo, validation){ return recordAudit({ module:"PRODUCTION", action:validation?.ok ? "LOT_VALIDATE_PASS" : "LOT_VALIDATE_BLOCK", entityType:"WORK_ORDER", entityId:workOrderNo, reason:validation?.ok ? "원재료 LOT 검증 통과" : (validation?.errors || []).join(" / "), after:validation, metadata:{ shortageCount:(validation?.materials || []).filter((row) => !row.ok).length } }); }
  function exportAuditCsv(filters){ const rows = listAudit(filters); const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`; const header = ["ID","일시","사용자","부서","모듈","작업","대상유형","대상ID","사유"]; const body = rows.map((row) => [row.id,row.at,row.user?.name,row.user?.dept,row.module,row.action,row.entityType,row.entityId,row.reason].map(escape).join(",")); return "\uFEFF" + [header.map(escape).join(","), ...body].join("\n"); }
  global.qmesRecordAudit = recordAudit; global.qmesRecordChange = recordChange; global.qmesRecordLotValidation = recordLotValidation; global.qmesListAudit = listAudit; global.qmesDiffObject = diffObject; global.qmesExportAuditCsv = exportAuditCsv;
})(window);
