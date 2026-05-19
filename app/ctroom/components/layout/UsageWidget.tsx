'use client';

import React from 'react';
import { Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UsageStats } from '../../types/index';

interface UsageWidgetProps {
    usage: UsageStats;
    onClick?: () => void;
    apiKeys: {
        openai?: string;
        anthropic?: string;
        google?: string;
        github?: string;
        groq?: string;
        [key: string]: string | undefined;
    };
}

const CONNECTIONS = [
    { id: 'google',    label: 'Gemini',    envKey: 'NEXT_PUBLIC_GOOGLE_API_KEY'   },
    { id: 'openai',    label: 'OpenAI',    envKey: 'NEXT_PUBLIC_OPENAI_API_KEY'   },
    { id: 'anthropic', label: 'Anthropic', envKey: 'NEXT_PUBLIC_ANTHROPIC_API_KEY'},
    { id: 'github',    label: 'GitHub',    envKey: 'NEXT_PUBLIC_GITHUB_TOKEN'     },
];

export const UsageWidget = ({ usage, onClick, apiKeys }: UsageWidgetProps) => {
    const [expanded, setExpanded] = React.useState(false);
    const totalUsed  = usage.total.used;
    const totalLimit = usage.total.limit || 800;
    const pct = Math.min(100, totalLimit > 0 ? (totalUsed / totalLimit) * 100 : 0);

    const getBarColor = (p: number) => {
        if (p >= 90) return 'from-red-500 to-orange-500';
        if (p >= 70) return 'from-yellow-500 to-orange-500';
        return 'from-indigo-500 to-purple-500';
    };

    // Provider-specific usage
    const providers = [
        { id: 'google', label: 'Gemini', used: usage.google?.used || 0, limit: usage.google?.limit || 0 },
        { id: 'openai', label: 'OpenAI', used: usage.openai?.used || 0, limit: usage.openai?.limit || 0 },
        { id: 'anthropic', label: 'Anthropic', used: usage.anthropic?.used || 0, limit: usage.anthropic?.limit || 0 },
    ].filter(p => p.used > 0 || apiKeys?.[p.id]);

    return (
        <button
            onClick={onClick}
            className="w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-2xl border border-indigo-500/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all cursor-pointer text-left"
        >
            {/* shimmer on hover */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-500" />
                        <span className="font-mono text-[10px] font-semibold text-indigo-700 dark:text-indigo-300 uppercase tracking-widest">Usage & Connections</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Token usage bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1.5">
                        <span className="font-medium">Monthly Requests</span>
                        <span className="font-mono">{totalUsed} / {totalLimit}</span>
                    </div>
                    <div className="w-full bg-background/50 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getBarColor(pct)} rounded-full transition-all duration-500`}
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div>

                {/* Connection dots */}
                <div className="grid grid-cols-2 gap-1.5">
                    {CONNECTIONS.map(conn => {
                        const connected = !!(apiKeys?.[conn.id]);
                        return (
                            <div
                                key={conn.id}
                                className={cn(
                                    "bg-background/40 rounded-lg px-2 py-1.5 flex items-center gap-1.5 transition-all",
                                    connected ? "opacity-100" : "opacity-40 grayscale"
                                )}
                            >
                                <div className={cn(
                                    "w-1.5 h-1.5 rounded-full shrink-0",
                                    connected
                                        ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]"
                                        : "bg-zinc-500"
                                )} />
                                <span className="font-mono text-[9px] font-medium text-muted-foreground truncate">{conn.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Provider Breakdown - Expandable */}
                {providers.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10">
                        <button
                            onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
                            className="flex items-center justify-between w-full text-[10px] text-white/50 hover:text-white/70 transition-colors"
                        >
                            <span className="font-medium uppercase tracking-wider">Provider Usage</span>
                            <ChevronRight className={cn("w-3 h-3 transition-transform", expanded && "rotate-90")} />
                        </button>
                        {expanded && (
                            <div className="mt-2 space-y-1.5">
                                {providers.map(p => {
                                    const pPct = p.limit > 0 ? (p.used / p.limit) * 100 : 0;
                                    return (
                                        <div key={p.id} className="bg-background/30 rounded-lg px-2 py-1.5">
                                            <div className="flex items-center justify-between text-[9px] mb-1">
                                                <span className="text-white/60 font-medium">{p.label}</span>
                                                <span className="font-mono text-white/50">{p.used}/{p.limit || '∞'}</span>
                                            </div>
                                            <div className="h-1 bg-background/50 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full transition-all"
                                                    style={{ width: `${Math.min(100, pPct)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </button>
    );
};
