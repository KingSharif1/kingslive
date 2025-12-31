/**
 * TaskFormModal - Enhanced Task/Habit Creation Form
 */
import React, { useState } from 'react';
import { X, Calendar, Clock, Repeat, Flag, ChevronDown, Check } from 'lucide-react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { TaskType, TaskCategory, TaskPriority, HabitFrequency, Project } from '../../types/index';

interface TaskFormState {
    title: string;
    description: string;
    taskType: TaskType;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: Date;
    dueTime: string;
    habitFrequency: HabitFrequency;
    habitDuration: number;
    habitCustomDays: number[];
    projectId: string;
}

interface TaskFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    taskForm: TaskFormState;
    setTaskForm: React.Dispatch<React.SetStateAction<TaskFormState>>;
    onSubmit: () => void;
    projects: Project[];
}

const PRIORITIES: { value: TaskPriority; label: string; color: string }[] = [
    { value: 'high', label: 'High', color: 'text-red-500 bg-red-500/10 border-red-500/30' },
    { value: 'medium', label: 'Medium', color: 'text-orange-500 bg-orange-500/10 border-orange-500/30' },
    { value: 'low', label: 'Low', color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
];

const HABIT_FREQUENCIES: { value: HabitFrequency; label: string; desc: string }[] = [
    { value: 'daily', label: 'Daily', desc: 'Every day' },
    { value: 'weekdays', label: 'Weekdays', desc: 'Mon-Fri' },
    { value: 'weekends', label: 'Weekends', desc: 'Sat-Sun' },
    { value: 'weekly', label: 'Weekly', desc: 'Once a week' },
    { value: 'custom', label: 'Custom', desc: 'Pick days' },
];

const HABIT_DURATIONS = [7, 14, 21, 30, 60, 90, 365];
const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const TaskFormModal = ({ isOpen, onClose, taskForm, setTaskForm, onSubmit, projects }: TaskFormModalProps) => {
    const [showProjectPicker, setShowProjectPicker] = useState(false);

    if (!isOpen) return null;

    const selectedProject = projects.find(p => p.id === taskForm.projectId);

    const updateField = <K extends keyof TaskFormState>(key: K, value: TaskFormState[K]) => {
        setTaskForm(prev => ({ ...prev, [key]: value }));
    };

    const toggleCustomDay = (day: number) => {
        setTaskForm(prev => ({
            ...prev,
            habitCustomDays: prev.habitCustomDays.includes(day)
                ? prev.habitCustomDays.filter(d => d !== day)
                : [...prev.habitCustomDays, day].sort()
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                className="bg-background border border-border rounded-t-3xl md:rounded-2xl w-full md:max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border/50">
                    <h3 className="font-semibold text-lg">
                        {taskForm.taskType === 'task' ? 'New Task' : 'New Habit'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-5">

                    {/* Type Toggle */}
                    <div className="flex bg-secondary/50 rounded-xl p-1">
                        {(['task', 'habit'] as TaskType[]).map(type => (
                            <button
                                key={type}
                                onClick={() => updateField('taskType', type)}
                                className={cn(
                                    "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all capitalize",
                                    taskForm.taskType === type
                                        ? "bg-background shadow-sm text-foreground"
                                        : "text-muted-foreground hover:text-foreground"
                                )}
                            >
                                {type}
                            </button>
                        ))}
                    </div>

                    {/* Title Input */}
                    <div>
                        <input
                            autoFocus
                            type="text"
                            placeholder={taskForm.taskType === 'task' ? "What needs to be done?" : "What habit are you building?"}
                            value={taskForm.title}
                            onChange={(e) => updateField('title', e.target.value)}
                            className="w-full text-lg font-medium bg-transparent border-none focus:ring-0 focus:outline-none p-0 placeholder:text-muted-foreground/40"
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <textarea
                            placeholder="Add description (optional)"
                            value={taskForm.description}
                            onChange={(e) => updateField('description', e.target.value)}
                            rows={2}
                            className="w-full bg-secondary/30 border border-border/50 rounded-xl p-3 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/40"
                        />
                    </div>

                    {/* Quick Options Row */}
                    <div className="flex flex-wrap gap-2">
                        {/* Project Picker */}
                        <div className="relative">
                            <button
                                onClick={() => setShowProjectPicker(!showProjectPicker)}
                                className="flex items-center gap-2 px-3 py-2 bg-secondary/50 hover:bg-secondary rounded-xl text-sm font-medium transition-colors border border-border/50"
                            >
                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: selectedProject?.color || '#6b7280' }} />
                                <span className="max-w-[100px] truncate">{selectedProject?.name || 'Inbox'}</span>
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            </button>

                            <AnimatePresence>
                                {showProjectPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -10 }}
                                        className="absolute left-0 top-full mt-1 w-48 bg-card border border-border rounded-xl shadow-xl z-10 overflow-hidden"
                                    >
                                        {projects.map(project => (
                                            <button
                                                key={project.id}
                                                onClick={() => { updateField('projectId', project.id); setShowProjectPicker(false); }}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-secondary transition-colors text-left",
                                                    taskForm.projectId === project.id && "bg-primary/10"
                                                )}
                                            >
                                                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: project.color }} />
                                                <span className="flex-1">{project.name}</span>
                                                {taskForm.projectId === project.id && <Check className="w-4 h-4 text-primary" />}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Priority */}
                        <div className="flex gap-1">
                            {PRIORITIES.map(p => (
                                <button
                                    key={p.value}
                                    onClick={() => updateField('priority', p.value)}
                                    className={cn(
                                        "px-3 py-2 rounded-xl text-xs font-medium transition-all border",
                                        taskForm.priority === p.value ? p.color : "bg-secondary/50 text-muted-foreground border-transparent hover:border-border"
                                    )}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* TASK-SPECIFIC: Date & Time */}
                    {taskForm.taskType === 'task' && (
                        <div className="space-y-3">
                            <label className="text-sm font-medium text-muted-foreground">Due Date & Time</label>
                            <div className="flex gap-3">
                                {/* Date Input */}
                                <div className="flex-1 relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="date"
                                        value={format(taskForm.dueDate, 'yyyy-MM-dd')}
                                        onChange={(e) => updateField('dueDate', new Date(e.target.value))}
                                        className="w-full bg-secondary/50 border border-border/50 rounded-xl pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>

                                {/* Time Input */}
                                <div className="w-32 relative">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        <Clock className="w-4 h-4" />
                                    </div>
                                    <input
                                        type="time"
                                        value={taskForm.dueTime}
                                        onChange={(e) => updateField('dueTime', e.target.value)}
                                        placeholder="--:--"
                                        className="w-full bg-secondary/50 border border-border/50 rounded-xl pl-10 pr-3 py-3 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* HABIT-SPECIFIC: Frequency & Duration */}
                    {taskForm.taskType === 'habit' && (
                        <div className="space-y-4">
                            {/* Frequency */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block flex items-center gap-2">
                                    <Repeat className="w-4 h-4" /> Repeat Frequency
                                </label>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {HABIT_FREQUENCIES.map(freq => (
                                        <button
                                            key={freq.value}
                                            onClick={() => updateField('habitFrequency', freq.value)}
                                            className={cn(
                                                "p-3 rounded-xl text-left transition-all border",
                                                taskForm.habitFrequency === freq.value
                                                    ? "bg-primary/10 border-primary/30 text-primary"
                                                    : "bg-secondary/30 border-border/50 hover:border-border"
                                            )}
                                        >
                                            <div className="text-sm font-medium">{freq.label}</div>
                                            <div className="text-xs text-muted-foreground">{freq.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Days */}
                            {taskForm.habitFrequency === 'custom' && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-2 block">Select Days</label>
                                    <div className="flex gap-1">
                                        {DAYS_OF_WEEK.map((day, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => toggleCustomDay(idx)}
                                                className={cn(
                                                    "flex-1 py-2 rounded-lg text-xs font-medium transition-all",
                                                    taskForm.habitCustomDays.includes(idx)
                                                        ? "bg-primary text-primary-foreground"
                                                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                                                )}
                                            >
                                                {day}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Duration */}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">
                                    Duration (how long to track?)
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {HABIT_DURATIONS.map(days => (
                                        <button
                                            key={days}
                                            onClick={() => updateField('habitDuration', days)}
                                            className={cn(
                                                "px-3 py-2 rounded-xl text-sm font-medium transition-all border",
                                                taskForm.habitDuration === days
                                                    ? "bg-primary/10 border-primary/30 text-primary"
                                                    : "bg-secondary/30 border-border/50 hover:border-border"
                                            )}
                                        >
                                            {days === 365 ? '1 year' : `${days} days`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border/50 bg-secondary/10">
                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl border border-border/50 hover:bg-secondary transition-colors font-medium text-sm"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onSubmit}
                            disabled={!taskForm.title.trim()}
                            className={cn(
                                "flex-1 py-3 rounded-xl font-medium text-sm transition-all",
                                taskForm.title.trim()
                                    ? "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                            )}
                        >
                            {taskForm.taskType === 'task' ? 'Add Task' : 'Start Habit'}
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* Click outside to close project picker */}
            {showProjectPicker && (
                <div className="fixed inset-0 z-0" onClick={() => setShowProjectPicker(false)} />
            )}
        </div>
    );
};
