import { supabase } from '@/lib/supabase';

// ── Types ─────────────────────────────────────────────────────────────────────
export type BoardType = 'year' | 'quarter' | 'month' | 'custom';
export type ItemType  = 'image' | 'quote' | 'text' | 'sticker' | 'goal';
export type TextAlign = 'left' | 'center' | 'right';

export interface GoalData {
  progress: number;
  items: { text: string; done: boolean }[];
}

export interface DreamBoard {
  id: string;
  title: string;
  type: BoardType;
  period?: string;
  cover_url?: string;
  bg_color: string;
  is_infinite: boolean;
  canvas_width: number;
  canvas_height: number;
  created_at: string;
}

export interface DreamItem {
  id: string;
  board_id: string;
  type: ItemType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  z_index: number;
  content?: string;
  image_url?: string;
  author?: string;
  title?: string;
  color?: string;
  bg_color?: string;
  font_size: number;
  font_family: string;
  font_weight: string;
  text_align: TextAlign;
  letter_spacing: number;
  is_uppercase: boolean;
  opacity: number;
  border_radius: number;
  is_locked: boolean;
}

// ── Constants ─────────────────────────────────────────────────────────────────
export const FONTS = [
  { name: 'Inter',              label: 'Inter'         },
  { name: 'Playfair Display',   label: 'Playfair'      },
  { name: 'Bebas Neue',         label: 'Bebas Neue'    },
  { name: 'Dancing Script',     label: 'Dancing'       },
  { name: 'Cormorant Garamond', label: 'Cormorant'     },
  { name: 'Oswald',             label: 'Oswald'        },
  { name: 'Montserrat',         label: 'Montserrat'    },
  { name: 'DM Sans',            label: 'DM Sans'       },
  { name: 'JetBrains Mono',     label: 'Mono'          },
];

export const BOARD_THEMES = [
  { label: 'Pure Black', bg: '#0a0a0a',   preview: '#0a0a0a' },
  { label: 'Slate',      bg: '#111827',   preview: '#111827' },
  { label: 'Cosmic',     bg: 'linear-gradient(135deg,#0a0a1e 0%,#1a0838 50%,#0a1a2e 100%)', preview: '#110828' },
  { label: 'Aurora',     bg: 'linear-gradient(135deg,#0a1628 0%,#0d2d1a 45%,#1a0d2e 100%)', preview: '#0e1f23' },
  { label: 'Midnight',   bg: 'linear-gradient(180deg,#0d1117 0%,#080820 100%)',              preview: '#0d1117' },
  { label: 'Ember',      bg: 'linear-gradient(135deg,#1c0800 0%,#2e0f00 50%,#0a0303 100%)', preview: '#1c0800' },
  { label: 'Ocean',      bg: 'linear-gradient(160deg,#020c1b 0%,#0a2a4a 50%,#020c1b 100%)', preview: '#0a2a4a' },
  { label: 'Forest',     bg: 'linear-gradient(135deg,#050f05 0%,#0d2a12 100%)',              preview: '#0d1a0d' },
  { label: 'Warm Paper', bg: '#f0e8dc',   preview: '#f0e8dc' },
  { label: 'Cream',      bg: 'linear-gradient(135deg,#faf7f2 0%,#ede8e0 100%)',              preview: '#f5f2ec' },
];

export const ACCENT_COLORS = [
  '#ffffff','#d4af37','#f59e0b','#10b981','#3b82f6',
  '#8b5cf6','#ef4444','#ec4899','#06b6d4','#f97316',
  '#c084fc','#fb7185',
];

export const STICKERS = [
  '🔥','💎','⚡','🌟','👑','🎯','💪','🚀','✨','💰',
  '🌴','🧠','❤️','🏆','🌊','🎨','📚','🌙','☀️','🦁',
  '🎵','🍀','🦋','🌈','💫','🎉','🏠','✈️','🎓','💻',
  '🏋️','🧘','🎸','🌍','🐉','🦅','💡','🛸','🏄','🌺',
  '🍾','🥂','💝','🌿','🕊️','⭐','🏔️','🎆','🦊','🐺',
];

export const BOARD_TYPE_OPTIONS = [
  { type: 'year'    as BoardType, icon: '📅', label: 'Year',    desc: 'Full year vision',   periods: ['2025','2026','2027','2028'] },
  { type: 'quarter' as BoardType, icon: '📊', label: 'Quarter', desc: '3-month focus',      periods: ['Q1 2026','Q2 2026','Q3 2026','Q4 2026'] },
  { type: 'month'   as BoardType, icon: '🗓️', label: 'Month',   desc: 'Monthly intentions', periods: ['Jan 2026','Feb 2026','Mar 2026','Apr 2026','May 2026','Jun 2026','Jul 2026','Aug 2026','Sep 2026','Oct 2026','Nov 2026','Dec 2026'] },
  { type: 'custom'  as BoardType, icon: '✏️', label: 'Custom',  desc: 'Your own timeframe', periods: [] },
];

export const ITEM_DEFAULTS: Record<ItemType, Partial<DreamItem>> = {
  image:   { width: 300, height: 220, border_radius: 12 },
  quote:   { width: 300, height: 180, font_family: 'Playfair Display', font_size: 18, text_align: 'center', color: '#ffffff' },
  text:    { width: 260, height: 140, font_family: 'Inter',            font_size: 16, text_align: 'left',   color: '#ffffff' },
  sticker: { width: 120, height: 120 },
  goal:    { width: 280, height: 320, color: '#c49b66', border_radius: 16 },
};

export const TEMPLATE_BOARDS: { label: string; items: Partial<DreamItem>[] }[] = [
  {
    label: 'Vision Board',
    items: [
      { type: 'quote', x: 60,  y: 60,  width: 320, height: 160, content: 'Dream it. Believe it. Achieve it.', font_family: 'Playfair Display', font_size: 22, text_align: 'center', color: '#d4af37' },
      { type: 'text',  x: 420, y: 60,  width: 240, height: 120, content: 'My top goal this year', font_size: 15, color: '#ffffff' },
      { type: 'goal',  x: 60,  y: 260, width: 280, height: 300, content: '{"progress":0,"items":[{"text":"Define the goal","done":false},{"text":"Make a plan","done":false},{"text":"Take action","done":false}]}', color: '#c49b66' },
    ],
  },
  {
    label: 'Minimalist',
    items: [
      { type: 'text',  x: 80,  y: 80,  width: 500, height: 80,  content: '2026', font_family: 'Bebas Neue', font_size: 72, color: '#ffffff', is_uppercase: true },
      { type: 'quote', x: 80,  y: 200, width: 400, height: 140, content: 'The year everything changes.', font_family: 'Cormorant Garamond', font_size: 20, color: '#888888', text_align: 'left' },
    ],
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
export function parseGoalData(content?: string): GoalData {
  try { return JSON.parse(content || '{"progress":0,"items":[]}'); }
  catch { return { progress: 0, items: [] }; }
}

export function normalizeZIndices(list: DreamItem[]): DreamItem[] {
  const sorted = [...list].sort((a, b) => a.z_index - b.z_index);
  const idxMap: Record<string, number> = {};
  sorted.forEach((item, i) => { idxMap[item.id] = i; });
  return list.map(item => ({ ...item, z_index: idxMap[item.id] }));
}

export function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export function snapToGrid(val: number, grid: number) {
  return grid > 1 ? Math.round(val / grid) * grid : val;
}

// ── DB Operations ─────────────────────────────────────────────────────────────
const sb = () => supabase;

export async function uploadToStorage(file: File, folder = 'dreamboard'): Promise<string | null> {
  const ext  = file.name.split('.').pop();
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await sb().storage.from('images').upload(path, file, { upsert: false });
  if (error) return null;
  const { data } = sb().storage.from('images').getPublicUrl(path);
  return data.publicUrl;
}

export async function dbLoadBoards(): Promise<DreamBoard[]> {
  const { data } = await sb()
    .from('dreamboard_boards')
    .select('*')
    .order('created_at', { ascending: false });
  return (data as DreamBoard[]) || [];
}

export async function dbCreateBoard(board: Omit<DreamBoard, 'id' | 'created_at'>): Promise<DreamBoard | null> {
  const { data, error } = await sb()
    .from('dreamboard_boards')
    .insert(board)
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return data as DreamBoard;
}

export async function dbUpdateBoard(id: string, patch: Partial<DreamBoard>): Promise<void> {
  await sb().from('dreamboard_boards').update(patch).eq('id', id);
}

export async function dbDeleteBoard(id: string): Promise<void> {
  await sb().from('dreamboard_boards').delete().eq('id', id);
}

export async function dbLoadItems(boardId: string): Promise<DreamItem[]> {
  const { data } = await sb()
    .from('dreamboard_items')
    .select('*')
    .eq('board_id', boardId)
    .order('z_index', { ascending: true });
  return (data as DreamItem[]) || [];
}

export async function dbCreateItem(item: Omit<DreamItem, 'id'>): Promise<DreamItem | null> {
  const { data, error } = await sb()
    .from('dreamboard_items')
    .insert(item)
    .select()
    .single();
  if (error) { console.error(error); return null; }
  return data as DreamItem;
}

export async function dbUpdateItem(id: string, patch: Partial<DreamItem>): Promise<void> {
  await sb().from('dreamboard_items').update(patch).eq('id', id);
}

export async function dbUpdateItems(patches: { id: string; patch: Partial<DreamItem> }[]): Promise<void> {
  await Promise.all(patches.map(({ id, patch }) => dbUpdateItem(id, patch)));
}

export async function dbDeleteItem(id: string): Promise<void> {
  await sb().from('dreamboard_items').delete().eq('id', id);
}

export async function dbDeleteItems(ids: string[]): Promise<void> {
  await sb().from('dreamboard_items').delete().in('id', ids);
}
