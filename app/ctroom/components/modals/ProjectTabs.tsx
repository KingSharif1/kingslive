/**
 * WorkTab - Combines Tasks and Notes in a unified view
 * LogsTab - Project activity tracking
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Circle, CheckCircle2, Trash2, ChevronDown, ChevronUp,
    Plus, Clock, Pencil, BookOpen, CheckSquare, X
} from 'lucide-react';
import { Mission, ActionItem, ActionItemPriority, NoteBlock, DailyLog } from '../../types';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { CtroomDataService } from '../../services/ctroomDataService';

const PRIORITY_CONFIG: Record<ActionItemPriority, { label: string; color: string; dot: string }> = {
    low:      { label: 'Low',      color: 'text-zinc-400',   dot: 'bg-zinc-400' },
    medium:   { label: 'Medium',   color: 'text-blue-400',   dot: 'bg-blue-400' },
    high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
    critical: { label: 'Critical', color: 'text-red-500',    dot: 'bg-red-500' },
};

// ─────────────────────────────────────────────
// WorkTab - Tasks + Notes Combined
// ─────────────────────────────────────────────

export function WorkTab({
    mission, tasks, onAddTask, onUpdateTask, onDeleteTask, onUpdate
}: {
    mission: Mission;
    tasks: ActionItem[];
    onAddTask: (t: Partial<ActionItem>) => Promise<void>;
    onUpdateTask: (id: string, u: Partial<ActionItem>) => Promise<void>;
    onDeleteTask: (id: string) => Promise<void>;
    onUpdate: (field: keyof Mission, value: any) => void;
}) {
    const [activeSection, setActiveSection] = useState<'tasks' | 'notes'>('tasks');

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-5">
            {/* Section Toggle */}
            <div className="flex items-center gap-2 bg-card border border-border rounded-xl p-1">
                <button
                    onClick={() => setActiveSection('tasks')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1",
                        activeSection === 'tasks'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <CheckSquare size={14} />
                    Tasks ({tasks.filter(t => t.status !== 'done').length})
                </button>
                <button
                    onClick={() => setActiveSection('notes')}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1",
                        activeSection === 'notes'
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <BookOpen size={14} />
                    Notes
                </button>
            </div>

            {/* Content */}
            {activeSection === 'tasks' ? (
                <TasksSection
                    mission={mission}
                    tasks={tasks}
                    onAddTask={onAddTask}
                    onUpdateTask={onUpdateTask}
                    onDeleteTask={onDeleteTask}
                />
            ) : (
                <NotesSection mission={mission} onUpdate={onUpdate} />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────
// Tasks Section
// ─────────────────────────────────────────────

function TasksSection({
    mission, tasks, onAddTask, onUpdateTask, onDeleteTask
}: {
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
        <div className="space-y-5">
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
            <button onClick={onToggle} className="flex-shrink-0">
                {done
                    ? <CheckCircle2 size={18} className="text-primary" />
                    : <Circle size={18} className="text-muted-foreground hover:text-primary transition-colors" />
                }
            </button>

            {isEditing ? (
                <input
                    autoFocus
                    className="flex-1 bg-transparent text-sm focus:outline-none border-b border-primary"
                    value={editTitle}
                    onChange={e => setEditTitle(e.target.value)}
                    onBlur={onCommitEdit}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') onCommitEdit(); }}
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

            {!done && !isEditing && (
                <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-60 transition-opacity">
                    dbl-click
                </span>
            )}

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
// Notes Section
// ─────────────────────────────────────────────

function parseNoteBlocks(raw?: string): NoteBlock[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
    } catch {}
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

function NotesSection({ mission, onUpdate }: { mission: Mission; onUpdate: (field: keyof Mission, value: any) => void }) {
    const [blocks, setBlocks] = useState<NoteBlock[]>(() => parseNoteBlocks(mission.notes));
    const [editingId, setEditingId] = useState<string | null>(null);
    const [draftContent, setDraftContent] = useState('');

    const save = (newBlocks: NoteBlock[]) => {
        setBlocks(newBlocks);
        onUpdate('notes', serializeNoteBlocks(newBlocks));
    };

    const addBlock = () => {
        if (!draftContent.trim()) return;
        const newBlock: NoteBlock = {
            id: crypto.randomUUID(),
            content: draftContent.trim(),
            createdAt: new Date().toISOString()
        };
        save([newBlock, ...blocks]);
        setDraftContent('');
    };

    const startEdit = (block: NoteBlock) => {
        setEditingId(block.id);
        setDraftContent(block.content);
    };

    const commitEdit = () => {
        if (!editingId) return;
        const updated = blocks.map(b =>
            b.id === editingId
                ? { ...b, content: draftContent.trim(), editedAt: new Date().toISOString() }
                : b
        );
        save(updated);
        setEditingId(null);
        setDraftContent('');
    };

    const deleteBlock = (id: string) => {
        save(blocks.filter(b => b.id !== id));
    };

    return (
        <div className="space-y-3">
            {/* Add Note - Restored old design */}
            <form onSubmit={e => { e.preventDefault(); editingId ? commitEdit() : addBlock(); }} className="bg-card border border-border rounded-xl p-3 shadow-sm">
                <textarea
                    value={draftContent}
                    onChange={e => setDraftContent(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                            e.preventDefault();
                            editingId ? commitEdit() : addBlock();
                        }
                        if (e.key === 'Escape' && editingId) {
                            setEditingId(null);
                            setDraftContent('');
                        }
                    }}
                    placeholder={editingId ? "Edit note..." : "Add a note..."}
                    rows={2}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none mb-2"
                />
                <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground">{draftContent.length} characters</span>
                    <div className="flex gap-2">
                        {editingId && (
                            <button
                                type="button"
                                onClick={() => { setEditingId(null); setDraftContent(''); }}
                                className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                            >
                                Cancel
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={!draftContent.trim()}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                        >
                            {editingId ? 'Update' : 'Add'}
                        </button>
                    </div>
                </div>
            </form>

            {/* Notes Timeline - Restored old design */}
            <div className="space-y-2">
                {blocks.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No notes yet
                    </div>
                )}
                <AnimatePresence>
                    {blocks.map(block => (
                        <motion.div
                            key={block.id}
                            initial={{ opacity: 0, y: -8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -8 }}
                            className="group relative bg-card border border-border rounded-xl p-3 hover:border-primary/20 transition-colors"
                        >
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-1 h-1 rounded-full bg-primary mt-2" />
                                <div className="flex-1 min-w-0">
                                    <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                                        {block.content}
                                    </div>
                                    <div className="flex items-center gap-2 mt-2 text-[10px] text-muted-foreground">
                                        <Clock size={10} />
                                        <span>{dateLabel(block.createdAt)}</span>
                                        {block.editedAt && block.editedAt !== block.createdAt && (
                                            <>
                                                <span>·</span>
                                                <Pencil size={10} />
                                                <span>edited</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                                    <button
                                        onClick={() => startEdit(block)}
                                        className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                        title="Edit"
                                    >
                                        <Pencil size={12} />
                                    </button>
                                    <button
                                        onClick={() => deleteBlock(block.id)}
                                        className="p-1 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// LogsTab - Project Activity Tracking
// ─────────────────────────────────────────────

export function LogsTab({ mission }: { mission: Mission }) {
    const [logs, setLogs] = useState<DailyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [newLogContent, setNewLogContent] = useState('');
    const [timeSpent, setTimeSpent] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadLogs();
    }, [mission.id]);

    const loadLogs = async () => {
        setLoading(true);
        try {
            // Fetch logs for the last 30 days that are linked to this project
            const startDate = format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
            const endDate = format(new Date(), 'yyyy-MM-dd');
            const allLogs = await CtroomDataService.fetchLogsInRange(startDate, endDate);
            const projectLogs = allLogs.filter(log => log.projectId === mission.id);
            setLogs(projectLogs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error('Error loading logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newLogContent.trim()) return;

        setSaving(true);
        try {
            const newLog = await CtroomDataService.saveDailyLog({
                date: format(new Date(), 'yyyy-MM-dd'),
                content: newLogContent.trim(),
                type: 'log',
                projectId: mission.id,
                timeSpentMinutes: timeSpent ? parseInt(timeSpent) : undefined
            });
            if (newLog) {
                setLogs(prev => [newLog, ...prev]);
                setNewLogContent('');
                setTimeSpent('');
            }
        } catch (error) {
            console.error('Error adding log:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLog = async (logId: string) => {
        const success = await CtroomDataService.deleteDailyLog(logId);
        if (success) {
            setLogs(prev => prev.filter(l => l.id !== logId));
        }
    };

    return (
        <div className="max-w-3xl mx-auto p-6 space-y-4">
            {/* Add Log Form */}
            <form onSubmit={handleAddLog} className="bg-card border border-border rounded-xl p-3 shadow-sm">
                <textarea
                    value={newLogContent}
                    onChange={e => setNewLogContent(e.target.value)}
                    placeholder="What did you work on?"
                    rows={2}
                    className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 resize-none outline-none mb-2"
                />
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-muted-foreground" />
                        <input
                            type="number"
                            value={timeSpent}
                            onChange={e => setTimeSpent(e.target.value)}
                            placeholder="Minutes"
                            min="0"
                            className="w-20 px-2 py-1 bg-secondary border border-border rounded text-xs outline-none"
                        />
                        <span className="text-[10px] text-muted-foreground">minutes spent</span>
                    </div>
                    <button
                        type="submit"
                        disabled={!newLogContent.trim() || saving}
                        className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-medium disabled:opacity-40 hover:opacity-90 transition-opacity"
                    >
                        {saving ? 'Adding...' : 'Add Log'}
                    </button>
                </div>
            </form>

            {/* Logs List */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">Activity Log</h3>
                    <span className="text-xs text-muted-foreground">{logs.length} {logs.length === 1 ? 'entry' : 'entries'}</span>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">Loading logs...</div>
                ) : logs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                        No logs yet. Add your first work log above.
                    </div>
                ) : (
                    <div className="space-y-2">
                        <AnimatePresence>
                            {logs.map(log => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, x: -8 }}
                                    className="group flex gap-3 p-3 bg-card border border-border rounded-xl hover:border-primary/20 transition-colors"
                                >
                                    <div className="flex-shrink-0 w-1 h-1 rounded-full bg-primary mt-2" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-foreground leading-relaxed">{log.content}</p>
                                        <div className="flex items-center gap-2 mt-1.5 text-[10px] text-muted-foreground">
                                            <Clock size={10} />
                                            <span>{dateLabel(log.createdAt.toISOString())}</span>
                                            {log.timeSpentMinutes && (
                                                <>
                                                    <span>·</span>
                                                    <span>{log.timeSpentMinutes} min</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteLog(log.id)}
                                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-400/10 text-muted-foreground hover:text-red-400"
                                        title="Delete log"
                                    >
                                        <X size={12} />
                                    </button>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}
