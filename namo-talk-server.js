const expressModule = require('express');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

const schemaReady = pool.query(`
  CREATE EXTENSION IF NOT EXISTS pgcrypto;

  CREATE TABLE IF NOT EXISTS namo_talk_messages (
    id BIGSERIAL PRIMARY KEY,
    room_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_dept TEXT DEFAULT '',
    kind TEXT NOT NULL DEFAULT 'text',
    message_text TEXT DEFAULT '',
    file_name TEXT DEFAULT '',
    file_data TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_namo_talk_room_created
    ON namo_talk_messages(room_id, created_at, id);

  CREATE TABLE IF NOT EXISTS namo_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_uid TEXT DEFAULT '',
    user_name TEXT NOT NULL,
    department TEXT DEFAULT '',
    title TEXT DEFAULT '',
    work_date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    work_status TEXT NOT NULL DEFAULT '근무',
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, work_date)
  );
  CREATE INDEX IF NOT EXISTS idx_namo_attendance_date
    ON namo_attendance(work_date DESC, user_name);

  CREATE TABLE IF NOT EXISTS namo_fieldworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    user_uid TEXT DEFAULT '',
    user_name TEXT NOT NULL,
    department TEXT DEFAULT '',
    title TEXT DEFAULT '',
    work_date DATE NOT NULL DEFAULT CURRENT_DATE,
    destination TEXT NOT NULL,
    purpose TEXT NOT NULL,
    companion TEXT DEFAULT '',
    planned_return TIME,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    returned_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT '외근중',
    note TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_namo_fieldworks_date
    ON namo_fieldworks(work_date DESC, user_name);

  CREATE TABLE IF NOT EXISTS namo_leaves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_no TEXT UNIQUE NOT NULL,
    applicant_id UUID NOT NULL,
    applicant_uid TEXT DEFAULT '',
    applicant_name TEXT NOT NULL,
    department TEXT DEFAULT '',
    title TEXT DEFAULT '',
    leave_type TEXT NOT NULL,
    leave_date DATE NOT NULL,
    leave_days NUMERIC(4,1) NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    handover TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT '검토대기',
    reviewer_id UUID,
    reviewer_name TEXT DEFAULT '',
    reviewer_title TEXT DEFAULT '',
    reviewed_at TIMESTAMPTZ,
    reject_reason TEXT DEFAULT '',
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
  CREATE INDEX IF NOT EXISTS idx_namo_leaves_date
    ON namo_leaves(leave_date DESC, applied_at DESC);
`).catch((err) => {
  console.error('NAMO Talk schema initialization failed:', err.message);
});

function success(res, data = null, message = 'OK') {
  return res.json({ success: true, message, data });
}

function failure(res, status, message) {
  return res.status(status).json({ success: false, message, data: null });
}

function text(value) {
  return String(value ?? '').trim();
}

function requireUser(req, res) {
  if (!req.session || !req.session.user) {
    failure(res, 401, '로그인이 필요합니다.');
    return null;
  }
  return req.session.user;
}

function isAdmin(user) {
  return user && (user.role === 'admin' || user.name === '관리자');
}

function isDirector(user) {
  const title = text(user && (user.title || user.position)).replace(/\s/g, '');
  return isAdmin(user) || title.includes('이사');
}

function koreaDate(value = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(value);
}

function koreaTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('ko-KR', {
    timeZone: 'Asia/Seoul', hour: '2-digit', minute: '2-digit', hour12: false,
  });
}

function koreaDateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', hour12: false,
  });
}

function mapMessage(row) {
  const createdAt = new Date(row.created_at).getTime();
  return {
    id: Number(row.id), roomId: row.room_id, sender: row.sender_name,
    dept: row.sender_dept || '', kind: row.kind || 'text',
    text: row.message_text || '', fileName: row.file_name || '',
    fileData: row.file_data || '', createdAt, time: koreaTime(row.created_at),
  };
}

function mapAttendance(row) {
  return {
    id: row.id, uid: row.user_uid || '', name: row.user_name,
    dept: row.department || '', position: row.title || '',
    date: String(row.work_date).slice(0, 10), clockIn: koreaTime(row.clock_in),
    clockOut: koreaTime(row.clock_out), workStatus: row.work_status || '근무',
    note: row.note || '', createdAt: koreaDateTime(row.created_at),
  };
}

function mapFieldwork(row) {
  return {
    id: row.id, uid: row.user_uid || '', name: row.user_name,
    dept: row.department || '', position: row.title || '',
    date: String(row.work_date).slice(0, 10), place: row.destination,
    purpose: row.purpose, companion: row.companion || '',
    returnPlan: row.planned_return ? String(row.planned_return).slice(0, 5) : '',
    startTime: koreaTime(row.started_at), returnTime: koreaTime(row.returned_at),
    status: row.status, note: row.note || '', createdAt: koreaDateTime(row.created_at),
  };
}

function mapLeave(row) {
  return {
    id: row.id, documentNo: row.document_no, uid: row.applicant_uid || '',
    name: row.applicant_name, dept: row.department || '', position: row.title || '',
    type: row.leave_type, date: String(row.leave_date).slice(0, 10),
    days: Number(row.leave_days), reason: row.reason, handover: row.handover || '',
    status: row.status, reviewer: row.reviewer_name || '',
    reviewerPosition: row.reviewer_title || '', reviewedAt: koreaDateTime(row.reviewed_at),
    rejectReason: row.reject_reason || '', appliedAt: koreaDateTime(row.applied_at),
  };
}

function registerNamoTalkRoutes(app) {
  if (app.__namoTalkRoutesRegistered) return;
  app.__namoTalkRoutesRegistered = true;

  app.get('/api/namo-talk/messages', async (req, res) => {
    try {
      if (!requireUser(req, res)) return;
      await schemaReady;
      const roomId = text(req.query.roomId);
      if (!roomId) return failure(res, 400, '대화방 정보가 필요합니다.');
      const result = await pool.query(
        `SELECT id, room_id, sender_name, sender_dept, kind, message_text, file_name, file_data, created_at
           FROM namo_talk_messages WHERE room_id = $1
          ORDER BY created_at ASC, id ASC LIMIT 1000`, [roomId]
      );
      return success(res, result.rows.map(mapMessage));
    } catch (err) {
      console.error('NAMO Talk message list failed:', err);
      return failure(res, 500, err.message);
    }
  });

  app.post('/api/namo-talk/messages', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const body = req.body || {};
      const roomId = text(body.roomId); const kind = text(body.kind) || 'text';
      const messageText = String(body.text || ''); const fileName = String(body.fileName || '');
      const fileData = String(body.fileData || '');
      if (!roomId) return failure(res, 400, '대화방 정보가 필요합니다.');
      if (!messageText && !fileData) return failure(res, 400, '메시지 내용이 없습니다.');
      const result = await pool.query(
        `INSERT INTO namo_talk_messages
          (room_id, sender_name, sender_dept, kind, message_text, file_name, file_data)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
         RETURNING id, room_id, sender_name, sender_dept, kind, message_text, file_name, file_data, created_at`,
        [roomId, user.name || '', user.department || '', kind, messageText, fileName, fileData]
      );
      return success(res, mapMessage(result.rows[0]), '전송되었습니다.');
    } catch (err) {
      console.error('NAMO Talk send failed:', err);
      return failure(res, 500, err.message);
    }
  });

  app.get('/api/namo-work/attendance', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const params = []; let where = '';
      if (!isDirector(user)) { params.push(user.id); where = 'WHERE user_id = $1'; }
      const result = await pool.query(
        `SELECT * FROM namo_attendance ${where} ORDER BY work_date DESC, user_name ASC LIMIT 1000`, params
      );
      return success(res, result.rows.map(mapAttendance));
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.post('/api/namo-work/attendance/clock-in', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const day = koreaDate();
      const result = await pool.query(
        `INSERT INTO namo_attendance
          (user_id,user_uid,user_name,department,title,work_date,clock_in)
         VALUES ($1,$2,$3,$4,$5,$6,NOW())
         ON CONFLICT (user_id,work_date) DO NOTHING RETURNING *`,
        [user.id, user.uid || '', user.name || '', user.department || '', user.title || '', day]
      );
      if (!result.rowCount) return failure(res, 409, '이미 출근 처리되었습니다.');
      return success(res, mapAttendance(result.rows[0]), '출근 처리되었습니다.');
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.post('/api/namo-work/attendance/clock-out', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const result = await pool.query(
        `UPDATE namo_attendance SET clock_out = NOW(), updated_at = NOW()
          WHERE user_id = $1 AND work_date = $2 AND clock_in IS NOT NULL AND clock_out IS NULL
          RETURNING *`, [user.id, koreaDate()]
      );
      if (!result.rowCount) return failure(res, 409, '출근 기록이 없거나 이미 퇴근 처리되었습니다.');
      return success(res, mapAttendance(result.rows[0]), '퇴근 처리되었습니다.');
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.get('/api/namo-work/fieldworks', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const params = []; let where = '';
      if (!isDirector(user)) { params.push(user.id); where = 'WHERE user_id = $1'; }
      const result = await pool.query(
        `SELECT * FROM namo_fieldworks ${where} ORDER BY started_at DESC LIMIT 1000`, params
      );
      return success(res, result.rows.map(mapFieldwork));
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.post('/api/namo-work/fieldworks', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const destination = text(req.body && req.body.place);
      const purpose = text(req.body && req.body.purpose);
      if (!destination || !purpose) return failure(res, 400, '방문처와 외근 목적을 입력해 주세요.');
      const active = await pool.query(
        `SELECT id FROM namo_fieldworks WHERE user_id=$1 AND status='외근중' LIMIT 1`, [user.id]
      );
      if (active.rowCount) return failure(res, 409, '이미 외근 중입니다.');
      const result = await pool.query(
        `INSERT INTO namo_fieldworks
          (user_id,user_uid,user_name,department,title,work_date,destination,purpose,companion,planned_return,note)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [user.id,user.uid||'',user.name||'',user.department||'',user.title||'',koreaDate(),destination,purpose,
         text(req.body.companion),text(req.body.returnPlan)||null,text(req.body.note)]
      );
      return success(res, mapFieldwork(result.rows[0]), '외근을 시작했습니다.');
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.post('/api/namo-work/fieldworks/:id/return', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const result = await pool.query(
        `UPDATE namo_fieldworks SET returned_at=NOW(),status='복귀완료',updated_at=NOW()
          WHERE id=$1 AND user_id=$2 AND status='외근중' RETURNING *`, [req.params.id,user.id]
      );
      if (!result.rowCount) return failure(res, 404, '진행 중인 외근 기록을 찾을 수 없습니다.');
      return success(res, mapFieldwork(result.rows[0]), '외근 복귀 처리되었습니다.');
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.get('/api/namo-work/leaves', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const params = []; let where = '';
      if (!isDirector(user)) { params.push(user.id); where = 'WHERE applicant_id = $1'; }
      const result = await pool.query(
        `SELECT * FROM namo_leaves ${where} ORDER BY applied_at DESC LIMIT 1000`, params
      );
      return success(res, result.rows.map(mapLeave));
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.post('/api/namo-work/leaves', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const leaveType = text(req.body && req.body.type);
      const leaveDate = text(req.body && req.body.date);
      const reason = text(req.body && req.body.reason);
      if (!['연차','오전 반차','오후 반차'].includes(leaveType)) return failure(res, 400, '휴가 구분을 확인해 주세요.');
      if (!leaveDate || !reason) return failure(res, 400, '사용일과 신청 사유를 입력해 주세요.');
      const days = leaveType === '연차' ? 1 : 0.5;
      const documentNo = `LV-${leaveDate.replace(/-/g,'')}-${Date.now().toString().slice(-6)}`;
      const result = await pool.query(
        `INSERT INTO namo_leaves
          (document_no,applicant_id,applicant_uid,applicant_name,department,title,leave_type,leave_date,leave_days,reason,handover)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
        [documentNo,user.id,user.uid||'',user.name||'',user.department||'',user.title||'',leaveType,leaveDate,days,reason,text(req.body.handover)]
      );
      return success(res, mapLeave(result.rows[0]), '휴가 신청이 완료되었습니다. 이사 검토 대기입니다.');
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.post('/api/namo-work/leaves/:id/decision', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      if (!isDirector(user)) return failure(res, 403, '이사 검토 권한이 필요합니다.');
      await schemaReady;
      const decision = text(req.body && req.body.decision);
      const rejectReason = text(req.body && req.body.rejectReason);
      if (!['approve','reject'].includes(decision)) return failure(res, 400, '처리 구분을 확인해 주세요.');
      if (decision === 'reject' && !rejectReason) return failure(res, 400, '반려 사유를 입력해 주세요.');
      const status = decision === 'approve' ? '승인완료' : '반려';
      const result = await pool.query(
        `UPDATE namo_leaves SET status=$1,reviewer_id=$2,reviewer_name=$3,reviewer_title=$4,
          reviewed_at=NOW(),reject_reason=$5,updated_at=NOW()
          WHERE id=$6 AND status='검토대기' RETURNING *`,
        [status,user.id,user.name||'',user.title||'이사',decision==='reject'?rejectReason:'',req.params.id]
      );
      if (!result.rowCount) return failure(res, 409, '이미 처리되었거나 신청서를 찾을 수 없습니다.');
      return success(res, mapLeave(result.rows[0]), decision === 'approve' ? '휴가 신청을 승인했습니다.' : '휴가 신청을 반려했습니다.');
    } catch (err) { return failure(res, 500, err.message); }
  });

  app.delete('/api/namo-work/leaves/:id', async (req, res) => {
    try {
      const user = requireUser(req, res); if (!user) return;
      await schemaReady;
      const result = await pool.query(
        `DELETE FROM namo_leaves WHERE id=$1 AND applicant_id=$2 AND status<>'승인완료' RETURNING id`,
        [req.params.id,user.id]
      );
      if (!result.rowCount) return failure(res, 409, '승인 완료되었거나 취소할 수 없는 신청입니다.');
      return success(res, null, '휴가 신청을 취소했습니다.');
    } catch (err) { return failure(res, 500, err.message); }
  });
}

const wrappedExpress = function wrappedExpress(...args) {
  const app = expressModule(...args);
  const originalUse = app.use.bind(app);
  let useCount = 0;
  app.use = function patchedUse(...middleware) {
    const result = originalUse(...middleware);
    useCount += 1;
    if (useCount === 3) registerNamoTalkRoutes(app);
    return result;
  };
  return app;
};

Object.assign(wrappedExpress, expressModule);
require.cache[require.resolve('express')].exports = wrappedExpress;
