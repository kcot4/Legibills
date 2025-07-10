type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      bills: {
        Row: {
          id: string
          number: string
          title: string
          summary: string | null
          simplified_text: string | null
          original_text: string | null
          status: string
          chamber: string
          introduced_date: string
          last_action_date: string
          expected_vote_date: string | null
          category: string
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          number: string
          title: string
          summary?: string | null
          simplified_text?: string | null
          original_text?: string | null
          status: string
          chamber: string
          introduced_date: string
          last_action_date: string
          expected_vote_date?: string | null
          category: string
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          number?: string
          title?: string
          summary?: string | null
          simplified_text?: string | null
          original_text?: string | null
          status?: string
          chamber?: string
          introduced_date?: string
          last_action_date?: string
          expected_vote_date?: string | null
          category?: string
          created_at?: string | null
          updated_at?: string | null
        }
      }
    }
  }
}