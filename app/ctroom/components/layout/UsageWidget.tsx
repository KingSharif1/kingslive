import React from 'react';
import { Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UsageStats } from '../../types/index';

interface UsageWidgetProps {
    usage: UsageStats;
    onClick?: () => void;
    apiKeys: { google?: string; github?: string; openai?: string; };
}

export const UsageWidget = ({ usage, onClick, apiKeys }: UsageWidgetProps) => {
    const totalPercentage = (usage.total.used / usage.total.limit) * 100;
    const totalTokens = usage.byProvider.reduce((sum, p) => sum + p.tokens, 0);

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'from-red-500 to-orange-500';
        if (percentage >= 70) return 'from-yellow-500 to-orange-500';
        return 'from-indigo-500 to-purple-500';
    };

    const isInternetConnected = !!(apiKeys?.google || process.env.NEXT_PUBLIC_GOOGLE_API_KEY);
    const isGithubConnected = !!(apiKeys?.github || process.env.NEXT_PUBLIC_GITHUB_TOKEN);

    return (
        <button
            onClick={onClick}
            className="w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-2xl border border-indigo-500/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all cursor-pointer text-left"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Usage & Connections</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Total Usage Bar */}
                <div className="mb-4">
                    <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1.5">
                        <span className="font-medium">Monthly Tokens</span>
                        <span className="font-mono">{totalPercentage.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-background/50 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full bg-gradient-to-r ${getUsageColor(totalPercentage)} rounded-full transition-all duration-500`}
                            style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                        />
                    </div>
                </div>

                {/* Connections Mini-Status */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className={cn(
                        "bg-background/40 rounded-lg p-2 flex items-center gap-2 transition-colors",
                        isInternetConnected ? "opacity-100" : "opacity-50 grayscale"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]", isInternetConnected ? "bg-emerald-500" : "bg-zinc-400 shadow-none")}></div>
                        <span className="text-[10px] font-medium opacity-80">Internet</span>
                    </div>
                    <div className={cn(
                        "bg-background/40 rounded-lg p-2 flex items-center gap-2 transition-colors",
                        isGithubConnected ? "opacity-100" : "opacity-50 grayscale"
                    )}>
                        <div className={cn("w-2 h-2 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]", isGithubConnected ? "bg-emerald-500" : "bg-zinc-400 shadow-none")}></div>
                        <span className="text-[10px] font-medium opacity-80">GitHub</span>
                    </div>
                </div>

            </div>
        </button>
    );
};

interface UsageLineProps {
    label: string;
    used: number;
    limit: number;
}

const UsageLine = ({ label, used, limit }: UsageLineProps) => {
    const percentage = (used / limit) * 100;

    return (
        <div className="flex items-center gap-2">
            <span className="text-[10px] text-muted-foreground w-12">{label}</span>
            <div className="flex-1 bg-background/30 h-1 rounded-full overflow-hidden">
                <div
                    className="h-full bg-indigo-400 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className="text-[10px] text-muted-foreground w-10 text-right">{used}/{limit}</span>
        </div>
    );
};
