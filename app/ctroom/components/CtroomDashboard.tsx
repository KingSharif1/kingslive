/**
 * CtroomDashboard - Personal OS Dashboard
 * Main controller component with Supabase Integration
 */
'use client';

import React, { useState, useEffect } from 'react';
import {
    View, ActionItem, Idea, Message, ActionItemCategory,
    ActionItemPriority, ChatTool, ChatSpeed, ChatContext,
    ActionItemType, SystemFrequency, Mission, System,
    ThemeMode, UsageStats, UserSettings,
    ActionItemStatus
} from '../types/';
import { Sidebar } from './layout/Sidebar';
import { MobileHeader } from './layout/MobileHeader';
import { DashboardView } from './views/DashboardView';
import { ChatView } from './views/ChatView';
import { IdeasView } from './views/IdeasView';
import { PlannerView } from './views/PlannerView';
import { MissionsView } from './views/MissionsView';
import { BlogView } from './views/BlogView';
import { SettingsView } from './views/SettingsView';
import { TaskFormModal } from './modals/TaskFormModal';
import { MissionDetailModal } from './modals/MissionDetailModal';
import { cn } from '@/lib/utils';
import { CtroomDataService } from '../services/ctroomDataService';

export function CtroomDashboard() {
    // Start with Dashboard or Planner
    const [currentView, setCurrentView] = useState<View>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Sidebar & Theme State
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('sidebar-collapsed');
            return saved ? JSON.parse(saved) : false;
        }
        return false;
    });

    const [theme, setTheme] = useState<ThemeMode>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('theme');
            return (saved as ThemeMode) || 'dark';
        }
        return 'dark';
    });

    // Usage Stats State
    const [usageStats, setUsageStats] = useState<UsageStats>({
        chat: { used: 0, limit: 500 },
        search: { used: 0, limit: 100 },
        code: { used: 0, limit: 200 },
        total: { used: 0, limit: 800 },
        resetDate: new Date(Date.now() + 86400000 * 7),
        byProvider: []
    });

    // User Profile
    const [userProfile, setUserProfile] = useState({ name: 'Loading...', email: 'loading@ctroom.com' });

    // User Settings State
    const [userSettings, setUserSettings] = useState<UserSettings>({
        profile: {
            name: 'Loading...',
            email: 'loading@ctroom.com',
            avatar: ''
        },
        preferences: {
            theme: theme,
            sidebarCollapsed: isSidebarCollapsed,
            notifications: true,
            autoSave: true
        },
        apiKeys: {
            openai: '',
            github: '',
            google: ''
        }
    });

    // --- Mission Control Data State ---
    const [missions, setMissions] = useState<Mission[]>([]);
    const [systems, setSystems] = useState<System[]>([]);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);

    // Legacy mapping for Dashboard/Chat views that might still expect 'tasks'
    // We will just cast actionItems to tasks where needed, or update those views eventually.
    // DashboardView and ChatView expect 'Task[]'. ActionItem is superset mostly?
    // Let's check types. ActionItem is the new Task.

    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    // Task Modal State (For Quick Add)
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);

    // Simplified Task Form for generic add (mapped to Action Item)
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        taskType: 'action' as ActionItemType,
        category: 'work' as ActionItemCategory,
        priority: 'medium' as ActionItemPriority,
        dueDate: new Date(),
        dueTime: '',
        habitFrequency: 'daily' as SystemFrequency,
        habitDuration: 30,
        habitCustomDays: [] as number[],
        projectId: 'inbox' // Keeping for compatibility with Modal for now
    });

    const [activeIdeaId, setActiveIdeaId] = useState<string | null>(null);
    const [ideaForm, setIdeaForm] = useState({ title: '', content: '', category: 'random' as Idea['category'] });

    // Chat State
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    // Load data from database on mount
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            try {
                // Fetch NEW Mission Control Data
                const [missionsData, systemsData, itemsData, ideasData, messagesData, profile, tokenUsage, settings] = await Promise.all([
                    CtroomDataService.fetchMissions(),
                    CtroomDataService.fetchSystems(),
                    CtroomDataService.fetchActionItems(),
                    CtroomDataService.fetchIdeas(),
                    CtroomDataService.fetchMessages(),
                    CtroomDataService.getUserProfile(),
                    CtroomDataService.getTokenUsage(30),
                    CtroomDataService.getUserSettings()
                ]);

                setMissions(missionsData);
                setSystems(systemsData);
                setActionItems(itemsData);

                setIdeas(ideasData);
                setMessages(messagesData.length > 0 ? messagesData : [{
                    id: '1',
                    role: 'assistant',
                    content: "Welcome back! I'm ready to help you build. Which mission should we focus on today?",
                    timestamp: new Date(),
                }]);

                if (profile) {
                    setUserProfile(profile);
                    setUserSettings(prev => ({
                        ...prev,
                        profile: { ...prev.profile, name: profile.name, email: profile.email }
                    }));
                }

                // Load token usage from database
                if (tokenUsage && tokenUsage.byProvider) {
                    setUsageStats(prev => ({
                        ...prev,
                        byProvider: tokenUsage.byProvider,
                        total: { ...prev.total, used: tokenUsage.total }
                    }));
                }

                if (settings) {
                    setUserSettings(prev => ({
                        ...prev,
                        apiKeys: settings.api_keys || prev.apiKeys,
                        preferences: settings.preferences || prev.preferences
                    }));
                }
            } catch (error) {
                console.error('Error loading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    // Apply theme
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    const handleSaveSettings = async (newSettings: UserSettings) => {
        setUserSettings(newSettings);
        setTheme(newSettings.preferences.theme);
        localStorage.setItem('user-settings', JSON.stringify(newSettings));

        await Promise.all([
            CtroomDataService.updateUserProfile(
                newSettings.profile.name,
                newSettings.profile.email
            ),
            CtroomDataService.saveUserSettings(
                newSettings.apiKeys,
                newSettings.preferences
            )
        ]);
    };

    // --- Mission Logic ---
    const [selectedMissionId, setSelectedMissionId] = useState<string | null>(null);

    const handleMissionUpdate = async (updatedMission: Mission) => {
        const success = await CtroomDataService.updateMission(updatedMission.id, updatedMission);
        if (success) {
            setMissions(prev => prev.map(m => m.id === updatedMission.id ? updatedMission : m));
        }
    };

    const handleMissionTaskAdd = async (task: Partial<ActionItem>) => {
        const newItem = await CtroomDataService.saveActionItem(task as any);
        if (newItem) {
            setActionItems(prev => [newItem, ...prev]);
        }
    };

    // --- Handlers ---

    // ACTION ITEM HANDLERS
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const handleAddActionItem = async () => {
        if (!taskForm.title.trim()) return;

        if (editingItemId) {
            // Update existing
            const updates: Partial<ActionItem> = {
                title: taskForm.title,
                description: taskForm.description,
                category: taskForm.category,
                priority: taskForm.priority,
                date: taskForm.dueDate,
                dueTime: taskForm.dueTime || undefined,
                missionId: taskForm.projectId !== 'inbox' ? taskForm.projectId : undefined
            };

            await CtroomDataService.updateActionItem(editingItemId, updates);
            setActionItems(prev => prev.map(t => t.id === editingItemId ? { ...t, ...updates } : t));
        } else {
            // Create New
            const item: any = {
                title: taskForm.title,
                description: taskForm.description,
                status: 'todo',
                category: taskForm.category,
                priority: taskForm.priority,
                date: taskForm.dueDate,
                dueTime: taskForm.dueTime || undefined,
                missionId: taskForm.projectId !== 'inbox' ? taskForm.projectId : undefined
            };

            const savedItem = await CtroomDataService.saveActionItem(item);
            if (savedItem) {
                setActionItems(prev => [savedItem, ...prev]);
            }
        }

        setIsTaskModalOpen(false);
        setEditingItemId(null);
        // Reset form
        setTaskForm({
            title: '',
            description: '',
            taskType: 'action',
            category: 'work',
            priority: 'medium',
            dueDate: new Date(),
            dueTime: '',
            habitFrequency: 'daily',
            habitDuration: 30,
            habitCustomDays: [],
            projectId: 'inbox'
        });
    };

    const toggleItemStatus = async (id: string) => {
        const item = actionItems.find(t => t.id === id);
        if (!item) return;

        const newStatus: ActionItemStatus = item.status === 'done' ? 'todo' : 'done';
        await CtroomDataService.updateActionItem(id, { status: newStatus });

        setActionItems(prev => prev.map(t =>
            t.id === id ? { ...t, status: newStatus } : t
        ));
    };

    const handleDeleteItem = async (id: string) => {
        const success = await CtroomDataService.deleteActionItem(id);
        if (success) {
            setActionItems(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleArchiveItem = async (id: string) => {
        const success = await CtroomDataService.updateActionItem(id, { status: 'archived' });
        if (success) {
            setActionItems(prev => prev.filter(t => t.id !== id));
        }
    };

    const handleDuplicateItem = async (item: ActionItem) => {
        const newItem = {
            ...item,
            title: `${item.title} (Copy)`,
            status: 'todo' as ActionItemStatus,
            date: new Date()
        };
        // @ts-ignore - id is optional/ignored in save
        const saved = await CtroomDataService.saveActionItem(newItem);
        if (saved) {
            setActionItems(prev => [saved, ...prev]);
        }
    };

    const handleEditItem = (item: ActionItem) => {
        setTaskForm({
            title: item.title,
            description: item.description || '',
            taskType: 'action',
            category: item.category,
            priority: item.priority,
            dueDate: item.date,
            dueTime: item.dueTime || '',
            habitFrequency: 'daily',
            habitDuration: 30,
            habitCustomDays: [],
            projectId: item.missionId || 'inbox'
        });
        setIsTaskModalOpen(true);
        setEditingItemId(item.id);
    };

    const handleAddOvertime = async (date: Date, hours: number) => {
        const success = await CtroomDataService.applyOvertime(date, hours);
        if (success) {
            // Refresh items to see shifts
            const updatedItems = await CtroomDataService.fetchActionItems();
            setActionItems(updatedItems);
        }
    };

    const handleUpdateSystem = async (system: System) => {
        const success = await CtroomDataService.saveSystem(system);
        if (success) {
            setSystems(prev => {
                const existing = prev.find(s => s.id === system.id);
                if (existing) {
                    return prev.map(s => s.id === system.id ? success : s);
                } else {
                    return [...prev, success];
                }
            });
        }
    };

    // --- Idea Handlers ---
    const handleSaveIdea = async () => {
        if (!ideaForm.title.trim()) return;
        if (activeIdeaId) {
            await CtroomDataService.updateIdea(activeIdeaId, {
                title: ideaForm.title,
                content: ideaForm.content,
                category: ideaForm.category,
            });
            setIdeas(prev => prev.map(i => i.id === activeIdeaId ? {
                ...i,
                title: ideaForm.title,
                content: ideaForm.content,
                category: ideaForm.category,
                date: new Date()
            } : i));
        } else {
            const newIdea = {
                title: ideaForm.title,
                content: ideaForm.content,
                tags: [ideaForm.category],
                date: new Date(),
                category: ideaForm.category
            };
            const savedIdea = await CtroomDataService.saveIdea(newIdea);
            if (savedIdea) {
                setIdeas(prev => [savedIdea, ...prev]);
                setActiveIdeaId(savedIdea.id);
            }
        }
    };

    const handleNewIdea = () => {
        setActiveIdeaId(null);
        setIdeaForm({ title: '', content: '', category: 'random' });
        if (currentView !== 'ideas') setCurrentView('ideas');
    };

    const loadIdea = (idea: Idea) => {
        setActiveIdeaId(idea.id);
        setIdeaForm({ title: idea.title, content: idea.content, category: idea.category });
    };

    // --- Chat Handlers ---
    const handleSendMessage = async (model: string, tool: ChatTool, speed: ChatSpeed, context: ChatContext[]) => {
        if (!chatInput.trim()) return;
        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: chatInput,
            timestamp: new Date(),
            model,
            context: context.length > 0 ? context : undefined
        };
        await CtroomDataService.saveMessage(userMsg);
        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsTyping(true);

        setUsageStats(prev => {
            const newStats = {
                ...prev,
                chat: { ...prev.chat, used: prev.chat.used + 1 },
                total: { ...prev.total, used: prev.total.used + 1 }
            };
            localStorage.setItem('usage-stats', JSON.stringify(newStats));
            return newStats;
        });

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: [...messages, userMsg],
                    model,
                    thinkingMode: speed,
                    tools: tool !== 'none' ? [tool] : []
                })
            });
            const aiResponse = await response.json();
            const assistantMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: aiResponse.content || 'Sorry, I encountered an error.',
                timestamp: new Date(),
                model,
                thoughts: aiResponse.thinking
            };
            await CtroomDataService.saveMessage(assistantMsg);
            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const isFullBleedView = currentView === 'ideas' || currentView === 'chat';

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Initializing Mission Control...</p>
                </div>
            </div>
        );
    }

    // Projects Mapping for Modal (Missions -> Projects interface)
    const modalProjects = [
        { id: 'inbox', name: 'Inbox', color: '#6b7280' },
        ...missions.map(m => ({ id: m.id, name: m.name, color: m.color }))
    ];

    return (
        <div className="h-screen w-full bg-background text-foreground font-sans selection:bg-primary/20 flex flex-col md:flex-row overflow-hidden">

            <Sidebar
                currentView={currentView}
                setCurrentView={setCurrentView}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
                usage={usageStats}
                theme={theme}
                setTheme={setTheme}
                userName={userProfile.name}
                userEmail={userProfile.email}
                apiKeys={userSettings.apiKeys}
            />

            <MobileHeader
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                currentView={currentView}
                setCurrentView={setCurrentView}
            />

            <main className="flex-1 overflow-hidden w-full relative bg-secondary/5 h-full">
                <div className="md:hidden h-16 flex-shrink-0" />

                <div className={cn("h-full w-full", isFullBleedView ? "p-0" : "p-4 md:p-6 overflow-y-auto")}>

                    {currentView === 'dashboard' && (
                        <DashboardView
                            tasks={actionItems as any} // Temporary cast until Dashboard is updated
                            ideas={ideas}
                            setCurrentView={setCurrentView}
                            toggleTaskStatus={toggleItemStatus}
                            handleNewIdea={handleNewIdea}
                            setIsTaskModalOpen={setIsTaskModalOpen}
                            loadIdea={loadIdea}
                        />
                    )}

                    {currentView === 'missions' && (
                        <MissionsView
                            onMissionClick={(id) => setSelectedMissionId(id)}
                        />
                    )}

                    {currentView === 'planner' && (
                        <PlannerView
                            actionItems={actionItems}
                            missions={missions}
                            systems={systems}
                            toggleItemStatus={toggleItemStatus}
                            openItemModal={() => {
                                setEditingItemId(null);
                                setTaskForm({
                                    title: '',
                                    description: '',
                                    taskType: 'action',
                                    category: 'work',
                                    priority: 'medium',
                                    dueDate: new Date(),
                                    dueTime: '',
                                    habitFrequency: 'daily',
                                    habitDuration: 30,
                                    habitCustomDays: [],
                                    projectId: 'inbox'
                                });
                                setIsTaskModalOpen(true);
                            }}
                            onDeleteItem={handleDeleteItem}
                            onArchiveItem={handleArchiveItem}
                            onDuplicateItem={handleDuplicateItem}
                            onEditItem={handleEditItem}
                            onAddOvertime={handleAddOvertime}
                            onUpdateSystem={handleUpdateSystem}
                        />
                    )}

                    {currentView === 'chat' && (
                        <ChatView
                            messages={messages}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            handleSendMessage={handleSendMessage}
                            isTyping={isTyping}
                            tasks={actionItems as any} // Temporary Cast
                            ideas={ideas}
                            apiKeys={userSettings.apiKeys}
                        />
                    )}

                    {currentView === 'ideas' && (
                        <IdeasView
                            ideas={ideas}
                            activeIdeaId={activeIdeaId}
                            ideaForm={ideaForm}
                            setIdeaForm={setIdeaForm}
                            handleSaveIdea={handleSaveIdea}
                            handleNewIdea={handleNewIdea}
                            loadIdea={loadIdea}
                        />
                    )}

                    {currentView === 'blog' && (
                        <div className="p-8">
                            <BlogView />
                        </div>
                    )}

                    {currentView === 'settings' && (
                        <SettingsView
                            settings={userSettings}
                            onSave={handleSaveSettings}
                        />
                    )}
                </div>
            </main>

            <TaskFormModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                taskForm={taskForm as any} // Temporary cast
                setTaskForm={setTaskForm as any}
                onSubmit={handleAddActionItem}
                projects={modalProjects}
            />

            {/* Mission Detail Modal */}
            {selectedMissionId && (
                <MissionDetailModal
                    isOpen={!!selectedMissionId}
                    onClose={() => setSelectedMissionId(null)}
                    mission={missions.find(m => m.id === selectedMissionId)!}
                    onUpdate={handleMissionUpdate}
                    tasks={actionItems.filter(t => t.missionId === selectedMissionId)}
                    onAddTask={handleMissionTaskAdd}
                    onUpdateTask={async (id, updates) => {
                        await CtroomDataService.updateActionItem(id, updates);
                        setActionItems(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
                    }}
                    onDeleteTask={handleDeleteItem}
                />
            )}
        </div>
    );
}
