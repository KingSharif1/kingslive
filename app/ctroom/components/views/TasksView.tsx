/**
 * TasksView - Todoist/TickTick Inspired Task Management
 * Features:
 * - Clean list view like Todoist (default)
 * - Smart date grouping (Today, Tomorrow, Next 7 Days, etc.)
 * - Pinch/tap to zoom calendar (no zoom buttons)
 * - Functional sidebar navigation (Inbox, Today, Upcoming, Projects)
 * - Confetti on completion
 */
import React, { useState, useRef } from 'react';
import {
    CheckCircle2, Calendar as CalendarIcon, Plus, MoreHorizontal,
    List, ChevronLeft, ChevronRight, Sun, Sunrise, Inbox, Filter,
    Flag, CalendarDays, ChevronDown, Repeat, Flame
} from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
    addMonths, subMonths, isToday, isTomorrow, startOfWeek, endOfWeek,
    addDays, isThisWeek, isPast, isAfter
} from 'date-fns';
import { cn } from '@/lib/utils';
import { Task, Project } from '../../types/';
import { motion, AnimatePresence } from 'framer-motion';

// Confetti effect
const ConfettiExplosion = ({ x, y }: { x: number, y: number }) => (
    <div className="fixed pointer-events-none z-50" style={{ left: x, top: y }}>
        {[...Array(12)].map((_, i) => (
            <motion.div
                key={i}
                initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
                animate={{
                    opacity: 0,
                    scale: 1,
                    x: (Math.random() - 0.5) * 150,
                    y: (Math.random() - 0.5) * 150,
                    rotate: Math.random() * 360
                }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute w-2 h-2 rounded-full"
                style={{ backgroundColor: ['#e34432', '#4772fa', '#ffb000', '#10b981'][i % 4] }}
            />
        ))}
    </div>
);

type ViewMode = 'list' | 'calendar';
type CalendarZoom = 'month' | 'week' | 'day';
type NavFilter = 'inbox' | 'today' | 'upcoming' | 'filters' | string; // string for project IDs

interface TasksViewProps {
    tasks: Task[];
    projects: Project[];
    toggleTaskStatus: (id: string) => void;
    openTaskModal: () => void;
}

export const TasksView = ({ tasks, projects, toggleTaskStatus, openTaskModal }: TasksViewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [calendarZoom, setCalendarZoom] = useState<CalendarZoom>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedNav, setSelectedNav] = useState<NavFilter>('today');
    const [confettiPos, setConfettiPos] = useState<{ x: number, y: number } | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(['today', 'tomorrow', 'thisWeek']);

    // Touch handling for pinch zoom (mobile)
    const calendarRef = useRef<HTMLDivElement>(null);
    const lastTouchDistance = useRef<number | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            lastTouchDistance.current = Math.sqrt(dx * dx + dy * dy);
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && lastTouchDistance.current) {
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const delta = distance - lastTouchDistance.current;

            if (Math.abs(delta) > 50) {
                if (delta > 0) {
                    if (calendarZoom === 'month') setCalendarZoom('week');
                    else if (calendarZoom === 'week') setCalendarZoom('day');
                } else {
                    if (calendarZoom === 'day') setCalendarZoom('week');
                    else if (calendarZoom === 'week') setCalendarZoom('month');
                }
                lastTouchDistance.current = distance;
            }
        }
    };

    const handleTaskCheck = (e: React.MouseEvent, id: string) => {
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setConfettiPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        toggleTaskStatus(id);
        setTimeout(() => setConfettiPos(null), 800);
    };

    const handleDayClick = (day: Date) => {
        setCurrentDate(day);
        if (calendarZoom === 'month') setCalendarZoom('week');
        else if (calendarZoom === 'week') setCalendarZoom('day');
    };

    // Filter tasks based on selected nav
    const getFilteredTasks = () => {
        let filtered = tasks.filter(t => t.status !== 'done');

        switch (selectedNav) {
            case 'inbox':
                return filtered.filter(t => !t.projectId || t.projectId === 'inbox');
            case 'today':
                return filtered.filter(t => isToday(t.date) || isPast(t.date));
            case 'upcoming':
                return filtered.filter(t => isAfter(t.date, new Date()));
            case 'filters':
                return filtered; // Show all for now
            default:
                // Project filter
                return filtered.filter(t => t.projectId === selectedNav);
        }
    };

    // Group tasks by date for list view
    const groupTasksByDate = () => {
        const filtered = getFilteredTasks();
        const today: Task[] = [];
        const tomorrow: Task[] = [];
        const thisWeek: Task[] = [];
        const later: Task[] = [];
        const overdue: Task[] = [];

        filtered.forEach(task => {
            if (isPast(task.date) && !isToday(task.date)) overdue.push(task);
            else if (isToday(task.date)) today.push(task);
            else if (isTomorrow(task.date)) tomorrow.push(task);
            else if (isThisWeek(task.date)) thisWeek.push(task);
            else later.push(task);
        });

        return { overdue, today, tomorrow, thisWeek, later };
    };

    const grouped = groupTasksByDate();

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const getTasksForDay = (day: Date) => tasks.filter(task => isSameDay(task.date, day));

    // Get counts for nav items
    const getNavCount = (navId: string) => {
        const pending = tasks.filter(t => t.status !== 'done');
        switch (navId) {
            case 'inbox': return pending.filter(t => !t.projectId || t.projectId === 'inbox').length;
            case 'today': return pending.filter(t => isToday(t.date) || isPast(t.date)).length;
            case 'upcoming': return pending.filter(t => isAfter(t.date, new Date())).length;
            default: return pending.filter(t => t.projectId === navId).length;
        }
    };

    // Nav items
    const NAV_ITEMS = [
        { id: 'inbox', icon: Inbox, label: 'Inbox' },
        { id: 'today', icon: Sun, label: 'Today' },
        { id: 'upcoming', icon: CalendarDays, label: 'Upcoming' },
        { id: 'filters', icon: Filter, label: 'Filters & Labels' },
    ];

    // Task Item Component
    const TaskItem = ({ task }: { task: Task }) => (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="group flex items-start gap-3 py-3 px-3 hover:bg-secondary/30 rounded-xl transition-colors cursor-pointer"
        >
            <button
                onClick={(e) => handleTaskCheck(e, task.id)}
                className={cn(
                    "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                    task.status === 'done'
                        ? "bg-primary border-primary text-primary-foreground"
                        : task.priority === 'high'
                            ? "border-red-500 hover:bg-red-500/10"
                            : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
                )}
            >
                {task.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
            </button>

            <div className="flex-1 min-w-0">
                <div className={cn(
                    "text-sm font-medium leading-snug",
                    task.status === 'done' && "line-through text-muted-foreground"
                )}>
                    {task.title}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {/* Habit indicator */}
                    {task.taskType === 'habit' && (
                        <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <Repeat className="w-3 h-3" />
                            {task.habitStreak && task.habitStreak > 0 && (
                                <span className="flex items-center gap-0.5">
                                    <Flame className="w-3 h-3" /> {task.habitStreak}
                                </span>
                            )}
                        </span>
                    )}
                    {/* Category */}
                    {task.category && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className={cn(
                                "w-2 h-2 rounded-full",
                                task.category === 'work' ? "bg-blue-500" :
                                    task.category === 'habit' ? "bg-emerald-500" : "bg-purple-500"
                            )} />
                            {task.category}
                        </span>
                    )}
                    {/* Priority */}
                    {task.priority === 'high' && (
                        <span className="flex items-center gap-0.5 text-xs text-red-500">
                            <Flag className="w-3 h-3" /> P1
                        </span>
                    )}
                    {/* Time */}
                    {task.dueTime && (
                        <span className="text-xs text-muted-foreground">
                            {task.dueTime}
                        </span>
                    )}
                </div>
            </div>

            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                <button className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                </button>
                <button className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground">
                    <MoreHorizontal className="w-4 h-4" />
                </button>
            </div>
        </motion.div>
    );

    // Section Header
    const SectionHeader = ({ id, label, count, icon: Icon }: { id: string, label: string, count: number, icon?: any }) => (
        <button
            onClick={() => toggleSection(id)}
            className="w-full flex items-center gap-2 py-2 px-1 text-sm font-semibold text-foreground hover:bg-secondary/20 rounded-lg transition-colors"
        >
            <ChevronDown className={cn(
                "w-4 h-4 text-muted-foreground transition-transform",
                !expandedSections.includes(id) && "-rotate-90"
            )} />
            {Icon && <Icon className="w-4 h-4" />}
            <span>{label}</span>
            <span className="text-xs text-muted-foreground ml-auto bg-secondary/50 px-2 py-0.5 rounded-full">{count}</span>
        </button>
    );

    // Get title based on selected nav
    const getViewTitle = () => {
        switch (selectedNav) {
            case 'inbox': return 'Inbox';
            case 'today': return 'Today';
            case 'upcoming': return 'Upcoming';
            case 'filters': return 'All Tasks';
            default:
                const project = projects.find(p => p.id === selectedNav);
                return project?.name || 'Tasks';
        }
    };

    return (
        <div className="h-full flex flex-col md:flex-row animate-in fade-in duration-300 overflow-hidden">
            {confettiPos && <ConfettiExplosion x={confettiPos.x} y={confettiPos.y} />}

            {/* Left Sidebar */}
            <div className="hidden md:flex flex-col w-60 border-r border-border/40 bg-secondary/10 p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Tasks</h2>
                    <button
                        onClick={openTaskModal}
                        className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                <nav className="space-y-1">
                    {NAV_ITEMS.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedNav(item.id)}
                            className={cn(
                                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                                selectedNav === item.id
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="flex-1 text-left">{item.label}</span>
                            {item.id !== 'filters' && (
                                <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">{getNavCount(item.id)}</span>
                            )}
                        </button>
                    ))}
                </nav>

                {/* Projects */}
                <div className="mt-6">
                    <div className="flex items-center justify-between px-3 mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Projects</span>
                        <button className="text-muted-foreground hover:text-foreground p-1">
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="space-y-0.5">
                        {projects.filter(p => p.id !== 'inbox').map(project => (
                            <button
                                key={project.id}
                                onClick={() => setSelectedNav(project.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                                    selectedNav === project.id
                                        ? "bg-primary/10 text-primary font-medium"
                                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: project.color }} />
                                <span className="flex-1 text-left truncate">{project.name}</span>
                                <span className="text-xs opacity-70">{getNavCount(project.id)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* View Toggle */}
                <div className="mt-auto pt-4 border-t border-border/40">
                    <div className="flex bg-secondary/50 rounded-xl p-1">
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                            )}
                        >
                            <List className="w-3.5 h-3.5" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={cn(
                                "flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all",
                                viewMode === 'calendar' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="w-3.5 h-3.5" /> Calendar
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">

                {/* Mobile Header */}
                <div className="md:hidden flex items-center justify-between p-4 border-b border-border/40 bg-background">
                    <div className="flex items-center gap-3">
                        <h2 className="text-xl font-bold">{getViewTitle()}</h2>
                        <span className="text-sm text-muted-foreground">{format(new Date(), 'MMM d')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                            className="p-2 hover:bg-secondary rounded-xl"
                        >
                            {viewMode === 'list' ? <CalendarIcon className="w-5 h-5" /> : <List className="w-5 h-5" />}
                        </button>
                        <button
                            onClick={openTaskModal}
                            className="p-2 bg-primary text-primary-foreground rounded-xl"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto">

                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <div className="max-w-2xl mx-auto p-4 md:p-6">
                            {/* Header */}
                            <div className="hidden md:block mb-6">
                                <div className="flex items-center gap-3 mb-1">
                                    <h1 className="text-2xl font-bold">{getViewTitle()}</h1>
                                    <span className="text-sm text-muted-foreground bg-secondary/50 px-3 py-1 rounded-lg">
                                        {format(new Date(), 'EEE, MMM d')}
                                    </span>
                                </div>
                            </div>

                            {/* Overdue */}
                            {grouped.overdue.length > 0 && (
                                <div className="mb-4">
                                    <SectionHeader id="overdue" label="Overdue" count={grouped.overdue.length} />
                                    <AnimatePresence>
                                        {expandedSections.includes('overdue') && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="bg-red-500/5 rounded-xl border border-red-500/20 divide-y divide-red-500/10">
                                                    {grouped.overdue.map(task => <TaskItem key={task.id} task={task} />)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Today */}
                            <div className="mb-4">
                                <SectionHeader id="today" label="Today" count={grouped.today.length} icon={Sun} />
                                <AnimatePresence>
                                    {expandedSections.includes('today') && (
                                        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                            <div className="bg-card rounded-xl border border-border/50">
                                                {grouped.today.length > 0 ? (
                                                    <div className="divide-y divide-border/30">
                                                        {grouped.today.map(task => <TaskItem key={task.id} task={task} />)}
                                                    </div>
                                                ) : (
                                                    <div className="py-10 text-center text-muted-foreground text-sm">
                                                        <Sun className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                                        No tasks for today. Enjoy your day!
                                                    </div>
                                                )}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Tomorrow */}
                            {grouped.tomorrow.length > 0 && (
                                <div className="mb-4">
                                    <SectionHeader id="tomorrow" label="Tomorrow" count={grouped.tomorrow.length} icon={Sunrise} />
                                    <AnimatePresence>
                                        {expandedSections.includes('tomorrow') && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/30">
                                                    {grouped.tomorrow.map(task => <TaskItem key={task.id} task={task} />)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* This Week */}
                            {grouped.thisWeek.length > 0 && (
                                <div className="mb-4">
                                    <SectionHeader id="thisWeek" label="This Week" count={grouped.thisWeek.length} />
                                    <AnimatePresence>
                                        {expandedSections.includes('thisWeek') && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/30">
                                                    {grouped.thisWeek.map(task => <TaskItem key={task.id} task={task} />)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Later */}
                            {grouped.later.length > 0 && (
                                <div className="mb-4">
                                    <SectionHeader id="later" label="Later" count={grouped.later.length} />
                                    <AnimatePresence>
                                        {expandedSections.includes('later') && (
                                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                                <div className="bg-card rounded-xl border border-border/50 divide-y divide-border/30">
                                                    {grouped.later.map(task => <TaskItem key={task.id} task={task} />)}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Add Task Button */}
                            <button
                                onClick={openTaskModal}
                                className="w-full flex items-center gap-3 py-3 px-3 text-primary hover:bg-primary/5 rounded-xl transition-colors group"
                            >
                                <div className="w-5 h-5 rounded-full border-2 border-primary/50 group-hover:border-primary group-hover:bg-primary/10 flex items-center justify-center transition-colors">
                                    <Plus className="w-3 h-3" />
                                </div>
                                <span className="text-sm font-medium">Add task</span>
                            </button>
                        </div>
                    )}

                    {/* CALENDAR VIEW */}
                    {viewMode === 'calendar' && (
                        <div
                            ref={calendarRef}
                            onTouchStart={handleTouchStart}
                            onTouchMove={handleTouchMove}
                            className="h-full flex flex-col"
                        >
                            {/* Calendar Header */}
                            <div className="flex items-center justify-between p-4 border-b border-border/40 bg-background sticky top-0 z-10">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentDate(calendarZoom === 'day' ? addDays(currentDate, -1) : subMonths(currentDate, 1))}
                                        className="p-2 hover:bg-secondary rounded-xl"
                                    >
                                        <ChevronLeft className="w-5 h-5" />
                                    </button>
                                    <h3 className="font-semibold text-lg min-w-[180px] text-center">
                                        {calendarZoom === 'day'
                                            ? format(currentDate, 'EEEE, MMMM d')
                                            : format(currentDate, 'MMMM yyyy')}
                                    </h3>
                                    <button
                                        onClick={() => setCurrentDate(calendarZoom === 'day' ? addDays(currentDate, 1) : addMonths(currentDate, 1))}
                                        className="p-2 hover:bg-secondary rounded-xl"
                                    >
                                        <ChevronRight className="w-5 h-5" />
                                    </button>
                                </div>

                                <div className="hidden md:flex items-center gap-2 text-xs">
                                    <span className="text-muted-foreground">View:</span>
                                    {['month', 'week', 'day'].map(z => (
                                        <button
                                            key={z}
                                            onClick={() => setCalendarZoom(z as CalendarZoom)}
                                            className={cn(
                                                "px-3 py-1.5 rounded-lg capitalize transition-colors",
                                                calendarZoom === z ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                                            )}
                                        >
                                            {z}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Mobile hint */}
                            <div className="md:hidden text-center py-2 text-xs text-muted-foreground bg-secondary/20">
                                Pinch to zoom • Tap day to drill down
                            </div>

                            {/* Month View */}
                            {calendarZoom === 'month' && (
                                <div className="flex-1 overflow-auto p-2 md:p-4">
                                    <div className="grid grid-cols-7 mb-2">
                                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                                                {d}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="grid grid-cols-7 gap-1">
                                        {eachDayOfInterval({
                                            start: startOfWeek(startOfMonth(currentDate)),
                                            end: endOfWeek(endOfMonth(currentDate))
                                        }).map((day, idx) => {
                                            const dayTasks = getTasksForDay(day);
                                            const isCurrentMonth = day.getMonth() === currentDate.getMonth();

                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleDayClick(day)}
                                                    className={cn(
                                                        "min-h-[80px] md:min-h-[100px] p-1 md:p-2 rounded-xl border transition-all text-left flex flex-col",
                                                        !isCurrentMonth && "opacity-40",
                                                        isToday(day) ? "bg-primary/5 border-primary/30" : "border-transparent hover:bg-secondary/30 hover:border-border/50"
                                                    )}
                                                >
                                                    <span className={cn(
                                                        "w-7 h-7 text-xs flex items-center justify-center rounded-full mb-1",
                                                        isToday(day) ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                                                    )}>
                                                        {format(day, 'd')}
                                                    </span>

                                                    <div className="flex-1 space-y-0.5 overflow-hidden">
                                                        {dayTasks.slice(0, 3).map(task => (
                                                            <div
                                                                key={task.id}
                                                                className={cn(
                                                                    "text-[10px] px-1.5 py-0.5 rounded truncate",
                                                                    task.status === 'done'
                                                                        ? "bg-emerald-500/10 text-emerald-600 line-through"
                                                                        : task.priority === 'high'
                                                                            ? "bg-red-500/10 text-red-600"
                                                                            : "bg-secondary text-foreground"
                                                                )}
                                                            >
                                                                {task.title}
                                                            </div>
                                                        ))}
                                                        {dayTasks.length > 3 && (
                                                            <div className="text-[10px] text-muted-foreground px-1">
                                                                +{dayTasks.length - 3} more
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Week View */}
                            {calendarZoom === 'week' && (
                                <div className="flex-1 overflow-auto">
                                    <div className="grid grid-cols-7 min-h-full">
                                        {eachDayOfInterval({
                                            start: startOfWeek(currentDate),
                                            end: endOfWeek(currentDate)
                                        }).map((day, idx) => {
                                            const dayTasks = getTasksForDay(day);
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => handleDayClick(day)}
                                                    className={cn(
                                                        "border-r border-border/20 last:border-r-0 p-2 cursor-pointer hover:bg-secondary/20 transition-colors",
                                                        isToday(day) && "bg-primary/5"
                                                    )}
                                                >
                                                    <div className="text-center mb-3">
                                                        <div className="text-xs text-muted-foreground">{format(day, 'EEE')}</div>
                                                        <div className={cn(
                                                            "w-8 h-8 mx-auto flex items-center justify-center rounded-full text-sm font-medium",
                                                            isToday(day) ? "bg-primary text-primary-foreground" : ""
                                                        )}>
                                                            {format(day, 'd')}
                                                        </div>
                                                    </div>

                                                    <div className="space-y-1">
                                                        {dayTasks.map(task => (
                                                            <div
                                                                key={task.id}
                                                                className={cn(
                                                                    "text-xs p-2 rounded-lg border-l-2",
                                                                    task.status === 'done'
                                                                        ? "bg-emerald-500/10 border-emerald-500 line-through opacity-60"
                                                                        : task.priority === 'high'
                                                                            ? "bg-red-500/10 border-red-500"
                                                                            : "bg-card border-primary"
                                                                )}
                                                            >
                                                                {task.title}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Day View */}
                            {calendarZoom === 'day' && (
                                <div className="flex-1 overflow-auto p-4">
                                    <div className="max-w-2xl mx-auto">
                                        <div className="mb-6">
                                            <h2 className="text-xl font-bold">{format(currentDate, 'EEEE')}</h2>
                                            <p className="text-muted-foreground">{format(currentDate, 'MMMM d, yyyy')}</p>
                                        </div>

                                        <div className="space-y-2">
                                            {getTasksForDay(currentDate).length > 0 ? (
                                                getTasksForDay(currentDate).map(task => <TaskItem key={task.id} task={task} />)
                                            ) : (
                                                <div className="text-center py-12 text-muted-foreground">
                                                    <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                                    <p>No tasks scheduled for this day</p>
                                                    <button
                                                        onClick={openTaskModal}
                                                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90"
                                                    >
                                                        Add Task
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setCalendarZoom('month')}
                                            className="mt-6 text-sm text-primary hover:underline"
                                        >
                                            ← Back to month view
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
