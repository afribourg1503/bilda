import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://aifrmvlajweesojgrpvd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpZnJtdmxhandlZXNvamdycHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODc3MDcsImV4cCI6MjA2OTU2MzcwN30.ctKkgK6kxEh1FvD-sJIhmGzVMNqus8zf95Tjl0cDqjw'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Database types matching our schema
export interface Database {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          emoji: string
          color: string
          description?: string
          is_public: boolean
          github_repo?: string
          website?: string
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          emoji: string
          color: string
          description?: string
          is_public?: boolean
          github_repo?: string
          website?: string
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          emoji?: string
          color?: string
          description?: string
          is_public?: boolean
          github_repo?: string
          website?: string
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          project_id: string
          duration: number
          note?: string
          mood: number
          is_deleted?: boolean
          metrics?: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          duration: number
          note?: string
          mood?: number
          is_deleted?: boolean
          metrics?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          duration?: number
          note?: string
          mood?: number
          is_deleted?: boolean
          metrics?: any
          created_at?: string
          updated_at?: string
        }
      }
      live_sessions: {
        Row: {
          id: string
          user_id: string
          project_id: string
          started_at: string
          note?: string
          mood?: number
          viewers_count: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id: string
          started_at?: string
          note?: string
          mood?: number
          viewers_count?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string
          started_at?: string
          note?: string
          mood?: number
          viewers_count?: number
          created_at?: string
        }
      }
      challenges: {
        Row: {
          id: string
          name: string
          description: string
          emoji: string
          color: string
          duration: number
          goal: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          emoji?: string
          color?: string
          duration: number
          goal: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          emoji?: string
          color?: string
          duration?: number
          goal?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      challenge_participants: {
        Row: {
          id: string
          challenge_id: string
          user_id: string
          joined_at: string
          progress: number
          score: number
        }
        Insert: {
          id?: string
          challenge_id: string
          user_id: string
          joined_at?: string
          progress?: number
          score?: number
        }
        Update: {
          id?: string
          challenge_id?: string
          user_id?: string
          joined_at?: string
          progress?: number
          score?: number
        }
      }
      session_kudos: {
        Row: {
          id: string
          session_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          created_at?: string
        }
      }
      session_comments: {
        Row: {
          id: string
          session_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
      profiles: {
        Row: {
          user_id: string
          handle: string
          name?: string
          avatar_url?: string
          bio?: string
          links?: any
          auto_share_enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          handle: string
          name?: string
          avatar_url?: string
          bio?: string
          links?: any
          auto_share_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          handle?: string
          name?: string
          avatar_url?: string
          bio?: string
          links?: any
          auto_share_enabled?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          actor_id?: string
          entity_type?: string
          entity_id?: string
          data?: any
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          actor_id?: string
          entity_type?: string
          entity_id?: string
          data?: any
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          actor_id?: string
          entity_type?: string
          entity_id?: string
          data?: any
          read?: boolean
          created_at?: string
        }
      }
      reports: {
        Row: {
          id: string
          reporter_id?: string
          entity_type: string
          entity_id: string
          reason?: string
          created_at: string
        }
        Insert: {
          id?: string
          reporter_id?: string
          entity_type: string
          entity_id: string
          reason?: string
          created_at?: string
        }
        Update: {
          id?: string
          reporter_id?: string
          entity_type?: string
          entity_id?: string
          reason?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 