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
    tasks, missions, setCurrentView, toggleTaskStatus, setIsTaskModalOpen,
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
    const completionRate = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

    const PRIORITY_DOT: Record<string, string> = {
        critical: '#ef4444',
        high:     '#f97316',
        medium:   '#eab308',
        low:      '#60a5fa',
    };

    const quickActions = [
        { label: 'Add Task',   icon: Plus,          action: () => setIsTaskModalOpen(true) },
        { label: 'Ask Milo',   icon: MessageSquare, action: () => setCurrentView('chat') },
        { label: 'Dreamboard', icon: Sparkles,       action: () => setCurrentView('dreamboard') },
        { label: 'Projects',   icon: Target,         action: () => setCurrentView('missions') },
        { label: 'Planner',    icon: Calendar,       action: () => setCurrentView('planner') },
        { label: 'Vault',      icon: Vault,          action: () => setCurrentView('vault') },
    ];

    const stats = [
        { value: activeMissions.length, label: 'Active Projects', sub: `${missions.filter(m => m.status === 'completed').length} completed`, accent: '#00ff88' },
        { value: todayTasks.length,     label: 'Tasks Remaining', sub: `${tasks.length} total`, accent: '#60a5fa' },
        { value: `${completionRate}%`,  label: "Today's Rate",    sub: `${doneTasks.length} done`, accent: '#c084fc' },
        { value: bestStreak > 0 ? `${bestStreak}d` : '—', label: 'Best Streak', sub: 'habit streak', accent: '#f97316' },
    ];

    return (
        <div className="flex flex-col h-full overflow-y-auto hq-scroll" style={{ color: '#e5e5e5' }}>

            {/* ── Top breadcrumb bar ─────────────────────────────── */}
            <div className="flex items-center justify-between px-8 py-3 border-b flex-shrink-0"
                style={{ borderColor: 'rgba(255,255,255,0.05)' }}>
                <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-widest">
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>SYSTEM /</span>
                    <span className="text-white">DASHBOARD_v2</span>
                </div>
                <div className="flex items-center gap-5 font-mono text-[10px] uppercase tracking-widest">
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff88' }} />
                        <span className="text-white">Uplink Active</span>
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {format(time, 'dd MMM yyyy')} · {format(time, 'HH:mm')}
                    </span>
                </div>
            </div>

            <div className="flex-1 p-8 space-y-8">

                {/* ── Greeting ──────────────────────────────────────── */}
                <div className="flex items-start justify-between">
                    <div>
                        <p className="font-mono text-[10px] uppercase tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.25)' }}>
                            {format(time, 'EEEE, MMMM d')}
                        </p>
                        <h1 className="font-display text-3xl text-white">{greeting}</h1>
                        <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            {todayTasks.length === 0
                                ? 'All clear — nothing pending.'
                                : `${todayTasks.length} task${todayTasks.length !== 1 ? 's' : ''} remaining · ${doneTasks.length} done`}
                        </p>
                    </div>

                    {/* Completion ring */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="relative w-14 h-14">
                            <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                                <circle cx="28" cy="28" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                                <circle cx="28" cy="28" r="22" fill="none"
                                    stroke="#00ff88" strokeWidth="4" strokeLinecap="round"
                                    strokeDasharray={`${2 * Math.PI * 22}`}
                                    strokeDashoffset={`${2 * Math.PI * 22 * (1 - completionRate / 100)}`}
                                    style={{ transition: 'stroke-dashoffset 0.7s ease', filter: 'drop-shadow(0 0 6px rgba(0,255,136,0.4))' }}
                                />
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="font-mono text-sm font-bold text-white">{completionRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Stat strip ────────────────────────────────────── */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {stats.map((s, i) => (
                        <div key={i} className="hq-card rounded-xl p-5 transition-all hover:scale-[1.01]">
                            <div className="font-mono text-xs uppercase tracking-widest mb-3"
                                style={{ color: 'rgba(255,255,255,0.25)' }}>
                                {s.label}
                            </div>
                            <div className="font-mono text-3xl font-bold" style={{ color: s.accent }}>
                                {s.value}
                            </div>
                            <div className="font-mono text-[10px] mt-1.5 uppercase tracking-widest"
                                style={{ color: 'rgba(255,255,255,0.2)' }}>
                                {s.sub}
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Main grid ─────────────────────────────────────── */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Today's tasks */}
                    <div className="lg:col-span-2 hq-card rounded-xl overflow-hidden">
                        <div className="flex items-center justify-between px-6 py-4"
                            style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4" style={{ color: '#eab308' }} />
                                <span className="font-mono text-xs uppercase tracking-widest text-white">Today's Focus</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => setIsTaskModalOpen(true)}
                                    className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:opacity-70"
                                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                    <Plus className="w-3 h-3 text-white" />
                                </button>
                                <button onClick={() => setCurrentView('planner')}
                                    className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 transition-opacity hover:opacity-60"
                                    style={{ color: 'rgba(255,255,255,0.3)' }}>
                                    All <ChevronRight className="w-3 h-3" />
                                </button>
                            </div>
                        </div>

                        <div>
                            {displayTasks.map((task, idx) => (
                                <div key={task.id}
                                    className="flex items-center gap-4 px-6 py-3.5 transition-colors group"
                                    style={{ borderBottom: idx < displayTasks.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                                    <button onClick={() => toggleTaskStatus(task.id)}
                                        className={cn(
                                            'w-4 h-4 rounded-full border flex items-center justify-center flex-shrink-0 transition-all',
                                        )}
                                        style={{
                                            border: task.status === 'done'
                                                ? '1.5px solid #00ff88'
                                                : '1.5px solid rgba(255,255,255,0.2)',
                                            background: task.status === 'done' ? 'rgba(0,255,136,0.15)' : 'transparent',
                                        }}>
                                        {task.status === 'done' && <CheckCircle2 className="w-2.5 h-2.5" style={{ color: '#00ff88' }} />}
                                    </button>

                                    <div className="flex-1 min-w-0 flex items-center gap-2.5">
                                        <span
                                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                            style={{ background: PRIORITY_DOT[task.priority] || 'rgba(255,255,255,0.2)' }}
                                        />
                                        <span className={cn('text-sm truncate', task.status === 'done' && 'line-through')}
                                            style={{ color: task.status === 'done' ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.8)' }}>
                                            {task.title}
                                        </span>
                                    </div>

                                    {task.dueTime && (
                                        <span className="font-mono text-[10px] flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                            style={{ color: 'rgba(255,255,255,0.3)' }}>
                                            <Clock className="w-2.5 h-2.5" />{task.dueTime}
                                        </span>
                                    )}
                                </div>
                            ))}

                            {tasks.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <CheckCircle2 className="w-8 h-8" style={{ color: 'rgba(0,255,136,0.2)' }} />
                                    <p className="font-mono text-xs uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
                                        All clear — add a task
                                    </p>
                                    <button onClick={() => setIsTaskModalOpen(true)}
                                        className="font-mono text-xs uppercase tracking-widest transition-opacity hover:opacity-70"
                                        style={{ color: '#00ff88' }}>
                                        + New task
                                    </button>
                                </div>
                            )}
                        </div>

                        {todayTasks.length > displayTasks.length && (
                            <button onClick={() => setCurrentView('planner')}
                                className="w-full flex items-center justify-center gap-1.5 py-3 font-mono text-[10px] uppercase tracking-widest transition-opacity hover:opacity-60"
                                style={{ borderTop: '1px solid rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                                +{todayTasks.length - displayTasks.length} more <ArrowRight className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    {/* Right column */}
                    <div className="space-y-4">

                        {/* Quick access */}
                        <div className="hq-card rounded-xl p-5">
                            <p className="font-mono text-[10px] uppercase tracking-widest mb-4"
                                style={{ color: 'rgba(255,255,255,0.25)' }}>Quick Access</p>
                            <div className="grid grid-cols-2 gap-2">
                                {quickActions.map(a => (
                                    <button key={a.label} onClick={a.action}
                                        className="flex flex-col items-center justify-center gap-2 py-3.5 rounded-lg transition-all hover:opacity-70 active:scale-95"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                        <a.icon className="w-4 h-4 text-white" />
                                        <span className="font-mono text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                            {a.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Active projects */}
                        {activeMissions.length > 0 && (
                            <div className="hq-card rounded-xl overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4"
                                    style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div className="flex items-center gap-2">
                                        <Target className="w-4 h-4" style={{ color: '#00ff88' }} />
                                        <span className="font-mono text-[10px] uppercase tracking-widest text-white">
                                            Mission Status
                                        </span>
                                    </div>
                                    <button onClick={() => setCurrentView('missions')}
                                        className="font-mono text-[10px] uppercase tracking-widest flex items-center gap-1 transition-opacity hover:opacity-60"
                                        style={{ color: 'rgba(255,255,255,0.25)' }}>
                                        All <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                                <div>
                                    {activeMissions.map((m, idx) => (
                                        <div key={m.id} onClick={() => setCurrentView('missions')}
                                            className="px-5 py-3.5 cursor-pointer transition-colors hover:bg-white/[0.02] group"
                                            style={{ borderBottom: idx < activeMissions.length - 1 ? '1px solid rgba(255,255,255,0.04)' : undefined }}>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                                    style={{ background: m.color }} />
                                                <span className="text-sm truncate flex-1" style={{ color: 'rgba(255,255,255,0.75)' }}>{m.name}</span>
                                                <span className="font-mono text-[10px] opacity-0 group-hover:opacity-100 transition-opacity"
                                                    style={{ color: '#00ff88' }}>{m.progress}%</span>
                                            </div>
                                            <div className="h-[2px] rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                                                <div className="h-full rounded-full transition-all duration-700"
                                                    style={{ width: `${m.progress}%`, background: m.color }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Vault + Blog shortcuts */}
                        <div className="grid grid-cols-2 gap-3">
                            <button onClick={() => setCurrentView('vault')}
                                className="hq-card rounded-xl p-4 flex flex-col items-start gap-2 text-left transition-all hover:opacity-70">
                                <Vault className="w-5 h-5" style={{ color: '#2dd4bf' }} />
                                <div>
                                    <p className="font-mono text-xs uppercase tracking-widest text-white">Vault</p>
                                    <p className="font-mono text-[10px] mt-0.5 uppercase tracking-widest"
                                        style={{ color: 'rgba(255,255,255,0.2)' }}>Finance</p>
                                </div>
                            </button>
                            <button onClick={() => setCurrentView('blog')}
                                className="hq-card rounded-xl p-4 flex flex-col items-start gap-2 text-left transition-all hover:opacity-70">
                                <FileText className="w-5 h-5" style={{ color: '#818cf8' }} />
                                <div>
                                    <p className="font-mono text-xs uppercase tracking-widest text-white">Blog</p>
                                    <p className="font-mono text-[10px] mt-0.5 uppercase tracking-widest"
                                        style={{ color: 'rgba(255,255,255,0.2)' }}>Content</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
