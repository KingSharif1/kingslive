'use client';

/**
 * Milo — King's personal AI command interface
 * Jarvis-like, context-aware, elite UI
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Send, Settings, ChevronDown, X, Zap, Brain, Sparkles, Globe,
    Github, Code, Check, RefreshCw, Clock, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, AIModel, ChatTool, ChatSpeed, ChatContext, ActionItem, Mission } from '../../types/index';
import { cn } from '@/lib/utils';
import { format, isToday } from 'date-fns';

// ─── Models ───────────────────────────────────────────────────────────────────

const AI_MODELS: AIModel[] = [
    { id: 'gemini-2.0-flash', name: 'Gemini Flash', provider: 'Google', description: 'Fast & Multimodal', contextTokens: '1M', icon: '✦' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast & Smart', contextTokens: '128K', icon: '⚡' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Most Capable', contextTokens: '128K', icon: '🧠' },
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet', provider: 'Anthropic', description: 'Writing & Analysis', contextTokens: '200K', icon: '◈' },
    { id: 'groq-llama', name: 'Llama 3.3', provider: 'Groq', description: 'Lightning Fast', contextTokens: '128K', icon: '⚡' },
];

const PROVIDER_COLORS: Record<string, string> = {
    Google: 'from-blue-500 to-cyan-400',
    OpenAI: 'from-emerald-500 to-teal-400',
    Anthropic: 'from-amber-500 to-orange-400',
    Groq: 'from-purple-500 to-pink-400',
};

// ─── Props ────────────────────────────────────────────────────────────────────

interface ChatViewProps {
    messages: Message[];
    chatInput: string;
    setChatInput: (val: string) => void;
    handleSendMessage: (model: string, tool: ChatTool, speed: ChatSpeed, context: ChatContext[]) => void;
    isTyping: boolean;
    actionItems: ActionItem[];
    missions: Mission[];
    apiKeys: { google?: string; github?: string; openai?: string; anthropic?: string; groq?: string; [key: string]: string | undefined };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

function buildQuickPrompts(actionItems: ActionItem[], missions: Mission[]): string[] {
    const prompts: string[] = [];

    const todayTasks = actionItems.filter(t =>
        t.status !== 'done' && t.status !== 'archived' && isToday(new Date(t.date))
    );
    if (todayTasks.length > 0) {
        prompts.push(`I have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} today — help me prioritize`);
    }

    const focusMission = missions.find(m => m.focusWeek && m.status === 'active');
    if (focusMission) {
        prompts.push(`What should I focus on for "${focusMission.name}" today?`);
    } else if (missions.filter(m => m.status === 'active').length > 0) {
        prompts.push(`Give me a status check on my active projects`);
    }

    // Fallbacks
    const defaults = [
        'Help me brainstorm ideas',
        "What's the best approach for this?",
        'Draft something for me',
        'Explain this concept simply',
    ];
    while (prompts.length < 3) {
        const next = defaults.shift();
        if (!next) break;
        prompts.push(next);
    }

    return prompts.slice(0, 3);
}

// ─── Milo Orb ─────────────────────────────────────────────────────────────────

function MiloOrb({ size = 'md', pulse = false }: { size?: 'sm' | 'md' | 'lg'; pulse?: boolean }) {
    const sizes = { sm: 'w-7 h-7 text-sm', md: 'w-9 h-9 text-base', lg: 'w-14 h-14 text-2xl' };
    return (
        <div className={cn(
            'rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-400 flex items-center justify-center shrink-0 shadow-lg shadow-violet-500/20',
            sizes[size],
            pulse && 'animate-pulse',
        )}>
            <span className="font-display text-white">M</span>
        </div>
    );
}

// ─── Context Badge ────────────────────────────────────────────────────────────

function ContextBadge({ label, count, icon: Icon }: { label: string; count: number; icon: React.ElementType }) {
    return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-secondary/50 rounded-full text-xs text-muted-foreground border border-border/40">
            <Icon className="w-3 h-3" />
            <span className="font-medium">{count}</span>
            <span>{label}</span>
        </div>
    );
}

// ─── Thinking Steps ───────────────────────────────────────────────────────────

function ThinkingStepsDisplay({ steps }: { steps: { title: string; status: string; description: string }[] }) {
    const [open, setOpen] = useState(false);
    if (!steps?.length) return null;
    return (
        <div className="mt-2 mb-1">
            <button
                onClick={() => setOpen(!open)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground/70 hover:text-muted-foreground transition-colors"
            >
                <Brain className="w-3 h-3" />
                <span>Thinking steps</span>
                <ChevronRight className={cn('w-3 h-3 transition-transform', open && 'rotate-90')} />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 ml-1 border-l-2 border-border/50 pl-3 space-y-1.5"
                    >
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className={cn(
                                    'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                    step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                                    step.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                    'bg-muted text-muted-foreground'
                                )}>
                                    {step.status === 'completed' ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                </div>
                                <div>
                                    <div className="text-xs font-medium text-foreground/80">{step.title}</div>
                                    <div className="text-[10px] text-muted-foreground">{step.description}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export const ChatView = ({
    messages, chatInput, setChatInput, handleSendMessage, isTyping,
    actionItems, missions, apiKeys,
}: ChatViewProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
    const [selectedSpeed, setSelectedSpeed] = useState<ChatSpeed>('balanced');
    const [selectedTool, setSelectedTool] = useState<ChatTool>('none');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTools, setShowTools] = useState(false);

    const quickPrompts = buildQuickPrompts(actionItems, missions);
    const todayTasks = actionItems.filter(t => t.status !== 'done' && t.status !== 'archived' && isToday(new Date(t.date)));
    const activeMissions = missions.filter(m => m.status === 'active');

    // Auto-scroll
    useEffect(() => {
        setTimeout(() => {
            scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }, 80);
    }, [messages, isTyping]);

    // Auto-resize textarea
    const handleInput = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setChatInput(e.target.value);
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
    }, [setChatInput]);

    const onSend = () => {
        if (!chatInput.trim()) return;
        handleSendMessage(selectedModel.id, selectedTool, selectedSpeed, []);
        inputRef.current?.focus();
        if (inputRef.current) inputRef.current.style.height = 'auto';
    };

    const isWelcome = messages.length <= 1;
    const providerGradient = PROVIDER_COLORS[selectedModel.provider] || 'from-violet-500 to-indigo-400';

    return (
        <div className="h-full flex flex-col bg-background relative overflow-hidden">

            {/* ── Header ── */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3.5 border-b border-border/30 bg-background/70 backdrop-blur-xl">
                {/* Model picker */}
                <button
                    onClick={() => setShowModelPicker(v => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-secondary/50 hover:bg-secondary border border-border/40 transition-all"
                >
                    <span className={cn(
                        'w-5 h-5 rounded-md bg-gradient-to-tr flex items-center justify-center text-[10px] font-bold text-white shrink-0',
                        providerGradient,
                    )}>{selectedModel.icon}</span>
                    <span className="text-sm font-medium">{selectedModel.name}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>

                {/* Milo wordmark */}
                <div className="flex items-center gap-2">
                    <MiloOrb size="sm" />
                    <span className="font-display text-sm tracking-tight text-foreground/80">Milo</span>
                </div>

                {/* Settings */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-xl hover:bg-secondary/60 text-muted-foreground transition-colors"
                >
                    <Settings className="w-4.5 h-4.5" />
                </button>
            </div>

            {/* ── Model Picker Dropdown ── */}
            <AnimatePresence>
                {showModelPicker && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -8 }}
                            transition={{ duration: 0.15 }}
                            className="absolute top-[60px] left-5 w-72 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 p-2"
                        >
                            {AI_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => { setSelectedModel(model); setShowModelPicker(false); }}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                                        selectedModel.id === model.id ? 'bg-secondary' : 'hover:bg-secondary/50',
                                    )}
                                >
                                    <span className={cn(
                                        'w-8 h-8 rounded-lg bg-gradient-to-tr flex items-center justify-center text-sm font-bold text-white shrink-0',
                                        PROVIDER_COLORS[model.provider] || 'from-gray-500 to-gray-400',
                                    )}>{model.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm">{model.name}</div>
                                        <div className="text-[10px] text-muted-foreground">{model.provider} · {model.description}</div>
                                    </div>
                                    {selectedModel.id === model.id && <Check className="w-4 h-4 text-primary shrink-0" />}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Settings Panel ── */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
                            onClick={() => setShowSettings(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border shadow-2xl z-50 flex flex-col"
                        >
                            <div className="flex items-center justify-between p-5 border-b border-border/50">
                                <div className="flex items-center gap-2.5">
                                    <MiloOrb size="sm" />
                                    <h2 className="font-display font-semibold">Milo Settings</h2>
                                </div>
                                <button onClick={() => setShowSettings(false)} className="p-1.5 hover:bg-secondary rounded-lg">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-7">
                                {/* Thinking mode */}
                                <div>
                                    <label className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">Thinking Mode</label>
                                    <div className="space-y-1.5">
                                        {[
                                            { id: 'fast' as ChatSpeed, icon: Zap, label: 'Fast', desc: 'Quick, direct responses' },
                                            { id: 'balanced' as ChatSpeed, icon: Sparkles, label: 'Balanced', desc: 'Standard reasoning' },
                                            { id: 'deep-think' as ChatSpeed, icon: Brain, label: 'Deep Think', desc: 'Complex problem solving' },
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedSpeed(s.id)}
                                                className={cn(
                                                    'w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                                                    selectedSpeed === s.id
                                                        ? 'bg-primary/5 border-primary/40 text-primary'
                                                        : 'border-border/40 text-muted-foreground hover:bg-secondary/50',
                                                )}
                                            >
                                                <s.icon className="w-4 h-4 shrink-0" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{s.label}</div>
                                                    <div className="text-[10px] opacity-60">{s.desc}</div>
                                                </div>
                                                {selectedSpeed === s.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Connections */}
                                <div>
                                    <label className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">Connected Services</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'GitHub', connected: !!(apiKeys?.github || process.env.NEXT_PUBLIC_GITHUB_TOKEN), icon: Github, color: 'bg-zinc-800 text-white' },
                                            { label: 'Web Search', connected: !!(apiKeys?.google), icon: Globe, color: 'bg-blue-500 text-white' },
                                            { label: 'OpenAI', connected: !!(apiKeys?.openai), icon: Zap, color: 'bg-emerald-500 text-white' },
                                        ].map(conn => (
                                            <div key={conn.label} className="flex items-center justify-between px-3 py-2.5 bg-secondary/30 rounded-xl">
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', conn.color)}>
                                                        <conn.icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-sm font-medium">{conn.label}</span>
                                                </div>
                                                <div className={cn(
                                                    'w-2 h-2 rounded-full',
                                                    conn.connected ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-zinc-500',
                                                )} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Context */}
                                <div>
                                    <label className="font-mono text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-3 block">Milo Knows About</label>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 rounded-xl">
                                            <span className="text-muted-foreground">Active tasks</span>
                                            <span className="font-mono font-semibold">{actionItems.filter(t => t.status !== 'done' && t.status !== 'archived').length}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 rounded-xl">
                                            <span className="text-muted-foreground">Active projects</span>
                                            <span className="font-mono font-semibold">{activeMissions.length}</span>
                                        </div>
                                        <div className="flex items-center justify-between px-3 py-2 bg-secondary/30 rounded-xl">
                                            <span className="text-muted-foreground">Due today</span>
                                            <span className="font-mono font-semibold">{todayTasks.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ── Message Area ── */}
            <div className="flex-1 overflow-y-auto pt-[60px] pb-[88px]" ref={scrollRef}>
                {isWelcome ? (
                    /* Welcome Screen */
                    <div className="h-full flex flex-col items-center justify-center px-6 -mt-8">
                        {/* Milo orb + greeting */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: 'easeOut' }}
                            className="flex flex-col items-center gap-4 mb-8"
                        >
                            <div className="relative">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-violet-600 via-purple-500 to-indigo-400 flex items-center justify-center shadow-xl shadow-violet-500/25">
                                    <span className="font-display text-3xl font-bold text-white">M</span>
                                </div>
                                <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-violet-600 to-indigo-400 opacity-20 blur-md -z-10" />
                            </div>
                            <div className="text-center">
                                <h1 className="font-display text-3xl font-bold text-foreground mb-1">
                                    {getGreeting()}, King.
                                </h1>
                                <p className="text-muted-foreground">
                                    {todayTasks.length > 0
                                        ? `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today.`
                                        : activeMissions.length > 0
                                            ? `${activeMissions.length} active project${activeMissions.length > 1 ? 's' : ''} in motion.`
                                            : "What's on your mind?"}
                                </p>
                            </div>
                        </motion.div>

                        {/* Context pills */}
                        {(todayTasks.length > 0 || activeMissions.length > 0) && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="flex flex-wrap items-center justify-center gap-2 mb-8"
                            >
                                {todayTasks.length > 0 && (
                                    <ContextBadge label="due today" count={todayTasks.length} icon={Check} />
                                )}
                                {activeMissions.length > 0 && (
                                    <ContextBadge label="projects" count={activeMissions.length} icon={Code} />
                                )}
                            </motion.div>
                        )}

                        {/* Quick prompt cards */}
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="w-full max-w-xl grid grid-cols-1 gap-2.5"
                        >
                            {quickPrompts.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setChatInput(prompt)}
                                    className="px-4 py-3 bg-secondary/30 hover:bg-secondary/60 border border-border/30 hover:border-border/60 rounded-xl text-left text-sm text-foreground/80 hover:text-foreground transition-all hover:-translate-y-0.5"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </motion.div>
                    </div>
                ) : (
                    /* Messages */
                    <div className="px-4 max-w-3xl mx-auto space-y-5 py-4">
                        {messages.map(msg => (
                            <div key={msg.id}>
                                {msg.role === 'user' ? (
                                    /* User bubble */
                                    <div className="flex justify-end">
                                        <div className="max-w-[75%] px-4 py-3 bg-primary text-primary-foreground rounded-2xl rounded-tr-sm text-sm">
                                            {msg.content}
                                        </div>
                                    </div>
                                ) : msg.role === 'assistant' ? (
                                    /* Milo response */
                                    <div className="flex items-start gap-3">
                                        <MiloOrb size="sm" />
                                        <div className="flex-1 min-w-0">
                                            {msg.thoughts && Array.isArray(msg.thoughts) && msg.thoughts.length > 0 && (
                                                <ThinkingStepsDisplay steps={msg.thoughts as any} />
                                            )}
                                            <div className="bg-card border border-border/40 rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed shadow-sm">
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {msg.sources.map((src, i) => (
                                                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 bg-secondary/50 hover:bg-secondary border border-border/40 rounded-lg px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                                                        >
                                                            <Globe className="w-3 h-3" />
                                                            {src.title}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground/40">
                                                <Clock className="w-3 h-3" />
                                                <span>{format(msg.timestamp, 'h:mm a')}</span>
                                                {msg.model && <span>· {msg.model}</span>}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}
                            </div>
                        ))}

                        {/* Typing indicator */}
                        {isTyping && (
                            <div className="flex items-start gap-3">
                                <MiloOrb size="sm" pulse />
                                <div className="flex items-center gap-1.5 py-3 px-1">
                                    {[0, 1, 2].map(i => (
                                        <motion.div
                                            key={i}
                                            className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full"
                                            animate={{ y: [0, -4, 0] }}
                                            transition={{ duration: 0.8, delay: i * 0.15, repeat: Infinity }}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Input Island ── */}
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-background via-background/95 to-transparent z-10">
                <div className="max-w-3xl mx-auto">
                    <div className="bg-secondary/70 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl overflow-hidden">
                        {/* Active tool chip */}
                        <AnimatePresence>
                            {selectedTool !== 'none' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-4 pt-2.5 flex items-center gap-2"
                                >
                                    <div className="flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
                                        {selectedTool === 'search-web' && <Globe className="w-3 h-3" />}
                                        {selectedTool === 'github' && <Github className="w-3 h-3" />}
                                        {selectedTool === 'write-code' && <Code className="w-3 h-3" />}
                                        <span>{selectedTool.replace('-', ' ')}</span>
                                        <button onClick={() => setSelectedTool('none')} className="ml-1 hover:opacity-70">
                                            <X className="w-3 h-3" />
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex items-end gap-2 px-3 py-2.5">
                            {/* Tools button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowTools(!showTools)}
                                    className={cn(
                                        'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0',
                                        showTools ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                                    )}
                                >
                                    <span className={cn('text-lg leading-none transition-transform duration-200', showTools && 'rotate-45')}>+</span>
                                </button>

                                <AnimatePresence>
                                    {showTools && (
                                        <>
                                            <div className="fixed inset-0 z-0" onClick={() => setShowTools(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                                className="absolute bottom-11 left-0 w-52 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-10 p-1.5"
                                            >
                                                {[
                                                    { id: 'search-web' as ChatTool, icon: Globe, label: 'Web Search' },
                                                    { id: 'github' as ChatTool, icon: Github, label: 'GitHub Context' },
                                                    { id: 'write-code' as ChatTool, icon: Code, label: 'Code Mode' },
                                                ].map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => { setSelectedTool(t.id); setShowTools(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary rounded-xl text-sm transition-colors"
                                                    >
                                                        <t.icon className="w-4 h-4 text-muted-foreground" />
                                                        <span>{t.label}</span>
                                                        {selectedTool === t.id && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
                                                    </button>
                                                ))}
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Textarea */}
                            <textarea
                                ref={inputRef}
                                value={chatInput}
                                onChange={handleInput}
                                onKeyDown={e => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSend();
                                    }
                                }}
                                placeholder="Ask Milo anything..."
                                className="flex-1 bg-transparent border-0 focus:ring-0 py-1.5 text-sm placeholder:text-muted-foreground/40 resize-none min-h-[36px] max-h-32"
                                rows={1}
                            />

                            {/* Send */}
                            <motion.button
                                onClick={onSend}
                                disabled={!chatInput.trim()}
                                whileTap={{ scale: 0.9 }}
                                className={cn(
                                    'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0',
                                    chatInput.trim()
                                        ? 'bg-gradient-to-tr from-violet-600 to-indigo-500 text-white shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40'
                                        : 'text-muted-foreground/30',
                                )}
                            >
                                <Send className="w-3.5 h-3.5" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="text-center mt-2">
                        <span className="text-[10px] text-muted-foreground/40">
                            {selectedModel.name} · {selectedSpeed} · Enter to send
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};
