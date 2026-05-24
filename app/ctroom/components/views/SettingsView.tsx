'use client';

import React, { useState, useEffect } from 'react';
import {
    User, Key, Shield, Eye, EyeOff, Check, X, Loader2,
    Github, Sparkles, Zap, Bot, Plus, Trash2, ExternalLink,
    ChevronDown, ChevronUp, RefreshCw, Circle, Clock, MapPin, Calendar as CalendarIcon
} from 'lucide-react';
import { UserSettings, CtroomAccent, ThemeMode } from '../../types';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface SettingsViewProps {
    settings: UserSettings;
    onSave: (settings: UserSettings) => void;
    onAccentPreview: (accent: CtroomAccent) => void;
}

type SettingsTab = 'profile' | 'integrations' | 'appearance' | 'schedule' | 'privacy';

// ─── Provider definitions ───────────────────────────────────────────────────

interface ProviderDef {
    id: string;
    name: string;
    description: string;
    placeholder: string;
    docsUrl: string;
    color: string;
    icon: React.ElementType;
    usedFor: string[];
}

const PROVIDERS: ProviderDef[] = [
    {
        id: 'github',
        name: 'GitHub',
        description: 'Repo picker, project sync, commit history',
        placeholder: 'ghp_...',
        docsUrl: 'https://github.com/settings/tokens',
        color: '#f0f0f0',
        icon: Github,
        usedFor: ['Projects'],
    },
    {
        id: 'openai',
        name: 'OpenAI',
        description: 'GPT-4o, o1 — used by Milo',
        placeholder: 'sk-proj-...',
        docsUrl: 'https://platform.openai.com/api-keys',
        color: '#10a37f',
        icon: Bot,
        usedFor: ['Milo'],
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        description: 'Claude Sonnet / Opus — used by Milo',
        placeholder: 'sk-ant-...',
        docsUrl: 'https://console.anthropic.com/settings/keys',
        color: '#d97706',
        icon: Sparkles,
        usedFor: ['Milo'],
    },
    {
        id: 'google',
        name: 'Google Gemini',
        description: 'Gemini 2.0 / 2.5 Pro — used by Milo and Search',
        placeholder: 'AIza...',
        docsUrl: 'https://aistudio.google.com/apikey',
        color: '#4285f4',
        icon: Zap,
        usedFor: ['Milo', 'Search'],
    },
    {
        id: 'groq',
        name: 'Groq',
        description: 'Llama 3, Mixtral — ultra fast inference for Milo',
        placeholder: 'gsk_...',
        docsUrl: 'https://console.groq.com/keys',
        color: '#f97316',
        icon: Zap,
        usedFor: ['Milo'],
    },
];

// ─── Main Component ─────────────────────────────────────────────────────────

export const SettingsView = ({ settings, onSave, onAccentPreview }: SettingsViewProps) => {
    const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
    const [local, setLocal] = useState<UserSettings>(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await onSave(local);
        setIsSaving(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
        { id: 'profile',     label: 'Profile',     icon: User    },
        { id: 'integrations',label: 'Integrations',icon: Key     },
        { id: 'appearance',  label: 'Appearance',  icon: Sparkles},
        { id: 'schedule',    label: 'Schedule',    icon: Clock   },
        { id: 'privacy',     label: 'Privacy',     icon: Shield  },
    ];

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div>
                <h1 className="font-display text-2xl text-foreground">Settings</h1>
                <p className="text-sm text-muted-foreground mt-0.5">Manage your account, integrations, and API keys</p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors",
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
            <div className="min-h-[500px]">
                {activeTab === 'profile' && (
                    <ProfileTab local={local} setLocal={setLocal} />
                )}
                {activeTab === 'integrations' && (
                    <IntegrationsTab local={local} setLocal={setLocal} />
                )}
                {activeTab === 'appearance' && (
                    <AppearanceTab
                        local={local}
                        setLocal={setLocal}
                        onAccentPreview={onAccentPreview}
                    />
                )}
                {activeTab === 'schedule' && (
                    <ScheduleTab local={local} setLocal={setLocal} />
                )}
                {activeTab === 'privacy' && (
                    <PrivacyTab />
                )}
            </div>

            {/* Save */}
            <div className="flex justify-end pt-2 border-t border-border">
                <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={cn(
                        "flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                        saved
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20"
                    )}
                >
                    {isSaving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
                    {isSaving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>
        </div>
    );
};

// ─── Profile Tab ─────────────────────────────────────────────────────────────

function ProfileTab({ local, setLocal }: { local: UserSettings; setLocal: React.Dispatch<React.SetStateAction<UserSettings>> }) {
    const update = (field: keyof UserSettings['profile'], val: string) =>
        setLocal(prev => ({ ...prev, profile: { ...prev.profile, [field]: val } }));

    const togglePref = (field: keyof UserSettings['preferences']) =>
        setLocal(prev => ({ ...prev, preferences: { ...prev.preferences, [field]: !prev.preferences[field] } }));

    return (
        <div className="space-y-8 max-w-xl">
            <section className="space-y-4">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Profile</h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Name</label>
                        <input
                            type="text"
                            value={local.profile.name}
                            onChange={e => update('name', e.target.value)}
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Email</label>
                        <input
                            type="email"
                            value={local.profile.email}
                            onChange={e => update('email', e.target.value)}
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1 block">Avatar URL</label>
                        <input
                            type="url"
                            value={local.profile.avatar || ''}
                            onChange={e => update('avatar', e.target.value)}
                            placeholder="https://..."
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>
            </section>

            <section className="space-y-3">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Preferences</h2>
                {[
                    { key: 'notifications' as const, label: 'Notifications', desc: 'Receive alerts and reminders' },
                    { key: 'autoSave' as const, label: 'Auto-save', desc: 'Automatically save changes' },
                    { key: 'sidebarCollapsed' as const, label: 'Collapsed sidebar', desc: 'Start with sidebar hidden' },
                ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                        <div>
                            <div className="text-sm font-medium text-foreground">{label}</div>
                            <div className="text-xs text-muted-foreground">{desc}</div>
                        </div>
                        <button
                            onClick={() => togglePref(key)}
                            className={cn(
                                "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                                local.preferences[key] ? "bg-primary" : "bg-border"
                            )}
                        >
                            <div className={cn(
                                "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                local.preferences[key] && "translate-x-5"
                            )} />
                        </button>
                    </div>
                ))}
            </section>
        </div>
    );
}

// ─── Integrations Tab ─────────────────────────────────────────────────────────

function IntegrationsTab({ local, setLocal }: { local: UserSettings; setLocal: React.Dispatch<React.SetStateAction<UserSettings>> }) {
    const [envStatus, setEnvStatus] = useState<Record<string, boolean>>({});
    const [loadingStatus, setLoadingStatus] = useState(true);
    const [githubUser, setGithubUser] = useState<{ login: string; name: string; avatar: string } | null>(null);

    useEffect(() => {
        // Check which env-var keys are set
        fetch('/api/ctroom/settings/key-status')
            .then(r => r.json())
            .then(data => { setEnvStatus(data); setLoadingStatus(false); })
            .catch(() => setLoadingStatus(false));

        // Try to load GitHub user info
        fetch('/api/ctroom/github/repos')
            .then(r => r.ok ? r.json() : null)
            .then(data => { if (data?.user) setGithubUser(data.user); })
            .catch(() => {});
    }, []);

    const setKey = (id: string, value: string) =>
        setLocal(prev => ({ ...prev, apiKeys: { ...prev.apiKeys, [id]: value || undefined } }));

    return (
        <div className="space-y-4">
            {/* GitHub connection banner */}
            <div className={cn(
                "flex items-center gap-4 p-4 rounded-xl border",
                githubUser
                    ? "bg-emerald-500/5 border-emerald-500/20"
                    : "bg-card border-border"
            )}>
                <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden",
                    githubUser ? "" : "bg-secondary"
                )}>
                    {githubUser?.avatar
                        ? <img src={githubUser.avatar} alt={githubUser.login} className="w-full h-full object-cover" />
                        : <Github size={20} className="text-muted-foreground" />
                    }
                </div>
                <div className="flex-1 min-w-0">
                    {githubUser ? (
                        <>
                            <div className="text-sm font-medium text-foreground flex items-center gap-2">
                                {githubUser.name || githubUser.login}
                                <span className="flex items-center gap-1 text-xs text-emerald-400">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Connected
                                </span>
                            </div>
                            <div className="text-xs text-muted-foreground">@{githubUser.login} · GitHub</div>
                        </>
                    ) : (
                        <>
                            <div className="text-sm font-medium text-foreground">GitHub</div>
                            <div className="text-xs text-muted-foreground">Not connected — add a token below</div>
                        </>
                    )}
                </div>
                {githubUser && (
                    <a href={`https://github.com/${githubUser.login}`} target="_blank" rel="noreferrer"
                        className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors">
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>

            {/* Provider cards */}
            <div className="space-y-2">
                {PROVIDERS.map(provider => (
                    <ProviderCard
                        key={provider.id}
                        provider={provider}
                        customKey={local.apiKeys[provider.id]}
                        envActive={loadingStatus ? null : (envStatus[provider.id] ?? false)}
                        onSave={val => setKey(provider.id, val)}
                    />
                ))}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground pt-2 pl-1">
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" /> Default key active (from .env)
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-400" /> Custom key override
                </span>
                <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-zinc-500" /> Not configured
                </span>
            </div>
        </div>
    );
}

// ─── Provider Card ────────────────────────────────────────────────────────────

function ProviderCard({
    provider, customKey, envActive, onSave
}: {
    provider: ProviderDef;
    customKey?: string;
    envActive: boolean | null;
    onSave: (val: string) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [inputVal, setInputVal] = useState(customKey || '');
    const [showKey, setShowKey] = useState(false);

    const hasCustom = !!customKey;
    const isActive = envActive || hasCustom;

    const statusDot = envActive === null ? 'bg-zinc-600 animate-pulse' :
        hasCustom ? 'bg-blue-400' :
        envActive ? 'bg-emerald-400' : 'bg-zinc-500';

    const statusLabel = envActive === null ? 'Checking...' :
        hasCustom ? 'Custom key' :
        envActive ? 'Default key active' : 'Not configured';

    const handleSave = () => {
        onSave(inputVal.trim());
        setExpanded(false);
    };

    const handleClear = () => {
        setInputVal('');
        onSave('');
    };

    const Icon = provider.icon;

    return (
        <div className={cn(
            "bg-card border rounded-xl overflow-hidden transition-all",
            expanded ? "border-primary/30" : "border-border"
        )}>
            <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-secondary/30 transition-colors"
                onClick={() => setExpanded(v => !v)}
            >
                {/* Color dot + icon */}
                <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${provider.color}18`, border: `1px solid ${provider.color}30` }}
                >
                    <Icon size={17} style={{ color: provider.color }} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">{provider.name}</span>
                        {/* Used-for chips */}
                        {provider.usedFor.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 bg-secondary text-muted-foreground rounded">
                                {tag}
                            </span>
                        ))}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">{provider.description}</div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <span className={cn("w-2 h-2 rounded-full flex-shrink-0", statusDot)} />
                        <span className="hidden sm:block">{statusLabel}</span>
                    </div>
                    {expanded ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                </div>
            </button>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                            {/* Env status info */}
                            {envActive && !hasCustom && (
                                <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/5 border border-emerald-400/20 rounded-lg px-3 py-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                    Default key from <code className="font-mono">.env</code> is active. Override below if needed.
                                </div>
                            )}

                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <input
                                        type={showKey ? 'text' : 'password'}
                                        value={inputVal}
                                        onChange={e => setInputVal(e.target.value)}
                                        placeholder={hasCustom ? '••••••••' : provider.placeholder}
                                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowKey(v => !v)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                                    </button>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={!inputVal.trim()}
                                    className="px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
                                >
                                    Save
                                </button>
                                {hasCustom && (
                                    <button
                                        onClick={handleClear}
                                        className="px-3 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg text-xs hover:bg-red-500/20 transition-colors"
                                        title="Remove custom key (revert to default)"
                                    >
                                        <Trash2 size={13} />
                                    </button>
                                )}
                            </div>

                            <a
                                href={provider.docsUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                            >
                                <ExternalLink size={11} /> Get a key at {new URL(provider.docsUrl).hostname}
                            </a>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

const ACCENTS: { id: CtroomAccent; label: string; light: string; dark: string }[] = [
    { id: 'none',    label: 'Default',  light: '#18181b', dark: '#fafafa'  },
    { id: 'violet',  label: 'Violet',   light: '#6d28d9', dark: '#a78bfa'  },
    { id: 'ocean',   label: 'Ocean',    light: '#1d4ed8', dark: '#60a5fa'  },
    { id: 'amber',   label: 'Amber',    light: '#b45309', dark: '#fbbf24'  },
    { id: 'emerald', label: 'Emerald',  light: '#047857', dark: '#34d399'  },
    { id: 'rose',    label: 'Rose',     light: '#be123c', dark: '#fb7185'  },
];

const MODES: { id: ThemeMode; label: string; icon: string }[] = [
    { id: 'light', label: 'Light', icon: '☀' },
    { id: 'dark',  label: 'Dark',  icon: '☽' },
];

function AppearanceTab({
    local,
    setLocal,
    onAccentPreview,
}: {
    local: UserSettings;
    setLocal: React.Dispatch<React.SetStateAction<UserSettings>>;
    onAccentPreview: (a: CtroomAccent) => void;
}) {
    const currentAccent = local.preferences.accent ?? 'none';
    const currentTheme  = local.preferences.theme;

    const setTheme = (t: ThemeMode) => {
        setLocal(prev => ({ ...prev, preferences: { ...prev.preferences, theme: t } }));
        // Apply immediately
        if (t === 'dark') document.documentElement.classList.add('dark');
        else              document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', t);
    };

    const setAccent = (a: CtroomAccent) => {
        setLocal(prev => ({ ...prev, preferences: { ...prev.preferences, accent: a } }));
        onAccentPreview(a); // instant visual preview
        localStorage.setItem('ctroom-accent', a);
    };

    return (
        <div className="space-y-8 max-w-xl">
            {/* Mode */}
            <section className="space-y-4">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Color Mode
                </h2>
                <div className="grid grid-cols-2 gap-3">
                    {MODES.map(mode => (
                        <button
                            key={mode.id}
                            onClick={() => setTheme(mode.id)}
                            className={cn(
                                "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all",
                                currentTheme === mode.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-border/80 hover:bg-secondary/30"
                            )}
                        >
                            {/* Preview swatch */}
                            <div className={cn(
                                "w-full h-16 rounded-xl border border-border/50 overflow-hidden flex",
                                mode.id === 'dark' ? "bg-zinc-900" : "bg-zinc-50"
                            )}>
                                <div className={cn(
                                    "w-1/4 h-full",
                                    mode.id === 'dark' ? "bg-zinc-800" : "bg-zinc-200"
                                )} />
                                <div className="flex-1 flex flex-col justify-center gap-1.5 px-3">
                                    <div className={cn(
                                        "h-2 w-3/4 rounded-full",
                                        mode.id === 'dark' ? "bg-zinc-600" : "bg-zinc-300"
                                    )} />
                                    <div className={cn(
                                        "h-1.5 w-1/2 rounded-full",
                                        mode.id === 'dark' ? "bg-zinc-700" : "bg-zinc-200"
                                    )} />
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{mode.icon}</span>
                                <span className={cn(
                                    "text-sm font-medium",
                                    currentTheme === mode.id ? "text-primary" : "text-foreground"
                                )}>{mode.label}</span>
                                {currentTheme === mode.id && (
                                    <Check size={13} className="text-primary" />
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </section>

            {/* Accent */}
            <section className="space-y-4">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Accent Color
                </h2>
                <div className="grid grid-cols-3 gap-3">
                    {ACCENTS.map(a => (
                        <button
                            key={a.id}
                            onClick={() => setAccent(a.id)}
                            className={cn(
                                "flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all",
                                currentAccent === a.id
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-border/80 hover:bg-secondary/30"
                            )}
                        >
                            {/* Color dot */}
                            <div
                                className="w-8 h-8 rounded-full ring-2 ring-offset-2 ring-offset-background shadow-md transition-transform group-hover:scale-110"
                                style={{
                                    background: `linear-gradient(135deg, ${a.light}, ${a.dark})`,
                                    ['--tw-ring-color' as any]: currentAccent === a.id ? a.light : 'transparent',
                                }}
                            />
                            <div className="flex items-center gap-1">
                                <span className={cn(
                                    "text-xs font-medium",
                                    currentAccent === a.id ? "text-primary" : "text-muted-foreground"
                                )}>{a.label}</span>
                                {currentAccent === a.id && <Check size={11} className="text-primary" />}
                            </div>
                        </button>
                    ))}
                </div>
                <p className="text-[11px] text-muted-foreground">Changes apply instantly — save to persist.</p>
            </section>
        </div>
    );
}

// ─── Schedule Tab ─────────────────────────────────────────────────────────────

function ScheduleTab({ local, setLocal }: { local: UserSettings; setLocal: React.Dispatch<React.SetStateAction<UserSettings>> }) {
    const schedule = local.preferences.workSchedule || {
        workDays: [1, 2, 3, 4, 5], // Mon-Fri
        startTime: '09:00',
        endTime: '17:00',
        location: '',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        overtimeEnabled: false,
        overtimeRate: 1.5,
    };

    const updateSchedule = (field: string, value: any) => {
        setLocal(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                workSchedule: { ...schedule, [field]: value }
            }
        }));
    };

    const toggleDay = (day: number) => {
        const days = schedule.workDays || [];
        const newDays = days.includes(day) 
            ? days.filter(d => d !== day)
            : [...days, day].sort();
        updateSchedule('workDays', newDays);
    };

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <div className="space-y-8 max-w-2xl">
            {/* Work Days */}
            <section className="space-y-4">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Work Days
                </h2>
                <div className="grid grid-cols-7 gap-2">
                    {dayNames.map((day, idx) => (
                        <button
                            key={idx}
                            onClick={() => toggleDay(idx)}
                            className={cn(
                                "flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all",
                                schedule.workDays?.includes(idx)
                                    ? "border-primary bg-primary/10 text-primary"
                                    : "border-border hover:border-border/80 text-muted-foreground"
                            )}
                        >
                            <span className="text-xs font-medium">{day}</span>
                            {schedule.workDays?.includes(idx) && (
                                <Check size={12} className="text-primary" />
                            )}
                        </button>
                    ))}
                </div>
            </section>

            {/* Work Hours */}
            <section className="space-y-4">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Work Hours
                </h2>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                            <Clock size={11} /> Start Time
                        </label>
                        <input
                            type="time"
                            value={schedule.startTime}
                            onChange={e => updateSchedule('startTime', e.target.value)}
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                            <Clock size={11} /> End Time
                        </label>
                        <input
                            type="time"
                            value={schedule.endTime}
                            onChange={e => updateSchedule('endTime', e.target.value)}
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 px-1">
                    <CalendarIcon size={11} />
                    Total: {calculateHours(schedule.startTime, schedule.endTime)} hours per day
                </div>
            </section>

            {/* Location */}
            <section className="space-y-4">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Location & Timezone
                </h2>
                <div className="space-y-3">
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block flex items-center gap-1.5">
                            <MapPin size={11} /> Work Location
                        </label>
                        <input
                            type="text"
                            value={schedule.location || ''}
                            onChange={e => updateSchedule('location', e.target.value)}
                            placeholder="e.g., Office, Home, Remote"
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                    </div>
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Timezone</label>
                        <select
                            value={schedule.timezone}
                            onChange={e => updateSchedule('timezone', e.target.value)}
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                        >
                            {Intl.supportedValuesOf('timeZone').map(tz => (
                                <option key={tz} value={tz}>{tz}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </section>

            {/* Overtime */}
            <section className="space-y-4">
                <h2 className="font-mono text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                    Overtime Settings
                </h2>
                <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
                    <div>
                        <div className="text-sm font-medium text-foreground">Enable Overtime Tracking</div>
                        <div className="text-xs text-muted-foreground">Track hours worked beyond scheduled time</div>
                    </div>
                    <button
                        onClick={() => updateSchedule('overtimeEnabled', !schedule.overtimeEnabled)}
                        className={cn(
                            "relative w-11 h-6 rounded-full transition-colors flex-shrink-0",
                            schedule.overtimeEnabled ? "bg-primary" : "bg-border"
                        )}
                    >
                        <div className={cn(
                            "absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                            schedule.overtimeEnabled && "translate-x-5"
                        )} />
                    </button>
                </div>
                {schedule.overtimeEnabled && (
                    <div>
                        <label className="text-xs text-muted-foreground mb-1.5 block">Overtime Rate Multiplier</label>
                        <input
                            type="number"
                            step="0.1"
                            min="1"
                            max="3"
                            value={schedule.overtimeRate}
                            onChange={e => updateSchedule('overtimeRate', parseFloat(e.target.value))}
                            className="w-full px-4 py-2.5 bg-card border border-border rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                            Overtime hours will be counted as {schedule.overtimeRate}x regular hours
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

function calculateHours(start: string, end: string): string {
    if (!start || !end) return '0';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const startMins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    const diff = endMins - startMins;
    if (diff <= 0) return '0';
    const hours = Math.floor(diff / 60);
    const mins = diff % 60;
    return mins > 0 ? `${hours}.${Math.round((mins / 60) * 10)}` : `${hours}`;
}

// ─── Privacy Tab ──────────────────────────────────────────────────────────────

function PrivacyTab() {
    return (
        <div className="space-y-4 max-w-xl">
            <div className="p-4 bg-card border border-border rounded-xl">
                <h3 className="text-sm font-medium text-foreground mb-1">Data Storage</h3>
                <p className="text-xs text-muted-foreground">All data is stored in your personal Supabase instance. You own everything.</p>
            </div>
            <div className="p-4 bg-card border border-border rounded-xl">
                <h3 className="text-sm font-medium text-foreground mb-2">Export Data</h3>
                <p className="text-xs text-muted-foreground mb-3">Download all your data as JSON.</p>
                <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90 transition-opacity">
                    Export All Data
                </button>
            </div>
            <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                <h3 className="text-sm font-medium text-red-400 mb-1">Danger Zone</h3>
                <p className="text-xs text-muted-foreground mb-3">Permanently delete all your data. Cannot be undone.</p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 transition-colors">
                    Delete All Data
                </button>
            </div>
        </div>
    );
}
