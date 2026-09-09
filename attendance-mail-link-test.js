'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

module.exports = function createAttendanceMailLinkTest(options = {}) {
  const rootDir = options.rootDir || __dirname;
  const mailConfig = options.mailConfig;
  const fetchCurrentAttendanceUser = options.fetchCurrentAttendanceUser;
  const keyFile = path.join(rootDir, '.attendance-mail-key.test');
  const storeFile = path.join(rootDir, '.attendance-mail-credentials.test.json');

  function encryptionKey() {
    const configured = String(process.env.MAIL_CREDENTIAL_KEY || '').trim();
    if (configured) return crypto.createHash('sha256').update(configured, 'utf8').digest();
    try {
      const saved = fs.readFileSync(keyFile, 'utf8').trim();
      if (/^[0-9a-f]{64}$/i.test(saved)) return Buffer.from(saved, 'hex');
    } catch (_error) {}
    const key = crypto.randomBytes(32);
    fs.writeFileSync(keyFile, key.toString('hex'), { encoding: 'utf8', mode: 0o600 });
    return key;
  }

  function readStore() {
    try {
      const parsed = JSON.parse(fs.readFileSync(storeFile, 'utf8'));
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_error) { return {}; }
  }

  function writeStore(store) {
    const tmp = `${storeFile}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2), { encoding: 'utf8', mode: 0o600 });
    fs.renameSync(tmp, storeFile);
  }

  function encryptPassword(password) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(String(password), 'utf8'), cipher.final()]);
    return { version: 1, iv: iv.toString('base64'), tag: cipher.getAuthTag().toString('base64'), data: ciphertext.toString('base64') };
  }

  function decryptPassword(record) {
    if (!record || record.version !== 1) return '';
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(record.iv, 'base64'));
    decipher.setAuthTag(Buffer.from(record.tag, 'base64'));
    return Buffer.concat([decipher.update(Buffer.from(record.data, 'base64')), decipher.final()]).toString('utf8');
  }

  function credentialFor(sender) {
    const email = String(sender?.email || '').trim().toLowerCase();
    if (!email) return null;
    const record = readStore()[email];
    if (!record) return null;
    try {
      const pass = decryptPassword(record.secret);
      return pass ? { user: email, pass } : null;
    } catch (error) {
      console.warn('[NAMO TEST mail link] stored credential decrypt failed:', error.message);
      return null;
    }
  }

  async function currentSender(req) {
    if (typeof fetchCurrentAttendanceUser !== 'function') throw new Error('로그인 사용자 확인 기능이 없습니다.');
    return fetchCurrentAttendanceUser(req);
  }

  async function verifyCredential(sender, password) {
    if (typeof mailConfig !== 'function') throw new Error('SMTP 설정을 확인할 수 없습니다.');
    const cfg = mailConfig();
    const transporter = nodemailer.createTransport({ host: cfg.host, port: cfg.port, secure: cfg.secure, auth: { user: sender.email, pass: password }, requireTLS: cfg.port === 587 });
    await transporter.verify();
  }

  function installRoutes(app) {
    app.get('/api/attendance/test-mail-link/status', async (req, res) => {
      try {
        const sender = await currentSender(req);
        return res.json({ success: true, data: { linked: Boolean(credentialFor(sender)), sender: { id: sender.id || null, name: sender.name || '', email: sender.email || '' } } });
      } catch (error) {
        return res.status(401).json({ success: false, code: 'LOGIN_SENDER_NOT_FOUND', message: error.message });
      }
    });

    app.post('/api/attendance/test-mail-link', async (req, res) => {
      const password = String(req.body?.password || '');
      if (!password) return res.status(400).json({ success: false, code: 'MAIL_LINK_PASSWORD_REQUIRED', message: '최초 메일 연동을 위한 이카운트 웹메일 비밀번호가 필요합니다.' });
      let sender;
      try { sender = await currentSender(req); }
      catch (error) { return res.status(401).json({ success: false, code: 'LOGIN_SENDER_NOT_FOUND', message: error.message }); }
      try {
        await verifyCredential(sender, password);
        const store = readStore();
        const email = String(sender.email).trim().toLowerCase();
        store[email] = { email, userId: sender.id || null, linkedAt: new Date().toISOString(), secret: encryptPassword(password) };
        writeStore(store);
        return res.json({ success: true, data: { linked: true, sender: { id: sender.id || null, name: sender.name || '', email: sender.email || '' } } });
      } catch (error) {
        const authFailed = error?.code === 'EAUTH' || Number(error?.responseCode) === 535;
        return res.status(502).json({ success: false, code: authFailed ? 'SMTP_AUTH_FAILED' : 'MAIL_LINK_FAILED', message: authFailed ? '이카운트 웹메일 비밀번호를 확인해 주세요.' : `메일 연동 실패: ${error.message}` });
      }
    });

    app.delete('/api/attendance/test-mail-link', async (req, res) => {
      try {
        const sender = await currentSender(req);
        const email = String(sender.email || '').trim().toLowerCase();
        const store = readStore();
        delete store[email];
        writeStore(store);
        return res.json({ success: true, data: { linked: false } });
      } catch (error) {
        return res.status(401).json({ success: false, code: 'LOGIN_SENDER_NOT_FOUND', message: error.message });
      }
    });
  }

  return { credentialFor, installRoutes };
};
