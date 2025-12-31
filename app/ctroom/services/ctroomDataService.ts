import { supabase } from "@/lib/supabase";
import { Task, Idea, Message, TaskStatus, TaskPriority, TaskCategory, TaskType, HabitFrequency } from "../types/index";

/**
 * Ctroom Data Service
 * Handles all CRUD operations for tasks, ideas, and chat messages
 */

export class CtroomDataService {
  // ==================== TASKS ====================
  
  static async fetchTasks(): Promise<Task[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tasks:', error);
        return [];
      }
      
      // Transform database format to app format
      return (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.completed ? 'done' : 'todo' as TaskStatus,
        priority: (task.priority || 'medium') as TaskPriority,
        category: (task.category || 'personal') as TaskCategory,
        date: task.due_date ? new Date(task.due_date) : new Date(),
        taskType: task.is_habit ? 'habit' : 'task' as TaskType,
        habitFrequency: task.frequency as HabitFrequency | undefined,
        habitStreak: task.streak || 0,
      })) as Task[];
    } catch (error) {
      console.error('Error in fetchTasks:', error);
      return [];
    }
  }

  static async saveTask(task: Omit<Task, 'id'>): Promise<Task | null> {
    try {
      // Transform app format to database format
      const dbTask = {
        title: task.title,
        description: task.description,
        completed: task.status === 'done',
        priority: task.priority,
        category: task.category,
        due_date: task.date,
        is_habit: task.taskType === 'habit',
        frequency: task.habitFrequency,
        streak: task.habitStreak || 0
      };

      const {data, error } = await supabase
        .from('tasks')
        .insert([dbTask])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving task:', error);
        return null;
      }
      
      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        status: data.completed ? 'done' : 'todo',
        priority: data.priority,
        category: data.category,
        date: new Date(data.due_date || data.created_at),
        taskType: data.is_habit ? 'habit' : 'task',
        habitFrequency: data.frequency,
        habitStreak: data.streak || 0
      } as Task;
    } catch (error) {
      console.error('Error in saveTask:', error);
      return null;
    }
  }

  static async updateTask(id: string, updates: Partial<Task>): Promise<boolean> {
    try {
      // Transform app format to database format
      const dbUpdates: any = {};
      if (updates.title !== undefined) dbUpdates.title = updates.title;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      if (updates.status !== undefined) dbUpdates.completed = updates.status === 'done';
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.date !== undefined) dbUpdates.due_date = updates.date;
      if (updates.taskType !== undefined) dbUpdates.is_habit = updates.taskType === 'habit';
      if (updates.habitFrequency !== undefined) dbUpdates.frequency = updates.habitFrequency;
      if (updates.habitStreak !== undefined) dbUpdates.streak = updates.habitStreak;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating task:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateTask:', error);
      return false;
    }
  }

  static async deleteTask(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting task:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteTask:', error);
      return false;
    }
  }

  // ==================== IDEAS ====================
  
  static async fetchIdeas(): Promise<Idea[]> {
    try {
      const { data, error } = await supabase
        .from('ideas')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching ideas:', error);
        return [];
      }
      
      return (data || []).map(idea => ({
        id: idea.id,
        title: idea.title,
        content: idea.content || '',
        tags: [],
        date: new Date(idea.created_at),
        category: idea.category || 'random'
      })) as Idea[];
    } catch (error) {
      console.error('Error in fetchIdeas:', error);
      return [];
    }
  }

  static async saveIdea(idea: Omit<Idea, 'id'>): Promise<Idea | null> {
    try {
      // Transform app format to database format
      const dbIdea = {
        title: idea.title,
        content: idea.content,
        category: idea.category
      };

      const { data, error } = await supabase
        .from('ideas')
        .insert([dbIdea])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving idea:', error);
        return null;
      }
      
      return {
        id: data.id,
        title: data.title,
        content: data.content || '',
        tags: [],
        date: new Date(data.created_at),
        category: data.category
      } as Idea;
    } catch (error) {
      console.error('Error in saveIdea:', error);
      return null;
    }
  }

  static async updateIdea(id: string, updates: Partial<Idea>): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ideas')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('Error updating idea:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateIdea:', error);
      return false;
    }
  }

  static async deleteIdea(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('ideas')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('Error deleting idea:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in deleteIdea:', error);
      return false;
    }
  }

  // ==================== MESSAGES ====================
  
  static async fetchMessages(): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }
      
      return (data || []).map(msg => ({
        id: msg.id,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.created_at)
      })) as Message[];
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      return [];
    }
  }

  static async saveMessage(message: Omit<Message, 'id'>): Promise<Message | null> {
    try {
      // Transform app format to database format
      const dbMessage = {
        role: message.role,
        content: message.content,
        session_id: null // You may want to track sessions later
      };

      const { data, error } = await supabase
        .from('chat_messages')
        .insert([dbMessage])
        .select()
        .single();
      
      if (error) {
        console.error('Error saving message:', error);
        return null;
      }
      
      return {
        id: data.id,
        role: data.role,
        content: data.content,
        timestamp: new Date(data.created_at)
      } as Message;
    } catch (error) {
      console.error('Error in saveMessage:', error);
      return null;
    }
  }

  static async clearMessages(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('chat_messages')
        .delete()
        .neq('id', ''); // Delete all
      
      if (error) {
        console.error('Error clearing messages:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in clearMessages:', error);
      return false;
    }
  }

  // ==================== USER PROFILE ====================
  
  static async getUserProfile(): Promise<{ name: string; email: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      // Get user profile from database if it exists
      const { data, error } = await supabase
        .from('user_profiles')
        .select('name, email')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        // Return auth user info as fallback
        return {
          name: user.user_metadata?.name || 'User',
          email: user.email || 'user@ctroom.com',
        };
      }
      
      return data;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return { name: 'King Sharif', email: 'king@ctroom.com' };
    }
  }

  static async updateUserProfile(name: string, email: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { error } = await supabase
        .from('user_profiles')
        .upsert({ user_id: user.id, name, email })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error updating user profile:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      return false;
    }
  }

  // ==================== TOKEN USAGE ====================
  
  static async trackTokenUsage(provider: string, model: string, tokens: number, requestType: 'chat' | 'search' | 'code'): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { error } = await supabase
        .from('token_usage')
        .insert([{
          user_id: user.id,
          provider,
          model,
          tokens,
          request_type: requestType
        }]);
      
      if (error) {
        console.error('Error tracking token usage:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in trackTokenUsage:', error);
      return false;
    }
  }

  static async getTokenUsage(days: number = 30): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return { byProvider: [], total: 0 };

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      const { data, error } = await supabase
        .from('token_usage')
        .select('*')
        .eq('user_id', user.id)
        .gte('created_at', cutoffDate.toISOString());
      
      if (error) {
        console.error('Error fetching token usage:', error);
        return { byProvider: [], total: 0 };
      }

      // Aggregate by provider
      const byProvider = (data || []).reduce((acc: any, item: any) => {
        const existing = acc.find((p: any) => p.provider === item.provider);
        if (existing) {
          existing.tokens += item.tokens;
          existing.requests += 1;
        } else {
          acc.push({
            provider: item.provider,
            tokens: item.tokens,
            requests: 1
          });
        }
        return acc;
      }, []);

      const total = byProvider.reduce((sum: number, p: any) => sum + p.tokens, 0);

      return { byProvider, total };
    } catch (error) {
      console.error('Error in getTokenUsage:', error);
      return { byProvider: [], total: 0 };
    }
  }

  // ==================== USER SETTINGS ====================
  
  static async getUserSettings(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user settings:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getUserSettings:', error);
      return null;
    }
  }

  static async saveUserSettings(apiKeys: any, preferences: any): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return false;

      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: user.id,
          api_keys: apiKeys,
          preferences: preferences
        })
        .eq('user_id', user.id);
      
      if (error) {
        console.error('Error saving user settings:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error in saveUserSettings:', error);
      return false;
    }
  }
}
