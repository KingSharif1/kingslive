/**
 * Core type definitions for Ctroom Dashboard
 * Includes views, tasks, ideas, chat messages, and AI model configurations
 */

export type View = 'dashboard' | 'chat' | 'missions' | 'planner' | 'ideas' | 'blog' | 'settings';
// Core Definitions
export type ActionItemStatus = 'todo' | 'in-progress' | 'done' | 'archived';
export type ActionItemPriority = 'low' | 'medium' | 'high' | 'critical';
export type ActionItemCategory = 'work' | 'personal' | 'system';
export type ActionItemType = 'action' | 'system_instance';

export type SystemFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';

// Chat Types
export type ChatTool = 'none' | 'web-search' | 'code-interpreter' | 'github-connector';
export type ChatSpeed = 'fast' | 'deep-think';

export interface ChatContext {
  id: string;
  type: 'file' | 'selection' | 'url';
  content: string;
  metadata?: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  model?: string;
  thoughts?: string;
  context?: ChatContext[];
}

export interface ActionItem {
  id: string;
  title: string;
  description?: string;
  status: ActionItemStatus;
  priority: ActionItemPriority;
  category: ActionItemCategory;
  date: Date;
  dueTime?: string; // HH:mm format
  
  // Linkage
  missionId?: string;
  systemId?: string; // If generated from a System (Habit)

  // Smart Scheduling
  timeBlock?: {
    startTime?: string; // "09:00"
    endTime?: string;   // "17:00"
    duration?: number;  // minutes
  };
}

export interface Mission {
  id: string;
  name: string;
  color: string;
  icon?: string;
  description?: string;
  
  // Status Tracking
  status: 'active' | 'on-hold' | 'completed' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  progress: number; // 0-100
  
  // Dates
  startDate?: Date;
  targetDate?: Date;
  
  // Links & Content
  repoUrl?: string;
  notes?: string; // Markdown/HTML content for notebook feel

  // Focus logic
  focusWeek?: boolean; // Is this the main focus for the week?
}

export interface System {
  id: string;
  name: string; // e.g., "9-5 Work", "Morning Routine"
  type: 'work' | 'habit' | 'routine';
  color?: string;
  
  // Scheduling Rule
  schedule: {
    days: number[]; // 0=Sun, 1=Mon, etc. - Generic active days
    weekStartDay?: number; // 0=Sun, 1=Mon
    startTime: string; // Default Start "09:00"
    endTime?: string;  // Default End "17:00"
    
    // Per-day overrides (optional)
    overrides?: Record<number, { start: string; end: string; }>;
    
    durationMinutes?: number;
  };
  
  isActive: boolean;
}

export interface Idea {
  id: string;
  title: string;
  content: string;
  tags: string[];
  date: Date;
  category: 'feature' | 'content' | 'business' | 'personal' | 'random';
}

// Block types for Notion-like editor
export type BlockType = 'text' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'todo' | 'quote' | 'divider' | 'image' | 'link' | 'voice' | 'drawing';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // for todo blocks
  imageUrl?: string; // for image blocks
  linkUrl?: string; // for link blocks
  voiceUrl?: string; // for voice memo blocks
  voiceDuration?: number; // duration in seconds
  voiceTranscript?: string; // AI transcription
  drawingData?: string; // base64 encoded drawing data
  isAIGenerated?: boolean; // track if content was AI-generated
  metadata?: {
    projectId?: string; // linked project/repo
    projectName?: string;
    projectUrl?: string;
  };
}

export interface AISuggestion {
  id: string;
  type: 'expand' | 'improve' | 'new-idea' | 'action-item';
  content: string;
  preview?: string;
}

// Theme mode
export type ThemeMode = 'light' | 'dark' | 'system';

// Usage tracking for API calls with provider breakdown
export interface ProviderUsage {
  provider: 'OpenAI' | 'Google' | 'Anthropic' | 'HuggingFace';
  tokens: number;
  requests: number;
}

export interface UsageStats {
  chat: { used: number; limit: number };
  search: { used: number; limit: number };
  code: { used: number; limit: number };
  total: { used: number; limit: number };
  resetDate: Date;
  byProvider: ProviderUsage[];
}

// User settings
export interface UserSettings {
  profile: {
    name: string;
    email: string;
    avatar?: string;
  };
  preferences: {
    theme: ThemeMode;
    sidebarCollapsed: boolean;
    notifications: boolean;
    autoSave: boolean;
  };
  apiKeys: {
    openai?: string;
    github?: string;
    google?: string;
  };
}
