import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ycbupihievenxlsdtmtq.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljYnVwaWhpZXZlbnhsc2R0bXRxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDczMTg1MDksImV4cCI6MjA2Mjg5NDUwOX0.zl9Ifz9qx04HcsJm-lhN24tKC2oBt9F1T38D5wTb9nU'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
