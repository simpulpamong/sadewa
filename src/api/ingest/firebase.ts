import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getFirestore as _getFirestore } from 'firebase-admin/firestore';

function stripWrappingQuotes(value: string) {
  const t = value.trim();
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) return t.slice(1, -1).trim();
  return t;
}

function parseCreds(rawInput: string) {
  let json = stripWrappingQuotes(String(rawInput || ''));
  if (!json) throw new Error('FIREBASE_SERVICE_ACCOUNT tidak dikonfigurasi.');
  if (!json.startsWith('{')) {
    try { const decoded = Buffer.from(json, 'base64').toString('utf8').trim(); if (decoded.startsWith('{')) json = decoded; } catch {}
  }
  let creds: any;
  try { creds = JSON.parse(json); } catch {
    try { const unwrapped = JSON.parse(json); creds = typeof unwrapped === 'string' ? JSON.parse(unwrapped) : unwrapped; } catch { throw new Error('FIREBASE_SERVICE_ACCOUNT bukan JSON valid.'); }
  }
  if (creds?.private_key && typeof creds.private_key === 'string') creds.private_key = creds.private_key.replace(/\\n/g, '\n').replace(/\r/g, '');
  if (!creds?.project_id || !creds?.client_email || !creds?.private_key) throw new Error('FIREBASE_SERVICE_ACCOUNT tidak lengkap (butuh project_id, client_email, private_key).');
  return creds;
}

function ensureApp() {
  if (getApps().length) return getApps()[0]!;
  const candidates = [process.env.FIREBASE_SERVICE_ACCOUNT, process.env.FIREBASE_SERVICE_ACCOUNT_JSON]
    .map(v => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean);
  if (!candidates.length) throw new Error('FIREBASE_SERVICE_ACCOUNT atau FIREBASE_SERVICE_ACCOUNT_JSON belum dikonfigurasi.');
  let last: unknown;
  for (const raw of candidates) {
    try { return initializeApp({ credential: cert(parseCreds(raw) as any) }); } catch (e) { last = e; }
  }
  throw last instanceof Error ? last : new Error('FIREBASE_SERVICE_ACCOUNT bukan JSON valid.');
}

export function getFirestore() {
  return _getFirestore(ensureApp());
}
