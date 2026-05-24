/**
 * MissionFormModal - Create / Edit a Project
 */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Github, Search, Lock, Star, Loader2, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mission } from '../../types';
import { formatDistanceToNow } from 'date-fns';

interface MissionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (mission: Partial<Mission>) => void;
    initialData?: Partial<Mission>;
}

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#10b981',
    '#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899', '#64748b'
];

const ICONS = ['🚀', '🎯', '💡', '💻', '📚', '✈️', '🎨', '💸', '🏥', '🏠', '🔥', '⚡', '🛡️', '🌱'];

interface GithubRepo {
    id: number;
    name: string;
    fullName: string;
    description: string | null;
    url: string;
    private: boolean;
    language: string | null;
    stars: number;
    updatedAt: string;
}

export const MissionFormModal = ({ isOpen, onClose, onSubmit, initialData }: MissionFormModalProps) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [color, setColor] = useState(initialData?.color || COLORS[5]);
    const [icon, setIcon] = useState(initialData?.icon || '🚀');
    const [status, setStatus] = useState<Mission['status']>(initialData?.status || 'active');
    const [priority, setPriority] = useState<Mission['priority']>(initialData?.priority || 'medium');
    const [targetDate, setTargetDate] = useState<string>(
        initialData?.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : ''
    );
    const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || '');
    const [domainUrl, setDomainUrl] = useState(initialData?.domainUrl || '');
    const [showIconPicker, setShowIconPicker] = useState(false);

    // GitHub repo picker state
    const [showRepoPicker, setShowRepoPicker] = useState(false);
    const [repos, setRepos] = useState<GithubRepo[]>([]);
    const [reposLoading, setReposLoading] = useState(false);
    const [repoSearch, setRepoSearch] = useState('');
    const [reposError, setReposError] = useState<string | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
        setColor(initialData?.color || COLORS[5]);
        setIcon(initialData?.icon || '🚀');
        setStatus(initialData?.status || 'active');
        setPriority(initialData?.priority || 'medium');
        setTargetDate(initialData?.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : '');
        setRepoUrl(initialData?.repoUrl || '');
        setDomainUrl(initialData?.domainUrl || '');
    }, [isOpen, initialData]);

    // Close picker on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setShowRepoPicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const openRepoPicker = async () => {
        if (repos.length > 0) { setShowRepoPicker(true); return; }
        setShowRepoPicker(true);
        setReposLoading(true);
        setReposError(null);
        try {
            const res = await fetch('/api/ctroom/github/repos');
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to load repos');
            setRepos(data.repos);
        } catch (err: any) {
            setReposError(err.message);
        } finally {
            setReposLoading(false);
        }
    };

    const selectRepo = (repo: GithubRepo) => {
        setRepoUrl(repo.url);
        if (!name) setName(repo.name);
        setShowRepoPicker(false);
        setRepoSearch('');
    };

    const filteredRepos = repos.filter(r =>
        r.name.toLowerCase().includes(repoSearch.toLowerCase()) ||
        (r.description || '').toLowerCase().includes(repoSearch.toLowerCase())
    );

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSubmit({
            name: name.trim(),
            description: description.trim() || undefined,
            color,
            icon,
            status,
            priority,
            targetDate: targetDate ? new Date(targetDate) : undefined,
            repoUrl: repoUrl.trim() || undefined,
            domainUrl: domainUrl.trim() || undefined,
            progress: initialData?.progress ?? 0,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 8 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: `${color}20` }}>
                            {icon}
                        </div>
                        <h3 className="font-semibold text-base">
                            {initialData?.name ? 'Edit Project' : 'New Project'}
                        </h3>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-lg transition-colors">
                        <X size={16} className="text-muted-foreground" />
                    </button>
                </div>

                <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">

                    {/* Name + Icon picker */}
                    <div className="flex gap-3">
                        <input
                            autoFocus
                            type="text"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Project name..."
                            className="flex-1 bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-primary/20 outline-none font-medium"
                        />
                        <div className="relative">
                            <button
                                onClick={() => setShowIconPicker(v => !v)}
                                className="w-11 h-11 bg-secondary/50 rounded-xl flex items-center justify-center text-xl border border-border/50 hover:border-primary/30 transition-colors"
                            >
                                {icon}
                            </button>
                            <AnimatePresence>
                                {showIconPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.9, y: 4 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="absolute right-0 top-full mt-1 bg-card border border-border rounded-xl p-2 grid grid-cols-7 gap-1 z-10 shadow-xl w-52"
                                    >
                                        {ICONS.map(i => (
                                            <button
                                                key={i}
                                                onClick={() => { setIcon(i); setShowIconPicker(false); }}
                                                className={cn("w-7 h-7 flex items-center justify-center text-lg rounded hover:bg-secondary transition-colors", icon === i && "bg-secondary")}
                                            >
                                                {i}
                                            </button>
                                        ))}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    {/* Description */}
                    <textarea
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        placeholder="What's this project about?"
                        rows={2}
                        className="w-full bg-secondary/50 border border-border/50 rounded-xl px-4 py-2.5 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                    />

                    {/* Color */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-2 block">Color</label>
                        <div className="flex gap-2 flex-wrap">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-7 h-7 rounded-full transition-all hover:scale-110",
                                        color === c ? "ring-2 ring-offset-2 ring-offset-background ring-white scale-110" : ""
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status + Priority */}
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                            <select
                                value={status}
                                onChange={e => setStatus(e.target.value as Mission['status'])}
                                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs text-muted-foreground mb-1.5 block">Priority</label>
                            <select
                                value={priority}
                                onChange={e => setPriority(e.target.value as Mission['priority'])}
                                className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm outline-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Target Date */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Target Date</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={e => setTargetDate(e.target.value)}
                            className="w-full bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5 text-sm outline-none"
                        />
                    </div>

                    {/* GitHub Repo */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">GitHub Repository</label>
                        <div ref={pickerRef} className="relative">
                            <div className="flex gap-2">
                                <div className="flex-1 flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5">
                                    <Github size={14} className="text-muted-foreground flex-shrink-0" />
                                    <input
                                        type="text"
                                        value={repoUrl}
                                        onChange={e => setRepoUrl(e.target.value)}
                                        placeholder="Paste URL or pick from your repos →"
                                        className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
                                    />
                                    {repoUrl && (
                                        <button onClick={() => setRepoUrl('')} className="text-muted-foreground hover:text-foreground">
                                            <X size={12} />
                                        </button>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={openRepoPicker}
                                    className="flex items-center gap-1.5 px-3 py-2 bg-card border border-border rounded-xl text-xs text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors whitespace-nowrap"
                                >
                                    Browse <ChevronDown size={12} />
                                </button>
                            </div>

                            {/* Repo picker dropdown */}
                            <AnimatePresence>
                                {showRepoPicker && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 4, scale: 0.98 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 4, scale: 0.98 }}
                                        className="absolute left-0 right-0 top-full mt-1 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                                    >
                                        {/* Search */}
                                        <div className="p-2 border-b border-border">
                                            <div className="flex items-center gap-2 px-2">
                                                <Search size={13} className="text-muted-foreground flex-shrink-0" />
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={repoSearch}
                                                    onChange={e => setRepoSearch(e.target.value)}
                                                    placeholder="Search repos..."
                                                    className="flex-1 bg-transparent text-sm outline-none py-1.5"
                                                />
                                            </div>
                                        </div>

                                        <div className="max-h-64 overflow-y-auto">
                                            {reposLoading && (
                                                <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
                                                    <Loader2 size={16} className="animate-spin" />
                                                    <span className="text-sm">Loading your repos...</span>
                                                </div>
                                            )}
                                            {reposError && (
                                                <div className="text-center py-6 text-sm text-red-400 px-4">{reposError}</div>
                                            )}
                                            {!reposLoading && !reposError && filteredRepos.length === 0 && (
                                                <div className="text-center py-6 text-sm text-muted-foreground">No repos found</div>
                                            )}
                                            {!reposLoading && filteredRepos.map(repo => {
                                                const isSelected = repoUrl === repo.url;
                                                return (
                                                    <button
                                                        key={repo.id}
                                                        onClick={() => selectRepo(repo)}
                                                        className={cn(
                                                            "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-secondary transition-colors",
                                                            isSelected && "bg-primary/5"
                                                        )}
                                                    >
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
                                                                {repo.private && <Lock size={11} className="text-muted-foreground flex-shrink-0" />}
                                                                <span className="truncate">{repo.name}</span>
                                                                {isSelected && <Check size={13} className="text-primary flex-shrink-0 ml-auto" />}
                                                            </div>
                                                            {repo.description && (
                                                                <p className="text-xs text-muted-foreground truncate mt-0.5">{repo.description}</p>
                                                            )}
                                                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                                                                {repo.language && <span>{repo.language}</span>}
                                                                {repo.stars > 0 && (
                                                                    <span className="flex items-center gap-0.5">
                                                                        <Star size={9} /> {repo.stars}
                                                                    </span>
                                                                )}
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
                    </div>

                    {/* Domain URL */}
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Live Domain URL (for monitoring)</label>
                        <div className="flex items-center gap-2 bg-secondary/50 border border-border/50 rounded-xl px-3 py-2.5">
                            <span className="text-muted-foreground text-xs">🌐</span>
                            <input
                                type="url"
                                value={domainUrl}
                                onChange={e => setDomainUrl(e.target.value)}
                                placeholder="https://example.com"
                                className="flex-1 bg-transparent text-sm outline-none text-foreground placeholder:text-muted-foreground/50"
                            />
                            {domainUrl && (
                                <button onClick={() => setDomainUrl('')} className="text-muted-foreground hover:text-foreground">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">Monitor uptime, SSL, and response time</p>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-border bg-secondary/10 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className={cn(
                            "px-5 py-2 rounded-xl text-sm font-medium bg-primary text-primary-foreground transition-all",
                            "hover:opacity-90 shadow-lg shadow-primary/20",
                            !name.trim() && "opacity-40 cursor-not-allowed shadow-none"
                        )}
                    >
                        {initialData?.name ? 'Save Changes' : 'Create Project'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
