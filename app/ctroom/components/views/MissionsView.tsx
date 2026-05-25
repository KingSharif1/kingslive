'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Github, Flame,
    MoreHorizontal, Pencil, Trash2,
    GitCommit, Loader2, Target,
} from 'lucide-react';
import { Mission, ActionItem } from '../../types';
import { CtroomDataService } from '../../services/ctroomDataService';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { MissionFormModal } from '../modals/MissionFormModal';
import { MissionDetailModal } from '../modals/MissionDetailModal';

interface MissionsViewProps {
    onMissionClick?: (id: string) => void;
    githubToken?: string;
}

type FilterTab = 'active' | 'ideas' | 'all' | 'completed';

const STATUS_CONFIG: Record<Mission['status'], { label: string; class: string }> = {
    idea:      { label: 'Idea',        class: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    active:    { label: 'In Progress', class: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    'on-hold': { label: 'On Hold',     class: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    completed: { label: 'Completed',   class: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    archived:  { label: 'Archived',    class: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' },
};

const MILO_COLOR: Record<Mission['status'], string> = {
    idea:      '#a855f7',
    active:    '#3b82f6',
    'on-hold': '#f59e0b',
    completed: '#10b981',
    archived:  '#71717a',
};

export const MissionsView = ({ onMissionClick, githubToken }: MissionsViewProps) => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterTab>('all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingMission, setEditingMission] = useState<Mission | undefined>(undefined);
    const [formDefaults, setFormDefaults] = useState<Partial<Mission> | undefined>(undefined);
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [showGHImport, setShowGHImport] = useState(false);

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        const handler = () => setOpenMenuId(null);
        document.addEventListener('click', handler);
        return () => document.removeEventListener('click', handler);
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [missionsData, itemsData] = await Promise.all([
                CtroomDataService.fetchMissions(),
                CtroomDataService.fetchActionItems(),
            ]);
            setMissions(missionsData);
            setActionItems(itemsData);
            checkDomainStatuses(missionsData);
        } catch (err) {
            console.error('Failed to load projects', err);
        } finally {
            setLoading(false);
        }
    };

    const checkDomainStatuses = async (projects: Mission[]) => {
        const withDomains = projects.filter(m => m.domainUrl);
        if (!withDomains.length) return;
        const results = await Promise.all(withDomains.map(async (p) => {
            try {
                const res = await fetch(`/api/domain/status?url=${encodeURIComponent(p.domainUrl!)}`);
                return { id: p.id, status: await res.json() };
            } catch {
                return { id: p.id, status: { isOnline: false } };
            }
        }));
        setMissions(prev => prev.map(m => {
            const r = results.find(x => x.id === m.id);
            return r ? { ...m, domainStatus: r.status } : m;
        }));
    };

    const handleSaveMission = async (data: Partial<Mission>) => {
        if (editingMission) {
            const success = await CtroomDataService.updateMission(editingMission.id, data);
            if (success) {
                const updated = { ...editingMission, ...data };
                setMissions(prev => prev.map(m => m.id === editingMission.id ? updated : m));
                if (data.domainUrl) checkDomainStatuses([updated]);
            }
        } else {
            const saved = await CtroomDataService.saveMission({ ...data, progress: 0 } as any);
            if (saved) {
                setMissions(prev => [...prev, saved]);
                if (saved.domainUrl) checkDomainStatuses([saved]);
            }
        }
        setIsFormModalOpen(false);
        setEditingMission(undefined);
    };

    const handleDeleteMission = async (id: string) => {
        setMissions(prev => prev.filter(m => m.id !== id));
        setOpenMenuId(null);
    };

    const handleToggleFocus = async (mission: Mission) => {
        const updated = { ...mission, focusWeek: !mission.focusWeek };
        await CtroomDataService.updateMission(mission.id, { focusWeek: updated.focusWeek });
        setMissions(prev => prev.map(m => m.id === mission.id ? updated : m));
        setOpenMenuId(null);
    };

    const filtered = missions.filter(m => {
        if (m.status === 'archived') return false;
        if (filter === 'all') return true;
        if (filter === 'active') return m.status === 'active' || m.status === 'on-hold';
        if (filter === 'ideas') return m.status === 'idea';
        if (filter === 'completed') return m.status === 'completed';
        return true;
    });

    const counts = {
        active: missions.filter(m => m.status === 'active' || m.status === 'on-hold').length,
        ideas: missions.filter(m => m.status === 'idea').length,
        all: missions.filter(m => m.status !== 'archived').length,
        completed: missions.filter(m => m.status === 'completed').length,
    };

    const tabs: { id: FilterTab; label: string }[] = [
        { id: 'all', label: 'All' },
        { id: 'active', label: 'Active' },
        { id: 'ideas', label: 'Ideas' },
        { id: 'completed', label: 'Completed' },
    ];

    return (
        <div
            className="flex flex-col min-h-full hq-scroll overflow-y-auto"
            style={{ color: '#f4f4f5', padding: '2.5rem 2.5rem', background: '#09090b' }}
        >
            {/* ── Header ─────────────────────────────────────── */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight text-white" style={{ fontFamily: "'Young Serif', 'Georgia', serif" }}>
                        Projects
                    </h1>
                    <p className="text-sm text-zinc-400">Manage your active repositories and seed new ideas.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowGHImport(true)}
                        className="flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all"
                        style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f4f4f5' }}
                    >
                        <Github size={16} />
                        Import from GitHub
                    </button>
                    <button
                        onClick={() => {
                            setEditingMission(undefined);
                            setFormDefaults(filter === 'ideas' ? { status: 'idea' } : undefined);
                            setIsFormModalOpen(true);
                        }}
                        className="flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg transition-all"
                        style={{ background: '#f4f4f5', color: '#09090b' }}
                    >
                        <Plus size={16} />
                        {filter === 'ideas' ? 'New Idea' : 'New Project'}
                    </button>
                </div>
            </header>

            {/* ── Tabs ────────────────────────────────────────── */}
            <div className="flex items-center gap-8 mb-8" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {tabs.map(t => (
                    <button
                        key={t.id}
                        onClick={() => setFilter(t.id)}
                        className="pb-4 text-sm font-semibold flex items-center gap-2 transition-colors relative"
                        style={filter === t.id ? { color: '#fff', borderBottom: '2px solid #3b82f6', marginBottom: '-1px' } : { color: '#71717a' }}
                    >
                        {t.label}
                        <span className="text-[10px] px-1.5 py-0.5 rounded font-mono" style={{ background: 'rgba(255,255,255,0.08)' }}>
                            {counts[t.id]}
                        </span>
                    </button>
                ))}
            </div>

            {/* ── Grid ────────────────────────────────────────── */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-64 rounded-2xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        <Target size={28} className="text-white/20" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Nothing here yet</p>
                    <p className="text-xs text-zinc-500 mb-6">
                        {filter === 'ideas' ? 'Add a new idea to get started.' : `No ${filter} projects.`}
                    </p>
                    <button
                        onClick={() => {
                            setEditingMission(undefined);
                            setFormDefaults(filter === 'ideas' ? { status: 'idea' } : undefined);
                            setIsFormModalOpen(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all"
                        style={{ background: '#f4f4f5', color: '#09090b' }}
                    >
                        <Plus size={14} /> New Project
                    </button>
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filtered.map((mission, i) => {
                            const taskCount = actionItems.filter(t => t.missionId === mission.id).length;
                            const doneCount = actionItems.filter(t => t.missionId === mission.id && t.status === 'done').length;
                            return (
                                <ProjectCard
                                    key={mission.id}
                                    mission={mission}
                                    taskCount={taskCount}
                                    doneCount={doneCount}
                                    index={i}
                                    isMenuOpen={openMenuId === mission.id}
                                    githubToken={githubToken}
                                    onOpenMenu={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === mission.id ? null : mission.id); }}
                                    onEdit={() => { setEditingMission(mission); setIsFormModalOpen(true); setOpenMenuId(null); }}
                                    onDelete={() => handleDeleteMission(mission.id)}
                                    onToggleFocus={() => handleToggleFocus(mission)}
                                    onClick={() => setSelectedMissionId(mission.id)}
                                />
                            );
                        })}
                    </div>
                </AnimatePresence>
            )}

            {/* ── GitHub Import Drawer ─────────────────────────── */}
            <AnimatePresence>
                {showGHImport && (
                    <GHImportDrawer
                        githubToken={githubToken}
                        onImport={(repoData) => {
                            setShowGHImport(false);
                            setEditingMission(undefined);
                            setFormDefaults({
                                name: repoData.name,
                                description: repoData.description || '',
                                color: '#3b82f6', icon: '🚀', status: 'active', priority: 'medium',
                                progress: 0, repoUrl: repoData.htmlUrl,
                            });
                            setIsFormModalOpen(true);
                        }}
                        onClose={() => setShowGHImport(false)}
                    />
                )}
            </AnimatePresence>

            {/* ── Modals ──────────────────────────────────────── */}
            <MissionFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setEditingMission(undefined); setFormDefaults(undefined); }}
                initialData={editingMission ?? formDefaults}
                onSubmit={handleSaveMission}
            />

            {selectedMissionId && (
                <MissionDetailModal
                    isOpen={!!selectedMissionId}
                    onClose={() => setSelectedMissionId(null)}
                    mission={missions.find(m => m.id === selectedMissionId)!}
                    githubToken={githubToken}
                    onUpdate={async (updated) => {
                        await CtroomDataService.updateMission(updated.id, updated);
                        setMissions(prev => prev.map(m => m.id === updated.id ? updated : m));
                    }}
                    tasks={actionItems.filter(t => t.missionId === selectedMissionId)}
                    onAddTask={async (task) => {
                        const saved = await CtroomDataService.saveActionItem(task as any);
                        if (saved) setActionItems(prev => [saved, ...prev]);
                    }}
                    onUpdateTask={async (id, updates) => {
                        await CtroomDataService.updateActionItem(id, updates);
                        setActionItems(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
                    }}
                    onDeleteTask={async (id) => {
                        await CtroomDataService.deleteActionItem(id);
                        setActionItems(prev => prev.filter(t => t.id !== id));
                    }}
                />
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────
// ProjectCard — matches projects-design.html card style
// ─────────────────────────────────────────────────────────
interface ProjectCardProps {
    mission: Mission;
    taskCount: number;
    doneCount: number;
    index: number;
    isMenuOpen: boolean;
    githubToken?: string;
    onOpenMenu: (e: React.MouseEvent) => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleFocus: () => void;
    onClick: () => void;
}

interface LastCommit {
    message: string;
    timeAgo: string;
    author: string;
}

function ProjectCard({ mission, taskCount, doneCount, index, isMenuOpen, githubToken, onOpenMenu, onEdit, onDelete, onToggleFocus, onClick }: ProjectCardProps) {
    const [lastCommit, setLastCommit] = useState<LastCommit | null>(null);
    const [commitLoading, setCommitLoading] = useState(false);

    const { label: statusLabel, class: statusClass } = STATUS_CONFIG[mission.status];
    const miloColor = MILO_COLOR[mission.status];

    // Extract owner/repo from repoUrl
    const repoPath = mission.repoUrl
        ? mission.repoUrl.replace('https://github.com/', '').replace(/\/$/, '')
        : null;

    const fetchLastCommit = useCallback(async () => {
        if (!repoPath) return;
        setCommitLoading(true);
        try {
            const res = await fetch(`/api/ctroom/github/repo?repo=${encodeURIComponent(repoPath)}`);
            if (!res.ok) return;
            const data = await res.json();
            const c = data.commits?.[0];
            if (c) {
                setLastCommit({
                    message: c.message,
                    timeAgo: formatDistanceToNow(new Date(c.date), { addSuffix: true }),
                    author: c.authorLogin || c.author || 'unknown',
                });
            }
        } catch { /* silently fail */ }
        finally { setCommitLoading(false); }
    }, [repoPath]);

    useEffect(() => { fetchLastCommit(); }, [fetchLastCommit]);

    // Build auto Milo insight from available data
    const miloInsight = (() => {
        if (!repoPath && !mission.description) return `This project has no repo linked yet. Add a GitHub repo to track progress.`;
        if (!lastCommit && !commitLoading && repoPath) return `No recent commit activity detected on ${repoPath}. Time to push some code?`;
        if (lastCommit) {
            const taskInfo = taskCount > 0 ? ` You have ${taskCount - doneCount} tasks remaining.` : '';
            return `Latest: "${lastCommit.message}" ${lastCommit.timeAgo}.${taskInfo}`;
        }
        return mission.description || `Project is ${mission.progress}% complete.`;
    })();

    const isIdea = mission.status === 'idea';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: index * 0.05 }}
            onClick={onClick}
            className="group flex flex-col rounded-2xl cursor-pointer transition-all duration-300"
            style={{
                background: isIdea ? 'rgba(139,92,246,0.04)' : 'rgba(20,20,23,0.6)',
                backdropFilter: 'blur(12px)',
                border: isIdea ? '1px dashed rgba(139,92,246,0.25)' : '1px solid rgba(39,39,42,0.8)',
                padding: '1.25rem',
                opacity: isIdea ? 0.85 : 1,
            }}
        >
            {/* ── Card Header ── */}
            <div className="flex justify-between items-start mb-3">
                <h3
                    className={`text-lg font-bold tracking-tight truncate flex-1 pr-2 transition-colors ${isIdea ? 'text-violet-200' : 'text-white'}`}
                    style={{ fontFamily: "'Young Serif', 'Georgia', serif" }}
                >
                    {mission.icon && <span className="mr-1.5">{mission.icon}</span>}
                    {mission.name}
                    {mission.focusWeek && <Flame size={13} className="inline ml-2 text-amber-400" />}
                </h3>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={cn('text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded border', statusClass)}>
                        {statusLabel}
                    </span>
                    <div className="relative">
                        <button
                            onClick={onOpenMenu}
                            className="w-6 h-6 rounded flex items-center justify-center text-zinc-600 hover:text-white transition-colors"
                        >
                            <MoreHorizontal size={14} />
                        </button>
                        <AnimatePresence>
                            {isMenuOpen && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                    transition={{ duration: 0.1 }}
                                    className="absolute right-0 top-7 z-50 w-40 rounded-xl shadow-xl overflow-hidden"
                                    style={{ background: '#1a1a1d', border: '1px solid rgba(255,255,255,0.1)' }}
                                    onClick={e => e.stopPropagation()}
                                >
                                    <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors">
                                        <Pencil size={13} /> Edit
                                    </button>
                                    <button onClick={onToggleFocus} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/70 hover:bg-white/5 transition-colors">
                                        <Flame size={13} /> {mission.focusWeek ? 'Remove focus' : 'Mark focus'}
                                    </button>
                                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }} />
                                    <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>

            {/* ── Description (ideas only) ── */}
            {isIdea && mission.description && (
                <p className="text-xs text-zinc-500 leading-relaxed mb-3 line-clamp-2 italic">{mission.description}</p>
            )}

            {/* ── Progress ── */}
            <div className="space-y-1.5 mb-3">
                <div className="flex justify-between items-center text-[11px] font-mono">
                    <span className="text-zinc-500">{mission.progress}%</span>
                    {taskCount > 0 && (
                        <span className="text-zinc-600">{doneCount}/{taskCount} tasks</span>
                    )}
                </div>
                <div className="h-1 w-full rounded-full overflow-hidden" style={{ background: 'rgba(39,39,42,1)' }}>
                    <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${mission.progress}%`, background: miloColor }}
                    />
                </div>
            </div>

            {/* ── Last Commit ── */}
            {repoPath && !isIdea && (
                <div className="flex items-center gap-2 font-mono text-[11px] mt-auto pt-3"
                    style={{ borderTop: '1px solid rgba(39,39,42,0.6)' }}>
                    <Github size={11} className="text-zinc-600 flex-shrink-0" />
                    {commitLoading ? (
                        <span className="text-zinc-600">fetching…</span>
                    ) : lastCommit ? (
                        <>
                            <span className="truncate flex-1 text-zinc-400">{lastCommit.message}</span>
                            <span className="text-zinc-600 flex-shrink-0">{lastCommit.timeAgo}</span>
                        </>
                    ) : (
                        <span className="text-zinc-700">No commits yet</span>
                    )}
                </div>
            )}

            {/* ── GitHub link (shown only when no commit line, or for ideas with a repo) ── */}
            {mission.repoUrl && (isIdea || !repoPath) && (
                <div className="mt-auto pt-3" style={{ borderTop: '1px solid rgba(39,39,42,0.6)' }}>
                    <a
                        href={mission.repoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1.5 font-mono text-[11px] text-zinc-600 hover:text-zinc-400 transition-colors"
                    >
                        <Github size={11} /> Open repo
                    </a>
                </div>
            )}
        </motion.div>
    );
}

// ─────────────────────────────────────────────────────────
// GitHub Import Drawer
// ─────────────────────────────────────────────────────────
interface GHRepo { name: string; fullName: string; description: string | null; htmlUrl: string; language: string | null; stars: number; updatedAt: string; private: boolean; }

function GHImportDrawer({ githubToken, onImport, onClose }: { githubToken?: string; onImport: (repo: GHRepo) => void; onClose: () => void; }) {
    const [repos, setRepos] = useState<GHRepo[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        (async () => {
            try {
                const res = await fetch('/api/ctroom/github/repos', {
                    headers: githubToken ? { 'x-github-token': githubToken } : {},
                });
                const data = await res.json();
                setRepos(data.repos || []);
            } catch { setRepos([]); }
            finally { setLoading(false); }
        })();
    }, [githubToken]);

    const filtered = repos.filter(r =>
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.96, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.96, y: 8 }}
                className="w-full max-w-lg rounded-2xl overflow-hidden"
                style={{ background: '#141417', border: '1px solid rgba(39,39,42,0.8)' }}
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(39,39,42,0.6)' }}>
                    <div className="flex items-center gap-2">
                        <Github size={18} className="text-white" />
                        <span className="font-bold text-white">Import from GitHub</span>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl leading-none">×</button>
                </div>
                <div className="px-6 py-3" style={{ borderBottom: '1px solid rgba(39,39,42,0.4)' }}>
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search repos…"
                        className="w-full bg-transparent text-sm text-white placeholder-zinc-600 focus:outline-none"
                        autoFocus
                    />
                </div>
                <div className="max-h-80 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-zinc-500">
                            <Loader2 size={20} className="animate-spin mr-2" /> Loading repos…
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="text-center py-12 text-zinc-600 text-sm">No repos found</div>
                    ) : filtered.map(repo => (
                        <button
                            key={repo.fullName}
                            onClick={() => onImport(repo)}
                            className="w-full flex items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-white/[0.03]"
                            style={{ borderBottom: '1px solid rgba(39,39,42,0.3)' }}
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-white truncate">{repo.name}</span>
                                    {repo.private && <span className="text-[9px] text-zinc-500 border border-zinc-700 px-1 rounded">private</span>}
                                </div>
                                {repo.description && <p className="text-xs text-zinc-500 truncate mt-0.5">{repo.description}</p>}
                            </div>
                            <div className="flex-shrink-0 text-right">
                                {repo.language && <p className="text-[10px] text-zinc-400 font-mono">{repo.language}</p>}
                                <p className="text-[10px] text-zinc-600">{formatDistanceToNow(new Date(repo.updatedAt))} ago</p>
                            </div>
                        </button>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
}
