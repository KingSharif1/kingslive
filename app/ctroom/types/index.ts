/**
 * Core type definitions for Ctroom Dashboard
 * Includes views, tasks, ideas, chat messages, and AI model configurations
 */

export type View = 'dashboard' | 'chat' | 'tasks' | 'ideas' | 'blog' | 'settings';
export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'work' | 'personal' | 'habit';
export type ChatTool = 'none' | 'analyze-images' | 'write-code' | 'search-web' | 'github';
export type ChatSpeed = 'fast' | 'balanced' | 'deep';

// Task type: task vs habit
export type TaskType = 'task' | 'habit';

// Habit repeat frequency
export type HabitFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';

export interface AIModel {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Google' | 'Anthropic' | 'Local';
  description: string;
  contextTokens: string;
  icon: string;
}

export interface ChatContext {
  type: 'task' | 'idea';
  id: string;
  title: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  model?: string;
  context?: ChatContext[];
  thoughts?: {
    title: string;
    content: string;
    status: 'pending' | 'complete';
    icon?: 'search' | 'github' | 'code' | 'thinking';
    duration?: string;
  }[];
  sources?: {
    title: string;
    url: string;
    favicon?: string;
  }[];
  attachments?: {
    type: 'code' | 'image' | 'file';
    content: string;
    language?: string;
  }[];
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  date: Date;
  dueTime?: string; // HH:mm format
  // Task vs Habit specific
  taskType: TaskType;
  // Habit-specific fields
  habitFrequency?: HabitFrequency;
  habitDuration?: number; // in days (e.g., 30 days, 90 days)
  habitStreak?: number;
  habitCustomDays?: number[]; // 0-6 for Sunday-Saturday
  // Project assignment
  projectId?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  icon?: string;
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
export type BlockType = 'text' | 'heading1' | 'heading2' | 'heading3' | 'bullet' | 'numbered' | 'todo' | 'quote' | 'divider' | 'image' | 'link';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  checked?: boolean; // for todo blocks
  imageUrl?: string; // for image blocks
  linkUrl?: string; // for link blocks
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
