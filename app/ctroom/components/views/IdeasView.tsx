/**
 * IdeasView - Notion-Style Block Editor
 * Features:
 * - Full-page editing experience
 * - Block-based content with + menu
 * - Drag to reorder blocks
 * - Multiple block types (text, headings, lists, images, links)
 * - Floating AI assistant
 */
import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import {
    Plus, FileText, User, Bot, Send, Sparkles, X, Loader2,
    MoreHorizontal, SidebarClose, SidebarOpen, Wand2, Save,
    Type, Heading1, Heading2, Heading3, List, ListOrdered, Quote,
    CheckSquare, Image, Link2, Minus, GripVertical
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Idea, AISuggestion, ContentBlock, BlockType } from '../../types/index';

interface IdeasViewProps {
    ideas: Idea[];
    activeIdeaId: string | null;
    ideaForm: {
        title: string;
        content: string;
        category: Idea['category'];
    };
    setIdeaForm: React.Dispatch<React.SetStateAction<{
        title: string;
        content: string;
        category: Idea['category'];
    }>>;
    handleSaveIdea: () => void;
    handleNewIdea: () => void;
    loadIdea: (idea: Idea) => void;
}

interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    suggestions?: AISuggestion[];
}

// Block type options for the + menu
const BLOCK_TYPES: { type: BlockType; icon: any; label: string; shortcut?: string }[] = [
    { type: 'text', icon: Type, label: 'Text', shortcut: 'Plain text' },
    { type: 'heading1', icon: Heading1, label: 'Heading 1', shortcut: '# + space' },
    { type: 'heading2', icon: Heading2, label: 'Heading 2', shortcut: '## + space' },
    { type: 'heading3', icon: Heading3, label: 'Heading 3', shortcut: '### + space' },
    { type: 'bullet', icon: List, label: 'Bullet List', shortcut: '- + space' },
    { type: 'numbered', icon: ListOrdered, label: 'Numbered List', shortcut: '1. + space' },
    { type: 'todo', icon: CheckSquare, label: 'To-do', shortcut: '[] + space' },
    { type: 'quote', icon: Quote, label: 'Quote', shortcut: '> + space' },
    { type: 'divider', icon: Minus, label: 'Divider', shortcut: '---' },
    { type: 'image', icon: Image, label: 'Image', shortcut: '/image' },
    { type: 'link', icon: Link2, label: 'Link', shortcut: '/link' },
];

export const IdeasView = ({
    ideas,
    activeIdeaId,
    ideaForm,
    setIdeaForm,
    handleSaveIdea,
    handleNewIdea,
    loadIdea
}: IdeasViewProps) => {
    const [showAIChat, setShowAIChat] = useState(false);
    const [showSidebar, setShowSidebar] = useState(false);

    // Block-based content
    const [blocks, setBlocks] = useState<ContentBlock[]>([
        { id: '1', type: 'text', content: '' }
    ]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>('1');
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
    const [menuFilterText, setMenuFilterText] = useState('');

    // AI Chat
    const [aiMessages, setAIMessages] = useState<AIMessage[]>([
        {
            id: '1',
            role: 'assistant',
            content: "I can help you brainstorm, expand ideas, or fix your writing. What do you need?",
            suggestions: [
                { id: '1', type: 'expand', content: 'Continue writing...', preview: 'Generate more content' },
                { id: '2', type: 'new-idea', content: 'Brainstorm ideas', preview: 'Get related topics' },
            ]
        }
    ]);
    const [aiInput, setAIInput] = useState('');
    const [isAITyping, setIsAITyping] = useState(false);
    const chatScrollRef = useRef<HTMLDivElement>(null);
    const blockRefs = useRef<{ [key: string]: HTMLElement | null }>({});

    // Sync content from blocks to form
    useEffect(() => {
        const content = blocks.map(b => {
            if (b.type === 'divider') return '---';
            if (b.type === 'heading1') return `# ${b.content}`;
            if (b.type === 'heading2') return `## ${b.content}`;
            if (b.type === 'heading3') return `### ${b.content}`;
            if (b.type === 'bullet') return `- ${b.content}`;
            if (b.type === 'numbered') return `1. ${b.content}`;
            if (b.type === 'todo') return `[${b.checked ? 'x' : ' '}] ${b.content}`;
            if (b.type === 'quote') return `> ${b.content}`;
            if (b.type === 'image') return `![](${b.imageUrl || ''})`;
            if (b.type === 'link') return `[${b.content}](${b.linkUrl || ''})`;
            return b.content;
        }).join('\n');
        setIdeaForm(prev => ({ ...prev, content }));
    }, [blocks, setIdeaForm]);

    // Load content into blocks when idea changes
    useEffect(() => {
        if (ideaForm.content && activeIdeaId) {
            const lines = ideaForm.content.split('\n');
            const newBlocks: ContentBlock[] = lines.map((line, idx) => {
                let type: BlockType = 'text';
                let content = line;
                let checked = false;

                if (line.startsWith('# ')) { type = 'heading1'; content = line.slice(2); }
                else if (line.startsWith('## ')) { type = 'heading2'; content = line.slice(3); }
                else if (line.startsWith('### ')) { type = 'heading3'; content = line.slice(4); }
                else if (line.startsWith('- ')) { type = 'bullet'; content = line.slice(2); }
                else if (line.match(/^\d+\. /)) { type = 'numbered'; content = line.replace(/^\d+\. /, ''); }
                else if (line.startsWith('[x] ')) { type = 'todo'; content = line.slice(4); checked = true; }
                else if (line.startsWith('[ ] ')) { type = 'todo'; content = line.slice(4); }
                else if (line.startsWith('> ')) { type = 'quote'; content = line.slice(2); }
                else if (line === '---') { type = 'divider'; content = ''; }

                return { id: `block-${idx}`, type, content, checked };
            });

            if (newBlocks.length === 0) {
                newBlocks.push({ id: '1', type: 'text', content: '' });
            }
            setBlocks(newBlocks);
        }
    }, [activeIdeaId]);

    // Handle AI chat scroll
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [aiMessages]);

    const addBlock = (type: BlockType, afterId?: string) => {
        const newBlock: ContentBlock = {
            id: Date.now().toString(),
            type,
            content: '',
            checked: type === 'todo' ? false : undefined
        };

        if (afterId) {
            const idx = blocks.findIndex(b => b.id === afterId);
            const newBlocks = [...blocks];
            newBlocks.splice(idx + 1, 0, newBlock);
            setBlocks(newBlocks);
        } else {
            setBlocks([...blocks, newBlock]);
        }

        setActiveBlockId(newBlock.id);
        setShowBlockMenu(false);

        // Focus new block
        setTimeout(() => {
            blockRefs.current[newBlock.id]?.focus();
        }, 50);
    };

    const updateBlock = (id: string, updates: Partial<ContentBlock>) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
    };

    const deleteBlock = (id: string) => {
        if (blocks.length === 1) {
            setBlocks([{ id: '1', type: 'text', content: '' }]);
            return;
        }
        const idx = blocks.findIndex(b => b.id === id);
        setBlocks(prev => prev.filter(b => b.id !== id));
        // Focus previous block
        if (idx > 0) {
            const prevBlock = blocks[idx - 1];
            setTimeout(() => blockRefs.current[prevBlock.id]?.focus(), 50);
        }
    };

    const handleBlockKeyDown = (e: KeyboardEvent<HTMLElement>, block: ContentBlock) => {
        // Enter to create new block
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            addBlock('text', block.id);
        }

        // Backspace on empty block to delete
        if (e.key === 'Backspace' && block.content === '' && blocks.length > 1) {
            e.preventDefault();
            deleteBlock(block.id);
        }

        // / to open block menu
        if (e.key === '/' && block.content === '') {
            e.preventDefault();
            const rect = blockRefs.current[block.id]?.getBoundingClientRect();
            if (rect) {
                setBlockMenuPosition({ x: rect.left, y: rect.bottom + 4 });
                setShowBlockMenu(true);
                setMenuFilterText('');
            }
        }
    };

    const showAddMenu = (blockId: string) => {
        const rect = blockRefs.current[blockId]?.getBoundingClientRect();
        if (rect) {
            setBlockMenuPosition({ x: rect.left - 20, y: rect.top });
            setActiveBlockId(blockId);
            setShowBlockMenu(true);
            setMenuFilterText('');
        }
    };

    const handleAISend = () => {
        if (!aiInput.trim()) return;
        const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', content: aiInput };
        setAIMessages(prev => [...prev, userMsg]);
        setAIInput('');
        setIsAITyping(true);

        setTimeout(() => {
            const aiResponse: AIMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: `Here are some thoughts on "${aiInput}":\n\n• Consider the user's perspective\n• Keep it minimal but functional\n• Iterate based on feedback`,
                suggestions: [{ id: 's1', type: 'expand', content: 'Insert into note', preview: 'Add to your note' }]
            };
            setAIMessages(prev => [...prev, aiResponse]);
            setIsAITyping(false);
        }, 1200);
    };

    const addSuggestionToNotes = (suggestion: AISuggestion) => {
        addBlock('text', blocks[blocks.length - 1].id);
        setTimeout(() => {
            const lastBlock = blocks[blocks.length - 1];
            updateBlock(lastBlock.id, { content: suggestion.preview || suggestion.content });
        }, 100);
    };

    // Filter block types based on menu filter
    const filteredBlockTypes = BLOCK_TYPES.filter(bt =>
        bt.label.toLowerCase().includes(menuFilterText.toLowerCase()) ||
        bt.type.toLowerCase().includes(menuFilterText.toLowerCase())
    );

    // Render block based on type
    const renderBlock = (block: ContentBlock) => {
        const baseClasses = "w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none placeholder:text-muted-foreground/30";

        if (block.type === 'divider') {
            return <hr className="border-border/50 my-2" />;
        }

        if (block.type === 'todo') {
            return (
                <div className="flex items-start gap-2">
                    <button
                        onClick={() => updateBlock(block.id, { checked: !block.checked })}
                        className={cn(
                            "mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center",
                            block.checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                        )}
                    >
                        {block.checked && <CheckSquare className="w-3 h-3" />}
                    </button>
                    <div
                        ref={el => { blockRefs.current[block.id] = el }}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
                        onKeyDown={(e) => handleBlockKeyDown(e as any, block)}
                        onFocus={() => setActiveBlockId(block.id)}
                        className={cn(baseClasses, "flex-1 outline-none", block.checked && "line-through text-muted-foreground")}
                        data-placeholder="To-do"
                    >
                        {block.content}
                    </div>
                </div>
            );
        }

        const typeStyles: Record<BlockType, string> = {
            text: 'text-base',
            heading1: 'text-3xl font-bold',
            heading2: 'text-2xl font-semibold',
            heading3: 'text-xl font-medium',
            bullet: 'text-base pl-4 before:content-["•"] before:absolute before:left-0 before:text-muted-foreground relative',
            numbered: 'text-base pl-4',
            quote: 'text-base pl-4 border-l-2 border-primary/30 italic text-muted-foreground',
            divider: '',
            todo: '',
            image: '',
            link: 'text-primary underline',
        };

        return (
            <div
                ref={el => { blockRefs.current[block.id] = el }}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
                onKeyDown={(e) => handleBlockKeyDown(e as any, block)}
                onFocus={() => setActiveBlockId(block.id)}
                className={cn(baseClasses, typeStyles[block.type], "outline-none min-h-[1.5em]")}
                data-placeholder={block.type === 'text' ? "Type '/' for commands..." : block.type}
            >
                {block.content}
            </div>
        );
    };

    return (
        <div className="h-full flex bg-background relative overflow-hidden">

            {/* Sidebar */}
            <AnimatePresence mode="wait">
                {showSidebar && (
                    <motion.div
                        initial={{ x: -240, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -240, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="absolute md:relative z-30 h-full w-60 bg-card border-r border-border/40 flex flex-col shadow-xl md:shadow-none"
                    >
                        <div className="p-3 flex items-center justify-between border-b border-border/40">
                            <span className="font-semibold text-sm">Notes</span>
                            <button onClick={() => setShowSidebar(false)} className="p-1.5 hover:bg-secondary rounded-lg">
                                <SidebarClose className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-2">
                            <button
                                onClick={() => { handleNewIdea(); setShowSidebar(false); setBlocks([{ id: '1', type: 'text', content: '' }]); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                                <Plus className="w-4 h-4" />
                                <span>New Note</span>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2">
                            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">Recent</div>
                            {ideas.map(idea => (
                                <button
                                    key={idea.id}
                                    onClick={() => { loadIdea(idea); setShowSidebar(false); }}
                                    className={cn(
                                        "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left",
                                        activeIdeaId === idea.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                    )}
                                >
                                    <FileText className="w-3.5 h-3.5 flex-shrink-0" />
                                    <span className="truncate">{idea.title || 'Untitled'}</span>
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showSidebar && <div className="md:hidden fixed inset-0 bg-black/20 z-20" onClick={() => setShowSidebar(false)} />}

            {/* Main Editor */}
            <div className="flex-1 h-full flex flex-col min-w-0">

                {/* Top Bar */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-border/30 bg-background/80 backdrop-blur-sm flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <button onClick={() => setShowSidebar(true)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground">
                            <SidebarOpen className="w-4 h-4" />
                        </button>
                        <span className="text-sm text-muted-foreground truncate max-w-[150px] md:max-w-[250px]">
                            {ideaForm.title || 'Untitled'}
                        </span>
                    </div>

                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setShowAIChat(!showAIChat)}
                            className={cn(
                                "p-2 rounded-lg transition-colors",
                                showAIChat ? "bg-indigo-500/10 text-indigo-500" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                        >
                            <Sparkles className="w-4 h-4" />
                        </button>
                        <button onClick={handleSaveIdea} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg">
                            <Save className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Editor Area */}
                <div className="flex-1 overflow-y-auto">
                    <div className="h-full flex flex-col px-4 md:px-8 lg:px-16 py-6 md:py-10 max-w-4xl mx-auto w-full">

                        {/* Title */}
                        <input
                            type="text"
                            placeholder="Untitled"
                            value={ideaForm.title}
                            onChange={(e) => setIdeaForm(prev => ({ ...prev, title: e.target.value }))}
                            className="w-full text-3xl md:text-4xl lg:text-5xl font-bold bg-transparent border-none focus:ring-0 focus:outline-none p-0 placeholder:text-muted-foreground/25 text-foreground mb-6 md:mb-8"
                        />

                        {/* Blocks */}
                        <Reorder.Group axis="y" values={blocks} onReorder={setBlocks} className="space-y-1">
                            {blocks.map((block) => (
                                <Reorder.Item key={block.id} value={block} className="group relative">
                                    {/* Block Controls */}
                                    <div className="absolute -left-10 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                                        <button
                                            onClick={() => showAddMenu(block.id)}
                                            className="p-1 text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary rounded"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button className="p-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab">
                                            <GripVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Block Content */}
                                    <div className={cn(
                                        "py-1 rounded transition-colors",
                                        activeBlockId === block.id && "bg-secondary/20"
                                    )}>
                                        {renderBlock(block)}
                                    </div>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>

                        {/* Add Block Button */}
                        <button
                            onClick={() => addBlock('text')}
                            className="mt-4 flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Add a block</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Block Menu */}
            <AnimatePresence>
                {showBlockMenu && (
                    <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowBlockMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            style={{ left: blockMenuPosition.x, top: blockMenuPosition.y }}
                            className="fixed z-50 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-2 border-b border-border/50">
                                <input
                                    autoFocus
                                    value={menuFilterText}
                                    onChange={(e) => setMenuFilterText(e.target.value)}
                                    placeholder="Filter..."
                                    className="w-full bg-secondary/50 border-none rounded-lg px-3 py-2 text-sm focus:ring-0 outline-none"
                                />
                            </div>
                            <div className="max-h-64 overflow-y-auto p-1">
                                {filteredBlockTypes.map(bt => (
                                    <button
                                        key={bt.type}
                                        onClick={() => { addBlock(bt.type, activeBlockId || undefined); }}
                                        className="w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-secondary rounded-lg transition-colors text-left"
                                    >
                                        <bt.icon className="w-4 h-4 text-muted-foreground" />
                                        <div className="flex-1">
                                            <div className="font-medium">{bt.label}</div>
                                            {bt.shortcut && <div className="text-xs text-muted-foreground">{bt.shortcut}</div>}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Floating AI Panel */}
            <AnimatePresence>
                {showAIChat && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed md:absolute bottom-4 right-4 md:top-20 md:bottom-auto w-[calc(100%-2rem)] md:w-80 lg:w-96 bg-card border border-border shadow-2xl rounded-2xl overflow-hidden z-40 flex flex-col max-h-[70vh] md:max-h-[60vh]"
                    >
                        <div className="p-3 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
                            <div className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-indigo-500" />
                                <span className="font-medium text-sm">AI Assistant</span>
                            </div>
                            <button onClick={() => setShowAIChat(false)} className="p-1 hover:bg-secondary rounded">
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={chatScrollRef}>
                            {aiMessages.map(msg => (
                                <div key={msg.id} className={cn("flex gap-2", msg.role === 'user' ? "flex-row-reverse" : "")}>
                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0",
                                        msg.role === 'assistant' ? "bg-indigo-500 text-white" : "bg-secondary"
                                    )}>
                                        {msg.role === 'assistant' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                                    </div>
                                    <div className={cn(
                                        "text-sm rounded-xl p-3 max-w-[85%]",
                                        msg.role === 'user' ? "bg-primary text-primary-foreground" : "bg-secondary/70"
                                    )}>
                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                        {msg.suggestions?.map(s => (
                                            <button
                                                key={s.id}
                                                onClick={() => addSuggestionToNotes(s)}
                                                className="mt-2 w-full text-left text-xs bg-background hover:bg-background/80 border border-border/50 rounded-lg p-2 flex items-center gap-2 transition-colors"
                                            >
                                                <Wand2 className="w-3 h-3 text-indigo-500" />
                                                <span>{s.preview}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            ))}
                            {isAITyping && (
                                <div className="flex gap-2 items-center text-muted-foreground text-xs pl-8">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Thinking...
                                </div>
                            )}
                        </div>

                        <div className="p-3 border-t border-border/50 bg-secondary/10">
                            <div className="relative">
                                <input
                                    value={aiInput}
                                    onChange={(e) => setAIInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleAISend()}
                                    placeholder="Ask AI..."
                                    className="w-full bg-background border border-border/50 rounded-xl pl-3 pr-10 py-2.5 text-sm focus:ring-1 focus:ring-indigo-500 outline-none"
                                />
                                <button
                                    onClick={handleAISend}
                                    disabled={!aiInput.trim()}
                                    className="absolute right-1.5 top-1.5 p-1.5 bg-indigo-500 text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                                >
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
