import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { backOff } from 'npm:exponential-backoff@3.1.1';

const CONGRESS_API_KEY = Deno.env.get('CONGRESS_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const CONGRESS_API_URL = 'https://api.congress.gov/v3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables');
}

if (!CONGRESS_API_KEY) {
  throw new Error('Congress API key is not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// Helper function to safely parse dates
function parseDate(dateStr: string | null | undefined): string | null {
  if (!dateStr || dateStr.trim() === '') {
    return null;
  }
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch {
    return null;
  }
}

// Helper function to safely convert values to strings
function safeStringValue(value: any): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (typeof value === 'string') {
    return value.trim() || null;
  }
  if (typeof value === 'number') {
    return value.toString();
  }
  // For any other type, convert to string and trim
  try {
    const stringValue = String(value).trim();
    return stringValue || null;
  } catch {
    return null;
  }
}

// Helper function to validate and clean sponsor data (re-used for legislators)
function validateLegislatorData(member: any): { isValid: boolean; reason?: string; cleanedMember?: any } {
  // Check for required fields that are NOT NULL in the database
  if (!member.bioguideId) {
    return { isValid: false, reason: 'Missing bioguideId' };
  }
  if (!member.fullName) {
    return { isValid: false, reason: 'Missing fullName' };
  }
  // Party, state, and chamber might be missing for some historical members or edge cases
  // We'll provide fallbacks for these in the upsert data

  const cleanedMember = {
    bioguideId: safeStringValue(member.bioguideId) || '',
    fullName: safeStringValue(member.fullName) || '',
    firstName: safeStringValue(member.firstName) || null,
    lastName: safeStringValue(member.lastName) || null,
    party: safeStringValue(member.partyHistory?.[0]?.partyName) || 'Unknown',
    state: safeStringValue(member.state) || 'Unknown',
    chamber: safeStringValue(member.terms?.[0]?.chamber) || 'Unknown',
    congressStartDate: member.terms?.[0]?.start || null,
    congressEndDate: member.terms?.[member.terms.length - 1]?.end || null,
    url: safeStringValue(member.url) || null,
    imageUrl: safeStringValue(member.depiction?.imageUrl) || null,
  };

  // Final validation after cleaning for critical NOT NULL fields
  if (!cleanedMember.bioguideId || !cleanedMember.fullName || !cleanedMember.party || !cleanedMember.state || !cleanedMember.chamber) {
    return { isValid: false, reason: 'Critical fields became empty after cleaning' };
  }

  return { isValid: true, cleanedMember };
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: any = null;
  let attempts = 0;
  try {
    console.log(`Attempting to fetch: ${url}`);
    const response = await backOff(async () => {
      attempts++;
      try {
        console.log(`Fetch attempt ${attempts} for URL: ${url}`);
        const res = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Legislative-Clarity/1.0',
            'X-API-Key': CONGRESS_API_KEY
          },
          signal: AbortSignal.timeout(30000)
        });

        if (!res.ok) {
          const errorText = await res.text();
          console.error('Fetch response error:', {
            status: res.status,
            statusText: res.statusText,
            headers: Object.fromEntries(res.headers.entries()),
            body: errorText
          });
          throw new Error(`HTTP error! status: ${res.status}, body: ${errorText}`);
        }
        console.log(`Successful fetch for ${url} on attempt ${attempts}`);
        return res;
      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempts} failed for ${url}:`, {
          error: error.message,
          type: error.name,
          stack: error.stack
        });
        throw error;
      }
    }, {
      numOfAttempts: 3,
      startingDelay: 1000,
      timeMultiple: 2,
      jitter: 'full',
      retry: (error: any) => {
        console.log(`Retry evaluation for attempt ${attempts}:`, {
          error: error.message,
          willRetry: attempts < 3
        });
        return attempts < 3;
      }
    });
    return response;
  } catch (error: any) {
    const enhancedError = new Error(`Failed to fetch ${url} after ${attempts} attempts. ` + `Original error: ${lastError?.message || error.message}`);
    console.error('Enhanced error details:', {
      message: enhancedError.message,
      originalError: lastError?.message || error.message,
      attempts,
      url
    });
    throw enhancedError;
  }
}

async function acquireLock(lockKey: string, timeoutMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  try {
    // First clean up any stale locks
    const staleTimeout = new Date();
    staleTimeout.setMinutes(staleTimeout.getMinutes() - 5);
    await supabase.from('system_locks').delete().lt('locked_at', staleTimeout.toISOString());

    // Try to acquire the lock
    const { error } = await supabase.from('system_locks').insert({ lock_key: lockKey });

    if (!error) {
      console.log(`Lock acquired: ${lockKey}`);
      return true;
    }

    // If lock exists, wait and retry until timeout
    while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const { data: existingLock } = await supabase.from('system_locks').select('locked_at').eq('lock_key', lockKey).single();
      if (!existingLock) {
        const { error: retryError } = await supabase.from('system_locks').insert({ lock_key: lockKey });
        if (!retryError) {
          console.log(`Lock acquired after retry: ${lockKey}`);
          return true;
        }
      }
    }
    console.log(`Failed to acquire lock: ${lockKey} (timeout)`);
    return false;
  } catch (error) {
    console.error('Error acquiring lock:', error);
    return false;
  }
}

async function releaseLock(lockKey: string): Promise<void> {
  try {
    const { error } = await supabase.from('system_locks').delete().eq('lock_key', lockKey);
    if (error) {
      console.error('Error releasing lock:', error);
    } else {
      console.log(`Lock released: ${lockKey}`);
    }
  } catch (error) {
    console.error('Error releasing lock:', error);
  }
}

async function importLegislators(startCongress = '119', endCongress = '100'): Promise<any> {
  const lockKey = `import_legislators_${startCongress}_${endCongress}`;
  // Acquire lock to prevent concurrent runs
  const { data: existingLock } = await supabase.from('system_locks').select('locked_at').eq('lock_key', lockKey).single();
  if (existingLock) {
    console.log('Another import process is running');
    return { status: 'locked' };
  }

  try {
    const { error: lockError } = await supabase.from('system_locks').insert({ lock_key: lockKey });
    if (lockError) throw lockError;
    console.log(`Lock acquired: ${lockKey}`);

    console.log(`Starting legislator import for Congresses ${startCongress} down to ${endCongress}`);
    let totalImported = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    const congresses = Array.from({ length: Number(startCongress) - Number(endCongress) + 1 }, (_, i) => String(Number(startCongress) - i));

    for (const congress of congresses) {
      console.log(`Processing ${congress}th Congress for legislators`);
      let allMembers: any[] = [];
      let offset = 0;
      const limit = 250; // Max limit per request

      while (true) {
        const url = `${CONGRESS_API_URL}/member?congress=${congress}&limit=${limit}&offset=${offset}&api_key=${CONGRESS_API_KEY}`;
        console.log(`Fetching members from: ${url}`);
        const response = await fetchWithRetry(url);
        const data = await response.json();
        const members = data.members || [];
        allMembers.push(...members);

        if (members.length < limit) {
          break; // No more members for this congress
        }
        offset += limit;
      }

      console.log(`Found ${allMembers.length} members in ${congress}th Congress`);

      const batchSize = 10; // Process 10 members in parallel
      for (let i = 0; i < allMembers.length; i += batchSize) {
        const batch = allMembers.slice(i, i + batchSize);
        console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(allMembers.length / batchSize)} for ${congress}th Congress`);

        await Promise.all(batch.map(async (member) => {
          try {
            const validation = validateLegislatorData(member);
            if (!validation.isValid) {
              console.warn(`Skipping invalid legislator ${member.bioguideId || member.fullName || 'Unknown'}: ${validation.reason}`);
              errors.push(`Legislator ${member.bioguideId || member.fullName || 'Unknown'}: ${validation.reason}`);
              return;
            }
            const cleanedMember = validation.cleanedMember;

            const legislatorData = {
              bioguide_id: cleanedMember.bioguideId,
              full_name: cleanedMember.fullName,
              first_name: cleanedMember.firstName,
              last_name: cleanedMember.lastName,
              party: cleanedMember.party,
              state: cleanedMember.state,
              chamber: cleanedMember.chamber,
              congress_start_date: cleanedMember.congressStartDate,
              congress_end_date: cleanedMember.congressEndDate,
              url: cleanedMember.url,
              image_url: cleanedMember.imageUrl,
              last_updated: new Date().toISOString()
            };

            const { error: upsertError } = await supabase
              .from('legislators')
              .upsert(legislatorData, { onConflict: 'bioguide_id' });

            if (upsertError) {
              console.error(`Error upserting legislator ${member.bioguideId}:`, upsertError);
              errors.push(`${member.bioguideId}: ${upsertError.message}`);
            } else {
              // Check if it was an insert or update (requires a separate select after upsert)
              const { data: existing } = await supabase.from('legislators').select('bioguide_id').eq('bioguide_id', member.bioguideId).single();
              if (existing) {
                totalUpdated++;
              } else {
                totalImported++;
              }
              console.log(`✓ Upserted legislator ${member.fullName} (${member.bioguideId})`);
            }
          } catch (error) {
            console.error(`Error processing member ${member.bioguideId}:`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              stack: error instanceof Error ? error.stack : undefined
            });
            errors.push(`${member.bioguideId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }));
        // Add a small delay after each batch to respect API limits
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    return { status: 'success', imported: totalImported, updated: totalUpdated, errors: errors.length > 0 ? errors : undefined };
  } catch (error: any) {
    console.error('Legislator import failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    // Release lock
    const { error } = await supabase.from('system_locks').delete().eq('lock_key', lockKey);
    if (error) {
      console.error('Error releasing lock:', error);
    } else {
      console.log(`Lock released: ${lockKey}`);
    }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Admin check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error('Authentication error:', authError?.message);
      return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      console.error('Authorization error: User is not admin', profileError?.message);
      return new Response(JSON.stringify({ status: 'error', message: 'Forbidden: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Edge function invoked with URL:', req.url);
    const url = new URL(req.url);
    const startCongress = url.searchParams.get('startCongress') || '119';
    const endCongress = url.searchParams.get('endCongress') || '100'; // Default to Congress 100

    console.log('Processing request with parameters:', {
      startCongress,
      endCongress,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries())
    });

    const result = await importLegislators(startCongress, endCongress);
    console.log('Import completed with result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error in import-legislators function:', {
      error: error.message,
      stack: error.stack,
      type: error.name
    });
    return new Response(JSON.stringify({
      status: 'error',
      message: error.message,
      type: error.name,
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});