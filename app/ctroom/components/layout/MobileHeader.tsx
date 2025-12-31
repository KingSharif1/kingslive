import React from 'react';
import { Menu, X, LayoutDashboard, MessageSquare, CheckSquare, Lightbulb, FileText } from 'lucide-react';
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
                    <div className="w-8 h-8 bg-primary text-primary-foreground rounded-lg flex items-center justify-center font-bold">C</div>
                    <span className="font-bold text-lg">Ctroom</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">
                    {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
            </div>

            {isMobileMenuOpen && (
                <div className="md:hidden fixed inset-0 z-40 bg-background pt-24 px-6 animate-in slide-in-from-top-10">
                    <nav className="space-y-2">
                        {[
                            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
                            { id: 'chat', icon: MessageSquare, label: 'Milo Chat' },
                            { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
                            { id: 'ideas', icon: Lightbulb, label: 'Ideas' },
                            { id: 'blog', icon: FileText, label: 'Blog' },
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
