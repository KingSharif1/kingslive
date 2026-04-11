'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Rnd } from 'react-rnd';
import { cn } from '@/lib/utils';
import {
  ArrowLeft, Plus, ZoomIn, ZoomOut, ChevronRight,
  Lock, Unlock, Trash2, Copy, Image, Quote, Type,
  Smile, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  ChevronsUp, ChevronsDown, Undo2, Redo2, Upload,
  ArrowUpToLine, ArrowDownToLine, Download, RotateCw, MoreHorizontal
} from 'lucide-react';
import html2canvas from 'html2canvas';

// ── Types ─────────────────────────────────────────────────────────────────────
type BoardType  = 'year' | 'quarter' | 'month' | 'custom';
type ItemType   = 'image' | 'quote' | 'text' | 'sticker';
type TextAlign  = 'left' | 'center' | 'right';

interface DreamBoard {
  id: string; title: string; type: BoardType; period?: string;
  cover_url?: string; bg_color: string; is_infinite: boolean;
  canvas_width: number; canvas_height: number; created_at: string;
}

interface DreamItem {
  id: string; board_id: string; type: ItemType;
  x: number; y: number; width: number; height: number;
  rotation: number; z_index: number;
  content?: string; image_url?: string; author?: string; title?: string;
  color?: string; bg_color?: string; font_size: number;
  font_family: string; font_weight: string; text_align: TextAlign;
  letter_spacing: number; is_uppercase: boolean;
  opacity: number; border_radius: number; is_locked: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const FONTS = [
  { name: 'Inter',               label: 'Inter'          },
  { name: 'Playfair Display',    label: 'Playfair'       },
  { name: 'Bebas Neue',          label: 'Bebas Neue'     },
  { name: 'Dancing Script',      label: 'Dancing Script' },
  { name: 'Cormorant Garamond',  label: 'Cormorant'      },
  { name: 'Oswald',              label: 'Oswald'         },
  { name: 'Montserrat',          label: 'Montserrat'     },
  { name: 'DM Sans',             label: 'DM Sans'        },
];

const BOARD_THEMES = [
  { label: 'Pure Black',  bg: '#0a0a0a',   preview: '#0a0a0a' },
  { label: 'Slate',       bg: '#111827',   preview: '#111827' },
  { label: 'Cosmic',      bg: 'linear-gradient(135deg, #0a0a1e 0%, #1a0838 50%, #0a1a2e 100%)', preview: '#110828' },
  { label: 'Aurora',      bg: 'linear-gradient(135deg, #0a1628 0%, #0d2d1a 45%, #1a0d2e 100%)', preview: '#0e1f23' },
  { label: 'Midnight',    bg: 'linear-gradient(180deg, #0d1117 0%, #080820 100%)',               preview: '#0d1117' },
  { label: 'Ember',       bg: 'linear-gradient(135deg, #1c0800 0%, #2e0f00 50%, #0a0303 100%)', preview: '#1c0800' },
  { label: 'Ocean',       bg: 'linear-gradient(160deg, #020c1b 0%, #0a2a4a 50%, #020c1b 100%)', preview: '#0a2a4a' },
  { label: 'Forest',      bg: 'linear-gradient(135deg, #050f05 0%, #0d2a12 100%)',               preview: '#0d1a0d' },
  { label: 'Warm Paper',  bg: '#f0e8dc',   preview: '#f0e8dc' },
  { label: 'Cream',       bg: 'linear-gradient(135deg, #faf7f2 0%, #ede8e0 100%)',               preview: '#f5f2ec' },
  { label: 'Sand',        bg: 'linear-gradient(135deg, #e8d9c0 0%, #cfc0a8 100%)',               preview: '#d9c9b4' },
  { label: 'Blueprint',   bg: 'linear-gradient(180deg, #0a1a3a 0%, #0d2460 100%)',               preview: '#0a1a3a' },
];

const ACCENT_COLORS = ['#ffffff','#d4af37','#f59e0b','#10b981','#3b82f6','#8b5cf6','#ef4444','#ec4899','#06b6d4','#f97316','#c084fc','#fb7185'];

const STICKERS = [
  '🔥','💎','⚡','🌟','👑','🎯','💪','🚀','✨','💰',
  '🌴','🧠','❤️','🏆','🌊','🎨','📚','🌙','☀️','🦁',
  '🎵','🍀','🦋','🌈','💫','🎉','🏠','✈️','🎓','💻',
  '🏋️','🧘','🎸','🌍','🐉','🦅','💡','🛸','🏄','🌺',
  '🍾','🥂','💝','🌿','🕊️','⭐','🏔️','🎆','🦊','🐺',
];

const BOARD_TYPE_OPTIONS = [
  { type: 'year'    as BoardType, icon: '📅', label: 'Year',    desc: 'Full year vision',   periods: ['2025','2026','2027','2028'] },
  { type: 'quarter' as BoardType, icon: '📊', label: 'Quarter', desc: '3-month focus',      periods: ['Q1 2026','Q2 2026','Q3 2026','Q4 2026'] },
  { type: 'month'   as BoardType, icon: '🗓️', label: 'Month',   desc: 'Monthly intentions', periods: ['Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026','Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026','Nov 2026','Dec 2026'] },
  { type: 'custom'  as BoardType, icon: '✏️', label: 'Custom',  desc: 'Your own timeframe', periods: [] },
];

const ITEM_DEFAULTS: Record<ItemType, Partial<DreamItem>> = {
  image:   { width: 300, height: 220, border_radius: 12 },
  quote:   { width: 300, height: 180, font_family: 'Playfair Display', font_size: 18, text_align: 'center' as TextAlign, color: '#ffffff' },
  text:    { width: 260, height: 140, font_family: 'Inter',            font_size: 16, text_align: 'left'   as TextAlign, color: '#ffffff' },
  sticker: { width: 120, height: 120 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const sb = () => supabase;

/** Ensure every item has a unique z_index 0,1,2,3… with no gaps */
function normalizeZIndices(list: DreamItem[]): DreamItem[] {
  const sorted = [...list].sort((a, b) => a.z_index - b.z_index);
  const idxMap: Record<string, number> = {};
  sorted.forEach((item, i) => { idxMap[item.id] = i; });
  return list.map(item => ({ ...item, z_index: idxMap[item.id] }));
}

async function uploadToStorage(file: File, folder = 'dreamboard'): Promise<string | null> {
  const ext  = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb().storage.from('images').upload(path, file, { upsert: false });
  if (error) { console.error('Upload error:', error); return null; }
  const { data: { publicUrl } } = sb().storage.from('images').getPublicUrl(path);
  return publicUrl;
}

function loadGoogleFonts() {
  if (document.getElementById('dreamboard-fonts')) return;
  const link = document.createElement('link');
  link.id  = 'dreamboard-fonts';
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Bebas+Neue&family=Dancing+Script:wght@400;700&family=Cormorant+Garamond:ital,wght@0,300;0,600;1,300&family=Oswald:wght@400;600&family=Montserrat:wght@400;600;700&family=DM+Sans:wght@400;500;600&display=swap';
  document.head.appendChild(link);
}

// ── Edit Board Modal ───────────────────────────────────────────────────────────
function EditBoardModal({ board, onClose, onSaved }: { board: DreamBoard; onClose: () => void; onSaved: (b: DreamBoard) => void }) {
  const [title,   setTitle]   = useState(board.title);
  const [period,  setPeriod]  = useState(board.period || '');
  const [bgColor, setBgColor] = useState(board.bg_color);
  const [saving,  setSaving]  = useState(false);
  const selected = BOARD_TYPE_OPTIONS.find(o => o.type === board.type);

  async function save() {
    setSaving(true);
    const { data } = await sb().from('dreamboard_boards')
      .update({ title: title.trim() || board.title, period: period.trim() || null, bg_color: bgColor })
      .eq('id', board.id).select().single();
    setSaving(false);
    if (data) onSaved(data as DreamBoard);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-display font-semibold text-white text-sm">Edit Board</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium text-white/50 mb-1.5 block">Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder={board.title}
              className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30" />
          </div>
          {selected && selected.periods.length > 0 ? (
            <div>
              <label className="text-xs font-medium text-white/50 mb-2 block">Period</label>
              <div className="flex flex-wrap gap-1.5">
                {selected.periods.map(p => (
                  <button key={p} onClick={() => setPeriod(p)}
                    className={cn('px-2.5 py-1 rounded-lg text-xs border transition-all', period === p ? 'bg-white text-black border-white' : 'border-white/20 text-white/60 hover:border-white/40')}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-white/50 mb-1.5 block">Timeframe</label>
              <input value={period} onChange={e => setPeriod(e.target.value)} placeholder="e.g. Summer 2026"
                className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-white/30" />
            </div>
          )}
          <div>
            <label className="text-xs font-medium text-white/50 mb-2 block">Theme</label>
            <div className="grid grid-cols-4 gap-1.5">
              {BOARD_THEMES.map(t => (
                <button key={t.label} onClick={() => setBgColor(t.bg)} title={t.label}
                  className={cn('h-9 rounded-xl border-2 transition-all hover:scale-105 text-[9px] font-medium flex items-end pb-1 px-1.5', bgColor === t.bg ? 'border-white' : 'border-white/10 hover:border-white/30')}
                  style={{ background: t.bg }}>
                  <span className={cn(t.preview.startsWith('#f') || t.preview.startsWith('#e') || t.preview.startsWith('#d') ? 'text-black/60' : 'text-white/60')}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          {/* Preview strip */}
          <div className="h-10 rounded-xl overflow-hidden border border-white/10 flex items-center justify-center" style={{ background: bgColor }}>
            <span className="text-white/50 text-xs font-medium">{title.trim() || board.title}</span>
          </div>
          <div className="flex gap-2 pt-1">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">Cancel</button>
            <button onClick={save} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Board Card ────────────────────────────────────────────────────────────────
function BoardCard({ board, itemCount, previewImages, onClick, onDelete, onEdit }: {
  board: DreamBoard; itemCount: number; previewImages: string[];
  onClick: () => void; onDelete: () => void; onEdit: () => void;
}) {
  const typeOpt = BOARD_TYPE_OPTIONS.find(o => o.type === board.type);

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (window.confirm(`Delete "${board.title}"? This cannot be undone.`)) onDelete();
  }
  function handleEdit(e: React.MouseEvent) { e.stopPropagation(); onEdit(); }

  return (
    <div onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onClick(); }}
      className="group relative rounded-2xl overflow-hidden border border-white/10 text-left transition-all duration-300 hover:scale-[1.02] hover:border-white/25 hover:shadow-2xl cursor-pointer"
      style={{ aspectRatio: '16/9', background: board.bg_color }}>

      {/* Image collage preview */}
      {previewImages.length > 0 ? (
        <div className="absolute inset-0">
          {previewImages.slice(0, 3).map((url, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={url} alt="" className="absolute object-cover rounded-lg shadow-xl border border-white/10"
              style={{
                width:  i === 0 ? '55%' : '40%',
                height: i === 0 ? '70%' : '55%',
                top:    i === 0 ? '15%' : i === 1 ? '8%' : '38%',
                left:   i === 0 ? '5%'  : i === 1 ? '54%' : '57%',
                transform: `rotate(${i === 0 ? -3 : i === 1 ? 4 : -2}deg)`,
                zIndex: i,
                opacity: 0.85,
              }} />
          ))}
        </div>
      ) : (
        <div className="absolute inset-0 opacity-[0.05]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
      )}

      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

      <div className="absolute bottom-0 inset-x-0 p-4">
        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/15 text-white/70 mb-1.5 inline-block">
          {typeOpt?.icon} {board.period || board.type}
        </span>
        <p className="font-bold text-white text-sm leading-tight">{board.title}</p>
        <p className="text-white/40 text-[11px] mt-0.5">
          {itemCount} item{itemCount !== 1 ? 's' : ''} · {new Date(board.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </p>
      </div>

      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={handleEdit} className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 flex items-center justify-center transition-colors backdrop-blur-sm" title="Edit board">
          <MoreHorizontal className="w-4 h-4 text-white" />
        </button>
        <button onClick={handleDelete} className="w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center transition-colors backdrop-blur-sm" title="Delete board">
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
        </button>
      </div>
    </div>
  );
}

// ── New Board Modal ───────────────────────────────────────────────────────────
function NewBoardModal({ onClose, onCreated }: { onClose: () => void; onCreated: (b: DreamBoard) => void }) {
  const [step,       setStep]       = useState<'type'|'details'>('type');
  const [boardType,  setBoardType]  = useState<BoardType>('year');
  const [period,     setPeriod]     = useState('2026');
  const [boardTitle, setBoardTitle] = useState('');
  const [customName, setCustomName] = useState('');
  const [coverUrl,   setCoverUrl]   = useState('');
  const [bgColor,    setBgColor]    = useState('#0a0a0a');
  const [isSaving,   setIsSaving]   = useState(false);

  const selected     = BOARD_TYPE_OPTIONS.find(o => o.type === boardType)!;
  const defaultTitle = boardType === 'custom' ? customName : `${period || selected.periods[0]} Vision`;
  const finalTitle   = boardTitle.trim() || defaultTitle;

  async function create() {
    if (!finalTitle.trim()) return;
    setIsSaving(true);
    const { data: { user } } = await sb().auth.getUser();
    if (!user) { setIsSaving(false); return; }
    const { data } = await sb().from('dreamboard_boards').insert([{
      user_id: user.id, title: finalTitle, type: boardType,
      period: boardType !== 'custom' ? (period || selected.periods[0]) : customName,
      cover_url: coverUrl || null, bg_color: bgColor,
    }]).select().single();
    setIsSaving(false);
    if (data) onCreated(data as DreamBoard);
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <h3 className="font-display font-semibold text-white">Create Dreamboard</h3>
          <button onClick={onClose} className="w-7 h-7 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-5">
          {step === 'type' && (
            <>
              <p className="text-xs text-white/50 font-medium">What kind of board?</p>
              <div className="grid grid-cols-2 gap-3">
                {BOARD_TYPE_OPTIONS.map(opt => (
                  <button key={opt.type}
                    onClick={() => { setBoardType(opt.type); if (opt.periods[0]) setPeriod(opt.periods[0]); }}
                    className={cn('flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left',
                      boardType === opt.type ? 'border-white/30 bg-white/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5')}>
                    <span className="text-2xl">{opt.icon}</span>
                    <div><p className="font-semibold text-white text-sm">{opt.label}</p><p className="text-white/40 text-xs mt-0.5">{opt.desc}</p></div>
                  </button>
                ))}
              </div>
              <button onClick={() => setStep('details')}
                className="w-full py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
                Continue
              </button>
            </>
          )}
          {step === 'details' && (
            <>
              {boardType !== 'custom' ? (
                <div>
                  <label className="text-xs font-medium text-white/50 mb-2 block">Period</label>
                  <div className="flex flex-wrap gap-2">
                    {selected.periods.map(p => (
                      <button key={p} onClick={() => setPeriod(p)}
                        className={cn('px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                          period === p ? 'bg-white text-black border-white' : 'border-white/20 text-white/60 hover:border-white/40')}>
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Timeframe</label>
                  <input value={customName} onChange={e => setCustomName(e.target.value)}
                    placeholder="e.g. Summer Goals, NYC Move..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30" />
                </div>
              )}
              {boardType !== 'custom' && (
                <div>
                  <label className="text-xs font-medium text-white/50 mb-1.5 block">Custom title <span className="text-white/30">(optional, defaults to "{defaultTitle}")</span></label>
                  <input value={boardTitle} onChange={e => setBoardTitle(e.target.value)} placeholder={defaultTitle}
                    className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30" />
                </div>
              )}
              <div>
                <label className="text-xs font-medium text-white/50 mb-2 block">Theme</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BOARD_THEMES.map(t => (
                    <button key={t.label} onClick={() => setBgColor(t.bg)} title={t.label}
                      className={cn('h-9 rounded-xl border-2 transition-all hover:scale-105 text-[9px] font-medium flex items-end pb-1 px-1.5', bgColor === t.bg ? 'border-white' : 'border-white/10 hover:border-white/30')}
                      style={{ background: t.bg }}>
                      <span className={cn(t.preview.startsWith('#f') || t.preview.startsWith('#e') || t.preview.startsWith('#d') ? 'text-black/60' : 'text-white/60')}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Cover image URL <span className="text-white/30">(optional)</span></label>
                <input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="https://..."
                  className="w-full px-3 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-white/30" />
              </div>
              <div className="rounded-xl overflow-hidden border border-white/10 h-16 flex items-center justify-center relative" style={{ background: bgColor }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {coverUrl && <img src={coverUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" onError={() => setCoverUrl('')} />}
                <p className="font-bold text-white/50 text-xs relative z-10">{finalTitle}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setStep('type')}
                  className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/60 text-sm hover:bg-white/5 transition-colors">Back</button>
                <button onClick={create}
                  disabled={isSaving || (!period && boardType !== 'custom') || (boardType === 'custom' && !customName.trim())}
                  className="flex-1 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-40">
                  {isSaving ? 'Creating...' : 'Create Board'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Selection Toolbar ─────────────────────────────────────────────────────────
function SelectionToolbar({ item, totalItems, onUpdate, onDelete, onDuplicate, onBringForward, onSendBack, onBringToFront, onSendToBack }: {
  item: DreamItem; totalItems: number;
  onUpdate: (u: Partial<DreamItem>) => void;
  onDelete: () => void; onDuplicate: () => void;
  onBringForward: () => void; onSendBack: () => void;
  onBringToFront: () => void; onSendToBack: () => void;
}) {
  const isText = item.type === 'text' || item.type === 'quote';
  const imgRef = useRef<HTMLInputElement>(null);

  async function handleImageReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadToStorage(file);
    if (url) onUpdate({ image_url: url });
  }

  return (
    <div className="flex items-center gap-1 px-3 py-1.5 bg-[#1a1a1a] border-b border-white/10 overflow-x-auto flex-shrink-0" style={{ scrollbarWidth: 'none' }}>

      {/* ── Text / Quote controls ── */}
      {isText && (
        <>
          <select value={item.font_family || 'Inter'} onChange={e => onUpdate({ font_family: e.target.value })}
            className="h-7 px-2 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none hover:bg-white/10 transition-colors max-w-[110px]"
            style={{ fontFamily: item.font_family }}>
            {FONTS.map(f => <option key={f.name} value={f.name} style={{ fontFamily: f.name, background: '#111' }}>{f.label}</option>)}
          </select>

          <div className="flex items-center bg-white/5 border border-white/10 rounded-lg h-7 px-1.5 gap-1">
            <button onClick={() => onUpdate({ font_size: Math.max(8, (item.font_size || 16) - 2) })} className="text-white/60 hover:text-white text-sm leading-none">−</button>
            <span className="text-white text-xs w-6 text-center tabular-nums">{item.font_size || 16}</span>
            <button onClick={() => onUpdate({ font_size: Math.min(120, (item.font_size || 16) + 2) })} className="text-white/60 hover:text-white text-sm leading-none">+</button>
          </div>

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          <button onClick={() => onUpdate({ font_weight: item.font_weight === '700' ? '400' : '700' })}
            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', item.font_weight === '700' ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}>
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button onClick={() => onUpdate({ font_weight: item.font_weight === 'italic' ? '400' : 'italic' })}
            className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', item.font_weight === 'italic' ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}>
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button onClick={() => onUpdate({ is_uppercase: !item.is_uppercase })}
            className={cn('h-7 px-2 rounded-lg flex items-center justify-center transition-colors text-[10px] font-bold tracking-widest', item.is_uppercase ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}>
            AA
          </button>

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          {(['left','center','right'] as TextAlign[]).map(a => {
            const Icon = a === 'left' ? AlignLeft : a === 'center' ? AlignCenter : AlignRight;
            return (
              <button key={a} onClick={() => onUpdate({ text_align: a })}
                className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', (item.text_align || 'left') === a ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}>
                <Icon className="w-3.5 h-3.5" />
              </button>
            );
          })}

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          {ACCENT_COLORS.slice(0, 8).map(c => (
            <button key={c} onClick={() => onUpdate({ color: c })}
              className={cn('w-5 h-5 rounded-full border-2 transition-all flex-shrink-0', item.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-105')}
              style={{ backgroundColor: c }} />
          ))}

          <div className="w-px h-4 bg-white/15 mx-0.5" />

          {/* Text/quote background */}
          <div className="flex items-center gap-1">
            <span className="text-white/30 text-[10px]">BG</span>
            <button onClick={() => onUpdate({ bg_color: undefined })}
              className={cn('w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center text-[8px] text-white/40', !item.bg_color ? 'border-white' : 'border-white/20 hover:scale-105')}
              style={{ background: 'transparent' }} title="No background">✕</button>
            {['rgba(255,255,255,0.08)','rgba(255,255,255,0.15)','#1a1a2e','#0d1f2d','#1a0a2e','#111827','#1c0a00','#0a1a0a'].map(c => (
              <button key={c} onClick={() => onUpdate({ bg_color: c })}
                className={cn('w-5 h-5 rounded-full border-2 transition-all flex-shrink-0', item.bg_color === c ? 'border-white scale-110' : 'border-white/20 hover:scale-105')}
                style={{ backgroundColor: c }} />
            ))}
          </div>

          <div className="w-px h-4 bg-white/15 mx-0.5" />
        </>
      )}

      {/* ── Image controls ── */}
      {item.type === 'image' && (
        <>
          <button onClick={() => imgRef.current?.click()}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors text-xs">
            <Upload className="w-3 h-3" /> Replace
          </button>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImageReplace} />

          <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 h-7">
            <span className="text-white/40 text-[10px] whitespace-nowrap">Border radius</span>
            <input type="range" min={0} max={100} value={item.border_radius ?? 12}
              onChange={e => onUpdate({ border_radius: parseInt(e.target.value) })}
              className="w-20 h-1 accent-white" />
            <span className="text-white/40 text-[10px] w-4">{item.border_radius ?? 12}</span>
          </div>

          <div className="w-px h-4 bg-white/15 mx-0.5" />
        </>
      )}

      {/* ── Opacity (all) ── */}
      <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-2 h-7">
        <span className="text-white/40 text-[10px]">Opacity</span>
        <input type="range" min={10} max={100} value={Math.round((item.opacity ?? 1) * 100)}
          onChange={e => onUpdate({ opacity: parseInt(e.target.value) / 100 })}
          className="w-16 h-1 accent-white" />
        <span className="text-white/40 text-[10px] w-6 tabular-nums">{Math.round((item.opacity ?? 1) * 100)}%</span>
      </div>

      <div className="w-px h-4 bg-white/15 mx-0.5" />

      {/* ── Layer controls ── */}
      <div className="flex items-center bg-white/5 border border-white/10 rounded-lg h-7 overflow-hidden">
        <button onClick={onSendToBack}   title="Send to Back"    className="px-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors h-full flex items-center border-r border-white/10"><ArrowDownToLine className="w-3 h-3" /></button>
        <button onClick={onSendBack}     title="Send Backward"   className="px-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors h-full flex items-center border-r border-white/10"><ChevronsDown className="w-3 h-3" /></button>
        <span className="text-white/30 text-[9px] px-1.5 tabular-nums whitespace-nowrap">{item.z_index + 1}/{totalItems}</span>
        <button onClick={onBringForward} title="Bring Forward"   className="px-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors h-full flex items-center border-l border-white/10"><ChevronsUp className="w-3 h-3" /></button>
        <button onClick={onBringToFront} title="Bring to Front"  className="px-1.5 text-white/50 hover:bg-white/10 hover:text-white transition-colors h-full flex items-center border-l border-white/10"><ArrowUpToLine className="w-3 h-3" /></button>
      </div>

      <button onClick={() => onUpdate({ is_locked: !item.is_locked })}
        className={cn('w-7 h-7 rounded-lg flex items-center justify-center transition-colors', item.is_locked ? 'bg-white/20 text-white' : 'text-white/50 hover:bg-white/10 hover:text-white')}>
        {item.is_locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
      </button>

      <button onClick={onDuplicate} className="w-7 h-7 rounded-lg text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"><Copy className="w-3.5 h-3.5" /></button>

      <button onClick={onDelete} className="w-7 h-7 rounded-lg text-white/50 hover:bg-red-500/20 hover:text-red-400 flex items-center justify-center transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
}

// ── Context Menu ──────────────────────────────────────────────────────────────
function ContextMenu({ x, y, isLocked, onClose, onDelete, onDuplicate, onBringForward, onSendBack, onBringToFront, onSendToBack, onLock }: {
  x: number; y: number; isLocked: boolean; onClose: () => void;
  onDelete: () => void; onDuplicate: () => void;
  onBringForward: () => void; onSendBack: () => void;
  onBringToFront: () => void; onSendToBack: () => void; onLock: () => void;
}) {
  useEffect(() => {
    const h = () => onClose();
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [onClose]);

  const menuItems = [
    { label: 'Duplicate',      icon: <Copy className="w-3.5 h-3.5" />,           action: onDuplicate,    danger: false },
    { label: 'Bring to Front', icon: <ArrowUpToLine className="w-3.5 h-3.5" />,  action: onBringToFront, danger: false },
    { label: 'Bring Forward',  icon: <ChevronsUp className="w-3.5 h-3.5" />,     action: onBringForward, danger: false },
    { label: 'Send Backward',  icon: <ChevronsDown className="w-3.5 h-3.5" />,   action: onSendBack,     danger: false },
    { label: 'Send to Back',   icon: <ArrowDownToLine className="w-3.5 h-3.5" />, action: onSendToBack,  danger: false },
    { label: isLocked ? 'Unlock' : 'Lock', icon: isLocked ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />, action: onLock, danger: false },
    { label: 'Delete',         icon: <Trash2 className="w-3.5 h-3.5" />,          action: onDelete,       danger: true  },
  ];

  return (
    <div className="fixed z-[100] bg-[#1a1a1a] border border-white/15 rounded-xl shadow-2xl py-1 min-w-[160px]"
      style={{ top: y, left: x }} onClick={e => e.stopPropagation()}>
      {menuItems.map((m, i) => (
        <button key={i} onClick={() => { m.action(); onClose(); }}
          className={cn('w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors',
            m.danger ? 'text-red-400 hover:bg-red-500/10' : 'text-white/70 hover:bg-white/10 hover:text-white')}>
          {m.icon} {m.label}
        </button>
      ))}
    </div>
  );
}

// ── Add Item Panel ────────────────────────────────────────────────────────────
function AddItemPanel({ onAdd, onClose }: {
  onAdd: (type: ItemType, defaults: Partial<DreamItem>) => void;
  onClose: () => void;
}) {
  const [activeType, setActiveType] = useState<ItemType>('image');
  const [imageUrl,   setImageUrl]   = useState('');
  const [content,    setContent]    = useState('');
  const [author,     setAuthor]     = useState('');
  const [title,      setTitle]      = useState('');
  const [color,      setColor]      = useState('#ffffff');
  const [sticker,    setSticker]    = useState('');
  const [stickerUrl, setStickerUrl] = useState('');
  const [uploading,  setUploading]  = useState(false);
  const fileRef    = useRef<HTMLInputElement>(null);
  const stickerRef = useRef<HTMLInputElement>(null);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const url = await uploadToStorage(file);
    if (url) setImageUrl(url);
    setUploading(false);
  }

  async function handleStickerUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const url = await uploadToStorage(file, 'dreamboard/stickers');
    if (url) { setStickerUrl(url); setSticker('__custom__'); }
    setUploading(false);
  }

  function handleAdd() {
    if (activeType === 'image')   onAdd('image',   { image_url: imageUrl, content });
    if (activeType === 'quote')   onAdd('quote',   { content, author, color, font_family: 'Playfair Display', text_align: 'center' as TextAlign });
    if (activeType === 'text')    onAdd('text',    { title, content, color });
    if (activeType === 'sticker') {
      if (sticker === '__custom__' && stickerUrl) onAdd('image', { image_url: stickerUrl, border_radius: 0 });
      else onAdd('sticker', { content: sticker, title });
    }
    onClose();
  }

  const canAdd = activeType === 'image' ? !!imageUrl
    : activeType === 'sticker' ? (!!sticker)
    : !!content;

  const typeBtns: { id: ItemType; icon: React.ReactNode; label: string }[] = [
    { id: 'image',   icon: <Image className="w-4 h-4" />,  label: 'Image'   },
    { id: 'quote',   icon: <Quote className="w-4 h-4" />,  label: 'Quote'   },
    { id: 'text',    icon: <Type className="w-4 h-4" />,   label: 'Text'    },
    { id: 'sticker', icon: <Smile className="w-4 h-4" />,  label: 'Sticker' },
  ];

  return (
    <div className="absolute top-2 right-2 z-40 w-72 bg-[#141414] border border-white/15 rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
      <div className="p-3 border-b border-white/10 flex items-center justify-between">
        <p className="text-xs font-semibold text-white">Add to board</p>
        <button onClick={onClose} className="text-white/40 hover:text-white text-sm transition-colors">✕</button>
      </div>

      <div className="flex border-b border-white/10">
        {typeBtns.map(t => (
          <button key={t.id} onClick={() => setActiveType(t.id)}
            className={cn('flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors',
              activeType === t.id ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/70')}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      <div className="p-3 space-y-2.5 max-h-[420px] overflow-y-auto">
        {/* IMAGE */}
        {activeType === 'image' && (
          <>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="w-full flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/10 border border-white/10 text-white text-xs hover:bg-white/15 transition-colors justify-center">
              <Upload className="w-3 h-3" />{uploading ? 'Uploading...' : 'Upload from device'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
            <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} placeholder="or paste image URL..."
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30" />
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-full rounded-xl object-cover max-h-32" onError={() => setImageUrl('')} />
            )}
            <input value={content} onChange={e => setContent(e.target.value)} placeholder="Caption (optional)"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30" />
          </>
        )}

        {/* QUOTE */}
        {activeType === 'quote' && (
          <>
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Enter a quote that moves you..." rows={3}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30 resize-none" />
            <input value={author} onChange={e => setAuthor(e.target.value)} placeholder="— Author (optional)"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30" />
            <div>
              <p className="text-[10px] text-white/40 mb-1.5">Accent color</p>
              <div className="flex gap-1.5 flex-wrap">
                {ACCENT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={cn('w-5 h-5 rounded-full border-2 transition-all', color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110')} style={{ backgroundColor: c }} />)}
              </div>
            </div>
          </>
        )}

        {/* TEXT */}
        {activeType === 'text' && (
          <>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Title (optional)"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30" />
            <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write something inspiring..." rows={4}
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30 resize-none" />
            <div>
              <p className="text-[10px] text-white/40 mb-1.5">Color</p>
              <div className="flex gap-1.5 flex-wrap">
                {ACCENT_COLORS.map(c => <button key={c} onClick={() => setColor(c)} className={cn('w-5 h-5 rounded-full border-2 transition-all', color === c ? 'border-white scale-125' : 'border-transparent hover:scale-110')} style={{ backgroundColor: c }} />)}
              </div>
            </div>
          </>
        )}

        {/* STICKER */}
        {activeType === 'sticker' && (
          <>
            <button onClick={() => stickerRef.current?.click()} disabled={uploading}
              className="w-full flex items-center gap-1.5 h-8 px-3 rounded-xl bg-white/10 border border-white/10 text-white text-xs hover:bg-white/15 transition-colors justify-center">
              <Upload className="w-3 h-3" />{uploading ? 'Uploading...' : 'Upload custom sticker / PNG'}
            </button>
            <input ref={stickerRef} type="file" accept="image/*" className="hidden" onChange={handleStickerUpload} />
            {sticker === '__custom__' && stickerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={stickerUrl} alt="" className="w-16 h-16 object-contain mx-auto rounded-xl" />
            )}
            <p className="text-[10px] text-white/40 text-center">— or pick an emoji —</p>
            <div className="grid grid-cols-8 gap-1 max-h-44 overflow-y-auto">
              {STICKERS.map(s => (
                <button key={s} onClick={() => { setSticker(s); setStickerUrl(''); }}
                  className={cn('text-xl p-1 rounded-lg hover:bg-white/10 transition-all leading-none', sticker === s ? 'bg-white/20 scale-110' : '')}>
                  {s}
                </button>
              ))}
            </div>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Label (optional)"
              className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-xs placeholder:text-white/25 focus:outline-none focus:border-white/30" />
          </>
        )}

        <button onClick={handleAdd} disabled={!canAdd}
          className="w-full py-2 rounded-xl bg-white text-black text-xs font-semibold hover:bg-white/90 transition-colors disabled:opacity-30">
          Add to Board
        </button>
      </div>
    </div>
  );
}

// ── Canvas Item ───────────────────────────────────────────────────────────────
function CanvasItem({ item, isSelected, isEditing, onSelect, onStartEdit, onStopEdit, onUpdate, onContextMenu }: {
  item: DreamItem; isSelected: boolean; isEditing: boolean;
  onSelect: () => void; onStartEdit: () => void; onStopEdit: () => void;
  onUpdate: (u: Partial<DreamItem>) => void;
  onContextMenu: (x: number, y: number) => void;
}) {
  const editRef    = useRef<HTMLTextAreaElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [liveRot,  setLiveRot]  = useState(item.rotation || 0);
  const rotRef     = useRef(item.rotation || 0);

  useEffect(() => {
    setLiveRot(item.rotation || 0);
    rotRef.current = item.rotation || 0;
  }, [item.rotation]);

  useEffect(() => {
    if (isEditing && editRef.current) { editRef.current.focus(); editRef.current.select(); }
  }, [isEditing]);

  function startRotating(e: React.MouseEvent) {
    e.stopPropagation(); e.preventDefault();
    if (!wrapperRef.current) return;
    const rect = wrapperRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width  / 2;
    const cy = rect.top  + rect.height / 2;

    function onMove(me: MouseEvent) {
      let angle = Math.atan2(me.clientY - cy, me.clientX - cx) * (180 / Math.PI) + 90;
      // Snap to 15° increments when Shift held
      if (me.shiftKey) angle = Math.round(angle / 15) * 15;
      rotRef.current = angle;
      setLiveRot(angle);
    }
    function onUp() {
      onUpdate({ rotation: rotRef.current });
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }

  const ts: React.CSSProperties = {
    fontFamily:    item.font_family   || 'Inter',
    fontSize:      item.font_size     || 16,
    fontWeight:    item.font_weight === 'italic' ? 400 : parseInt(item.font_weight || '400'),
    fontStyle:     item.font_weight   === 'italic' ? 'italic' : 'normal',
    textAlign:     item.text_align    || 'left',
    letterSpacing: item.letter_spacing ? `${item.letter_spacing}px` : undefined,
    textTransform: item.is_uppercase  ? 'uppercase' : 'none',
    color:         item.color         || '#ffffff',
    lineHeight:    1.5,
  };

  function renderContent() {
    if (item.type === 'image') return (
      <div className="w-full h-full relative" style={{ borderRadius: item.border_radius ?? 12, overflow: 'hidden' }}>
        {item.image_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.image_url} alt="" className="w-full h-full object-cover" draggable={false} style={{ filter: 'contrast(1.02) saturate(1.05)' }} />
          : <div className="w-full h-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center text-white/20 text-xs backdrop-blur-sm">No image</div>
        }
        {item.content && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-12 backdrop-blur-sm">
            <p className="text-white text-sm leading-snug font-medium drop-shadow-lg">{item.content}</p>
          </div>
        )}
      </div>
    );

    if (item.type === 'quote') return (
      <div className="w-full h-full p-5 flex flex-col justify-center" style={{
        background: 'transparent',
        borderRadius: item.border_radius ?? 0,
        borderLeft: `3px solid ${item.color || 'rgba(59,130,246,0.6)'}`,
      }}>
        {isEditing
          ? <textarea ref={editRef} defaultValue={item.content || ''}
              onBlur={e => { onUpdate({ content: e.target.value }); onStopEdit(); }}
              onKeyDown={e => { if (e.key === 'Escape') onStopEdit(); e.stopPropagation(); }}
              className="bg-transparent border-none outline-none resize-none w-full flex-1 italic" style={{...ts, color: '#1f2937'}} />
          : <p className="italic leading-relaxed" style={{...ts, color: '#1f2937'}}>"{item.content}"</p>
        }
        {!isEditing && item.author && <p className="mt-3 text-gray-500 text-xs font-medium">— {item.author}</p>}
      </div>
    );

    if (item.type === 'text') return (
      <div className="w-full h-full p-4 flex flex-col" style={{ background: 'transparent', borderRadius: item.border_radius ?? 0 }}>
        {item.title && <p className="font-bold mb-2" style={{ ...ts, fontSize: (item.font_size || 16) + 3, color: '#111827' }}>{item.title}</p>}
        {isEditing
          ? <textarea ref={editRef} defaultValue={item.content || ''}
              onBlur={e => { onUpdate({ content: e.target.value }); onStopEdit(); }}
              onKeyDown={e => { if (e.key === 'Escape') onStopEdit(); e.stopPropagation(); }}
              className="bg-transparent border-none outline-none resize-none w-full flex-1" style={{...ts, color: '#374151'}} />
          : <p className="leading-relaxed" style={{...ts, color: '#374151'}}>{item.content}</p>
        }
      </div>
    );

    if (item.type === 'sticker') return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-2 hover:scale-110 transition-transform duration-200">
        <span style={{ fontSize: Math.min(item.width, item.height) * 0.5, filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.15))' }} className="leading-none select-none">{item.content}</span>
        {item.title && <p className="text-gray-700 text-xs font-medium text-center px-2 bg-white/80 backdrop-blur-sm rounded-full py-1 shadow-sm">{item.title}</p>}
      </div>
    );
  }

  return (
    <Rnd
      size={{ width: item.width, height: item.height }}
      position={{ x: item.x, y: item.y }}
      onDragStop={(_, d) => onUpdate({ x: d.x, y: d.y })}
      onResizeStop={(_, __, ref, ___, pos) => onUpdate({ width: parseFloat(ref.style.width), height: parseFloat(ref.style.height), x: pos.x, y: pos.y })}
      disableDragging={isEditing || item.is_locked}
      enableResizing={isSelected && !isEditing && !liveRot}
      bounds="parent"
      minWidth={60} minHeight={40}
      style={{ zIndex: isSelected ? 9999 : item.z_index, opacity: item.opacity ?? 1 }}
      onClick={(e: React.MouseEvent) => { e.stopPropagation(); onSelect(); }}
      onDoubleClick={(e: React.MouseEvent) => { e.stopPropagation(); if (item.type === 'text' || item.type === 'quote') onStartEdit(); }}
      onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); e.stopPropagation(); onContextMenu(e.clientX, e.clientY); }}
    >
      {/* Rotation wrapper */}
      <div ref={wrapperRef} style={{ width: '100%', height: '100%', transform: `rotate(${liveRot}deg)`, transformOrigin: 'center center' }}>
        {/* Rotation handle – rendered in rotated space so it stays above the item */}
        {isSelected && !isEditing && !item.is_locked && (
          <>
            <div style={{ position: 'absolute', top: -20, left: '50%', transform: 'translateX(-50%)', width: 1, height: 20, background: 'rgba(255,255,255,0.35)', pointerEvents: 'none' }} />
            <div
              onMouseDown={startRotating}
              title={`Rotate (${Math.round(liveRot)}°) — Shift to snap 15°`}
              style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', cursor: 'grab', zIndex: 10 }}
              className="w-5 h-5 rounded-full bg-white shadow-lg border border-black/20 flex items-center justify-center hover:scale-110 transition-transform"
            >
              <RotateCw className="w-2.5 h-2.5 text-black/60" />
            </div>
          </>
        )}

        <div className={cn(
          'w-full h-full relative cursor-pointer transition-all duration-200',
          'hover:translate-y-[-2px]',
          isSelected && !isEditing && 'ring-2 ring-blue-400/60 ring-offset-2 ring-offset-transparent'
        )}
        style={{
          borderRadius: item.type === 'sticker' ? '16px' : item.type === 'image' ? `${item.border_radius ?? 12}px` : '12px',
          boxShadow: isSelected 
            ? '0 12px 40px -8px rgba(0,0,0,0.4), 0 4px 12px -2px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
            : '0 4px 16px -2px rgba(0,0,0,0.25), 0 2px 8px -1px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.05)',
          background: item.type === 'text' || item.type === 'quote' 
            ? (item.bg_color || 'rgba(255,255,255,0.95)')
            : item.type === 'sticker' ? 'transparent' : undefined,
          backdropFilter: item.type === 'text' || item.type === 'quote' ? 'blur(8px)' : undefined,
        }}>
          {/* Subtle paper texture for text/quote cards */}
          {(item.type === 'text' || item.type === 'quote') && (
            <div className="absolute inset-0 pointer-events-none rounded-[inherit]" style={{
              opacity: 0.03,
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }} />
          )}
          {renderContent()}
          {item.is_locked && isSelected && (
            <div className="absolute top-2 left-2 w-6 h-6 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg">
              <Lock className="w-3.5 h-3.5 text-white/80" />
            </div>
          )}
          {(item.type === 'text' || item.type === 'quote') && isSelected && !isEditing && (
            <div className="absolute bottom-1 right-1 text-[9px] text-white/30 bg-black/40 rounded px-1">double-click to edit</div>
          )}
          {liveRot !== 0 && isSelected && !isEditing && (
            <div className="absolute top-1 right-1 text-[9px] text-white/30 bg-black/40 rounded px-1">{Math.round(liveRot)}°</div>
          )}
        </div>
      </div>
    </Rnd>
  );
}

// ── Board Canvas ──────────────────────────────────────────────────────────────
function BoardCanvas({ board, onBack }: { board: DreamBoard; onBack: () => void }) {
  const [items,       setItems]       = useState<DreamItem[]>([]);
  const [selectedId,  setSelectedId]  = useState<string | null>(null);
  const [editingId,   setEditingId]   = useState<string | null>(null);
  const [zoom,        setZoom]        = useState(0.9);
  const [showAdd,     setShowAdd]     = useState(false);
  const [isInfinite,  setIsInfinite]  = useState(board.is_infinite);
  const [isSaving,    setIsSaving]    = useState(false);
  const [isDragOver,  setIsDragOver]  = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; itemId: string } | null>(null);
  const [bgColor,     setBgColor]     = useState(board.bg_color);
  const [showBgPicker, setShowBgPicker] = useState(false);

  const historyRef = useRef<DreamItem[][]>([]);
  const historyIdx = useRef(0);
  const canvasRef  = useRef<HTMLDivElement>(null);

  const selectedItem = items.find(i => i.id === selectedId) ?? null;

  useEffect(() => { loadGoogleFonts(); }, []);
  useEffect(() => { loadItems(); }, [board.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function loadItems() {
    const { data } = await sb().from('dreamboard_items').select('*').eq('board_id', board.id).order('z_index');
    const raw = (data || []) as DreamItem[];
    const normalized = normalizeZIndices(raw);
    setItems(normalized);
    historyRef.current = [normalized]; historyIdx.current = 0;
    // Persist any z_index corrections (handles duplicates from old data)
    normalized.forEach((ni, i) => { if (raw[i]?.z_index !== ni.z_index) sb().from('dreamboard_items').update({ z_index: ni.z_index }).eq('id', ni.id); });
  }

  function pushHistory(newItems: DreamItem[]) {
    historyRef.current = historyRef.current.slice(0, historyIdx.current + 1);
    historyRef.current.push(JSON.parse(JSON.stringify(newItems)));
    historyIdx.current = historyRef.current.length - 1;
  }

  function undo() { if (historyIdx.current > 0) { historyIdx.current--; setItems(historyRef.current[historyIdx.current]); } }
  function redo() { if (historyIdx.current < historyRef.current.length - 1) { historyIdx.current++; setItems(historyRef.current[historyIdx.current]); } }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (editingId) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) deleteItem(selectedId);
      if (e.key === 'Escape') { setSelectedId(null); setContextMenu(null); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) { e.preventDefault(); duplicateItem(selectedId); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingId, selectedId, items]);

  async function addItem(type: ItemType, defaults: Partial<DreamItem>) {
    const { data: { user } } = await sb().auth.getUser();
    if (!user) return;
    const el = canvasRef.current;
    const cx = el ? (el.scrollLeft + el.clientWidth  / 2) / zoom : 300;
    const cy = el ? (el.scrollTop  + el.clientHeight / 2) / zoom : 200;
    const base = ITEM_DEFAULTS[type];
    const w    = (base.width  as number) || 240;
    const h    = (base.height as number) || 160;
    const payload: any = {
      user_id: user.id, board_id: board.id, type,
      x: cx - w / 2, y: cy - h / 2, width: w, height: h,
      rotation: 0, z_index: items.length > 0 ? Math.max(...items.map(i => i.z_index)) + 1 : 0,
      font_size: 16, font_family: 'Inter', font_weight: '400',
      text_align: 'left', letter_spacing: 0,
      is_uppercase: false, opacity: 1, border_radius: 12, is_locked: false,
      ...base, ...defaults,
    };
    const { data } = await sb().from('dreamboard_items').insert([payload]).select().single();
    if (data) {
      const newItems = [...items, data as DreamItem];
      setItems(newItems); pushHistory(newItems); setSelectedId(data.id);
    }
  }

  const updateItem = useCallback(async (id: string, updates: Partial<DreamItem>) => {
    const newItems = items.map(i => i.id === id ? { ...i, ...updates } : i);
    setItems(newItems);
    setIsSaving(true);
    await sb().from('dreamboard_items').update(updates).eq('id', id);
    setIsSaving(false);
    if ('x' in updates || 'width' in updates || 'z_index' in updates || 'content' in updates) pushHistory(newItems);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  async function deleteItem(id: string) {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems); setSelectedId(null); setEditingId(null);
    pushHistory(newItems);
    await sb().from('dreamboard_items').delete().eq('id', id);
  }

  async function duplicateItem(id: string) {
    const src = items.find(i => i.id === id); if (!src) return;
    const { data: { user } } = await sb().auth.getUser(); if (!user) return;
    const { id: _id, ...rest } = src as any;
    const { data } = await sb().from('dreamboard_items').insert([{ ...rest, user_id: user.id, x: src.x + 24, y: src.y + 24, z_index: items.length }]).select().single();
    if (data) { const n = [...items, data as DreamItem]; setItems(n); pushHistory(n); setSelectedId(data.id); }
  }

  function applyLayerChange(newItems: DreamItem[], prevItems: DreamItem[]) {
    const normalized = normalizeZIndices(newItems);
    setItems(normalized); pushHistory(normalized);
    normalized.forEach(ni => {
      const prev = prevItems.find(p => p.id === ni.id);
      if (prev && prev.z_index !== ni.z_index)
        sb().from('dreamboard_items').update({ z_index: ni.z_index }).eq('id', ni.id);
    });
  }

  function bringForward(id: string) {
    const it = items.find(i => i.id === id); if (!it) return;
    const above = items.filter(i => i.id !== id && i.z_index > it.z_index).sort((a, b) => a.z_index - b.z_index)[0];
    if (!above) return;
    applyLayerChange(
      items.map(i => i.id === id ? { ...i, z_index: above.z_index } : i.id === above.id ? { ...i, z_index: it.z_index } : i),
      items
    );
  }

  function sendBack(id: string) {
    const it = items.find(i => i.id === id); if (!it) return;
    const below = items.filter(i => i.id !== id && i.z_index < it.z_index).sort((a, b) => b.z_index - a.z_index)[0];
    if (!below) return;
    applyLayerChange(
      items.map(i => i.id === id ? { ...i, z_index: below.z_index } : i.id === below.id ? { ...i, z_index: it.z_index } : i),
      items
    );
  }

  function bringToFront(id: string) {
    const it = items.find(i => i.id === id); if (!it) return;
    const maxZ = Math.max(...items.map(i => i.z_index));
    if (it.z_index === maxZ) return;
    applyLayerChange(items.map(i => i.id === id ? { ...i, z_index: maxZ + 1 } : i), items);
  }

  function sendToBack(id: string) {
    const it = items.find(i => i.id === id); if (!it) return;
    const minZ = Math.min(...items.map(i => i.z_index));
    if (it.z_index === minZ) return;
    applyLayerChange(items.map(i => i.id === id ? { ...i, z_index: minZ - 1 } : i), items);
  }

  async function updateBgColor(color: string) {
    setBgColor(color); setShowBgPicker(false);
    await sb().from('dreamboard_boards').update({ bg_color: color }).eq('id', board.id);
  }

  async function exportBoard() {
    if (!canvasRef.current) return;
    const el = canvasRef.current;
    // Temporarily set overflow visible so full canvas captures
    const prevOverflow = el.style.overflow;
    el.style.overflow = 'visible';
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: bgColor,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        width: el.scrollWidth,
        height: el.scrollHeight,
      });
      const link = document.createElement('a');
      link.download = `${board.title.replace(/\s+/g, '-').toLowerCase()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } finally {
      el.style.overflow = prevOverflow;
    }
  }

  // Drag & drop files
  function onDragOver(e: React.DragEvent)  { e.preventDefault(); setIsDragOver(true); }
  function onDragLeave()                    { setIsDragOver(false); }
  async function onDrop(e: React.DragEvent) {
    e.preventDefault(); setIsDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const url = await uploadToStorage(file);
    if (url) addItem('image', { image_url: url });
  }

  const canvasW = isInfinite ? 4000 : board.canvas_width;
  const canvasH = isInfinite ? 3000 : board.canvas_height;

  return (
    <div className="h-full flex flex-col" style={{ background: '#0a0a0a' }}>
      {/* Main toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/10 flex-shrink-0 bg-[#111] h-11">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" /> Boards
          </button>
          <div className="w-px h-4 bg-white/15" />
          <div>
            <p className="font-semibold text-white text-sm leading-none">{board.title}</p>
            {board.period && <p className="text-white/40 text-[10px]">{board.period}</p>}
          </div>
          {isSaving && <span className="text-white/30 text-[10px]">Saving...</span>}
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="w-7 h-7 rounded-lg text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"><Undo2 className="w-3.5 h-3.5" /></button>
          <button onClick={redo} title="Redo (Ctrl+Shift+Z)" className="w-7 h-7 rounded-lg text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"><Redo2 className="w-3.5 h-3.5" /></button>
          <button onClick={exportBoard} title="Export as PNG" className="w-7 h-7 rounded-lg text-white/50 hover:bg-white/10 hover:text-white flex items-center justify-center transition-colors"><Download className="w-3.5 h-3.5" /></button>
          <div className="w-px h-4 bg-white/15" />
          <button onClick={() => setIsInfinite(p => !p)}
            className="flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-medium border border-white/15 text-white/50 hover:text-white hover:border-white/30 transition-all">
            {isInfinite ? <><Unlock className="w-3 h-3" /> Infinite</> : <><Lock className="w-3 h-3" /> Fixed</>}
          </button>
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg px-1 border border-white/10 h-7">
            <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.3))} className="p-1 text-white/60 hover:text-white"><ZoomOut className="w-3 h-3" /></button>
            <span className="text-white/60 text-xs w-8 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(z => Math.min(z + 0.1, 2))} className="p-1 text-white/60 hover:text-white"><ZoomIn className="w-3 h-3" /></button>
          </div>
          {/* Background color picker */}
          <div className="relative">
            <button onClick={() => setShowBgPicker(p => !p)} title="Board background"
              className="w-7 h-7 rounded-lg border-2 border-white/20 hover:border-white/50 transition-all flex-shrink-0"
              style={{ backgroundColor: bgColor }} />
            {showBgPicker && (
              <div className="absolute top-9 right-0 z-50 bg-[#1a1a1a] border border-white/15 rounded-2xl p-3 shadow-2xl w-64" onClick={e => e.stopPropagation()}>
                <p className="text-white/40 text-[10px] mb-2.5 font-medium uppercase tracking-wider">Board theme</p>
                <div className="grid grid-cols-4 gap-2">
                  {BOARD_THEMES.map(t => (
                    <button key={t.label} onClick={() => updateBgColor(t.bg)} title={t.label}
                      className={cn('h-10 rounded-xl border-2 transition-all hover:scale-105 text-[9px] font-medium overflow-hidden flex items-end pb-1 px-1', bgColor === t.bg ? 'border-white' : 'border-white/10 hover:border-white/30')}
                      style={{ background: t.bg }}>
                      <span className={cn('leading-none', t.preview.startsWith('#f') || t.preview.startsWith('#e') || t.preview.startsWith('#d') ? 'text-black/60' : 'text-white/60')}>{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <button onClick={() => setShowAdd(p => !p)}
            className={cn('flex items-center gap-1.5 h-7 px-3 rounded-lg text-xs font-semibold transition-all', showAdd ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20')}>
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      </div>

      {/* Context-sensitive toolbar */}
      {selectedItem && (
        <SelectionToolbar
          item={selectedItem}
          totalItems={items.length}
          onUpdate={u => updateItem(selectedItem.id, u)}
          onDelete={() => deleteItem(selectedItem.id)}
          onDuplicate={() => duplicateItem(selectedItem.id)}
          onBringForward={() => bringForward(selectedItem.id)}
          onSendBack={() => sendBack(selectedItem.id)}
          onBringToFront={() => bringToFront(selectedItem.id)}
          onSendToBack={() => sendToBack(selectedItem.id)}
        />
      )}

      {/* Canvas */}
      <div ref={canvasRef}
        className={cn('flex-1 overflow-auto relative', isDragOver && 'ring-2 ring-inset ring-white/30')}
        style={{ background: bgColor }}
        onClick={() => { setSelectedId(null); setContextMenu(null); setShowBgPicker(false); }}
        onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
      >
        {/* Subtle texture overlay for realistic board feel */}
        {(() => {
          const isLight = bgColor.startsWith('#f') || bgColor.startsWith('#e') || bgColor.startsWith('#d') || bgColor.includes('faf') || bgColor.includes('ede');
          return (
            <>
              {/* Fine grain texture */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ 
                  opacity: isLight ? 0.03 : 0.015,
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
                  mixBlendMode: 'overlay'
                }} />
              {/* Subtle dot grid */}
              <div className="absolute inset-0 pointer-events-none"
                style={{ 
                  opacity: isLight ? 0.08 : 0.03, 
                  backgroundImage: `radial-gradient(circle, ${isLight ? '#000' : '#fff'} 1px, transparent 1px)`, 
                  backgroundSize: '24px 24px' 
                }} />
            </>
          );
        })()}

        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-3 border border-white/20">
              <p className="text-white font-medium text-sm">Drop image here</p>
            </div>
          </div>
        )}

        {/* Scaled canvas */}
        <div style={{ width: canvasW, height: canvasH, position: 'relative', transform: `scale(${zoom})`, transformOrigin: 'top left', marginBottom: canvasH * zoom - canvasH, marginRight: canvasW * zoom - canvasW }}
          onClick={() => { setSelectedId(null); setContextMenu(null); setShowBgPicker(false); }}>
          {!isInfinite && (
            <div style={{ position: 'absolute', inset: 0, border: '1px dashed rgba(255,255,255,0.1)', borderRadius: 8, pointerEvents: 'none' }} />
          )}
          {[...items].sort((a, b) => a.z_index - b.z_index).map(item => (
            <CanvasItem key={item.id} item={item}
              isSelected={selectedId === item.id}
              isEditing={editingId === item.id}
              onSelect={() => setSelectedId(item.id)}
              onStartEdit={() => setEditingId(item.id)}
              onStopEdit={() => setEditingId(null)}
              onUpdate={u => updateItem(item.id, u)}
              onContextMenu={(x, y) => { setSelectedId(item.id); setContextMenu({ x, y, itemId: item.id }); }}
            />
          ))}
          {items.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 pointer-events-none">
              <p className="text-white/20 text-xl font-medium">Your board is empty</p>
              <p className="text-white/15 text-sm">Click + Add or drop images here to start</p>
            </div>
          )}
        </div>
      </div>

      {/* Add panel */}
      {showAdd && (
        <AddItemPanel
          onAdd={(t, d) => { addItem(t, d); setShowAdd(false); }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}
          isLocked={items.find(i => i.id === contextMenu.itemId)?.is_locked ?? false}
          onClose={() => setContextMenu(null)}
          onDelete={() => { deleteItem(contextMenu.itemId); setContextMenu(null); }}
          onDuplicate={() => { duplicateItem(contextMenu.itemId); setContextMenu(null); }}
          onBringForward={() => { bringForward(contextMenu.itemId); setContextMenu(null); }}
          onSendBack={() => { sendBack(contextMenu.itemId); setContextMenu(null); }}
          onBringToFront={() => { bringToFront(contextMenu.itemId); setContextMenu(null); }}
          onSendToBack={() => { sendToBack(contextMenu.itemId); setContextMenu(null); }}
          onLock={() => {
            const it = items.find(i => i.id === contextMenu.itemId);
            if (it) updateItem(it.id, { is_locked: !it.is_locked });
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
}

// ── Board Gallery ─────────────────────────────────────────────────────────────
function BoardGallery({ onOpen }: { onOpen: (board: DreamBoard) => void }) {
  const [boards,        setBoards]        = useState<DreamBoard[]>([]);
  const [itemCounts,    setItemCounts]    = useState<Record<string, number>>({});
  const [previewImgs,   setPreviewImgs]   = useState<Record<string, string[]>>({});
  const [isLoading,     setIsLoading]     = useState(true);
  const [showNew,       setShowNew]       = useState(false);
  const [editingBoard,  setEditingBoard]  = useState<DreamBoard | null>(null);

  useEffect(() => { loadBoards(); }, []);

  async function deleteBoard(id: string) {
    await sb().from('dreamboard_items').delete().eq('board_id', id);
    await sb().from('dreamboard_boards').delete().eq('id', id);
    setBoards(p => p.filter(b => b.id !== id));
  }

  async function loadBoards() {
    const { data } = await sb().from('dreamboard_boards').select('*').order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setBoards(data as DreamBoard[]);
      const ids = data.map((b: any) => b.id);
      // Load counts + preview images in parallel
      const [{ data: allItems }] = await Promise.all([
        sb().from('dreamboard_items').select('board_id, type, image_url, z_index').in('board_id', ids),
      ]);
      if (allItems) {
        const counts: Record<string, number> = {};
        const imgs: Record<string, string[]> = {};
        allItems.forEach((r: any) => {
          counts[r.board_id] = (counts[r.board_id] || 0) + 1;
          if (r.type === 'image' && r.image_url) {
            if (!imgs[r.board_id]) imgs[r.board_id] = [];
            if (imgs[r.board_id].length < 3) imgs[r.board_id].push(r.image_url);
          }
        });
        setItemCounts(counts);
        setPreviewImgs(imgs);
      }
    }
    setIsLoading(false);
  }

  const byType: Record<BoardType, DreamBoard[]> = { year: [], quarter: [], month: [], custom: [] };
  boards.forEach(b => byType[b.type].push(b));
  const typeLabels: Record<BoardType, string> = { year: '📅 Year', quarter: '📊 Quarters', month: '🗓️ Monthly', custom: '✏️ Custom' };

  return (
    <div className="h-full flex flex-col bg-[#0a0a0a] overflow-hidden">
      <div className="px-8 pt-8 pb-6 flex-shrink-0 border-b border-white/10">
        <div className="flex items-end justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-white tracking-tight">Dreamboard</h1>
            <p className="text-white/40 text-sm mt-1">Your vision, your future — look back and see how far you've come.</p>
          </div>
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors shadow-lg">
            <Plus className="w-4 h-4" /> New Board
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-8 py-6 space-y-10">
        {isLoading ? (
          <div className="flex items-center justify-center h-48 text-white/30 text-sm">Loading your boards...</div>
        ) : boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 gap-5 text-center">
            <div className="text-6xl">✨</div>
            <div>
              <p className="text-white font-semibold">No boards yet</p>
              <p className="text-white/40 text-sm mt-1 max-w-xs">Create your first dreamboard and start mapping out your vision.</p>
            </div>
            <button onClick={() => setShowNew(true)}
              className="px-6 py-2.5 rounded-xl bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
              Create First Board
            </button>
          </div>
        ) : (
          (['year','quarter','month','custom'] as BoardType[]).map(type => {
            const group = byType[type];
            if (!group.length) return null;
            return (
              <div key={type}>
                <h2 className="font-mono text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">{typeLabels[type]}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.map(board => (
                    <BoardCard key={board.id} board={board} itemCount={itemCounts[board.id] || 0}
                      previewImages={previewImgs[board.id] || []}
                      onClick={() => onOpen(board)}
                      onDelete={() => deleteBoard(board.id)}
                      onEdit={() => setEditingBoard(board)} />
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {showNew && (
        <NewBoardModal
          onClose={() => setShowNew(false)}
          onCreated={b => { setBoards(p => [b, ...p]); setShowNew(false); onOpen(b); }}
        />
      )}
      {editingBoard && (
        <EditBoardModal
          board={editingBoard}
          onClose={() => setEditingBoard(null)}
          onSaved={updated => {
            setBoards(p => p.map(b => b.id === updated.id ? updated : b));
            setEditingBoard(null);
          }}
        />
      )}
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function DreamboardView() {
  const [activeBoard, setActiveBoard] = useState<DreamBoard | null>(null);

  if (activeBoard) {
    return (
      <div className="h-full relative overflow-hidden">
        <BoardCanvas board={activeBoard} onBack={() => setActiveBoard(null)} />
      </div>
    );
  }
  return <BoardGallery onOpen={setActiveBoard} />;
}
