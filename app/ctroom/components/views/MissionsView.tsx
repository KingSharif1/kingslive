import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Target, Clock, Flame, Github, ArrowUpRight,
    MoreHorizontal, CheckCircle2, Circle, Pause, Archive,
    TrendingUp, FolderKanban, ListTodo, Pencil, Trash2,
    Globe, Zap, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Mission, ActionItem } from '../../types';
import { CtroomDataService } from '../../services/ctroomDataService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MissionFormModal } from '../modals/MissionFormModal';
import { MissionDetailModal } from '../modals/MissionDetailModal';

interface MissionsViewProps {
    onMissionClick?: (id: string) => void;
    githubToken?: string;
}

type FilterTab = 'all' | 'active' | 'on-hold' | 'completed';

export const MissionsView = ({ onMissionClick, githubToken }: MissionsViewProps) => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<FilterTab>('all');
    const [isFormModalOpen, setIsFormModalOpen] = useState(false);
    const [editingMission, setEditingMission] = useState<Mission | undefined>(undefined);
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Close menu on outside click
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
            
            // Check domain status for projects with domainUrl
            checkDomainStatuses(missionsData);
        } catch (err) {
            console.error('Failed to load projects', err);
        } finally {
            setLoading(false);
        }
    };

    const checkDomainStatuses = async (projects: Mission[]) => {
        const projectsWithDomains = projects.filter(m => m.domainUrl);
        if (projectsWithDomains.length === 0) return;

        // Check domains in parallel
        const statusChecks = projectsWithDomains.map(async (project) => {
            try {
                const res = await fetch(`/api/domain/status?url=${encodeURIComponent(project.domainUrl!)}`);
                const status = await res.json();
                return { projectId: project.id, status };
            } catch (err) {
                return { projectId: project.id, status: { isOnline: false, error: 'Failed to check' } };
            }
        });

        const results = await Promise.all(statusChecks);
        
        // Update missions with domain status
        setMissions(prev => prev.map(m => {
            const result = results.find(r => r.projectId === m.id);
            if (result) {
                return { ...m, domainStatus: result.status };
            }
            return m;
        }));
    };

    const handleSaveMission = async (data: Partial<Mission>) => {
        if (editingMission) {
            const success = await CtroomDataService.updateMission(editingMission.id, data);
            if (success) {
                const updated = { ...editingMission, ...data };
                setMissions(prev => prev.map(m => m.id === editingMission.id ? updated : m));
                // Check domain status if domainUrl was added/changed
                if (data.domainUrl) {
                    checkDomainStatuses([updated]);
                }
            }
        } else {
            const saved = await CtroomDataService.saveMission({ ...data, progress: 0 } as any);
            if (saved) {
                setMissions(prev => [...prev, saved]);
                // Check domain status for new project
                if (saved.domainUrl) {
                    checkDomainStatuses([saved]);
                }
            }
        }
        setIsFormModalOpen(false);
        setEditingMission(undefined);
    };

    const handleDeleteMission = async (id: string) => {
        // TODO: wire up delete in CtroomDataService
        setMissions(prev => prev.filter(m => m.id !== id));
        setOpenMenuId(null);
    };

    const handleToggleFocus = async (mission: Mission) => {
        const updated = { ...mission, focusWeek: !mission.focusWeek };
        await CtroomDataService.updateMission(mission.id, { focusWeek: updated.focusWeek });
        setMissions(prev => prev.map(m => m.id === mission.id ? updated : m));
        setOpenMenuId(null);
    };

    const filtered = missions.filter(m =>
        filter === 'all' ? m.status !== 'archived' : m.status === filter
    );

    const stats = {
        active: missions.filter(m => m.status === 'active').length,
        onHold: missions.filter(m => m.status === 'on-hold').length,
        completed: missions.filter(m => m.status === 'completed').length,
        total: missions.filter(m => m.status !== 'archived').length,
    };

    const avgProgress = stats.total > 0
        ? Math.round(missions.filter(m => m.status !== 'archived').reduce((s, m) => s + m.progress, 0) / stats.total)
        : 0;

    const tabs: { id: FilterTab; label: string; count: number }[] = [
        { id: 'all', label: 'All', count: stats.total },
        { id: 'active', label: 'Active', count: stats.active },
        { id: 'on-hold', label: 'On Hold', count: stats.onHold },
        { id: 'completed', label: 'Completed', count: stats.completed },
    ];

    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto">

            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="font-display text-2xl text-foreground">Projects</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Track missions, goals, and active work</p>
                </div>
                <button
                    onClick={() => { setEditingMission(undefined); setIsFormModalOpen(true); }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
                >
                    <Plus size={16} />
                    New Project
                </button>
            </div>

            {/* Stats Strip */}
            {!loading && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <StatCard label="Total Projects" value={stats.total} icon={FolderKanban} color="text-blue-400" />
                    <StatCard label="Active" value={stats.active} icon={TrendingUp} color="text-emerald-400" />
                    <StatCard label="On Hold" value={stats.onHold} icon={Pause} color="text-amber-400" />
                    <StatCard label="Avg Progress" value={`${avgProgress}%`} icon={Target} color="text-purple-400" />
                </div>
            )}

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-card/60 border border-border rounded-xl p-1 w-fit">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setFilter(tab.id)}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2",
                            filter === tab.id
                                ? "bg-background text-foreground shadow-sm"
                                : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab.label}
                        <span className={cn(
                            "text-xs px-1.5 py-0.5 rounded-full",
                            filter === tab.id ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
                        )}>
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Grid */}
            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="h-48 rounded-xl bg-card/40 animate-pulse border border-border" />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center mb-4">
                        <FolderKanban size={28} className="text-muted-foreground" />
                    </div>
                    <p className="text-base font-medium text-foreground mb-1">No projects here</p>
                    <p className="text-sm text-muted-foreground mb-6">
                        {filter === 'all' ? 'Create your first project to get started.' : `No ${filter} projects.`}
                    </p>
                    {filter === 'all' && (
                        <button
                            onClick={() => { setEditingMission(undefined); setIsFormModalOpen(true); }}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium"
                        >
                            <Plus size={16} /> New Project
                        </button>
                    )}
                </div>
            ) : (
                <AnimatePresence mode="popLayout">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Modals */}
            <MissionFormModal
                isOpen={isFormModalOpen}
                onClose={() => { setIsFormModalOpen(false); setEditingMission(undefined); }}
                initialData={editingMission}
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

// ─────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string | number; icon: React.ElementType; color: string }) {
    return (
        <div className="bg-card/60 border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={cn("w-9 h-9 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0", color)}>
                <Icon size={18} />
            </div>
            <div className="min-w-0">
                <div className="font-mono text-xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground truncate">{label}</div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────
// Project Card
// ─────────────────────────────────────────────
interface ProjectCardProps {
    mission: Mission;
    taskCount: number;
    doneCount: number;
    index: number;
    isMenuOpen: boolean;
    onOpenMenu: (e: React.MouseEvent) => void;
    onEdit: () => void;
    onDelete: () => void;
    onToggleFocus: () => void;
    onClick: () => void;
}

function ProjectCard({ mission, taskCount, doneCount, index, isMenuOpen, onOpenMenu, onEdit, onDelete, onToggleFocus, onClick }: ProjectCardProps) {
    const statusConfig: Record<Mission['status'], { icon: React.ElementType; label: string; class: string }> = {
        active:    { icon: TrendingUp,   label: 'Active',    class: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
        'on-hold': { icon: Pause,        label: 'On Hold',   class: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
        completed: { icon: CheckCircle2, label: 'Completed', class: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
        archived:  { icon: Archive,      label: 'Archived',  class: 'text-zinc-400 bg-zinc-400/10 border-zinc-400/20' },
    };

    const priorityDot: Record<Mission['priority'], string> = {
        low: 'bg-zinc-400',
        medium: 'bg-blue-400',
        high: 'bg-orange-400',
        critical: 'bg-red-500',
    };

    const { icon: StatusIcon, label: statusLabel, class: statusClass } = statusConfig[mission.status];
    const circumference = 2 * Math.PI * 16;
    const strokeDash = (mission.progress / 100) * circumference;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ delay: index * 0.04 }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className="group relative bg-card/60 border border-border rounded-xl p-5 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all cursor-pointer"
        >
            {/* Focus badge */}
            {mission.focusWeek && (
                <div className="absolute top-3 right-12 flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-400 text-xs rounded-full border border-amber-500/20">
                    <Flame size={10} />
                    <span>Focus</span>
                </div>
            )}

            {/* Menu button */}
            <div className="absolute top-3 right-3">
                <button
                    onClick={onOpenMenu}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100"
                >
                    <MoreHorizontal size={15} />
                </button>
                <AnimatePresence>
                    {isMenuOpen && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="absolute right-0 top-8 z-50 w-40 bg-card border border-border rounded-xl shadow-xl overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={onEdit} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                                <Pencil size={13} /> Edit
                            </button>
                            <button onClick={onToggleFocus} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                                <Flame size={13} /> {mission.focusWeek ? 'Remove focus' : 'Mark focus'}
                            </button>
                            <div className="border-t border-border" />
                            <button onClick={onDelete} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-400/10 transition-colors">
                                <Trash2 size={13} /> Delete
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Top row: icon + progress ring */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${mission.color}18`, border: `1px solid ${mission.color}30` }}
                    >
                        {mission.icon || '🚀'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground leading-tight">{mission.name}</h3>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <div className={cn("w-1.5 h-1.5 rounded-full", priorityDot[mission.priority])} />
                            <span className="text-xs text-muted-foreground capitalize">{mission.priority}</span>
                        </div>
                    </div>
                </div>

                {/* Progress ring */}
                <div className="relative flex-shrink-0">
                    <svg width="40" height="40" className="-rotate-90">
                        <circle cx="20" cy="20" r="16" fill="none" stroke="currentColor" strokeWidth="3" className="text-secondary" />
                        <circle
                            cx="20" cy="20" r="16" fill="none" strokeWidth="3"
                            stroke={mission.color}
                            strokeDasharray={`${strokeDash} ${circumference}`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] font-bold text-foreground">
                        {mission.progress}%
                    </span>
                </div>
            </div>

            {/* Description */}
            {mission.description && (
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{mission.description}</p>
            )}

            {/* Task count progress bar */}
            {taskCount > 0 && (
                <div className="mb-4">
                    <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
                        <div className="flex items-center gap-1">
                            <ListTodo size={11} />
                            <span>{doneCount}/{taskCount} tasks</span>
                        </div>
                        <span>{taskCount > 0 ? Math.round((doneCount / taskCount) * 100) : 0}%</span>
                    </div>
                    <div className="h-1 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all"
                            style={{ width: `${taskCount > 0 ? (doneCount / taskCount) * 100 : 0}%`, backgroundColor: mission.color }}
                        />
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                    <div className={cn("flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border", statusClass)}>
                        <StatusIcon size={10} />
                        <span>{statusLabel}</span>
                    </div>
                    {/* Domain Status Badge */}
                    {mission.domainUrl && mission.domainStatus && (
                        <div className={cn(
                            "flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full border",
                            mission.domainStatus.isOnline
                                ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/20"
                                : "bg-red-400/10 text-red-400 border-red-400/20"
                        )}>
                            {mission.domainStatus.isOnline ? <CheckCircle size={8} /> : <AlertTriangle size={8} />}
                            {mission.domainStatus.isOnline && mission.domainStatus.responseTime && (
                                <span>{mission.domainStatus.responseTime}ms</span>
                            )}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {mission.targetDate && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock size={11} />
                            <span>{format(new Date(mission.targetDate), 'MMM d')}</span>
                        </div>
                    )}
                    {mission.domainUrl && (
                        <a
                            href={mission.domainUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                            title="Visit live site"
                        >
                            <Globe size={13} />
                        </a>
                    )}
                    {mission.repoUrl && (
                        <a
                            href={mission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={e => e.stopPropagation()}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Github size={13} />
                        </a>
                    )}
                    <ArrowUpRight size={13} className="text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
            </div>
        </motion.div>
    );
}
