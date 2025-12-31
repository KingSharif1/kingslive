/**
 * DashboardView - Clean Overview Dashboard
 * Mobile-optimized, compact design
 */
import React from 'react';
import { Lightbulb, CheckSquare, Bot, CheckCircle2, ArrowRight, Plus, Flame, Repeat } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, Idea, View } from '../../types/';

interface DashboardViewProps {
    tasks: Task[];
    ideas: Idea[];
    setCurrentView: (view: View) => void;
    toggleTaskStatus: (id: string) => void;
    handleNewIdea: () => void;
    setIsTaskModalOpen: (val: boolean) => void;
    loadIdea: (idea: Idea) => void;
}

export const DashboardView = ({
    tasks,
    ideas,
    setCurrentView,
    toggleTaskStatus,
    handleNewIdea,
    setIsTaskModalOpen,
    loadIdea
}: DashboardViewProps) => {
    // Get current time greeting
    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20 md:pb-0">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{getGreeting()}, King.</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        {tasks.filter(t => t.status !== 'done').length} tasks pending • {ideas.length} notes
                    </p>
                </div>
                <span className="text-xs text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50 self-start">
                    {format(new Date(), 'EEEE, MMMM do')}
                </span>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 bg-card border border-border/40 rounded-2xl">
                    <div className="text-2xl font-bold text-primary">{tasks.filter(t => t.status === 'todo').length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Pending</div>
                </div>
                <div className="p-4 bg-card border border-border/40 rounded-2xl">
                    <div className="text-2xl font-bold text-emerald-600">{tasks.filter(t => t.status === 'done').length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Done</div>
                </div>
                <div className="p-4 bg-card border border-border/40 rounded-2xl">
                    <div className="text-2xl font-bold text-indigo-600">{ideas.length}</div>
                    <div className="text-xs text-muted-foreground mt-1">Notes</div>
                </div>
                <div className="p-4 bg-card border border-border/40 rounded-2xl">
                    <div className="text-2xl font-bold text-orange-600">
                        {tasks.filter(t => t.taskType === 'habit' && (t.habitStreak || 0) > 0).reduce((max, t) => Math.max(max, t.habitStreak || 0), 0)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Flame className="w-3 h-3" /> Best Streak
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

                {/* Tasks Section */}
                <div className="lg:col-span-2 bg-card border border-border/40 rounded-2xl overflow-hidden">
                    <div className="flex items-center justify-between p-4 border-b border-border/40">
                        <h3 className="font-semibold">Today's Tasks</h3>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setCurrentView('tasks')}
                                className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                                View All <ArrowRight className="w-3 h-3" />
                            </button>
                        </div>
                    </div>

                    <div className="divide-y divide-border/30">
                        {tasks.slice(0, 5).map(task => (
                            <div key={task.id} className="flex items-center gap-3 p-3 hover:bg-secondary/20 transition-colors">
                                <button
                                    onClick={() => toggleTaskStatus(task.id)}
                                    className={cn(
                                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                                        task.status === 'done'
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : task.priority === 'high'
                                                ? "border-red-500 hover:bg-red-500/10"
                                                : "border-muted-foreground/40 hover:border-primary"
                                    )}
                                >
                                    {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                                </button>

                                <div className="flex-1 min-w-0">
                                    <div className={cn(
                                        "text-sm font-medium truncate",
                                        task.status === 'done' && "text-muted-foreground line-through"
                                    )}>
                                        {task.title}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {task.taskType === 'habit' && (
                                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                                <Repeat className="w-2.5 h-2.5" />
                                                {task.habitStreak && task.habitStreak > 0 && (
                                                    <span className="flex items-center gap-0.5">
                                                        <Flame className="w-2.5 h-2.5" /> {task.habitStreak}
                                                    </span>
                                                )}
                                            </span>
                                        )}
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded",
                                            task.priority === 'high' ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-secondary text-muted-foreground"
                                        )}>
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {tasks.length === 0 && (
                            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                                <CheckCircle2 className="w-8 h-8 mb-2 opacity-20" />
                                <p className="text-sm">No tasks yet</p>
                                <button
                                    onClick={() => setIsTaskModalOpen(true)}
                                    className="mt-3 text-xs text-primary hover:underline"
                                >
                                    Add your first task
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                    {/* Quick Actions */}
                    <div className="bg-card border border-border/40 rounded-2xl p-4">
                        <h3 className="font-semibold text-sm mb-3">Quick Actions</h3>
                        <div className="space-y-2">
                            <button
                                onClick={handleNewIdea}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                            >
                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 rounded-lg">
                                    <Lightbulb className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">New Note</span>
                            </button>
                            <button
                                onClick={() => setIsTaskModalOpen(true)}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                            >
                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                    <CheckSquare className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Add Task</span>
                            </button>
                            <button
                                onClick={() => setCurrentView('chat')}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-secondary transition-colors text-left"
                            >
                                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-medium">Ask Milo</span>
                            </button>
                        </div>
                    </div>

                    {/* Recent Notes */}
                    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b border-border/40">
                            <h3 className="font-semibold text-sm">Recent Notes</h3>
                            <button onClick={handleNewIdea} className="p-1 hover:bg-secondary rounded">
                                <Plus className="w-4 h-4 text-muted-foreground" />
                            </button>
                        </div>
                        <div className="divide-y divide-border/30">
                            {ideas.slice(0, 3).map(idea => (
                                <div
                                    key={idea.id}
                                    onClick={() => { loadIdea(idea); setCurrentView('ideas'); }}
                                    className="p-3 hover:bg-secondary/30 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="font-medium text-sm truncate">{idea.title}</h4>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                            {format(idea.date, 'MMM d')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{idea.content}</p>
                                </div>
                            ))}
                            {ideas.length === 0 && (
                                <div className="p-6 text-center text-muted-foreground text-sm">
                                    No notes yet
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
