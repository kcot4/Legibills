import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

// Ensure environment variables are defined
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Enhanced validation of Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    timestamp: new Date().toISOString()
  });
  throw new Error(
    'Missing Supabase configuration. Please:\n' +
    '1. Click the "Connect to Supabase" button in the top right\n' +
    '2. Follow the setup process to connect your Supabase project\n' +
    '3. Ensure the environment variables are properly set in .env'
  );
}

// Validate URL format before creating client
try {
  new URL(supabaseUrl);
} catch (e) {
  console.error('Invalid Supabase URL format:', {
    url: supabaseUrl,
    error: e instanceof Error ? e.message : 'Unknown error'
  });
  throw new Error(`Invalid Supabase URL format: ${supabaseUrl}`);
}

console.log('Initializing Supabase client', {
  url: supabaseUrl,
  timestamp: new Date().toISOString()
});

// Configure client with enhanced error handling and timeouts
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-client-info': 'legislative-clarity@1.0.0',
    },
    fetch: (url, options = {}) => {
      // Add timeout and better error handling to fetch requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => {
        clearTimeout(timeoutId);
      }).catch(error => {
        console.error('Supabase fetch error:', {
          url,
          error: error.message,
          name: error.name,
          timestamp: new Date().toISOString()
        });
        
        // Provide more specific error messages
        if (error.name === 'AbortError') {
          throw new Error('Request timed out. Please check your internet connection and try again.');
        } else if (error.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to database. Please check:\n1. Your internet connection\n2. Supabase project status\n3. CORS settings in Supabase dashboard');
        }
        
        throw error;
      });
    }
  },
  db: {
    schema: 'public'
  },
  realtime: {
    params: {
      eventsPerSecond: 2
    }
  }
});

// Enhanced connection test with better error handling and diagnostics
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const testConnection = async (retryCount = 0): Promise<boolean> => {
  try {
    console.log('Testing Supabase connection...', {
      attempt: retryCount + 1,
      maxRetries: MAX_RETRIES,
      url: supabaseUrl,
      timestamp: new Date().toISOString()
    });
    
    const startTime = Date.now();
    
    // Test basic connectivity first
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('Basic connectivity test passed');
    } catch (connectError) {
      console.error('Basic connectivity test failed:', connectError);
      throw new Error(`Cannot reach Supabase server: ${connectError instanceof Error ? connectError.message : 'Unknown error'}`);
    }
    
    // Test database query
    const { data, error, status, statusText } = await supabase
      .from('bills')
      .select('id, number')
      .limit(1);

    const endTime = Date.now();
    const latency = endTime - startTime;

    if (error) {
      console.error('Database query error:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        timestamp: new Date().toISOString()
      });

      // Check for specific error types and provide helpful messages
      if (error.code === 'PGRST301') {
        throw new Error('Database schema validation failed. Please check your Supabase project setup.');
      } else if (error.code === '42P01') {
        console.warn('Bills table not found - this may be expected for new installations');
        return true; // Consider this a successful connection
      } else if (error.code === '28P01') {
        throw new Error('Invalid database credentials. Please check your VITE_SUPABASE_ANON_KEY.');
      } else if (error.code === 'PGRST116') {
        throw new Error('Database connection failed. Please check your Supabase project status.');
      }

      throw new Error(`Database error: ${error.message}`);
    }

    console.log('Supabase connection test successful:', {
      latency: `${latency}ms`,
      status,
      statusText,
      hasData: !!data?.length,
      dataCount: data?.length || 0,
      timestamp: new Date().toISOString()
    });
    
    return true;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Connection test failed, retrying (${retryCount + 1}/${MAX_RETRIES}) in ${RETRY_DELAY}ms...`);
      console.log('Error details:', errorMessage);
      await sleep(RETRY_DELAY);
      return testConnection(retryCount + 1);
    }
    
    console.error('Failed to connect to Supabase after multiple attempts:', {
      error: errorMessage,
      stack: err instanceof Error ? err.stack : undefined,
      type: err instanceof Error ? err.constructor.name : typeof err,
      url: supabaseUrl,
      retryAttempts: retryCount,
      timestamp: new Date().toISOString()
    });
    
    // Provide actionable error message
    const actionableError = new Error(
      `Unable to connect to Supabase database after ${MAX_RETRIES + 1} attempts.\n\n` +
      `Error: ${errorMessage}\n\n` +
      `Please check:\n` +
      `1. Your internet connection\n` +
      `2. Supabase project URL: ${supabaseUrl}\n` +
      `3. Supabase project status in dashboard\n` +
      `4. CORS settings (add localhost:5173 to allowed origins)\n` +
      `5. Environment variables in .env file`
    );
    
    throw actionableError;
  }
};

const checkSupabaseConnection = () => testConnection();
const getSupabaseUrl = () => supabaseUrl;

// Export a function to diagnose connection issues
export const diagnoseConnection = async (): Promise<{
  hasConfig: boolean;
  canReachServer: boolean;
  canQueryDatabase: boolean;
  error?: string;
}> => {
  const result = {
    hasConfig: false,
    canReachServer: false,
    canQueryDatabase: false,
    error: undefined as string | undefined
  };

  try {
    // Check configuration
    result.hasConfig = !!(supabaseUrl && supabaseAnonKey);
    if (!result.hasConfig) {
      result.error = 'Missing Supabase configuration';
      return result;
    }

    // Test server connectivity
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      result.canReachServer = response.ok;
    } catch (e) {
      result.error = `Cannot reach server: ${e instanceof Error ? e.message : 'Unknown error'}`;
      return result;
    }

    // Test database query
    try {
      const { error } = await supabase.from('bills').select('id').limit(1);
      result.canQueryDatabase = !error;
      if (error) {
        result.error = `Database query failed: ${error.message}`;
      }
    } catch (e) {
      result.error = `Database query error: ${e instanceof Error ? e.message : 'Unknown error'}`;
    }

    return result;
  } catch (e) {
    result.error = `Diagnosis failed: ${e instanceof Error ? e.message : 'Unknown error'}`;
    return result;
  }
};