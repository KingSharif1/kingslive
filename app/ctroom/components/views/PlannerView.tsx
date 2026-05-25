'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Plus, Inbox, Sun, CalendarDays, ChevronLeft,
    ChevronRight, Flame, Repeat, MoreHorizontal, Edit2,
    Trash2, Archive, Copy, Zap, Trophy, Target, Clock,
    ChevronDown, ChevronUp, TrendingUp, FileText, BookOpen, Send, X, Loader2,
    LayoutGrid, List, Circle, ArrowRight,
} from 'lucide-react';
import {
    format, isToday, isTomorrow, isPast, isAfter, isSameDay,
    addDays, subDays, startOfWeek, endOfWeek, eachDayOfInterval,
    startOfMonth, endOfMonth, addMonths, subMonths
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ActionItem, ActionItemPriority, DailyLog, Mission, System } from '../../types/';
import { CtroomDataService } from '../../services/ctroomDataService';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const XP_MAP: Record<ActionItemPriority, number> = {
    low: 5, medium: 10, high: 20, critical: 35
};

function loadStreak(): { count: number; lastDate: string } {
    try {
        const raw = localStorage.getItem('planner-streak');
        return raw ? JSON.parse(raw) : { count: 0, lastDate: '' };
    } catch { return { count: 0, lastDate: '' }; }
}

function calcStreak(items: ActionItem[]): number {
    const { count, lastDate } = loadStreak();
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    const completedToday = items.some(i => i.status === 'done' && isToday(i.date));
    if (completedToday) {
        if (lastDate === todayStr) return count;
        const newCount = lastDate === yesterdayStr ? count + 1 : 1;
        localStorage.setItem('planner-streak', JSON.stringify({ count: newCount, lastDate: todayStr }));
        return newCount;
    }
    if (lastDate === yesterdayStr || lastDate === todayStr) return count;
    return 0;
}

function calcTodayXP(items: ActionItem[]): number {
    return items
        .filter(i => i.status === 'done' && isToday(i.date))
        .reduce((sum, i) => sum + (XP_MAP[i.priority] || 10), 0);
}

function parseTimeInput(input: string): number {
    const c = input.trim().toLowerCase();
    const hm = c.match(/^(\d+)h\s*(\d+)m?$/);
    if (hm) return parseInt(hm[1]) * 60 + parseInt(hm[2]);
    const h = c.match(/^(\d+(?:\.\d+)?)h$/);
    if (h) return Math.round(parseFloat(h[1]) * 60);
    const m = c.match(/^(\d+)m$/);
    if (m) return parseInt(m[1]);
    const n = c.match(/^(\d+)$/);
    if (n) return parseInt(n[1]);
    return 0;
}

function formatMinutes(mins: number): string {
    if (!mins) return '';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0 && m > 0) return `${h}h ${m}m`;
    if (h > 0) return `${h}h`;
    return `${m}m`;
}

// ─── Confetti ─────────────────────────────────────────────────────────────────

const Confetti = ({ x, y }: { x: number; y: number }) => (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
        {[...Array(14)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{ opacity: 0, scale: 1.2, x: (Math.random() - 0.5) * 160, y: (Math.random() - 0.5) * 160, rotate: Math.random() * 360 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i % 5] }}
            />
        ))}
    </div>
);

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CFG: Record<ActionItemPriority, { dot: string; label: string }> = {
    low:      { dot: 'bg-zinc-400',   label: 'Low'      },
    medium:   { dot: 'bg-blue-400',   label: 'Medium'   },
    high:     { dot: 'bg-orange-400', label: 'High'     },
    critical: { dot: 'bg-red-500',    label: 'Critical' },
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlannerViewProps {
    actionItems: ActionItem[];
    missions: Mission[];
    systems: System[];
    toggleItemStatus: (id: string) => void;
    openItemModal: () => void;
    onDeleteItem: (id: string) => void;
    onArchiveItem: (id: string) => void;
    onDuplicateItem: (item: ActionItem) => void;
    onEditItem: (item: ActionItem) => void;
    onAddOvertime?: (date: Date, hours: number) => void;
    onUpdateSystem?: (system: System) => void;
}

type NavFilter = 'today' | 'inbox' | 'upcoming' | 'completed' | string;
type CalView = 'week' | 'month' | 'schedule';
type PlannerTab = 'tasks' | 'log' | 'reflection';

// ─── Main Component ───────────────────────────────────────────────────────────

export const PlannerView = ({
    actionItems, missions,
    toggleItemStatus, openItemModal, onDeleteItem, onArchiveItem, onDuplicateItem, onEditItem
}: PlannerViewProps) => {

    // ── Existing state ──
    const [nav, setNav] = useState<NavFilter>('today');
    const [confetti, setConfetti] = useState<{ x: number; y: number } | null>(null);
    const [menuId, setMenuId] = useState<string | null>(null);
    const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
    const [showCal, setShowCal] = useState(false);
    const [calView, setCalView] = useState<CalView>('schedule');
    const [calDate, setCalDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
    const [streak, setStreak] = useState(0);
    const [showDoneToday, setShowDoneToday] = useState(false);

    const [boardMode, setBoardMode] = useState<'board' | 'list'>('board');

    // ── Log / Reflection state ──
    const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
    const [plannerTab, setPlannerTab] = useState<PlannerTab>('tasks');
    const [logInput, setLogInput] = useState('');
    const [logProject, setLogProject] = useState('');
    const [logTime, setLogTime] = useState('');
    const [reflectionInput, setReflectionInput] = useState('');
    const [reflectionId, setReflectionId] = useState<string | null>(null);
    const [logSaving, setLogSaving] = useState(false);

    // ── Effects ──
    useEffect(() => { setStreak(calcStreak(actionItems)); }, [actionItems]);

    useEffect(() => {
        const handler = () => { setMenuId(null); setMenuPos(null); };
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    useEffect(() => { loadLogsForDate(); }, [selectedDate]);

    const loadLogsForDate = async () => {
        const dateStr = format(selectedDate, 'yyyy-MM-dd');
        const logs = await CtroomDataService.fetchDailyLogs(dateStr);
        setDailyLogs(logs);
        const ref = logs.find(l => l.type === 'reflection');
        if (ref) { setReflectionInput(ref.content); setReflectionId(ref.id); }
        else { setReflectionInput(''); setReflectionId(null); }
    };

    // ── Gamification ──
    const todayXP = actionItems.filter(i => i.status === 'done' && isSameDay(i.date, selectedDate)).reduce((sum, i) => sum + (XP_MAP[i.priority] || 10), 0);
    const todayTotal = actionItems.filter(i => isSameDay(i.date, selectedDate) || (isPast(i.date) && i.status !== 'done' && isSameDay(selectedDate, new Date()))).length;
    const todayDone = actionItems.filter(i => i.status === 'done' && isSameDay(i.date, selectedDate)).length;
    const winTheDay = todayTotal > 0 && todayDone >= todayTotal;
    const completionPct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

    // ── Log metrics ──
    const todayLogEntries = dailyLogs.filter(l => l.type === 'log');
    const totalLoggedMinutes = todayLogEntries.reduce((s, l) => s + (l.timeSpentMinutes || 0), 0);
    const timeLoggedStr = totalLoggedMinutes === 0 ? '0h' : formatMinutes(totalLoggedMinutes);

    // ── Filtering ──
    const getFiltered = () => {
        switch (nav) {
            case 'inbox':     return actionItems.filter(i => i.status !== 'done' && !i.missionId);
            case 'today':     return actionItems.filter(i => isSameDay(i.date, selectedDate) || (isPast(i.date) && i.status !== 'done'));
            case 'upcoming':  return actionItems.filter(i => i.status !== 'done' && isAfter(i.date, new Date()) && !isSameDay(i.date, selectedDate));
            case 'completed': return actionItems.filter(i => i.status === 'done');
            default:          return actionItems.filter(i => i.missionId === nav);
        }
    };
    const filtered = getFiltered();
    const overdue  = filtered.filter(i => i.status !== 'done' && isPast(i.date) && !isSameDay(i.date, selectedDate));
    const today    = filtered.filter(i => i.status !== 'done' && isSameDay(i.date, selectedDate));
    const tomorrow = filtered.filter(i => i.status !== 'done' && isSameDay(i.date, addDays(selectedDate, 1)));
    const later    = filtered.filter(i => i.status !== 'done' && isAfter(i.date, addDays(selectedDate, 1)));
    const done     = filtered.filter(i => i.status === 'done' && isSameDay(i.date, selectedDate));
    const priorityOrder: Record<ActionItemPriority, number> = { critical: 0, high: 1, medium: 2, low: 3 };
    const byPriority = (a: ActionItem, b: ActionItem) =>
        (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);

    // ── Calendar ──
    const weekDays  = eachDayOfInterval({ start: startOfWeek(calDate, { weekStartsOn: 1 }), end: endOfWeek(calDate, { weekStartsOn: 1 }) });
    const monthDays = eachDayOfInterval({ start: startOfMonth(calDate), end: endOfMonth(calDate) });
    const getItemsForDay = (day: Date) => actionItems.filter(i => isSameDay(i.date, day));

    // ── Handlers ──
    const handleCheck = (e: React.MouseEvent, id: string) => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setConfetti({ x: r.left + r.width / 2, y: r.top + r.height / 2 });
        toggleItemStatus(id);
        setTimeout(() => setConfetti(null), 800);
    };

    const openMenu = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setMenuPos({ top: r.bottom + 4, left: r.right - 176 });
        setMenuId(id);
    };

    const toggleSection = (key: string) =>
        setCollapsedSections(prev => prev.includes(key) ? prev.filter(x => x !== key) : [...prev, key]);

    const navCount = (id: NavFilter): number => {
        switch (id) {
            case 'inbox':     return actionItems.filter(i => i.status !== 'done' && !i.missionId).length;
            case 'today':     return actionItems.filter(i => (isToday(i.date) || isPast(i.date)) && i.status !== 'done').length;
            case 'upcoming':  return actionItems.filter(i => i.status !== 'done' && isAfter(i.date, new Date()) && !isToday(i.date)).length;
            case 'completed': return actionItems.filter(i => i.status === 'done').length;
            default:          return actionItems.filter(i => i.missionId === id && i.status !== 'done').length;
        }
    };

    // ── Log handlers ──
    const handleAddLog = async () => {
        if (!logInput.trim()) return;
        setLogSaving(true);
        const mins = logTime.trim() ? parseTimeInput(logTime) : undefined;
        const saved = await CtroomDataService.saveDailyLog({
            date: format(selectedDate, 'yyyy-MM-dd'),
            content: logInput.trim(),
            type: 'log',
            projectId: logProject || undefined,
            timeSpentMinutes: mins || undefined,
        });
        if (saved) {
            setDailyLogs(prev => [saved, ...prev]);
            setLogInput('');
            setLogTime('');
            setLogProject('');
        }
        setLogSaving(false);
    };

    const handleDeleteLog = async (id: string) => {
        const ok = await CtroomDataService.deleteDailyLog(id);
        if (ok) setDailyLogs(prev => prev.filter(l => l.id !== id));
    };

    const handleEditLog = async (id: string, content: string) => {
        const ok = await CtroomDataService.updateDailyLog(id, { content });
        if (ok) setDailyLogs(prev => prev.map(l => l.id === id ? { ...l, content } : l));
    };

    const handleSaveReflection = async () => {
        if (!reflectionInput.trim()) return;
        setLogSaving(true);
        if (reflectionId) {
            const ok = await CtroomDataService.updateDailyLog(reflectionId, { content: reflectionInput });
            if (ok) setDailyLogs(prev => prev.map(l => l.id === reflectionId ? { ...l, content: reflectionInput } : l));
        } else {
            const saved = await CtroomDataService.saveDailyLog({
                date: format(selectedDate, 'yyyy-MM-dd'),
                content: reflectionInput.trim(),
                type: 'reflection',
            });
            if (saved) { setDailyLogs(prev => [saved, ...prev]); setReflectionId(saved.id); }
        }
        setLogSaving(false);
    };

    // ─── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="h-full flex overflow-hidden font-inter" style={{ background: '#080808', color: '#e5e5e5' }}>
            {confetti && <Confetti x={confetti.x} y={confetti.y} />}

            {/* Context Menu */}
            <AnimatePresence>
                {menuId && menuPos && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 100, background: '#111', border: '1px solid rgba(255,255,255,0.1)' }}
                        className="w-44 rounded-xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {[
                            { icon: Edit2,   label: 'Edit',      action: () => { const i = actionItems.find(x => x.id === menuId); if (i) onEditItem(i); setMenuId(null); } },
                            { icon: Copy,    label: 'Duplicate', action: () => { const i = actionItems.find(x => x.id === menuId); if (i) onDuplicateItem(i); setMenuId(null); } },
                            { icon: Archive, label: 'Archive',   action: () => { onArchiveItem(menuId!); setMenuId(null); } },
                        ].map(({ icon: Icon, label, action }) => (
                            <button key={label} onClick={action} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm transition-colors text-left text-white/60 hover:text-white hover:bg-white/5">
                                <Icon size={13} className="text-white/30" /> {label}
                            </button>
                        ))}
                        <div className="border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                        <button onClick={() => { onDeleteItem(menuId!); setMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 size={13} /> Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Left Sidebar ─────────────────────────────────────────────── */}
            <div className="w-56 flex-shrink-0 flex flex-col overflow-y-auto hq-scroll" style={{ background: '#0a0a0a', borderRight: '1px solid rgba(255,255,255,0.05)' }}>

                {/* HQ breadcrumb */}
                <div className="px-4 py-3 flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/20" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <span>PLANNER</span>
                </div>

                {/* Streak + XP */}
                <div className="p-4 space-y-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                                streak > 0 ? "bg-orange-500/10 text-orange-400" : "bg-white/5 text-white/30")}>
                                <Flame size={16} />
                            </div>
                            <div>
                                <div className="font-mono text-lg font-bold text-white leading-none">{streak}</div>
                                <div className="text-[10px] text-white/30 font-mono">day streak</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-base font-bold leading-none" style={{ color: '#00ff88' }}>{todayXP}</div>
                            <div className="text-[10px] text-white/30 font-mono">{isToday(selectedDate) ? 'XP today' : 'XP earned'}</div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="font-mono text-[10px] text-white/30">{isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}</span>
                            <span className={cn("font-mono text-[10px] font-medium", winTheDay ? "text-emerald-400" : "text-white/60")}>
                                {winTheDay ? '🏆 Won!' : `${todayDone}/${todayTotal}`}
                            </span>
                        </div>
                        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPct}%` }}
                                className="h-full rounded-full"
                                style={{ background: winTheDay ? '#00ff88' : '#00ff88' }}
                            />
                        </div>
                    </div>
                </div>

                {/* Date Metrics */}
                {nav === 'today' && (
                    <div className="px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/25 mb-2.5">
                            {isToday(selectedDate) ? "Today's Metrics" : format(selectedDate, 'MMM d')} Metrics
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={11} className="text-blue-400" />
                                    <span className="text-xs text-white/40 font-mono">Time Logged</span>
                                </div>
                                <span className="font-mono text-xs text-white/70">{timeLoggedStr}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={11} className="text-emerald-400" />
                                    <span className="text-xs text-white/40 font-mono">To-Do</span>
                                </div>
                                <span className={cn("font-mono text-xs", winTheDay ? "text-emerald-400" : "text-white/70")}>
                                    {todayDone} / {todayTotal}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Task */}
                <div className="p-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={openItemModal}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl font-mono text-xs uppercase tracking-widest font-bold transition-all hover:opacity-90"
                        style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
                        <Plus size={14} /> Add Task
                    </button>
                </div>

                {/* Nav */}
                <div className="p-2 space-y-0.5">
                    {[
                        { id: 'today',     icon: Sun,          label: 'Today'    },
                        { id: 'inbox',     icon: Inbox,        label: 'Inbox'    },
                        { id: 'upcoming',  icon: CalendarDays, label: 'Upcoming' },
                        { id: 'completed', icon: CheckCircle2, label: 'Done'     },
                    ].map(({ id, icon: Icon, label }) => (
                        <button key={id}
                            onClick={() => { setNav(id as NavFilter); setShowCal(false); }}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all"
                            style={nav === id ? {
                                background: 'rgba(0,255,136,0.08)',
                                color: '#00ff88',
                                boxShadow: 'inset 2px 0 0 0 #00ff88',
                            } : { color: 'rgba(255,255,255,0.35)' }}>
                            <span className="flex items-center gap-2"><Icon size={14} /> {label}</span>
                            {navCount(id) > 0 && (
                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{ background: nav === id ? 'rgba(0,255,136,0.15)' : 'rgba(255,255,255,0.06)', color: nav === id ? '#00ff88' : 'rgba(255,255,255,0.3)' }}>
                                    {navCount(id)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Projects */}
                {missions.filter(m => m.status === 'active').length > 0 && (
                    <div className="p-2 pt-0">
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/20 px-3 py-2">
                            Projects
                        </div>
                        <div className="space-y-0.5">
                            {missions.filter(m => m.status === 'active').map(m => (
                                <button key={m.id}
                                    onClick={() => { setNav(m.id); setShowCal(false); }}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-mono transition-all"
                                    style={nav === m.id ? {
                                        background: 'rgba(0,255,136,0.08)',
                                        color: '#00ff88',
                                        boxShadow: 'inset 2px 0 0 0 #00ff88',
                                    } : { color: 'rgba(255,255,255,0.35)' }}>
                                    <span className="flex items-center gap-2 truncate min-w-0">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                                        <span className="truncate">{m.name}</span>
                                    </span>
                                    {navCount(m.id) > 0 && (
                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                                            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)' }}>
                                            {navCount(m.id)}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendar toggle */}
                <div className="p-2 mt-auto" style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                    <button onClick={() => setShowCal(v => !v)}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono transition-all"
                        style={showCal ? { background: 'rgba(0,255,136,0.08)', color: '#00ff88' } : { color: 'rgba(255,255,255,0.35)' }}>
                        <CalendarDays size={14} /> Calendar
                    </button>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-hidden flex flex-col">
                {showCal ? (
                    <CalendarPanel
                        calDate={calDate} setCalDate={setCalDate}
                        calView={calView} setCalView={v => { setCalView(v); }}
                        weekDays={weekDays} monthDays={monthDays}
                        selectedDay={selectedDate}
                        getItemsForDay={getItemsForDay}
                        actionItems={actionItems}
                        missions={missions}
                        onDayClick={(day) => { setSelectedDate(day); setCalDate(day); if (calView !== 'schedule') setShowCal(false); }}
                        onSlotClick={(_hour) => { openItemModal(); }}
                    />
                ) : (
                    <div className={`flex-1 overflow-y-auto hq-scroll p-6 w-full ${plannerTab === 'tasks' && boardMode === 'board' ? '' : 'max-w-3xl mx-auto'}`}>

                        {/* HQ Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedDate(subDays(selectedDate, 1))}
                                    className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/5">
                                    <ChevronLeft size={18} />
                                </button>
                                <h2 className="font-mono text-xl font-bold text-white uppercase tracking-tight">{format(selectedDate, 'EEEE, MMM d')}</h2>
                                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))}
                                    className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/5">
                                    <ChevronRight size={18} />
                                </button>
                                {!isToday(selectedDate) && (
                                    <button onClick={() => setSelectedDate(new Date())}
                                        className="px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest rounded-lg transition-colors text-white/40 hover:text-white hover:bg-white/5"
                                        style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
                                        Today
                                    </button>
                                )}
                            </div>
                            {nav === 'today' && (
                                <p className="font-mono text-xs text-white/30">
                                    {winTheDay ? 'Day complete. Exceptional work.' :
                                     todayTotal === 0 ? 'Nothing scheduled. Add a task.' :
                                     `${todayTotal - todayDone} remaining · `}
                                    {!winTheDay && todayTotal > 0 && (
                                        <span style={{ color: '#00ff88' }}>{completionPct}%</span>
                                    )}
                                </p>
                            )}
                            {nav === 'today' && todayXP > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold"
                                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', color: '#00ff88' }}>
                                    <Zap size={12} />
                                    <span>+{todayXP} XP</span>
                                </div>
                            )}
                        </div>

                        {/* Tab switcher + view toggle */}
                        <div className="flex items-center justify-between mb-5">
                            <div className="flex items-center gap-1 rounded-xl p-1 w-fit" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                {([
                                    { id: 'tasks' as PlannerTab,      icon: CheckCircle2, label: 'Tasks'   },
                                    { id: 'log' as PlannerTab,        icon: FileText,     label: 'Log'     },
                                    { id: 'reflection' as PlannerTab, icon: BookOpen,     label: 'Reflect' },
                                ]).map(({ id, icon: Icon, label }) => (
                                    <button key={id} onClick={() => setPlannerTab(id)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-mono text-[11px] uppercase tracking-widest font-medium transition-all"
                                        style={plannerTab === id ? {
                                            background: 'rgba(0,255,136,0.1)',
                                            color: '#00ff88',
                                            border: '1px solid rgba(0,255,136,0.2)',
                                        } : { color: 'rgba(255,255,255,0.3)' }}>
                                        <Icon size={11} /> {label}
                                    </button>
                                ))}
                            </div>
                            {plannerTab === 'tasks' && (
                                <div className="flex items-center gap-1 rounded-xl p-1" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                    <button onClick={() => setBoardMode('board')}
                                        className="p-1.5 rounded-lg transition-all"
                                        style={boardMode === 'board' ? { background: 'rgba(0,255,136,0.1)', color: '#00ff88' } : { color: 'rgba(255,255,255,0.3)' }}
                                        title="Board view">
                                        <LayoutGrid size={13} />
                                    </button>
                                    <button onClick={() => setBoardMode('list')}
                                        className="p-1.5 rounded-lg transition-all"
                                        style={boardMode === 'list' ? { background: 'rgba(0,255,136,0.1)', color: '#00ff88' } : { color: 'rgba(255,255,255,0.3)' }}
                                        title="List view">
                                        <List size={13} />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* ── Board view ── */}
                        {plannerTab === 'tasks' && boardMode === 'board' && (
                            <KanbanBoard
                                actionItems={actionItems}
                                missions={missions}
                                openItemModal={openItemModal}
                                onToggleStatus={toggleItemStatus}
                                onEditItem={onEditItem}
                                onDeleteItem={onDeleteItem}
                            />
                        )}

                        {/* ── Tasks Tab (list mode) ── */}
                        {plannerTab === 'tasks' && boardMode === 'list' && (
                            <div className="space-y-1">
                                {overdue.length > 0 && (
                                    <TaskSection label="Overdue" items={[...overdue].sort(byPriority)}
                                        collapsed={collapsedSections.includes('overdue')} onToggle={() => toggleSection('overdue')}
                                        labelClass="text-red-400" missions={missions} onCheck={handleCheck} onMenu={openMenu} urgent />
                                )}
                                {(nav === 'today' || nav === 'inbox' || missions.some(m => m.id === nav)) && (
                                    <TaskSection label="Today" items={[...today].sort(byPriority)}
                                        collapsed={collapsedSections.includes('today')} onToggle={() => toggleSection('today')}
                                        missions={missions} onCheck={handleCheck} onMenu={openMenu} emptyText="All clear for today." />
                                )}
                                {tomorrow.length > 0 && nav !== 'upcoming' && nav !== 'completed' && (
                                    <TaskSection label="Tomorrow" items={[...tomorrow].sort(byPriority)}
                                        collapsed={collapsedSections.includes('tomorrow')} onToggle={() => toggleSection('tomorrow')}
                                        missions={missions} onCheck={handleCheck} onMenu={openMenu} muted />
                                )}
                                {later.length > 0 && (nav === 'upcoming' || nav === 'inbox' || missions.some(m => m.id === nav)) && (
                                    <TaskSection label="Later" items={[...later].sort(byPriority)}
                                        collapsed={collapsedSections.includes('later')} onToggle={() => toggleSection('later')}
                                        missions={missions} onCheck={handleCheck} onMenu={openMenu} muted />
                                )}
                                {nav === 'upcoming' && (
                                    <UpcomingGrouped items={filtered} missions={missions} onCheck={handleCheck} onMenu={openMenu} />
                                )}
                                {(nav === 'today' || nav === 'completed') && done.length > 0 && (
                                    <div className="mt-4">
                                        <button onClick={() => setShowDoneToday(v => !v)}
                                            className="flex items-center gap-2 text-xs mb-2 px-1 transition-colors"
                                            style={{ color: 'rgba(255,255,255,0.3)' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}>
                                            {showDoneToday ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                            <span className="font-mono uppercase tracking-widest text-[10px] font-semibold">
                                                Completed ({done.length})
                                            </span>
                                        </button>
                                        <AnimatePresence>
                                            {showDoneToday && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-1">
                                                    {done.map(item => (
                                                        <TaskRow key={item.id} item={item} missions={missions} onCheck={handleCheck} onMenu={openMenu} done />
                                                    ))}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}
                                {filtered.length === 0 && nav !== 'upcoming' && (
                                    <div className="text-center py-20">
                                        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                            {winTheDay ? <Trophy size={28} className="text-emerald-400" /> : <Target size={28} style={{ color: 'rgba(255,255,255,0.3)' }} />}
                                        </div>
                                        <p className="font-mono text-sm font-semibold mb-1" style={{ color: '#e5e5e5' }}>
                                            {winTheDay ? 'Day won.' : 'Nothing here yet.'}
                                        </p>
                                        <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                            {winTheDay ? 'All tasks complete. Rest up.' : 'Add a task to get started.'}
                                        </p>
                                        {!winTheDay && (
                                            <button onClick={openItemModal}
                                                className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-xl text-sm font-mono font-medium"
                                                style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}>
                                                <Plus size={14} /> Add Task
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ── Log Tab ── */}
                        {plannerTab === 'log' && (
                            <LogTab
                                logs={todayLogEntries}
                                missions={missions}
                                logInput={logInput}
                                setLogInput={setLogInput}
                                logProject={logProject}
                                setLogProject={setLogProject}
                                logTime={logTime}
                                setLogTime={setLogTime}
                                onAdd={handleAddLog}
                                onDelete={handleDeleteLog}
                                onEdit={handleEditLog}
                                saving={logSaving}
                            />
                        )}

                        {/* ── Reflection Tab ── */}
                        {plannerTab === 'reflection' && (
                            <ReflectionTab
                                value={reflectionInput}
                                onChange={setReflectionInput}
                                onSave={handleSaveReflection}
                                saving={logSaving}
                                savedAt={dailyLogs.find(l => l.type === 'reflection')?.createdAt}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

// ─── Task Section ─────────────────────────────────────────────────────────────

function TaskSection({ label, items, collapsed, onToggle, labelClass, missions, onCheck, onMenu, urgent, muted, emptyText }: {
    label: string; items: ActionItem[]; collapsed: boolean; onToggle: () => void;
    labelClass?: string; missions: Mission[]; urgent?: boolean; muted?: boolean; emptyText?: string;
    onCheck: (e: React.MouseEvent, id: string) => void;
    onMenu: (e: React.MouseEvent, id: string) => void;
}) {
    return (
        <div className="mb-5">
            <button onClick={onToggle}
                className="flex items-center gap-2 w-full mb-2 px-1 hover:opacity-80 transition-opacity">
                {collapsed ? <ChevronDown size={12} className="text-white/30" /> : <ChevronUp size={12} className="text-white/30" />}
                <span className={cn("font-mono text-[10px] font-semibold uppercase tracking-widest", labelClass || "text-white/30")}>
                    {label}
                </span>
                {items.length > 0 && (
                    <span className="font-mono text-[10px] text-white/20">· {items.length}</span>
                )}
            </button>
            <AnimatePresence>
                {!collapsed && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-1">
                        {items.length === 0 && emptyText && (
                            <p className="font-mono text-[11px] text-white/25 px-1 py-2">{emptyText}</p>
                        )}
                        {items.map(item => (
                            <TaskRow key={item.id} item={item} missions={missions} onCheck={onCheck} onMenu={onMenu} muted={muted} />
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Task Row ─────────────────────────────────────────────────────────────────

function TaskRow({ item, missions, onCheck, onMenu, done = false, muted = false }: {
    item: ActionItem; missions: Mission[]; done?: boolean; muted?: boolean;
    onCheck: (e: React.MouseEvent, id: string) => void;
    onMenu: (e: React.MouseEvent, id: string) => void;
}) {
    const mission = missions.find(m => m.id === item.missionId);
    const cfg = PRIORITY_CFG[item.priority];
    const isOverdue = !done && isPast(item.date) && !isToday(item.date);

    return (
        <motion.div layout initial={{ opacity: 0, y: -4 }} animate={{ opacity: done || muted ? 0.6 : 1, y: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all"
            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(0,255,136,0.15)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; }}>
            <button onClick={e => onCheck(e, item.id)}
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={done ? {
                    background: '#00ff88', borderColor: '#00ff88', color: '#000',
                } : item.priority === 'critical' ? {
                    borderColor: '#ef4444',
                } : item.priority === 'high' ? {
                    borderColor: '#f97316',
                } : {
                    borderColor: 'rgba(255,255,255,0.2)',
                }}>
                {done && <CheckCircle2 size={11} />}
            </button>
            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} title={cfg.label} />
            <div className="flex-1 min-w-0">
                <span className={cn("text-sm leading-snug", done ? "line-through text-white/30" : "text-white/85")}>
                    {item.title}
                </span>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {mission && (
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: `${mission.color}15`, color: mission.color }}>
                            {mission.name.toUpperCase().slice(0, 10)}
                        </span>
                    )}
                    {item.systemId && (
                        <span className="font-mono text-[10px] text-emerald-400 flex items-center gap-0.5">
                            <Repeat size={9} /> Routine
                        </span>
                    )}
                    {isOverdue && (
                        <span className="font-mono text-[10px] text-red-400">{format(item.date, 'MMM d')}</span>
                    )}
                    {!isOverdue && !isToday(item.date) && !done && (
                        <span className="font-mono text-[10px] text-white/25">{format(item.date, 'MMM d')}</span>
                    )}
                    {item.dueTime && (
                        <span className="font-mono text-[10px] text-white/25 flex items-center gap-0.5">
                            <Clock size={9} /> {item.dueTime}
                        </span>
                    )}
                    {!done && (
                        <span className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#00ff88' }}>
                            +{XP_MAP[item.priority]}xp
                        </span>
                    )}
                </div>
            </div>
            <button onClick={e => onMenu(e, item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-white/25 hover:text-white rounded-lg hover:bg-white/5 transition-all flex-shrink-0">
                <MoreHorizontal size={14} />
            </button>
        </motion.div>
    );
}

// ─── Upcoming Grouped ─────────────────────────────────────────────────────────

function UpcomingGrouped({ items, missions, onCheck, onMenu }: {
    items: ActionItem[]; missions: Mission[];
    onCheck: (e: React.MouseEvent, id: string) => void;
    onMenu: (e: React.MouseEvent, id: string) => void;
}) {
    const pending = items.filter(i => i.status !== 'done' && isAfter(i.date, new Date()) && !isToday(i.date));
    const byDate: Record<string, ActionItem[]> = {};
    for (const item of pending) {
        const key = format(item.date, 'yyyy-MM-dd');
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(item);
    }
    const sortedDates = Object.keys(byDate).sort();

    if (sortedDates.length === 0)
        return <p className="text-sm text-center py-12" style={{ color: 'rgba(255,255,255,0.3)' }}>No upcoming tasks.</p>;

    return (
        <div className="space-y-5">
            {sortedDates.map(dateKey => {
                const d = new Date(dateKey);
                return (
                    <div key={dateKey}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                {isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, MMM d')}
                            </span>
                            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                        </div>
                        <div className="space-y-1">
                            {byDate[dateKey].map(item => (
                                <TaskRow key={item.id} item={item} missions={missions} onCheck={onCheck} onMenu={onMenu} muted />
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// ─── Log Tab ──────────────────────────────────────────────────────────────────

function LogTab({ logs, missions, logInput, setLogInput, logProject, setLogProject, logTime, setLogTime, onAdd, onDelete, onEdit, saving }: {
    logs: DailyLog[]; missions: Mission[];
    logInput: string; setLogInput: (v: string) => void;
    logProject: string; setLogProject: (v: string) => void;
    logTime: string; setLogTime: (v: string) => void;
    onAdd: () => void; onDelete: (id: string) => void;
    onEdit: (id: string, content: string) => void;
    saving: boolean;
}) {
    const [hours, setHours] = useState('0');
    const [minutes, setMinutes] = useState('0');

    // Sync time picker with logTime state
    useEffect(() => {
        if (logTime) {
            const mins = parseTimeInput(logTime);
            setHours(Math.floor(mins / 60).toString());
            setMinutes((mins % 60).toString());
        }
    }, [logTime]);

    const handleTimeChange = (h: string, m: string) => {
        setHours(h);
        setMinutes(m);
        const totalMins = parseInt(h || '0') * 60 + parseInt(m || '0');
        setLogTime(totalMins > 0 ? formatMinutes(totalMins) : '');
    };
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState('');

    const startEdit = (log: DailyLog) => { setEditingId(log.id); setEditDraft(log.content); };
    const commitEdit = (id: string) => {
        if (editDraft.trim()) onEdit(id, editDraft.trim());
        setEditingId(null);
    };

    return (
        <div className="space-y-4">
            {/* Quick entry */}
            <div className="rounded-xl overflow-hidden transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <textarea
                    value={logInput}
                    onChange={e => setLogInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAdd(); } }}
                    placeholder="What did you work on? (Shift+Enter for new line, Enter to save)"
                    rows={3}
                    className="w-full px-4 pt-3 pb-2 bg-transparent text-sm resize-none outline-none leading-relaxed"
                    style={{ color: '#e5e5e5', caretColor: '#00ff88' }}
                />
                <div className="flex items-center gap-2 px-3 pb-3 pt-1" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <select value={logProject} onChange={e => setLogProject(e.target.value)}
                        className="font-mono text-xs px-2 py-1.5 rounded-lg outline-none flex-1 max-w-[140px]"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e5e5' }}>
                        <option value="">No project</option>
                        {missions.filter(m => m.status === 'active').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1">
                        <select value={hours} onChange={e => handleTimeChange(e.target.value, minutes)}
                            className="font-mono text-xs px-2 py-1.5 rounded-lg outline-none w-14"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e5e5' }}>
                            {[...Array(13)].map((_, i) => (
                                <option key={i} value={i}>{i}h</option>
                            ))}
                        </select>
                        <select value={minutes} onChange={e => handleTimeChange(hours, e.target.value)}
                            className="font-mono text-xs px-2 py-1.5 rounded-lg outline-none w-14"
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e5e5' }}>
                            <option value="0">0m</option>
                            <option value="15">15m</option>
                            <option value="30">30m</option>
                            <option value="45">45m</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{logInput.length}/500</span>
                        <button onClick={onAdd} disabled={!logInput.trim() || saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium disabled:opacity-40 transition-all"
                            style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}>
                            {saving ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                            Log
                        </button>
                    </div>
                </div>
            </div>

            {/* Log list header */}
            {logs.length > 0 && (
                <div className="font-mono text-[10px] font-semibold uppercase tracking-widest px-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                    Logs for {format(new Date(logs[0].date), 'EEE, d MMM')} · {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                </div>
            )}

            {/* Log entries */}
            {logs.length === 0 ? (
                <div className="text-center py-12">
                    <FileText size={32} className="mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                    <p className="text-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>No logs yet. What did you work on today?</p>
                    <p className="font-mono text-xs mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>Press Enter to add quickly.</p>
                </div>
            ) : (
                <AnimatePresence>
                    <div className="space-y-1">
                        {logs.map(log => {
                            const mission = missions.find(m => m.id === log.projectId);
                            const isEditing = editingId === log.id;
                            return (
                                <motion.div key={log.id} layout initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 12 }}
                                    className="group flex items-start gap-3 px-4 py-3 rounded-xl transition-all"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'}>
                                    <FileText size={13} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        {isEditing ? (
                                            <textarea
                                                autoFocus
                                                value={editDraft}
                                                onChange={e => setEditDraft(e.target.value)}
                                                onBlur={() => commitEdit(log.id)}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); commitEdit(log.id); }
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                rows={2}
                                                className="w-full bg-transparent text-sm resize-none outline-none leading-snug"
                                                style={{ color: '#e5e5e5', caretColor: '#00ff88' }}
                                            />
                                        ) : (
                                            <p className="text-sm leading-snug" style={{ color: '#e5e5e5' }}>{log.content}</p>
                                        )}
                                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                            {mission && (
                                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded font-medium"
                                                    style={{ backgroundColor: `${mission.color}15`, color: mission.color }}>
                                                    {mission.name.toUpperCase().slice(0, 10)}
                                                </span>
                                            )}
                                            {log.timeSpentMinutes && (
                                                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                                                    {formatMinutes(log.timeSpentMinutes)}
                                                </span>
                                            )}
                                            <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                                {format(new Date(log.createdAt), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5">
                                        <button onClick={() => startEdit(log)}
                                            className="p-1 rounded transition-colors"
                                            style={{ color: 'rgba(255,255,255,0.3)' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#e5e5e5'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}>
                                            <Edit2 size={11} />
                                        </button>
                                        <button onClick={() => onDelete(log.id)}
                                            className="p-1 rounded transition-colors"
                                            style={{ color: 'rgba(255,255,255,0.3)' }}
                                            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = '#f87171'}
                                            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'}>
                                            <X size={12} />
                                        </button>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}
        </div>
    );
}

// ─── Reflection Tab ───────────────────────────────────────────────────────────

function ReflectionTab({ value, onChange, onSave, saving, savedAt }: {
    value: string; onChange: (v: string) => void;
    onSave: () => void; saving: boolean; savedAt?: Date;
}) {
    return (
        <div className="max-w-2xl space-y-3">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Daily Reflection
            </div>
            <div className="rounded-xl overflow-hidden transition-all" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="How did today go? What did you learn? What would you do differently? (Reflect on wins, challenges, and lessons)"
                    rows={10}
                    className="w-full px-4 py-3 bg-transparent text-sm resize-none outline-none leading-relaxed"
                    style={{ color: '#e5e5e5', caretColor: '#00ff88' }}
                />
                <div className="flex items-center justify-between px-4 pb-3 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div className="flex items-center gap-3">
                        {savedAt ? (
                            <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                                Saved {format(new Date(savedAt), 'HH:mm')}
                            </span>
                        ) : <span />}
                        <span className="text-[10px] font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>{value.length} chars</span>
                    </div>
                    <button onClick={onSave} disabled={saving || !value.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium disabled:opacity-40 transition-all"
                        style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.3)', color: '#00ff88' }}>
                        <BookOpen size={11} />
                        {saving ? 'Saving...' : 'Save Reflection'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Day Schedule (Time Grid) ─────────────────────────────────────────────────

const SCHEDULE_HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6am–11pm
const SLOT_PX = 64; // px per hour

function parseHourDecimal(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h + (m || 0) / 60;
}

function fmtHour(h: number): string {
    if (h === 0 || h === 24) return '12 AM';
    if (h === 12) return '12 PM';
    return h < 12 ? `${h} AM` : `${h - 12} PM`;
}

function priorityBg(priority: ActionItemPriority): { bg: string; border: string; color: string } {
    if (priority === 'critical') return { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.35)',  color: '#f87171' };
    if (priority === 'high')     return { bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.35)', color: '#fb923c' };
    if (priority === 'medium')   return { bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.35)', color: '#60a5fa' };
    return                              { bg: 'rgba(0,255,136,0.07)',  border: 'rgba(0,255,136,0.20)',  color: '#00ff88' };
}

function DaySchedulePanel({ day, actionItems, missions, onSlotClick }: {
    day: Date;
    actionItems: ActionItem[];
    missions: Mission[];
    onSlotClick: (hour: number) => void;
}) {
    const scheduleRef = React.useRef<HTMLDivElement>(null);
    const [nowPct, setNowPct] = React.useState(0);
    const showNow = isToday(day);

    // Compute "now" position
    React.useEffect(() => {
        function tick() {
            const now = new Date();
            const dec = now.getHours() + now.getMinutes() / 60;
            const offset = dec - SCHEDULE_HOURS[0];
            setNowPct((offset / SCHEDULE_HOURS.length) * 100);
        }
        tick();
        const id = setInterval(tick, 60000);
        return () => clearInterval(id);
    }, []);

    // Scroll to current hour on mount
    React.useEffect(() => {
        if (!scheduleRef.current || !showNow) return;
        const now = new Date();
        const offset = (now.getHours() - SCHEDULE_HOURS[0] - 1) * SLOT_PX;
        scheduleRef.current.scrollTop = Math.max(0, offset);
    }, [showNow]);

    const dayItems = actionItems.filter(i => isSameDay(i.date, day));
    const timedItems  = dayItems.filter(i => i.dueTime);
    const floatItems  = dayItems.filter(i => !i.dueTime);
    const doneItems   = dayItems.filter(i => i.status === 'done');
    const totalItems  = dayItems.length;
    const doneCount   = doneItems.length;

    return (
        <div className="flex flex-col h-full overflow-hidden">
            {/* Day header */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div>
                    <h2 className="font-mono text-base font-bold text-white uppercase tracking-tight">
                        {isToday(day) ? 'Today' : format(day, 'EEEE')} · {format(day, 'MMM d')}
                    </h2>
                    <p className="font-mono text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {totalItems === 0 ? 'No tasks — day is wide open' :
                         `${doneCount}/${totalItems} tasks · ${timedItems.length} scheduled`}
                    </p>
                </div>
                {totalItems > 0 && (
                    <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full transition-all" style={{ background: '#00ff88', width: `${totalItems > 0 ? (doneCount / totalItems) * 100 : 0}%` }} />
                    </div>
                )}
            </div>

            {/* Floating (unscheduled) tasks */}
            {floatItems.length > 0 && (
                <div className="px-6 py-2.5 flex gap-2 flex-wrap flex-shrink-0"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: 'rgba(255,255,255,0.01)' }}>
                    <span className="font-mono text-[10px] text-white/25 self-center">ANYTIME</span>
                    {floatItems.map(item => {
                        const { bg, border, color } = priorityBg(item.priority);
                        return (
                            <div key={item.id} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-[11px] max-w-[200px] truncate"
                                style={{ background: bg, border: `1px solid ${border}`, color, opacity: item.status === 'done' ? 0.4 : 1, textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>
                                {item.title}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Time grid */}
            <div ref={scheduleRef} className="flex-1 overflow-y-auto hq-scroll">
                <div style={{ position: 'relative', height: SCHEDULE_HOURS.length * SLOT_PX + 1 }}>

                    {/* "Now" indicator */}
                    {showNow && nowPct >= 0 && nowPct <= 100 && (
                        <div className="absolute left-0 right-0 z-20 flex items-center pointer-events-none"
                            style={{ top: `${nowPct}%` }}>
                            <div className="w-2 h-2 rounded-full ml-[56px] flex-shrink-0" style={{ background: '#ef4444' }} />
                            <div className="flex-1 h-px" style={{ background: '#ef4444', opacity: 0.6 }} />
                        </div>
                    )}

                    {/* Hour rows */}
                    {SCHEDULE_HOURS.map((h, idx) => {
                        const tasksAtHour = timedItems.filter(i => Math.floor(parseHourDecimal(i.dueTime!)) === h);
                        return (
                            <div key={h} style={{ position: 'absolute', top: idx * SLOT_PX, left: 0, right: 0, height: SLOT_PX }}
                                className="group flex">
                                {/* Hour label */}
                                <div className="w-14 flex-shrink-0 flex items-start pt-1 pl-4">
                                    <span className="font-mono text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>{fmtHour(h)}</span>
                                </div>
                                {/* Slot area */}
                                <div className="flex-1 relative border-t cursor-pointer transition-colors"
                                    style={{ borderColor: 'rgba(255,255,255,0.04)' }}
                                    onClick={() => onSlotClick(h)}
                                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.015)'}
                                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
                                    {/* Click hint */}
                                    <span className="absolute left-2 top-1 font-mono text-[9px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                                        style={{ color: 'rgba(0,255,136,0.5)' }}>+ add task</span>

                                    {/* Task chips */}
                                    {tasksAtHour.map((item, i) => {
                                        const { bg, border, color } = priorityBg(item.priority);
                                        const topOffset = (parseHourDecimal(item.dueTime!) - h) * SLOT_PX;
                                        const mission = missions.find(m => m.id === item.missionId);
                                        return (
                                            <div key={item.id}
                                                className="absolute left-2 right-2 rounded-lg px-2.5 py-1.5 overflow-hidden"
                                                style={{
                                                    top: topOffset + 4,
                                                    background: bg,
                                                    border: `1px solid ${border}`,
                                                    opacity: item.status === 'done' ? 0.45 : 1,
                                                    zIndex: i + 1,
                                                    marginLeft: i * 8,
                                                }}>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    {item.status === 'done' && <CheckCircle2 size={10} style={{ color }} className="flex-shrink-0" />}
                                                    <span className="font-mono text-[11px] truncate font-medium"
                                                        style={{ color, textDecoration: item.status === 'done' ? 'line-through' : 'none' }}>
                                                        {item.title}
                                                    </span>
                                                    {mission && (
                                                        <span className="font-mono text-[9px] px-1.5 rounded flex-shrink-0"
                                                            style={{ background: `${mission.color}18`, color: mission.color }}>
                                                            {mission.name.slice(0, 8)}
                                                        </span>
                                                    )}
                                                </div>
                                                {item.dueTime && (
                                                    <p className="font-mono text-[9px] mt-0.5" style={{ color: `${color}80` }}>{item.dueTime}</p>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// ─── Calendar Panel ───────────────────────────────────────────────────────────

function CalendarPanel({ calDate, setCalDate, calView, setCalView, weekDays, monthDays, selectedDay, getItemsForDay, actionItems, missions, onDayClick, onSlotClick }: {
    calDate: Date; setCalDate: (d: Date) => void;
    calView: CalView; setCalView: (v: CalView) => void;
    weekDays: Date[]; monthDays: Date[];
    selectedDay: Date;
    getItemsForDay: (d: Date) => ActionItem[];
    actionItems: ActionItem[];
    missions: Mission[];
    onDayClick: (d: Date) => void;
    onSlotClick: (hour: number) => void;
}) {
    const navigate = (dir: 1 | -1) => {
        if (calView === 'schedule') setCalDate(addDays(calDate, dir));
        else if (calView === 'week') setCalDate(addDays(calDate, dir * 7));
        else setCalDate(dir === 1 ? addMonths(calDate, 1) : subMonths(calDate, 1));
    };

    const label = calView === 'schedule'
        ? format(calDate, 'EEEE, MMMM d yyyy')
        : calView === 'week'
        ? `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
        : format(calDate, 'MMMM yyyy');

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Calendar header */}
            <div className="flex items-center justify-between px-6 py-3 flex-shrink-0"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <h2 className="font-mono text-sm font-bold text-white uppercase tracking-tight">{label}</h2>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        {([
                            { v: 'schedule' as CalView, label: 'Day' },
                            { v: 'week'     as CalView, label: 'Week' },
                            { v: 'month'    as CalView, label: 'Month' },
                        ]).map(({ v, label: vLabel }) => (
                            <button key={v} onClick={() => setCalView(v)}
                                className="px-2.5 py-1 rounded-lg font-mono text-[11px] uppercase tracking-widest font-medium transition-all"
                                style={calView === v ? {
                                    background: 'rgba(0,255,136,0.1)', color: '#00ff88', border: '1px solid rgba(0,255,136,0.2)',
                                } : { color: 'rgba(255,255,255,0.3)' }}>
                                {vLabel}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/5"><ChevronLeft size={14} /></button>
                    <button onClick={() => { setCalDate(new Date()); }}
                        className="px-2.5 py-1 font-mono text-[11px] uppercase tracking-widest rounded-lg transition-colors text-white/40 hover:text-white"
                        style={{ border: '1px solid rgba(255,255,255,0.08)' }}>Today</button>
                    <button onClick={() => navigate(1)} className="p-1.5 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/5"><ChevronRight size={14} /></button>
                </div>
            </div>

            {/* Views */}
            {calView === 'schedule' && (
                <div className="flex-1 overflow-hidden">
                    <DaySchedulePanel
                        day={calDate}
                        actionItems={actionItems}
                        missions={missions}
                        onSlotClick={onSlotClick}
                    />
                </div>
            )}

            {calView === 'week' && (
                <div className="p-4 overflow-y-auto hq-scroll flex-1">
                    <div className="grid grid-cols-7 gap-2">
                        {weekDays.map(day => {
                            const items = getItemsForDay(day);
                            return (
                                <div key={day.toISOString()} onClick={() => onDayClick(day)}
                                    className="min-h-[120px] rounded-xl p-2 cursor-pointer transition-all"
                                    style={isToday(day) ? {
                                        background: 'rgba(0,255,136,0.06)',
                                        border: '1px solid rgba(0,255,136,0.2)',
                                    } : {
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.06)',
                                    }}>
                                    <div className="flex flex-col items-center mb-2">
                                        <span className="font-mono text-[10px] text-white/30 uppercase">{format(day, 'EEE')}</span>
                                        <span className="font-mono text-sm font-bold mt-0.5" style={{ color: isToday(day) ? '#00ff88' : 'rgba(255,255,255,0.8)' }}>
                                            {format(day, 'd')}
                                        </span>
                                    </div>
                                    <div className="space-y-1">
                                        {items.slice(0, 4).map(item => (
                                            <div key={item.id} className="font-mono text-[10px] px-1.5 py-0.5 rounded truncate"
                                                style={item.status === 'done' ? {
                                                    background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.25)', textDecoration: 'line-through',
                                                } : item.priority === 'critical' ? {
                                                    background: 'rgba(239,68,68,0.12)', color: '#f87171',
                                                } : item.priority === 'high' ? {
                                                    background: 'rgba(249,115,22,0.12)', color: '#fb923c',
                                                } : {
                                                    background: 'rgba(0,255,136,0.08)', color: '#00ff88',
                                                }}>
                                                {item.dueTime && <span className="opacity-60 mr-1">{item.dueTime.slice(0,5)}</span>}
                                                {item.title}
                                            </div>
                                        ))}
                                        {items.length > 4 && (
                                            <div className="font-mono text-[10px] text-white/25 pl-1">+{items.length - 4}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {calView === 'month' && (
                <div className="p-4 overflow-y-auto hq-scroll flex-1">
                    <div className="grid grid-cols-7 mb-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="text-center font-mono text-[10px] font-semibold uppercase text-white/25 py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {[...Array((monthDays[0].getDay() + 6) % 7)].map((_, i) => <div key={`b${i}`} />)}
                        {monthDays.map(day => {
                            const items = getItemsForDay(day);
                            return (
                                <div key={day.toISOString()} onClick={() => onDayClick(day)}
                                    className="aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all p-1 hover:bg-white/5"
                                    style={isToday(day) ? { background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.25)' } : {}}>
                                    <span className="font-mono text-xs font-medium" style={{ color: isToday(day) ? '#00ff88' : 'rgba(255,255,255,0.7)' }}>
                                        {format(day, 'd')}
                                    </span>
                                    {items.length > 0 && (
                                        <div className="flex gap-0.5 mt-0.5">
                                            {items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className="w-1 h-1 rounded-full" style={{
                                                    background: item.status === 'done' ? '#00ff88' :
                                                    item.priority === 'critical' ? '#ef4444' :
                                                    item.priority === 'high' ? '#f97316' : 'rgba(0,255,136,0.5)',
                                                }} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Kanban Board ─────────────────────────────────────────────────────────────

const PRIORITY_BORDER: Record<ActionItemPriority, string> = {
    critical: '#ef4444',
    high:     '#f97316',
    medium:   '#3b82f6',
    low:      '#71717a',
};

interface KanbanBoardProps {
    actionItems: ActionItem[];
    missions: Mission[];
    openItemModal: () => void;
    onToggleStatus: (id: string) => void;
    onEditItem: (item: ActionItem) => void;
    onDeleteItem: (id: string) => void;
}

function KanbanBoard({ actionItems, missions, openItemModal, onToggleStatus, onEditItem, onDeleteItem }: KanbanBoardProps) {
    const pending    = actionItems.filter(i => i.status === 'todo');
    const inProgress = actionItems.filter(i => i.status === 'in-progress');
    const done       = actionItems.filter(i => i.status === 'done');

    const cols = [
        { id: 'todo',        label: 'To Do',       color: '#60a5fa', accent: 'rgba(96,165,250,0.12)', items: pending    },
        { id: 'in-progress', label: 'In Progress',  color: '#f59e0b', accent: 'rgba(245,158,11,0.12)', items: inProgress },
        { id: 'done',        label: 'Done',         color: '#10b981', accent: 'rgba(16,185,129,0.12)', items: done       },
    ];

    return (
        <div className="flex gap-4 overflow-x-auto pb-4 h-full" style={{ minHeight: '400px' }}>
            {cols.map(col => (
                <KanbanColumn
                    key={col.id}
                    label={col.label}
                    color={col.color}
                    accent={col.accent}
                    items={col.items}
                    missions={missions}
                    openItemModal={openItemModal}
                    onToggleStatus={onToggleStatus}
                    onEditItem={onEditItem}
                    onDeleteItem={onDeleteItem}
                />
            ))}
        </div>
    );
}

function KanbanColumn({
    label, color, accent, items, missions, openItemModal, onToggleStatus, onEditItem, onDeleteItem,
}: {
    label: string; color: string; accent: string;
    items: ActionItem[]; missions: Mission[];
    openItemModal: () => void;
    onToggleStatus: (id: string) => void;
    onEditItem: (item: ActionItem) => void;
    onDeleteItem: (id: string) => void;
}) {
    return (
        <div className="flex flex-col rounded-2xl flex-shrink-0 w-72"
            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {/* Column header */}
            <div className="flex items-center justify-between px-4 py-3 rounded-t-2xl"
                style={{ background: accent, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="font-mono text-[11px] uppercase tracking-widest font-bold" style={{ color }}>
                        {label}
                    </span>
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full"
                        style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}>
                        {items.length}
                    </span>
                </div>
                <button onClick={openItemModal}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                    style={{ color: 'rgba(255,255,255,0.4)' }}>
                    <Plus size={13} />
                </button>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto hq-scroll p-3 space-y-2">
                <AnimatePresence>
                    {items.map(item => (
                        <KanbanCard
                            key={item.id}
                            item={item}
                            missions={missions}
                            onToggleStatus={onToggleStatus}
                            onEditItem={onEditItem}
                            onDeleteItem={onDeleteItem}
                        />
                    ))}
                </AnimatePresence>
                {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <CheckCircle2 size={14} style={{ color: 'rgba(255,255,255,0.2)' }} />
                        </div>
                        <p className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>Empty</p>
                    </div>
                )}
            </div>

            {/* Quick add */}
            <button onClick={openItemModal}
                className="flex items-center gap-2 px-4 py-3 text-xs font-mono transition-all hover:bg-white/5 rounded-b-2xl"
                style={{ color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <Plus size={13} /> Add task
            </button>
        </div>
    );
}

function KanbanCard({
    item, missions, onToggleStatus, onEditItem, onDeleteItem,
}: {
    item: ActionItem; missions: Mission[];
    onToggleStatus: (id: string) => void;
    onEditItem: (item: ActionItem) => void;
    onDeleteItem: (id: string) => void;
}) {
    const mission  = missions.find(m => m.id === item.missionId);
    const isDone   = item.status === 'done';
    const isOverdue = !isDone && isPast(item.date) && !isToday(item.date);
    const isDueToday = !isDone && isToday(item.date);
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="group relative rounded-xl p-3 cursor-default transition-all"
            style={{
                background: isDone ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.07)',
                borderLeft: `3px solid ${isDone ? 'rgba(16,185,129,0.4)' : PRIORITY_BORDER[item.priority]}`,
            }}
            onMouseLeave={() => setMenuOpen(false)}
        >
            <div className="flex items-start gap-2.5">
                {/* Checkbox */}
                <button
                    onClick={() => onToggleStatus(item.id)}
                    className="mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                    style={isDone ? {
                        background: '#10b981', borderColor: '#10b981',
                    } : {
                        borderColor: PRIORITY_BORDER[item.priority] + '80',
                    }}
                >
                    {isDone && <CheckCircle2 size={10} className="text-white" />}
                </button>

                {/* Title */}
                <p className={`text-sm flex-1 leading-snug ${isDone ? 'line-through text-white/25' : 'text-white/80'}`}>
                    {item.title}
                </p>

                {/* Menu */}
                <div className="relative opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(v => !v); }}
                        className="p-1 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all">
                        <MoreHorizontal size={12} />
                    </button>
                    {menuOpen && (
                        <div className="absolute right-0 top-6 z-20 w-32 rounded-xl shadow-2xl overflow-hidden"
                            style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)' }}
                            onClick={e => e.stopPropagation()}>
                            <button onClick={() => { onEditItem(item); setMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-white/60 hover:bg-white/5 transition-colors">
                                <Edit2 size={11} /> Edit
                            </button>
                            <button onClick={() => { onDeleteItem(item.id); setMenuOpen(false); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-400/10 transition-colors">
                                <Trash2 size={11} /> Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Meta row */}
            <div className="flex items-center gap-2 mt-2 pl-6 flex-wrap">
                {mission && (
                    <span className="font-mono text-[9px] px-1.5 py-0.5 rounded-full font-medium uppercase tracking-wide"
                        style={{ background: `${mission.color}18`, color: mission.color }}>
                        {mission.name.slice(0, 12)}
                    </span>
                )}
                {isOverdue && (
                    <span className="font-mono text-[9px] text-red-400 font-medium">
                        {format(item.date, 'MMM d')} overdue
                    </span>
                )}
                {isDueToday && (
                    <span className="font-mono text-[9px] text-amber-400 font-medium">Due today</span>
                )}
                {!isOverdue && !isDueToday && !isDone && (
                    <span className="font-mono text-[9px] text-white/25">{format(item.date, 'MMM d')}</span>
                )}
                {item.dueTime && (
                    <span className="font-mono text-[9px] text-white/25 flex items-center gap-0.5">
                        <Clock size={8} /> {item.dueTime}
                    </span>
                )}
            </div>
        </motion.div>
    );
}
