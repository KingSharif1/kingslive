'use client';

import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard, MessageSquare, FileText, Settings,
    User, ChevronLeft, ChevronRight, Sun, Moon,
    Target, Calendar, Vault, Sparkles, LogOut
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { View, UsageStats, ThemeMode } from '../../types/index';
import { UsageWidget } from './UsageWidget';

interface SidebarProps {
    currentView: View;
    setCurrentView: (view: View) => void;
    isCollapsed: boolean;
    setIsCollapsed: (collapsed: boolean) => void;
    usage: UsageStats;
    theme: ThemeMode;
    setTheme: (theme: ThemeMode) => void;
    userEmail: string;
    userName: string;
    apiKeys: { google?: string; github?: string; openai?: string; };
    onUsageClick: () => void;
    onSignOut: () => void;
}

const navItems = [
    { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard',  dot: 'active' },
    { id: 'dreamboard', icon: Sparkles,         label: 'Dreamboard', dot: 'idle'   },
    { id: 'missions',   icon: Target,           label: 'Projects',   dot: 'idle'   },
    { id: 'planner',    icon: Calendar,         label: 'Planner',    dot: 'warn'   },
    { id: 'chat',       icon: MessageSquare,    label: 'Milo',       dot: 'idle'   },
    { id: 'vault',      icon: Vault,            label: 'Vault',      dot: 'idle'   },
    { id: 'blog',       icon: FileText,         label: 'Blog',       dot: 'idle'   },
];

const DOT_COLOR: Record<string, string> = {
    active: '#00ff88',
    warn:   '#f97316',
    idle:   'rgba(255,255,255,0.1)',
};

export const Sidebar = ({
    currentView, setCurrentView,
    isCollapsed, setIsCollapsed,
    usage, theme, setTheme,
    userEmail, userName,
    apiKeys, onUsageClick, onSignOut,
}: SidebarProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    const toggleTheme = () => {
        const next = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        document.documentElement.classList.toggle('dark');
    };

    const usagePct = Math.round((usage.total.used / usage.total.limit) * 100) || 0;

    return (
        <div
            className={cn(
                'hidden md:flex flex-col h-screen sticky top-0 transition-all duration-300 hq-scroll overflow-y-auto',
                isCollapsed ? 'w-[72px]' : 'w-64'
            )}
            style={{ background: '#080808', borderRight: '1px solid rgba(255,255,255,0.05)' }}
        >
            {/* Collapse toggle */}
            <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute -right-3 top-7 w-6 h-6 rounded-full flex items-center justify-center z-10 transition-transform hover:scale-110"
                style={{ background: '#00ff88', color: '#000' }}
            >
                {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {/* ── Logo ─────────────────────────────────── */}
            <div className={cn('flex items-center gap-3 px-5 pt-7 pb-5', isCollapsed && 'justify-center px-0')}>
                <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ background: 'rgba(0,255,136,0.08)', border: '1px solid rgba(0,255,136,0.2)', boxShadow: '0 0 20px rgba(0,255,136,0.08)' }}
                >
                    <svg viewBox="0 0 22 18" fill="#00ff88" className="w-5 h-4">
                        <path d="M1 15 L4 5.5 L7.5 9.5 L11 1 L14.5 9.5 L18 5.5 L21 15 Z" />
                        <rect x="0.5" y="15" width="21" height="2.5" rx="1.25" />
                        <circle cx="4" cy="5.5" r="1.3" />
                        <circle cx="11" cy="1" r="1.3" />
                        <circle cx="18" cy="5.5" r="1.3" />
                    </svg>
                </div>
                {!isCollapsed && (
                    <div>
                        <div className="font-mono text-white font-bold tracking-tighter text-lg leading-none">CTROOM</div>
                        <div className="font-mono text-[9px] text-white/25 uppercase tracking-widest mt-0.5">Personal OS v2</div>
                    </div>
                )}
            </div>

            <div className="h-px mx-5 mb-4" style={{ background: 'rgba(255,255,255,0.05)' }} />

            {/* ── Navigation ───────────────────────────── */}
            <nav className="flex-1 space-y-0.5">
                {navItems.map(item => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => setCurrentView(item.id as View)}
                            title={isCollapsed ? item.label : undefined}
                            className={cn(
                                'w-full flex items-center gap-3 py-3 text-sm font-medium transition-all duration-150 relative group',
                                isCollapsed ? 'justify-center px-0' : 'px-5',
                                isActive
                                    ? 'text-white'
                                    : 'text-white/35 hover:text-white/70'
                            )}
                            style={isActive ? {
                                boxShadow: 'inset 2px 0 0 0 #00ff88',
                                background: 'rgba(255,255,255,0.04)',
                            } : {}}
                        >
                            <item.icon
                                className="w-[18px] h-[18px] flex-shrink-0"
                                style={{ color: isActive ? '#00ff88' : undefined }}
                            />
                            {!isCollapsed && <span className="flex-1 text-left">{item.label}</span>}
                            {!isCollapsed && (
                                <span
                                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                                    style={{
                                        background: isActive ? '#00ff88' : DOT_COLOR[item.dot],
                                        boxShadow: isActive ? '0 0 8px #00ff88' : undefined,
                                    }}
                                />
                            )}
                            {/* Collapsed tooltip */}
                            {isCollapsed && (
                                <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-md text-xs font-mono opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50"
                                    style={{ background: '#111', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                                    {item.label}
                                </div>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ── Bottom section ───────────────────────── */}
            <div className={cn('space-y-3 pb-5', isCollapsed ? 'px-0' : 'px-5')}>
                <div className="h-px" style={{ background: 'rgba(255,255,255,0.05)' }} />

                {/* Usage bar */}
                {!isCollapsed && (
                    <button onClick={onUsageClick} className="w-full text-left space-y-1.5 group">
                        <div className="flex justify-between font-mono text-[10px] uppercase tracking-widest">
                            <span className="text-white/25">System Usage</span>
                            <span style={{ color: usagePct > 80 ? '#f97316' : '#00ff88' }}>{usagePct}%</span>
                        </div>
                        <div className="h-[3px] hq-bar-track w-full">
                            <div className="hq-bar-fill h-full transition-all duration-500"
                                style={{ width: `${usagePct}%`, background: usagePct > 80 ? '#f97316' : '#00ff88' }} />
                        </div>
                    </button>
                )}

                {/* Theme toggle */}
                <button
                    onClick={toggleTheme}
                    className={cn(
                        'flex items-center gap-3 w-full py-2.5 rounded-lg transition-colors text-white/35 hover:text-white/60',
                        isCollapsed ? 'justify-center' : 'px-3'
                    )}
                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
                    title={isCollapsed ? 'Toggle theme' : undefined}
                >
                    {!mounted ? (
                        <div className="w-[18px] h-[18px]" />
                    ) : theme === 'dark' ? (
                        <Sun className="w-[18px] h-[18px] text-yellow-400" />
                    ) : (
                        <Moon className="w-[18px] h-[18px] text-indigo-400" />
                    )}
                    {!isCollapsed && (
                        <span className="font-mono text-[10px] uppercase tracking-widest flex-1 text-left">
                            {mounted ? (theme === 'dark' ? 'Light Protocol' : 'Dark Protocol') : 'Protocol'}
                        </span>
                    )}
                </button>

                {/* Settings view (hidden shortcut) */}
                {!isCollapsed && (
                    <button
                        onClick={() => setCurrentView('settings' as View)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 rounded-lg text-white/20 hover:text-white/40 transition-colors"
                    >
                        <Settings className="w-3.5 h-3.5" />
                        <span className="font-mono text-[10px] uppercase tracking-widest">Settings</span>
                    </button>
                )}

                {/* User + sign out */}
                <div className={cn('flex items-center gap-2', isCollapsed && 'flex-col')}>
                    <div className={cn(
                        'flex items-center gap-2.5 flex-1 min-w-0 rounded-lg py-2 transition-colors cursor-default',
                        !isCollapsed && 'px-3'
                    )}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.2)' }}>
                            <User className="w-4 h-4" style={{ color: '#00ff88' }} />
                        </div>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <div className="font-mono text-xs font-bold text-white truncate uppercase">
                                    {userName || 'OPERATOR'}
                                </div>
                                <div className="font-mono text-[10px] text-white/25 truncate">{userEmail}</div>
                            </div>
                        )}
                    </div>
                    <button
                        onClick={onSignOut}
                        title="Sign out"
                        className="p-2 rounded-lg transition-colors text-white/25 hover:text-red-400 flex-shrink-0"
                        style={{ border: '1px solid rgba(255,255,255,0.05)' }}
                    >
                        <LogOut className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    );
};
