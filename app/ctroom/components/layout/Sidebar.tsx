import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    MessageSquare,
    FileText,
    Settings,
    User,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon,
    Target,
    Calendar,
    Vault,
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { View, UsageStats, ThemeMode } from '../../types/index';
import { UsageWidget } from './UsageWidget';
import { UsageModal } from '../modals/UsageModal';

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
}

export const Sidebar = ({
    currentView,
    setCurrentView,
    isCollapsed,
    setIsCollapsed,
    usage,
    theme,
    setTheme,
    userEmail,
    userName,
    apiKeys
}: SidebarProps) => {
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    // Prevent hydration mismatch for theme-dependent rendering
    useEffect(() => {
        setMounted(true);
    }, []);

    // Persist sidebar state
    useEffect(() => {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
    }, [isCollapsed]);

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        document.documentElement.classList.toggle('dark');
    };

    const navItems = [
        { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
        { id: 'dreamboard', icon: Sparkles,         label: 'Dreamboard' },
        { id: 'missions',   icon: Target,           label: 'Projects'   },
        { id: 'planner',    icon: Calendar,         label: 'Planner'    },
        { id: 'chat',       icon: MessageSquare,    label: 'Milo'       },
        { id: 'vault',      icon: Vault,            label: 'Vault'      },
        { id: 'blog',       icon: FileText,         label: 'Blog'       },
    ];

    return (
        <>
            <UsageModal
                isOpen={isUsageModalOpen}
                onClose={() => setIsUsageModalOpen(false)}
                usage={usage}
            />
            <div
                className={cn(
                    "hidden md:flex flex-col border-r border-border bg-card/50 p-6 justify-between transition-all duration-300 backdrop-blur-xl h-screen sticky top-0",
                    isCollapsed ? "w-20" : "w-72"
                )}
            >
                {/* Collapse Toggle Button */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-110 transition-transform z-10"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>

                <div className="space-y-8">
                    {/* Logo */}
                    <div className={cn(
                        "flex items-center gap-3 px-2 transition-all duration-300",
                        isCollapsed && "justify-center px-0"
                    )}>
                        <motion.div
                            whileHover={{ scale: 1.1, rotate: -6 }}
                            whileTap={{ scale: 0.88, rotate: 6 }}
                            transition={{ type: 'spring', stiffness: 500, damping: 14 }}
                            className="w-10 h-10 bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 cursor-pointer select-none"
                        >
                            {/* Crown — Young Serif proportions: classical 3-point, orbed tips */}
                            <svg viewBox="0 0 22 18" fill="currentColor" className="w-5 h-[1.1rem]">
                                <path d="M1 15 L4 5.5 L7.5 9.5 L11 1 L14.5 9.5 L18 5.5 L21 15 Z" />
                                <rect x="0.5" y="15" width="21" height="2.5" rx="1.25" />
                                <circle cx="4"  cy="5.5" r="1.6" />
                                <circle cx="11" cy="1"   r="1.6" />
                                <circle cx="18" cy="5.5" r="1.6" />
                            </svg>
                        </motion.div>
                        {!isCollapsed && (
                            <div className="overflow-hidden">
                                <div className="font-display text-lg leading-none whitespace-nowrap">Ctroom</div>
                                <div className="font-mono text-[10px] text-muted-foreground mt-1 whitespace-nowrap uppercase tracking-widest">Personal OS</div>
                            </div>
                        )}
                    </div>

                    {/* Navigation */}
                    <nav className="space-y-1">
                        {navItems.map(item => (
                            <button
                                key={item.id}
                                onClick={() => setCurrentView(item.id as View)}
                                className={cn(
                                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 text-sm font-medium group relative",
                                    currentView === item.id
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                                    isCollapsed && "justify-center"
                                )}
                                title={isCollapsed ? item.label : undefined}
                            >
                                <item.icon className={cn(
                                    "w-5 h-5 flex-shrink-0",
                                    currentView === item.id ? "text-primary-foreground" : "text-muted-foreground"
                                )} />
                                {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}

                                {/* Tooltip for collapsed state */}
                                {isCollapsed && (
                                    <div className="absolute left-full ml-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg">
                                        {item.label}
                                    </div>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="space-y-4">
                    {/* Usage Widget - Hidden when collapsed */}
                    {!isCollapsed && <UsageWidget usage={usage} onClick={() => setIsUsageModalOpen(true)} apiKeys={apiKeys} />}

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className={cn(
                            "flex items-center gap-3 p-3 w-full rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border/50",
                            isCollapsed && "justify-center"
                        )}
                        title={isCollapsed ? (theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
                    >
                        {!mounted ? (
                            <div className="w-5 h-5" />
                        ) : theme === 'dark' ? (
                            <Sun className="w-5 h-5 text-yellow-500" />
                        ) : (
                            <Moon className="w-5 h-5 text-indigo-500" />
                        )}
                        {!isCollapsed && (
                            <span className="text-sm font-medium flex-1 text-left">
                                {mounted ? (theme === 'dark' ? 'Light Mode' : 'Dark Mode') : 'Theme'}
                            </span>
                        )}
                    </button>

                    {/* User Profile Button */}
                    <button
                        onClick={() => setCurrentView('settings')}
                        className={cn(
                            "flex items-center gap-3 p-2 w-full rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border/50",
                            isCollapsed && "justify-center"
                        )}
                    >
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center overflow-hidden border border-border flex-shrink-0">
                            <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        {!isCollapsed && (
                            <>
                                <div className="text-left overflow-hidden flex-1">
                                    <div className="text-sm font-medium truncate">{userName}</div>
                                    <div className="text-xs text-muted-foreground truncate">{userEmail}</div>
                                </div>
                                <Settings className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            </>
                        )}
                    </button>
                </div>
            </div>
        </>
    );
};
