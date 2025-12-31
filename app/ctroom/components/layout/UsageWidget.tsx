import React from 'react';
import { Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { UsageStats } from '../../types/index';

interface UsageWidgetProps {
    usage: UsageStats;
    onClick?: () => void;
}

export const UsageWidget = ({ usage, onClick }: UsageWidgetProps) => {
    const totalPercentage = (usage.total.used / usage.total.limit) * 100;
    const totalTokens = usage.byProvider.reduce((sum, p) => sum + p.tokens, 0);

    const getUsageColor = (percentage: number) => {
        if (percentage >= 90) return 'from-red-500 to-orange-500';
        if (percentage >= 70) return 'from-yellow-500 to-orange-500';
        return 'from-indigo-500 to-purple-500';
    };

    return (
        <button
            onClick={onClick}
            className="w-full bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-2xl border border-indigo-500/10 relative overflow-hidden group hover:border-indigo-500/30 transition-all cursor-pointer"
        >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

            <div className="relative">
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">Token Usage</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
                </div>

                {/* Total Usage Bar */}
                <div className="w-full bg-background/50 h-2 rounded-full overflow-hidden mb-2">
                    <div
                        className={`h-full bg-gradient-to-r ${getUsageColor(totalPercentage)} rounded-full transition-all duration-500`}
                        style={{ width: `${Math.min(totalPercentage, 100)}%` }}
                    />
                </div>

                <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                    <span className="font-mono">{totalTokens.toLocaleString()} tokens</span>
                    <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {totalPercentage.toFixed(0)}%
                    </span>
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
