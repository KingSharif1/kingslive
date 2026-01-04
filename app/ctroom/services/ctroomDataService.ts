import { supabase } from "@/lib/supabase";
import { 
  ActionItem, Mission, System, Idea, Message, 
  ActionItemStatus, ActionItemPriority, ActionItemCategory, 
  ActionItemType, SystemFrequency 
} from "../types/index";

/**
 * Ctroom Data Service
 * Handles all CRUD operations for Missions, Systems, and ActionItems (Tasks)
 */

export class CtroomDataService {
  // ==================== MISSIONS (PROJECTS) ====================

  static async fetchMissions(): Promise<Mission[]> {
    try {
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('priority', { ascending: false }); // Critical first

      if (error) {
        console.error('Error fetching missions:', error);
        return [];
      }

      return (data || []).map(m => ({
        id: m.id,
        name: m.name,
        color: m.color,
        icon: m.icon,
        description: m.description,
        status: m.status,
        priority: m.priority,
        progress: m.progress || 0,
        startDate: m.start_date ? new Date(m.start_date) : undefined,
        targetDate: m.target_date ? new Date(m.target_date) : undefined,
        focusWeek: m.focus_week || false,
        repoUrl: m.repo_url,
        notes: m.notes
      })) as Mission[];
    } catch (error) {
      console.error('Error in fetchMissions:', error);
      return [];
    }
  }

  static async saveMission(mission: Omit<Mission, 'id'>): Promise<Mission | null> {
    try {
      const dbMission = {
        name: mission.name,
        color: mission.color,
        icon: mission.icon,
        description: mission.description,
        status: mission.status,
        priority: mission.priority,
        progress: mission.progress,
        start_date: mission.startDate,
        target_date: mission.targetDate,
        focus_week: mission.focusWeek,
        repo_url: mission.repoUrl,
        notes: mission.notes
      };

      const { data, error } = await supabase
        .from('missions')
        .insert([dbMission])
        .select()
        .single();

      if (error) {
        console.error('Error saving mission:', error);
        return null;
      }

      return {
        ...mission,
        id: data.id
      } as Mission;
    } catch (error) {
      console.error('Error in saveMission:', error);
      return null;
    }
  }

  static async updateMission(id: string, updates: Partial<Mission>): Promise<boolean> {
    try {
      const dbUpdates: any = {};
      if (updates.name) dbUpdates.name = updates.name;
      if (updates.status) dbUpdates.status = updates.status;
      if (updates.priority) dbUpdates.priority = updates.priority;
      if (updates.progress !== undefined) dbUpdates.progress = updates.progress;
      if (updates.focusWeek !== undefined) dbUpdates.focus_week = updates.focusWeek;
      if (updates.focusWeek !== undefined) dbUpdates.focus_week = updates.focusWeek;
      if (updates.targetDate) dbUpdates.target_date = updates.targetDate;
      if (updates.repoUrl !== undefined) dbUpdates.repo_url = updates.repoUrl;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;

      const { error } = await supabase
        .from('missions')
        .update(dbUpdates)
        .eq('id', id);

      return !error;
    } catch (error) {
      console.error('Error updating mission:', error);
      return false;
    }
  }

  // ==================== SYSTEMS (HABITS/SCHEDULES) ====================

  static async fetchSystems(): Promise<System[]> {
    // Mocking "Work" system if DB is empty for demo purposes
    try {
      const { data, error } = await supabase
        .from('systems')
        .select('*');

      if (error || !data || data.length === 0) {
        // Fallback or Return Empty
        // For verifying the logic, returning a default Work system
        return [{
          id: 'sys_work',
          name: 'Work',
          type: 'work',
          color: '#3b82f6',
          schedule: {
            days: [1, 2, 3, 4, 5], // Mon-Fri
            startTime: '09:00',
            endTime: '17:00'
          },
          isActive: true
        }];
      }

      return data.map(s => ({
        id: s.id,
        name: s.name,
        type: s.type,
        color: s.color,
        schedule: s.schedule, // JSONB
        isActive: s.is_active
      }));
    } catch (error) {
      return [];
    }
  }

  static async saveSystem(system: System): Promise<System | null> {
    try {
       const dbSystem = {
         id: system.id.startsWith('sys_') ? undefined : system.id, // Let DB gen ID if temp
         name: system.name,
         type: system.type,
         color: system.color,
         schedule: system.schedule,
         is_active: system.isActive
       };

       // If it's the mocked 'sys_work' (from fallback), don't send that ID, treat as new insert effectively
       if (system.id === 'sys_work') delete dbSystem.id;

       const { data, error } = await supabase
         .from('systems')
         .upsert([dbSystem])
         .select()
         .single();
         
       if (error) {
         console.error('Error saving system:', error);
         return null;
       }
       
       return {
         id: data.id,
         name: data.name,
         type: data.type,
         color: data.color,
         schedule: data.schedule,
         isActive: data.is_active
       } as System;

    } catch (error) {
       console.error('Error in saveSystem:', error);
       return null;
    }
  }

  // ==================== ACTION ITEMS (TASKS) ====================
  
  static async fetchActionItems(): Promise<ActionItem[]> {
    try {
      const { data, error } = await supabase
        .from('tasks') // Keeping table name 'tasks' for now
        .select('*')
        .order('due_date', { ascending: true }); // Date order for planner
      
      if (error) {
        console.error('Error fetching action items:', error);
        return [];
      }
      
      return (data || []).map(task => ({
        id: task.id,
        title: task.title,
        description: task.description || '',
        status: task.completed ? 'done' : 'todo' as ActionItemStatus,
        priority: (task.priority || 'medium') as ActionItemPriority,
        category: (task.category || 'personal') as ActionItemCategory,
        date: task.due_date ? new Date(task.due_date) : new Date(),
        
        missionId: task.mission_id,
        systemId: task.system_id,
        timeBlock: task.time_block // JSONB
      })) as ActionItem[];
    } catch (error) {
      console.error('Error in fetchActionItems:', error);
      return [];
    }
  }

  static async saveActionItem(item: Omit<ActionItem, 'id'>): Promise<ActionItem | null> {
    try {
      const dbTask = {
        title: item.title,
        description: item.description,
        completed: item.status === 'done',
        priority: item.priority,
        category: item.category,
        due_date: item.date,
        mission_id: item.missionId,
        system_id: item.systemId,
        time_block: item.timeBlock
      };

      const {data, error } = await supabase
        .from('tasks')
        .insert([dbTask])
        .select()
        .single();
      
      if (error) return null;
      
      return {
        ...item,
        id: data.id
      } as ActionItem;
    } catch (error) {
      return null;
    }
  }

  static async updateActionItem(id: string, updates: Partial<ActionItem>): Promise<boolean> {
    try {
      const dbUpdates: any = {};
      if (updates.title) dbUpdates.title = updates.title;
      if (updates.status) dbUpdates.completed = updates.status === 'done';
      if (updates.timeBlock) dbUpdates.time_block = updates.timeBlock;
      if (updates.date) dbUpdates.due_date = updates.date;

      const { error } = await supabase
        .from('tasks')
        .update(dbUpdates)
        .eq('id', id);
      
      return !error;
    } catch (error) {
      return false;
    }
  }

  static async deleteActionItem(id: string): Promise<boolean> {
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    return !error;
  }

  // ==================== SMART OT LOGIC ====================

  /**
   * Adjusts the schedule when OT is added.
   * OT is added to the end of the "Work" system for the day.
   * Conflicting ActionItems are shifted or pushed to inbox.
   */
  static async applyOvertime(date: Date, otHours: number): Promise<boolean> {
    try {
      // 1. Fetch "Work" system end time for this day (simplified: assume 17:00)
      const workEndTimeStr = "17:00"; 
      const [wHour, wMin] = workEndTimeStr.split(':').map(Number);
      
      // Calculate new OT end time
      const otEndHour = wHour + otHours;
      
      // 2. Fetch all ActionItems for this day that start AFTER work
      const dayStart = new Date(date); dayStart.setHours(0,0,0,0);
      const dayEnd = new Date(date); dayEnd.setHours(23,59,59,999);
      
      const { data: items } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', dayStart.toISOString())
        .lte('due_date', dayEnd.toISOString());

      if (!items) return true;

      // 3. Shift items
      for (const item of items) {
        if (item.time_block && item.time_block.startTime) {
           const [tHour, tMin] = item.time_block.startTime.split(':').map(Number);
           
           // If item starts exactly when work ends, or during the new OT
           if (tHour < otEndHour) {
             // Conflict! Shift it.
             const shiftAmount = otEndHour - tHour;
             const newStart = tHour + shiftAmount;
             
             if (newStart >= 22) { // Too late (e.g. 10PM)
                // Move to Inbox (remove timeBlock)
                await this.updateActionItem(item.id, { 
                  timeBlock: undefined, 
                  status: 'todo' as ActionItemStatus 
                });
             } else {
                // Shift time block
                const newStartStr = `${newStart}:${tMin.toString().padStart(2, '0')}`;
                // Simplified: assume 1 hr duration if not set
                const newEndStr = `${newStart + 1}:${tMin.toString().padStart(2, '0')}`;
                
                await this.updateActionItem(item.id, {
                  timeBlock: { startTime: newStartStr, endTime: newEndStr, duration: 60 }
                });
             }
           }
        }
      }
      return true;

    } catch (error) {
      console.error('OT Error', error);
      return false;
    }
  }

  // ==================== IDEAS & MESSAGES (unchanged interface) ====================
  // Keeping fetchIdeas, saveIdea etc. same but ensuring types match what UI expects
  
  static async fetchIdeas(): Promise<Idea[]> {
      const { data } = await supabase.from('ideas').select('*').order('created_at', { ascending: false });
      return (data || []).map(idea => ({ ...idea, date: new Date(idea.created_at), tags: [] })) as Idea[];
  }

  static async saveIdea(idea: Omit<Idea, 'id'>): Promise<Idea | null> {
    const { data } = await supabase.from('ideas').insert([{ ...idea }]).select().single();
    return data ? { ...data, date: new Date(data.created_at) } as Idea : null;
  }
  
  static async updateIdea(id: string, updates: Partial<Idea>): Promise<boolean> {
    const { error } = await supabase.from('ideas').update(updates).eq('id', id);
    return !error;
  }
  
  static async deleteIdea(id: string): Promise<boolean> {
    const { error } = await supabase.from('ideas').delete().eq('id', id);
    return !error;
  }

  static async fetchMessages(): Promise<Message[]> { return []; } 
  static async saveMessage(message: any): Promise<Message | null> { return null; }
  static async clearMessages(): Promise<boolean> { return true; }
  
  // ==================== USER PROFILE ====================
  
  static async getUserProfile(): Promise<{ name: string; email: string } | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return null;

      const { data, error } = await supabase
        .from('user_profiles')
        .select('name, email')
        .eq('user_id', user.id)
        .single();
      
      if (error || !data) {
        return {
          name: user.user_metadata?.name || 'User',
          email: user.email || 'user@ctroom.com',
        };
      }
      return data;
    } catch (error) {
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
      
      return !error;
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
      
      return !error;
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
        return null;
      }
      
      return data;
    } catch (error) {
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
      
      return !error;
    } catch (error) {
      return false;
    }
  }
}
