'use client';
import React, { useState, useEffect } from 'react';
import {
    CheckCircle2, Circle, ArrowRight, Plus,
    Flame, Target, Sparkles, MessageSquare,
    Vault, FileText, TrendingUp, Calendar,
    Zap, Clock, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ActionItem, Mission, View } from '../../types/';

interface DashboardViewProps {
    tasks: ActionItem[];
    missions: Mission[];
    setCurrentView: (view: View) => void;
    toggleTaskStatus: (id: string) => void;
    setIsTaskModalOpen: (val: boolean) => void;
}

export const DashboardView = ({
    tasks,
    missions,
    setCurrentView,
    toggleTaskStatus,
    setIsTaskModalOpen,
}: DashboardViewProps) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const t = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(t);
    }, []);

    const hour = time.getHours();
    const greeting =
        hour < 5  ? 'Still up, King?' :
        hour < 12 ? 'Good morning, King.' :
        hour < 17 ? 'Good afternoon, King.' :
        hour < 21 ? 'Good evening, King.' : 'Late night grind, King.';

    const todayTasks    = tasks.filter(t => t.status !== 'done');
    const doneTasks     = tasks.filter(t => t.status === 'done');
    const focusTasks    = todayTasks.filter(t => t.priority === 'high' || t.priority === 'critical').slice(0, 3);
    const restTasks     = todayTasks.filter(t => t.priority !== 'high' && t.priority !== 'critical').slice(0, 4 - focusTasks.length);
    const displayTasks  = [...focusTasks, ...restTasks].slice(0, 5);
    const activeMissions = missions.filter(m => m.status === 'active').slice(0, 4);
    const bestStreak    = tasks.reduce((max, t) => Math.max(max, t.habitStreak || 0), 0);

    const completionRate = tasks.length > 0
        ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

    const PRIORITY_DOT: Record<string, string> = {
        critical: 'bg-red-500',
        high:     'bg-orange-500',
        medium:   'bg-yellow-500',
        low:      'bg-blue-400',
    };

    const quickActions = [
        { label: 'Add Task',   icon: Plus,         color: 'from-blue-500/20 to-blue-600/10 border-blue-500/20 text-blue-400',    action: () => setIsTaskModalOpen(true) },
        { label: 'Ask Milo',   icon: MessageSquare, color: 'from-violet-500/20 to-violet-600/10 border-violet-500/20 text-violet-400', action: () => setCurrentView('chat') },
        { label: 'Dreamboard', icon: Sparkles,      color: 'from-pink-500/20 to-pink-600/10 border-pink-500/20 text-pink-400',    action: () => setCurrentView('dreamboard') },
        { label: 'Projects',   icon: Target,        color: 'from-emerald-500/20 to-emerald-600/10 border-emerald-500/20 text-emerald-400', action: () => setCurrentView('missions') },
        { label: 'Planner',    icon: Calendar,      color: 'from-amber-500/20 to-amber-600/10 border-amber-500/20 text-amber-400', action: () => setCurrentView('planner') },
        { label: 'Vault',      icon: Vault,         color: 'from-teal-500/20 to-teal-600/10 border-teal-500/20 text-teal-400',    action: () => setCurrentView('vault') },
    ];

    return (
        <div className="min-h-full space-y-6 pb-10">

            {/* ── Hero ───────────────────────────────────────────────── */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#0f0f14] via-[#13111e] to-[#0a0f1a] p-6 md:p-8">
                {/* background grid */}
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
                {/* glow */}
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-violet-600/10 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-blue-600/10 blur-3xl pointer-events-none" />

                <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-white/40 text-xs font-medium uppercase tracking-widest mb-1">
                            {format(time, "EEEE, MMMM d")}  ·  {format(time, 'h:mm a')}
                        </p>
                        <h1 className="font-display text-2xl md:text-3xl text-white tracking-tight">{greeting}</h1>
                        <p className="text-white/50 text-sm mt-2">
                            {todayTasks.length === 0
                                ? 'All clear — nothing pending. Add something.'
                                : `${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} to go · ${doneTasks.length} done today`}
                        </p>
                    </div>

                    {/* Completion ring */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                        <div className="relative w-16 h-16">
                            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                                <circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
                                <circle cx="32" cy="32" r="26" fill="none"
                                    stroke="url(#grad)" strokeWidth="5"
                                    strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 26}`}
                                    strokeDashoffset={`${2 * Math.PI * 26 * (1 - completionRate / 100)}`}
                                    className="transition-all duration-700" />
                                <defs>
                                    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor="#818cf8" />
                                        <stop offset="100%" stopColor="#c084fc" />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="font-mono text-white font-bold text-sm leading-none">{completionRate}%</span>
                            </div>
                        </div>
                        <div className="text-left">
                            <p className="font-mono text-white font-semibold text-lg leading-none">{doneTasks.length}</p>
                            <p className="text-white/40 text-xs mt-0.5">done today</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Stat Strip ─────────────────────────────────────────── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { value: todayTasks.length, label: 'Remaining',    icon: Circle,     color: 'text-white',         sub: `${tasks.length} total` },
                    { value: activeMissions.length, label: 'Active Projects', icon: Target, color: 'text-emerald-400', sub: `${missions.filter(m => m.status === 'completed').length} completed` },
                    { value: `${completionRate}%`, label: 'Today\'s rate',  icon: TrendingUp, color: 'text-violet-400', sub: `${doneTasks.length} done` },
                    { value: bestStreak > 0 ? `${bestStreak}d` : '—', label: 'Best streak', icon: Flame, color: 'text-orange-400', sub: 'habit streak' },
                ].map((s, i) => (
                    <div key={i} className="bg-card border border-border/40 rounded-2xl p-4 hover:border-border/70 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                            <s.icon className={cn('w-4 h-4', s.color)} />
                            <span className="text-[10px] text-muted-foreground">{s.sub}</span>
                        </div>
                        <div className={cn('font-mono text-2xl font-bold', s.color)}>{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
                    </div>
                ))}
            </div>

            {/* ── Main grid ──────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Tasks */}
                <div className="lg:col-span-2 bg-card border border-border/40 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <Zap className="w-4 h-4 text-yellow-500" />
                            <h3 className="font-semibold text-sm">Today's Focus</h3>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setIsTaskModalOpen(true)}
                                className="w-7 h-7 rounded-lg bg-secondary/50 hover:bg-secondary flex items-center justify-center transition-colors">
                                <Plus className="w-3.5 h-3.5 text-muted-foreground" />
                            </button>
                            <button onClick={() => setCurrentView('planner')}
                                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors">
                                All <ChevronRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-border/30">
                        {displayTasks.map(task => (
                            <div key={task.id}
                                className="flex items-center gap-3 px-5 py-3.5 hover:bg-secondary/20 transition-colors group">
                                <button onClick={() => toggleTaskStatus(task.id)}
                                    className={cn(
                                        'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                                        task.status === 'done'
                                            ? 'bg-primary border-primary text-primary-foreground'
                                            : 'border-muted-foreground/30 hover:border-primary'
                                    )}>
                                    {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                </button>

                                <div className="flex-1 min-w-0 flex items-center gap-2">
                                    <div className={cn(
                                        'w-1.5 h-1.5 rounded-full flex-shrink-0',
                                        PRIORITY_DOT[task.priority] || 'bg-muted-foreground/40'
                                    )} />
                                    <span className={cn(
                                        'text-sm font-medium truncate',
                                        task.status === 'done' && 'text-muted-foreground line-through'
                                    )}>
                                        {task.title}
                                    </span>
                                </div>

                                {task.dueTime && (
                                    <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Clock className="w-2.5 h-2.5" />{task.dueTime}
                                    </span>
                                )}
                            </div>
                        ))}

                        {tasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                                <CheckCircle2 className="w-8 h-8 opacity-20" />
                                <div className="text-center">
                                    <p className="text-sm font-medium">All clear</p>
                                    <p className="text-xs opacity-60 mt-0.5">Add a task to get started</p>
                                </div>
                                <button onClick={() => setIsTaskModalOpen(true)}
                                    className="text-xs text-primary hover:underline">
                                    + Add first task
                                </button>
                            </div>
                        )}
                    </div>

                    {todayTasks.length > displayTasks.length && (
                        <button onClick={() => setCurrentView('planner')}
                            className="w-full flex items-center justify-center gap-1.5 py-3 text-xs text-muted-foreground hover:text-foreground border-t border-border/30 hover:bg-secondary/20 transition-colors">
                            +{todayTasks.length - displayTasks.length} more tasks <ArrowRight className="w-3 h-3" />
                        </button>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-4">

                    {/* Quick actions */}
                    <div className="bg-card border border-border/40 rounded-2xl p-4">
                        <p className="font-mono text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Quick Access</p>
                        <div className="grid grid-cols-2 gap-2">
                            {quickActions.map(a => (
                                <button key={a.label} onClick={a.action}
                                    className={cn(
                                        'flex flex-col items-center justify-center gap-1.5 py-3.5 rounded-xl border bg-gradient-to-br text-xs font-medium transition-all hover:scale-[1.03] active:scale-[0.98]',
                                        a.color
                                    )}>
                                    <a.icon className="w-4 h-4" />
                                    {a.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Active projects */}
                    {activeMissions.length > 0 && (
                        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
                            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border/40">
                                <div className="flex items-center gap-2">
                                    <Target className="w-4 h-4 text-emerald-500" />
                                    <h3 className="font-semibold text-sm">Active Projects</h3>
                                </div>
                                <button onClick={() => setCurrentView('missions')}
                                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                                    All <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                            <div className="divide-y divide-border/30">
                                {activeMissions.map(m => (
                                    <div key={m.id} onClick={() => setCurrentView('missions')}
                                        className="px-4 py-3 hover:bg-secondary/20 transition-colors cursor-pointer group">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: m.color }} />
                                            <p className="text-sm font-medium truncate flex-1">{m.name}</p>
                                            <span className="text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">{m.progress}%</span>
                                        </div>
                                        <div className="h-1 bg-secondary rounded-full overflow-hidden">
                                            <div className="h-full rounded-full transition-all duration-700"
                                                style={{ width: `${m.progress}%`, backgroundColor: m.color }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Blog / Vault links */}
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setCurrentView('vault')}
                            className="flex flex-col items-start gap-2 p-4 bg-card border border-border/40 rounded-2xl hover:border-teal-500/30 hover:bg-teal-500/5 transition-all text-left">
                            <Vault className="w-5 h-5 text-teal-500" />
                            <div>
                                <p className="text-xs font-semibold">Vault</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Finance</p>
                            </div>
                        </button>
                        <button onClick={() => setCurrentView('blog')}
                            className="flex flex-col items-start gap-2 p-4 bg-card border border-border/40 rounded-2xl hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all text-left">
                            <FileText className="w-5 h-5 text-indigo-500" />
                            <div>
                                <p className="text-xs font-semibold">Blog</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">Content</p>
                            </div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
