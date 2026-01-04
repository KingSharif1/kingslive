/**
 * PlannerView - Mission Control Center
 * Evolution of TasksView with Focus on Missions & Systems
 */
import React, { useState, useRef, useEffect } from 'react';
import {
    CheckCircle2, Calendar as CalendarIcon, Plus, MoreHorizontal,
    List, ChevronLeft, ChevronRight, Sun, Sunrise, Inbox, Filter,
    Flag, CalendarDays, ChevronDown, Repeat, Flame, Edit2, Trash2, Copy,
    Archive, Briefcase, Clock, AlertTriangle
} from 'lucide-react';
import {
    format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay,
    addMonths, subMonths, isToday, isTomorrow, startOfWeek, endOfWeek,
    addDays, isAfter, isPast
} from 'date-fns';
import { cn } from '@/lib/utils';
import { ActionItem, Mission, System } from '../../types/';
import { motion, AnimatePresence } from 'framer-motion';
import { CtroomDataService } from '../../services/ctroomDataService';
import { WorkSystemPanel } from '../planner/WorkSystemPanel'; // Import Panel

// Confetti effect reused
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
type NavFilter = 'inbox' | 'today' | 'upcoming' | 'filters' | string;

interface PlannerViewProps {
    actionItems: ActionItem[];
    missions: Mission[];
    systems: System[];
    toggleItemStatus: (id: string) => void;
    openItemModal: () => void;
    onDeleteItem: (id: string) => void;
    onArchiveItem: (id: string) => void;
    onDuplicateItem: (item: ActionItem) => void;
    onEditItem: (item: ActionItem) => void;
    onAddOvertime?: (date: Date, hours: number) => void;
    onUpdateSystem?: (system: System) => void;
}
export const PlannerView = ({
    actionItems, missions, systems,
    toggleItemStatus, openItemModal, onDeleteItem,
    onArchiveItem, onDuplicateItem, onEditItem, onAddOvertime, onUpdateSystem
}: PlannerViewProps) => {
    const [viewMode, setViewMode] = useState<ViewMode>('list'); // Calendar might be better default?
    const [calendarZoom, setCalendarZoom] = useState<CalendarZoom>('week'); // Default to Week for Planner
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedNav, setSelectedNav] = useState<NavFilter>('today');
    const [confettiPos, setConfettiPos] = useState<{ x: number, y: number } | null>(null);
    const [expandedSections, setExpandedSections] = useState<string[]>(['today', 'tomorrow', 'work', 'completed']);
    const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);
    const [showOtInput, setShowOtInput] = useState(false);
    const [otHours, setOtHours] = useState(1);
    const [editingWorkSystem, setEditingWorkSystem] = useState(false);
    const [workStart, setWorkStart] = useState("09:00");
    const [workEnd, setWorkEnd] = useState("17:00");
    const [isWorkPanelOpen, setIsWorkPanelOpen] = useState(false);

    // Helpers
    const getWeekDays = (date: Date) => {
        const workSys = systems.find(s => s.type === 'work');
        const startDay = (workSys?.schedule.weekStartDay ?? 1) as 0 | 1 | 2 | 3 | 4 | 5 | 6;

        return eachDayOfInterval({
            start: startOfWeek(date, { weekStartsOn: startDay }),
            end: endOfWeek(date, { weekStartsOn: startDay })
        });
    };

    // Touch handling
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
                if (delta > 0) { // Zoom in
                    if (calendarZoom === 'month') setCalendarZoom('week');
                    else if (calendarZoom === 'week') setCalendarZoom('day');
                } else { // Zoom out
                    if (calendarZoom === 'day') setCalendarZoom('week');
                    else if (calendarZoom === 'week') setCalendarZoom('month');
                }
                lastTouchDistance.current = distance;
            }
        }
    };

    const handleCheck = (e: React.MouseEvent, id: string) => {
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        setConfettiPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
        toggleItemStatus(id);
        setTimeout(() => setConfettiPos(null), 800);
    };

    const handleDayClick = (day: Date) => {
        setCurrentDate(day);
        if (calendarZoom === 'month') setCalendarZoom('week');
        else if (calendarZoom === 'week') setCalendarZoom('day');
    };

    const handleSaveSystem = () => {
        if (!onUpdateSystem) return;

        // Find existing work system or create default
        const workSys = systems.find(s => s.type === 'work') || {
            id: 'sys_work',
            name: 'Work',
            type: 'work',
            color: '#3b82f6',
            isActive: true,
            schedule: { days: [1, 2, 3, 4, 5], startTime: '09:00', endTime: '17:00' }
        };

        const updatedSystem: System = {
            ...workSys,
            schedule: {
                ...workSys.schedule!,
                startTime: workStart,
                endTime: workEnd
            }
        };

        onUpdateSystem(updatedSystem);
        setEditingWorkSystem(false);
    };

    const handleApplyOT = () => {
        if (onAddOvertime) {
            onAddOvertime(currentDate, otHours);
            setShowOtInput(false);
        }
    };

    // --- Filtering ---
    const getFilteredItems = () => {
        switch (selectedNav) {
            case 'inbox':
                // Items with no mission and no system
                return actionItems.filter(t => t.status !== 'done' && !t.missionId && !t.systemId);
            case 'today':
                return actionItems.filter(t => t.status !== 'done' && (isToday(t.date) || isPast(t.date)));
            case 'upcoming':
                return actionItems.filter(t => t.status !== 'done' && isAfter(t.date, new Date()));
            case 'completed':
                return actionItems.filter(t => t.status === 'done');
            case 'completed-today':
                return actionItems.filter(t => t.status === 'done' && isToday(t.date));
            case 'filters':
                return actionItems;
            default:
                // Mission Filter
                return actionItems.filter(t => t.status !== 'done' && t.missionId === selectedNav);
        }
    };

    // --- Grouping ---
    const groupItemsByDate = () => {
        const filtered = getFilteredItems();
        const today: ActionItem[] = [];
        const tomorrow: ActionItem[] = [];
        const later: ActionItem[] = [];
        const overdue: ActionItem[] = [];
        const completed: ActionItem[] = [];

        filtered.forEach(item => {
            if (item.status === 'done') completed.push(item);
            else if (isPast(item.date) && !isToday(item.date)) overdue.push(item);
            else if (isToday(item.date)) today.push(item);
            else if (isTomorrow(item.date)) tomorrow.push(item);
            else later.push(item);
        });

        return { overdue, completed, today, tomorrow, later };
    };

    const grouped = groupItemsByDate();
    const getItemsForDay = (day: Date) => actionItems.filter(item => isSameDay(item.date, day));

    // Nav Counts
    const getNavCount = (navId: string) => {
        const pending = actionItems.filter(t => t.status !== 'done');
        const done = actionItems.filter(t => t.status === 'done');
        switch (navId) {
            case 'inbox': return pending.filter(t => !t.missionId && !t.systemId).length;
            case 'today': return pending.filter(t => isToday(t.date) || isPast(t.date)).length;
            case 'upcoming': return pending.filter(t => isAfter(t.date, new Date())).length;
            case 'completed': return done.length;
            default: return pending.filter(t => t.missionId === navId).length;
        }
    };

    const NAV_ITEMS = [
        { id: 'inbox', icon: Inbox, label: 'Inbox' },
        { id: 'today', icon: Sun, label: 'Today' },
        { id: 'upcoming', icon: CalendarDays, label: 'Upcoming' },
        { id: 'completed', icon: CheckCircle2, label: 'Completed' },
    ];

    const getViewTitle = () => {
        const navItem = NAV_ITEMS.find(n => n.id === selectedNav);
        if (navItem) return navItem.label;
        const mission = missions.find(m => m.id === selectedNav);
        return mission?.name || 'Planner';
    };

    // --- Sub-Components ---

    // Action Item Row
    const ActionItemRow = ({ item }: { item: ActionItem }) => {
        const mission = missions.find(m => m.id === item.missionId);

        return (
            <div className="group flex items-start gap-3 py-3 px-3 hover:bg-secondary/30 rounded-xl transition-colors cursor-pointer relative">
                <button
                    onClick={(e) => handleCheck(e, item.id)}
                    className={cn(
                        "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0",
                        item.status === 'done'
                            ? "bg-primary border-primary text-primary-foreground"
                            : item.priority === 'critical' || item.priority === 'high'
                                ? "border-red-500 hover:bg-red-500/10"
                                : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
                    )}
                >
                    {item.status === 'done' && <CheckCircle2 className="w-3 h-3" />}
                </button>

                <div className="flex-1 min-w-0">
                    <div className={cn(
                        "text-sm font-medium leading-snug",
                        item.status === 'done' && "line-through text-muted-foreground"
                    )}>
                        {item.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {/* System/Routine Label */}
                        {item.systemId && (
                            <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                <Repeat className="w-3 h-3" />
                                Routine
                            </span>
                        )}
                        {/* Mission Label */}
                        {mission && (
                            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: `${mission.color}15`, color: mission.color }}
                            >
                                <span className='w-1.5 h-1.5 rounded-full' style={{ backgroundColor: mission.color }} />
                                {mission.name}
                            </span>
                        )}
                        {/* Priority */}
                        {(item.priority === 'high' || item.priority === 'critical') && (
                            <span className="flex items-center gap-0.5 text-xs text-red-500">
                                <Flag className="w-3 h-3" /> P1
                            </span>
                        )}
                        {/* Time Block */}
                        {item.timeBlock && (
                            <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 rounded">
                                {item.timeBlock.startTime} - {item.timeBlock.endTime}
                            </span>
                        )}
                    </div>
                </div>

                {/* Actions Menu (Simplified for brevity, similar to TasksView) */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            if (menuOpenId === item.id) {
                                setMenuOpenId(null);
                                setMenuPosition(null);
                            } else {
                                const rect = e.currentTarget.getBoundingClientRect();
                                setMenuPosition({ top: rect.bottom + 4, left: rect.right - 180 });
                                setMenuOpenId(item.id);
                            }
                        }}
                        className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <MoreHorizontal className="w-4 h-4" />
                    </button>
                    {/* Menu Implementation needed here eventually */}
                </div>

                {/* Simplified Dropdown Loop for now */}
                {menuOpenId === item.id && menuPosition && (
                    <div className="fixed z-50 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl w-40 p-1"
                        style={{ top: menuPosition.top, left: menuPosition.left }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-xs hover:bg-zinc-800 rounded" onClick={(e) => { e.stopPropagation(); onEditItem(item); setMenuOpenId(null); }}>
                            <Edit2 size={14} /> Edit
                        </button>
                        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-xs hover:bg-zinc-800 rounded" onClick={(e) => { e.stopPropagation(); onDuplicateItem(item); setMenuOpenId(null); }}>
                            <Copy size={14} /> Duplicate
                        </button>
                        <div className="h-px bg-zinc-800 my-1" />
                        <button className="flex w-full items-center gap-2 px-2 py-1.5 text-xs hover:bg-red-900/20 text-red-500 rounded" onClick={(e) => { e.stopPropagation(); onDeleteItem(item.id); setMenuOpenId(null); }}>
                            <Trash2 size={14} /> Delete
                        </button>
                    </div>
                )}
            </div>
        );
    };

    const SectionHeader = ({ id, label, count, icon: Icon }: { id: string, label: string, count: number, icon?: any }) => (
        <button
            onClick={() => setExpandedSections(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])}
            className="w-full flex items-center gap-2 py-2 px-1 text-sm font-semibold text-foreground hover:bg-secondary/20 rounded-lg transition-colors"
        >
            <ChevronDown className={cn("w-4 h-4 transition-transform", !expandedSections.includes(id) && "-rotate-90")} />
            {Icon && <Icon className="w-4 h-4" />}
            <span>{label}</span>
            <span className="text-xs text-muted-foreground ml-auto bg-secondary/50 px-2 py-0.5 rounded-full">{count}</span>
        </button>
    );

    return (
        <div className="h-full flex flex-col md:flex-row animate-in fade-in duration-300 overflow-hidden bg-background/50" onClick={() => setMenuOpenId(null)}>
            {confettiPos && <ConfettiExplosion x={confettiPos.x} y={confettiPos.y} />}

            {/* Sidebar */}
            <div className="hidden md:flex flex-col w-60 border-r border-border/40 bg-secondary/5 p-4 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold">Planner</h2>
                    <button onClick={openItemModal} className="p-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 shadow-sm">
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
                                selectedNav === item.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                            )}
                        >
                            <item.icon className="w-4 h-4" />
                            <span className="flex-1 text-left">{item.label}</span>
                            <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full">{getNavCount(item.id)}</span>
                        </button>
                    ))}
                </nav>

                <div className="mt-6">
                    <div className="flex items-center justify-between px-3 mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Missions</span>
                        <button className="text-muted-foreground hover:text-foreground p-1"><Plus className="w-3.5 h-3.5" /></button>
                    </div>
                    <div className="space-y-0.5">
                        {missions.filter(m => m.status === 'active').map(mission => (
                            <button
                                key={mission.id}
                                onClick={() => setSelectedNav(mission.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors",
                                    selectedNav === mission.id ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                                )}
                            >
                                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: mission.color }} />
                                <span className="flex-1 text-left truncate">{mission.name}</span>
                                <span className="text-xs opacity-70">{getNavCount(mission.id)}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Systems Section */}
                <div className="mt-6">
                    <div className="flex items-center justify-between px-3 mb-2">
                        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Systems</span>
                        <button
                            onClick={() => setIsWorkPanelOpen(true)}
                            className="text-muted-foreground hover:text-foreground p-1"
                        >
                            <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                    <div className="space-y-0.5">
                        {systems.map(system => (
                            <button
                                key={system.id}
                                onClick={() => {
                                    if (system.type === 'work') setIsWorkPanelOpen(true);
                                    // Add handlers for other system types if needed
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors text-muted-foreground hover:bg-secondary hover:text-foreground"
                            >
                                <div
                                    className="w-2.5 h-2.5 rounded-full"
                                    style={{ backgroundColor: system.color || '#3b82f6' }}
                                />
                                <span className="flex-1 text-left truncate">{system.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mt-auto pt-4 border-t border-border/40">
                    {/* View Switcher */}
                    <div className="flex bg-secondary/50 rounded-xl p-1">
                        <button onClick={() => setViewMode('list')} className={cn("flex-1 px-3 py-2 rounded-lg text-xs font-medium", viewMode === 'list' && "bg-background shadow-sm")}>List</button>
                        <button onClick={() => setViewMode('calendar')} className={cn("flex-1 px-3 py-2 rounded-lg text-xs font-medium", viewMode === 'calendar' && "bg-background shadow-sm")}>Calendar</button>
                    </div>
                </div>
            </div>

            {/* Main */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-background">
                {/* Header (Mobile & Desktop details) */}
                <div className="flex items-center justify-between p-4 border-b border-border/40">
                    <div className="flex items-center gap-4">
                        <div className="md:hidden">
                            <h2 className="text-xl font-bold">{getViewTitle()}</h2>
                        </div>
                        <div className="hidden md:block">
                            <h1 className="text-2xl font-bold">{getViewTitle()}</h1>
                            <p className="text-xs text-muted-foreground">{format(new Date(), 'EEEE, MMMM d')}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* OT Button */}
                        <div className="relative">
                            <button
                                onClick={() => setShowOtInput(!showOtInput)}
                                className="bg-secondary hidden md:flex items-center gap-2 px-3 py-1.5 text-secondary-foreground text-xs font-medium rounded-lg hover:backdrop-blur-lg transition-colors border border-zinc-700/50"
                            >
                                <Clock size={14} /> Add OT
                            </button>
                            {showOtInput && (
                                <div className="bg-secondary/70 backdrop-saturate-150 backdrop-blur-lg absolute right-0 top-full mt-2 w-48 border border-zinc-700 rounded-lg p-3 shadow-xl z-50">
                                    <h4 className="text-xs font-semibold mb-2">Log Overtime (Hours)</h4>
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={otHours}
                                            onChange={(e) => setOtHours(Number(e.target.value))}
                                            className="w-16 bg-secondary/70 border border-zinc-800 rounded px-2 py-1 text-sm"
                                            min={0.5}
                                            step={0.5}
                                        />
                                        <button
                                            onClick={handleApplyOT}
                                            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded font-medium"
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-zinc-500 mt-2 leading-tight">
                                        Note: This will push conflicting missions to later times.
                                    </p>
                                </div>
                            )}
                        </div>

                        <button onClick={openItemModal} className="p-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:opacity-90">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* ADVANCED WORK PANEL */}
                {systems.find(s => s.type === 'work') && (
                    <WorkSystemPanel
                        isOpen={isWorkPanelOpen}
                        onClose={() => setIsWorkPanelOpen(false)}
                        system={systems.find(s => s.type === 'work')!}
                        onUpdate={(updated) => {
                            if (onUpdateSystem) onUpdateSystem(updated);
                        }}
                    />
                )}

                {/* Edit Work System Modal (Quick Legacy - Optional: Remove or Keep) */}
                {/* Keeping logic but hiding trigger since we prefer the Panel now, or mapped to same button */}
                {editingWorkSystem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                        <div className="bg-card border border-border rounded-xl w-80 shadow-2xl p-5">
                            <h3 className="text-lg font-semibold mb-4">Edit Work Hours</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={workStart}
                                        onChange={(e) => setWorkStart(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground block mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={workEnd}
                                        onChange={(e) => setWorkEnd(e.target.value)}
                                        className="w-full bg-secondary/50 border border-border rounded px-3 py-2 text-sm"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => setEditingWorkSystem(false)}
                                        className="flex-1 px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveSystem}
                                        className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded transition-colors"
                                    >
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {/* LIST VIEW */}
                    {viewMode === 'list' && (
                        <div className="max-w-3xl mx-auto p-4 md:p-6 pb-20">
                            {/* Overdue */}
                            {grouped.overdue.length > 0 && (
                                <div className="mb-6">
                                    <SectionHeader id="overdue" label="Overdue" count={grouped.overdue.length} icon={AlertTriangle} />
                                    <AnimatePresence>
                                        {expandedSections.includes('overdue') && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="mt-2 bg-red-500/5 border border-red-500/20 rounded-xl overflow-hidden divide-y divide-red-500/10"
                                            >
                                                {grouped.overdue.map(item => <ActionItemRow key={item.id} item={item} />)}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Today */}
                            <div className="mb-6">
                                <SectionHeader id="today" label="Today" count={grouped.today.length} icon={Sun} />
                                <AnimatePresence>
                                    {expandedSections.includes('today') && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="mt-2 bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/30"
                                        >
                                            {grouped.today.length > 0 ? grouped.today.map(item => <ActionItemRow key={item.id} item={item} />) : (
                                                <div className="py-8 text-center text-zinc-500 text-sm">No action items due today.</div>
                                            )}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            {/* Tomorrow */}
                            {grouped.tomorrow.length > 0 && (
                                <div className="mb-6">
                                    <SectionHeader id="tomorrow" label="Tomorrow" count={grouped.tomorrow.length} icon={Sunrise} />
                                    <AnimatePresence>
                                        {expandedSections.includes('tomorrow') && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="mt-2 bg-card border border-border/50 rounded-xl overflow-hidden divide-y divide-border/30"
                                            >
                                                {grouped.tomorrow.map(item => <ActionItemRow key={item.id} item={item} />)}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Completed */}
                            <div className="mb-6">
                                <SectionHeader id="completed" label="Completed" count={grouped.completed.length} icon={CheckCircle2} />
                                <AnimatePresence>
                                    {expandedSections.includes('completed') && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 0.6 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="mt-2 bg-secondary/30 border border-border/50 rounded-xl overflow-hidden divide-y divide-border/30"
                                        >
                                            {grouped.completed.length === 0 && (
                                                <div className="p-4 text-xs text-muted-foreground text-center">No completed items yet.</div>
                                            )}
                                            {grouped.completed.map(item => (
                                                <ActionItemRow key={item.id} item={item} />
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {/* CALENDAR VIEW */}
                    {viewMode === 'calendar' && (
                        <div ref={calendarRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} className="h-full flex flex-col bg-background">
                            {/* Calendar Header/Nav */}
                            <div className="flex items-center justify-between p-4 bg-card border-b border-border sticky top-0 z-20">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setCurrentDate(addDays(currentDate, -1))} className="p-1.5 hover:bg-zinc-800 rounded"><ChevronLeft size={18} /></button>
                                    <span className="text-sm font-semibold">{format(currentDate, 'MMMM yyyy')}</span>
                                    <button onClick={() => setCurrentDate(addDays(currentDate, 1))} className="p-1.5 hover:bg-zinc-800 rounded"><ChevronRight size={18} /></button>
                                </div>
                                <div className="flex bg-zinc-800 rounded-lg p-0.5">
                                    {['month', 'week', 'day'].map((z) => (
                                        <button
                                            key={z}
                                            onClick={() => setCalendarZoom(z as CalendarZoom)}
                                            className={cn("px-3 py-1 text-xs capitalize rounded-md transition-all", calendarZoom === z ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                        >
                                            {z}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Calendar Body - Simplified Month View Implementation */}
                            {calendarZoom === 'month' && (
                                <div className="flex-1 p-2 overflow-y-auto">
                                    <div className="grid grid-cols-7 gap-1">
                                        {eachDayOfInterval({
                                            start: startOfWeek(startOfMonth(currentDate)),
                                            end: endOfWeek(endOfMonth(currentDate))
                                        }).map((day, idx) => {
                                            const dayTasks = getItemsForDay(day);
                                            const isCurr = day.getMonth() === currentDate.getMonth();
                                            // Check for work system on this day
                                            const workSys = systems.find(s => s.type === 'work' && s.schedule?.days.includes(day.getDay()));

                                            return (
                                                <div key={idx} className={cn("min-h-[100px] bg-secondary/10 border border-border/50 rounded p-1.5 flex flex-col gap-1", !isCurr && "opacity-30")}>
                                                    <div className={cn("text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full", isToday(day) ? "bg-blue-600 text-white" : "text-zinc-500")}>
                                                        {format(day, 'd')}
                                                    </div>

                                                    {/* Work Block Indicator */}
                                                    {workSys && isCurr && (
                                                        <div
                                                            className="text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-1 border"
                                                            style={{
                                                                backgroundColor: workSys.color ? `${workSys.color}20` : undefined,
                                                                color: workSys.color,
                                                                borderColor: workSys.color ? `${workSys.color}40` : undefined
                                                            }}
                                                        >
                                                            <Briefcase size={8} /> Work
                                                        </div>
                                                    )}

                                                    {/* Tasks */}
                                                    {dayTasks.slice(0, 3).map(t => (
                                                        <div key={t.id} className={cn(
                                                            "text-[10px] px-1.5 py-0.5 rounded border-l-2 truncate",
                                                            t.status === 'done' ? "opacity-40 line-through" : "bg-zinc-800/50 border-zinc-600"
                                                        )}>
                                                            {t.title}
                                                        </div>
                                                    ))}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Week View Implementation */}
                            {calendarZoom === 'week' && (
                                <div
                                    className="flex-1 overflow-y-auto p-2 scroll-smooth"
                                    ref={(el) => {
                                        if (el && !el.dataset.scrolled) {
                                            // Auto-scroll to work start or 8am
                                            const workStart = systems.find(s => s.type === 'work')?.schedule.startTime || "09:00";
                                            const hour = parseInt(workStart);
                                            // Scroll to hour - 1 for context
                                            el.scrollTop = Math.max(0, (hour - 1) * 40);
                                            el.dataset.scrolled = "true";
                                        }
                                    }}
                                >
                                    <div className="grid grid-cols-8 gap-0 min-w-[800px]">
                                        {/* Time Column */}
                                        <div className="col-span-1 pt-8 pr-2 text-xs text-muted-foreground text-right space-y-10">
                                            <div className="text-[10px] text-red-500 font-mono mb-2">v2.1</div>
                                            {Array.from({ length: 24 }, (_, i) => i).map(hour => (
                                                <div key={hour} className="h-10 relative">
                                                    <span className="absolute -top-2 right-0">
                                                        {hour === 0 ? '12 AM' : hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Days Columns */}
                                        {getWeekDays(currentDate).map((day, idx) => {
                                            const isCurr = isSameDay(day, new Date());
                                            const dayTasks = getItemsForDay(day);
                                            // Check for work system on this day
                                            const workSys = systems.find(s => s.type === 'work');
                                            const isWorkDay = workSys?.schedule?.days.includes(day.getDay());

                                            // Calculate override hours if any
                                            const dayId = day.getDay();
                                            const override = workSys?.schedule.overrides?.[dayId];
                                            const wStart = override?.start || workSys?.schedule.startTime || "09:00";
                                            const wEnd = override?.end || workSys?.schedule.endTime || "17:00";

                                            return (
                                                <div key={idx} className={cn("col-span-1 border-l border-border/50 min-h-[600px] relative pt-8", isCurr && "bg-primary/5")}>
                                                    <div className="text-center mb-4 sticky top-0 bg-background/95 backdrop-blur z-10 py-2 border-b border-border/50 group/header relative">
                                                        <div className="text-xs uppercase text-muted-foreground">{format(day, 'EEE')}</div>
                                                        <div className={cn("text-lg font-bold w-8 h-8 mx-auto flex items-center justify-center rounded-full mt-1", isCurr ? "bg-primary text-primary-foreground" : "")}>
                                                            {format(day, 'd')}
                                                        </div>
                                                        {/* Edit Day Schedule Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setIsWorkPanelOpen(true);
                                                                // Future: Pre-select day in panel
                                                            }}
                                                            className="absolute top-2 right-2 p-1 text-muted-foreground hover:text-primary opacity-0 group-hover/header:opacity-100 transition-opacity"
                                                        >
                                                            <Edit2 size={10} />
                                                        </button>
                                                    </div>

                                                    {/* Work Blocks (Normal + Spillovers) */}
                                                    {(() => {
                                                        const renderBlock = (start: number, end: number, isSpillover = false) => {
                                                            const chartStart = 0; // Chart starts at 0am (Midnight)
                                                            const rowHeight = 40;

                                                            // Clamp visual range
                                                            const visualStart = Math.max(start, chartStart);
                                                            const visualEnd = end;

                                                            // If shift is entirely before chart starts, don't render (or render at top hint)
                                                            if (visualEnd <= chartStart) return null;

                                                            return (
                                                                <div
                                                                    key={isSpillover ? 'spill' : 'main'}
                                                                    className={cn(
                                                                        "absolute left-1 right-1 border rounded p-1 text-[10px] overflow-hidden group/work flex flex-col justify-between z-0",
                                                                        isSpillover ? "border-t-0 rounded-t-none" : ""
                                                                    )}
                                                                    style={{
                                                                        top: `${(visualStart - chartStart) * rowHeight + 20}px`,
                                                                        height: `${(visualEnd - visualStart) * rowHeight}px`,
                                                                        backgroundColor: workSys?.color ? `${workSys.color}${isSpillover ? '20' : '40'}` : undefined,
                                                                        borderColor: workSys?.color,
                                                                        color: workSys?.color ? '#fff' : undefined // Ensure text is visible if dark color
                                                                    }}
                                                                >
                                                                    <div className="font-semibold flex items-center gap-1 opacity-70">
                                                                        <Briefcase size={10} /> {isSpillover ? '(Cont.)' : 'Work'}
                                                                    </div>
                                                                    {!isSpillover && (
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                setIsWorkPanelOpen(true);
                                                                            }}
                                                                            className="self-center bg-background/80 hover:bg-background border border-border px-2 py-1 rounded text-[9px] opacity-0 group-hover/work:opacity-100 transition-opacity whitespace-nowrap"
                                                                        >
                                                                            Config
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        };

                                                        const blocks = [];

                                                        // 1. Today's Main Shift
                                                        if (isWorkDay && workSys) {
                                                            const s = parseInt(wStart);
                                                            const e = parseInt(wEnd);

                                                            if (s < e) {
                                                                // Normal Shift
                                                                blocks.push(renderBlock(s, e));
                                                            } else {
                                                                // Overnight Shift (Part 1: Start -> Midnight)
                                                                blocks.push(renderBlock(s, 24));
                                                            }
                                                        }

                                                        // 2. Yesterday's Spillover
                                                        // Check if yesterday was a work day and had an overnight shift
                                                        if (workSys) {
                                                            const yesterday = addDays(day, -1);
                                                            const yId = yesterday.getDay();
                                                            const yIsWork = workSys.schedule.days.includes(yId);

                                                            if (yIsWork) {
                                                                const yOverride = workSys.schedule.overrides?.[yId];
                                                                const yStart = parseInt(yOverride?.start || workSys.schedule.startTime || "09:00");
                                                                const yEnd = parseInt(yOverride?.end || workSys.schedule.endTime || "17:00");

                                                                // If yesterday start > end, it crossed midnight. Render Part 2 (00:00 -> End)
                                                                if (yStart > yEnd) {
                                                                    blocks.push(renderBlock(0, yEnd, true));
                                                                }
                                                            }
                                                        }

                                                        return blocks;
                                                    })()}

                                                    {/* Tasks */}
                                                    {dayTasks.map(t => {
                                                        // Simple positioning logic based on timeBlock or index
                                                        // This is a simplified visual for now
                                                        return (
                                                            <div key={t.id} className={cn(
                                                                "relative mb-2 mx-1 p-2 rounded shadow-sm text-xs border bg-card hover:z-20",
                                                                t.status === 'done' ? "opacity-50 line-through border-border" : "border-primary/20",
                                                                !t.timeBlock && "bg-card"
                                                            )}>
                                                                <div className="font-medium truncate">{t.title}</div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Placeholder for Day - logic is complex, keeping simple for first iteration */}
                            {calendarZoom === 'day' && (
                                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                                    Day View coming in next iteration. Switch to Month or Week.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
