/**
 * Core type definitions for Ctroom Dashboard
 * Includes views, tasks, ideas, chat messages, and AI model configurations
 */

export type View = 'dashboard' | 'chat' | 'missions' | 'planner' | 'ideas' | 'blog' | 'settings' | 'tasks' | 'vault' | 'dreamboard';
// Core Definitions
export type ActionItemStatus = 'todo' | 'in-progress' | 'done' | 'archived';
export type ActionItemPriority = 'low' | 'medium' | 'high' | 'critical';
export type ActionItemCategory = 'work' | 'personal' | 'system';
export type ActionItemType = 'action' | 'system_instance';

export type SystemFrequency = 'daily' | 'weekly' | 'weekdays' | 'weekends' | 'custom';

// Chat Types
export type ChatTool = 'none' | 'search-web' | 'github' | 'analyze-images' | 'write-code';
export type ChatSpeed = 'fast' | 'balanced' | 'deep-think';

export interface ThinkingStep {
  title: string;
  content: string;
  status: 'complete' | 'pending';
  icon?: 'github' | 'search' | 'code' | 'thinking';
  duration?: string;
}

export interface MessageSource {
  url: string;
  title: string;
}

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
  thoughts?: ThinkingStep[];
  sources?: MessageSource[];
  attachments?: { language?: string; code: string; content?: string }[];
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
  projectId?: string; // Alias for missionId used in some views
  systemId?: string; // If generated from a System (Habit)

  // UI/extended fields
  taskType?: string;     // 'task' | 'habit' — UI-level distinction
  habitStreak?: number;  // consecutive days completed

  // Smart Scheduling
  timeBlock?: {
    startTime?: string; // "09:00"
    endTime?: string;   // "17:00"
    duration?: number;  // minutes
  };
}

export interface NoteBlock {
  id: string;
  content: string;
  createdAt: string; // ISO string
  editedAt?: string; // ISO string — set when content is modified after creation
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
  domainUrl?: string; // Live production URL for domain monitoring
  notes?: string; // JSON-stringified NoteBlock[] or plain string (legacy)

  // Focus logic
  focusWeek?: boolean; // Is this the main focus for the week?

  // GitHub integration
  github?: {
    lastCommit?: string;
    openIssues?: number;
    openPrs?: number;
    recentActivity?: string[];
  };

  // Domain & Deployment Status (cached)
  domainStatus?: {
    isOnline: boolean;
    statusCode?: number;
    responseTime?: number; // ms
    lastChecked?: string; // ISO timestamp
    sslValid?: boolean;
    sslExpiry?: string; // ISO timestamp
  };

  deploymentStatus?: {
    platform?: 'vercel' | 'netlify' | 'github-pages' | 'custom';
    status?: 'success' | 'building' | 'failed' | 'queued';
    lastDeployment?: string; // ISO timestamp
    deploymentUrl?: string;
  };
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
  metadata?: Record<string, any>;
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

// Ctroom accent color theme
export type CtroomAccent = 'none' | 'violet' | 'ocean' | 'amber' | 'emerald' | 'rose';

// Usage tracking for API calls with provider breakdown
export interface ProviderUsage {
  provider: 'OpenAI' | 'Google' | 'Anthropic' | 'HuggingFace' | 'Groq';
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
  google?: { used: number; limit: number };
  openai?: { used: number; limit: number };
  anthropic?: { used: number; limit: number };
}

// Legacy type aliases (used by older components)
export type Task = ActionItem;
export type Project = Mission;
export type TaskType = ActionItemType;
export type TaskCategory = ActionItemCategory;
export type TaskPriority = ActionItemPriority;
export type HabitFrequency = SystemFrequency;

// AI Model configuration
export interface AIModel {
  id: string;
  name: string;
  provider: 'OpenAI' | 'Google' | 'Anthropic' | 'HuggingFace' | 'Groq';
  description: string;
  contextTokens: string;
  icon: string;
}

// Vault / Finance types
export type AccountType = 'checking' | 'savings' | 'credit' | 'loan' | 'investment' | 'cash';
export type TransactionType = 'income' | 'expense' | 'transfer';

export interface VaultAccount {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  institution?: string;
  mask?: string;
  currency?: string;
  isTellerLinked?: boolean;
  tellerAccountId?: string;
  color?: string;
  createdAt?: Date;
}

export interface VaultTransaction {
  id: string;
  accountId: string;
  accountName?: string;
  amount: number;
  type: TransactionType;
  category?: string;
  subcategory?: string;
  description: string;
  merchant?: string;
  date: Date;
  isPending?: boolean;
  tellerTransactionId?: string;
}

export interface BudgetCategory {
  id: string;
  name: string;
  emoji?: string;
  monthlyLimit: number;
  spent: number;
  color?: string;
}

export interface DebtEntry {
  id: string;
  name: string;
  balance: number;
  originalBalance: number;
  interestRate: number;
  minimumPayment: number;
  targetDate?: Date;
  type: 'credit_card' | 'student_loan' | 'personal_loan' | 'medical' | 'other';
  color?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  emoji?: string;
  targetAmount: number;
  currentAmount: number;
  color?: string;
  deadline?: Date;
}

export interface TransactionRule {
  id: string;
  pattern: string; // case-insensitive substring match against merchant/description
  category: string;
}

export type SubscriptionFrequency = 'monthly' | 'weekly' | 'bi-weekly' | 'quarterly' | 'annual';

export interface Subscription {
  id: string;
  name: string;
  emoji?: string;
  amount: number;
  frequency: SubscriptionFrequency;
  category: string;
  color?: string;
  isActive: boolean;
  nextBillingDate?: Date;
  merchantPattern?: string;
  autoDetected?: boolean;
  notes?: string;
}

// ─── Daily Log ──────────────────────────────────────────────────────────────
export type DailyLogType = 'log' | 'reflection';

export interface DailyLog {
  id: string;
  date: string;           // 'yyyy-MM-dd'
  content: string;
  type: DailyLogType;
  projectId?: string;     // links to missions.id
  timeSpentMinutes?: number;
  createdAt: Date;
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
    accent?: CtroomAccent;
    sidebarCollapsed: boolean;
    notifications: boolean;
    autoSave: boolean;
    workSchedule?: {
      workDays: number[];
      startTime: string;
      endTime: string;
      location: string;
      timezone: string;
      overtimeEnabled: boolean;
      overtimeRate: number;
    };
  };
  apiKeys: {
    openai?: string;
    anthropic?: string;
    google?: string;
    github?: string;
    groq?: string;
    [key: string]: string | undefined; // extensible for custom providers
  };
}
