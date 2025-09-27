// Database abstraction layer - easily switch between different databases

export interface DatabaseConfig {
  type: 'supabase' | 'firebase' | 'mongodb' | 'postgresql' | 'mysql';
  connectionString?: string;
  apiKey?: string;
  projectId?: string;
}

export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface DatabaseAdapter {
  // Auth methods
  signUp(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }>;
  signOut(): Promise<void>;
  getCurrentUser(): Promise<User | null>;
  
  // Notes methods
  createNote(data: any): Promise<{ success: boolean; note?: any; error?: string }>;
  getUserNotes(userId: string): Promise<{ success: boolean; notes?: any[]; error?: string }>;
  updateNote(id: string, data: any): Promise<{ success: boolean; note?: any; error?: string }>;
  deleteNote(id: string): Promise<{ success: boolean; error?: string }>;
  
  // File storage
  uploadFile(file: File, path: string): Promise<{ success: boolean; url?: string; error?: string }>;
  deleteFile(path: string): Promise<{ success: boolean; error?: string }>;
  
  // Generic query methods
  insert<T>(table: string, data: any): Promise<{ success: boolean; data?: T; error?: string }>;
  select<T>(table: string, conditions?: any): Promise<{ success: boolean; data?: T[]; error?: string }>;
  update<T>(table: string, id: string, data: any): Promise<{ success: boolean; data?: T; error?: string }>;
  delete(table: string, id: string): Promise<{ success: boolean; error?: string }>;
}

// Supabase adapter (current implementation)
export class SupabaseAdapter implements DatabaseAdapter {
  private supabase: any;
  
  constructor(config: DatabaseConfig) {
    // Initialize Supabase client
    import('@/integrations/supabase/client').then(({ supabase }) => {
      this.supabase = supabase;
    });
  }

  async signUp(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signUp({ email, password });
    return { 
      success: !error, 
      user: data?.user ? { id: data.user.id, email: data.user.email, createdAt: data.user.created_at } : undefined,
      error: error?.message 
    };
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({ email, password });
    return { 
      success: !error, 
      user: data?.user ? { id: data.user.id, email: data.user.email, createdAt: data.user.created_at } : undefined,
      error: error?.message 
    };
  }

  async signOut() {
    await this.supabase.auth.signOut();
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await this.supabase.auth.getUser();
    return user ? { id: user.id, email: user.email, createdAt: user.created_at } : null;
  }

  async createNote(data: any) {
    const { data: note, error } = await this.supabase.from('notes').insert(data).select().single();
    return { success: !error, note, error: error?.message };
  }

  async getUserNotes(userId: string) {
    const { data: notes, error } = await this.supabase
      .from('notes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { success: !error, notes, error: error?.message };
  }

  async updateNote(id: string, data: any) {
    const { data: note, error } = await this.supabase
      .from('notes')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    return { success: !error, note, error: error?.message };
  }

  async deleteNote(id: string) {
    const { error } = await this.supabase.from('notes').delete().eq('id', id);
    return { success: !error, error: error?.message };
  }

  async uploadFile(file: File, path: string) {
    const { data, error } = await this.supabase.storage.from('documents').upload(path, file);
    return { success: !error, url: data?.path, error: error?.message };
  }

  async deleteFile(path: string) {
    const { error } = await this.supabase.storage.from('documents').remove([path]);
    return { success: !error, error: error?.message };
  }

  async insert<T>(table: string, data: any) {
    const { data: result, error } = await this.supabase.from(table).insert(data).select().single();
    return { success: !error, data: result, error: error?.message };
  }

  async select<T>(table: string, conditions?: any) {
    let query = this.supabase.from(table).select('*');
    if (conditions) {
      Object.entries(conditions).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
    }
    const { data, error } = await query;
    return { success: !error, data, error: error?.message };
  }

  async update<T>(table: string, id: string, data: any) {
    const { data: result, error } = await this.supabase
      .from(table)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    return { success: !error, data: result, error: error?.message };
  }

  async delete(table: string, id: string) {
    const { error } = await this.supabase.from(table).delete().eq('id', id);
    return { success: !error, error: error?.message };
  }
}

// Firebase adapter example (commented out for now - implement when needed)
/*
export class FirebaseAdapter implements DatabaseAdapter {
  // Implementation would go here when needed
}
*/

// Database factory
export class DatabaseFactory {
  static createAdapter(config: DatabaseConfig): DatabaseAdapter {
    switch (config.type) {
      case 'supabase':
        return new SupabaseAdapter(config);
      case 'firebase':
        throw new Error('Firebase adapter not implemented yet - use Supabase for now');
      default:
        throw new Error(`Unsupported database type: ${config.type}`);
    }
  }
}

// Usage example:
// const db = DatabaseFactory.createAdapter({ type: 'supabase', apiKey: 'xxx' });
// const db = DatabaseFactory.createAdapter({ type: 'firebase', projectId: 'xxx' });
// const db = DatabaseFactory.createAdapter({ type: 'mongodb', connectionString: 'xxx' });