import React, { useEffect, useRef, useState } from 'react';
import { UserRound, KeyRound, Save, Shield, Info, Palette, Server, CheckCircle2, AlertCircle, Eye, EyeOff, Settings, Printer, FileSignature, Download, Smartphone, Share, Users, Upload, Link2, Loader2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth, authHeaders } from '@/context/AuthContext';
import { useDialog, Modal } from '@/components/ui';
import { useInstallPrompt } from '@/lib/useInstallPrompt';
import { DEFAULT_PRINT_SETTINGS, mergePrintSettings, type PrintSettings } from '@/lib/printSettings';
import { cn } from '@/lib/cn';
import Pengguna from './Pengguna';

type Tab = 'profil' | 'cetak' | 'pengguna' | 'tentang';

function Card({ children, className='' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F172A] shadow-sm', className)}>{children}</div>;
}
function CardHead({ title, desc }: { title: string; desc?: string }) {
  return <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800"><div className="font-bold text-slate-800 dark:text-slate-100">{title}</div>{desc && <div className="text-xs text-slate-500 mt-0.5">{desc}</div>}</div>;
}
function Notice({ ok, text }: { ok: boolean; text: string }) {
  if (!text) return null;
  return <div className={cn('rounded-xl border px-4 py-3 text-sm flex items-start gap-2', ok ? 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-300')}>{ok?<CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0"/>:<AlertCircle className="w-4 h-4 mt-0.5 shrink-0"/>}<span>{text}</span></div>;
}
function Inp({ label, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block"><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span><input {...rest} className={cn('mt-1.5 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] px-3.5 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition disabled:opacity-60', rest.className)} /></label>;
}

export default function Pengaturan() {
  const { user, token, isSuper, refresh } = useAuth();
  const dialog = useDialog();
  const pwa = useInstallPrompt();
  const [tab, setTab] = useState<Tab>('profil');
  const [displayName, setDisplayName] = useState((user as any)?.displayName || '');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ok:boolean;text:string}|null>(null);

  // password
  const [pwOpen, setPwOpen] = useState(false);
  const [cur, setCur] = useState(''); const [npw, setNpw] = useState(''); const [rep, setRep] = useState('');
  const [show, setShow] = useState({c:false,n:false,r:false});
  const [pmsg, setPmsg] = useState<{ok:boolean;text:string}|null>(null);
  const [pbusy, setPbusy] = useState(false);

  // cetak
  const [ps, setPs] = useState<PrintSettings>(DEFAULT_PRINT_SETTINGS);
  const [cmsg, setCmsg] = useState<{ok:boolean;text:string}|null>(null);
  const [cbusy, setCbusy] = useState(false);
  const [printLoading, setPrintLoading] = useState(true);
  const [printLoadError, setPrintLoadError] = useState('');
  const [printRetry, setPrintRetry] = useState(0);
  const [logoBusy, setLogoBusy] = useState<'left'|'right'|null>(null);

  useEffect(()=>{ setDisplayName((user as any)?.displayName || user?.username || ''); }, [user]);
  useEffect(() => {
    let active = true;
    setPrintLoading(true);
    setPrintLoadError('');
    (async()=>{
      try {
        const r = await api<any>('/api/admin/print-settings', { headers: authHeaders(token), fresh: true });
        if (!r?.settings) throw new Error('Data pengaturan cetak tidak ditemukan.');
        if (active) setPs(mergePrintSettings(r.settings));
      } catch (e: any) {
        if (active) setPrintLoadError(e.message || 'Gagal memuat pengaturan cetak dari Firestore.');
      } finally {
        if (active) setPrintLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token, printRetry]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setMsg(null);
    try {
      await api('/api/auth/me', { method:'PUT', headers: authHeaders(token), body: JSON.stringify({ displayName }) });
      try { await refresh(); } catch {}
      setMsg({ok:true,text:'Profil berhasil diperbarui.'}); dialog.toast('Profil diperbarui.', 'success');
    } catch(e:any){ setMsg({ok:false,text:e.message||'Gagal memperbarui profil.'}); }
    finally { setBusy(false); }
  };

  const openPw = () => { setPmsg(null); setCur(''); setNpw(''); setRep(''); setShow({c:false,n:false,r:false}); setPwOpen(true); };
  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault(); setPmsg(null);
    if (!cur || !npw) return setPmsg({ok:false,text:'Password saat ini dan password baru wajib diisi.'});
    if (npw.length < 6) return setPmsg({ok:false,text:'Password baru minimal 6 karakter.'});
    if (npw !== rep) return setPmsg({ok:false,text:'Konfirmasi password tidak cocok.'});
    if (cur === npw) return setPmsg({ok:false,text:'Password baru harus berbeda dari password lama.'});
    setPbusy(true);
    try {
      await api('/api/auth/change-password', { method:'POST', headers: authHeaders(token), body: JSON.stringify({ currentPassword: cur, newPassword: npw }) });
      dialog.toast('Password diperbarui.', 'success');
      setCur(''); setNpw(''); setRep(''); setPwOpen(false);
    } catch(e:any){ setPmsg({ok:false,text:e.message||'Gagal mengubah password.'}); }
    finally { setPbusy(false); }
  };

  const applyLogo = (side: 'left'|'right', url: string) => {
    setPs(p => ({ ...p, kop: { ...p.kop, [side === 'left' ? 'logoLeftUrl' : 'logoRightUrl']: url } }));
  };

  const savePrint = async (e: React.FormEvent) => {
    e.preventDefault(); setCmsg(null);
    if (!isSuper) { setCmsg({ok:false,text:'Hanya superadmin yang dapat menyimpan pengaturan cetak.'}); return; }
    if (printLoading || printLoadError) { setCmsg({ok:false,text:'Pengaturan belum berhasil dimuat dari Firestore. Muat ulang sebelum menyimpan.'}); return; }
    setCbusy(true);
    try {
      const r = await api<any>('/api/admin/print-settings', { method:'PUT', headers: authHeaders(token), body: JSON.stringify(ps) });
      if (!r?.settings) throw new Error('Server tidak mengembalikan pengaturan yang disimpan.');
      const verified = await api<any>('/api/admin/print-settings', { headers: authHeaders(token), fresh: true });
      if (!verified?.settings) throw new Error('Pengaturan tersimpan tetapi tidak dapat diverifikasi dari Firestore.');
      setPs(mergePrintSettings(verified.settings));
      setCmsg({ok:true,text:'Pengaturan cetak/kop disimpan. Berlaku untuk Cetak Rekap & Berita Acara.'}); dialog.toast('Pengaturan cetak disimpan.', 'success');
    } catch(e:any){ setCmsg({ok:false,text:e.message||'Gagal menyimpan pengaturan cetak.'}); }
    finally { setCbusy(false); }
  };

  const setKop = (k: keyof PrintSettings['kop'], v: any) => setPs(p => ({ ...p, kop: { ...p.kop, [k]: v } }));
  const setSign = (kind: 'beritaAcara'|'rekap', k: keyof PrintSettings['tandaTangan']['beritaAcara'], v: string) => setPs(p => ({ ...p, tandaTangan: { ...p.tandaTangan, [kind]: { ...p.tandaTangan[kind], [k]: v } } }));

  const compressImage = (file: File, max = 600, quality = 0.82): Promise<string> => new Promise((resolve, reject) => {
    const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => {
      let { width: w, height: h } = img;
      if (w > max || h > max) { const r = Math.min(max / w, max / h); w = Math.round(w * r); h = Math.round(h * r); }
      const c = document.createElement('canvas'); c.width = w; c.height = h;
      const ctx = c.getContext('2d'); if (!ctx) { URL.revokeObjectURL(url); return reject(new Error('Canvas tidak didukung.')); }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(c.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Gagal membaca gambar.')); };
    img.src = url;
  });

  const uploadLogo = async (side: 'left'|'right', file: File) => {
    if (!isSuper) { dialog.toast('Hanya superadmin yang dapat mengunggah logo.', 'warning'); return; }
    setLogoBusy(side);
    try {
      const dataUrl = await compressImage(file);
      const r = await api<any>('/api/admin/upload-image', { method: 'POST', headers: authHeaders(token), body: JSON.stringify({ contentBase64: dataUrl, folder: 'sadewa-admin/kop' }) });
      const uploadedUrl = String(r?.url || '');
      if (!uploadedUrl) throw new Error('Server tidak mengembalikan URL logo.');
      applyLogo(side, uploadedUrl);
      dialog.toast('Logo berhasil diunggah. Tekan Simpan untuk menerapkannya ke kop surat.', 'success');
    } catch (e:any) { dialog.toast(e.message || 'Gagal unggah logo.', 'danger'); }
    finally { setLogoBusy(null); }
  };

  const tabs: {id:Tab; label:string; icon:any}[] = [
    { id:'profil', label:'Profil & Akun', icon: UserRound },
    { id:'cetak', label:'Format Cetak / Kop', icon: Printer },
    ...(isSuper ? [{ id:'pengguna' as Tab, label:'Pengguna & Role', icon: Users }] : []),
    { id:'tentang', label:'Tentang Sistem', icon: Info },
  ];

  const roleLabel = isSuper ? 'Superadmin' : `Admin${(user?.categoryScopes || []).length ? ` · ${(user?.categoryScopes || []).length} kategori` : ''}`;

  return (
    <div className="space-y-5">


      {pwa.show ? (
        <Card className="overflow-hidden">
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center shrink-0 text-blue-600 dark:text-blue-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">Pasang SADEWA Admin</div>
              {pwa.isiOS && !pwa.canPrompt ? (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Di iPhone/iPad: ketuk <Share className="inline w-3 h-3 -translate-y-px" /> <b>Bagikan</b>, lalu pilih <b>Tambah ke Layar Utama</b>.
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                  Akses cepat dari layar utama sebagai aplikasi. Ringan dan siap dipakai saat sinyal lemah.
                </div>
              )}
            </div>
            {pwa.canPrompt ? (
              <button type="button" onClick={() => void pwa.install()} disabled={pwa.installing}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-4 py-2.5 text-sm shadow-sm shrink-0">
                <Download className="w-4 h-4" />{pwa.installing ? 'Memasang…' : 'Pasang Aplikasi'}
              </button>
            ) : null}
          </div>
        </Card>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        {tabs.map((t, idx)=>{ const I=t.icon; const on=tab===t.id; const lastOdd = idx === tabs.length - 1 && tabs.length % 2 === 1; return (
          <button key={t.id} onClick={()=>setTab(t.id)} className={cn('inline-flex w-full sm:w-auto items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 rounded-xl text-[13px] sm:text-sm font-semibold border transition-all text-center', lastOdd && 'col-span-2 sm:col-span-1', on?'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20':'bg-white dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60')}>
            <I className="w-4 h-4 shrink-0"/><span className="truncate">{t.label}</span>
          </button>
        );})}
      </div>

      {tab === 'profil' && (
        <div className="grid lg:grid-cols-[1.1fr,.9fr] gap-5">
          <Card>
            <CardHead title="Profil Saya" desc="Informasi identitas akun yang digunakan pada sesi admin." />
            <form onSubmit={saveProfile} className="p-5 space-y-4">
              {msg && <Notice ok={msg.ok} text={msg.text} />}
              <div className="grid sm:grid-cols-2 gap-4">
                <Inp label="Nama Lengkap / Tampilan" value={displayName} onChange={e=>setDisplayName(e.target.value)} placeholder="Nama yang ditampilkan" />
                <Inp label="Username" value={user?.username||''} disabled className="opacity-70 cursor-not-allowed" />
              </div>
              <div className="flex justify-end"><button disabled={busy} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-4 py-2.5 text-sm shadow-sm"><Save className="w-4 h-4"/>{busy?'Menyimpan…':'Simpan Profil'}</button></div>
            </form>
          </Card>
          <Card>
            <CardHead title="Informasi Akun" desc="Detail akses dan peran Anda." />
            <div className="p-5 space-y-3 text-sm">
              {[['Username', `@${user?.username||'-'}`], ['Nama', (user as any)?.displayName || user?.username || '-'], ['Peran', isSuper?'Superadmin':'Admin'], ['Cakupan', roleLabel]].map(([k,v])=>(
                <div key={String(k)} className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0"><span className="text-slate-500 shrink-0">{k}</span><span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{v}</span></div>
              ))}
              <div className={cn('mt-2 rounded-xl border px-3.5 py-3 text-xs flex items-start gap-2', isSuper?'border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300':'border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300')}>
                <Shield className="w-4 h-4 shrink-0 mt-0.5"/><span>{isSuper ? 'Akses penuh ke seluruh fitur.' : 'Akses sesuai scope kategori.'}</span>
              </div>
              <div className="pt-2">
                <button type="button" onClick={openPw} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 px-3.5 py-2 text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition">
                  <KeyRound className="w-4 h-4 text-slate-500"/>Ubah Password
                </button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {tab === 'cetak' && (
        <form onSubmit={savePrint} className="space-y-5">
          {cmsg && <Notice ok={cmsg.ok} text={cmsg.text} />}
          {printLoading && <div className="text-sm text-slate-500">Memuat pengaturan kop surat dari Firestore…</div>}
          {printLoadError && <div className="space-y-2"><Notice ok={false} text={`Gagal memuat pengaturan kop surat: ${printLoadError}`} /><button type="button" onClick={()=>setPrintRetry(n=>n+1)} className="text-sm font-semibold text-blue-600 hover:text-blue-500">Muat ulang pengaturan</button></div>}
          <fieldset disabled={printLoading || !!printLoadError || !isSuper || cbusy} className="min-w-0 space-y-5 border-0 p-0 m-0">
          {!isSuper && <p className="text-xs text-amber-500">Hanya superadmin yang dapat menyimpan perubahan.</p>}
          <Card>
            <CardHead title="Kop Surat / Laporan" />
            <div className="p-5 grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 grid sm:grid-cols-2 gap-4">
                <KopLogo side="left" label="Logo Kiri" url={ps.kop.logoLeftUrl || ''} busy={logoBusy==='left'} canEdit={isSuper} onUrl={v=>applyLogo('left', v)} onUpload={(f)=>uploadLogo('left', f)} onClear={()=>applyLogo('left', '')} />
                <KopLogo side="right" label="Logo Kanan" url={ps.kop.logoRightUrl || ''} busy={logoBusy==='right'} canEdit={isSuper} onUrl={v=>applyLogo('right', v)} onUpload={(f)=>uploadLogo('right', f)} onClear={()=>applyLogo('right', '')} />
              </div>
              <label className="sm:col-span-2 inline-flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300"><input type="checkbox" checked={ps.kop.showLogo} onChange={e=>setKop('showLogo', e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-blue-600"/> Gunakan logo bawaan jika logo kiri kosong</label>
              <Inp label="Instansi Baris 1" value={ps.kop.instansi1} onChange={e=>setKop('instansi1', e.target.value)} />
              <Inp label="Instansi Baris 2" value={ps.kop.instansi2} onChange={e=>setKop('instansi2', e.target.value)} />
              <div className="sm:col-span-2"><Inp label="Subjudul / Sistem" value={ps.kop.sub} onChange={e=>setKop('sub', e.target.value)} /></div>
              <div className="sm:col-span-2"><Inp label="Alamat" value={ps.kop.alamat} onChange={e=>setKop('alamat', e.target.value)} placeholder="Opsional" /></div>
              <Inp label="Telepon" value={ps.kop.telepon} onChange={e=>setKop('telepon', e.target.value)} placeholder="Opsional" />
              <Inp label="Email" value={ps.kop.email} onChange={e=>setKop('email', e.target.value)} placeholder="Opsional" />
              <Inp label="Website" value={ps.kop.website} onChange={e=>setKop('website', e.target.value)} placeholder="Opsional" />
            </div>
          </Card>
          <div className="grid lg:grid-cols-2 gap-5">
            <Card>
              <CardHead title="Tanda Tangan — Berita Acara" desc="Blok kiri (pelapor/petugas) & kanan (mengetahui)." />
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                <Inp label="Kiri: Jabatan/Label" value={ps.tandaTangan.beritaAcara.kiriJabatan} onChange={e=>setSign('beritaAcara','kiriJabatan',e.target.value)} />
                <Inp label="Kiri: Nama (opsional)" value={ps.tandaTangan.beritaAcara.kiriNama} onChange={e=>setSign('beritaAcara','kiriNama',e.target.value)} placeholder="Kosong = ikut pelapor / titik-titik" />
                <Inp label="Kanan: Kota" value={ps.tandaTangan.beritaAcara.kananKota} onChange={e=>setSign('beritaAcara','kananKota',e.target.value)} />
                <Inp label="Kanan: Jabatan" value={ps.tandaTangan.beritaAcara.kananJabatan} onChange={e=>setSign('beritaAcara','kananJabatan',e.target.value)} />
                <div className="sm:col-span-2"><Inp label="Kanan: Nama" value={ps.tandaTangan.beritaAcara.kananNama} onChange={e=>setSign('beritaAcara','kananNama',e.target.value)} placeholder="Nama pejabat/petugas (opsional)" /></div>
              </div>
            </Card>
            <Card>
              <CardHead title="Tanda Tangan — Rekap" desc="Blok penandatangan rekapitulasi laporan." />
              <div className="p-5 grid sm:grid-cols-2 gap-4">
                <Inp label="Kiri: Jabatan/Label" value={ps.tandaTangan.rekap.kiriJabatan} onChange={e=>setSign('rekap','kiriJabatan',e.target.value)} placeholder="Opsional" />
                <Inp label="Kiri: Nama" value={ps.tandaTangan.rekap.kiriNama} onChange={e=>setSign('rekap','kiriNama',e.target.value)} placeholder="Opsional" />
                <Inp label="Kanan: Kota" value={ps.tandaTangan.rekap.kananKota} onChange={e=>setSign('rekap','kananKota',e.target.value)} />
                <Inp label="Kanan: Jabatan" value={ps.tandaTangan.rekap.kananJabatan} onChange={e=>setSign('rekap','kananJabatan',e.target.value)} />
                <div className="sm:col-span-2"><Inp label="Kanan: Nama" value={ps.tandaTangan.rekap.kananNama} onChange={e=>setSign('rekap','kananNama',e.target.value)} placeholder="Nama pejabat/petugas (opsional)" /></div>
              </div>
            </Card>
          </div>
          <Card>
            <CardHead title="Footer Dokumen" />
            <div className="p-5"><Inp label="Teks Footer" value={ps.footer} onChange={e=>setPs(p=>({...p, footer:e.target.value}))} placeholder="Contoh: Dicetak dari SADEWA Admin" /></div>
          </Card>
          {isSuper && (
            <div className="flex justify-end">
              <button disabled={cbusy || printLoading || !!printLoadError} type="submit" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-4 py-2.5 text-sm shadow-sm"><Save className="w-4 h-4"/>{cbusy?'Menyimpan…':'Simpan'}</button>
            </div>
          )}
          </fieldset>
        </form>
      )}

      {tab === 'pengguna' && isSuper && (
        <Pengguna embedded />
      )}

      {tab === 'tentang' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <Card>
            <CardHead title="Tentang Sistem" desc="SADEWA — Sistem Aksi dan Evaluasi Praja Wibawa." />
            <div className="p-5">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 border border-blue-500/30 flex items-center justify-center shadow-sm"><img src="/assets/sadewa-white.svg" alt="SADEWA" className="w-8 h-8 object-contain" /></div>
                <div><div className="font-extrabold text-slate-800 dark:text-slate-100">SADEWA Admin</div><div className="text-sm text-slate-500">Satuan Polisi Pamong Praja<br/>Kabupaten Ponorogo</div></div>
              </div>
              <div className="space-y-0 text-sm">{[['Aplikasi','SADEWA Admin Workspace'],['Instansi','Satpol PP Kabupaten Ponorogo'],['Mode','Produksi (integrasi penuh)'],['Sesi','Berbasis token (role & scope)']].map(([k,v])=>(<div key={String(k)} className="flex justify-between gap-4 py-2 border-b border-slate-100 dark:border-slate-800/80 last:border-0"><span className="text-slate-500">{k}</span><span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{v}</span></div>))}</div>
            </div>
          </Card>
          <Card>
            <CardHead title="Integrasi & Modul" desc="Komponen yang terhubung (dinamis, app-driven)." />
            <div className="p-5 grid sm:grid-cols-2 gap-2.5">
              {[
                {i:Server,t:'Firestore',d:'SOT: kategori, format/parser, rekap, pengguna, pengaturan cetak'},
                {i:Server,t:'Google Sheets',d:'Laporan per kategori (spreadsheet terpisah)'},
                {i:Server,t:'Server',d:'Google Drive file manager (API v3) per kategori'},
                {i:Server,t:'Apps Script',d:'Executor app-driven (rekap/sampah/sheet)'},
                {i:Palette,t:'Peta',d:'Titik GPS/EXIF (Leaflet, modal + Google Maps)'},
                {i:Shield,t:'Akses',d:'Superadmin & Admin (scope kategori)'},
              ].map(x=>{ const I=x.i; return <div key={x.t} className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 flex gap-3"><span className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-500"><I className="w-4 h-4"/></span><div><div className="text-sm font-semibold text-slate-700 dark:text-slate-200">{x.t}</div><div className="text-[11px] text-slate-500 leading-snug mt-0.5">{x.d}</div></div></div>; })}
            </div>
          </Card>
        </div>
      )}

      <Modal open={pwOpen} onClose={()=>!pbusy && setPwOpen(false)} title="Ubah Password" icon={<KeyRound className="w-4 h-4 text-blue-400"/>} size="sm"
        footer={<><button type="button" onClick={()=>setPwOpen(false)} disabled={pbusy} className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold disabled:opacity-50">Batal</button><button type="submit" form="pw-form" disabled={pbusy} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-semibold px-4 py-2 text-sm"><KeyRound className="w-4 h-4"/>{pbusy?'Memproses…':'Simpan Password'}</button></>}>
        <form id="pw-form" onSubmit={changePassword} className="space-y-4">
          {pmsg && <Notice ok={pmsg.ok} text={pmsg.text} />}
          <Pw label="Password Saat Ini" value={cur} onChange={setCur} show={show.c} toggle={()=>setShow(s=>({...s,c:!s.c}))} autoComplete="current-password" />
          <Pw label="Password Baru" value={npw} onChange={setNpw} show={show.n} toggle={()=>setShow(s=>({...s,n:!s.n}))} autoComplete="new-password" placeholder="Min. 6 karakter" />
          <Pw label="Konfirmasi Password Baru" value={rep} onChange={setRep} show={show.r} toggle={()=>setShow(s=>({...s,r:!s.r}))} autoComplete="new-password" />
        </form>
      </Modal>
    </div>
  );
}

function Pw({ label, value, onChange, show, toggle, placeholder, autoComplete }: { label:string; value:string; onChange:(v:string)=>void; show:boolean; toggle:()=>void; placeholder?:string; autoComplete?:string }) {
  return <label className="block"><span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
    <div className="mt-1.5 relative">
      <input type={show?'text':'password'} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete}
        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] pl-3.5 pr-10 py-2.5 text-sm text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 focus:outline-none transition" />
      <button type="button" onClick={toggle} tabIndex={-1} className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">{show?<Eye className="w-4 h-4"/>:<EyeOff className="w-4 h-4"/>}</button>
    </div></label>;
}

const KOP_PRESETS = [
  { label: 'Satpol PP', src: '/assets/satpol.webp' },
  { label: 'Damkar', src: '/assets/damkar.webp' },
  { label: 'Ponorogo', src: '/assets/ponorogo.webp' },
];

function KopLogo({ label, url, busy, canEdit, onUrl, onUpload, onClear }: { side?: 'left' | 'right'; label: string; url: string; busy: boolean; canEdit: boolean; onUrl: (v:string)=>void; onUpload: (f:File)=>void | Promise<void>; onClear: ()=>void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [imgErr, setImgErr] = useState(false);

  useEffect(() => {
    setImgErr(false);
  }, [url]);

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/70 bg-slate-50/60 dark:bg-slate-900/20 p-3 space-y-2">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{label}</span>
        {url ? <button type="button" onClick={onClear} disabled={!canEdit} className="text-[11px] font-semibold text-rose-500 hover:text-rose-400 disabled:opacity-40 inline-flex items-center gap-1"><XCircle className="w-3.5 h-3.5"/>Hapus</button> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden shrink-0">
          {url && !imgErr ? (
            <img key={url} src={url} alt={label} className="h-full w-full object-contain p-0.5" onError={() => setImgErr(true)} />
          ) : (
            <span className="text-[10px] text-slate-400">{imgErr ? 'Gagal muat' : 'Kosong'}</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="relative">
            <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input value={url} onChange={e=>onUrl(e.target.value)} disabled={!canEdit} placeholder="https://… (tautan gambar)" className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0B1120] pl-8 pr-2.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:border-blue-500 focus:outline-none disabled:opacity-60" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e=>{ const f=e.target.files?.[0]; e.target.value=''; if(f) onUpload(f); }} />
            <button type="button" disabled={!canEdit || busy} onClick={()=>ref.current?.click()} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50">
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin"/> : <Upload className="w-3.5 h-3.5"/>}{busy ? 'Mengunggah…' : 'Unggah'}
            </button>
            <span className="text-[10px] text-slate-400">atau pilih bawaan:</span>
            {KOP_PRESETS.map(p => {
              const isActive = url === p.src;
              return (
                <button key={p.src} type="button" disabled={!canEdit} onClick={()=>onUrl(p.src)} title={p.label}
                  className={`inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${isActive ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                  <img src={p.src} alt="" className="w-4 h-4 object-contain"/>{p.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
