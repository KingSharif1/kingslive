/**
 * CtroomDashboard - Personal OS Dashboard
 * Main controller component with Supabase Integration
 */
'use client';

import React, { useState, useEffect } from 'react';
import { View, Task, Idea, Message, TaskCategory, TaskPriority, ChatTool, ChatSpeed, ChatContext, TaskType, HabitFrequency, Project, ThemeMode, UsageStats, UserSettings } from '../types/';
import { Sidebar } from './layout/Sidebar';
import { MobileHeader } from './layout/MobileHeader';
import { DashboardView } from './views/DashboardView';
import { ChatView } from './views/ChatView';
import { IdeasView } from './views/IdeasView';
import { TasksView } from './views/TasksView';
import { BlogView } from './views/BlogView';
import { SettingsView } from './views/SettingsView';
import { TaskFormModal } from './modals/TaskFormModal';
import { cn } from '@/lib/utils';
import { CtroomDataService } from '../services/ctroomDataService';

// Default projects
const DEFAULT_PROJECTS: Project[] = [
    { id: 'inbox', name: 'Inbox', color: '#6b7280' },
    { id: 'work', name: 'Work Tasks', color: '#4772fa' },
    { id: 'study', name: 'Study Goals', color: '#10b981' },
    { id: 'travel', name: 'Travel Plans', color: '#f59e0b' },
    { id: 'daily', name: 'Daily To-Dos', color: '#ef4444' },
];

export function CtroomDashboard() {
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

    // Projects State
    const [projects] = useState<Project[]>(DEFAULT_PROJECTS);

    // Data State - Initialize with empty arrays, load from DB
    const [tasks, setTasks] = useState<Task[]>([]);
    const [ideas, setIdeas] = useState<Idea[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);

    // Task Modal State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        taskType: 'task' as TaskType,
        category: 'work' as TaskCategory,
        priority: 'medium' as TaskPriority,
        dueDate: new Date(),
        dueTime: '',
        habitFrequency: 'daily' as HabitFrequency,
        habitDuration: 30,
        habitCustomDays: [] as number[],
        projectId: 'inbox'
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
                const [tasksData, ideasData, messagesData, profile, tokenUsage, settings] = await Promise.all([
                    CtroomDataService.fetchTasks(),
                    CtroomDataService.fetchIdeas(),
                    CtroomDataService.fetchMessages(),
                    CtroomDataService.getUserProfile(),
                    CtroomDataService.getTokenUsage(30),
                    CtroomDataService.getUserSettings()
                ]);

                setTasks(tasksData);
                setIdeas(ideasData);
                setMessages(messagesData.length > 0 ? messagesData : [{
                    id: '1',
                    role: 'assistant',
                    content: "Welcome back! I'm ready to help you build. Which repository should we look at today, or do you have a new idea to explore?",
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

                // Load user settings from database
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

    // Apply theme on mount and when it changes
    useEffect(() => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Handle settings save
    const handleSaveSettings = async (newSettings: UserSettings) => {
        setUserSettings(newSettings);
        setTheme(newSettings.preferences.theme);
        localStorage.setItem('user-settings', JSON.stringify(newSettings));

        // Save to database
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

    // --- Handlers ---

    const handleAddTask = async () => {
        if (!taskForm.title.trim()) return;
        const task: Task = {
            id: Date.now().toString(),
            title: taskForm.title,
            description: taskForm.description,
            status: 'todo',
            category: taskForm.category,
            priority: taskForm.priority,
            date: taskForm.dueDate,
            dueTime: taskForm.dueTime || undefined,
            taskType: taskForm.taskType,
            habitFrequency: taskForm.taskType === 'habit' ? taskForm.habitFrequency : undefined,
            habitDuration: taskForm.taskType === 'habit' ? taskForm.habitDuration : undefined,
            habitStreak: taskForm.taskType === 'habit' ? 0 : undefined,
            habitCustomDays: taskForm.taskType === 'habit' && taskForm.habitFrequency === 'custom' ? taskForm.habitCustomDays : undefined,
            projectId: taskForm.projectId
        };

        // Save to database
        const savedTask = await CtroomDataService.saveTask(task);
        if (savedTask) {
            setTasks(prev => [savedTask, ...prev]);
        }

        setIsTaskModalOpen(false);
        // Reset form
        setTaskForm({
            title: '',
            description: '',
            taskType: 'task',
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

    const toggleTaskStatus = async (id: string) => {
        const task = tasks.find(t => t.id === id);
        if (!task) return;

        const newStatus = task.status === 'done' ? 'todo' : 'done';
        await CtroomDataService.updateTask(id, { status: newStatus });

        setTasks(prev => prev.map(t =>
            t.id === id ? { ...t, status: newStatus } : t
        ));
    };

    const handleSaveIdea = async () => {
        if (!ideaForm.title.trim()) return;

        if (activeIdeaId) {
            // Update existing idea
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
            // Create new idea
            const newIdea: Omit<Idea, 'id'> = {
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

        // Save message to database
        await CtroomDataService.saveMessage(userMsg);

        setMessages(prev => [...prev, userMsg]);
        setChatInput('');
        setIsTyping(true);

        // Track usage
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
            // Call actual API
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

            // Save AI message to database
            await CtroomDataService.saveMessage(assistantMsg);

            setMessages(prev => [...prev, assistantMsg]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Please try again.',
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMsg]);
        } finally {
            setIsTyping(false);
        }
    };

    // Determine container classes based on view
    const isFullBleedView = currentView === 'ideas' || currentView === 'chat';

    if (isLoading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading Control Room...</p>
                </div>
            </div>
        );
    }

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
            />

            <MobileHeader
                isMobileMenuOpen={isMobileMenuOpen}
                setIsMobileMenuOpen={setIsMobileMenuOpen}
                currentView={currentView}
                setCurrentView={setCurrentView}
            />

            {/* Main Content Area */}
            <main className="flex-1 overflow-hidden w-full relative bg-secondary/5 h-full">
                <div className="md:hidden h-16 flex-shrink-0" /> {/* Mobile header spacer */}

                <div className={cn(
                    "h-full w-full",
                    isFullBleedView ? "p-0" : "p-4 md:p-6 overflow-y-auto"
                )}>
                    {currentView === 'dashboard' && (
                        <DashboardView
                            tasks={tasks}
                            ideas={ideas}
                            setCurrentView={setCurrentView}
                            toggleTaskStatus={toggleTaskStatus}
                            handleNewIdea={handleNewIdea}
                            setIsTaskModalOpen={setIsTaskModalOpen}
                            loadIdea={loadIdea}
                        />
                    )}

                    {currentView === 'chat' && (
                        <ChatView
                            messages={messages}
                            chatInput={chatInput}
                            setChatInput={setChatInput}
                            handleSendMessage={handleSendMessage}
                            isTyping={isTyping}
                            tasks={tasks}
                            ideas={ideas}
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

                    {currentView === 'tasks' && (
                        <TasksView
                            tasks={tasks}
                            projects={projects}
                            toggleTaskStatus={toggleTaskStatus}
                            openTaskModal={() => setIsTaskModalOpen(true)}
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

            {/* Task Form Modal */}
            <TaskFormModal
                isOpen={isTaskModalOpen}
                onClose={() => setIsTaskModalOpen(false)}
                taskForm={taskForm}
                setTaskForm={setTaskForm}
                onSubmit={handleAddTask}
                projects={projects}
            />
        </div>
    );
}
