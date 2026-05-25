'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Mission, ActionItem, ActionItemStatus, ActionItemPriority, NoteBlock } from '../../types';
import {
    X, CheckCircle2, CheckCircle, Calendar, Github, FileText, CheckSquare, Plus, Trash2,
    MoreHorizontal, Settings, Pencil, Circle, ArrowUpRight, GitCommit,
    AlertCircle, GitPullRequest, Star, GitFork, RefreshCw, Loader2,
    ChevronDown, ChevronUp, Clock, Hash, Flame, Search, Lock, Check, Globe,
    AlertTriangle, Zap
} from 'lucide-react';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { WorkTab, LogsTab } from './ProjectTabs';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface MissionDetailModalProps {
    mission: Mission;
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (mission: Mission) => void;
    tasks: ActionItem[];
    onAddTask: (task: Partial<ActionItem>) => Promise<void>;
    onUpdateTask: (taskId: string, updates: Partial<ActionItem>) => Promise<void>;
    onDeleteTask: (taskId: string) => Promise<void>;
    githubToken?: string;
}

type Tab = 'work' | 'logs' | 'github' | 'settings';

const PRIORITY_CONFIG: Record<ActionItemPriority, { label: string; color: string; dot: string }> = {
    low:      { label: 'Low',      color: 'text-zinc-400',   dot: 'bg-zinc-400' },
    medium:   { label: 'Medium',   color: 'text-blue-400',   dot: 'bg-blue-400' },
    high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
    critical: { label: 'Critical', color: 'text-red-500',    dot: 'bg-red-500' },
};

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#10b981',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
];
const ICONS = ['🚀', '🎯', '💡', '💻', '📚', '✈️', '🎨', '💸', '🏥', '🏠', '🔥', '⚡', '🛡️', '🌱'];

// ─────────────────────────────────────────────
// Note block helpers
// ─────────────────────────────────────────────

function parseNoteBlocks(raw?: string): NoteBlock[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch {}
    // Legacy plain string → single block
    return [{ id: crypto.randomUUID(), content: raw, createdAt: new Date().toISOString() }];
}

function serializeNoteBlocks(blocks: NoteBlock[]): string {
    return JSON.stringify(blocks);
}

function dateLabel(iso: string) {
    const d = new Date(iso);
    if (isToday(d)) return `Today at ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday at ${format(d, 'h:mm a')}`;
    return format(d, 'MMM d, yyyy · h:mm a');
}

// ─────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────

export function MissionDetailModal({
    mission, isOpen, onClose, onUpdate,
    tasks, onAddTask, onUpdateTask, onDeleteTask,
    githubToken
}: MissionDetailModalProps) {
    const [activeTab, setActiveTab] = useState<Tab>('work');
    const [local, setLocal] = useState<Mission>(mission);

    useEffect(() => { setLocal(mission); }, [mission]);
    if (!isOpen || !mission) return null;

    const saveField = (field: keyof Mission, value: any) => {
        const updated = { ...local, [field]: value };
        setLocal(updated);
        onUpdate(updated);
    };

    const repoOwnerRepo = local.repoUrl
        ? local.repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '')
        : null;

    const tabs: { id: Tab; icon: React.ElementType; label: string }[] = [
        { id: 'work',     icon: CheckSquare, label: 'Tasks'    },
        { id: 'github',   icon: Github,      label: 'GitHub'   },
        { id: 'settings', icon: Settings,    label: 'Settings' },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 8 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 8 }}
                className="bg-card w-full max-w-4xl h-[88vh] rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden"
            >
                {/* Hero Header */}
                <div className="h-40 relative shrink-0 overflow-hidden">
                    <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${local.color}25 0%, ${local.color}08 100%)` }} />
                    <div className="absolute inset-0 bg-gradient-to-t from-card via-card/20 to-transparent" />
                    {/* dot grid */}
                    <div className="absolute inset-0 opacity-10"
                        style={{ backgroundImage: `radial-gradient(circle, ${local.color} 1px, transparent 1px)`, backgroundSize: '24px 24px' }}
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-1.5 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors z-20"
                    >
                        <X size={16} />
                    </button>
                    <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between z-10">
                        <div className="flex items-center gap-4">
                            <div
                                className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg border border-white/10 flex-shrink-0"
                                style={{ backgroundColor: local.color }}
                            >
                                {local.icon || '🚀'}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-foreground">{local.name}</h2>
                                {local.description && (
                                    <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1 max-w-md">{local.description}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background/60 border border-border rounded-lg text-xs backdrop-blur-sm">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: local.color }} />
                                <span className="font-medium text-foreground">{local.progress}%</span>
                            </div>
                            {local.targetDate && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-background/60 border border-border rounded-lg text-xs backdrop-blur-sm">
                                    <Calendar size={11} className="text-muted-foreground" />
                                    <span>{format(new Date(local.targetDate), 'MMM d, yyyy')}</span>
                                </div>
                            )}
                            {local.repoUrl && (
                                <a
                                    href={local.repoUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-background/60 border border-border rounded-lg text-xs backdrop-blur-sm hover:border-primary/40 transition-colors"
                                >
                                    <Github size={11} />
                                    <span>Repo</span>
                                    <ArrowUpRight size={10} />
                                </a>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="px-6 border-b border-border flex items-center gap-1 shrink-0 bg-card">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                                activeTab === tab.id
                                    ? "border-primary text-primary"
                                    : "border-transparent text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <tab.icon size={14} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto bg-secondary/5">
                    {activeTab === 'work' && (
                        <WorkTab
                            mission={local}
                            tasks={tasks}
                            onAddTask={onAddTask}
                            onUpdateTask={onUpdateTask}
                            onDeleteTask={onDeleteTask}
                            onUpdate={saveField}
                        />
                    )}
                    {activeTab === 'github' && (
                        <GitHubTab repoOwnerRepo={repoOwnerRepo} token={githubToken} />
                    )}
                    {activeTab === 'settings' && (
                        <SettingsTab mission={local} setMission={setLocal} onSaveField={saveField} />
                    )}
                </div>
            </motion.div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Tasks Tab
// ─────────────────────────────────────────────

function TasksTab({ mission, tasks, onAddTask, onUpdateTask, onDeleteTask }: {
    mission: Mission;
    tasks: ActionItem[];
    onAddTask: (t: Partial<ActionItem>) => Promise<void>;
    onUpdateTask: (id: string, u: Partial<ActionItem>) => Promise<void>;
    onDeleteTask: (id: string) => Promise<void>;
}) {
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState<ActionItemPriority>('medium');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [showDone, setShowDone] = useState(false);

    const active = tasks.filter(t => t.status !== 'done' && t.status !== 'archived');
    const done = tasks.filter(t => t.status === 'done');

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;
        await onAddTask({
            title: title.trim(),
            missionId: mission.id,
            status: 'todo',
            priority,
            category: 'work',
            date: new Date()
        });
        setTitle('');
        setPriority('medium');
    };

    const startEdit = (task: ActionItem) => {
        setEditingId(task.id);
        setEditTitle(task.title);
    };

    const commitEdit = async (taskId: string) => {
        if (editTitle.trim()) {
            await onUpdateTask(taskId, { title: editTitle.trim() });
        }
        setEditingId(null);
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-5">
            {/* Add Task */}
            <form onSubmit={handleAdd} className="flex gap-2 items-center bg-card border border-border rounded-xl p-2 shadow-sm">
                <div className="flex-1 flex items-center gap-2">
                    <Circle size={16} className="text-muted-foreground flex-shrink-0 ml-1" />
                    <input
                        type="text"
                        placeholder="Add a task..."
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/50"
                    />
                </div>
                {/* Priority picker */}
                <div className="flex items-center gap-1 border-l border-border pl-2">
                    {(Object.keys(PRIORITY_CONFIG) as ActionItemPriority[]).map(p => (
                        <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            title={PRIORITY_CONFIG[p].label}
                            className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                                priority === p ? "ring-2 ring-offset-1 ring-offset-card ring-primary scale-110" : "opacity-40 hover:opacity-80"
                            )}
                        >
                            <div className={cn("w-2.5 h-2.5 rounded-full", PRIORITY_CONFIG[p].dot)} />
                        </button>
                    ))}
                </div>
                <button
                    type="submit"
                    disabled={!title.trim()}
                    className="px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                    Add
                </button>
            </form>

            {/* Active Tasks */}
            <div className="space-y-1.5">
                {active.length === 0 && (
                    <div className="text-center py-12 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm">
                        No tasks yet. Add one above.
                    </div>
                )}
                <AnimatePresence>
                    {active.map(task => (
                        <TaskRow
                            key={task.id}
                            task={task}
                            isEditing={editingId === task.id}
                            editTitle={editTitle}
                            setEditTitle={setEditTitle}
                            onStartEdit={() => startEdit(task)}
                            onCommitEdit={() => commitEdit(task.id)}
                            onToggle={() => onUpdateTask(task.id, { status: 'done' })}
                            onChangePriority={p => onUpdateTask(task.id, { priority: p })}
                            onDelete={() => onDeleteTask(task.id)}
                        />
                    ))}
                </AnimatePresence>
            </div>

            {/* Completed */}
            {done.length > 0 && (
                <div>
                    <button
                        onClick={() => setShowDone(v => !v)}
                        className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider font-medium hover:text-foreground transition-colors mb-2"
                    >
                        {showDone ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        Completed ({done.length})
                    </button>
                    <AnimatePresence>
                        {showDone && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="space-y-1.5 overflow-hidden"
                            >
                                {done.map(task => (
                                    <TaskRow
                                        key={task.id}
                                        task={task}
                                        isEditing={false}
                                        editTitle=""
                                        setEditTitle={() => {}}
                                        onStartEdit={() => {}}
                                        onCommitEdit={() => {}}
                                        onToggle={() => onUpdateTask(task.id, { status: 'todo' })}
                                        onChangePriority={p => onUpdateTask(task.id, { priority: p })}
                                        onDelete={() => onDeleteTask(task.id)}
                                        done
                                    />
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

function TaskRow({
    task, isEditing, editTitle, setEditTitle, onStartEdit, onCommitEdit,
    onToggle, onChangePriority, onDelete, done = false
}: {
    task: ActionItem;
    isEditing: boolean;
    editTitle: string;
    setEditTitle: (v: string) => void;
    onStartEdit: () => void;
    onCommitEdit: () => void;
    onToggle: () => void;
    onChangePriority: (p: ActionItemPriority) => void;
    onDelete: () => void;
    done?: boolean;
}) {
    const [showPriorityPicker, setShowPriorityPicker] = useState(false);
    const cfg = PRIORITY_CONFIG[task.priority];

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: done ? 0.55 : 1, y: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="group flex items-center gap-3 px-3 py-2.5 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors relative"
        >
            {/* Check button */}
            <button onClick={onToggle} className="flex-shrink-0">
                {done
                    ? <CheckCircle2 size={18} className="text-primary" />
                    : <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                }
            </button>

            {/* Title */}
            {isEditing ? (
                <input
                    autoFocus
                    className="flex-1 bg-transparent text-sm focus:outline-none border-b border-primary"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={onCommitEdit}
                    onKeyDown={e => { if (e.key === 'Enter') onCommitEdit(); if (e.key === 'Escape') onCommitEdit(); }}
                />
            ) : (
                <span
                    className={cn("flex-1 text-sm cursor-text select-none", done && "line-through text-muted-foreground")}
                    onDoubleClick={onStartEdit}
                    title="Double-click to edit"
                >
                    {task.title}
                </span>
            )}

            {/* Priority dot */}
            <div className="relative">
                <button
                    onClick={e => { e.stopPropagation(); setShowPriorityPicker(v => !v); }}
                    className={cn("flex items-center gap-1 text-xs opacity-60 hover:opacity-100 transition-opacity", cfg.color)}
                    title={`Priority: ${cfg.label}`}
                >
                    <div className={cn("w-2 h-2 rounded-full", cfg.dot)} />
                    <span className="hidden group-hover:inline">{cfg.label}</span>
                </button>
                <AnimatePresence>
                    {showPriorityPicker && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="absolute right-0 bottom-full mb-1 bg-card border border-border rounded-lg shadow-xl p-1.5 flex flex-col gap-0.5 z-50 w-28"
                            onClick={e => e.stopPropagation()}
                        >
                            {(Object.keys(PRIORITY_CONFIG) as ActionItemPriority[]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => { onChangePriority(p); setShowPriorityPicker(false); }}
                                    className={cn(
                                        "flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-secondary transition-colors w-full text-left",
                                        PRIORITY_CONFIG[p].color
                                    )}
                                >
                                    <div className={cn("w-2 h-2 rounded-full flex-shrink-0", PRIORITY_CONFIG[p].dot)} />
                                    {PRIORITY_CONFIG[p].label}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Edit hint */}
            {!done && !isEditing && (
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity">
                    dbl-click
                </span>
            )}

            {/* Delete */}
            <button
                onClick={onDelete}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-400"
            >
                <Trash2 size={14} />
            </button>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// Notes Tab — block-based timeline
// ─────────────────────────────────────────────

function NotesTab({ mission, onUpdate }: { mission: Mission; onUpdate: (field: keyof Mission, value: any) => void }) {
    const [blocks, setBlocks] = useState<NoteBlock[]>(() => parseNoteBlocks(mission.notes));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftContent, setDraftContent] = useState('');
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    // New block (today)
    const addBlock = () => {
        const now = new Date().toISOString();
        const newBlock: NoteBlock = { id: crypto.randomUUID(), content: '', createdAt: now };
        const updated = [...blocks, newBlock];
        setBlocks(updated);
        setEditingId(newBlock.id);
        setDraftContent('');
    };

    const startEdit = (block: NoteBlock) => {
        setEditingId(block.id);
        setDraftContent(block.content);
    };

    const commitEdit = useCallback((blockId: string) => {
        const now = new Date().toISOString();
        setBlocks(prev => {
            const updated = prev.map(b => {
                if (b.id !== blockId) return b;
                const isNew = !b.content && !draftContent.trim();
                if (isNew) return null as any; // will filter below
                return {
                    ...b,
                    content: draftContent,
                    editedAt: b.content !== draftContent ? now : b.editedAt
                };
            }).filter(Boolean) as NoteBlock[];
            // Persist
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(() => onUpdate('notes', serializeNoteBlocks(updated)), 600);
            return updated;
        });
        setEditingId(null);
    }, [draftContent, onUpdate]);

    const deleteBlock = (id: string) => {
        const updated = blocks.filter(b => b.id !== id);
        setBlocks(updated);
        onUpdate('notes', serializeNoteBlocks(updated));
    };

    // Group blocks by day
    type DayGroup = { label: string; blocks: NoteBlock[] };
    const grouped: DayGroup[] = [];
    for (const block of blocks) {
        const d = new Date(block.createdAt);
        let label: string;
        if (isToday(d)) label = 'Today';
        else if (isYesterday(d)) label = 'Yesterday';
        else label = format(d, 'MMMM d, yyyy');

        const existing = grouped.find(g => g.label === label);
        if (existing) existing.blocks.push(block);
        else grouped.push({ label, blocks: [block] });
    }

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">Notes auto-save · double-click to edit</p>
                <button
                    onClick={addBlock}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-card border border-border rounded-lg text-xs font-medium hover:border-primary/40 hover:text-primary transition-colors"
                >
                    <Plus size={13} />
                    New Entry
                </button>
            </div>

            {blocks.length === 0 && (
                <div
                    onClick={addBlock}
                    className="text-center py-20 border-2 border-dashed border-border rounded-xl text-muted-foreground text-sm cursor-pointer hover:border-primary/30 hover:text-primary/60 transition-colors"
                >
                    <FileText size={28} className="mx-auto mb-3 opacity-40" />
                    <p>No notes yet. Click to add your first entry.</p>
                </div>
            )}

            {grouped.map(({ label, blocks: dayBlocks }) => (
                <div key={label}>
                    {/* Day divider */}
                    <div className="flex items-center gap-3 mb-3">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <div className="space-y-2 pl-1 border-l-2 border-border ml-3">
                        {dayBlocks.map(block => (
                            <div
                                key={block.id}
                                className="group relative ml-4"
                                onMouseEnter={() => setHoveredId(block.id)}
                                onMouseLeave={() => setHoveredId(null)}
                            >
                                {/* Timeline dot */}
                                <div className="absolute -left-[21px] top-3 w-2.5 h-2.5 rounded-full bg-border border-2 border-card group-hover:bg-primary/60 transition-colors" />

                                {editingId === block.id ? (
                                    <textarea
                                        autoFocus
                                        className="w-full bg-card border border-primary/40 rounded-xl px-4 py-3 text-sm leading-relaxed focus:outline-none resize-none min-h-[80px]"
                                        value={draftContent}
                                        onChange={e => setDraftContent(e.target.value)}
                                        onBlur={() => commitEdit(block.id)}
                                        onKeyDown={e => {
                                            if (e.key === 'Escape') commitEdit(block.id);
                                            if (e.key === 'Enter' && e.metaKey) commitEdit(block.id);
                                        }}
                                        placeholder="Write your note..."
                                        rows={4}
                                    />
                                ) : (
                                    <div
                                        onDoubleClick={() => startEdit(block)}
                                        className={cn(
                                            "w-full bg-card border border-border rounded-xl px-4 py-3 text-sm leading-relaxed cursor-text hover:border-primary/20 transition-colors min-h-[48px]",
                                            !block.content && "text-muted-foreground/40 italic"
                                        )}
                                    >
                                        {block.content || 'Empty entry'}
                                        {/* Date tooltip */}
                                        <AnimatePresence>
                                            {hoveredId === block.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, y: 4 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, y: 4 }}
                                                    className="absolute top-0 right-0 -translate-y-full mb-1 bg-background border border-border rounded-lg px-2.5 py-1.5 text-[11px] text-muted-foreground shadow-md whitespace-nowrap z-10 flex flex-col gap-0.5"
                                                >
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={10} />
                                                        Created: {dateLabel(block.createdAt)}
                                                    </span>
                                                    {block.editedAt && block.editedAt !== block.createdAt && (
                                                        <span className="flex items-center gap-1 text-primary/70">
                                                            <Pencil size={10} />
                                                            Edited: {dateLabel(block.editedAt)}
                                                        </span>
                                                    )}
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => startEdit(block)}
                                        className="p-1 rounded bg-background/80 hover:bg-secondary border border-border text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Pencil size={11} />
                                    </button>
                                    <button
                                        onClick={() => deleteBlock(block.id)}
                                        className="p-1 rounded bg-background/80 hover:bg-red-400/10 border border-border text-muted-foreground hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 size={11} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

// ─────────────────────────────────────────────
// GitHub Tab
// ─────────────────────────────────────────────

interface GHCommit {
    sha: string; fullSha: string; message: string; body: string | null;
    author: string; authorLogin: string | null; authorAvatar: string | null;
    date: string; url: string;
}
interface GHIssue {
    number: number; title: string; url: string; createdAt: string;
    labels: { name: string; color: string }[]; comments: number;
}
interface GHPR {
    number: number; title: string; url: string; createdAt: string;
    draft: boolean; user: string;
    labels: { name: string; color: string }[];
}
interface GitHubData {
    name: string; fullName: string; description: string;
    stars: number; forks: number; openIssues: number; watchers: number;
    language: string; languageColor: string;
    defaultBranch: string; updatedAt: string; pushedAt: string;
    htmlUrl: string; private: boolean;
    branches: string[];
    commits: GHCommit[];
    issues: GHIssue[];
    pullRequests: GHPR[];
}

// Module-level cache: repo → { data, fetchedAt }
const ghCache = new Map<string, { data: GitHubData; fetchedAt: number }>();
const CACHE_TTL = 60_000; // 60s

type GHTab = 'commits' | 'issues' | 'prs';

function GitHubTab({ repoOwnerRepo, token }: { repoOwnerRepo: string | null; token?: string }) {
    const [data, setData] = useState<GitHubData | null>(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<GHTab>('commits');
    const [showIssueForm, setShowIssueForm] = useState(false);
    const [expandedSha, setExpandedSha] = useState<string | null>(null);
    const [aiSummary, setAiSummary] = useState<string | null>(null);
    const [aiLoading, setAiLoading] = useState(false);

    const doFetch = useCallback(async (force = false) => {
        if (!repoOwnerRepo) return;

        // Check cache
        const cached = ghCache.get(repoOwnerRepo);
        if (!force && cached && Date.now() - cached.fetchedAt < CACHE_TTL) {
            setData(cached.data);
            return;
        }

        force ? setRefreshing(true) : setLoading(true);
        setError(null);
        try {
            const res = await fetch(`/api/ctroom/github/repo?repo=${encodeURIComponent(repoOwnerRepo)}`);
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || 'GitHub API error');
            ghCache.set(repoOwnerRepo, { data: json, fetchedAt: Date.now() });
            setData(json);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [repoOwnerRepo]);

    useEffect(() => { doFetch(); }, [doFetch]);

    const fetchAiSummary = useCallback(async (commits: GHCommit[]) => {
        if (commits.length === 0) return;
        setAiLoading(true);
        try {
            const res = await fetch('/api/ctroom/github/ai-summary', {
                method: 'POST',
                headers: { 'content-type': 'application/json' },
                body: JSON.stringify({ commits: commits.slice(0, 15).map(c => ({ sha: c.sha, message: c.message, author: c.author, date: c.date })) }),
            });
            const json = await res.json();
            if (json.summary) setAiSummary(json.summary);
        } catch {
            // silently fail — summary is optional
        } finally {
            setAiLoading(false);
        }
    }, []);

    useEffect(() => {
        if (data?.commits && data.commits.length > 0 && !aiSummary) {
            fetchAiSummary(data.commits);
        }
    }, [data, aiSummary, fetchAiSummary]);

    if (!repoOwnerRepo) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center">
                <Github size={36} className="text-muted-foreground mb-4 opacity-30" />
                <p className="text-sm font-medium text-foreground mb-1">No repository linked</p>
                <p className="text-xs text-muted-foreground">Go to Settings tab and pick a GitHub repo.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-3xl mx-auto p-6 space-y-4 animate-pulse">
                <div className="h-24 bg-card border border-border rounded-xl" />
                <div className="h-8 bg-card border border-border rounded-lg w-64" />
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => <div key={i} className="h-12 bg-card border border-border rounded-xl" />)}
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                <AlertCircle size={28} className="text-red-400" />
                <p className="text-sm text-red-400">{error}</p>
                <button onClick={() => doFetch(true)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                    <RefreshCw size={13} /> Try again
                </button>
            </div>
        );
    }

    if (!data) return null;

    // Group commits by day
    type DayGroup = { label: string; commits: GHCommit[] };
    const groups: DayGroup[] = [];
    for (const c of data.commits) {
        const d = new Date(c.date);
        const label = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : format(d, 'MMM d, yyyy');
        const existing = groups.find(g => g.label === label);
        if (existing) existing.commits.push(c);
        else groups.push({ label, commits: [c] });
    }

    const subTabs: { id: GHTab; label: string; count: number }[] = [
        { id: 'commits', label: 'Commits', count: data.commits.length },
        { id: 'issues',  label: 'Issues',  count: data.issues.length  },
        { id: 'prs',     label: 'PRs',     count: data.pullRequests.length },
    ];

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-4">
            {/* Repo header */}
            <div className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                            <a href={data.htmlUrl} target="_blank" rel="noreferrer"
                                className="font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1">
                                {data.fullName} <ArrowUpRight size={13} />
                            </a>
                            {data.private && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-secondary border border-border rounded text-muted-foreground">Private</span>
                            )}
                        </div>
                        {data.description && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{data.description}</p>}
                    </div>
                    <button
                        onClick={() => doFetch(true)}
                        className={cn("p-1.5 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0", refreshing && "animate-spin")}
                    >
                        <RefreshCw size={13} />
                    </button>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap">
                    {data.language && (
                        <span className="flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: data.languageColor }} />
                            {data.language}
                        </span>
                    )}
                    <span className="flex items-center gap-1"><Star size={11} /> {data.stars}</span>
                    <span className="flex items-center gap-1"><GitFork size={11} /> {data.forks}</span>
                    <span className="flex items-center gap-1"><GitCommit size={11} /> {data.defaultBranch}</span>
                    <span>Pushed {formatDistanceToNow(new Date(data.pushedAt))} ago</span>
                </div>

                {/* Branch chips */}
                {data.branches.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                        {data.branches.slice(0, 6).map(b => (
                            <span key={b} className={cn(
                                "text-[10px] px-2 py-0.5 rounded-full border",
                                b === data.defaultBranch
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-secondary text-muted-foreground border-border"
                            )}>
                                {b}
                            </span>
                        ))}
                        {data.branches.length > 6 && (
                            <span className="text-[10px] text-muted-foreground">+{data.branches.length - 6} more</span>
                        )}
                    </div>
                )}
            </div>

            {/* Sub-tabs + Create Issue */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 bg-card border border-border rounded-xl p-1">
                    {subTabs.map(t => (
                        <button
                            key={t.id}
                            onClick={() => setActiveTab(t.id)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                                activeTab === t.id
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            {t.label}
                            <span className={cn(
                                "text-[10px] px-1.5 py-0.5 rounded-full",
                                activeTab === t.id ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                            )}>
                                {t.count}
                            </span>
                        </button>
                    ))}
                </div>
                <button
                    onClick={() => setShowIssueForm(v => !v)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-xl text-xs font-medium hover:opacity-90 transition-opacity"
                >
                    <Plus size={13} /> New Issue
                </button>
            </div>

            {/* Create Issue Form */}
            <AnimatePresence>
                {showIssueForm && (
                    <CreateIssueForm
                        repo={repoOwnerRepo}
                        onCreated={(issue) => {
                            setData(prev => prev ? { ...prev, issues: [issue, ...prev.issues] } : prev);
                            ghCache.delete(repoOwnerRepo); // invalidate cache
                            setShowIssueForm(false);
                            setActiveTab('issues');
                        }}
                        onClose={() => setShowIssueForm(false)}
                    />
                )}
            </AnimatePresence>

            {/* Commits Tab */}
            {activeTab === 'commits' && (
                <div className="space-y-4">
                    {/* AI Summary */}
                    <div className="rounded-xl border border-border overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(0,255,136,0.04) 0%, rgba(0,0,0,0) 60%)' }}>
                        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border">
                            <div className="flex items-center gap-2">
                                <Zap size={12} className="text-primary" />
                                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">AI Summary</span>
                            </div>
                            <button
                                onClick={() => { setAiSummary(null); fetchAiSummary(data?.commits ?? []); }}
                                disabled={aiLoading}
                                className={cn("p-1 text-muted-foreground hover:text-foreground transition-colors", aiLoading && "animate-spin")}
                            >
                                <RefreshCw size={11} />
                            </button>
                        </div>
                        <div className="px-4 py-3">
                            {aiLoading ? (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Loader2 size={13} className="animate-spin" />
                                    <span className="text-xs">Analyzing commits…</span>
                                </div>
                            ) : aiSummary ? (
                                <p className="text-xs text-foreground/80 leading-relaxed">{aiSummary}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground">No summary yet.</p>
                            )}
                        </div>
                    </div>

                    {groups.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">No commits found.</p>}
                    {groups.map(({ label, commits }) => (
                        <div key={label}>
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</span>
                                <div className="h-px flex-1 bg-border" />
                            </div>
                            <div className="space-y-1 pl-1 border-l-2 border-border ml-2">
                                {commits.map(c => (
                                    <div key={c.sha} className="ml-3 relative">
                                        {/* timeline dot */}
                                        <div className="absolute -left-[17px] top-3.5 w-2 h-2 rounded-full bg-border" />
                                        <div className="group bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-colors">
                                            <button
                                                className="w-full flex items-start gap-3 px-3 py-2.5 text-left"
                                                onClick={() => setExpandedSha(expandedSha === c.sha ? null : c.sha)}
                                            >
                                                {/* Avatar */}
                                                <div className="w-6 h-6 rounded-full flex-shrink-0 overflow-hidden bg-secondary mt-0.5">
                                                    {c.authorAvatar
                                                        ? <img src={c.authorAvatar} alt={c.author} className="w-full h-full object-cover" />
                                                        : <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground font-bold">
                                                            {c.author?.[0]?.toUpperCase()}
                                                          </div>
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-medium text-foreground leading-snug">{c.message}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                                                        <code className="font-mono text-primary/60">{c.sha}</code>
                                                        <span>{c.authorLogin || c.author}</span>
                                                        <span>{formatDistanceToNow(new Date(c.date))} ago</span>
                                                    </div>
                                                </div>
                                                <a
                                                    href={c.url} target="_blank" rel="noreferrer"
                                                    onClick={e => e.stopPropagation()}
                                                    className="flex-shrink-0 p-1 text-muted-foreground hover:text-foreground transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <ArrowUpRight size={12} />
                                                </a>
                                            </button>
                                            {/* Expanded body */}
                                            <AnimatePresence>
                                                {expandedSha === c.sha && c.body && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <pre className="px-3 pb-3 text-[11px] text-muted-foreground font-mono whitespace-pre-wrap border-t border-border pt-2 ml-9 leading-relaxed">
                                                            {c.body}
                                                        </pre>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Issues Tab */}
            {activeTab === 'issues' && (
                <div className="space-y-2">
                    {data.issues.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">No open issues. Hit "New Issue" to add one.</div>
                    )}
                    {data.issues.map(i => (
                        <a key={i.number} href={i.url} target="_blank" rel="noreferrer"
                            className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors group">
                            <AlertCircle size={14} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{i.title}</span>
                                    {i.labels.map(l => (
                                        <span key={l.name} className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
                                            style={{ color: `#${l.color}`, borderColor: `#${l.color}40`, backgroundColor: `#${l.color}15` }}>
                                            {l.name}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                    <span>#{i.number}</span>
                                    <span>opened {formatDistanceToNow(new Date(i.createdAt))} ago</span>
                                    {i.comments > 0 && <span>{i.comments} comments</span>}
                                </div>
                            </div>
                            <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1 transition-opacity" />
                        </a>
                    ))}
                </div>
            )}

            {/* PRs Tab */}
            {activeTab === 'prs' && (
                <div className="space-y-2">
                    {data.pullRequests.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground text-sm">No open pull requests.</div>
                    )}
                    {data.pullRequests.map(p => (
                        <a key={p.number} href={p.url} target="_blank" rel="noreferrer"
                            className="flex items-start gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors group">
                            <GitPullRequest size={14} className={cn("flex-shrink-0 mt-0.5", p.draft ? "text-muted-foreground" : "text-purple-400")} />
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{p.title}</span>
                                    {p.draft && <span className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground border border-border rounded">Draft</span>}
                                    {p.labels.map(l => (
                                        <span key={l.name} className="text-[10px] px-1.5 py-0.5 rounded-full border font-medium"
                                            style={{ color: `#${l.color}`, borderColor: `#${l.color}40`, backgroundColor: `#${l.color}15` }}>
                                            {l.name}
                                        </span>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3 mt-0.5 text-[10px] text-muted-foreground">
                                    <span>#{p.number} by {p.user}</span>
                                    <span>opened {formatDistanceToNow(new Date(p.createdAt))} ago</span>
                                </div>
                            </div>
                            <ArrowUpRight size={12} className="text-muted-foreground opacity-0 group-hover:opacity-100 flex-shrink-0 mt-1 transition-opacity" />
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Create Issue Form
// ─────────────────────────────────────────────

const ISSUE_LABELS = ['bug', 'feature', 'enhancement', 'question', 'documentation', 'help wanted'];

function CreateIssueForm({ repo, onCreated, onClose }: {
    repo: string;
    onCreated: (issue: GHIssue) => void;
    onClose: () => void;
}) {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [err, setErr] = useState<string | null>(null);

    const submit = async () => {
        if (!title.trim()) return;
        setSubmitting(true);
        setErr(null);
        try {
            const res = await fetch('/api/ctroom/github/issue', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ repo, title: title.trim(), body: body.trim(), labels: selectedLabels }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to create issue');
            onCreated(data);
        } catch (e: any) {
            setErr(e.message);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleLabel = (l: string) =>
        setSelectedLabels(prev => prev.includes(l) ? prev.filter(x => x !== l) : [...prev, l]);

    return (
        <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-card border border-primary/30 rounded-xl p-4 space-y-3"
        >
            <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                    <AlertCircle size={14} className="text-emerald-400" /> New Issue
                </h4>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={14} />
                </button>
            </div>

            <input
                autoFocus
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Issue title..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <textarea
                rows={3}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder="Description (optional)..."
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
            />

            <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Labels</p>
                <div className="flex flex-wrap gap-1.5">
                    {ISSUE_LABELS.map(l => (
                        <button
                            key={l}
                            type="button"
                            onClick={() => toggleLabel(l)}
                            className={cn(
                                "text-[11px] px-2 py-0.5 rounded-full border transition-all",
                                selectedLabels.includes(l)
                                    ? "bg-primary/10 text-primary border-primary/30"
                                    : "bg-secondary text-muted-foreground border-border hover:border-primary/20"
                            )}
                        >
                            {l}
                        </button>
                    ))}
                </div>
            </div>

            {err && <p className="text-xs text-red-400">{err}</p>}

            <div className="flex justify-end gap-2">
                <button onClick={onClose} className="px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    Cancel
                </button>
                <button
                    onClick={submit}
                    disabled={!title.trim() || submitting}
                    className="flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                >
                    {submitting ? <Loader2 size={12} className="animate-spin" /> : null}
                    {submitting ? 'Creating...' : 'Create Issue'}
                </button>
            </div>
        </motion.div>
    );
}

// ─────────────────────────────────────────────
// Settings Tab
// ─────────────────────────────────────────────

function SettingsTab({
    mission, setMission, onSaveField
}: {
    mission: Mission;
    setMission: React.Dispatch<React.SetStateAction<Mission>>;
    onSaveField: (field: keyof Mission, value: any) => void;
}) {
    const [showIconPicker, setShowIconPicker] = useState(false);

    const update = (field: keyof Mission, value: any) => {
        setMission(prev => ({ ...prev, [field]: value }));
    };

    // Always pass value explicitly — never read from stale prop
    const save = (field: keyof Mission, value: any) => {
        onSaveField(field, value);
    };

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-7">

            {/* Identity */}
            <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Identity</h3>
                <div className="flex gap-3">
                    {/* Icon */}
                    <div className="relative">
                        <button
                            onClick={() => setShowIconPicker(v => !v)}
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl border border-border hover:border-primary/40 transition-colors"
                            style={{ backgroundColor: `${mission.color}18` }}
                        >
                            {mission.icon || '🚀'}
                        </button>
                        <AnimatePresence>
                            {showIconPicker && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: 4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute left-0 top-full mt-1 bg-card border border-border rounded-xl p-2 grid grid-cols-7 gap-1 shadow-xl z-50 w-52"
                                    onClick={e => e.stopPropagation()}
                                >
                                    {ICONS.map(i => (
                                        <button
                                            key={i}
                                            onClick={() => { onSaveField('icon', i); setShowIconPicker(false); }}
                                            className="w-7 h-7 flex items-center justify-center text-lg rounded hover:bg-secondary transition-colors"
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {/* Name */}
                    <input
                        type="text"
                        value={mission.name}
                        onChange={e => update('name', e.target.value)}
                        onBlur={e => save('name', e.target.value)}
                        className="flex-1 bg-card border border-border rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30"
                        placeholder="Project name"
                    />
                </div>

                {/* Description */}
                <textarea
                    rows={3}
                    value={mission.description || ''}
                    onChange={e => update('description', e.target.value)}
                    onBlur={e => save('description', e.target.value)}
                    className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
                    placeholder="What is this project about?"
                />

                {/* Color */}
                <div>
                    <label className="text-xs text-muted-foreground mb-2 block">Theme color</label>
                    <div className="flex flex-wrap gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => onSaveField('color', c)}
                                className={cn(
                                    "w-7 h-7 rounded-full transition-all hover:scale-110",
                                    mission.color === c ? "ring-2 ring-offset-2 ring-offset-background ring-white scale-110" : ""
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>
            </section>

            {/* Status & Priority */}
            <section className="space-y-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status & Priority</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                        <div className="flex flex-col gap-1.5">
                            {(['active', 'on-hold', 'completed', 'archived'] as Mission['status'][]).map(s => (
                                <button
                                    key={s}
                                    onClick={() => onSaveField('status', s)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg border text-sm capitalize transition-all text-left",
                                        mission.status === s
                                            ? "bg-primary/10 text-primary border-primary/30 font-medium"
                                            : "bg-card border-border text-muted-foreground hover:border-primary/20"
                                    )}
                                >
                                    {s.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                        <div className="flex flex-col gap-1.5">
                            {(['low', 'medium', 'high', 'critical'] as Mission['priority'][]).map(p => (
                                <button
                                    key={p}
                                    onClick={() => onSaveField('priority', p)}
                                    className={cn(
                                        "px-3 py-2 rounded-lg border text-sm capitalize transition-all text-left flex items-center gap-2",
                                        mission.priority === p
                                            ? "bg-primary/10 text-primary border-primary/30 font-medium"
                                            : "bg-card border-border text-muted-foreground hover:border-primary/20"
                                    )}
                                >
                                    <div className={cn("w-2 h-2 rounded-full", PRIORITY_CONFIG[p].dot)} />
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Progress */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Progress</h3>
                <div className="flex items-center gap-4">
                    <input
                        type="range" min={0} max={100} step={5}
                        value={mission.progress}
                        onChange={e => update('progress', Number(e.target.value))}
                        onMouseUp={e => save('progress', Number((e.target as HTMLInputElement).value))}
                        onTouchEnd={e => save('progress', Number((e.target as HTMLInputElement).value))}
                        className="flex-1 accent-primary"
                    />
                    <span className="text-lg font-bold text-foreground w-12 text-right">{mission.progress}%</span>
                </div>
            </section>

            {/* Dates */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Timeline</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Start Date</label>
                        <input
                            type="date"
                            value={mission.startDate ? format(new Date(mission.startDate), 'yyyy-MM-dd') : ''}
                            onChange={e => onSaveField('startDate', e.target.value ? new Date(e.target.value) : undefined)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Target Date</label>
                        <input
                            type="date"
                            value={mission.targetDate ? format(new Date(mission.targetDate), 'yyyy-MM-dd') : ''}
                            onChange={e => onSaveField('targetDate', e.target.value ? new Date(e.target.value) : undefined)}
                            className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>
            </section>

            {/* GitHub */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">GitHub Repository</h3>
                <RepoPickerField
                    value={mission.repoUrl || ''}
                    onChange={val => { update('repoUrl', val); save('repoUrl', val); }}
                />
                <p className="text-xs text-muted-foreground">Link a repo to see commits, issues, and PRs in the GitHub tab.</p>
            </section>

            {/* Domain Monitoring */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Domain Monitoring</h3>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Live Domain URL</label>
                        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
                            <Globe size={14} className="text-muted-foreground flex-shrink-0" />
                            <input
                                type="url"
                                value={mission.domainUrl || ''}
                                onChange={e => update('domainUrl', e.target.value)}
                                onBlur={e => save('domainUrl', e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                            />
                            {mission.domainUrl && (
                                <button onClick={() => { update('domainUrl', ''); save('domainUrl', ''); }} className="text-muted-foreground hover:text-foreground">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Monitor uptime, SSL, and response time</p>
                    </div>
                    {mission.domainStatus && (
                        <div className={cn(
                            "p-3 rounded-xl border",
                            mission.domainStatus.isOnline
                                ? "bg-emerald-400/5 border-emerald-400/20"
                                : "bg-red-400/5 border-red-400/20"
                        )}>
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    {mission.domainStatus.isOnline ? <CheckCircle size={14} className="text-emerald-400" /> : <AlertTriangle size={14} className="text-red-400" />}
                                    <span className={cn("text-sm font-medium", mission.domainStatus.isOnline ? "text-emerald-400" : "text-red-400")}>
                                        {mission.domainStatus.isOnline ? 'Online' : 'Offline'}
                                    </span>
                                </div>
                                {mission.domainStatus.lastChecked && (
                                    <span className="text-[10px] text-muted-foreground">
                                        Checked {formatDistanceToNow(new Date(mission.domainStatus.lastChecked))} ago
                                    </span>
                                )}
                            </div>
                            {mission.domainStatus.isOnline && (
                                <div className="grid grid-cols-2 gap-2 text-xs">
                                    {mission.domainStatus.responseTime && (
                                        <div>
                                            <span className="text-muted-foreground">Response:</span>
                                            <span className="ml-1 font-mono text-foreground">{mission.domainStatus.responseTime}ms</span>
                                        </div>
                                    )}
                                    {mission.domainStatus.statusCode && (
                                        <div>
                                            <span className="text-muted-foreground">Status:</span>
                                            <span className="ml-1 font-mono text-foreground">{mission.domainStatus.statusCode}</span>
                                        </div>
                                    )}
                                    {mission.domainStatus.sslValid !== undefined && (
                                        <div className="col-span-2">
                                            <span className="text-muted-foreground">SSL:</span>
                                            <span className={cn("ml-1 font-medium", mission.domainStatus.sslValid ? "text-emerald-400" : "text-red-400")}>
                                                {mission.domainStatus.sslValid ? '✓ Valid' : '✗ Invalid'}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </section>

            {/* Focus */}
            <section className="space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Focus</h3>
                <button
                    onClick={() => onSaveField('focusWeek', !mission.focusWeek)}
                    className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-xl border w-full text-left transition-all",
                        mission.focusWeek
                            ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                            : "bg-card border-border text-muted-foreground hover:border-primary/20"
                    )}
                >
                    <Flame size={16} />
                    <div>
                        <div className="text-sm font-medium">Week Focus</div>
                        <div className="text-xs opacity-70">Mark this as your primary focus for the week</div>
                    </div>
                </button>
            </section>
        </div>
    );
}

// ─────────────────────────────────────────────
// Shared Repo Picker Field
// ─────────────────────────────────────────────

interface GHRepo {
    id: number; name: string; fullName: string;
    description: string | null; url: string;
    private: boolean; language: string | null;
    stars: number; updatedAt: string;
}

function RepoPickerField({ value, onChange, onBlur }: {
    value: string;
    onChange: (val: string) => void;
    onBlur?: () => void;
}) {
    const [showPicker, setShowPicker] = useState(false);
    const [repos, setRepos] = useState<GHRepo[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [error, setError] = useState<string | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setShowPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const open = async () => {
        setShowPicker(true);
        if (repos.length > 0) return;
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/ctroom/github/repos');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed');
            setRepos(data.repos);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const filtered = repos.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div ref={ref} className="relative">
            <div className="flex gap-2">
                <div className="flex-1 flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-2.5">
                    <Github size={14} className="text-muted-foreground flex-shrink-0" />
                    <input
                        type="text"
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onBlur={onBlur}
                        placeholder="Paste URL or browse →"
                        className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
                    />
                    {value && (
                        <button onClick={() => { onChange(''); onBlur?.(); }} className="text-muted-foreground hover:text-foreground">
                            <X size={12} />
                        </button>
                    )}
                </div>
                <button
                    type="button"
                    onClick={open}
                    className="flex items-center gap-1.5 px-3 py-2 bg-secondary border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors whitespace-nowrap"
                >
                    Browse <ChevronDown size={12} />
                </button>
            </div>

            <AnimatePresence>
                {showPicker && (
                    <motion.div
                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                        className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                    >
                        <div className="p-2 border-b border-border">
                            <div className="flex items-center gap-2 px-2">
                                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search repos..."
                                    className="flex-1 bg-transparent text-sm outline-none py-1.5"
                                />
                            </div>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            {loading && (
                                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
                                    <Loader2 size={15} className="animate-spin" /> Loading repos...
                                </div>
                            )}
                            {error && <div className="text-center py-6 text-sm text-red-400 px-4">{error}</div>}
                            {!loading && !error && filtered.length === 0 && (
                                <div className="text-center py-6 text-sm text-muted-foreground">No repos found</div>
                            )}
                            {!loading && filtered.map(repo => {
                                const selected = value === repo.url;
                                return (
                                    <button
                                        key={repo.id}
                                        onClick={() => { onChange(repo.url); onBlur?.(); setShowPicker(false); setSearch(''); }}
                                        className={cn(
                                            "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors",
                                            selected && "bg-primary/5"
                                        )}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                {repo.private && <Lock size={11} className="text-muted-foreground flex-shrink-0" />}
                                                <span className="truncate">{repo.name}</span>
                                                {selected && <Check size={13} className="text-primary flex-shrink-0 ml-auto" />}
                                            </div>
                                            {repo.description && (
                                                <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.description}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                                {repo.language && <span>{repo.language}</span>}
                                                {repo.stars > 0 && <span className="flex items-center gap-0.5"><Star size={9} /> {repo.stars}</span>}
                                                <span>Updated {formatDistanceToNow(new Date(repo.updatedAt))} ago</span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
