import React from 'react';
import { X, Zap, TrendingUp } from 'lucide-react';
import { UsageStats, ProviderUsage } from '../../types/index';
import { cn } from '@/lib/utils';

interface UsageModalProps {
    isOpen: boolean;
    onClose: () => void;
    usage: UsageStats;
}

export const UsageModal = ({ isOpen, onClose, usage }: UsageModalProps) => {
    if (!isOpen) return null;

    const getProviderColor = (provider: string) => {
        switch (provider) {
            case 'OpenAI': return 'from-green-500 to-emerald-500';
            case 'Google': return 'from-blue-500 to-cyan-500';
            case 'Anthropic': return 'from-orange-500 to-amber-500';
            case 'HuggingFace': return 'from-yellow-500 to-orange-500';
            default: return 'from-gray-500 to-slate-500';
        }
    };

    const totalTokens = usage.byProvider.reduce((sum, p) => sum + p.tokens, 0);
    const totalRequests = usage.byProvider.reduce((sum, p) => sum + p.requests, 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                            <Zap className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Token Usage</h2>
                            <p className="text-sm text-muted-foreground">Detailed breakdown by provider</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-4 rounded-xl border border-indigo-500/20">
                            <div className="text-sm text-muted-foreground mb-1">Total Tokens</div>
                            <div className="text-2xl font-bold">{totalTokens.toLocaleString()}</div>
                        </div>
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 p-4 rounded-xl border border-green-500/20">
                            <div className="text-sm text-muted-foreground mb-1">Total Requests</div>
                            <div className="text-2xl font-bold">{totalRequests.toLocaleString()}</div>
                        </div>
                    </div>

                    {/* Overall Usage */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm">Overall Usage</h3>
                        <div className="space-y-2">
                            <UsageLine label="Chat" used={usage.chat.used} limit={usage.chat.limit} />
                            <UsageLine label="Search" used={usage.search.used} limit={usage.search.limit} />
                            <UsageLine label="Code" used={usage.code.used} limit={usage.code.limit} />
                        </div>
                    </div>

                    {/* Provider Breakdown */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm flex items-center gap-2">
                            <TrendingUp className="w-4 h-4" />
                            By Provider
                        </h3>
                        <div className="space-y-3">
                            {usage.byProvider.map((provider) => (
                                <div
                                    key={provider.provider}
                                    className="bg-secondary/50 p-4 rounded-xl space-y-2"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-3 h-3 rounded-full bg-gradient-to-r",
                                                getProviderColor(provider.provider)
                                            )} />
                                            <span className="font-medium">{provider.provider}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {provider.requests} requests
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-background/50 h-2 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full bg-gradient-to-r rounded-full transition-all duration-500",
                                                    getProviderColor(provider.provider)
                                                )}
                                                style={{ width: `${Math.min((provider.tokens / totalTokens) * 100, 100)}%` }}
                                            />
                                        </div>
                                        <span className="text-sm font-mono font-medium min-w-[80px] text-right">
                                            {provider.tokens.toLocaleString()} tokens
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reset Info */}
                    <div className="bg-secondary/30 p-4 rounded-xl text-center">
                        <p className="text-sm text-muted-foreground">
                            Usage resets on <span className="font-medium text-foreground">
                                {new Date(usage.resetDate).toLocaleDateString('en-US', { 
                                    month: 'long', 
                                    day: 'numeric', 
                                    year: 'numeric' 
                                })}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
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
            <span className="text-sm text-muted-foreground w-16">{label}</span>
            <div className="flex-1 bg-background/30 h-2 rounded-full overflow-hidden">
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
            <span className="text-sm text-muted-foreground w-20 text-right">
                {used}/{limit}
            </span>
        </div>
    );
};
