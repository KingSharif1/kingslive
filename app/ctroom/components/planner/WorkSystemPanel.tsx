import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Calendar, Save, Check, Settings2, Briefcase } from 'lucide-react';
import { System } from '../../types';
import { cn } from '@/lib/utils';

interface WorkSystemPanelProps {
    isOpen: boolean;
    onClose: () => void;
    system: System;
    onUpdate: (updatedSystem: System) => void;
}

export function WorkSystemPanel({ isOpen, onClose, system, onUpdate }: WorkSystemPanelProps) {
    const [schedule, setSchedule] = useState(system.schedule);
    const [name, setName] = useState(system.name);
    const [color, setColor] = useState(system.color || '#3b82f6');

    // Local state for advanced mode
    const [advancedMode, setAdvancedMode] = useState(!!system.schedule.overrides);

    useEffect(() => {
        setSchedule(system.schedule);
        setName(system.name);
        setColor(system.color || '#3b82f6');
        setAdvancedMode(!!system.schedule.overrides);
    }, [system]);

    const days = [
        { id: 0, label: 'Sun', full: 'Sunday' },
        { id: 1, label: 'Mon', full: 'Monday' },
        { id: 2, label: 'Tue', full: 'Tuesday' },
        { id: 3, label: 'Wed', full: 'Wednesday' },
        { id: 4, label: 'Thu', full: 'Thursday' },
        { id: 5, label: 'Fri', full: 'Friday' },
        { id: 6, label: 'Sat', full: 'Saturday' }
    ];

    // Reorder days based on weekStart (default Mon based on user request "work week start differently")
    const weekStart = schedule.weekStartDay ?? 1; // Default to Monday
    const sortedDays = [...days.slice(weekStart), ...days.slice(0, weekStart)];

    const handleSave = () => {
        onUpdate({
            ...system,
            name,
            color,
            schedule
        });
        onClose();
    };

    const toggleDay = (dayId: number) => {
        const currentDays = schedule.days;
        if (currentDays.includes(dayId)) {
            setSchedule(prev => ({ ...prev, days: prev.days.filter(d => d !== dayId) }));
        } else {
            setSchedule(prev => ({ ...prev, days: [...prev.days, dayId].sort() }));
        }
    };

    const handleOverrideChange = (dayId: number, field: 'start' | 'end', value: string) => {
        setSchedule(prev => {
            const currentOverrides = prev.overrides || {};
            const dayOverride = currentOverrides[dayId] || {
                start: prev.startTime,
                end: prev.endTime || "17:00"
            };

            return {
                ...prev,
                overrides: {
                    ...currentOverrides,
                    [dayId]: { ...dayOverride, [field]: value }
                }
            };
        });
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-border flex items-center justify-between bg-secondary/10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-500 flex items-center justify-center">
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <h2 className="font-bold text-lg">Work System</h2>
                                    <p className="text-xs text-muted-foreground">Configure your expected hours</p>
                                </div>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8">

                            {/* General Settings */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                    <Settings2 size={14} /> General
                                </h3>

                                <div>
                                    <label className="text-sm font-medium block mb-1.5">System Name</label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full bg-secondary/30 border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                    />
                                </div>

                                {/* Color Picker */}
                                <div>
                                    <label className="text-sm font-medium block mb-1.5">System Color</label>
                                    <div className="flex gap-2 flex-wrap">
                                        {['#3b82f6', '#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#ec4899', '#6366f1'].map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setColor(c)}
                                                className={cn(
                                                    "w-6 h-6 rounded-full border border-border shadow-sm transition-transform hover:scale-110",
                                                    color === c ? "ring-2 ring-foreground ring-offset-2 ring-offset-background" : ""
                                                )}
                                                style={{ backgroundColor: c }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-sm font-medium block mb-1.5">Week Start Day</label>
                                    <div className="flex bg-secondary/30 p-1 rounded-lg">
                                        {[0, 1, 5, 6].map(d => ( // Sun, Mon, Fri, Sat
                                            <button
                                                key={d}
                                                onClick={() => setSchedule(prev => ({ ...prev, weekStartDay: d }))}
                                                className={cn(
                                                    "flex-1 text-xs py-1.5 rounded-md transition-colors capitalize",
                                                    (schedule.weekStartDay ?? 1) === d ? "bg-card shadow-sm text-primary font-medium" : "text-muted-foreground hover:text-foreground"
                                                )}
                                            >
                                                {days[d].full.slice(0, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Schedule Grid */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <Calendar size={14} /> Weekly Schedule
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Advanced Mode</span>
                                        <button
                                            onClick={() => setAdvancedMode(!advancedMode)}
                                            className={cn("w-8 h-4 rounded-full transition-colors relative", advancedMode ? "bg-primary" : "bg-zinc-700")}
                                        >
                                            <div className={cn("absolute top-0.5 bottom-0.5 w-3 rounded-full bg-white transition-all", advancedMode ? "right-0.5" : "left-0.5")} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {!advancedMode && (
                                        <div className="bg-secondary/20 p-4 rounded-lg border border-border space-y-3">
                                            <div className="flex items-center gap-4">
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground block mb-1">Standard Start</label>
                                                    <input
                                                        type="time"
                                                        value={schedule.startTime}
                                                        onChange={(e) => setSchedule(prev => ({ ...prev, startTime: e.target.value }))}
                                                        className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm"
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <label className="text-xs text-muted-foreground block mb-1">Standard End</label>
                                                    <input
                                                        type="time"
                                                        value={schedule.endTime || "17:00"}
                                                        onChange={(e) => setSchedule(prev => ({ ...prev, endTime: e.target.value }))}
                                                        className="w-full bg-card border border-border rounded px-2 py-1.5 text-sm"
                                                    />
                                                </div>
                                            </div>
                                            <div className="text-xs text-muted-foreground italic">
                                                Applies to all active days below.
                                            </div>
                                        </div>
                                    )}

                                    {/* Days List */}
                                    <div className="space-y-2">
                                        {sortedDays.map(day => {
                                            const isActive = schedule.days.includes(day.id);
                                            const override = schedule.overrides?.[day.id];

                                            return (
                                                <div
                                                    key={day.id}
                                                    className={cn(
                                                        "flex items-center gap-3 p-3 rounded-lg border transition-all",
                                                        isActive ? "bg-card border-primary/20" : "bg-transparent border-transparent opacity-50 hover:opacity-100"
                                                    )}
                                                >
                                                    <button
                                                        onClick={() => toggleDay(day.id)}
                                                        className={cn(
                                                            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors shrink-0",
                                                            isActive ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                                                        )}
                                                    >
                                                        {day.label[0]}
                                                    </button>

                                                    <div className="flex-1 min-h-[40px] flex items-center">
                                                        <span className={cn("text-sm font-medium mr-auto", isActive ? "text-foreground" : "text-muted-foreground")}>
                                                            {day.full}
                                                        </span>

                                                        {isActive && advancedMode && (
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="time"
                                                                    className="bg-secondary/30 border border-border rounded px-1.5 py-0.5 text-xs w-20"
                                                                    value={override?.start || schedule.startTime}
                                                                    onChange={(e) => handleOverrideChange(day.id, 'start', e.target.value)}
                                                                />
                                                                <span className="text-muted-foreground text-xs">-</span>
                                                                <input
                                                                    type="time"
                                                                    className="bg-secondary/30 border border-border rounded px-1.5 py-0.5 text-xs w-20"
                                                                    value={override?.end || schedule.endTime || "17:00"}
                                                                    onChange={(e) => handleOverrideChange(day.id, 'end', e.target.value)}
                                                                />
                                                            </div>
                                                        )}

                                                        {isActive && !advancedMode && (
                                                            <span className="text-xs text-muted-foreground">
                                                                {schedule.startTime} - {schedule.endTime}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-border bg-card">
                            <button
                                onClick={handleSave}
                                className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-bold shadow-lg hover:shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                            >
                                <Save size={18} />
                                Save Work Schedule
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
