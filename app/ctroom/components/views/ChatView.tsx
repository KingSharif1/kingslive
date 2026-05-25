'use client';

/**
 * Milo — King's personal AI command interface
 * Jarvis-like, context-aware, elite UI
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
    Send, Settings, ChevronDown, X, Zap, Brain, Sparkles, Globe,
    Github, Code, Check, RefreshCw, Clock, ChevronRight, DollarSign, TrendingDown, Mic,
    Volume2, VolumeX, Copy,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, AIModel, ChatTool, ChatSpeed, ChatContext, ActionItem, Mission } from '../../types/index';
import { cn } from '@/lib/utils';
import { format, isToday, startOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';

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

interface VaultSummary {
    monthlySpend: number;
    topCategory: string;
    accountCount: number;
}

function buildQuickPrompts(actionItems: ActionItem[], missions: Mission[], vault?: VaultSummary | null): string[] {
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

    if (vault && vault.monthlySpend > 0) {
        prompts.push(`I've spent $${vault.monthlySpend.toFixed(0)} this month — any tips to cut spending?`);
    }

    // Fallbacks
    const defaults = [
        'Help me plan a productive week',
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
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] text-white/50"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <Icon className="w-3 h-3" />
            <span className="font-bold">{count}</span>
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
                className="flex items-center gap-1.5 font-mono text-[10px] text-white/30 hover:text-white/60 transition-colors"
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
                        className="overflow-hidden mt-2 ml-1 pl-3 space-y-1.5"
                        style={{ borderLeft: '2px solid rgba(255,255,255,0.08)' }}
                    >
                        {steps.map((step, i) => (
                            <div key={i} className="flex items-start gap-2">
                                <div className={cn(
                                    'w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5',
                                    step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-500' :
                                    step.status === 'failed' ? 'bg-red-500/20 text-red-500' :
                                    'bg-white/5 text-white/30'
                                )}>
                                    {step.status === 'completed' ? <Check className="w-2.5 h-2.5" /> : <Clock className="w-2.5 h-2.5" />}
                                </div>
                                <div>
                                    <div className="font-mono text-xs text-white/70">{step.title}</div>
                                    <div className="font-mono text-[10px] text-white/30">{step.description}</div>
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
    const recognitionRef = useRef<any>(null);

    const [isListening, setIsListening] = useState(false);
    const [hasSpeechAPI] = useState(() => typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window));
    const [speakingId, setSpeakingId] = useState<string | null>(null);
    const [copiedId, setCopiedId]     = useState<string | null>(null);

    const speakMessage = (id: string, text: string) => {
        if (!window.speechSynthesis) return;
        if (speakingId === id) {
            window.speechSynthesis.cancel();
            setSpeakingId(null);
            return;
        }
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        utt.rate = 1.05; utt.pitch = 1.0;
        // prefer a deeper voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferred = voices.find(v => v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('google uk') || v.name.toLowerCase().includes('alex'));
        if (preferred) utt.voice = preferred;
        utt.onend = () => setSpeakingId(null);
        utt.onerror = () => setSpeakingId(null);
        setSpeakingId(id);
        window.speechSynthesis.speak(utt);
    };

    const copyMessage = (id: string, text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopiedId(id);
            setTimeout(() => setCopiedId(null), 2000);
        });
    };

    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
    const [selectedSpeed, setSelectedSpeed] = useState<ChatSpeed>('balanced');
    const [selectedTool, setSelectedTool] = useState<ChatTool>('none');
    const [showModelPicker, setShowModelPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTools, setShowTools] = useState(false);

    const [vaultSummary, setVaultSummary] = useState<VaultSummary | null>(null);

    // Fetch vault summary on mount
    useEffect(() => {
        async function fetchVault() {
            try {
                const since = format(startOfMonth(new Date()), 'yyyy-MM-dd');
                const { data } = await supabase
                    .from('vault_transactions')
                    .select('amount, category, type')
                    .eq('type', 'expense')
                    .gte('date', since);
                const { data: accounts } = await supabase
                    .from('vault_accounts')
                    .select('id');
                if (data && data.length > 0) {
                    const total = data.reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
                    const cats: Record<string, number> = {};
                    data.forEach((t: any) => { cats[t.category] = (cats[t.category] || 0) + Math.abs(Number(t.amount)); });
                    const topCat = Object.entries(cats).sort((a, b) => b[1] - a[1])[0];
                    setVaultSummary({
                        monthlySpend: total,
                        topCategory: topCat?.[0] || 'Other',
                        accountCount: accounts?.length || 0,
                    });
                }
            } catch { /* vault not connected */ }
        }
        fetchVault();
    }, []);

    const todayTasks = actionItems.filter(t => t.status !== 'done' && t.status !== 'archived' && isToday(new Date(t.date)));
    const activeMissions = missions.filter(m => m.status === 'active');
    const quickPrompts = buildQuickPrompts(actionItems, missions, vaultSummary);

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

    const toggleVoice = useCallback(() => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }
        const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        const recognition = new SR();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (e: any) => {
            const transcript = Array.from(e.results as any[])
                .map((r: any) => r[0].transcript)
                .join('');
            setChatInput(transcript);
        };
        recognitionRef.current = recognition;
        recognition.start();
    }, [isListening, setChatInput]);

    const onSend = () => {
        if (!chatInput.trim()) return;
        handleSendMessage(selectedModel.id, selectedTool, selectedSpeed, []);
        inputRef.current?.focus();
        if (inputRef.current) inputRef.current.style.height = 'auto';
    };

    const isWelcome = messages.length <= 1;
    const providerGradient = PROVIDER_COLORS[selectedModel.provider] || 'from-violet-500 to-indigo-400';

    return (
        <div className="h-full flex flex-row overflow-hidden" style={{ background: '#080808', color: '#e5e5e5' }}>

        {/* ── Chat Column ── */}
        <div className="flex-1 min-w-0 flex flex-col relative overflow-hidden">

            {/* ── Header ── */}
            <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-5 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(8,8,8,0.9)', backdropFilter: 'blur(20px)' }}>
                {/* Model picker */}
                <button
                    onClick={() => setShowModelPicker(v => !v)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                >
                    <span className={cn(
                        'w-5 h-5 rounded-md bg-gradient-to-tr flex items-center justify-center text-[10px] font-bold text-white shrink-0',
                        providerGradient,
                    )}>{selectedModel.icon}</span>
                    <span className="font-mono text-xs text-white/70">{selectedModel.name}</span>
                    <ChevronDown className="w-3 h-3 text-white/30" />
                </button>

                {/* Milo wordmark */}
                <div className="flex items-center gap-2">
                    <MiloOrb size="sm" />
                    <span className="font-mono text-sm font-bold tracking-widest uppercase" style={{ color: '#00ff88' }}>MILO</span>
                </div>

                {/* Settings */}
                <button
                    onClick={() => setShowSettings(true)}
                    className="p-2 rounded-lg transition-colors text-white/30 hover:text-white hover:bg-white/5"
                >
                    <Settings className="w-4 h-4" />
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
                            className="absolute top-[60px] left-5 w-72 backdrop-blur-xl rounded-2xl shadow-2xl z-50 p-2"
                            style={{ background: 'rgba(10,10,10,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {AI_MODELS.map(model => (
                                <button
                                    key={model.id}
                                    onClick={() => { setSelectedModel(model); setShowModelPicker(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all"
                                    style={selectedModel.id === model.id ? { background: 'rgba(0,255,136,0.08)' } : {}}
                                    onMouseEnter={e => { if (selectedModel.id !== model.id) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
                                    onMouseLeave={e => { if (selectedModel.id !== model.id) (e.currentTarget as HTMLElement).style.background = ''; }}
                                >
                                    <span className={cn(
                                        'w-8 h-8 rounded-lg bg-gradient-to-tr flex items-center justify-center text-sm font-bold text-white shrink-0',
                                        PROVIDER_COLORS[model.provider] || 'from-gray-500 to-gray-400',
                                    )}>{model.icon}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-mono text-xs text-white/80">{model.name}</div>
                                        <div className="font-mono text-[10px] text-white/30">{model.provider} · {model.description}</div>
                                    </div>
                                    {selectedModel.id === model.id && <Check className="w-4 h-4 shrink-0" style={{ color: '#00ff88' }} />}
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
                            className="fixed right-0 top-0 bottom-0 w-80 shadow-2xl z-50 flex flex-col"
                            style={{ background: '#0a0a0a', borderLeft: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <div className="flex items-center justify-between p-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                                <div className="flex items-center gap-2.5">
                                    <MiloOrb size="sm" />
                                    <span className="font-mono text-sm font-bold text-white uppercase tracking-wider">Milo Settings</span>
                                </div>
                                <button onClick={() => setShowSettings(false)} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/5 transition-colors">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-5 space-y-7 hq-scroll">
                                {/* Thinking mode */}
                                <div>
                                    <label className="font-mono text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3 block">Thinking Mode</label>
                                    <div className="space-y-1.5">
                                        {[
                                            { id: 'fast' as ChatSpeed, icon: Zap, label: 'Fast', desc: 'Quick, direct responses' },
                                            { id: 'balanced' as ChatSpeed, icon: Sparkles, label: 'Balanced', desc: 'Standard reasoning' },
                                            { id: 'deep-think' as ChatSpeed, icon: Brain, label: 'Deep Think', desc: 'Complex problem solving' },
                                        ].map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedSpeed(s.id)}
                                                className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left"
                                                style={selectedSpeed === s.id ? {
                                                    background: 'rgba(0,255,136,0.08)',
                                                    border: '1px solid rgba(0,255,136,0.2)',
                                                    color: '#00ff88',
                                                } : {
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    color: 'rgba(255,255,255,0.4)',
                                                }}
                                            >
                                                <s.icon className="w-4 h-4 shrink-0" />
                                                <div className="flex-1">
                                                    <div className="font-mono text-xs font-bold">{s.label}</div>
                                                    <div className="font-mono text-[10px] opacity-60">{s.desc}</div>
                                                </div>
                                                {selectedSpeed === s.id && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00ff88' }} />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Connections */}
                                <div>
                                    <label className="font-mono text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3 block">Connected Services</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'GitHub', connected: !!(apiKeys?.github || process.env.NEXT_PUBLIC_GITHUB_TOKEN), icon: Github, color: 'bg-zinc-800 text-white' },
                                            { label: 'Web Search', connected: !!(apiKeys?.google), icon: Globe, color: 'bg-blue-500 text-white' },
                                            { label: 'OpenAI', connected: !!(apiKeys?.openai), icon: Zap, color: 'bg-emerald-500 text-white' },
                                        ].map(conn => (
                                            <div key={conn.label} className="flex items-center justify-between px-3 py-2.5 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', conn.color)}>
                                                        <conn.icon className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="font-mono text-xs text-white/70">{conn.label}</span>
                                                </div>
                                                <div className="w-2 h-2 rounded-full" style={{
                                                    background: conn.connected ? '#00ff88' : 'rgba(255,255,255,0.15)',
                                                    boxShadow: conn.connected ? '0 0 6px rgba(0,255,136,0.6)' : undefined,
                                                }} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Context */}
                                <div>
                                    <label className="font-mono text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3 block">Milo Knows About</label>
                                    <div className="space-y-2">
                                        {[
                                            { label: 'Active tasks',    value: actionItems.filter(t => t.status !== 'done' && t.status !== 'archived').length, color: '#00ff88' },
                                            { label: 'Active projects', value: activeMissions.length, color: '#3b82f6' },
                                            { label: 'Due today',       value: todayTasks.length, color: '#f97316' },
                                            ...(vaultSummary ? [
                                                { label: 'Monthly spend', value: `$${Math.round(vaultSummary.monthlySpend).toLocaleString()}`, color: '#f43f5e' },
                                                { label: 'Top category', value: vaultSummary.topCategory, color: '#8b5cf6' },
                                            ] : []),
                                        ].map(({ label, value, color }) => (
                                            <div key={label} className="flex items-center justify-between px-3 py-2 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                                                <span className="font-mono text-xs text-white/40">{label}</span>
                                                <span className="font-mono text-xs font-bold" style={{ color }}>{value}</span>
                                            </div>
                                        ))}
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
                                <h1 className="font-mono text-3xl font-bold mb-1" style={{ color: '#e5e5e5' }}>
                                    {getGreeting()}, King.
                                </h1>
                                <p style={{ color: 'rgba(255,255,255,0.4)' }}>
                                    {todayTasks.length > 0
                                        ? `You have ${todayTasks.length} task${todayTasks.length > 1 ? 's' : ''} due today.`
                                        : activeMissions.length > 0
                                            ? `${activeMissions.length} active project${activeMissions.length > 1 ? 's' : ''} in motion.`
                                            : "What's on your mind?"}
                                </p>
                            </div>
                        </motion.div>

                        {/* Context pills */}
                        {(todayTasks.length > 0 || activeMissions.length > 0 || vaultSummary) && (
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
                                {vaultSummary && vaultSummary.monthlySpend > 0 && (
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] text-white/50"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                        <DollarSign className="w-3 h-3" />
                                        <span className="font-bold">${Math.round(vaultSummary.monthlySpend).toLocaleString()}</span>
                                        <span>this month</span>
                                    </div>
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
                                    className="px-4 py-3 rounded-xl text-left text-sm transition-all hover:-translate-y-0.5 text-white/60 hover:text-white/90"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
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
                                        <div className="max-w-[75%] px-4 py-3 rounded-2xl rounded-tr-sm text-sm text-white"
                                            style={{ background: 'rgba(0,255,136,0.12)', border: '1px solid rgba(0,255,136,0.2)' }}>
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
                                            <div className="rounded-2xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
                                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.85)' }}>
                                                <p className="whitespace-pre-wrap">{msg.content}</p>
                                            </div>
                                            {msg.sources && msg.sources.length > 0 && (
                                                <div className="flex gap-2 mt-2 flex-wrap">
                                                    {msg.sources.map((src, i) => (
                                                        <a key={i} href={src.url} target="_blank" rel="noopener noreferrer"
                                                            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 font-mono text-[10px] text-white/40 hover:text-white transition-colors"
                                                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                                                        >
                                                            <Globe className="w-3 h-3" />
                                                            {src.title}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                            <div className="mt-1.5 flex items-center gap-3 font-mono text-[10px] text-white/20">
                                                <Clock className="w-3 h-3" />
                                                <span>{format(msg.timestamp, 'h:mm a')}</span>
                                                {msg.model && <span>· {msg.model}</span>}
                                                <div className="flex-1" />
                                                <button onClick={() => copyMessage(msg.id, msg.content)}
                                                    title="Copy" className="hover:text-white/60 transition-colors">
                                                    {copiedId === msg.id ? <Check className="w-3 h-3 text-[#00ff88]" /> : <Copy className="w-3 h-3" />}
                                                </button>
                                                {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                                                    <button onClick={() => speakMessage(msg.id, msg.content)}
                                                        title={speakingId === msg.id ? 'Stop' : 'Read aloud'}
                                                        className="hover:text-white/60 transition-colors">
                                                        {speakingId === msg.id
                                                            ? <VolumeX className="w-3 h-3 text-[#00ff88]" />
                                                            : <Volume2 className="w-3 h-3" />}
                                                    </button>
                                                )}
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
                                            className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: 'rgba(0,255,136,0.4)' }}
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
            <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-2 z-10" style={{ background: 'linear-gradient(to top, #080808 60%, transparent)' }}>
                <div className="max-w-3xl mx-auto">
                    <div className="backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                        {/* Active tool chip */}
                        <AnimatePresence>
                            {selectedTool !== 'none' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="px-4 pt-2.5 flex items-center gap-2"
                                >
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-medium" style={{ background: 'rgba(0,255,136,0.1)', color: '#00ff88' }}>
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
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0"
                                    style={showTools
                                        ? { background: '#00ff88', color: '#000' }
                                        : { color: 'rgba(255,255,255,0.35)' }}
                                    onMouseEnter={e => !showTools && ((e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)')}
                                    onMouseLeave={e => !showTools && ((e.currentTarget as HTMLElement).style.background = 'transparent')}
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
                                                className="absolute bottom-11 left-0 w-52 backdrop-blur-xl rounded-2xl shadow-2xl z-10 p-1.5"
                                                style={{ background: 'rgba(10,10,10,0.97)', border: '1px solid rgba(255,255,255,0.1)' }}
                                            >
                                                {[
                                                    { id: 'search-web' as ChatTool, icon: Globe, label: 'Web Search' },
                                                    { id: 'github' as ChatTool, icon: Github, label: 'GitHub Context' },
                                                    { id: 'write-code' as ChatTool, icon: Code, label: 'Code Mode' },
                                                ].map(t => (
                                                    <button
                                                        key={t.id}
                                                        onClick={() => { setSelectedTool(t.id); setShowTools(false); }}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors"
                                        onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
                                        onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
                                                    >
                                                        <t.icon className="w-4 h-4 text-white/40" />
                                                        <span className="text-white/70">{t.label}</span>
                                                        {selectedTool === t.id && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: '#00ff88' }} />}
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
                                className="flex-1 bg-transparent border-0 focus:ring-0 py-1.5 text-sm resize-none min-h-[36px] max-h-32 text-white/85 outline-none"
                                style={{ caretColor: '#00ff88' }}
                                rows={1}
                            />

                            {/* Mic */}
                            {hasSpeechAPI && (
                                <motion.button
                                    onClick={toggleVoice}
                                    whileTap={{ scale: 0.9 }}
                                    className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 relative"
                                    style={isListening ? {
                                        background: 'rgba(239,68,68,0.15)',
                                        color: '#ef4444',
                                        boxShadow: '0 0 12px rgba(239,68,68,0.3)',
                                    } : { color: 'rgba(255,255,255,0.3)' }}
                                    title={isListening ? 'Stop listening' : 'Speak to Milo'}
                                >
                                    {isListening && (
                                        <span className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(239,68,68,0.25)' }} />
                                    )}
                                    <Mic className="w-3.5 h-3.5 relative" />
                                </motion.button>
                            )}

                            {/* Send */}
                            <motion.button
                                onClick={onSend}
                                disabled={!chatInput.trim()}
                                whileTap={{ scale: 0.9 }}
                                className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shrink-0"
                                style={chatInput.trim() ? {
                                    background: '#00ff88',
                                    color: '#000',
                                    boxShadow: '0 0 16px rgba(0,255,136,0.3)',
                                } : { color: 'rgba(255,255,255,0.2)' }}
                            >
                                <Send className="w-3.5 h-3.5" />
                            </motion.button>
                        </div>
                    </div>

                    <div className="text-center mt-2">
                        <span className="font-mono text-[10px] text-white/20">
                            {selectedModel.name} · {selectedSpeed} · Enter to send
                        </span>
                    </div>
                </div>
            </div>
        </div>{/* end chat column */}

        {/* ── Right Context Panel ── */}
        <div className="w-[340px] shrink-0 flex flex-col overflow-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.01)' }}>

            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <span className="font-mono text-[10px] font-bold uppercase tracking-[0.2em] text-white/25">Active Context</span>
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#00ff88', boxShadow: '0 0 6px rgba(0,255,136,0.7)' }} />
                    <span className="font-mono text-[9px] text-white/20 uppercase tracking-widest">Live</span>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 hq-scroll">

                {/* ── Milo knows ── */}
                <div className="space-y-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/20 px-1">Milo Knows</p>

                    {/* Projects */}
                    <div className="rounded-xl p-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.2)' }}>
                                    <Code className="w-3 h-3" style={{ color: '#3b82f6' }} />
                                </div>
                                <span className="font-mono text-xs text-white/60">Projects</span>
                            </div>
                            <span className="font-mono text-xs font-bold" style={{ color: '#3b82f6' }}>{activeMissions.length} active</span>
                        </div>
                        {activeMissions.slice(0, 3).map(m => (
                            <div key={m.id} className="flex items-center gap-2 pl-1">
                                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: 'rgba(59,130,246,0.5)' }} />
                                <span className="font-mono text-[10px] text-white/35 truncate">{m.name}</span>
                                <span className="font-mono text-[10px] text-white/20 ml-auto shrink-0">{m.progress}%</span>
                            </div>
                        ))}
                        {activeMissions.length === 0 && (
                            <p className="font-mono text-[10px] text-white/20 pl-1">No active projects</p>
                        )}
                    </div>

                    {/* Tasks Today */}
                    <div className="rounded-xl p-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.2)' }}>
                                    <Check className="w-3 h-3" style={{ color: '#f97316' }} />
                                </div>
                                <span className="font-mono text-xs text-white/60">Planner</span>
                            </div>
                            <span className="font-mono text-xs font-bold" style={{ color: '#f97316' }}>{todayTasks.length} today</span>
                        </div>
                        {todayTasks.slice(0, 3).map(t => (
                            <div key={t.id} className="flex items-center gap-2 pl-1">
                                <div className="w-1 h-1 rounded-full shrink-0" style={{ background: 'rgba(249,115,22,0.5)' }} />
                                <span className="font-mono text-[10px] text-white/35 truncate">{t.title}</span>
                                {t.priority === 'critical' && (
                                    <span className="font-mono text-[9px] text-red-400 shrink-0 ml-auto">!</span>
                                )}
                            </div>
                        ))}
                        {todayTasks.length === 0 && (
                            <p className="font-mono text-[10px] text-white/20 pl-1">Nothing due today</p>
                        )}
                    </div>

                    {/* Vault */}
                    {vaultSummary && vaultSummary.monthlySpend > 0 ? (
                        <div className="rounded-xl p-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.2)' }}>
                                        <DollarSign className="w-3 h-3" style={{ color: '#f43f5e' }} />
                                    </div>
                                    <span className="font-mono text-xs text-white/60">Vault</span>
                                </div>
                                <span className="font-mono text-xs font-bold" style={{ color: '#f43f5e' }}>${Math.round(vaultSummary.monthlySpend).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-1">
                                <TrendingDown className="w-3 h-3 shrink-0 text-white/20" />
                                <span className="font-mono text-[10px] text-white/35">Top: {vaultSummary.topCategory}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="rounded-xl p-3.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.06)' }}>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-3 h-3 text-white/15" />
                                <span className="font-mono text-[10px] text-white/20">Vault not connected</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Connected Services ── */}
                <div className="space-y-2 pt-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/20 px-1">Integrations</p>
                    {[
                        { label: 'GitHub',      icon: Github, connected: !!(apiKeys?.github), color: '#ffffff', bg: 'rgba(255,255,255,0.08)', desc: 'repos & commits' },
                        { label: 'Web Search',  icon: Globe,  connected: !!(apiKeys?.google), color: '#4285f4', bg: 'rgba(66,133,244,0.12)', desc: 'live search' },
                        { label: 'OpenAI',      icon: Sparkles, connected: !!(apiKeys?.openai), color: '#10a37f', bg: 'rgba(16,163,127,0.12)', desc: 'gpt-4o models' },
                    ].map(svc => (
                        <div key={svc.label} className="flex items-center gap-3 rounded-xl px-3.5 py-2.5" style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: svc.bg }}>
                                <svc.icon className="w-3.5 h-3.5" style={{ color: svc.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-mono text-xs text-white/60">{svc.label}</div>
                                <div className="font-mono text-[9px] text-white/25">{svc.desc}</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{
                                    background: svc.connected ? '#00ff88' : 'rgba(255,255,255,0.12)',
                                    boxShadow: svc.connected ? '0 0 5px rgba(0,255,136,0.5)' : undefined,
                                }} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* ── Session Info ── */}
                <div className="pt-2 space-y-2">
                    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/20 px-1">Session</p>
                    <div className="rounded-xl p-3.5 space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        {[
                            { label: 'Model',    value: selectedModel.name },
                            { label: 'Provider', value: selectedModel.provider },
                            { label: 'Context',  value: selectedModel.contextTokens },
                            { label: 'Messages', value: String(messages.length) },
                        ].map(row => (
                            <div key={row.label} className="flex items-center justify-between">
                                <span className="font-mono text-[10px] text-white/25">{row.label}</span>
                                <span className="font-mono text-[10px] text-white/50">{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>{/* end right panel */}

        </div>
    );
};
