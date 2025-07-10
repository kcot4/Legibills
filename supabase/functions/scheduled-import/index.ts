import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables');
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});
async function cleanupStaleLocks() {
  try {
    console.log('Cleaning up stale locks...');
    const staleTimeout = new Date();
    staleTimeout.setMinutes(staleTimeout.getMinutes() - 10);
    const { data, error } = await supabase.from('system_locks').delete().lt('locked_at', staleTimeout.toISOString()).select();
    if (error) {
      console.error('Error cleaning up stale locks:', error);
    } else if (data) {
      console.log(`Cleaned up ${data.length} stale locks`);
    }
  } catch (error) {
    console.error('Error in cleanupStaleLocks:', error);
  }
}
async function testDatabaseConnection() {
  try {
    console.log('Testing database connection...');
    // Simple connectivity test
    const { data, error } = await supabase.from('bills').select('count(*)', {
      count: 'exact',
      head: true
    });
    if (error) {
      console.error('Database connectivity test failed:', {
        message: error.message,
        code: error.code,
        details: error.details
      });
      throw new Error(`Database connectivity failed: ${error.message}`);
    }
    console.log('Database connectivity: OK');
    console.log('Current bill count:', data?.count || 0);
    return true;
  } catch (error) {
    console.error('Database connection test error:', error);
    throw error;
  }
}
async function triggerImport() {
  try {
    console.log('=== CRON JOB EXECUTION STARTED ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Environment check:', {
      hasSupabaseUrl: !!SUPABASE_URL,
      hasServiceKey: !!SUPABASE_SERVICE_KEY,
      supabaseUrl: SUPABASE_URL?.substring(0, 30) + '...'
    });
    // Test database connectivity with better error handling
    await testDatabaseConnection();
    // Clean up any stale locks first
    await cleanupStaleLocks();
    // Check for active imports with more detailed logging
    const { data: activeLocks, error: lockError } = await supabase.from('system_locks').select('lock_key, locked_at').ilike('lock_key', 'import_bills_%');
    if (lockError) {
      console.error('Error checking locks:', lockError);
      throw new Error(`Lock check failed: ${lockError.message}`);
    }
    if (activeLocks?.length > 0) {
      const lock = activeLocks[0];
      const lockAge = Date.now() - new Date(lock.locked_at).getTime();
      const lockAgeMinutes = Math.floor(lockAge / 60000);
      console.log(`Found active import lock: ${lock.lock_key} (${lockAgeMinutes} minutes old)`);
      // If lock is very old (>30 minutes), force cleanup and proceed
      if (lockAgeMinutes > 30) {
        console.log('Lock is very old, forcing cleanup...');
        await supabase.from('system_locks').delete().eq('lock_key', lock.lock_key);
        console.log('Stale lock removed, proceeding with import...');
      } else {
        return {
          status: 'locked',
          message: 'Another import process is currently running',
          details: {
            lockKey: lock.lock_key,
            lockedAt: lock.locked_at,
            ageMinutes: lockAgeMinutes
          }
        };
      }
    }
    // Test the import function endpoint first
    const importFunctionUrl = `${SUPABASE_URL}/functions/v1/import-bills`;
    console.log('Testing import function endpoint:', importFunctionUrl);
    try {
      const testResponse = await fetch(importFunctionUrl, {
        method: 'HEAD',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
        }
      });
      console.log('Import function test response:', {
        status: testResponse.status,
        statusText: testResponse.statusText
      });
      if (testResponse.status === 404) {
        throw new Error('Import function not found - check if it\'s deployed');
      }
    } catch (testError) {
      console.error('Import function test failed:', testError);
      throw new Error(`Import function test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`);
    }
    // Import bills from multiple congresses for comprehensive coverage
    console.log('Triggering import for congresses 119 down to 118...');
    const importUrl = `${importFunctionUrl}?startCongress=119&endCongress=118`;
    console.log('Full import URL:', importUrl);
    const startTime = Date.now();
    const response = await fetch(importUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    const responseTime = Date.now() - startTime;
    console.log('Import function response:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`
    });
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Import function HTTP error:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Import failed: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const result = await response.json();
    console.log('Import completed successfully:', result);
    // Log final statistics
    const { data: finalCount } = await supabase.from('bills').select('count(*)', {
      count: 'exact',
      head: true
    });
    console.log('=== CRON JOB EXECUTION COMPLETED ===');
    console.log('Final bill count:', finalCount?.count || 0);
    console.log('Total execution time:', `${responseTime}ms`);
    return {
      status: 'success',
      message: 'Import completed successfully',
      result,
      executionTime: responseTime,
      finalBillCount: finalCount?.count || 0
    };
  } catch (error) {
    console.error('=== CRON JOB EXECUTION FAILED ===');
    console.error('Error in triggerImport:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    };
  }
}
Deno.serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: corsHeaders
    });
  }
  try {
    console.log('=== SCHEDULED IMPORT FUNCTION INVOKED ===');
    console.log('Request details:', {
      method: req.method,
      url: req.url,
      timestamp: new Date().toISOString()
    });
    const result = await triggerImport();
    console.log('Scheduled import result:', result);
    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: result.status === 'locked' ? 423 : result.status === 'error' ? 500 : 200
    });
  } catch (error) {
    console.error('=== SCHEDULED IMPORT FUNCTION ERROR ===');
    console.error('Error in scheduled-import function:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      error: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
