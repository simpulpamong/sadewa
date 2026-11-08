import React, { useEffect, useState } from 'react';
import { Plus, Pencil, Save, FolderTree, ChevronDown, ChevronRight, Zap, Loader2, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth, authHeaders } from '@/context/AuthContext';
import { ImagePicker } from '@/components/ImagePicker';
import { IconPicker } from '@/components/IconPicker';
import { resolveKategoriImage } from '@/lib/image';
import { resolveCategoryIcon } from '@/lib/categoryIcons';
import { useDialog, Dropdown, Modal } from '@/components/ui';
import type { ReportCategory, ReportSubcategory } from '@/types';

const TONE_META: Record<string, { label: string; dot: string; badge: string }> = {
  blue:   { label: 'Biru',   dot: 'bg-blue-500',   badge: 'bg-blue-500/15 text-blue-600 dark:text-blue-300 ring-blue-500/30' },
  orange: { label: 'Oranye', dot: 'bg-orange-500', badge: 'bg-orange-500/15 text-orange-600 dark:text-orange-300 ring-orange-500/30' },
  teal:   { label: 'Teal',   dot: 'bg-teal-500',   badge: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 ring-teal-500/30' },
  violet: { label: 'Violet', dot: 'bg-violet-500', badge: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-violet-500/30' },
  rose:   { label: 'Rose',   dot: 'bg-rose-500',   badge: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30' },
  amber:  { label: 'Amber',  dot: 'bg-amber-500',  badge: 'bg-amber-500/15 text-amber-600 dark:text-amber-300 ring-amber-500/30' },
  slate:  { label: 'Slate',  dot: 'bg-slate-500',  badge: 'bg-slate-500/15 text-slate-600 dark:text-slate-300 ring-slate-500/30' },
};
const tones = Object.keys(TONE_META);
const ToneDot = ({ tone, className = '' }: { tone?: string; className?: string }) => <span className={`inline-block w-3 h-3 rounded-full ring-2 ring-white/70 dark:ring-slate-900/60 shrink-0 ${TONE_META[tone||'blue']?.dot || 'bg-slate-400'} ${className}`} aria-hidden="true" />;
const emptyCat = (): Partial<ReportCategory> => ({ name:'', slug:'', description:'', icon:'', image:'', tone:'blue', order:0, active:true, config:{ driveFolder:'' } });
const emptySub = (categoryId=''): Partial<ReportSubcategory> => ({ categoryId, name:'', slug:'', description:'', icon:'', image:'', order:0, active:true, format:{ template:'', fields:[], version:1 }, config:{ driveFolder:'', reportSheet:'', photoSheet:'', narrativeSheet:'' } });

export default function Kategori() {
  const { token, isSuper } = useAuth();
  const dialog = useDialog();
  const [cats, setCats] = useState<ReportCategory[]>([]);
  const [subs, setSubs] = useState<ReportSubcategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState<string|null>(null);
  const [open, setOpen] = useState<Record<string,boolean>>({});
  const [editCat, setEditCat] = useState<Partial<ReportCategory>|null>(null);
  const [editSub, setEditSub] = useState<Partial<ReportSubcategory>|null>(null);

  const load = async () => {
    setLoading(true); setErr('');
    try { const r = await api<{success:true;categories:ReportCategory[];subcategories:ReportSubcategory[]}>(`/api/admin/categories`, { headers: authHeaders(token), fresh: true }); setCats(r.categories); setSubs(r.subcategories); }
    catch(e:any){ setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(()=>{ load(); }, []); // eslint-disable-line

  const provision = async (cat: ReportCategory) => {
    const ok = await dialog.confirm({ title: 'Otomasi & Aktifkan Kategori', tone: 'info', confirmLabel: 'Aktifkan', message: <>Buat Spreadsheet & Folder Drive terpisah untuk <b>{cat.name}</b> (DAMKAR/TIBUM masing-masing punya milik sendiri) lalu simpan ID-nya?</> });
    if (!ok) return;
    setBusy(cat.id);
    try { const r = await api<any>(`/api/admin/categories/${cat.id}/provision`, { method:'POST', headers: authHeaders(token), body: JSON.stringify({}) }); dialog.toast(r.message || 'Berhasil diaktifkan.', 'success'); await load(); }
    catch(e:any){ dialog.toast('Gagal: '+e.message, 'danger'); } finally { setBusy(null); }
  };

  const saveCat = async () => {
    if (!editCat?.name) { dialog.toast('Nama kategori wajib diisi.', 'warning'); return; }
    try {
      if (editCat.id) await api(`/api/admin/categories/${editCat.id}`, { method:'PUT', headers: authHeaders(token), body: JSON.stringify(editCat) });
      else await api(`/api/admin/categories`, { method:'POST', headers: authHeaders(token), body: JSON.stringify(editCat) });
      setEditCat(null); dialog.toast('Kategori tersimpan.', 'success'); await load();
    } catch(e:any){ dialog.toast(e.message, 'danger'); }
  };
  const saveSub = async () => {
    if (!editSub?.name || !editSub?.categoryId) { dialog.toast('Nama & kategori sub wajib diisi.', 'warning'); return; }
    try {
      const payload = { ...editSub };
      if (editSub.id) await api(`/api/admin/subcategories/${editSub.id}`, { method:'PUT', headers: authHeaders(token), body: JSON.stringify(payload) });
      else await api(`/api/admin/subcategories`, { method:'POST', headers: authHeaders(token), body: JSON.stringify(payload) });
      setEditSub(null); dialog.toast('Subkategori tersimpan.', 'success'); await load();
    } catch(e:any){ dialog.toast(e.message, 'danger'); }
  };

  if (loading) return <div className="text-slate-500">Memuat kategori…</div>;
  return (
    <div className="space-y-5">
      {isSuper && <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-500 dark:text-slate-400"><span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{cats.length}</span> kategori<span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span><span className="font-semibold text-slate-700 dark:text-slate-200 tabular-nums">{subs.length}</span> subkategori</div>
        <button onClick={()=>setEditCat(emptyCat())} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 text-sm font-semibold"><Plus className="w-4 h-4"/>Kategori Baru</button>
      </div>}
      {err && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-400 px-4 py-3 text-sm">{err}</div>}

      <Modal open={!!editCat && isSuper} onClose={()=>setEditCat(null)} title={editCat?.id?'Edit Kategori':'Kategori Baru'} icon={<FolderTree className="w-4 h-4 text-blue-400"/>} size="lg"
        footer={<><button onClick={()=>setEditCat(null)} className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold">Batal</button><button onClick={saveCat} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-semibold"><Save className="w-4 h-4"/>Simpan</button></>}>
        {editCat && <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Inp label="Nama" value={editCat.name||''} onChange={v=>setEditCat({...editCat,name:v})} />
            <Inp label="Slug" value={editCat.slug||''} onChange={v=>setEditCat({...editCat,slug:v})} placeholder="otomatis dari nama" />
            <Inp label="Deskripsi" value={editCat.description||''} onChange={v=>setEditCat({...editCat,description:v})} />
            <div className="block"><span className="text-xs font-semibold text-slate-500 uppercase">Tone</span><div className="mt-1"><Dropdown value={editCat.tone||'blue'} onChange={v=>setEditCat({...editCat,tone:v as any})} options={tones.map(t=>({value:t,label:TONE_META[t]?.label || t, icon:<ToneDot tone={t} />}))} /></div></div>
            <Inp label="Urutan" type="number" value={String(editCat.order??0)} onChange={v=>setEditCat({...editCat,order:Number(v)})} />
            <Inp label="Folder Drive (nama)" value={editCat.config?.driveFolder||''} onChange={v=>setEditCat({...editCat,config:{...(editCat.config||{}),driveFolder:v}})} />
          </div>
          <IconPicker label="Ikon Kategori" value={(editCat as any).icon||''} onChange={v=>setEditCat({...editCat, icon: v} as any)} />
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editCat.active!==false} onChange={e=>setEditCat({...editCat,active:e.target.checked})}/> Aktif</label>
        </div>}
      </Modal>

      <div className="space-y-3">
        {cats.map(cat => {
          const children = subs.filter(s=>s.categoryId===cat.id);
          const isOpen = open[cat.id] ?? true;
          return (
            <div key={cat.id} className={`rounded-2xl border ${cat.config?.spreadsheetId && cat.config?.driveRootFolderId ? 'border-emerald-500/25' : 'border-slate-200 dark:border-slate-800'} bg-white dark:bg-[#0F172A] overflow-hidden`}>
              <div className="flex items-center gap-3 px-4 py-3.5">
                <button onClick={()=>setOpen(o=>({...o,[cat.id]:!isOpen}))} className="text-slate-400 hover:text-slate-200">{isOpen?<ChevronDown className="w-4 h-4"/>:<ChevronRight className="w-4 h-4"/>}</button>
                {(() => { const C = resolveCategoryIcon((cat as any).icon); return C ? <span className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0"><C className="w-5 h-5"/></span> : (resolveKategoriImage(cat.image) ? <img src={resolveKategoriImage(cat.image)!} alt="" className="w-10 h-10 rounded-xl object-cover border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0"/> : <span className="w-10 h-10 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center shrink-0"><FolderTree className="w-5 h-5"/></span>); })()}
                <div className="flex-1 min-w-0"><div className="font-semibold flex items-center gap-2 flex-wrap">{cat.name} {!cat.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">nonaktif</span>} <span className={`inline-flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded-full ring-1 font-medium ${TONE_META[cat.tone||'blue']?.badge || TONE_META.blue.badge}`}><ToneDot tone={cat.tone} className="!w-2 !h-2 ring-0" />{TONE_META[cat.tone||'blue']?.label || cat.tone}</span>{cat.config?.spreadsheetId && cat.config?.driveRootFolderId && <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300"><CheckCircle2 className="w-3 h-3"/>Spreadsheet & Folder terpisah</span>}</div><div className="text-xs text-slate-500">{cat.description} · slug: {cat.slug} · {children.length} subkategori{(cat as any).icon ? ` · ikon ${(cat as any).icon}` : (cat.image ? ` · foto ${cat.image}` : '')}</div></div>
                {isSuper && <div className="flex items-center gap-1.5 flex-wrap justify-end"><button onClick={()=>provision(cat)} disabled={busy===cat.id} title="Otomasi: buat Spreadsheet & Folder Drive terpisah, aktifkan" className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/90 hover:bg-violet-500 disabled:opacity-60 text-white px-2.5 py-1.5 text-xs font-semibold">{busy===cat.id?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Zap className="w-3.5 h-3.5"/>}{cat.config?.spreadsheetId?'Otomasi':'Aktifkan'}</button><button onClick={()=>setEditCat(cat)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"><Pencil className="w-4 h-4"/></button><button onClick={()=>setEditSub(emptySub(cat.id))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-1.5 text-xs font-semibold"><Plus className="w-3.5 h-3.5"/>Sub</button></div>}
              </div>
              {isOpen && <div className="border-t border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800/80">
                {children.length===0 && <div className="px-12 py-4 text-sm text-slate-500">Belum ada subkategori.</div>}
                {children.map(sub => {
                  const subImg = resolveKategoriImage(sub.image);
                  const SubIcon = resolveCategoryIcon(sub.icon);
                  return (
                  <div key={sub.id} className="px-6 sm:px-12 py-3 flex items-center gap-3">
                    {SubIcon ? (
                      <span className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 items-center justify-center shrink-0 text-blue-600 dark:text-blue-400 flex" title={`Ikon ${sub.name}`}><SubIcon className="w-5 h-5" aria-hidden="true" /></span>
                    ) : subImg ? (
                      <img src={subImg} alt={`Foto ${sub.name}`} className="w-11 h-11 rounded-xl object-cover border-2 border-blue-200 dark:border-blue-500/30 bg-slate-100 dark:bg-slate-800 shrink-0 shadow-sm" onError={(e)=>{ e.currentTarget.style.display='none'; (e.currentTarget.nextElementSibling as HTMLElement|null)?.style.removeProperty('display'); }} />
                    ) : null}
                    {!SubIcon && <span className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 border border-dashed border-slate-300 dark:border-slate-700 items-center justify-center shrink-0 text-slate-400" style={{ display: subImg ? 'none' : 'flex' }} title="Belum ada ikon atau foto subkategori" aria-hidden="true"><ImageIcon className="w-4 h-4"/></span>}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm flex items-center gap-2">
                        {sub.name} {!sub.active && <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300">nonaktif</span>}
                        {sub.image && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">foto {sub.image}</span>}
                      </div>
                      <div className="text-xs text-slate-500">slug: {sub.slug} · sheet: {sub.config?.reportSheet||'-'} · drive: {sub.config?.driveFolder||'-'} · {sub.format?.fields?.length||0} field parser</div>
                    </div>
                    {isSuper && <button onClick={()=>setEditSub(sub)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400" title="Edit subkategori"><Pencil className="w-4 h-4"/></button>}
                  </div>
                ); })}
              </div>}
            </div>
          );
        })}
        {!cats.length && <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 p-8 text-center text-slate-500">Belum ada kategori. {isSuper && 'Buat kategori baru atau jalankan bootstrap default (DAMKAR/TIBUM) via API /api/admin/bootstrap-defaults.'}</div>}
      </div>

      <Modal open={!!editSub && isSuper} onClose={()=>setEditSub(null)} title={editSub?.id?'Edit Subkategori':'Subkategori Baru'} size="xl"
        footer={<><button onClick={()=>setEditSub(null)} className="rounded-xl border border-slate-300 dark:border-slate-600 px-4 py-2 text-sm font-semibold">Batal</button><button onClick={saveSub} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 text-sm font-semibold"><Save className="w-4 h-4"/>Simpan</button></>}>
        {editSub && <div className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Inp label="Nama" value={editSub.name||''} onChange={v=>setEditSub({...editSub,name:v})} />
            <Inp label="Slug" value={editSub.slug||''} onChange={v=>setEditSub({...editSub,slug:v})} />
            <div className="sm:col-span-2"><Inp label="Deskripsi" value={editSub.description||''} onChange={v=>setEditSub({...editSub,description:v})} /></div>
            <Inp label="Urutan" type="number" value={String(editSub.order??0)} onChange={v=>setEditSub({...editSub,order:Number(v)})} />
            <Inp label="Folder Drive" value={editSub.config?.driveFolder||''} onChange={v=>setEditSub({...editSub,config:{...(editSub.config||{}),driveFolder:v}})} />
            <Inp label="Sheet Laporan" value={editSub.config?.reportSheet||''} onChange={v=>setEditSub({...editSub,config:{...(editSub.config||{}),reportSheet:v}})} />
            <Inp label="Sheet Foto" value={editSub.config?.photoSheet||''} onChange={v=>setEditSub({...editSub,config:{...(editSub.config||{}),photoSheet:v}})} />
            <div className="sm:col-span-2"><Inp label="Sheet Narasi" value={editSub.config?.narrativeSheet||''} onChange={v=>setEditSub({...editSub,config:{...(editSub.config||{}),narrativeSheet:v}})} /></div>
          </div>
          <IconPicker label="Ikon Subkategori" value={editSub.icon||''} onChange={v=>setEditSub({...editSub,icon:v})} />
          <div className="space-y-3">
            <ImagePicker label="Foto Subkategori (1–10)" value={editSub.image||''} onChange={v=>setEditSub({...editSub,image:v})} />
            {editSub.image ? (
              <div className="flex items-center gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 px-3 py-2">
                <img src={resolveKategoriImage(editSub.image) || ''} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900" onError={(e)=>{ e.currentTarget.style.opacity='0.3'; }} />
                <div className="min-w-0"><div className="text-sm font-medium">Foto terpilih: {editSub.image}</div><div className="text-xs text-slate-500">Foto ini ditampilkan sebagai ikon subkategori.</div></div>
              </div>
            ) : (
              <div className="text-xs text-slate-500">Belum ada foto dipilih.</div>
            )}
          </div>
          <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={editSub.active!==false} onChange={e=>setEditSub({...editSub,active:e.target.checked})}/> Aktif</label>
        </div>}
      </Modal>
    </div>
  );
}

function Inp({ label, value, onChange, placeholder, type='text' }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string }) {
  return <label className="block"><span className="text-xs font-semibold text-slate-500 uppercase">{label}</span><input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="mt-1 w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none" /></label>;
}
