/**
 * ChatView - Clean, Minimal AI Chat
 * Simplified design - slick, cool, unique
 */
import React, { useRef, useEffect, useState } from 'react';
import { Bot, Send, Settings, ChevronDown, X, Zap, Brain, Sparkles, Volume2, Moon, Sun, Bell, Globe, Github, Code, Image as ImageIcon } from 'lucide-react';
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
    tasks: Task[];
    ideas: Idea[];
}

export const ChatView = ({ messages, chatInput, setChatInput, handleSendMessage, isTyping }: ChatViewProps) => {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const [selectedModel, setSelectedModel] = useState(AI_MODELS[0]);
    const [selectedSpeed, setSelectedSpeed] = useState<ChatSpeed>('balanced');
    const [selectedTool, setSelectedTool] = useState<ChatTool>('none');

    const [showModelPicker, setShowModelPicker] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

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
        <div className="h-full flex flex-col bg-background relative">

            {/* Simple Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-semibold text-sm">Milo</h1>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                            Online
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Model Picker */}
                    <button
                        onClick={() => setShowModelPicker(!showModelPicker)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/50 hover:bg-secondary rounded-lg text-sm transition-colors"
                    >
                        <span>{selectedModel.icon}</span>
                        <span className="hidden sm:inline text-muted-foreground">{selectedModel.name}</span>
                        <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", showModelPicker && "rotate-180")} />
                    </button>

                    {/* Settings */}
                    <button
                        onClick={() => setShowSettings(true)}
                        className="p-2 hover:bg-secondary rounded-lg text-muted-foreground transition-colors"
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
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute right-4 top-16 w-56 bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden"
                        >
                            <div className="p-1.5">
                                {AI_MODELS.map(model => (
                                    <button
                                        key={model.id}
                                        onClick={() => { setSelectedModel(model); setShowModelPicker(false); }}
                                        className={cn(
                                            "w-full flex items-center gap-3 p-2.5 rounded-lg text-left transition-colors",
                                            selectedModel.id === model.id ? "bg-primary/10" : "hover:bg-secondary"
                                        )}
                                    >
                                        <span className="text-xl">{model.icon}</span>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm">{model.name}</div>
                                            <div className="text-xs text-muted-foreground">{model.description}</div>
                                        </div>
                                        {selectedModel.id === model.id && (
                                            <div className="w-2 h-2 bg-primary rounded-full" />
                                        )}
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
                            className="fixed inset-0 bg-black/40 z-50"
                            onClick={() => setShowSettings(false)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed right-0 top-0 bottom-0 w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
                        >
                            <div className="flex items-center justify-between p-4 border-b border-border/50">
                                <h2 className="font-semibold">Settings</h2>
                                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-secondary rounded-lg">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                                {/* Response Speed */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-3 block">Response Mode</label>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'fast', icon: Zap, label: 'Fast', desc: 'Quick responses' },
                                            { id: 'balanced', icon: Sparkles, label: 'Balanced', desc: 'Best for most tasks' },
                                            { id: 'deep', icon: Brain, label: 'Deep', desc: 'Thorough analysis' },
                                        ].map(speed => (
                                            <button
                                                key={speed.id}
                                                onClick={() => setSelectedSpeed(speed.id as ChatSpeed)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                    selectedSpeed === speed.id
                                                        ? "bg-primary/10 border-primary/30"
                                                        : "border-border/50 hover:border-border"
                                                )}
                                            >
                                                <speed.icon className={cn("w-5 h-5", selectedSpeed === speed.id ? "text-primary" : "text-muted-foreground")} />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{speed.label}</div>
                                                    <div className="text-xs text-muted-foreground">{speed.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Tool Selection */}
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground mb-3 block">Tools</label>
                                    <div className="space-y-2">
                                        {[
                                            { id: 'none', icon: X, label: 'None', desc: 'No tools' },
                                            { id: 'search-web', icon: Globe, label: 'Web Search', desc: 'Search the internet' },
                                            { id: 'github', icon: Github, label: 'GitHub', desc: 'Scan repositories' },
                                            { id: 'write-code', icon: Code, label: 'Code Generation', desc: 'Write code' },
                                            { id: 'analyze-images', icon: ImageIcon, label: 'Vision', desc: 'Analyze images' },
                                        ].map(tool => (
                                            <button
                                                key={tool.id}
                                                onClick={() => setSelectedTool(tool.id as ChatTool)}
                                                className={cn(
                                                    "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                                    selectedTool === tool.id
                                                        ? "bg-primary/10 border-primary/30"
                                                        : "border-border/50 hover:border-border"
                                                )}
                                            >
                                                <tool.icon className={cn("w-5 h-5", selectedTool === tool.id ? "text-primary" : "text-muted-foreground")} />
                                                <div className="flex-1">
                                                    <div className="font-medium text-sm">{tool.label}</div>
                                                    <div className="text-xs text-muted-foreground">{tool.desc}</div>
                                                </div>
                                                {selectedTool === tool.id && (
                                                    <div className="w-2 h-2 bg-primary rounded-full" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Toggle Settings */}
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
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto" ref={scrollRef}>
                {showWelcome ? (
                    <div className="h-full flex flex-col items-center justify-center px-6 pb-20">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 mb-6">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                        <h2 className="text-xl font-bold text-center mb-2">Hey there 👋</h2>
                        <p className="text-muted-foreground text-center mb-8 max-w-xs text-sm">
                            I'm Milo. How can I help?
                        </p>

                        <div className="w-full max-w-xs space-y-2">
                            {QUICK_PROMPTS.map((prompt, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setChatInput(prompt)}
                                    className="w-full p-3 bg-secondary/50 hover:bg-secondary border border-border/50 rounded-xl text-left text-sm font-medium transition-all hover:scale-[1.02]"
                                >
                                    {prompt}
                                </button>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
                        {messages.map((msg) => (
                            <ChatMessage key={msg.id} message={msg} />
                        ))}
                        {isTyping && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-start gap-3"
                            >
                                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white shadow-sm flex-shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div className="bg-secondary/50 rounded-2xl rounded-tl-sm px-4 py-3">
                                    <div className="flex gap-1.5">
                                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                        <div className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 bg-background border-t border-border/30">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-end gap-3">
                        <div className="flex-1 bg-secondary/50 border border-border/50 rounded-2xl overflow-hidden focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
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
                                placeholder="Message Milo..."
                                className="w-full bg-transparent border-0 focus:ring-0 px-4 py-3 text-sm placeholder:text-muted-foreground/50 resize-none"
                                rows={1}
                                style={{ minHeight: '48px', maxHeight: '120px' }}
                            />
                        </div>

                        <button
                            onClick={onSend}
                            disabled={!chatInput.trim()}
                            className={cn(
                                "p-3 rounded-xl transition-all flex-shrink-0",
                                chatInput.trim()
                                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl"
                                    : "bg-secondary text-muted-foreground"
                            )}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
