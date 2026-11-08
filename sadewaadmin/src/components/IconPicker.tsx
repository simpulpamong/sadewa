import React from 'react';
import { Check, XCircle } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CATEGORY_ICON_OPTIONS, resolveCategoryIcon } from '@/lib/categoryIcons';

export function IconPicker({ value, onChange, label = 'Ikon Kategori' }: { value?: string; onChange: (v: string) => void; label?: string }) {
  const selected = value ? String(value) : '';
  return (
    <div className="block">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-slate-500 uppercase">{label}</span>
        {selected && <button type="button" onClick={() => onChange('')} className="text-[11px] text-slate-400 hover:text-rose-400 inline-flex items-center gap-1"><XCircle className="w-3 h-3"/>Tanpa ikon</button>}
      </div>
      <div className="mt-2 grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2">
        {CATEGORY_ICON_OPTIONS.map(name => {
          const Icon = resolveCategoryIcon(name);
          const on = selected === name;
          if (!Icon) return null;
          return (
            <button key={name} type="button" onClick={() => onChange(name)} title={name}
              className={cn('relative aspect-square rounded-xl border flex items-center justify-center bg-slate-50 dark:bg-slate-800/60 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/30', on ? 'border-blue-500 ring-2 ring-blue-500/25 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-100')}>
              <Icon className="w-5 h-5" aria-hidden="true" />
              {on && <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center"><Check className="w-2.5 h-2.5"/></span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
