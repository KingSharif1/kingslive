'use client';

import React, {
  useState, useEffect, useRef, useCallback, KeyboardEvent,
} from 'react';
import { Rnd } from 'react-rnd';
import {
  ArrowLeft, Plus, ZoomIn, ZoomOut, Trash2, Copy, Image, Quote, Type,
  Smile, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Lock, Unlock, ChevronsUp, ChevronsDown, Undo2, Redo2, Upload,
  Download, RotateCw, MoreHorizontal, Target, Hand, Grid3X3, Check,
  X as XIcon, GripVertical, Layers, Maximize2, AlignStartVertical,
  AlignCenterHorizontal, AlignEndVertical, AlignStartHorizontal,
  AlignVerticalJustifyCenter, AlignEndHorizontal, Group, Ungroup,
  RefreshCw,
} from 'lucide-react';

import {
  DreamBoard, DreamItem, ItemType, TextAlign, GoalData,
  FONTS, STICKERS, ITEM_DEFAULTS, TEMPLATE_BOARDS, ACCENT_COLORS,
  parseGoalData, normalizeZIndices, snapToGrid as snapVal,
  dbLoadItems, dbCreateItem, dbUpdateItem, dbUpdateItems, dbDeleteItem, dbDeleteItems,
  uploadToStorage,
} from './DreamboardStore';

// ── Sub-components ────────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 56, color = '#c49b66' }: { pct: number; size?: number; color?: string }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(100, Math.max(0, pct)) / 100);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={3.5} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3.5}
        strokeDasharray={`${circ}`} strokeDashoffset={`${offset}`} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }} />
    </svg>
  );
}

interface CanvasItemProps {
  item: DreamItem;
  isSelected: boolean;
  isMultiSelected: boolean;
  zoom: number;
  snapGrid: number;
  onSelect: (id: string, addToSelection: boolean) => void;
  onUpdate: (id: string, patch: Partial<DreamItem>) => void;
  onDragStop: (id: string, x: number, y: number, shiftKey: boolean) => void;
  onResizeStop: (id: string, x: number, y: number, w: number, h: number) => void;
  onDelete: (id: string) => void;
  onContextMenu: (id: string, x: number, y: number) => void;
}

function CanvasItem({
  item, isSelected, isMultiSelected, zoom, snapGrid,
  onSelect, onUpdate, onDragStop, onResizeStop, onDelete, onContextMenu,
}: CanvasItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [editing, setEditing]     = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);

  const goalData = item.type === 'goal' ? parseGoalData(item.content) : null;
  const rotation = isHovered ? 0 : item.rotation;
  const scale    = isHovered ? 1.02 : 1;

  const pinDot = (key: string) => (
    <div key={key} className="absolute w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center">
      <div className="w-1 h-1 rounded-full bg-white/40" />
    </div>
  );
  const PIN_POSITIONS = [
    { top: 4, left: 4 }, { top: 4, right: 4 },
    { bottom: 4, left: 4 }, { bottom: 4, right: 4 },
  ];

  const renderContent = () => {
    switch (item.type) {
      case 'image':
        return item.image_url ? (
          <img
            src={item.image_url}
            className="w-full h-full object-cover transition-all duration-300"
            style={{
              borderRadius: item.border_radius,
              filter: isHovered ? 'none' : 'grayscale(15%)',
            }}
            draggable={false}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-white/5 rounded-xl text-white/20">
            <Image size={32} />
          </div>
        );

      case 'quote':
        return (
          <div className="w-full h-full flex flex-col justify-center px-4 py-3"
            style={{ borderLeft: `3px solid ${item.color || '#ffffff'}33` }}>
            {editing ? (
              <textarea ref={textRef} autoFocus value={item.content || ''} onChange={e => onUpdate(item.id, { content: e.target.value })}
                onBlur={() => setEditing(false)}
                className="w-full bg-transparent resize-none outline-none leading-relaxed"
                style={{
                  fontFamily: item.font_family, fontSize: item.font_size, color: item.color,
                  textAlign: item.text_align, letterSpacing: `${item.letter_spacing}px`,
                  textTransform: item.is_uppercase ? 'uppercase' : 'none', fontWeight: item.font_weight,
                }} rows={4} />
            ) : (
              <p className="leading-relaxed whitespace-pre-wrap"
                style={{
                  fontFamily: item.font_family, fontSize: item.font_size, color: item.color,
                  textAlign: item.text_align, letterSpacing: `${item.letter_spacing}px`,
                  textTransform: item.is_uppercase ? 'uppercase' : 'none', fontWeight: item.font_weight,
                }}>{item.content || 'Double-click to edit…'}</p>
            )}
            {item.author && (
              <p className="mt-2 text-xs opacity-40 italic"
                style={{ color: item.color }}>— {item.author}</p>
            )}
          </div>
        );

      case 'text':
        return (
          <div className="w-full h-full p-3">
            {editing ? (
              <textarea ref={textRef} autoFocus value={item.content || ''} onChange={e => onUpdate(item.id, { content: e.target.value })}
                onBlur={() => setEditing(false)}
                className="w-full h-full bg-transparent resize-none outline-none leading-relaxed"
                style={{
                  fontFamily: item.font_family, fontSize: item.font_size, color: item.color,
                  textAlign: item.text_align, letterSpacing: `${item.letter_spacing}px`,
                  textTransform: item.is_uppercase ? 'uppercase' : 'none', fontWeight: item.font_weight,
                }} />
            ) : (
              <p className="w-full h-full leading-relaxed whitespace-pre-wrap"
                style={{
                  fontFamily: item.font_family, fontSize: item.font_size, color: item.color,
                  textAlign: item.text_align, letterSpacing: `${item.letter_spacing}px`,
                  textTransform: item.is_uppercase ? 'uppercase' : 'none', fontWeight: item.font_weight,
                }}>{item.content || 'Click to edit…'}</p>
            )}
          </div>
        );

      case 'sticker':
        return (
          <div className="w-full h-full flex items-center justify-center select-none"
            style={{ fontSize: Math.min(item.width, item.height) * 0.72, lineHeight: 1 }}>
            {item.content}
          </div>
        );

      case 'goal':
        return goalData ? (
          <div className="w-full h-full p-4 flex flex-col"
            style={{ borderRadius: item.border_radius, background: 'rgba(0,0,0,0.3)' }}>
            <div className="flex items-center gap-3 mb-3">
              <ProgressRing pct={goalData.progress} size={Math.max(36, Math.min(64, item.width * 0.2))} color={item.color || '#c49b66'} />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm leading-tight text-white truncate">{item.title || 'Goal'}</p>
                <p className="text-xs mt-0.5" style={{ color: item.color || '#c49b66' }}>{goalData.progress}% complete</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-1.5">
              {goalData.items.map((gi, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      const updated = { ...goalData, items: goalData.items.map((x, i) => i === idx ? { ...x, done: !x.done } : x) };
                      const done = updated.items.filter(x => x.done).length;
                      updated.progress = updated.items.length ? Math.round((done / updated.items.length) * 100) : 0;
                      onUpdate(item.id, { content: JSON.stringify(updated) });
                    }}
                    className="mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center transition-all"
                    style={{ borderColor: gi.done ? (item.color || '#c49b66') : 'rgba(255,255,255,0.2)', background: gi.done ? (item.color || '#c49b66') : 'transparent' }}
                  >
                    {gi.done && <Check size={9} strokeWidth={3} className="text-black" />}
                  </button>
                  <p className="text-xs leading-5 text-white/70" style={{ textDecoration: gi.done ? 'line-through' : 'none' }}>{gi.text}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null;

      default:
        return null;
    }
  };

  const isCard     = item.type === 'image' || item.type === 'goal';
  const outline    = (isSelected || isMultiSelected)
    ? '2px solid #00ff88'
    : (isHovered && isCard)
      ? '1px solid rgba(255,255,255,0.20)'
      : 'none';

  return (
    <Rnd
      position={{ x: item.x, y: item.y }}
      size={{ width: item.width, height: item.height }}
      scale={zoom}
      disableDragging={item.is_locked}
      enableResizing={!item.is_locked && (isSelected || isMultiSelected)}
      dragGrid={snapGrid > 1 ? [snapGrid, snapGrid] : undefined}
      resizeGrid={snapGrid > 1 ? [snapGrid, snapGrid] : undefined}
      onDragStop={(_e, d) => onDragStop(item.id, d.x, d.y, _e.shiftKey)}
      onResizeStop={(_e, _dir, _ref, _delta, pos) => {
        const el = _ref as HTMLElement;
        onResizeStop(item.id, pos.x, pos.y, el.offsetWidth, el.offsetHeight);
      }}
      onMouseDown={e => onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey)}
      onContextMenu={(e: React.MouseEvent) => { e.preventDefault(); onContextMenu(item.id, e.clientX, e.clientY); }}
      style={{ zIndex: item.z_index + 1, outline }}
      resizeHandleStyles={(isSelected || isMultiSelected) ? {
        topLeft:     { width: 10, height: 10, background: '#00ff88', borderRadius: '50%', top: -5,  left: -5,  cursor: 'nw-resize', zIndex: 20 },
        topRight:    { width: 10, height: 10, background: '#00ff88', borderRadius: '50%', top: -5,  right: -5, cursor: 'ne-resize', zIndex: 20 },
        bottomLeft:  { width: 10, height: 10, background: '#00ff88', borderRadius: '50%', bottom: -5, left: -5,  cursor: 'sw-resize', zIndex: 20 },
        bottomRight: { width: 10, height: 10, background: '#00ff88', borderRadius: '50%', bottom: -5, right: -5, cursor: 'se-resize', zIndex: 20 },
        top:    { height: 6, top: -3,    left: '25%', right: '25%', background: '#00ff8866', borderRadius: 3, cursor: 'n-resize',  zIndex: 20 },
        bottom: { height: 6, bottom: -3, left: '25%', right: '25%', background: '#00ff8866', borderRadius: 3, cursor: 's-resize',  zIndex: 20 },
        left:   { width: 6,  left: -3,   top: '25%',  bottom: '25%', background: '#00ff8866', borderRadius: 3, cursor: 'w-resize',  zIndex: 20 },
        right:  { width: 6,  right: -3,  top: '25%',  bottom: '25%', background: '#00ff8866', borderRadius: 3, cursor: 'e-resize',  zIndex: 20 },
      } : {}}
    >
      <div
        className={`relative w-full h-full ${isCard ? 'overflow-hidden' : 'overflow-visible'}`}
        style={{
          borderRadius: isCard ? item.border_radius : 0,
          opacity: item.opacity,
          transform: `rotate(${rotation}deg) scale(${scale})`,
          transition: 'transform 0.2s ease',
          cursor: item.is_locked ? 'not-allowed' : 'move',
          background: isCard ? (item.bg_color || undefined) : undefined,
          boxShadow: item.type === 'goal' && isHovered
            ? `0 0 24px ${item.color || '#c49b66'}44, 0 0 60px ${item.color || '#c49b66'}22`
            : undefined,
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onDoubleClick={() => { if (item.type === 'quote' || item.type === 'text') setEditing(true); }}
      >
        {renderContent()}

        {/* Pin dots — only on card types */}
        {isCard && (isHovered || isSelected || isMultiSelected) && PIN_POSITIONS.map((pos, i) => (
          <div key={i} className="absolute w-4 h-4 rounded-full bg-white/10 border border-white/20 flex items-center justify-center pointer-events-none"
            style={pos}>
            <div className="w-1 h-1 rounded-full bg-white/40" />
          </div>
        ))}

        {/* Lock badge */}
        {item.is_locked && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 flex items-center justify-center">
            <Lock size={10} className="text-white/60" />
          </div>
        )}
      </div>
    </Rnd>
  );
}

// ── Main Canvas ───────────────────────────────────────────────────────────────
interface DreamboardCanvasProps {
  board: DreamBoard;
  onBack: () => void;
}

type PanelTab = 'elements' | 'images' | 'templates';

export function DreamboardCanvas({ board, onBack }: DreamboardCanvasProps) {
  const [items,       setItems]       = useState<DreamItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [zoom,        setZoom]        = useState(0.65);
  const [panOffset,   setPanOffset]   = useState({ x: 0, y: 0 });
  const [isPanMode,   setIsPanMode]   = useState(false);
  const [snapGrid,    setSnapGrid]    = useState(1);
  const [loading,     setLoading]     = useState(true);
  const [saving,      setSaving]      = useState(false);

  // Lasso selection
  const [lasso, setLasso] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const lassoStart = useRef<{ x: number; y: number } | null>(null);
  const isLassoing = useRef(false);

  // Pan
  const isPanning   = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

  // Left panel
  const [panelOpen,   setPanelOpen]   = useState(false);
  const [panelTab,    setPanelTab]    = useState<PanelTab>('elements');

  // Add item form (shown in panel)
  const [addType,     setAddType]     = useState<ItemType>('quote');
  const [addText,     setAddText]     = useState('');
  const [addAuthor,   setAddAuthor]   = useState('');
  const [addTitle,    setAddTitle]    = useState('');
  const [addGoalPct,  setAddGoalPct]  = useState(0);
  const [addGoalItems,setAddGoalItems] = useState<string[]>(['']);
  const [addGoalInput, setAddGoalInput] = useState('');
  const [addSticker,  setAddSticker]  = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');

  // Clipboard
  const clipboard = useRef<DreamItem[]>([]);

  // History (undo/redo)
  const history   = useRef<DreamItem[][]>([]);
  const historyIdx = useRef(-1);

  const canvasRef   = useRef<HTMLDivElement>(null);
  const fileRef     = useRef<HTMLInputElement>(null);
  const zoomRef     = useRef(zoom);
  const panOffsetRef = useRef(panOffset);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  useEffect(() => { panOffsetRef.current = panOffset; }, [panOffset]);

  // Context menu
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string } | null>(null);

  // Load items
  useEffect(() => {
    dbLoadItems(board.id).then(data => {
      setItems(data);
      pushHistory(data);
      setLoading(false);
    });
  }, [board.id]);

  // Non-passive wheel handler (React attaches onWheel as passive, blocking preventDefault)
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const rect    = el.getBoundingClientRect();
        const mx      = e.clientX - rect.left;
        const my      = e.clientY - rect.top;
        const prevZ   = zoomRef.current;
        const newZ    = Math.max(0.15, Math.min(4, prevZ - e.deltaY * 0.001));
        zoomRef.current = newZ;
        setZoom(newZ);
        setPanOffset(o => ({
          x: mx - (mx - o.x) * (newZ / prevZ),
          y: my - (my - o.y) * (newZ / prevZ),
        }));
      } else {
        setPanOffset(o => ({ x: o.x - e.deltaX, y: o.y - e.deltaY }));
      }
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: globalThis.KeyboardEvent) {
      const ctrl = e.ctrlKey || e.metaKey;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedIds.length && document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
          handleDeleteSelected();
        }
      }
      if (ctrl && e.key === 'c') copySelected();
      if (ctrl && e.key === 'v') pasteItems();
      if (ctrl && e.key === 'a') { e.preventDefault(); setSelectedIds(items.map(i => i.id)); }
      if (ctrl && e.key === 'z') undoHistory();
      if (ctrl && e.key === 'y') redoHistory();
      if (e.key === 'Escape') setSelectedIds([]);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, items]);

  // ── History ──────────────────────────────────────────────────────────────────
  function pushHistory(state: DreamItem[]) {
    history.current = history.current.slice(0, historyIdx.current + 1);
    history.current.push(state.map(i => ({ ...i })));
    historyIdx.current = history.current.length - 1;
  }

  function undoHistory() {
    if (historyIdx.current <= 0) return;
    historyIdx.current--;
    setItems(history.current[historyIdx.current].map(i => ({ ...i })));
  }

  function redoHistory() {
    if (historyIdx.current >= history.current.length - 1) return;
    historyIdx.current++;
    setItems(history.current[historyIdx.current].map(i => ({ ...i })));
  }

  // ── Item helpers ──────────────────────────────────────────────────────────────
  function makeBase(): Omit<DreamItem, 'id'> {
    const maxZ = items.length ? Math.max(...items.map(i => i.z_index)) + 1 : 0;
    return {
      board_id: board.id, type: 'text', x: 120, y: 120, width: 200, height: 140,
      rotation: 0, z_index: maxZ, font_size: 16, font_family: 'Inter',
      font_weight: 'normal', text_align: 'left', letter_spacing: 0,
      is_uppercase: false, opacity: 1, border_radius: 12, is_locked: false,
    };
  }

  async function addItem(type: ItemType, overrides: Partial<DreamItem> = {}) {
    const defaults = ITEM_DEFAULTS[type] || {};
    const rot = ['image','quote'].includes(type) ? (Math.random() * 8 - 4) : ['text'].includes(type) ? (Math.random() * 4 - 2) : 0;
    const newItem: Omit<DreamItem, 'id'> = {
      ...makeBase(), type,
      ...defaults,
      rotation: rot,
      x: 100 + Math.random() * 200,
      y: 80 + Math.random() * 200,
      ...overrides,
    };
    const created = await dbCreateItem(newItem);
    if (!created) return;
    const next = normalizeZIndices([...items, created]);
    setItems(next);
    setSelectedIds([created.id]);
    pushHistory(next);
  }

  async function updateItem(id: string, patch: Partial<DreamItem>) {
    setItems(prev => prev.map(i => i.id === id ? { ...i, ...patch } : i));
    await dbUpdateItem(id, patch);
  }

  async function handleDragStop(id: string, x: number, y: number, shiftKey: boolean) {
    const item = items.find(i => i.id === id);
    if (!item) return;

    if (selectedIds.length > 1 && selectedIds.includes(id)) {
      const dx = x - item.x;
      const dy = y - item.y;
      const patches = selectedIds
        .filter(sid => sid !== id)
        .map(sid => {
          const si = items.find(i => i.id === sid)!;
          return { id: sid, patch: { x: si.x + dx, y: si.y + dy } };
        });
      patches.push({ id, patch: { x, y } });
      setItems(prev => prev.map(i => {
        const p = patches.find(pp => pp.id === i.id);
        return p ? { ...i, ...p.patch } : i;
      }));
      await dbUpdateItems(patches);
    } else {
      await updateItem(id, { x, y });
    }
    pushHistory(items);
  }

  async function handleResizeStop(id: string, x: number, y: number, w: number, h: number) {
    await updateItem(id, { x, y, width: w, height: h });
    pushHistory(items);
  }

  async function handleDeleteSelected() {
    if (!selectedIds.length) return;
    setSaving(true);
    const next = items.filter(i => !selectedIds.includes(i.id));
    await dbDeleteItems(selectedIds);
    setItems(normalizeZIndices(next));
    setSelectedIds([]);
    pushHistory(next);
    setSaving(false);
  }

  function handleSelect(id: string, additive: boolean) {
    setSelectedIds(prev =>
      additive
        ? prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        : [id]
    );
  }

  function copySelected() {
    clipboard.current = items.filter(i => selectedIds.includes(i.id)).map(i => ({ ...i }));
  }

  async function pasteItems() {
    if (!clipboard.current.length) return;
    const maxZ = items.length ? Math.max(...items.map(i => i.z_index)) + 1 : 0;
    const created: DreamItem[] = [];
    for (let i = 0; i < clipboard.current.length; i++) {
      const src = clipboard.current[i];
      const { id: _id, ...srcWithoutId } = src;
      const c = await dbCreateItem({ ...srcWithoutId, x: src.x + 24, y: src.y + 24, z_index: maxZ + i });
      if (c) created.push(c);
    }
    clipboard.current = created;
    const next = normalizeZIndices([...items, ...created]);
    setItems(next);
    setSelectedIds(created.map(c => c.id));
    pushHistory(next);
  }

  // ── Alignment ────────────────────────────────────────────────────────────────
  async function alignItems(mode: string) {
    if (selectedIds.length < 2) return;
    const sel = items.filter(i => selectedIds.includes(i.id));
    const minX = Math.min(...sel.map(i => i.x));
    const minY = Math.min(...sel.map(i => i.y));
    const maxX = Math.max(...sel.map(i => i.x + i.width));
    const maxY = Math.max(...sel.map(i => i.y + i.height));
    const cx   = (minX + maxX) / 2;
    const cy   = (minY + maxY) / 2;

    const patches = sel.map(item => {
      let x = item.x, y = item.y;
      if (mode === 'left')    x = minX;
      if (mode === 'right')   x = maxX - item.width;
      if (mode === 'centerH') x = cx - item.width / 2;
      if (mode === 'top')     y = minY;
      if (mode === 'bottom')  y = maxY - item.height;
      if (mode === 'middleV') y = cy - item.height / 2;
      return { id: item.id, patch: { x, y } };
    });
    setItems(prev => prev.map(i => {
      const p = patches.find(pp => pp.id === i.id);
      return p ? { ...i, ...p.patch } : i;
    }));
    await dbUpdateItems(patches);
    pushHistory(items);
  }

  // ── Z-order ──────────────────────────────────────────────────────────────────
  async function bringForward(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const above = items.filter(i => i.z_index > item.z_index).sort((a, b) => a.z_index - b.z_index)[0];
    if (!above) return;
    const next = items.map(i =>
      i.id === id ? { ...i, z_index: above.z_index } :
      i.id === above.id ? { ...i, z_index: item.z_index } : i
    );
    setItems(next);
    await dbUpdateItems([{ id: item.id, patch: { z_index: above.z_index } }, { id: above.id, patch: { z_index: item.z_index } }]);
  }

  async function sendBack(id: string) {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const below = items.filter(i => i.z_index < item.z_index).sort((a, b) => b.z_index - a.z_index)[0];
    if (!below) return;
    const next = items.map(i =>
      i.id === id ? { ...i, z_index: below.z_index } :
      i.id === below.id ? { ...i, z_index: item.z_index } : i
    );
    setItems(next);
    await dbUpdateItems([{ id: item.id, patch: { z_index: below.z_index } }, { id: below.id, patch: { z_index: item.z_index } }]);
  }

  // ── Fit to screen ─────────────────────────────────────────────────────────────
  function fitToScreen() {
    if (!items.length || !canvasRef.current) { setZoom(0.5); setPanOffset({ x: 0, y: 0 }); return; }
    const minX = Math.min(...items.map(i => i.x));
    const minY = Math.min(...items.map(i => i.y));
    const maxX = Math.max(...items.map(i => i.x + i.width));
    const maxY = Math.max(...items.map(i => i.y + i.height));
    const cw   = canvasRef.current.clientWidth;
    const ch   = canvasRef.current.clientHeight;
    const z    = Math.min(0.95, (cw * 0.85) / (maxX - minX), (ch * 0.85) / (maxY - minY));
    setZoom(z);
    setPanOffset({ x: (cw / 2) - ((minX + maxX) / 2) * z, y: (ch / 2) - ((minY + maxY) / 2) * z });
  }

  // ── Lasso handlers ────────────────────────────────────────────────────────────
  function onCanvasMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    if (isPanMode) {
      isPanning.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
      return;
    }
    if (e.target !== e.currentTarget) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = (e.clientX - rect.left - panOffset.x) / zoom;
    const sy = (e.clientY - rect.top  - panOffset.y) / zoom;
    lassoStart.current = { x: sx, y: sy };
    isLassoing.current = true;
    setLasso({ x: sx, y: sy, w: 0, h: 0 });
    if (!e.shiftKey) setSelectedIds([]);
  }

  function onCanvasMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (isPanning.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      setPanOffset({ x: panStartRef.current.ox + dx, y: panStartRef.current.oy + dy });
      return;
    }
    if (!isLassoing.current || !lassoStart.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = (e.clientX - rect.left - panOffset.x) / zoom;
    const cy = (e.clientY - rect.top  - panOffset.y) / zoom;
    setLasso({
      x: Math.min(cx, lassoStart.current.x),
      y: Math.min(cy, lassoStart.current.y),
      w: Math.abs(cx - lassoStart.current.x),
      h: Math.abs(cy - lassoStart.current.y),
    });
  }

  function onCanvasMouseUp(e: React.MouseEvent<HTMLDivElement>) {
    isPanning.current = false;
    if (!isLassoing.current || !lasso) { isLassoing.current = false; setLasso(null); return; }
    isLassoing.current = false;
    lassoStart.current = null;
    if (lasso.w < 8 && lasso.h < 8) { setLasso(null); return; }
    const hit = items.filter(item =>
      item.x < lasso.x + lasso.w &&
      item.x + item.width > lasso.x &&
      item.y < lasso.y + lasso.h &&
      item.y + item.height > lasso.y
    ).map(i => i.id);
    setSelectedIds(prev => e.shiftKey ? Array.from(new Set([...prev, ...hit])) : hit);
    setLasso(null);
  }

  // ── Template apply ────────────────────────────────────────────────────────────
  async function applyTemplate(tpl: typeof TEMPLATE_BOARDS[0]) {
    const maxZ = items.length ? Math.max(...items.map(i => i.z_index)) + 1 : 0;
    const created: DreamItem[] = [];
    for (let i = 0; i < tpl.items.length; i++) {
      const t = tpl.items[i];
      const base: Omit<DreamItem, 'id'> = {
        board_id: board.id, type: t.type || 'text', x: t.x ?? 100, y: t.y ?? 100,
        width: t.width ?? 260, height: t.height ?? 140,
        rotation: 0, z_index: maxZ + i,
        content: t.content, image_url: t.image_url, author: t.author, title: t.title,
        color: t.color || '#ffffff', bg_color: t.bg_color,
        font_size: t.font_size ?? 16, font_family: t.font_family ?? 'Inter',
        font_weight: t.font_weight ?? 'normal', text_align: (t.text_align as TextAlign) ?? 'left',
        letter_spacing: 0, is_uppercase: t.is_uppercase ?? false,
        opacity: 1, border_radius: t.border_radius ?? 12, is_locked: false,
      };
      const c = await dbCreateItem(base);
      if (c) created.push(c);
    }
    const next = normalizeZIndices([...items, ...created]);
    setItems(next);
    setSelectedIds(created.map(c => c.id));
    pushHistory(next);
    setPanelOpen(false);
  }

  // ── Image upload ──────────────────────────────────────────────────────────────
  async function handleImageUpload(file: File) {
    setSaving(true);
    const url = await uploadToStorage(file);
    if (url) await addItem('image', { image_url: url });
    setSaving(false);
  }

  // ── Add item from panel ────────────────────────────────────────────────────────
  async function handleAddFromPanel() {
    if (addType === 'sticker') {
      if (addSticker) await addItem('sticker', { content: addSticker });
      return;
    }
    if (addType === 'goal') {
      const items_list = addGoalItems.filter(Boolean).map(t => ({ text: t, done: false }));
      const gd: GoalData = { progress: addGoalPct, items: items_list };
      await addItem('goal', { title: addTitle || 'My Goal', content: JSON.stringify(gd) });
      setAddTitle(''); setAddGoalPct(0); setAddGoalItems(['']);
      return;
    }
    if (addType === 'image') {
      if (addImageUrl.trim()) {
        await addItem('image', { image_url: addImageUrl.trim() });
        setAddImageUrl('');
      } else {
        fileRef.current?.click();
      }
      return;
    }
    await addItem(addType, {
      content: addText || undefined,
      author:  addType === 'quote' ? (addAuthor || undefined) : undefined,
    });
    setAddText(''); setAddAuthor('');
  }

  // ── Derived ──────────────────────────────────────────────────────────────────
  const selectedItem = selectedIds.length === 1 ? items.find(i => i.id === selectedIds[0]) : null;
  const sorted = [...items].sort((a, b) => a.z_index - b.z_index);

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#070707]">
      <div className="w-6 h-6 border-2 border-white/20 border-t-[#00ff88] rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[#070707] text-white select-none" style={{ fontFamily: 'Inter, sans-serif' }}>

      {/* ── Top toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/8 bg-[#0a0a0a] flex-shrink-0">
        <button onClick={onBack}
          className="flex items-center gap-1.5 text-white/50 hover:text-white transition-colors text-sm mr-2">
          <ArrowLeft size={15} /> Back
        </button>

        <div className="h-5 w-px bg-white/10" />

        <span className="text-sm text-white/70 font-medium truncate max-w-[200px]">{board.title}</span>
        {board.period && <span className="text-xs text-white/30">{board.period}</span>}

        <div className="flex-1" />

        {/* Alignment tools — only when 2+ selected */}
        {selectedIds.length >= 2 && (
          <div className="flex items-center gap-0.5 bg-white/5 rounded-lg p-0.5 border border-white/8">
            {[
              { mode: 'left',    Icon: AlignStartVertical,      title: 'Align left'   },
              { mode: 'centerH', Icon: AlignCenterHorizontal,    title: 'Center H'     },
              { mode: 'right',   Icon: AlignEndVertical,         title: 'Align right'  },
              { mode: 'top',     Icon: AlignStartHorizontal,     title: 'Align top'    },
              { mode: 'middleV', Icon: AlignVerticalJustifyCenter, title: 'Center V'   },
              { mode: 'bottom',  Icon: AlignEndHorizontal,       title: 'Align bottom' },
            ].map(({ mode, Icon, title }) => (
              <button key={mode} onClick={() => alignItems(mode)} title={title}
                className="w-7 h-7 rounded-md flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all">
                <Icon size={13} />
              </button>
            ))}
          </div>
        )}

        <div className="h-5 w-px bg-white/10" />

        {/* Undo / Redo */}
        <button onClick={undoHistory} title="Undo (Ctrl+Z)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <Undo2 size={15} />
        </button>
        <button onClick={redoHistory} title="Redo (Ctrl+Y)"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <Redo2 size={15} />
        </button>

        <div className="h-5 w-px bg-white/10" />

        {/* Mode buttons */}
        <button onClick={() => setIsPanMode(p => !p)} title="Pan mode (H)"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            isPanMode ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/8'
          }`}>
          <Hand size={15} />
        </button>
        <button onClick={() => setSnapGrid(g => g === 1 ? 20 : 1)} title="Snap to grid"
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
            snapGrid > 1 ? 'bg-white/15 text-white' : 'text-white/40 hover:text-white hover:bg-white/8'
          }`}>
          <Grid3X3 size={15} />
        </button>
        <button onClick={fitToScreen} title="Fit to screen"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <Maximize2 size={15} />
        </button>

        <div className="h-5 w-px bg-white/10" />

        {/* Zoom */}
        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <ZoomOut size={13} />
        </button>
        <span className="text-xs text-white/40 w-10 text-center">{Math.round(zoom * 100)}%</span>
        <button onClick={() => setZoom(z => Math.min(3, z + 0.1))}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/8 transition-all">
          <ZoomIn size={13} />
        </button>

        {saving && <div className="w-4 h-4 border-2 border-white/20 border-t-[#00ff88] rounded-full animate-spin" />}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left icon bar ─────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1 py-3 px-1.5 bg-[#0a0a0a] border-r border-white/8 flex-shrink-0 w-11">
          {[
            { tab: 'elements'  as PanelTab, Icon: Layers,    title: 'Elements'  },
            { tab: 'templates' as PanelTab, Icon: RefreshCw, title: 'Templates' },
          ].map(({ tab, Icon, title }) => (
            <button key={tab}
              onClick={() => { setPanelTab(tab); setPanelOpen(o => panelTab === tab ? !o : true); }}
              title={title}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                panelOpen && panelTab === tab
                  ? 'bg-[#00ff88]/15 text-[#00ff88]'
                  : 'text-white/35 hover:text-white hover:bg-white/8'
              }`}>
              <Icon size={15} />
            </button>
          ))}
        </div>

        {/* ── Left slide-out panel ──────────────────────────────────────────── */}
        {panelOpen && (
          <div className="w-64 bg-[#0d0d0d] border-r border-white/8 flex flex-col overflow-hidden flex-shrink-0">
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <span className="text-xs font-medium text-white/60 uppercase tracking-wider">{panelTab}</span>
              <button onClick={() => setPanelOpen(false)} className="text-white/30 hover:text-white transition-colors">
                <XIcon size={14} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-3 pb-4">

              {/* Elements tab */}
              {panelTab === 'elements' && (
                <div className="space-y-4">
                  {/* Type selector */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {([ 'quote','text','image','sticker','goal' ] as ItemType[]).map(t => {
                      const icons: Record<ItemType, React.ReactNode> = {
                        quote:   <Quote size={14} />, text: <Type size={14} />,
                        image:   <Image size={14} />, sticker: <Smile size={14} />,
                        goal:    <Target size={14} />,
                      };
                      const labels: Record<ItemType, string> = {
                        quote: 'Quote', text: 'Text', image: 'Image', sticker: 'Sticker', goal: 'Goal',
                      };
                      return (
                        <button key={t} onClick={() => setAddType(t)}
                          className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-xs transition-all ${
                            addType === t
                              ? 'border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]'
                              : 'border-white/8 text-white/40 hover:border-white/20 hover:text-white/70'
                          }`}>
                          {icons[t]}<span>{labels[t]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Type-specific inputs */}
                  {addType === 'quote' && (
                    <div className="space-y-2">
                      <textarea value={addText} onChange={e => setAddText(e.target.value)}
                        placeholder="Your quote…"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 resize-none focus:outline-none focus:border-white/25 h-20" />
                      <input value={addAuthor} onChange={e => setAddAuthor(e.target.value)}
                        placeholder="Author (optional)"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25" />
                    </div>
                  )}

                  {addType === 'text' && (
                    <textarea value={addText} onChange={e => setAddText(e.target.value)}
                      placeholder="Your text…"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 resize-none focus:outline-none focus:border-white/25 h-20" />
                  )}

                  {addType === 'image' && (
                    <div className="space-y-2">
                      <input ref={fileRef} type="file" accept="image/*" className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleImageUpload(f); }} />
                      <button onClick={() => fileRef.current?.click()}
                        className="w-full h-16 border border-dashed border-white/15 hover:border-white/30 rounded-xl flex flex-col items-center justify-center gap-1.5 text-white/30 hover:text-white/50 transition-all text-xs">
                        <Upload size={16} /> Upload file
                      </button>
                      <div className="flex items-center gap-2 text-white/20 text-xs">
                        <div className="flex-1 h-px bg-white/10" /><span>or</span><div className="flex-1 h-px bg-white/10" />
                      </div>
                      <input value={addImageUrl} onChange={e => setAddImageUrl(e.target.value)}
                        placeholder="Paste image URL…"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25" />
                    </div>
                  )}

                  {addType === 'sticker' && (
                    <div>
                      <p className="text-xs text-white/30 mb-2">Pick a sticker</p>
                      <div className="grid grid-cols-6 gap-1">
                        {STICKERS.map(s => (
                          <button key={s} onClick={() => setAddSticker(s)}
                            className={`text-xl aspect-square rounded-lg flex items-center justify-center transition-all ${
                              addSticker === s ? 'bg-white/15 scale-110' : 'hover:bg-white/8'
                            }`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {addType === 'goal' && (
                    <div className="space-y-2">
                      <input value={addTitle} onChange={e => setAddTitle(e.target.value)}
                        placeholder="Goal title"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-white/25 focus:outline-none focus:border-white/25" />
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-white/40">
                          <span>Progress</span><span>{addGoalPct}%</span>
                        </div>
                        <input type="range" min={0} max={100} value={addGoalPct}
                          onChange={e => setAddGoalPct(Number(e.target.value))}
                          className="w-full accent-[#c49b66]" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-white/30">Checklist</p>
                        {addGoalItems.map((item, idx) => (
                          <div key={idx} className="flex gap-1">
                            <input value={item} onChange={e => {
                              const n = [...addGoalItems]; n[idx] = e.target.value; setAddGoalItems(n);
                            }}
                              placeholder={`Step ${idx + 1}`}
                              className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none" />
                            {addGoalItems.length > 1 && (
                              <button onClick={() => setAddGoalItems(p => p.filter((_, i) => i !== idx))}
                                className="text-white/20 hover:text-white/60 transition-colors px-1">×</button>
                            )}
                          </div>
                        ))}
                        <button onClick={() => setAddGoalItems(p => [...p, ''])}
                          className="text-xs text-white/30 hover:text-white/60 transition-colors">+ Add step</button>
                      </div>
                    </div>
                  )}

                  <button onClick={handleAddFromPanel}
                    className="w-full bg-[#00ff88]/12 hover:bg-[#00ff88]/20 border border-[#00ff88]/25 text-[#00ff88] rounded-xl py-2 text-xs font-medium transition-all flex items-center justify-center gap-1.5">
                    <Plus size={13} /> Add to canvas
                  </button>
                </div>
              )}


              {/* Templates tab */}
              {panelTab === 'templates' && (
                <div className="space-y-2">
                  {TEMPLATE_BOARDS.map(tpl => (
                    <button key={tpl.label} onClick={() => applyTemplate(tpl)}
                      className="w-full text-left px-3 py-3 bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-xl transition-all">
                      <p className="text-sm text-white/80 font-medium">{tpl.label}</p>
                      <p className="text-xs text-white/35 mt-0.5">{tpl.items.length} elements</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Canvas area ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-hidden relative" ref={canvasRef}
          style={{ cursor: isPanMode ? (isPanning.current ? 'grabbing' : 'grab') : 'crosshair' }}
          onMouseDown={onCanvasMouseDown}
          onMouseMove={onCanvasMouseMove}
          onMouseUp={onCanvasMouseUp}
          onMouseLeave={() => { isPanning.current = false; isLassoing.current = false; setLasso(null); }}>

          {/* Board surface */}
          <div
            style={{
              position: 'absolute',
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
              width: board.canvas_width,
              height: board.canvas_height,
              background: board.bg_color,
              boxShadow: '0 8px 60px rgba(0,0,0,0.6)',
            }}>
            {/* Items */}
            {sorted.map(item => (
              <CanvasItem
                key={item.id}
                item={item}
                isSelected={selectedIds.length === 1 && selectedIds[0] === item.id}
                isMultiSelected={selectedIds.length > 1 && selectedIds.includes(item.id)}
                zoom={zoom}
                snapGrid={snapGrid}
                onSelect={handleSelect}
                onUpdate={updateItem}
                onDragStop={handleDragStop}
                onResizeStop={handleResizeStop}
                onDelete={id => { dbDeleteItem(id); setItems(p => normalizeZIndices(p.filter(i => i.id !== id))); }}
                onContextMenu={(id, x, y) => { setSelectedIds([id]); setCtxMenu({ x, y, id }); }}
              />
            ))}

            {/* Lasso overlay */}
            {lasso && (
              <div className="pointer-events-none absolute border border-[#00ff88]/60 bg-[#00ff88]/8"
                style={{ left: lasso.x, top: lasso.y, width: lasso.w, height: lasso.h }} />
            )}

            {/* Snap grid dots */}
            {snapGrid > 1 && (
              <svg className="absolute inset-0 pointer-events-none opacity-[0.06]"
                width={board.canvas_width} height={board.canvas_height}>
                <defs>
                  <pattern id="snap-grid" x={0} y={0} width={snapGrid} height={snapGrid} patternUnits="userSpaceOnUse">
                    <circle cx={1} cy={1} r={0.8} fill="white" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#snap-grid)" />
              </svg>
            )}
          </div>

          {/* Bottom legend pill */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-black/70 backdrop-blur-md border border-white/10 rounded-full px-4 py-2 text-xs text-white/45 pointer-events-none">
            <span>{items.length} obj{items.length !== 1 ? 's' : ''}</span>
            <span className="w-px h-3 bg-white/15" />
            <span>{Math.round(zoom * 100)}%</span>
            {snapGrid > 1 && <><span className="w-px h-3 bg-white/15" /><span>Grid {snapGrid}px</span></>}
            {isPanMode && <><span className="w-px h-3 bg-white/15" /><span>Pan</span></>}
            {selectedIds.length > 0 && <><span className="w-px h-3 bg-white/15" /><span className="text-[#00ff88]">{selectedIds.length} selected</span></>}
          </div>

          {/* Quick-add floating button */}
          <button
            onClick={() => { setPanelTab('elements'); setPanelOpen(true); }}
            className="absolute bottom-4 right-4 flex items-center gap-2 bg-[#00ff88]/12 hover:bg-[#00ff88]/22 border border-[#00ff88]/30 text-[#00ff88] px-4 py-2 rounded-full text-xs font-medium transition-all backdrop-blur-md">
            <Plus size={13} /> ADD ITEM
          </button>

          {/* Context menu */}
          {ctxMenu && (() => {
            const ctxItem = items.find(i => i.id === ctxMenu.id);
            if (!ctxItem) return null;
            return (
              <>
                <div className="fixed inset-0 z-50" onClick={() => setCtxMenu(null)} />
                <div className="fixed z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
                  style={{ top: ctxMenu.y, left: ctxMenu.x }}>
                  <button onClick={() => { copySelected(); pasteItems(); setCtxMenu(null); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/8 transition-colors flex items-center gap-2">
                    <Copy size={12} /> Duplicate
                  </button>
                  <button onClick={() => { bringForward(ctxMenu.id); setCtxMenu(null); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/8 transition-colors flex items-center gap-2">
                    <ChevronsUp size={12} /> Bring forward
                  </button>
                  <button onClick={() => { sendBack(ctxMenu.id); setCtxMenu(null); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/8 transition-colors flex items-center gap-2">
                    <ChevronsDown size={12} /> Send back
                  </button>
                  <button onClick={() => { updateItem(ctxMenu.id, { is_locked: !ctxItem.is_locked }); setCtxMenu(null); }}
                    className="w-full text-left px-4 py-2.5 text-xs text-white/70 hover:bg-white/8 transition-colors flex items-center gap-2">
                    {ctxItem.is_locked ? <><Unlock size={12} /> Unlock</> : <><Lock size={12} /> Lock</>}
                  </button>
                  <div className="h-px bg-white/8 mx-2" />
                  <button onClick={() => {
                    dbDeleteItem(ctxMenu.id);
                    setItems(p => normalizeZIndices(p.filter(i => i.id !== ctxMenu.id)));
                    setSelectedIds([]);
                    setCtxMenu(null);
                  }} className="w-full text-left px-4 py-2.5 text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </>
            );
          })()}
        </div>

        {/* ── Right properties panel ────────────────────────────────────────── */}
        {selectedItem && (
          <div className="w-56 bg-[#0a0a0a] border-l border-white/8 flex flex-col overflow-y-auto flex-shrink-0">
            <div className="px-3 py-3 border-b border-white/8">
              <p className="text-xs font-medium text-white/50 uppercase tracking-wider">Properties</p>
            </div>
            <div className="p-3 space-y-4 flex-1">

              {/* Position & size */}
              <div>
                <p className="text-xs text-white/30 mb-1.5">Position & size</p>
                <div className="grid grid-cols-2 gap-1">
                  {[['X', 'x'], ['Y', 'y'], ['W', 'width'], ['H', 'height']].map(([label, key]) => (
                    <div key={key} className="flex items-center gap-1 bg-white/5 rounded-lg px-2 py-1.5">
                      <span className="text-xs text-white/25 w-3">{label}</span>
                      <input type="number" value={Math.round((selectedItem as any)[key])}
                        onChange={e => updateItem(selectedItem.id, { [key]: Number(e.target.value) })}
                        className="flex-1 bg-transparent text-xs text-white text-right outline-none w-0 min-w-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Rotation & opacity */}
              <div>
                <p className="text-xs text-white/30 mb-1.5">Transform</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/35 w-14">Rotation</span>
                    <input type="range" min={-180} max={180} value={selectedItem.rotation}
                      onChange={e => updateItem(selectedItem.id, { rotation: Number(e.target.value) })}
                      className="flex-1 accent-[#00ff88]" />
                    <span className="text-xs text-white/35 w-8 text-right">{selectedItem.rotation}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/35 w-14">Opacity</span>
                    <input type="range" min={0.1} max={1} step={0.05} value={selectedItem.opacity}
                      onChange={e => updateItem(selectedItem.id, { opacity: Number(e.target.value) })}
                      className="flex-1 accent-[#00ff88]" />
                    <span className="text-xs text-white/35 w-8 text-right">{Math.round(selectedItem.opacity * 100)}%</span>
                  </div>
                </div>
              </div>

              {/* Color */}
              <div>
                <p className="text-xs text-white/30 mb-1.5">Color</p>
                <div className="flex flex-wrap gap-1.5">
                  {ACCENT_COLORS.map(c => (
                    <button key={c} onClick={() => updateItem(selectedItem.id, { color: c })}
                      className={`w-5 h-5 rounded-full border-2 transition-all ${
                        selectedItem.color === c ? 'border-white scale-110' : 'border-transparent'
                      }`} style={{ background: c }} />
                  ))}
                </div>
              </div>

              {/* Goal editing */}
              {selectedItem.type === 'goal' && (() => {
                const gd = parseGoalData(selectedItem.content);
                return (
                  <div>
                    <p className="text-xs text-white/30 mb-1.5">Goal</p>
                    <input value={selectedItem.title || ''}
                      onChange={e => updateItem(selectedItem.id, { title: e.target.value })}
                      placeholder="Goal title"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white mb-2 focus:outline-none focus:border-white/25" />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs text-white/35 w-12">Progress</span>
                      <input type="range" min={0} max={100} value={gd.progress}
                        onChange={e => {
                          const updated = { ...gd, progress: Number(e.target.value) };
                          updateItem(selectedItem.id, { content: JSON.stringify(updated) });
                        }}
                        className="flex-1 accent-[#c49b66]" />
                      <span className="text-xs text-white/35 w-8 text-right">{gd.progress}%</span>
                    </div>
                    <div className="space-y-1 mb-1">
                      {gd.items.map((gi, idx) => (
                        <div key={idx} className="flex items-center gap-1.5">
                          <button onClick={() => {
                            const updated = { ...gd, items: gd.items.map((x, i) => i === idx ? { ...x, done: !x.done } : x) };
                            updateItem(selectedItem.id, { content: JSON.stringify(updated) });
                          }}
                            className="w-3.5 h-3.5 rounded-full border flex-shrink-0 transition-all"
                            style={{ borderColor: gi.done ? '#c49b66' : 'rgba(255,255,255,0.2)', background: gi.done ? '#c49b66' : 'transparent' }} />
                          <input value={gi.text} onChange={e => {
                            const updated = { ...gd, items: gd.items.map((x, i) => i === idx ? { ...x, text: e.target.value } : x) };
                            updateItem(selectedItem.id, { content: JSON.stringify(updated) });
                          }}
                            className="flex-1 bg-transparent text-xs text-white/70 outline-none min-w-0" />
                          <button onClick={() => {
                            const updated = { ...gd, items: gd.items.filter((_, i) => i !== idx) };
                            updateItem(selectedItem.id, { content: JSON.stringify(updated) });
                          }} className="text-white/20 hover:text-white/60 px-0.5 flex-shrink-0">×</button>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => {
                      const updated = { ...gd, items: [...gd.items, { text: '', done: false }] };
                      updateItem(selectedItem.id, { content: JSON.stringify(updated) });
                    }} className="text-xs text-white/25 hover:text-white/50 transition-colors">+ Add step</button>
                  </div>
                );
              })()}

              {/* Font (for text/quote) */}
              {(selectedItem.type === 'text' || selectedItem.type === 'quote') && (
                <div>
                  <p className="text-xs text-white/30 mb-1.5">Typography</p>
                  <select value={selectedItem.font_family}
                    onChange={e => updateItem(selectedItem.id, { font_family: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none mb-2">
                    {FONTS.map(f => <option key={f.name} value={f.name}>{f.label}</option>)}
                  </select>
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-xs text-white/35 w-12">Size</span>
                    <input type="range" min={10} max={96} value={selectedItem.font_size}
                      onChange={e => updateItem(selectedItem.id, { font_size: Number(e.target.value) })}
                      className="flex-1 accent-[#00ff88]" />
                    <span className="text-xs text-white/35 w-6 text-right">{selectedItem.font_size}</span>
                  </div>
                  <div className="flex gap-1">
                    {([['left', AlignLeft], ['center', AlignCenter], ['right', AlignRight]] as [TextAlign, any][]).map(([a, Icon]) => (
                      <button key={a} onClick={() => updateItem(selectedItem.id, { text_align: a })}
                        className={`flex-1 h-7 rounded-lg flex items-center justify-center transition-all ${
                          selectedItem.text_align === a ? 'bg-white/15 text-white' : 'text-white/30 hover:bg-white/8'
                        }`}><Icon size={12} /></button>
                    ))}
                  </div>
                </div>
              )}

              {/* Border radius */}
              {selectedItem.type !== 'sticker' && (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-white/35 w-14">Radius</span>
                    <input type="range" min={0} max={60} value={selectedItem.border_radius}
                      onChange={e => updateItem(selectedItem.id, { border_radius: Number(e.target.value) })}
                      className="flex-1 accent-[#00ff88]" />
                    <span className="text-xs text-white/35 w-6 text-right">{selectedItem.border_radius}</span>
                  </div>
                </div>
              )}

              {/* Layer controls */}
              <div>
                <p className="text-xs text-white/30 mb-1.5">Layer</p>
                <div className="flex gap-1">
                  <button onClick={() => bringForward(selectedItem.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 rounded-lg py-1.5 text-xs text-white/50 transition-all">
                    <ChevronsUp size={12} /> Forward
                  </button>
                  <button onClick={() => sendBack(selectedItem.id)}
                    className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 rounded-lg py-1.5 text-xs text-white/50 transition-all">
                    <ChevronsDown size={12} /> Back
                  </button>
                </div>
              </div>

              {/* Lock / delete */}
              <div className="flex gap-1">
                <button onClick={() => updateItem(selectedItem.id, { is_locked: !selectedItem.is_locked })}
                  className="flex-1 flex items-center justify-center gap-1 bg-white/5 hover:bg-white/10 rounded-lg py-1.5 text-xs text-white/50 transition-all">
                  {selectedItem.is_locked ? <><Unlock size={11} /> Unlock</> : <><Lock size={11} /> Lock</>}
                </button>
                <button onClick={() => {
                  dbDeleteItem(selectedItem.id);
                  setItems(p => normalizeZIndices(p.filter(i => i.id !== selectedItem.id)));
                  setSelectedIds([]);
                }}
                  className="w-8 h-8 flex items-center justify-center bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-lg text-red-400 transition-all">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
