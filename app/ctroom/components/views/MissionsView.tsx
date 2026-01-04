import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Plus, Target, Calendar, BarChart2, MoreVertical,
    ArrowRight, CheckCircle2, Clock, AlertCircle, Flame
} from 'lucide-react';
import { Mission } from '../../types';
import { CtroomDataService } from '../../services/ctroomDataService';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MissionFormModal } from '../modals/MissionFormModal';

interface MissionsViewProps {
    onMissionClick?: (id: string) => void;
}

export const MissionsView = ({ onMissionClick }: MissionsViewProps) => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMission, setEditingMission] = useState<Mission | undefined>(undefined);

    useEffect(() => {
        loadMissions();
    }, []);

    const loadMissions = async () => {
        try {
            setLoading(true);
            const data = await CtroomDataService.fetchMissions();
            setMissions(data);
        } catch (error) {
            console.error('Failed to load missions', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 space-y-8 overflow-y-auto bg-zinc-950/50">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">Missions</h1>
                    <p className="text-zinc-400">Strategic objectives and key results</p>
                </div>
                <button
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 transition-colors shadow-lg shadow-blue-500/20"
                    onClick={() => { setEditingMission(undefined); setIsModalOpen(true); }}
                >
                    <Plus size={20} />
                    <span>New Mission</span>
                </button>
            </div>

            {/* Mission status sections */}
            {loading ? (
                <div className="text-zinc-500">Loading missions...</div>
            ) : (
                <div className="space-y-8">
                    <MissionSection
                        title="Active Missions"
                        missions={missions.filter(m => m.status === 'active')}
                        onMissionClick={onMissionClick}
                    />

                    <MissionSection
                        title="Focus Queue"
                        missions={missions.filter(m => m.status === 'on-hold')}
                        compact
                        onMissionClick={onMissionClick}
                    />

                    <MissionSection
                        title="Completed"
                        missions={missions.filter(m => m.status === 'completed')}
                        compact
                        onMissionClick={onMissionClick}
                    />
                </div>
            )}

            <MissionFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingMission || undefined}
                onSubmit={async (data) => {
                    // Save Mission
                    // Note: Create a fake new mission object to send to saveMission
                    // CtroomDataService.saveMission handles generic objects
                    const newMission = {
                        ...data,
                        progress: data.progress || 0,
                    } as any;

                    const saved = await CtroomDataService.saveMission(newMission);
                    if (saved) {
                        setMissions(prev => [...prev, saved]);
                    }
                    setIsModalOpen(false);
                }}
            />
        </div>
    );
};

const MissionSection = ({ title, missions, compact = false, onMissionClick }: { title: string, missions: Mission[], compact?: boolean, onMissionClick?: (id: string) => void }) => {
    if (missions.length === 0) return null;

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-zinc-300 flex items-center gap-2">
                {title}
                <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full text-zinc-400">
                    {missions.length}
                </span>
            </h2>
            <div className={cn(
                "grid gap-4",
                compact ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-4" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
            )}>
                {missions.map(mission => (
                    <MissionCard key={mission.id} mission={mission} compact={compact} onClick={() => onMissionClick?.(mission.id)} />
                ))}
            </div>
        </div>
    );
};

const MissionCard = ({ mission, compact, onClick }: { mission: Mission, compact?: boolean, onClick?: () => void }) => {
    return (
        <motion.div
            whileHover={{ y: -2 }}
            onClick={onClick}
            className="group relative bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-700 transition-all shadow-sm cursor-pointer"
        >
            <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${mission.color}20`, color: mission.color }}
                    >
                        {mission.icon || '🚀'}
                    </div>
                    <div>
                        <h3 className="font-semibold text-zinc-100">{mission.name}</h3>
                        {!compact && mission.targetDate && (
                            <div className="flex items-center gap-1 text-xs text-zinc-500 mt-0.5">
                                <Clock size={12} />
                                <span>Due {format(new Date(mission.targetDate), 'MMM d')}</span>
                            </div>
                        )}
                    </div>
                </div>

                {mission.focusWeek && (
                    <div className="px-2 py-1 bg-amber-500/10 text-amber-500 text-xs rounded-full flex items-center gap-1 border border-amber-500/20">
                        <Flame size={10} />
                        <span>Focus</span>
                    </div>
                )}
            </div>

            {!compact && (
                <>
                    <div className="mb-4">
                        <div className="flex justify-between text-xs text-zinc-400 mb-1.5">
                            <span>Progress</span>
                            <span>{mission.progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${mission.progress}%` }}
                                className="h-full bg-blue-500 rounded-full"
                                style={{ backgroundColor: mission.color }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-zinc-500 pt-3 border-t border-zinc-800/50">
                        <div className="flex items-center gap-2">
                            <span className={cn(
                                "capitalize px-2 py-0.5 rounded-full",
                                mission.priority === 'critical' ? "bg-red-500/10 text-red-500" :
                                    mission.priority === 'high' ? "bg-orange-500/10 text-orange-500" :
                                        "bg-blue-500/10 text-blue-500"
                            )}>
                                {mission.priority} Priority
                            </span>
                        </div>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity text-zinc-400 hover:text-white">
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </>
            )}
        </motion.div>
    );
};
