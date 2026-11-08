import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

function daysInMonth(y:number,m:number){ return new Date(y,m+1,0).getDate(); }
const MONTHS = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];
function fmt(d:Date){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function parse(v?:string){ if(!v) return null; const d=new Date(v+'T00:00:00'); return Number.isNaN(d.getTime())?null:d; }

export function DatePicker({ value, onChange, placeholder='Pilih tanggal', className }: { value?:string; onChange:(v:string)=>void; placeholder?:string; className?:string }) {
  const [open,setOpen]=useState(false);
  const sel = parse(value); const base = sel || new Date();
  const [y,setY]=useState(base.getFullYear()); const [m,setM]=useState(base.getMonth());
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{ if(!open) return; const h=(e:MouseEvent)=>{ if(!ref.current?.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h); },[open]);
  useEffect(()=>{ if(sel){ setY(sel.getFullYear()); setM(sel.getMonth()); } }, [value]); // eslint-disable-line
  const first = new Date(y,m,1).getDay(); const dim = daysInMonth(y,m);
  const cells: Array<number|null> = []; for(let i=0;i<first;i++) cells.push(null); for(let d=1;d<=dim;d++) cells.push(d);
  const pick=(d:number)=>{ onChange(fmt(new Date(y,m,d))); setOpen(false); };
  return (
    <div ref={ref} className={cn('relative', className)}>
      <button type="button" onClick={()=>setOpen(o=>!o)} className={cn('w-full flex items-center justify-between gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0F172A] px-3 py-2.5 text-sm', open && 'border-blue-500')}>
        <span className={cn(!value && 'text-slate-500')}>{value || placeholder}</span><Calendar className="w-4 h-4 text-slate-400"/>
      </button>
      {open && <div className="absolute z-[11000] mt-1 w-[280px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-xl p-3">
        <div className="flex items-center justify-between mb-2"><button type="button" onClick={()=>{ if(m===0){setM(11);setY(y-1);} else setM(m-1);}} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronLeft className="w-4 h-4"/></button><div className="text-sm font-semibold">{MONTHS[m]} {y}</div><button type="button" onClick={()=>{ if(m===11){setM(0);setY(y+1);} else setM(m+1);}} className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"><ChevronRight className="w-4 h-4"/></button></div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] text-slate-500 mb-1">{['Mg','Sn','Sl','Rb','Km','Jm','Sb'].map(d=><div key={d}>{d}</div>)}</div>
        <div className="grid grid-cols-7 gap-1">{cells.map((d,i)=> d? <button key={i} type="button" onClick={()=>pick(d)} className={cn('h-8 rounded-lg text-sm hover:bg-slate-100 dark:hover:bg-slate-700', value===fmt(new Date(y,m,d)) && 'bg-blue-600 text-white hover:bg-blue-500')}>{d}</button> : <div key={i}/>)}</div>
        <div className="mt-2 flex justify-between"><button type="button" onClick={()=>{onChange(''); setOpen(false);}} className="text-xs text-slate-500 hover:text-slate-300">Hapus</button><button type="button" onClick={()=>{onChange(fmt(new Date())); setOpen(false);}} className="text-xs text-blue-400">Hari ini</button></div>
      </div>}
    </div>
  );
}

export function DateRangePicker({ start, end, onChange }: { start?:string; end?:string; onChange:(r:{start:string;end:string})=>void }) {
  return <div className="flex flex-wrap items-center gap-2"><DatePicker value={start} placeholder="Dari" onChange={v=>onChange({start:v,end:end||''})} className="w-full sm:w-auto sm:min-w-[150px]"/><span className="text-slate-500 text-sm hidden sm:inline">–</span><DatePicker value={end} placeholder="Sampai" onChange={v=>onChange({start:start||'',end:v})} className="w-full sm:w-auto sm:min-w-[150px]"/></div>;
}
