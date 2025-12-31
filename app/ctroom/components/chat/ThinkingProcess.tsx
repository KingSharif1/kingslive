import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Github, Globe, Code2, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Message } from '../../types/';

export const ThinkingProcess = ({ steps }: { steps: Message['thoughts'] }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    if (!steps || steps.length === 0) return null;

    return (
        <div className="mt-2 mb-4 border border-border/50 bg-secondary/20 rounded-xl overflow-hidden transition-all duration-300">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center gap-3 p-3 bg-secondary/30 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors group"
            >
                <div className="w-5 h-5 rounded-md bg-background/50 flex items-center justify-center shadow-sm group-hover:bg-background transition-colors">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                </div>
                <span>Reasoning Process</span>
                <span className="bg-background/50 px-2 py-0.5 rounded-full text-[10px] border border-border/20">{steps.length} steps</span>
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5 ml-auto" /> : <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
            </button>

            <AnimatePresence>
                {isExpanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-3 pb-3 pt-1 space-y-3"
                    >
                        <div className="h-px bg-border/30 mx-1 mb-3" />
                        {steps.map((step, idx) => (
                            <div key={idx} className="flex gap-3 text-sm group">
                                <div className={cn(
                                    "mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] border transition-colors",
                                    step.status === 'complete'
                                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                        : "bg-blue-500/10 text-blue-600 border-blue-500/20 animate-pulse"
                                )}>
                                    {step.icon === 'github' && <Github className="w-3 h-3" />}
                                    {step.icon === 'search' && <Globe className="w-3 h-3" />}
                                    {step.icon === 'code' && <Code2 className="w-3 h-3" />}
                                    {step.icon === 'thinking' && <Cpu className="w-3 h-3" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-foreground text-xs truncate">{step.title}</div>
                                        {step.duration && <span className="text-[10px] text-muted-foreground">{step.duration}</span>}
                                    </div>
                                    <div className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{step.content}</div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
