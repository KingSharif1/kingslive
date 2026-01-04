/**
 * ChatView - Clean, Minimal AI Chat
 * Simplified design - slick, cool, unique
 */
import React, { useRef, useEffect, useState } from 'react';
import { Bot, Send, Settings, ChevronDown, X, Zap, Brain, Sparkles, Volume2, Moon, Sun, Bell, Globe, Github, Code, Image as ImageIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message, AIModel, ChatTool, ChatSpeed, ChatContext, Task, Idea } from '../../types/index';
import { ChatMessage } from '../chat/ChatMessage';
import { cn } from '@/lib/utils';

const AI_MODELS: AIModel[] = [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', description: 'Fast', contextTokens: '128K', icon: '⚡' },
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', description: 'Smart', contextTokens: '128K', icon: '🧠' },
    { id: 'gemini-flash', name: 'Gemini Flash', provider: 'Google', description: 'Multimodal', contextTokens: '1M', icon: '✨' },
    { id: 'claude-sonnet', name: 'Claude Sonnet', provider: 'Anthropic', description: 'Writing', contextTokens: '200K', icon: '🎭' },
];

const QUICK_PROMPTS = [
    "What's on my schedule?",
    "Help me brainstorm",
    "Draft an email",
];

interface ChatViewProps {
    messages: Message[];
    chatInput: string;
    setChatInput: (val: string) => void;
    handleSendMessage: (model: string, tool: ChatTool, speed: ChatSpeed, context: ChatContext[]) => void;
    isTyping: boolean;
    isTyping: boolean;
    tasks: Task[];
    ideas: Idea[];
    apiKeys: { google?: string; github?: string; openai?: string; };
}

export const ChatView = ({ messages, chatInput, setChatInput, handleSendMessage, isTyping, apiKeys }: ChatViewProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[2]); // Default to Gemini
    const [selectedSpeed, setSelectedSpeed] = useState<ChatSpeed>('balanced');
    const [selectedTool, setSelectedTool] = useState<ChatTool>('none');

    const [showModelPicker, setShowModelPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [showTools, setShowTools] = useState(false);

    // Settings state
    const [settings, setSettings] = useState({
        soundEnabled: true,
        darkMode: true,
        notifications: true,
        streamResponses: true,
    });

    useEffect(() => {
        if (scrollRef.current) {
            setTimeout(() => {
                scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
            }, 100);
        }
    }, [messages, isTyping]);

    const onSend = () => {
        if (!chatInput.trim()) return;
        handleSendMessage(selectedModel.id, selectedTool, selectedSpeed, []);
        inputRef.current?.focus();
    };

    const showWelcome = messages.length <= 1;

    return (
        <div className="h-full flex flex-col bg-background relative font-sans">

            {/* Top Bar - Minimal */}
            <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-6 py-4">
                <div
                    onClick={() => setShowModelPicker(!showModelPicker)}
                    className="flex items-center gap-2 cursor-pointer opacity-70 hover:opacity-100 transition-opacity bg-background/50 backdrop-blur-md px-3 py-1.5 rounded-full"
                >
                    <span className="text-lg">{selectedModel.icon}</span>
                    <span className="font-medium text-sm text-foreground/80">{selectedModel.name}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-secondary/50 rounded-full text-muted-foreground transition-colors backdrop-blur-md"
                    >
                        <Settings className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Model Picker Dropdown */}
            <AnimatePresence>
                {showModelPicker && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowModelPicker(false)} />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -20 }}
                            className="absolute top-16 left-6 w-64 bg-popover/90 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-2 space-y-1">
                                {AI_MODELS.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => { setSelectedModel(model); setShowModelPicker(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all",
                                            selectedModel.id === model.id ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                                        )}
                                    >
                                        <span className="text-xl">{model.icon}</span>
                                        <div>
                                            <div className="font-medium text-sm">{model.name}</div>
                                            <div className="text-[10px] opacity-70">{model.description}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Settings Panel */}
            <AnimatePresence>
                {showSettings && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50"
                            onClick={() => setShowSettings(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-background border-l border-border shadow-2xl z-50 flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-border/50">
                                <h2 className="font-semibold text-lg">Chat Settings</h2>
                                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-secondary rounded-full">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                                {/* Response Speed */}
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Thinking Mode</label>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'fast', icon: Zap, label: 'Fast', desc: 'Quick responses' },
                                            { id: 'balanced', icon: Sparkles, label: 'Balanced', desc: 'Standard reasoning' },
                                            { id: 'deep', icon: Brain, label: 'Deep', desc: 'Complex problem solving' },
                                        ].map(speed => (
                                            <button
                                                key={speed.id}
                                                onClick={() => setSelectedSpeed(speed.id as ChatSpeed)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                    selectedSpeed === speed.id
                                                        ? "bg-primary/5 border-primary/40 text-primary"
                                                        : "border-border/50 text-muted-foreground hover:bg-secondary/50"
                                                )}
                                            >
                                                <speed.icon className="w-5 h-5" />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{speed.label}</div>
                                                </div>
                                                {selectedSpeed === speed.id && <div className="w-2 h-2 bg-primary rounded-full" />}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Connections Status */}
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Connections</label>
                                    <div className="space-y-3">
                                        {[
                                            {
                                                id: 'internet',
                                                icon: Globe,
                                                label: 'Internet Access',
                                                connected: !!(apiKeys?.google || process.env.NEXT_PUBLIC_GOOGLE_API_KEY)
                                            },
                                            {
                                                id: 'github',
                                                icon: Github,
                                                label: 'GitHub Integration',
                                                connected: !!(apiKeys?.github || process.env.NEXT_PUBLIC_GITHUB_TOKEN)
                                            }
                                        ].map(conn => (
                                            <div key={conn.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded-full flex items-center justify-center",
                                                        conn.connected ? "bg-emerald-500/10 text-emerald-500" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        <conn.icon className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{conn.label}</div>
                                                        <div className={cn(
                                                            "text-[10px] font-medium",
                                                            conn.connected ? "text-emerald-500" : "text-muted-foreground"
                                                        )}>
                                                            {conn.connected ? 'Connected' : 'Not Connected'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    conn.connected ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-zinc-400"
                                                )} />
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Preferences Toggles */}
                                <div>
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 block">Preferences</label>
                                    <div className="space-y-3">
                                        {[
                                            { key: 'soundEnabled', icon: Volume2, label: 'Sound Effects' },
                                            { key: 'darkMode', icon: Moon, label: 'Dark Mode' },
                                            { key: 'notifications', icon: Bell, label: 'Notifications' },
                                            { key: 'streamResponses', icon: Sparkles, label: 'Stream Responses' },
                                        ].map(item => (
                                            <div key={item.key} className="flex items-center justify-between p-3 bg-secondary/30 rounded-xl">
                                                <div className="flex items-center gap-3">
                                                    <item.icon className="w-4 h-4 text-muted-foreground" />
                                                    <span className="text-sm font-medium">{item.label}</span>
                                                </div>
                                                <button
                                                    onClick={() => setSettings(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof settings] }))}
                                                    className={cn(
                                                        "w-10 h-6 rounded-full transition-colors relative",
                                                        settings[item.key as keyof typeof settings] ? "bg-primary" : "bg-muted"
                                                    )}
                                                >
                                                    <div className={cn(
                                                        "absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform",
                                                        settings[item.key as keyof typeof settings] ? "left-5" : "left-1"
                                                    )} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto pt-20" ref={scrollRef}>
                {showWelcome ? (
                    <div className="h-full flex flex-col items-center justify-center -mt-20 px-4">
                        <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-4 text-center">
                                Hello, King.
                            </h1>
                            <p className="text-xl md:text-2xl text-muted-foreground font-light text-center">
                                How can I help you today?
                            </p>
                        </div>

                        <div className="w-full max-w-2xl grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                            {QUICK_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setChatInput(prompt)}
                                    className="p-4 bg-secondary/30 hover:bg-secondary/60 border border-border/30 rounded-2xl text-left transition-all hover:-translate-y-1 hover:shadow-lg"
                                >
                                    <p className="font-medium text-sm">{prompt}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="px-4 pb-32 max-w-4xl mx-auto space-y-6">
                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))}
                        {isTyping && (
                            <div className="flex items-start gap-4 animate-in fade-in duration-300">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shrink-0 animate-pulse">
                                    <Sparkles className="w-4 h-4 text-white" />
                                </div>
                                <div className="text-sm text-muted-foreground py-2 flex items-center gap-1">
                                    Thinking <span className="animate-pulse">...</span>
                                </div>
                            </div>
                        )}
                        <div className="h-4" /> {/* Spacer */}
                    </div>
                )}
            </div>

            {/* Input Floating Island */}
            <div className="absolute bottom-6 left-0 right-0 px-4 flex justify-center z-20">
                <div className="w-full max-w-3xl bg-secondary/80 backdrop-blur-xl border border-white/10 shadow-2xl rounded-3xl p-2 transition-all duration-300 ring-1 ring-black/5 dark:ring-white/10">
                    <div className="flex flex-col gap-2">
                        {/* Selected Tool / Context Indicator */}
                        {selectedTool !== 'none' && (
                            <div className="px-4 pt-2 flex items-center gap-2 text-xs text-primary font-medium">
                                <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-full">
                                    {AI_MODELS.find(m => m.id === selectedModel.id)?.icon} Using {selectedTool}
                                    <button onClick={() => setSelectedTool('none')} className="hover:bg-primary/20 rounded-full p-0.5 ml-1"><X className="w-3 h-3" /></button>
                                </div>
                            </div>
                        )}

                        <div className="flex items-end gap-2 px-2 pb-1">
                            {/* Tools / Plus Button */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowTools(!showTools)}
                                    className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200",
                                        showTools ? "bg-primary text-primary-foreground rotate-45" : "bg-secondary-foreground/5 hover:bg-secondary-foreground/10 text-muted-foreground"
                                    )}
                                >
                                    <Plus className="w-5 h-5" />
                                </button>

                                <AnimatePresence>
                                    {showTools && (
                                        <>
                                            <div className="fixed inset-0 z-0" onClick={() => setShowTools(false)} />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                                className="absolute bottom-14 left-0 w-48 bg-popover/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl z-10 overflow-hidden"
                                            >
                                                <div className="p-1.5 space-y-0.5">
                                                    {[
                                                        { id: 'search-web', icon: Globe, label: 'Search' },
                                                        { id: 'github', icon: Github, label: 'GitHub' },
                                                        { id: 'analyze-images', icon: ImageIcon, label: 'Upload Image' },
                                                        { id: 'write-code', icon: Code, label: 'Code Mode' },
                                                    ].map(tool => (
                                                        <button
                                                            key={tool.id}
                                                            onClick={() => { setSelectedTool(tool.id as ChatTool); setShowTools(false); }}
                                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary rounded-xl text-sm transition-colors text-left"
                                                        >
                                                            <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground">{tool.icon && <tool.icon className="w-4 h-4" />}</div>
                                                            <span>{tool.label}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Text Input */}
                            <textarea
                                ref={inputRef}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        onSend();
                                    }
                                }}
                                placeholder="Ask Milo anything..."
                                className="flex-1 bg-transparent border-0 focus:ring-0 p-2.5 text-base placeholder:text-muted-foreground/50 resize-none max-h-32 min-h-[44px]"
                                rows={1}
                            />

                            {/* Send Button */}
                            <button
                                onClick={onSend}
                                disabled={!chatInput.trim()}
                                className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 mb-0.5",
                                    chatInput.trim()
                                        ? "bg-primary text-primary-foreground shadow-lg hover:scale-105"
                                        : "text-muted-foreground/30"
                                )}
                            >
                                <Send className="w-5 h-5 ml-0.5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Background Gradient Effect */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background/80" />
            </div>

        </div>
    );
};
