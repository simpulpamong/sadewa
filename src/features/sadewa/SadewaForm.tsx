'use client';

import { useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '../core/AppContext';

/** Formulir laporan: teks ditempel. Template/format bersumber dari Firestore (seed/bootstrap), tanpa hardcode app. */
export default function SadewaForm({ className = '', template: initialTemplate = '' }: { className?: string; template?: string }) {
  const { reportText, setReportText } = useApp();
  const [copied, setCopied] = useState(false);
  const template = initialTemplate.trim();
  const length = reportText.trim().length;

  const loadTemplate = () => { if (template) setReportText(template); };
  const copyTemplate = async () => {
    if (!template) return;
    try { await navigator.clipboard.writeText(template); setCopied(true); setTimeout(() => setCopied(false), 1800); }
    catch { /* clipboard tidak tersedia — abaikan */ }
  };

  return (
    <section className={className ? `card ${className}` : 'card'}>
      <div className="card-head">
        <span className="card-ico tone-blue">
          <Icon name="file" />
        </span>
        <h3>Teks Laporan</h3>
        <span className="badge">Wajib</span>
      </div>

      <div className="card-body">
        <textarea
          className="paste-field"
          value={reportText}
          onChange={event => setReportText(event.target.value)}
          placeholder="Tempel teks laporan (format sesuai kategori/subkategori)."
          rows={7}
          spellCheck={false}
          aria-label="Teks laporan"
        />
        <div className="paste-meta">
          <span>{length.toLocaleString('id-ID')} karakter</span>
          {template ? (
            <>
              <button type="button" className="link-btn" onClick={loadTemplate} title="Muat template laporan ke kolom">
                Salin template
              </button>
              <button type="button" className="link-btn" onClick={copyTemplate} title="Salin teks template ke clipboard">
                {copied ? 'Tersalin' : 'Salin teks'}
              </button>
            </>
          ) : (
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>Template belum tersedia</span>
          )}
          {reportText && (
            <button type="button" className="link-btn" onClick={() => setReportText('')}>
              <Icon name="x" /> Bersihkan
            </button>
          )}
        </div>

      </div>
    </section>
  );
}
