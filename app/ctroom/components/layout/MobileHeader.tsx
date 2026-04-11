import React from 'react';
import { Menu, X, LayoutDashboard, MessageSquare, Target, Calendar, Vault, FileText, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { View } from '../../types/index';

interface MobileHeaderProps {
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: (val: boolean) => void;
    currentView: View;
    setCurrentView: (view: View) => void;
}

export const MobileHeader = ({ isMobileMenuOpen, setIsMobileMenuOpen, currentView, setCurrentView }: MobileHeaderProps) => {
    return (
        <>
            <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center">
                        <svg viewBox="0 0 22 18" fill="currentColor" className="w-4 h-[0.85rem]">
                            <path d="M1 15 L4 5.5 L7.5 9.5 L11 1 L14.5 9.5 L18 5.5 L21 15 Z" />
                            <rect x="0.5" y="15" width="21" height="2.5" rx="1.25" />
                            <circle cx="4"  cy="5.5" r="1.6" />
                            <circle cx="11" cy="1"   r="1.6" />
                            <circle cx="18" cy="5.5" r="1.6" />
                        </svg>
                    </div>
                    <span className="font-display text-lg">Ctroom</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-background pt-24 px-6 animate-in slide-in-from-top-10">
                    <nav className="space-y-2">
                        {[
                            { id: 'dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
                            { id: 'dreamboard', icon: Sparkles,         label: 'Dreamboard' },
                            { id: 'missions',   icon: Target,           label: 'Projects'   },
                            { id: 'planner',    icon: Calendar,         label: 'Planner'    },
                            { id: 'chat',       icon: MessageSquare,    label: 'Milo'       },
                            { id: 'vault',      icon: Vault,            label: 'Vault'      },
                            { id: 'blog',       icon: FileText,         label: 'Blog'       },
                        ].map(item => (
                            <button
                                key={item.id}
                                onClick={() => { setCurrentView(item.id as View); setIsMobileMenuOpen(false); }}
                                className={cn(
                                    "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                                    currentView === item.id ? "bg-primary text-primary-foreground border-primary" : "border-border/50 hover:bg-secondary"
                                )}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="text-lg font-medium">{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            )}
        </>
    );
};
