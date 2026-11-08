'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Icon from './Icon';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';
import { resolveKategoriImage } from '@/lib/kategoriImage';
import { CategoryLucideIcon } from '@/lib/categoryIcons';
import { useTheme } from '@/lib/theme';
import { fetchConfigSWR } from '@/lib/configCache';
import { getLastCatId, getLastSubSlug, setLastCatId, setLastSubSlug } from '@/lib/navMemory';

type DynSub = { id: string; categoryId: string; name: string; slug: string; description?: string; image?: string; icon?: string; active?: boolean };
type DynCat = { id: string; name: string; slug: string; description?: string; icon?: string; image?: string; tone?: string; active?: boolean };

/**
 * Menu utama SADEWA.
 * - Awal: tampilkan kategori saja (kartu besar). Klik kategori → daftar subkategori (kartu besar).
 * - Simpan subkategori terakhir ke IndexedDB; buka aplikasi → langsung ke subkategori terakhir.
 * - Klik ikon/logo SADEWA → kembali ke menu kategori.
 */
export default function CategoryLanding() {
  const router = useRouter();
  const { theme, toggleTheme, mounted } = useTheme();
  const [dyn, setDyn] = useState<{ categories: DynCat[]; subcategories: DynSub[] } | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [restoring, setRestoring] = useState(true);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const redirected = useRef(false);
  const lastSig = useRef('');

  // Restore last state / redirect to last subcategory (unless explicit menu)
  useEffect(() => {
    let alive = true;
    const forceMenu = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('menu') === '1';
    (async () => {
      try {
        const [lastSub, lastCat] = await Promise.all([getLastSubSlug(), getLastCatId()]);
        if (!alive) return;
        if (!forceMenu && lastSub && !redirected.current) {
          redirected.current = true;
          router.replace(`/${encodeURIComponent(lastSub)}`);
          return; // keep restoring=true to avoid flash
        }
        if (lastCat) setSelectedCatId(lastCat);
      } catch { /* ignore */ }
      if (alive) setRestoring(false);
    })();
    return () => { alive = false; };
  }, [router]);

  // Load config (near-realtime)
  useEffect(() => {
    let alive = true;
    const apply = (d: any) => {
      if (!alive) return;
      setLoaded(true);
      if (!d?.success || !Array.isArray(d.categories) || !d.categories.length) return;
      const next = { categories: d.categories as DynCat[], subcategories: (d.subcategories || []) as DynSub[] };
      const sig = JSON.stringify(next.categories.map(c => [c.id, c.icon, c.name, c.tone, c.image])) + '|' + JSON.stringify(next.subcategories.map(s => [s.id, s.icon, s.name, s.image, s.slug, s.categoryId, s.active]));
      if (sig !== lastSig.current) { lastSig.current = sig; setDyn(next); }
    };
    const refresh = (force = false) => { if (force || document.visibilityState === 'visible') fetchConfigSWR({ force: true }).then(apply).catch(() => {}); };
    fetchConfigSWR().then(apply).catch(() => { if (alive) setLoaded(true); });
    const onVis = () => refresh(true);
    const onFocus = () => refresh(true);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('focus', onFocus);
    const poll = setInterval(() => refresh(true), 12000);
    return () => { alive = false; clearInterval(poll); document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onFocus); };
  }, []);

  const categories = (dyn?.categories || []).filter(c => c.active !== false);
  const subcategories = (dyn?.subcategories || []).filter(s => s.active !== false);
  const selectedCat = selectedCatId ? categories.find(c => c.id === selectedCatId) || null : null;
  const selectedSubs = selectedCat ? subcategories.filter(s => s.categoryId === selectedCat.id) : [];

  // If persisted cat no longer exists, reset view
  useEffect(() => {
    if (!dyn || !selectedCatId) return;
    if (!categories.some(c => c.id === selectedCatId)) setSelectedCatId(null);
  }, [dyn, selectedCatId, categories]);

  const openCategory = (cat: DynCat) => {
    setSelectedCatId(cat.id);
    void setLastCatId(cat.id);
  };

  const backToCategories = () => {
    setSelectedCatId(null);
  };

  return (
    <main className="landing" aria-busy={restoring || !loaded}>
      <div className="landing-header">
        <div className="landing-header-actions">
          <button
            type="button"
            className="icon-btn theme-toggle-btn"
            onClick={toggleTheme}
            title={mounted && theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
            aria-label={mounted && theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
          >
            <Icon name={mounted && theme === 'light' ? 'moon' : 'sun'} />
          </button>
        </div>
      </div>

      <div className="landing-hero">
        <div className="landing-brand">
          <button type="button" onClick={backToCategories} title={selectedCat ? 'Kembali ke menu kategori' : APP_NAME} aria-label={selectedCat ? 'Kembali ke menu kategori' : APP_NAME} className="landing-logo-button" style={{ cursor: selectedCat ? 'pointer' : 'default' }}>
            <Image src="/assets/sadewa-white.svg" alt="Logo SADEWA" width={44} height={44} priority style={{ objectFit: 'contain', width: 44, height: 'auto' }} />
          </button>
          <div className="landing-brand-text">
            <div className="landing-brand-line">
              <h1 className="landing-title">{APP_NAME}</h1>
              <span className="landing-badge">
                <Icon name="smartphone" /> Mobile
              </span>
            </div>
            <p className="landing-subtitle">{APP_TAGLINE.toUpperCase()}</p>
          </div>
        </div>
        <div className="landing-program">
          <h2 className="landing-heading">PELAPORAN SATPOL PP PONOROGO</h2>
          <p className="landing-region">Kabupaten Ponorogo</p>
        </div>
      </div>

      {/* View: daftar subkategori (drill-down dari kategori terpilih) */}
      {selectedCat && !restoring ? (
        <section aria-label={`Subkategori ${selectedCat.name}`} className="landing-subcategories">
          <div className="landing-drilldown-heading">
            <button type="button" onClick={backToCategories} className="back-link landing-category-back">
              <Icon name="arrowLeft" /> Kategori
            </button>
            <h2 className="landing-category-title">
              <span className={`landing-other-icon landing-tone-${selectedCat.tone || 'blue'}`}>
                <CategoryLucideIcon name={selectedCat.icon} width={20} height={20} />
              </span>
              {selectedCat.name}
            </h2>
          </div>

          <ul className="landing-grid">
            {selectedSubs.map(sub => {
              const hasIcon = Boolean(sub.icon);
              const img = resolveKategoriImage(sub.image) || (!hasIcon ? (resolveKategoriImage(selectedCat.image) || '/assets/sadewa.svg') : '');
              return (
                <li key={sub.id}>
                  <Link href={`/${sub.slug}`} className={`landing-card landing-tone-${selectedCat.tone || 'blue'}`} onClick={() => { void setLastSubSlug(sub.slug); }}>
                    <span className="landing-ico">
                      {hasIcon ? (
                        <CategoryLucideIcon name={sub.icon} width={32} height={32} style={{ color: 'var(--accent)' }} />
                      ) : (
                        <img src={img} alt={sub.name} width={256} height={256} loading="lazy" decoding="async" onError={(e) => { const im = e.currentTarget; if (im.dataset.fb) return; im.dataset.fb = '1'; im.src = resolveKategoriImage(selectedCat.image) || '/assets/sadewa.svg'; }} />
                      )}
                    </span>
                    <span className="landing-copy">
                      <strong>{sub.name}</strong>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          {selectedSubs.length === 0 && (
            <div style={{ maxWidth: 820, margin: '0 auto', color: 'var(--mid, #64748b)' }}>Belum ada subkategori aktif.</div>
          )}
        </section>
      ) : (
        /* View: daftar kategori (kartu besar) */
        !restoring && dyn && categories.length > 0 ? (
          <ul className="landing-grid">
            {categories.map(cat => (
              <li key={cat.id}>
                <button type="button" className={`landing-card landing-tone-${cat.tone || 'blue'}`} onClick={() => openCategory(cat)}>
                  <span className="landing-ico">
                    {cat.icon ? (
                      <CategoryLucideIcon name={cat.icon} width={32} height={32} style={{ color: 'var(--accent)' }} />
                    ) : cat.image && /^\d{1,2}$/.test(String(cat.image)) ? (
                      <img src={resolveKategoriImage(cat.image) || '/assets/sadewa.svg'} alt="" width={256} height={256} loading="lazy" decoding="async" onError={(e) => { const im = e.currentTarget; if (im.dataset.fb) return; im.dataset.fb = '1'; im.style.display = 'none'; }} />
                    ) : (
                      <CategoryLucideIcon name={cat.icon} width={32} height={32} style={{ color: 'var(--accent)' }} />
                    )}
                  </span>
                  <span className="landing-copy">
                    <strong>{cat.name}</strong>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        ) : !loaded || restoring ? (
          <ul className="landing-grid landing-skeleton-grid" aria-hidden="true">
            {Array.from({ length: 6 }, (_, index) => (
              <li key={index}>
                <div className="landing-card landing-card-skeleton">
                  <span className="landing-skeleton-icon" />
                  <span className="landing-skeleton-copy"><i /><i /></span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="landing-empty">Kategori belum tersedia. Periksa koneksi lalu muat ulang halaman.</p>
        )
      )}
    </main>
  );
}
