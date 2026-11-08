'use client';

import Image from 'next/image';
import Link from 'next/link';
import Icon from './Icon';
import { useApp, useSettingsVisibility } from '@/features/core/AppContext';
import { APP_NAME, APP_TAGLINE } from '@/lib/constants';

/**
 * Header aplikasi — seragam untuk semua kategori.
 * Klik ikon/logo SADEWA → kembali ke menu kategori.
 */
export default function BrandHeader() {
  const { category, settings, toggleTheme, online } = useApp();
  const { setShowSettings } = useSettingsVisibility();
  const categoryLabel = category.slug === 'odnk' ? 'ODNK' : category.name;

  return (
    <header className="header">
      <div className="hdr-bar">
        <div className="hdr-start">

          {!online && (
            <span className="net-badge" role="status">
              <Icon name="wifiOff" /> Offline
            </span>
          )}
        </div>
        <div className="hdr-actions">
          <button
            type="button"
            className="icon-btn"
            onClick={toggleTheme}
            title={settings.theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
            aria-label={settings.theme === 'dark' ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
          >
            <Icon name={settings.theme === 'dark' ? 'sun' : 'moon'} />
          </button>
          <button
            type="button"
            className="icon-btn"
            onClick={() => setShowSettings(true)}
            title="Pengaturan"
            aria-label="Buka pengaturan"
          >
            <Icon name="settings" />
          </button>
        </div>
      </div>

      <div className="logos-row">
        <Link href="/?menu=1" className="logo-wrap" title="Kembali ke menu kategori" aria-label="Kembali ke menu kategori" style={{ background: 'linear-gradient(135deg,#1e3a8a,#172554)', borderRadius: 16, padding: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px rgba(30,58,138,.28)' }}>
          <Image
            src="/assets/sadewa-white.svg"
            alt="Logo SADEWA"
            width={44}
            height={44}
            priority
            style={{ objectFit: 'contain', width: 44, height: 'auto' }}
          />
        </Link>
        <div className="brand-wrap">
          <div className="brand-line">
            <span className="brand-title">{APP_NAME}</span>
            <span className="brand-badge">
              <Icon name="smartphone" /> {categoryLabel}
            </span>
          </div>
          <p className="brand-sub">{APP_TAGLINE.toUpperCase()}</p>
        </div>
      </div>

      <div className="hdr-div" />
    </header>
  );
}
