import React, { useEffect, useState } from 'react';
import {
    LayoutDashboard,
    MessageSquare,
    Lightbulb,
    CheckSquare,
    FileText,
    Settings,
    User,
    ChevronLeft,
    ChevronRight,
    Sun,
    Moon
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
    userName
}: SidebarProps) => {
    const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);

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
        { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { id: 'chat', icon: MessageSquare, label: 'Milo Chat' },
        { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
        { id: 'ideas', icon: Lightbulb, label: 'Ideas' },
        { id: 'blog', icon: FileText, label: 'Blog' },
        { id: 'settings', icon: Settings, label: 'Settings' },
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
                    <div className="w-10 h-10 bg-gradient-to-tr from-primary to-primary/80 text-primary-foreground rounded-xl flex items-center justify-center font-bold text-xl shadow-lg flex-shrink-0">
                        C
                    </div>
                    {!isCollapsed && (
                        <div className="overflow-hidden">
                            <div className="font-bold text-lg tracking-tight leading-none whitespace-nowrap">Ctroom</div>
                            <div className="text-xs text-muted-foreground mt-1 whitespace-nowrap">Personal OS v2.1</div>
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
                {!isCollapsed && <UsageWidget usage={usage} onClick={() => setIsUsageModalOpen(true)} />}

                {/* Theme Toggle */}
                <button
                    onClick={toggleTheme}
                    className={cn(
                        "flex items-center gap-3 p-3 w-full rounded-xl hover:bg-secondary transition-colors border border-transparent hover:border-border/50",
                        isCollapsed && "justify-center"
                    )}
                    title={isCollapsed ? (theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode') : undefined}
                >
                    {theme === 'dark' ? (
                        <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                        <Moon className="w-5 h-5 text-indigo-500" />
                    )}
                    {!isCollapsed && (
                        <span className="text-sm font-medium flex-1 text-left">
                            {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
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
