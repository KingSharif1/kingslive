'use client';

import React, { useState, useEffect } from 'react';
import { DreamBoard, dbLoadBoards } from './dreamboard/DreamboardStore';
import { DreamboardGallery } from './dreamboard/DreamboardGallery';
import { DreamboardCanvas } from './dreamboard/DreamboardCanvas';

export default function DreamboardView() {
  const [boards,       setBoards]       = useState<DreamBoard[]>([]);
  const [activeBoard,  setActiveBoard]  = useState<DreamBoard | null>(null);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    dbLoadBoards().then(data => { setBoards(data); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#070707]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-[#00ff88] rounded-full animate-spin" />
      </div>
    );
  }

  if (activeBoard) {
    return (
      <DreamboardCanvas
        board={activeBoard}
        onBack={() => setActiveBoard(null)}
      />
    );
  }

  return (
    <DreamboardGallery
      boards={boards}
      onSelect={board => setActiveBoard(board)}
      onBoardCreated={board => setBoards(prev => [board, ...prev])}
      onBoardDeleted={id => setBoards(prev => prev.filter(b => b.id !== id))}
      onBoardUpdated={(id, patch) => setBoards(prev => prev.map(b => b.id === id ? { ...b, ...patch } : b))}
    />
  );
}
