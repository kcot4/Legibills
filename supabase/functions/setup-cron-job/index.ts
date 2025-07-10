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
async function enablePgCronExtension() {
  try {
    console.log('Attempting to enable pg_cron extension...');
    // Try to enable the extension using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
    });
    if (error) {
      console.log('RPC method failed, trying alternative approach:', error.message);
      // Alternative: Try using the REST API directly
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': 'application/json',
          'apikey': SUPABASE_SERVICE_KEY
        },
        body: JSON.stringify({
          sql: 'CREATE EXTENSION IF NOT EXISTS pg_cron;'
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to enable pg_cron: ${errorText}`);
      }
    }
    console.log('pg_cron extension enabled successfully');
    return true;
  } catch (error) {
    console.error('Failed to enable pg_cron extension:', error);
    return false;
  }
}
async function checkPgCronExtension() {
  try {
    console.log('Checking if pg_cron extension is installed...');
    // Check if extension is installed
    const { data: installedData, error: installedError } = await supabase.from('pg_extension').select('extname').eq('extname', 'pg_cron').single();
    if (installedError && installedError.code !== 'PGRST116') {
      console.log('Cannot check installed extensions:', installedError.message);
      // If we can't even check installed, something is wrong, assume not installed
      return {
        available: false,
        installed: false
      };
    }
    const installed = !!installedData;
    console.log('pg_cron installed:', installed);
    // If it's installed, it must be available
    return {
      available: installed,
      installed: installed
    };
  } catch (error) {
    console.error('Error checking pg_cron extension:', error);
    return {
      available: false,
      installed: false
    };
  }
}
async function setupCronJob() {
  try {
    console.log('=== SETTING UP CRON JOB ===');
    const jobName = 'bill_import_job';
    const cronSchedule = '*/10 * * * *'; // Every 10 minutes
    const sqlCommand = `SELECT net.http_post(
      url := '${SUPABASE_URL}/functions/v1/scheduled-import',
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer ${SUPABASE_SERVICE_KEY}"}'::jsonb,
      body := '{}'::jsonb
    );`;
    // Step 1: Check pg_cron extension status
    const extensionStatus = await checkPgCronExtension();
    console.log('Extension status:', extensionStatus);
    // Step 2: Try to enable pg_cron if not installed
    if (extensionStatus.available && !extensionStatus.installed) {
      console.log('Attempting to enable pg_cron extension...');
      const enabled = await enablePgCronExtension();
      if (!enabled) {
        return {
          status: 'error',
          message: 'Failed to enable pg_cron extension',
          troubleshooting: {
            issue: 'pg_cron extension could not be enabled automatically',
            solution: 'Please enable it manually in the Supabase SQL editor',
            manualCommand: 'CREATE EXTENSION IF NOT EXISTS pg_cron;',
            note: 'You may need to contact Supabase support if the extension is not available'
          }
        };
      }
    } else if (!extensionStatus.available) {
      return {
        status: 'error',
        message: 'pg_cron extension is not available in this Supabase project',
        troubleshooting: {
          issue: 'pg_cron extension is not available',
          solution: 'Contact Supabase support to enable pg_cron for your project',
          alternative: 'Use GitHub Actions or external cron services as an alternative',
          note: 'pg_cron may not be available on all Supabase plans'
        }
      };
    }
    // Step 3: Remove existing job if it exists
    console.log('Removing existing cron job if it exists...');
    try {
      const { error: unscheduleError } = await supabase.rpc('exec_sql', {
        sql: `SELECT cron.unschedule('${jobName}');`
      });
      if (unscheduleError) {
        console.log('No existing job to remove or removal failed (this is normal)');
      } else {
        console.log('Existing job removed successfully');
      }
    } catch (error) {
      console.log('No existing job to remove (this is normal)');
    }
    // Step 4: Create the new cron job
    console.log('Creating new cron job...');
    console.log('Job details:', {
      name: jobName,
      schedule: cronSchedule,
      command: sqlCommand.substring(0, 100) + '...'
    });
    let jobCreated = false;
    let creationMethod = '';
    let creationError = null;
    // Method 1: Use cron.schedule function directly
    try {
      const scheduleSQL = `SELECT cron.schedule('${jobName}', '${cronSchedule}', $sql$${sqlCommand}$sql$);`;
      const { data: scheduleData, error: scheduleError } = await supabase.rpc('exec_sql', {
        sql: scheduleSQL
      });
      if (!scheduleError) {
        console.log('Method 1 succeeded: cron.schedule function');
        jobCreated = true;
        creationMethod = 'cron.schedule function';
      } else {
        console.log('Method 1 failed:', scheduleError.message);
        creationError = scheduleError.message;
      }
    } catch (error) {
      console.log('Method 1 failed:', error.message);
      creationError = error.message;
    }
    // Method 2: Direct insertion into cron.job table
    if (!jobCreated) {
      try {
        console.log('Trying Method 2: Direct table insertion');
        const { data: insertData, error: insertError } = await supabase.from('cron.job').insert({
          jobname: jobName,
          schedule: cronSchedule,
          command: sqlCommand,
          active: true,
          nodename: 'localhost'
        });
        if (!insertError) {
          console.log('Method 2 succeeded: Direct table insertion');
          jobCreated = true;
          creationMethod = 'Direct table insertion';
        } else {
          console.log('Method 2 failed:', insertError.message);
          creationError = insertError.message;
        }
      } catch (error) {
        console.log('Method 2 failed:', error.message);
        creationError = error.message;
      }
    }
    if (!jobCreated) {
      return {
        status: 'error',
        message: 'Failed to create cron job using all available methods',
        lastError: creationError,
        troubleshooting: {
          extensionStatus,
          issue: 'Cron job creation failed',
          solution: 'Try creating the job manually in the Supabase SQL editor',
          manualSQL: `SELECT cron.schedule('${jobName}', '${cronSchedule}', $sql$${sqlCommand}$sql$);`,
          verifySQL: `SELECT * FROM cron.job WHERE jobname = '${jobName}';`,
          note: 'Make sure you have the necessary permissions to create cron jobs'
        }
      };
    }
    // Step 5: Verify the job was created
    console.log('Verifying cron job creation...');
    const { data: jobs, error: listError } = await supabase.from('cron.job').select('*').eq('jobname', jobName);
    if (listError) {
      console.log('Verification failed but job might still exist:', listError.message);
    }
    const jobExists = jobs && jobs.length > 0;
    console.log('Job verification result:', {
      jobExists,
      jobs
    });
    return {
      status: 'success',
      message: 'Cron job created successfully to run every minute',
      details: {
        jobName,
        schedule: cronSchedule,
        creationMethod,
        extensionStatus,
        jobExists,
        nextRun: 'Within 1 minute',
        functionUrl: `${SUPABASE_URL}/functions/v1/scheduled-import`
      },
      verification: jobs || [],
      troubleshooting: {
        verifyCommand: `SELECT * FROM cron.job WHERE jobname = '${jobName}';`,
        monitorCommand: `SELECT * FROM cron.job_run_details WHERE jobname = '${jobName}' ORDER BY start_time DESC LIMIT 5;`,
        note: 'Monitor the job_run_details table to see execution history'
      }
    };
  } catch (error) {
    console.error('Setup failed:', error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      troubleshooting: {
        suggestion: 'Check if pg_cron extension is enabled and you have necessary permissions',
        enableCommand: 'CREATE EXTENSION IF NOT EXISTS pg_cron;',
        verifyCommand: 'SELECT * FROM pg_extension WHERE extname = \'pg_cron\';',
        permissionsNote: 'You may need superuser privileges to enable extensions',
        supportNote: 'Contact Supabase support if pg_cron is not available on your plan'
      }
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
    const result = await setupCronJob();
    return new Response(JSON.stringify(result, null, 2), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      status: result.status === 'error' ? 500 : 200
    });
  } catch (error) {
    console.error('Error in setup-cron-job function:', error);
    return new Response(JSON.stringify({
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
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
