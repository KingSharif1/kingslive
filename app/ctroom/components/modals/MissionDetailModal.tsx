import React, { useState, useEffect } from 'react';
import {
    Mission, ActionItem, ActionItemStatus
} from '../../types';
import {
    X, CheckCircle, Calendar, Link as LinkIcon,
    Github, FileText, CheckSquare, Plus, Trash2,
    MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MissionDetailModalProps {
    mission: Mission;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (mission: Mission) => void;

    // Task Props
    tasks: ActionItem[];
    onAddTask: (task: Partial<ActionItem>) => Promise<void>;
    onUpdateTask: (taskId: string, updates: Partial<ActionItem>) => Promise<void>;
    onDeleteTask: (taskId: string) => Promise<void>;
}

export function MissionDetailModal({
    mission,
    isOpen,
    onClose,
    onUpdate,
    tasks,
    onAddTask,
    onUpdateTask,
    onDeleteTask
}: MissionDetailModalProps) {
    const [activeTab, setActiveTab] = useState<'tasks' | 'notes' | 'settings'>('tasks');
    const [localMission, setLocalMission] = useState<Mission>(mission);

    // Notes Auto-save timer
    const [isSavingNotes, setIsSavingNotes] = useState(false);

    useEffect(() => {
        setLocalMission(mission);
    }, [mission]);

    if (!isOpen) return null;

    const handleSaveField = (field: keyof Mission, value: any) => {
        const updated = { ...localMission, [field]: value };
        setLocalMission(updated);
        onUpdate(updated);
    };

    const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setLocalMission(prev => ({ ...prev, notes: e.target.value }));
    };

    const handleNotesBlur = () => {
        if (localMission.notes !== mission.notes) {
            onUpdate(localMission);
        }
    };

    // Quick Add Task
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const handleQuickAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        await onAddTask({
            title: newTaskTitle,
            missionId: mission.id,
            status: 'todo',
            priority: 'medium',
            category: 'work',
            date: new Date()
        });
        setNewTaskTitle('');
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const colors: any = {
            'active': 'bg-green-500/10 text-green-500 border-green-500/20',
            'on-hold': 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            'completed': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'archived': 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
        };
        return (
            <span className={cn("text-xs px-2 py-0.5 rounded-full border border-transparent capitalize", colors[status])}>
                {status}
            </span>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card w-full max-w-4xl h-[85vh] rounded-xl shadow-2xl border border-border flex flex-col overflow-hidden"
            >
                {/* Header */}
                <div className="h-48 relative shrink-0">
                    <div
                        className="absolute inset-0 opacity-20"
                        style={{ backgroundColor: mission.color }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />

                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between z-10">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-lg border border-white/10"
                                style={{ backgroundColor: mission.color }}
                            >
                                {mission.icon || '🚀'}
                            </div>
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <h2 className="text-3xl font-bold">{mission.name}</h2>
                                    <StatusBadge status={mission.status} />
                                </div>
                                <p className="text-muted-foreground line-clamp-1 max-w-lg">
                                    {mission.description || "No description provided."}
                                </p>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2">
                            {mission.repoUrl && (
                                <a
                                    href={mission.repoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary/50 hover:bg-secondary text-xs font-medium rounded-lg transition-colors border border-border"
                                >
                                    <Github className="w-3.5 h-3.5" />
                                    Repository
                                </a>
                            )}
                            <div className="px-3 py-1.5 bg-secondary/30 text-xs font-medium rounded-lg border border-border flex items-center gap-2">
                                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                                {mission.targetDate ? format(new Date(mission.targetDate), 'MMM d, yyyy') : 'No Deadline'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-border flex items-center gap-6 shrink-0 bg-card">
                    <button
                        onClick={() => setActiveTab('tasks')}
                        className={cn("py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'tasks' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        <CheckSquare className="w-4 h-4" /> Tasks
                    </button>
                    <button
                        onClick={() => setActiveTab('notes')}
                        className={cn("py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'notes' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        <FileText className="w-4 h-4" /> Notes & Ideas
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={cn("py-4 text-sm font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'settings' ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground")}
                    >
                        <MoreHorizontal className="w-4 h-4" /> Settings
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-secondary/5">

                    {/* TASKS TAB */}
                    {activeTab === 'tasks' && (
                        <div className="max-w-3xl mx-auto space-y-6">
                            {/* Add Task */}
                            <form onSubmit={handleQuickAddTask} className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Add a new task to this mission..."
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    className="flex-1 bg-card border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <button type="submit" className="px-4 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
                                    Add
                                </button>
                            </form>

                            {/* Task List */}
                            <div className="space-y-2">
                                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Active Tasks</h3>
                                {tasks.filter(t => t.status !== 'done').length === 0 && (
                                    <div className="text-center py-10 text-muted-foreground border-2 border-dashed border-border rounded-xl">
                                        No active tasks. Good job?
                                    </div>
                                )}
                                {tasks.filter(t => t.status !== 'done').map(task => (
                                    <div key={task.id} className="group flex items-center gap-3 p-3 bg-card border border-border rounded-lg hover:border-primary/30 transition-colors">
                                        <button
                                            onClick={() => onUpdateTask(task.id, { status: 'done' })}
                                            className="w-5 h-5 rounded border border-muted-foreground hover:border-primary flex items-center justify-center transition-colors"
                                        >
                                            <div className="w-3 h-3 rounded-sm bg-transparent" />
                                        </button>
                                        <span className="flex-1 font-medium">{task.title}</span>
                                        <span className={cn("text-xs px-2 py-0.5 rounded capitalize",
                                            task.priority === 'high' ? 'text-red-400 bg-red-400/10' : 'text-zinc-500 bg-zinc-500/10'
                                        )}>
                                            {task.priority}
                                        </span>
                                        <button
                                            onClick={() => onDeleteTask(task.id)}
                                            className="opacity-0 group-hover:opacity-100 p-2 text-muted-foreground hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                ))}

                                {/* Completed */}
                                {tasks.some(t => t.status === 'done') && (
                                    <div className="mt-8 pt-4 border-t border-border/50">
                                        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Completed</h3>
                                        {tasks.filter(t => t.status === 'done').map(task => (
                                            <div key={task.id} className="flex items-center gap-3 p-2 opacity-50 hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => onUpdateTask(task.id, { status: 'todo' })}
                                                    className="w-5 h-5 rounded border border-primary bg-primary flex items-center justify-center text-primary-foreground"
                                                >
                                                    <CheckCircle className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="flex-1 line-through decoration-muted-foreground">{task.title}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* NOTES TAB */}
                    {activeTab === 'notes' && (
                        <div className="h-full max-w-4xl mx-auto flex flex-col">
                            <div className="flex-1 bg-card border border-border rounded-xl p-6 shadow-sm">
                                <textarea
                                    className="w-full h-full bg-transparent resize-none focus:outline-none text-lg leading-relaxed placeholder:text-muted-foreground/30"
                                    placeholder="Write your mission notes, ideas, and scratchpad here..."
                                    value={localMission.notes || ''}
                                    onChange={handleNotesChange}
                                    onBlur={handleNotesBlur}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground mt-2 text-right">
                                {isSavingNotes ? 'Saving...' : 'Auto-saves on blur'}
                            </p>
                        </div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="max-w-2xl mx-auto space-y-8">
                            {/* Status */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Mission Status</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {['active', 'on-hold', 'completed', 'archived'].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => handleSaveField('status', s)}
                                            className={cn(
                                                "px-4 py-2 rounded-lg border capitalize text-sm transition-all",
                                                localMission.status === s
                                                    ? "bg-primary text-primary-foreground border-primary"
                                                    : "bg-card border-border hover:border-primary/50"
                                            )}
                                        >
                                            {s.replace('-', ' ')}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Repo URL */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Git Repository</label>
                                <div className="flex gap-2">
                                    <div className="w-10 h-10 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground">
                                        <Github className="w-5 h-5" />
                                    </div>
                                    <input
                                        type="url"
                                        value={localMission.repoUrl || ''}
                                        onChange={(e) => setLocalMission(prev => ({ ...prev, repoUrl: e.target.value }))}
                                        onBlur={(e) => handleSaveField('repoUrl', e.target.value)}
                                        placeholder="https://github.com/username/project"
                                        className="flex-1 bg-card border border-border rounded-lg px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Start Date</label>
                                    <input
                                        type="date"
                                        value={localMission.startDate ? format(new Date(localMission.startDate), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => handleSaveField('startDate', new Date(e.target.value))}
                                        className="w-full bg-card border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-sm font-medium">Target Date</label>
                                    <input
                                        type="date"
                                        value={localMission.targetDate ? format(new Date(localMission.targetDate), 'yyyy-MM-dd') : ''}
                                        onChange={(e) => handleSaveField('targetDate', new Date(e.target.value))}
                                        className="w-full bg-card border border-border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-3">
                                <label className="text-sm font-medium">Description</label>
                                <textarea
                                    rows={4}
                                    value={localMission.description || ''}
                                    onChange={(e) => setLocalMission(prev => ({ ...prev, description: e.target.value }))}
                                    onBlur={(e) => handleSaveField('description', e.target.value)}
                                    className="w-full bg-card border border-border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
