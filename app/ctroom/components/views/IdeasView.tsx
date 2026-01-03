/**
 * IdeasView - Notion-Style Block Editor
 * Features:
 * - Full-page editing experience
 * - Block-based content with + menu
 * - Drag to reorder blocks
 * - Multiple block types (text, headings, lists, images, links)
 * - Floating AI assistant
 */
import React, { useState, useRef, useEffect, KeyboardEvent, useCallback } from 'react';
import {
    Plus, FileText, User, Bot, Send, Sparkles, X, Loader2,
    MoreHorizontal, SidebarClose, SidebarOpen, Wand2, Save,
    Type, Heading1, Heading2, Heading3, List, ListOrdered, Quote,
    CheckSquare, Image, Link2, Minus, GripVertical, Mic, Pencil,
    Upload, ExternalLink, Play, Pause, Trash2, Check
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
    { type: 'voice', icon: Mic, label: 'Voice Memo', shortcut: '/voice' },
    { type: 'drawing', icon: Pencil, label: 'Drawing', shortcut: '/draw' },
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
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // Voice recording state
    const [isRecording, setIsRecording] = useState(false);
    const [recordingBlockId, setRecordingBlockId] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioLevels, setAudioLevels] = useState<number[]>(Array(20).fill(0));
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    
    // Drawing state
    const [isDrawing, setIsDrawing] = useState(false);
    const [drawingBlockId, setDrawingBlockId] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushSize, setBrushSize] = useState(3);
    const [isEraser, setIsEraser] = useState(false);
    const drawingCanvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawingOnCanvas, setIsDrawingOnCanvas] = useState(false);
    
    // Mobile toolbar state
    const [showMobileToolbar, setShowMobileToolbar] = useState(false);
    const [mobileToolbarVisible, setMobileToolbarVisible] = useState(false);

    // Block-based content
    const [blocks, setBlocks] = useState<ContentBlock[]>([
        { id: '1', type: 'text', content: '' }
    ]);
    const [activeBlockId, setActiveBlockId] = useState<string | null>('1');
    const [showBlockMenu, setShowBlockMenu] = useState(false);
    const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
    const [menuFilterText, setMenuFilterText] = useState('');
    const [pendingBlockAfter, setPendingBlockAfter] = useState<string | null>(null);

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

    // Auto-save functionality with debouncing
    useEffect(() => {
        if (activeIdeaId && blocks.length > 0) {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
            
            saveTimeoutRef.current = setTimeout(() => {
                setIsSaving(true);
                handleSaveIdea();
                setTimeout(() => {
                    setIsSaving(false);
                    setLastSaved(new Date());
                }, 500);
            }, 2000); // Auto-save after 2 seconds of inactivity
        }
        
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, [blocks, ideaForm.title, activeIdeaId]);

    // Sync blocks to form - store as JSON to preserve all data
    useEffect(() => {
        if (!activeIdeaId) return; // Only sync when we have an active idea
        
        // Store blocks as JSON in metadata to preserve rich content
        const blocksJson = JSON.stringify(blocks);
        
        // Also create a text preview for display/search
        const textPreview = blocks.map(b => {
            if (b.type === 'divider') return '---';
            if (b.type === 'image') return `[Image: ${b.content || 'Untitled'}]`;
            if (b.type === 'voice') return `[Voice Memo: ${Math.floor(b.voiceDuration || 0)}s]`;
            if (b.type === 'drawing') return `[Drawing]`;
            return b.content;
        }).filter(Boolean).join('\n');
        
        setIdeaForm(prev => {
            // Only update if blocks have actually changed
            const currentBlocksJson = prev.metadata?.blocks;
            if (currentBlocksJson === blocksJson) return prev;
            
            return { 
                ...prev, 
                content: textPreview,
                metadata: { ...prev.metadata, blocks: blocksJson }
            };
        });
    }, [blocks, activeIdeaId]);

    // Load blocks from saved JSON when idea changes
    useEffect(() => {
        if (activeIdeaId) {
            // Try to load blocks from metadata JSON first
            if (ideaForm.metadata?.blocks) {
                try {
                    const savedBlocks = JSON.parse(ideaForm.metadata.blocks);
                    if (Array.isArray(savedBlocks) && savedBlocks.length > 0) {
                        setBlocks(savedBlocks);
                        return;
                    }
                } catch (error) {
                    console.error('Failed to parse saved blocks:', error);
                }
            }
            
            // Fallback: parse from markdown content (for old notes)
            if (ideaForm.content) {
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
            } else {
                // No content at all, start with empty block
                setBlocks([{ id: '1', type: 'text', content: '' }]);
            }
        }
    }, [activeIdeaId, ideaForm.metadata?.blocks, ideaForm.content]);

    // Handle AI chat scroll
    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [aiMessages]);
    
    // Mobile toolbar visibility based on focus
    useEffect(() => {
        if (window.innerWidth < 768) {
            if (activeBlockId) {
                setMobileToolbarVisible(true);
            }
        }
    }, [activeBlockId]);
    
    // Hide mobile toolbar when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (window.innerWidth < 768 && !showBlockMenu) {
                const timer = setTimeout(() => {
                    setMobileToolbarVisible(false);
                }, 3000);
                return () => clearTimeout(timer);
            }
        };
        
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showBlockMenu]);
    
    // Initialize canvas when drawing mode starts
    useEffect(() => {
        if (isDrawing && drawingCanvasRef.current) {
            const canvas = drawingCanvasRef.current;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }, [isDrawing]);

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
        setShowMobileToolbar(false);
        setPendingBlockAfter(null);

        // Focus new block
        setTimeout(() => {
            blockRefs.current[newBlock.id]?.focus();
        }, 50);
    };
    
    const showAddBlockMenu = () => {
        setPendingBlockAfter(blocks[blocks.length - 1]?.id || null);
        setShowBlockMenu(true);
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock) {
            const rect = blockRefs.current[lastBlock.id]?.getBoundingClientRect();
            if (rect) {
                const menuWidth = 256;
                const menuHeight = 400;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                let x = rect.left;
                let y = rect.bottom + 8;
                
                if (x + menuWidth > viewportWidth) {
                    x = viewportWidth - menuWidth - 16;
                }
                if (x < 16) x = 16;
                
                if (y + menuHeight > viewportHeight) {
                    y = rect.top - menuHeight - 8;
                    if (y < 16) y = 16;
                }
                
                setBlockMenuPosition({ x, y });
            }
        }
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
                const menuWidth = 256;
                const menuHeight = 400;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                
                let x = rect.left;
                let y = rect.bottom + 4;
                
                // Adjust horizontal position
                if (x + menuWidth > viewportWidth) {
                    x = viewportWidth - menuWidth - 16;
                }
                if (x < 16) x = 16;
                
                // Adjust vertical position
                if (y + menuHeight > viewportHeight) {
                    y = rect.top - menuHeight - 4;
                    if (y < 16) y = 16;
                }
                
                setBlockMenuPosition({ x, y });
                setShowBlockMenu(true);
                setMenuFilterText('');
            }
        }
    };

    const showAddMenu = (blockId: string) => {
        const rect = blockRefs.current[blockId]?.getBoundingClientRect();
        if (rect) {
            const menuWidth = 256; // w-64 = 16rem = 256px
            const menuHeight = 400; // approximate max height
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            
            // Calculate position with viewport bounds
            let x = rect.left - 20;
            let y = rect.top;
            
            // Adjust horizontal position if menu would overflow
            if (x + menuWidth > viewportWidth) {
                x = viewportWidth - menuWidth - 16; // 16px padding
            }
            if (x < 16) x = 16;
            
            // Adjust vertical position if menu would overflow
            if (y + menuHeight > viewportHeight) {
                y = Math.max(16, viewportHeight - menuHeight - 16);
            }
            
            setBlockMenuPosition({ x, y });
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
        const newBlock: ContentBlock = {
            id: Date.now().toString(),
            type: 'text',
            content: suggestion.preview || suggestion.content,
            isAIGenerated: true
        };
        setBlocks(prev => [...prev, newBlock]);
    };

    // Image upload handler
    const handleImageUpload = useCallback((blockId: string, file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const imageUrl = e.target?.result as string;
            updateBlock(blockId, { imageUrl, content: file.name });
        };
        reader.readAsDataURL(file);
    }, []);

    // Voice recording handlers
    const startRecording = useCallback(async (blockId: string) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            // Setup audio context for waveform visualization
            const audioContext = new AudioContext();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            analyser.fftSize = 256;
            analyser.smoothingTimeConstant = 0.8;
            audioContextRef.current = audioContext;
            analyserRef.current = analyser;
            
            // Start audio level monitoring
            const updateAudioLevels = () => {
                if (!analyserRef.current) return;
                
                const bufferLength = analyserRef.current.frequencyBinCount;
                const dataArray = new Uint8Array(bufferLength);
                analyserRef.current.getByteFrequencyData(dataArray);
                
                // Create 20 bars from frequency data
                const bars = 20;
                const barWidth = Math.floor(bufferLength / bars);
                const levels = [];
                
                for (let i = 0; i < bars; i++) {
                    const start = i * barWidth;
                    const end = start + barWidth;
                    let sum = 0;
                    for (let j = start; j < end; j++) {
                        sum += dataArray[j];
                    }
                    const average = sum / barWidth;
                    levels.push(Math.min(100, (average / 255) * 100));
                }
                
                setAudioLevels(levels);
                animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
            };
            
            updateAudioLevels();

            mediaRecorder.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                const audioUrl = URL.createObjectURL(audioBlob);
                
                // Attempt transcription using Web Speech API
                let transcript = '';
                try {
                    // Note: Web Speech API transcription happens during recording
                    // We'll add live transcription in the UI
                } catch (error) {
                    console.log('Transcription not available');
                }
                
                updateBlock(blockId, { 
                    voiceUrl: audioUrl,
                    voiceDuration: recordingTime,
                    voiceTranscript: transcript || undefined,
                    content: `Voice memo (${Math.floor(recordingTime)}s)`
                });
                stream.getTracks().forEach(track => track.stop());
                if (audioContextRef.current) {
                    audioContextRef.current.close();
                }
                setAudioLevels(Array(20).fill(0));
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingBlockId(blockId);
            setRecordingTime(0);
            
            // Start recording timer
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Could not access microphone. Please check permissions.');
        }
    }, [recordingTime]);

    const stopRecording = useCallback(() => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            setRecordingBlockId(null);
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current);
            }
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
            setAudioLevels(Array(20).fill(0));
        }
    }, [isRecording]);

    // Drawing handlers
    const startDrawing = useCallback((blockId: string) => {
        setIsDrawing(true);
        setDrawingBlockId(blockId);
    }, []);

    const saveDrawing = useCallback((blockId: string, canvas: HTMLCanvasElement) => {
        const drawingData = canvas.toDataURL('image/png').split(',')[1];
        updateBlock(blockId, { 
            drawingData,
            content: 'Drawing'
        });
        setIsDrawing(false);
        setDrawingBlockId(null);
    }, []);

    // Filter block types based on menu filter
    const filteredBlockTypes = BLOCK_TYPES.filter(bt =>
        bt.label.toLowerCase().includes(menuFilterText.toLowerCase()) ||
        bt.type.toLowerCase().includes(menuFilterText.toLowerCase())
    );

    // Render block based on type
    const renderBlock = (block: ContentBlock) => {
        const baseClasses = "w-full bg-transparent border-none focus:ring-0 focus:outline-none resize-none placeholder:text-muted-foreground/30";
        const aiGeneratedClasses = block.isAIGenerated ? "bg-indigo-500/5 border-l-2 border-indigo-500/30 pl-3 rounded" : "";

        if (block.type === 'divider') {
            return <hr className="border-border/50 my-2" />;
        }

        if (block.type === 'todo') {
            return (
                <div className={cn("flex items-start gap-2", aiGeneratedClasses)}>
                    <button
                        onClick={() => updateBlock(block.id, { checked: !block.checked })}
                        className={cn(
                            "mt-1 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center",
                            block.checked ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/40"
                        )}
                    >
                        {block.checked && <Check className="w-3 h-3" />}
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

        // Image block with upload and preview
        if (block.type === 'image') {
            return (
                <div className={cn("space-y-2", aiGeneratedClasses)}>
                    {block.imageUrl ? (
                        <div className="relative group">
                            <img 
                                src={block.imageUrl} 
                                alt={block.content || 'Uploaded image'}
                                className="max-w-full h-auto rounded-lg border border-border/40"
                            />
                            <button
                                onClick={() => updateBlock(block.id, { imageUrl: '', content: '' })}
                                className="absolute top-2 right-2 p-1.5 bg-background/90 hover:bg-destructive hover:text-destructive-foreground rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-border/40 rounded-lg p-6 hover:border-primary/40 transition-colors">
                            <label className="flex flex-col items-center gap-2 cursor-pointer">
                                <Upload className="w-8 h-8 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">Click to upload image</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageUpload(block.id, file);
                                    }}
                                />
                            </label>
                        </div>
                    )}
                    <input
                        type="text"
                        placeholder="Image caption (optional)"
                        value={block.content}
                        onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                        className="w-full text-sm bg-transparent border-none focus:ring-0 focus:outline-none text-muted-foreground"
                    />
                </div>
            );
        }

        // Link block with URL input
        if (block.type === 'link') {
            return (
                <div className={cn("space-y-2 p-3 border border-border/40 rounded-lg", aiGeneratedClasses)}>
                    <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <input
                            type="text"
                            placeholder="Link title"
                            value={block.content}
                            onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                            className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-sm font-medium"
                        />
                    </div>
                    <input
                        type="url"
                        placeholder="https://example.com"
                        value={block.linkUrl || ''}
                        onChange={(e) => updateBlock(block.id, { linkUrl: e.target.value })}
                        className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-sm text-primary"
                    />
                    {block.linkUrl && (
                        <a
                            href={block.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ExternalLink className="w-3 h-3" />
                            Open link
                        </a>
                    )}
                </div>
            );
        }

        // Voice memo block
        if (block.type === 'voice') {
            const isThisBlockRecording = isRecording && recordingBlockId === block.id;
            const formatTime = (seconds: number) => {
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            return (
                <div className={cn("p-3 border border-border/40 rounded-lg space-y-2", aiGeneratedClasses)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Mic className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{block.content || 'Voice Memo'}</span>
                        </div>
                        {block.voiceUrl && (
                            <button
                                onClick={() => updateBlock(block.id, { voiceUrl: '', voiceDuration: undefined, content: '' })}
                                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    {block.voiceUrl ? (
                        <div className="space-y-2">
                            <audio controls className="w-full">
                                <source src={block.voiceUrl} type="audio/webm" />
                            </audio>
                            {block.voiceTranscript && (
                                <div className="p-3 bg-secondary/30 rounded-lg border border-border/30">
                                    <div className="text-xs text-muted-foreground mb-1 font-medium">Transcript:</div>
                                    <p className="text-sm">{block.voiceTranscript}</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {isThisBlockRecording && (
                                <div className="space-y-2">
                                    {/* Recording Timer */}
                                    <div className="text-center text-lg font-mono font-semibold text-destructive">
                                        {formatTime(recordingTime)}
                                    </div>
                                    
                                    {/* Waveform Animation - Reactive to Audio */}
                                    <div className="flex items-center justify-center gap-1 h-16">
                                        {audioLevels.map((level, i) => (
                                            <motion.div
                                                key={i}
                                                className="w-1 bg-destructive rounded-full"
                                                animate={{
                                                    height: `${Math.max(20, level)}%`,
                                                }}
                                                transition={{
                                                    duration: 0.1,
                                                    ease: 'easeOut'
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                            <button
                                onClick={() => isThisBlockRecording ? stopRecording() : startRecording(block.id)}
                                className={cn(
                                    "w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors",
                                    isThisBlockRecording
                                        ? "bg-destructive/10 text-destructive hover:bg-destructive/20"
                                        : "bg-primary/10 text-primary hover:bg-primary/20"
                                )}
                            >
                                {isThisBlockRecording ? (
                                    <>
                                        <Pause className="w-4 h-4" />
                                        <span className="text-sm">Stop Recording</span>
                                    </>
                                ) : (
                                    <>
                                        <Mic className="w-4 h-4" />
                                        <span className="text-sm">Start Recording</span>
                                    </>
                                )}
                            </button>
                        </>
                    )}
                </div>
            );
        }

        // Drawing block
        if (block.type === 'drawing') {
            const isThisBlockDrawing = isDrawing && drawingBlockId === block.id;
            
            const startDrawingOnCanvas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
                setIsDrawingOnCanvas(true);
                const canvas = drawingCanvasRef.current;
                if (!canvas) return;
                
                const rect = canvas.getBoundingClientRect();
                const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
                const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                }
            };
            
            const drawOnCanvas = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
                if (!isDrawingOnCanvas) return;
                
                const canvas = drawingCanvasRef.current;
                if (!canvas) return;
                
                const rect = canvas.getBoundingClientRect();
                const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
                const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
                
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    ctx.strokeStyle = isEraser ? '#ffffff' : brushColor;
                    ctx.lineWidth = isEraser ? brushSize * 3 : brushSize;
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    ctx.lineTo(x, y);
                    ctx.stroke();
                }
            };
            
            const stopDrawingOnCanvas = () => {
                setIsDrawingOnCanvas(false);
            };
            
            const saveCanvasDrawing = () => {
                const canvas = drawingCanvasRef.current;
                if (canvas) {
                    const drawingData = canvas.toDataURL('image/png').split(',')[1];
                    updateBlock(block.id, { 
                        drawingData,
                        content: 'Drawing'
                    });
                    setIsDrawing(false);
                    setDrawingBlockId(null);
                    setBrushColor('#000000');
                    setBrushSize(3);
                    setIsEraser(false);
                    setIsDrawingOnCanvas(false);
                }
            };
            
            const clearCanvas = () => {
                const canvas = drawingCanvasRef.current;
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.fillStyle = '#ffffff';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }
                }
            };
            
            return (
                <div className={cn("p-3 border border-border/40 rounded-lg space-y-2", aiGeneratedClasses)}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Pencil className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{block.content || 'Drawing'}</span>
                        </div>
                        {block.drawingData && (
                            <button
                                onClick={() => updateBlock(block.id, { drawingData: '', content: '' })}
                                className="p-1 hover:bg-destructive/10 hover:text-destructive rounded transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    
                    {block.drawingData ? (
                        <div className="space-y-2">
                            <img 
                                src={`data:image/png;base64,${block.drawingData}`}
                                alt="Drawing"
                                className="w-full h-auto rounded border border-border/40"
                            />
                            <button
                                onClick={() => {
                                    updateBlock(block.id, { drawingData: '', content: '' });
                                    startDrawing(block.id);
                                }}
                                className="w-full px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                            >
                                Edit Drawing
                            </button>
                        </div>
                    ) : isThisBlockDrawing ? (
                        <div className="space-y-2">
                            {/* Drawing Tools */}
                            <div className="flex items-center gap-2 p-2 bg-secondary/50 rounded-lg flex-wrap">
                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => setIsEraser(false)}
                                        className={cn(
                                            "p-2 rounded transition-colors",
                                            !isEraser ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                                        )}
                                    >
                                        <Pencil className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setIsEraser(true)}
                                        className={cn(
                                            "p-2 rounded transition-colors",
                                            isEraser ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                                        )}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </div>
                                
                                <div className="h-6 w-px bg-border" />
                                
                                <div className="flex items-center gap-1">
                                    {['#000000', '#ef4444', '#3b82f6', '#22c55e', '#eab308', '#a855f7'].map(color => (
                                        <button
                                            key={color}
                                            onClick={() => { setBrushColor(color); setIsEraser(false); }}
                                            className={cn(
                                                "w-6 h-6 rounded-full border-2 transition-all",
                                                brushColor === color && !isEraser ? "border-primary scale-110" : "border-transparent"
                                            )}
                                            style={{ backgroundColor: color }}
                                        />
                                    ))}
                                </div>
                                
                                <div className="h-6 w-px bg-border" />
                                
                                <div className="flex items-center gap-2">
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(Number(e.target.value))}
                                        className="w-20"
                                    />
                                    <span className="text-xs text-muted-foreground w-6">{brushSize}px</span>
                                </div>
                                
                                <div className="flex-1" />
                                
                                <button
                                    onClick={clearCanvas}
                                    className="px-3 py-1.5 text-xs bg-background hover:bg-secondary rounded transition-colors"
                                >
                                    Clear
                                </button>
                            </div>
                            
                            {/* Canvas */}
                            <canvas
                                ref={drawingCanvasRef}
                                width={600}
                                height={400}
                                onMouseDown={startDrawingOnCanvas}
                                onMouseMove={drawOnCanvas}
                                onMouseUp={stopDrawingOnCanvas}
                                onMouseLeave={stopDrawingOnCanvas}
                                onTouchStart={startDrawingOnCanvas}
                                onTouchMove={drawOnCanvas}
                                onTouchEnd={stopDrawingOnCanvas}
                                className="w-full border border-border/40 rounded-lg cursor-crosshair touch-none bg-white"
                                style={{ maxHeight: '400px' }}
                            />
                            
                            {/* Action Buttons */}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        setIsDrawing(false);
                                        setDrawingBlockId(null);
                                        setBrushColor('#000000');
                                        setBrushSize(3);
                                        setIsEraser(false);
                                        setIsDrawingOnCanvas(false);
                                    }}
                                    className="flex-1 px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={saveCanvasDrawing}
                                    className="flex-1 px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
                                >
                                    Save Drawing
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => startDrawing(block.id)}
                            className="w-full flex items-center justify-center gap-2 px-4 py-8 bg-secondary/50 hover:bg-secondary/70 rounded-lg transition-colors"
                        >
                            <Pencil className="w-5 h-5" />
                            <span className="text-sm">Start Drawing</span>
                        </button>
                    )}
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
            link: '',
            voice: '',
            drawing: '',
        };

        return (
            <div
                ref={el => { blockRefs.current[block.id] = el }}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => updateBlock(block.id, { content: e.currentTarget.textContent || '' })}
                onKeyDown={(e) => handleBlockKeyDown(e as any, block)}
                onFocus={() => setActiveBlockId(block.id)}
                className={cn(baseClasses, typeStyles[block.type], aiGeneratedClasses, "outline-none min-h-[1.5em]")}
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

                    <div className="flex items-center gap-2">
                        {/* Auto-save indicator */}
                        <div className="hidden md:flex items-center gap-1.5 text-xs text-muted-foreground">
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                    <span>Saving...</span>
                                </>
                            ) : lastSaved ? (
                                <>
                                    <Check className="w-3 h-3 text-green-500" />
                                    <span>Saved {new Date().getTime() - lastSaved.getTime() < 60000 ? 'just now' : 'recently'}</span>
                                </>
                            ) : null}
                        </div>
                        
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
                            {blocks.map((block) => {
                                const isDraggable = !['image', 'voice', 'drawing'].includes(block.type);
                                return (
                                <Reorder.Item 
                                    key={block.id} 
                                    value={block} 
                                    className="group relative"
                                    dragListener={isDraggable}
                                    dragControls={isDraggable ? undefined : false as any}
                                >
                                    {/* Block Controls - Desktop */}
                                    <div className="hidden md:flex absolute -left-10 top-1 opacity-0 group-hover:opacity-100 transition-opacity items-center gap-0.5">
                                        <button
                                            onClick={() => showAddMenu(block.id)}
                                            className="p-1 text-muted-foreground/50 hover:text-muted-foreground hover:bg-secondary rounded"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                        <button className="p-1 text-muted-foreground/50 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
                                            <GripVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Block Controls - Mobile (always visible on active block) */}
                                    {activeBlockId === block.id && (
                                        <div className="md:hidden flex items-center gap-1 mb-1">
                                            <button
                                                onClick={() => showAddMenu(block.id)}
                                                className="p-2 text-muted-foreground/70 hover:text-muted-foreground hover:bg-secondary rounded-lg active:scale-95 transition-all"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                            <button className="p-2 text-muted-foreground/70 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
                                                <GripVertical className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}

                                    {/* Block Content */}
                                    <div className={cn(
                                        "py-1 rounded transition-colors",
                                        activeBlockId === block.id && "bg-secondary/20"
                                    )}>
                                        {renderBlock(block)}
                                    </div>
                                </Reorder.Item>
                            )})}
                        </Reorder.Group>

                        {/* Add Block Button */}
                        <button
                            onClick={showAddBlockMenu}
                            className="mt-4 flex items-center gap-2 text-muted-foreground/50 hover:text-muted-foreground transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            <span className="text-sm">Add a block</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Toolbar (Apple Notes Style) */}
            <AnimatePresence>
                {mobileToolbarVisible && window.innerWidth < 768 && (
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 100, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-card border-t border-border shadow-2xl"
                    >
                        <div className="flex items-center justify-around p-2 pb-safe">
                            <button
                                onClick={() => showAddMenu(activeBlockId || blocks[blocks.length - 1]?.id)}
                                className="flex flex-col items-center gap-1 p-2 hover:bg-secondary rounded-lg transition-colors flex-1"
                            >
                                <Plus className="w-5 h-5" />
                                <span className="text-[10px] text-muted-foreground">Add</span>
                            </button>
                            <button
                                onClick={() => {
                                    const block = blocks.find(b => b.id === activeBlockId);
                                    if (block && block.type === 'text') {
                                        updateBlock(block.id, { type: 'heading1' });
                                    }
                                }}
                                className="flex flex-col items-center gap-1 p-2 hover:bg-secondary rounded-lg transition-colors flex-1"
                            >
                                <Heading1 className="w-5 h-5" />
                                <span className="text-[10px] text-muted-foreground">H1</span>
                            </button>
                            <button
                                onClick={() => {
                                    const block = blocks.find(b => b.id === activeBlockId);
                                    if (block && block.type === 'text') {
                                        updateBlock(block.id, { type: 'bullet' });
                                    }
                                }}
                                className="flex flex-col items-center gap-1 p-2 hover:bg-secondary rounded-lg transition-colors flex-1"
                            >
                                <List className="w-5 h-5" />
                                <span className="text-[10px] text-muted-foreground">List</span>
                            </button>
                            <button
                                onClick={() => {
                                    const block = blocks.find(b => b.id === activeBlockId);
                                    if (block && block.type === 'text') {
                                        updateBlock(block.id, { type: 'todo' });
                                    }
                                }}
                                className="flex flex-col items-center gap-1 p-2 hover:bg-secondary rounded-lg transition-colors flex-1"
                            >
                                <CheckSquare className="w-5 h-5" />
                                <span className="text-[10px] text-muted-foreground">Todo</span>
                            </button>
                            <button
                                onClick={() => addBlock('image', activeBlockId || undefined)}
                                className="flex flex-col items-center gap-1 p-2 hover:bg-secondary rounded-lg transition-colors flex-1"
                            >
                                <Image className="w-5 h-5" />
                                <span className="text-[10px] text-muted-foreground">Image</span>
                            </button>
                            <button
                                onClick={() => addBlock('voice', activeBlockId || undefined)}
                                className="flex flex-col items-center gap-1 p-2 hover:bg-secondary rounded-lg transition-colors flex-1"
                            >
                                <Mic className="w-5 h-5" />
                                <span className="text-[10px] text-muted-foreground">Voice</span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Block Menu */}
            <AnimatePresence>
                {showBlockMenu && (
                    <>
                        <div className="fixed inset-0 z-40 bg-black/20 md:bg-transparent" onClick={() => setShowBlockMenu(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            style={{ 
                                left: window.innerWidth < 768 ? '50%' : blockMenuPosition.x,
                                top: window.innerWidth < 768 ? 'auto' : blockMenuPosition.y,
                                bottom: window.innerWidth < 768 ? 0 : 'auto',
                                transform: window.innerWidth < 768 ? 'translateX(-50%)' : 'none'
                            }}
                            className="fixed z-50 w-full md:w-64 max-w-md md:max-w-none bg-card border border-border md:rounded-xl rounded-t-2xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-3 md:p-2 border-b border-border/50">
                                <div className="md:hidden w-12 h-1 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
                                <input
                                    autoFocus
                                    value={menuFilterText}
                                    onChange={(e) => setMenuFilterText(e.target.value)}
                                    placeholder="Search blocks..."
                                    className="w-full bg-secondary/50 border-none rounded-lg px-3 py-2.5 md:py-2 text-sm focus:ring-0 outline-none"
                                />
                            </div>
                            <div className="max-h-[50vh] md:max-h-64 overflow-y-auto p-2 md:p-1 pb-safe">
                                {filteredBlockTypes.map(bt => (
                                    <button
                                        key={bt.type}
                                        onClick={() => { addBlock(bt.type, activeBlockId || undefined); }}
                                        className="w-full flex items-center gap-3 px-3 py-3 md:py-2 text-sm hover:bg-secondary active:bg-secondary/80 rounded-lg transition-colors text-left"
                                    >
                                        <bt.icon className="w-5 h-5 md:w-4 md:h-4 text-muted-foreground flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium">{bt.label}</div>
                                            {bt.shortcut && <div className="text-xs text-muted-foreground truncate">{bt.shortcut}</div>}
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
