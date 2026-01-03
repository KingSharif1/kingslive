/**
 * MissionFormModal - Modal for creating/editing Missions
 */
import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Mission } from '../../types';

interface MissionFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (mission: Partial<Mission>) => void;
    initialData?: Partial<Mission>;
}

const COLORS = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#64748b'  // Slate
];

const ICONS = ['🚀', '🎯', '💡', '💻', '📚', '✈️', '🎨', '💸', '🏥', '🏠'];

export const MissionFormModal = ({ isOpen, onClose, onSubmit, initialData }: MissionFormModalProps) => {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [color, setColor] = useState(initialData?.color || COLORS[5]);
    const [icon, setIcon] = useState(initialData?.icon || '🚀');
    const [status, setStatus] = useState<Mission['status']>(initialData?.status || 'active');
    const [priority, setPriority] = useState<Mission['priority']>(initialData?.priority || 'medium');
    const [targetDate, setTargetDate] = useState<string>(
        initialData?.targetDate ? new Date(initialData.targetDate).toISOString().split('T')[0] : ''
    );

    if (!isOpen) return null;

    const handleSubmit = () => {
        if (!name.trim()) return;
        onSubmit({
            name,
            description,
            color,
            icon,
            status,
            priority,
            targetDate: targetDate ? new Date(targetDate) : undefined,
            progress: initialData?.progress || 0
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-card border border-border rounded-xl w-full max-w-md shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h3 className="font-semibold text-lg">
                        {initialData ? 'Edit Mission' : 'New Mission'}
                    </h3>
                    <button onClick={onClose} className="p-1.5 hover:bg-secondary rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    {/* Name & Icon */}
                    <div className="flex gap-3">
                        <div className="flex-1">
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Mission Name</label>
                            <input
                                autoFocus
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g., Launch MVP"
                                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Icon</label>
                            <div className="relative group">
                                <button
                                    className="w-10 h-10 bg-secondary/50 rounded-lg flex items-center justify-center text-xl border border-border/50"
                                >
                                    {icon}
                                </button>
                                {/* Simple Icon Picker Dropdown on Hover */}
                                <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-xl p-2 grid grid-cols-5 gap-1 w-48 z-10 hidden group-hover:grid">
                                    {ICONS.map(i => (
                                        <button
                                            key={i}
                                            onClick={() => setIcon(i)}
                                            className="w-8 h-8 flex items-center justify-center hover:bg-secondary rounded text-lg"
                                        >
                                            {i}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Description</label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Briefly describe the objective..."
                            rows={3}
                            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-primary/20 outline-none"
                        />
                    </div>

                    {/* Color Picker */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-2 block">Theme Color</label>
                        <div className="flex flex-wrap gap-2">
                            {COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setColor(c)}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-transform hover:scale-110",
                                        color === c ? "ring-2 ring-offset-2 ring-offset-background ring-primary scale-110" : ""
                                    )}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Status & Priority */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value as any)}
                                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                <option value="active">Active</option>
                                <option value="on-hold">On Hold</option>
                                <option value="completed">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-muted-foreground mb-1 block">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as any)}
                                className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none"
                            >
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                    </div>

                    {/* Target Date */}
                    <div>
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">Target Date</label>
                        <input
                            type="date"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                            className="w-full bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-sm outline-none"
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-border bg-secondary/10 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!name.trim()}
                        className={cn(
                            "px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90 transition-all",
                            !name.trim() && "opacity-50 cursor-not-allowed shadow-none"
                        )}
                    >
                        {initialData ? 'Save Changes' : 'Create Mission'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
