/**
 * ChatMessage - Beautiful chat bubble component
 * Mobile-optimized with clean design
 */
import React from 'react';
import { User, Bot, Globe, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Message } from '../../types/';
import { ThinkingProcess } from './ThinkingProcess';

export const ChatMessage = ({ message }: { message: Message }) => {
    const isUser = message.role === 'user';

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex gap-3 w-full",
                isUser ? "flex-row-reverse" : "flex-row"
            )}
        >
            {/* Avatar */}
            <div className={cn(
                "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
                isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-gradient-to-br from-indigo-500 to-purple-600 text-white"
            )}>
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            <div className={cn(
                "flex-1 min-w-0 max-w-[85%] md:max-w-[75%]",
                isUser && "flex flex-col items-end"
            )}>
                {/* Thinking Process (AI only) */}
                {!isUser && message.thoughts && <ThinkingProcess steps={message.thoughts} />}

                {/* Message Bubble */}
                {message.content && (
                    <div className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm",
                        isUser
                            ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-sm"
                            : "bg-card border border-border/40 rounded-tl-sm"
                    )}>
                        <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                )}

                {/* Sources */}
                {!isUser && message.sources && message.sources.length > 0 && (
                    <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                        {message.sources.map((source, idx) => (
                            <a
                                key={idx}
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-secondary/50 hover:bg-secondary border border-border/40 rounded-lg px-3 py-2 transition-colors whitespace-nowrap"
                            >
                                <Globe className="w-3 h-3 text-muted-foreground" />
                                <span className="text-xs font-medium">{source.title}</span>
                            </a>
                        ))}
                    </div>
                )}

                {/* Code Attachments */}
                {message.attachments && message.attachments.map((att, idx) => (
                    <div key={idx} className="mt-2 rounded-xl overflow-hidden border border-border/40 bg-[#0d1117] shadow-lg">
                        <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs text-zinc-400 font-mono">code.ts</span>
                            </div>
                            <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Live
                            </div>
                        </div>
                        <div className="p-3 font-mono text-xs text-zinc-300 overflow-x-auto">
                            <pre>{att.content}</pre>
                        </div>
                    </div>
                ))}
            </div>
        </motion.div>
    );
};
