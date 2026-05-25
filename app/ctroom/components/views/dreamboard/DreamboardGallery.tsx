'use client';

import React, { useState, useRef } from 'react';
import { Plus, Trash2, MoreHorizontal, Calendar, Target, Clock } from 'lucide-react';
import {
  DreamBoard, BoardType,
  BOARD_THEMES, BOARD_TYPE_OPTIONS,
  dbCreateBoard, dbDeleteBoard, dbUpdateBoard, uploadToStorage,
} from './DreamboardStore';

interface DreamboardGalleryProps {
  boards: DreamBoard[];
  onSelect: (board: DreamBoard) => void;
  onBoardCreated: (board: DreamBoard) => void;
  onBoardDeleted: (id: string) => void;
  onBoardUpdated: (id: string, patch: Partial<DreamBoard>) => void;
}

export function DreamboardGallery({
  boards, onSelect, onBoardCreated, onBoardDeleted, onBoardUpdated,
}: DreamboardGalleryProps) {
  const [showCreate, setShowCreate]   = useState(false);
  const [activeYear, setActiveYear]   = useState(new Date().getFullYear().toString());
  const [menuBoardId, setMenuBoardId] = useState<string | null>(null);

  // Create form state
  const [newTitle,    setNewTitle]    = useState('');
  const [newType,     setNewType]     = useState<BoardType>('year');
  const [newPeriod,   setNewPeriod]   = useState('');
  const [newTheme,    setNewTheme]    = useState(BOARD_THEMES[0].bg);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverFile,   setCoverFile]   = useState<File | null>(null);
  const [creating,    setCreating]    = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const years = Array.from(
    new Set(boards.map(b => b.period?.match(/\d{4}/)?.[0]).filter(Boolean))
  ).sort((a, b) => Number(b) - Number(a)) as string[];
  const allYears = Array.from(new Set([new Date().getFullYear().toString(), ...years])).sort((a, b) => Number(b) - Number(a));

  const filteredBoards = boards.filter(b => {
    const y = b.period?.match(/\d{4}/)?.[0];
    return y === activeYear || (!y && activeYear === new Date().getFullYear().toString());
  });

  const selectedTypeOpts = BOARD_TYPE_OPTIONS.find(o => o.type === newType);

  async function handleCreate() {
    if (!newTitle.trim()) return;
    setCreating(true);
    let coverUrl: string | undefined;
    if (coverFile) coverUrl = (await uploadToStorage(coverFile)) ?? undefined;
    const board = await dbCreateBoard({
      title: newTitle.trim(),
      type: newType,
      period: newPeriod || undefined,
      cover_url: coverUrl,
      bg_color: newTheme,
      is_infinite: false,
      canvas_width: 2400,
      canvas_height: 1600,
    });
    if (board) {
      onBoardCreated(board);
      setShowCreate(false);
      setNewTitle(''); setNewType('year'); setNewPeriod(''); setCoverPreview(null); setCoverFile(null);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    await dbDeleteBoard(id);
    onBoardDeleted(id);
    setMenuBoardId(null);
  }

  return (
    <div className="flex flex-col h-full bg-[#070707] text-white">
      {/* Header */}
      <div className="flex items-center justify-between px-8 pt-8 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dreamboard</h1>
          <p className="text-white/40 text-sm mt-0.5">Your vision, visualized</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-[#00ff88]/10 hover:bg-[#00ff88]/20 border border-[#00ff88]/30 text-[#00ff88] px-4 py-2 rounded-xl text-sm font-medium transition-all"
        >
          <Plus size={15} /> New Board
        </button>
      </div>

      {/* Year tabs */}
      {allYears.length > 1 && (
        <div className="px-8 mb-4">
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl w-fit">
            {allYears.map(y => (
              <button
                key={y}
                onClick={() => setActiveYear(y)}
                className={`px-4 py-1.5 rounded-lg text-sm transition-all ${
                  activeYear === y
                    ? 'bg-white/10 border border-white/20 text-white font-medium'
                    : 'text-white/40 hover:text-white/70'
                }`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Board grid */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">
        {filteredBoards.length === 0 && !showCreate && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-4xl mb-3">🌠</div>
            <p className="text-white/40 text-sm">No boards for {activeYear} yet</p>
            <button
              onClick={() => setShowCreate(true)}
              className="mt-4 text-[#00ff88] text-sm hover:underline"
            >
              Create your first board
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBoards.map(board => (
            <BoardCard
              key={board.id}
              board={board}
              isMenuOpen={menuBoardId === board.id}
              onOpen={() => onSelect(board)}
              onMenuToggle={() => setMenuBoardId(menuBoardId === board.id ? null : board.id)}
              onDelete={() => handleDelete(board.id)}
              onMenuClose={() => setMenuBoardId(null)}
            />
          ))}

          {/* New board card */}
          <button
            onClick={() => setShowCreate(true)}
            className="aspect-[4/3] rounded-2xl border-2 border-dashed border-white/10 hover:border-white/25 flex flex-col items-center justify-center gap-2 text-white/30 hover:text-white/60 transition-all group"
          >
            <Plus size={24} className="group-hover:scale-110 transition-transform" />
            <span className="text-sm">New board</span>
          </button>
        </div>
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h2 className="text-lg font-semibold mb-5">Create a new board</h2>

            <input
              autoFocus
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              placeholder="Board title…"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 mb-4"
            />

            {/* Board type */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {BOARD_TYPE_OPTIONS.map(opt => (
                <button
                  key={opt.type}
                  onClick={() => { setNewType(opt.type); setNewPeriod(''); }}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all text-xs ${
                    newType === opt.type
                      ? 'border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]'
                      : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white/60'
                  }`}
                >
                  <span className="text-lg">{opt.icon}</span>
                  <span className="font-medium">{opt.label}</span>
                </button>
              ))}
            </div>

            {/* Period */}
            {selectedTypeOpts && selectedTypeOpts.periods.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-white/40 mb-2">Period</p>
                <div className="flex flex-wrap gap-2">
                  {selectedTypeOpts.periods.map(p => (
                    <button
                      key={p}
                      onClick={() => setNewPeriod(p)}
                      className={`px-3 py-1 rounded-lg text-xs border transition-all ${
                        newPeriod === p
                          ? 'border-[#00ff88]/40 bg-[#00ff88]/10 text-[#00ff88]'
                          : 'border-white/10 text-white/40 hover:border-white/20'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {newType === 'custom' && (
              <input
                value={newPeriod}
                onChange={e => setNewPeriod(e.target.value)}
                placeholder="Custom period (e.g. Summer 2026)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/30 mb-4"
              />
            )}

            {/* Theme */}
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-2">Background</p>
              <div className="flex flex-wrap gap-2">
                {BOARD_THEMES.map(t => (
                  <button
                    key={t.label}
                    onClick={() => setNewTheme(t.bg)}
                    title={t.label}
                    className={`w-8 h-8 rounded-lg border-2 transition-all ${
                      newTheme === t.bg ? 'border-white scale-110' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ background: t.preview }}
                  />
                ))}
              </div>
            </div>

            {/* Cover */}
            <div className="mb-6">
              <p className="text-xs text-white/40 mb-2">Cover image (optional)</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => {
                const f = e.target.files?.[0];
                if (!f) return;
                setCoverFile(f);
                setCoverPreview(URL.createObjectURL(f));
              }} />
              {coverPreview ? (
                <div className="relative h-24 rounded-xl overflow-hidden">
                  <img src={coverPreview} className="w-full h-full object-cover" />
                  <button onClick={() => { setCoverPreview(null); setCoverFile(null); }}
                    className="absolute top-2 right-2 bg-black/60 rounded-full p-1 text-white/80 hover:text-white">
                    ×
                  </button>
                </div>
              ) : (
                <button onClick={() => fileRef.current?.click()}
                  className="w-full h-16 border border-dashed border-white/15 rounded-xl text-white/30 text-sm hover:border-white/30 hover:text-white/50 transition-all">
                  Upload cover
                </button>
              )}
            </div>

            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowCreate(false)}
                className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newTitle.trim() || creating}
                className="px-5 py-2 bg-[#00ff88]/15 hover:bg-[#00ff88]/25 border border-[#00ff88]/30 text-[#00ff88] rounded-xl text-sm font-medium disabled:opacity-40 transition-all"
              >
                {creating ? 'Creating…' : 'Create board'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Board card ────────────────────────────────────────────────────────────────
function BoardCard({
  board, isMenuOpen, onOpen, onMenuToggle, onDelete, onMenuClose,
}: {
  board: DreamBoard;
  isMenuOpen: boolean;
  onOpen: () => void;
  onMenuToggle: () => void;
  onDelete: () => void;
  onMenuClose: () => void;
}) {
  const typeIcon = BOARD_TYPE_OPTIONS.find(o => o.type === board.type)?.icon ?? '📋';

  return (
    <div className="group relative">
      <button
        onClick={onOpen}
        className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-white/8 hover:border-white/20 transition-all relative"
        style={{ background: board.cover_url ? undefined : board.bg_color }}
      >
        {board.cover_url && (
          <img src={board.cover_url} className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
          <p className="text-white font-semibold text-sm leading-tight line-clamp-2">{board.title}</p>
          {board.period && (
            <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1">
              <span>{typeIcon}</span> {board.period}
            </p>
          )}
        </div>
      </button>

      {/* Menu button */}
      <button
        onClick={e => { e.stopPropagation(); onMenuToggle(); }}
        className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/50 backdrop-blur-sm flex items-center justify-center text-white/60 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        <MoreHorizontal size={14} />
      </button>

      {isMenuOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={onMenuClose} />
          <div className="absolute top-10 right-2 z-50 bg-[#1a1a1a] border border-white/10 rounded-xl shadow-2xl overflow-hidden min-w-[140px]">
            <button onClick={onOpen} className="w-full text-left px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 transition-colors">Open</button>
            <button onClick={onDelete} className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}
