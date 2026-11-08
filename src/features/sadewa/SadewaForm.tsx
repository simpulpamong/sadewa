'use client';

import { useEffect, useState } from 'react';
import Icon from '@/components/Icon';
import { useApp } from '../core/AppContext';
import { fetchConfigSWR } from '@/lib/configCache';
import { FIELD_LABELS, parseReport, REQUIRED_FIELDS } from '@/lib/parser/whatsapp/parser';
import { parseDynamic, type DynamicFormatConfig } from '@/lib/parser/dynamic/parse';

/** Formulir laporan: teks ditempel. Template/format bersumber dari Firestore (seed/bootstrap), tanpa hardcode app. */
export default function SadewaForm({ className = '', template: initialTemplate = '' }: { className?: string; template?: string }) {
  const { reportText, setReportText, scope } = useApp();
  const [copied, setCopied] = useState(false);
  const [format, setFormat] = useState<DynamicFormatConfig | null>(null);
  const [formatReady, setFormatReady] = useState(false);
  const template = initialTemplate.trim();
  const length = reportText.trim().length;

  useEffect(() => {
    let active = true;
    setFormatReady(false);
    void fetchConfigSWR({ force: true }).then(config => {
      const sub = (config.subcategories || []).find(item => item.slug === scope || item.id === scope);
      const next = sub?.format?.fields?.length ? sub.format as DynamicFormatConfig : null;
      if (active) setFormat(next);
    }).catch(() => {
      if (active) setFormat(null);
    }).finally(() => {
      if (active) setFormatReady(true);
    });
    return () => { active = false; };
  }, [scope]);

  const parsedDynamic = format ? parseDynamic(reportText, format) : null;
  const parsedStatic = !format && (scope === 'kebakaran' || scope === 'odnk') ? parseReport(reportText) : null;
  const checklist = format && parsedDynamic
    ? format.fields.map(field => ({
        key: field.key,
        label: field.label || field.key,
        complete: Boolean(parsedDynamic.values[field.key]?.trim()),
        required: Boolean(field.required),
      }))
    : parsedStatic
      ? REQUIRED_FIELDS.map(field => ({
          key: field,
          label: FIELD_LABELS[field],
          complete: !parsedStatic.missing.includes(field),
          required: true,
        }))
      : [];
  const completeCount = checklist.filter(field => field.complete).length;

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

        {formatReady && checklist.length > 0 && (
          <div className="report-checklist" aria-live="polite">
            <div className="report-checklist-head">
              <strong>Kelengkapan laporan</strong>
              <span>{completeCount}/{checklist.length} terisi</span>
            </div>
            <div className="report-checklist-grid">
              {checklist.map(field => (
                <label key={field.key} className={`report-check-item${field.complete ? ' is-complete' : ''}${field.required && !field.complete ? ' is-missing' : ''}`}>
                  <input
                    type="checkbox"
                    checked={field.complete}
                    disabled
                    aria-label={`${field.label}: ${field.complete ? 'terisi' : 'belum terisi'}`}
                  />
                  <span>{field.label}{field.required ? <small>Wajib</small> : null}</span>
                  <span className="report-check-status">{field.complete ? 'Terisi' : 'Kosong'}</span>
                </label>
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
