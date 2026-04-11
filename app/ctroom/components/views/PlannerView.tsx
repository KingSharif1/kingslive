'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Plus, Inbox, Sun, CalendarDays, ChevronLeft,
    ChevronRight, Flame, Repeat, MoreHorizontal, Edit2,
    Trash2, Archive, Copy, Zap, Trophy, Target, Clock,
    ChevronDown, ChevronUp, TrendingUp, FileText, BookOpen, Send, X
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
type CalView = 'week' | 'month';
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
    const [calView, setCalView] = useState<CalView>('week');
    const [calDate, setCalDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
    const [streak, setStreak] = useState(0);
    const [showDoneToday, setShowDoneToday] = useState(false);

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
        <div className="h-full flex overflow-hidden font-inter">
            {confetti && <Confetti x={confetti.x} y={confetti.y} />}

            {/* Context Menu */}
            <AnimatePresence>
                {menuId && menuPos && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        style={{ position: 'fixed', top: menuPos.top, left: menuPos.left, zIndex: 100 }}
                        className="w-44 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                        onClick={e => e.stopPropagation()}
                    >
                        {[
                            { icon: Edit2,   label: 'Edit',      action: () => { const i = actionItems.find(x => x.id === menuId); if (i) onEditItem(i); setMenuId(null); } },
                            { icon: Copy,    label: 'Duplicate', action: () => { const i = actionItems.find(x => x.id === menuId); if (i) onDuplicateItem(i); setMenuId(null); } },
                            { icon: Archive, label: 'Archive',   action: () => { onArchiveItem(menuId!); setMenuId(null); } },
                        ].map(({ icon: Icon, label, action }) => (
                            <button key={label} onClick={action} className="w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary transition-colors text-left">
                                <Icon size={13} className="text-muted-foreground" /> {label}
                            </button>
                        ))}
                        <div className="border-t border-border" />
                        <button onClick={() => { onDeleteItem(menuId!); setMenuId(null); }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                            <Trash2 size={13} /> Delete
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── Left Sidebar ─────────────────────────────────────────────── */}
            <div className="w-56 flex-shrink-0 border-r border-border flex flex-col bg-card/40 overflow-y-auto">

                {/* Streak + XP */}
                <div className="p-4 border-b border-border space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center",
                                streak > 0 ? "bg-orange-500/10 text-orange-400" : "bg-secondary text-muted-foreground")}>
                                <Flame size={16} />
                            </div>
                            <div>
                                <div className="font-mono text-lg font-bold text-foreground leading-none">{streak}</div>
                                <div className="text-[10px] text-muted-foreground">day streak</div>
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono text-base font-bold text-primary leading-none">{todayXP}</div>
                            <div className="text-[10px] text-muted-foreground">{isToday(selectedDate) ? 'XP today' : 'XP earned'}</div>
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center justify-between text-xs mb-1.5">
                            <span className="text-muted-foreground">{isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMM d')}</span>
                            <span className={cn("font-mono font-medium", winTheDay ? "text-emerald-400" : "text-foreground")}>
                                {winTheDay ? '🏆 Won!' : `${todayDone}/${todayTotal}`}
                            </span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${completionPct}%` }}
                                className={cn("h-full rounded-full", winTheDay ? "bg-emerald-400" : "bg-primary")}
                            />
                        </div>
                    </div>
                </div>

                {/* Date Metrics */}
                {nav === 'today' && (
                    <div className="px-4 py-3 border-b border-border">
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-2.5">
                            {isToday(selectedDate) ? "Today's Metrics" : format(selectedDate, 'MMM d')} Metrics
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Clock size={11} className="text-blue-400" />
                                    <span className="text-xs text-muted-foreground">Time Logged</span>
                                </div>
                                <span className="font-mono text-xs text-foreground">{timeLoggedStr}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle2 size={11} className="text-emerald-400" />
                                    <span className="text-xs text-muted-foreground">To-Do</span>
                                </div>
                                <span className={cn("font-mono text-xs", winTheDay ? "text-emerald-400" : "text-foreground")}>
                                    {todayDone} / {todayTotal}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Task */}
                <div className="p-3 border-b border-border">
                    <button onClick={openItemModal}
                        className="w-full flex items-center gap-2 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-xl text-sm font-medium hover:bg-primary/20 transition-colors">
                        <Plus size={15} /> Add Task
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
                            className={cn(
                                "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                nav === id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}>
                            <span className="flex items-center gap-2"><Icon size={14} /> {label}</span>
                            {navCount(id) > 0 && (
                                <span className={cn("font-mono text-[10px] px-1.5 py-0.5 rounded-full",
                                    nav === id ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")}>
                                    {navCount(id)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Projects */}
                {missions.filter(m => m.status === 'active').length > 0 && (
                    <div className="p-2 pt-0">
                        <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-3 py-2">
                            Projects
                        </div>
                        <div className="space-y-0.5">
                            {missions.filter(m => m.status === 'active').map(m => (
                                <button key={m.id}
                                    onClick={() => { setNav(m.id); setShowCal(false); }}
                                    className={cn(
                                        "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                                        nav === m.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                                    )}>
                                    <span className="flex items-center gap-2 truncate min-w-0">
                                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                                        <span className="truncate">{m.name}</span>
                                    </span>
                                    {navCount(m.id) > 0 && (
                                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground flex-shrink-0">
                                            {navCount(m.id)}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendar toggle */}
                <div className="p-2 mt-auto border-t border-border">
                    <button onClick={() => setShowCal(v => !v)}
                        className={cn("w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                            showCal ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary")}>
                        <CalendarDays size={14} /> Calendar
                    </button>
                </div>
            </div>

            {/* ── Main Content ──────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto">
                {showCal ? (
                    <CalendarPanel
                        calDate={calDate} setCalDate={setCalDate}
                        calView={calView} setCalView={setCalView}
                        weekDays={weekDays} monthDays={monthDays}
                        getItemsForDay={getItemsForDay}
                        onDayClick={(day) => { setSelectedDate(day); setCalDate(day); setShowCal(false); }}
                    />
                ) : (
                    <div className="p-6 max-w-3xl mx-auto">

                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setSelectedDate(subDays(selectedDate, 1))} 
                                    className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                                    <ChevronLeft size={18} />
                                </button>
                                <h2 className="font-display text-2xl text-foreground">{format(selectedDate, 'EEEE, MMM d')}</h2>
                                <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} 
                                    className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                                    <ChevronRight size={18} />
                                </button>
                                {!isToday(selectedDate) && (
                                    <button onClick={() => setSelectedDate(new Date())} 
                                        className="px-2.5 py-1 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors">
                                        Today
                                    </button>
                                )}
                            </div>
                            {nav === 'today' && (
                                <p className="text-sm text-muted-foreground">
                                    {winTheDay ? 'Day complete. Exceptional work.' :
                                     todayTotal === 0 ? 'Nothing scheduled. Add a task.' :
                                     `${todayTotal - todayDone} remaining · `}
                                    {!winTheDay && todayTotal > 0 && (
                                        <span className="font-mono">{completionPct}% done</span>
                                    )}
                                </p>
                            )}
                            {nav === 'today' && todayXP > 0 && (
                                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 rounded-xl text-xs font-medium text-primary">
                                    <Zap size={12} />
                                    <span className="font-mono">+{todayXP} XP</span>
                                </div>
                            )}
                        </div>

                        {/* Tab switcher */}
                        <div className="flex items-center gap-1 mb-5 bg-card/60 border border-border rounded-xl p-1 w-fit">
                            {([
                                { id: 'tasks' as PlannerTab,      icon: CheckCircle2, label: 'Tasks'   },
                                { id: 'log' as PlannerTab,        icon: FileText,     label: 'Log'     },
                                { id: 'reflection' as PlannerTab, icon: BookOpen,     label: 'Reflect' },
                            ]).map(({ id, icon: Icon, label }) => (
                                <button key={id} onClick={() => setPlannerTab(id)}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                        plannerTab === id ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                                    )}>
                                    <Icon size={11} /> {label}
                                </button>
                            ))}
                        </div>

                        {/* ── Tasks Tab ── */}
                        {(nav !== 'today' || plannerTab === 'tasks') && (
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
                                            className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors mb-2 px-1">
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
                                        <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            {winTheDay ? <Trophy size={28} className="text-emerald-400" /> : <Target size={28} className="text-muted-foreground" />}
                                        </div>
                                        <p className="font-display text-base text-foreground mb-1">
                                            {winTheDay ? 'Day won.' : 'Nothing here yet.'}
                                        </p>
                                        <p className="text-xs text-muted-foreground mb-4">
                                            {winTheDay ? 'All tasks complete. Rest up.' : 'Add a task to get started.'}
                                        </p>
                                        {!winTheDay && (
                                            <button onClick={openItemModal}
                                                className="flex items-center gap-1.5 mx-auto px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium">
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
                {collapsed ? <ChevronDown size={12} className="text-muted-foreground" /> : <ChevronUp size={12} className="text-muted-foreground" />}
                <span className={cn("font-mono text-[10px] font-semibold uppercase tracking-widest", labelClass || "text-muted-foreground")}>
                    {label}
                </span>
                {items.length > 0 && (
                    <span className="font-mono text-[10px] text-muted-foreground">· {items.length}</span>
                )}
            </button>
            <AnimatePresence>
                {!collapsed && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }} className="overflow-hidden space-y-1">
                        {items.length === 0 && emptyText && (
                            <p className="text-xs text-muted-foreground px-1 py-2">{emptyText}</p>
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
            className="group flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-xl hover:border-primary/20 transition-all">
            <button onClick={e => onCheck(e, item.id)}
                className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all",
                    done ? "bg-primary border-primary text-primary-foreground" :
                    item.priority === 'critical' ? "border-red-500 hover:bg-red-500/20" :
                    item.priority === 'high' ? "border-orange-400 hover:bg-orange-400/20" :
                    "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
                )}>
                {done && <CheckCircle2 size={11} />}
            </button>
            <div className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} title={cfg.label} />
            <div className="flex-1 min-w-0">
                <span className={cn("text-sm leading-snug", done && "line-through text-muted-foreground")}>
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
                        <span className="font-mono text-[10px] text-muted-foreground">{format(item.date, 'MMM d')}</span>
                    )}
                    {item.dueTime && (
                        <span className="font-mono text-[10px] text-muted-foreground flex items-center gap-0.5">
                            <Clock size={9} /> {item.dueTime}
                        </span>
                    )}
                    {!done && (
                        <span className="font-mono text-[10px] text-primary/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            +{XP_MAP[item.priority]}xp
                        </span>
                    )}
                </div>
            </div>
            <button onClick={e => onMenu(e, item.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-all flex-shrink-0">
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
        return <p className="text-sm text-muted-foreground text-center py-12">No upcoming tasks.</p>;

    return (
        <div className="space-y-5">
            {sortedDates.map(dateKey => {
                const d = new Date(dateKey);
                return (
                    <div key={dateKey}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-px flex-1 bg-border" />
                            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                                {isTomorrow(d) ? 'Tomorrow' : format(d, 'EEE, MMM d')}
                            </span>
                            <div className="h-px flex-1 bg-border" />
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
            <div className="bg-card border-2 border-border rounded-xl overflow-hidden focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
                <textarea
                    value={logInput}
                    onChange={e => setLogInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onAdd(); } }}
                    placeholder="What did you work on? (Shift+Enter for new line, Enter to save)"
                    rows={3}
                    className="w-full px-4 pt-3 pb-2 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed"
                />
                <div className="flex items-center gap-2 px-3 pb-3 pt-1 border-t border-border/50">
                    <select value={logProject} onChange={e => setLogProject(e.target.value)}
                        className="font-mono text-xs px-2 py-1.5 bg-secondary border border-border rounded-lg text-foreground outline-none flex-1 max-w-[140px]">
                        <option value="">No project</option>
                        {missions.filter(m => m.status === 'active').map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                    <div className="flex items-center gap-1">
                        <select value={hours} onChange={e => handleTimeChange(e.target.value, minutes)}
                            className="font-mono text-xs px-2 py-1.5 bg-secondary border border-border rounded-lg text-foreground outline-none w-14">
                            {[...Array(13)].map((_, i) => (
                                <option key={i} value={i}>{i}h</option>
                            ))}
                        </select>
                        <select value={minutes} onChange={e => handleTimeChange(hours, e.target.value)}
                            className="font-mono text-xs px-2 py-1.5 bg-secondary border border-border rounded-lg text-foreground outline-none w-14">
                            <option value="0">0m</option>
                            <option value="15">15m</option>
                            <option value="30">30m</option>
                            <option value="45">45m</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-[10px] text-muted-foreground font-mono">{logInput.length}/500</span>
                        <button onClick={onAdd} disabled={!logInput.trim() || saving}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-all shadow-sm">
                            {saving ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
                            Log
                        </button>
                    </div>
                </div>
            </div>

            {/* Log list header */}
            {logs.length > 0 && (
                <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground px-1">
                    Logs for {format(new Date(logs[0].date), 'EEE, d MMM')} · {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                </div>
            )}

            {/* Log entries */}
            {logs.length === 0 ? (
                <div className="text-center py-12">
                    <FileText size={32} className="text-muted-foreground/20 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">No logs yet. What did you work on today?</p>
                    <p className="font-mono text-xs text-muted-foreground/50 mt-1">Press Enter to add quickly.</p>
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
                                    className="group flex items-start gap-3 px-4 py-3 bg-card border border-border rounded-xl hover:border-border/80 transition-all">
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
                                                className="w-full bg-transparent text-sm text-foreground resize-none outline-none leading-snug"
                                            />
                                        ) : (
                                            <p className="text-sm text-foreground leading-snug">{log.content}</p>
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
                                            <span className="font-mono text-[10px] text-muted-foreground">
                                                {format(new Date(log.createdAt), 'HH:mm')}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 mt-0.5">
                                        <button onClick={() => startEdit(log)}
                                            className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors">
                                            <Edit2 size={11} />
                                        </button>
                                        <button onClick={() => onDelete(log.id)}
                                            className="p-1 text-muted-foreground hover:text-red-400 rounded transition-colors">
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
            <div className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Daily Reflection
            </div>
            <div className="bg-card border-2 border-border rounded-xl overflow-hidden focus-within:border-primary/40 focus-within:shadow-lg focus-within:shadow-primary/5 transition-all">
                <textarea
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    placeholder="How did today go? What did you learn? What would you do differently? (Reflect on wins, challenges, and lessons)"
                    rows={10}
                    className="w-full px-4 py-3 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/40 resize-none outline-none leading-relaxed"
                />
                <div className="flex items-center justify-between px-4 pb-3 border-t border-border/50 pt-2">
                    <div className="flex items-center gap-3">
                        {savedAt ? (
                            <span className="font-mono text-[10px] text-muted-foreground">
                                Saved {format(new Date(savedAt), 'HH:mm')}
                            </span>
                        ) : <span />}
                        <span className="text-[10px] text-muted-foreground font-mono">{value.length} chars</span>
                    </div>
                    <button onClick={onSave} disabled={saving || !value.trim()}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-all shadow-sm">
                        <BookOpen size={11} />
                        {saving ? 'Saving...' : 'Save Reflection'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Calendar Panel ───────────────────────────────────────────────────────────

function CalendarPanel({ calDate, setCalDate, calView, setCalView, weekDays, monthDays, getItemsForDay, onDayClick }: {
    calDate: Date; setCalDate: (d: Date) => void;
    calView: CalView; setCalView: (v: CalView) => void;
    weekDays: Date[]; monthDays: Date[];
    getItemsForDay: (d: Date) => ActionItem[];
    onDayClick: (d: Date) => void;
}) {
    const navigate = (dir: 1 | -1) => {
        if (calView === 'week') setCalDate(addDays(calDate, dir * 7));
        else setCalDate(dir === 1 ? addMonths(calDate, 1) : subMonths(calDate, 1));
    };

    const label = calView === 'week'
        ? `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`
        : format(calDate, 'MMMM yyyy');

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-display text-xl text-foreground">{label}</h2>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
                        {(['week', 'month'] as CalView[]).map(v => (
                            <button key={v} onClick={() => setCalView(v)}
                                className={cn("px-3 py-1 rounded-lg text-xs font-medium transition-colors capitalize",
                                    calView === v ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                                {v}
                            </button>
                        ))}
                    </div>
                    <button onClick={() => navigate(-1)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><ChevronLeft size={15} /></button>
                    <button onClick={() => setCalDate(new Date())} className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-secondary transition-colors">Today</button>
                    <button onClick={() => navigate(1)} className="p-2 hover:bg-secondary rounded-lg transition-colors"><ChevronRight size={15} /></button>
                </div>
            </div>

            {calView === 'week' && (
                <div className="grid grid-cols-7 gap-2">
                    {weekDays.map(day => {
                        const items = getItemsForDay(day);
                        return (
                            <div key={day.toISOString()} onClick={() => onDayClick(day)}
                                className={cn("min-h-[120px] rounded-xl border p-2 cursor-pointer transition-all hover:border-primary/30",
                                    isToday(day) ? "border-primary/40 bg-primary/5" : "border-border bg-card/50")}>
                                <div className="flex flex-col items-center mb-2">
                                    <span className="font-mono text-[10px] text-muted-foreground uppercase">{format(day, 'EEE')}</span>
                                    <span className={cn("font-mono text-sm font-bold mt-0.5", isToday(day) ? "text-primary" : "text-foreground")}>
                                        {format(day, 'd')}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {items.slice(0, 3).map(item => (
                                        <div key={item.id} className={cn("text-[10px] px-1.5 py-0.5 rounded truncate",
                                            item.status === 'done' ? "bg-secondary text-muted-foreground line-through" :
                                            item.priority === 'critical' ? "bg-red-500/15 text-red-400" :
                                            item.priority === 'high' ? "bg-orange-400/15 text-orange-400" :
                                            "bg-primary/10 text-primary")}>
                                            {item.title}
                                        </div>
                                    ))}
                                    {items.length > 3 && (
                                        <div className="font-mono text-[10px] text-muted-foreground pl-1">+{items.length - 3}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {calView === 'month' && (
                <div>
                    <div className="grid grid-cols-7 mb-1">
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
                            <div key={d} className="text-center font-mono text-[10px] font-semibold uppercase text-muted-foreground py-1">{d}</div>
                        ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {[...Array((monthDays[0].getDay() + 6) % 7)].map((_, i) => <div key={`b${i}`} />)}
                        {monthDays.map(day => {
                            const items = getItemsForDay(day);
                            return (
                                <div key={day.toISOString()} onClick={() => onDayClick(day)}
                                    className={cn("aspect-square rounded-lg flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-secondary p-1",
                                        isToday(day) && "bg-primary/10 ring-1 ring-primary/30")}>
                                    <span className={cn("font-mono text-xs font-medium", isToday(day) ? "text-primary" : "text-foreground")}>
                                        {format(day, 'd')}
                                    </span>
                                    {items.length > 0 && (
                                        <div className="flex gap-0.5 mt-0.5">
                                            {items.slice(0, 3).map((item, idx) => (
                                                <div key={idx} className={cn("w-1 h-1 rounded-full",
                                                    item.status === 'done' ? "bg-emerald-400" :
                                                    item.priority === 'critical' ? "bg-red-500" :
                                                    item.priority === 'high' ? "bg-orange-400" : "bg-primary/60")} />
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
