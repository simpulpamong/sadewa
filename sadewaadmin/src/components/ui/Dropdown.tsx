import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Option { value: string; label: string; icon?: React.ReactNode }
export function Dropdown({ value, onChange, options, placeholder='Pilih…', className, disabled }: { value:string; onChange:(v:string)=>void; options:Option[]; placeholder?:string; className?:string; disabled?:boolean }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(!open) return; const onDoc=(e:MouseEvent)=>{ if(!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', onDoc); return ()=>document.removeEventListener('mousedown', onDoc); }, [open]);
  const sel = options.find(o=>o.value===value);
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button type="button" disabled={disabled} onClick={()=>setOpen(o=>!o)} className={cn('w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-3 py-2.5 text-sm text-left disabled:opacity-50', open && 'border-blue-500 ring-1 ring-blue-500/30')}>
        <span className={cn('inline-flex items-center gap-2 min-w-0 truncate', !sel && 'text-slate-500')}>{sel?.icon}<span className="truncate">{sel?.label || placeholder}</span></span>
        <ChevronDown className={cn('w-4 h-4 text-slate-400 transition-transform shrink-0', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-[11000] mt-1 w-full max-h-60 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl py-1 custom-scrollbar">
          {options.map(o => (
            <button key={o.value} type="button" onClick={()=>{ onChange(o.value); setOpen(false); }} className={cn('w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left hover:bg-slate-50 dark:hover:bg-slate-700', o.value===value && 'text-blue-400 bg-blue-500/5')}>
              <span className="inline-flex items-center gap-2 min-w-0 truncate">{o.icon}<span className="truncate">{o.label}</span></span>{o.value===value && <Check className="w-4 h-4 shrink-0" />}
            </button>
          ))}
          {!options.length && <div className="px-3 py-2 text-sm text-slate-500">Tidak ada opsi.</div>}
        </div>
      )}
    </div>
  );
}
