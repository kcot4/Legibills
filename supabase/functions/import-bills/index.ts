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

// Helper function to validate and clean sponsor data
function validateSponsorData(sponsor: any): { isValid: boolean; reason?: string; cleanedSponsor?: any } {
  // Check for required fields
  if (!sponsor.firstName || !sponsor.lastName) {
    return { isValid: false, reason: 'Missing required name fields' };
  }
  if (!sponsor.party) {
    return { isValid: false, reason: 'Missing required party field' };
  }
  if (!sponsor.state) {
    return { isValid: false, reason: 'Missing required state field' };
  }

  // Clean and validate the data with safe string conversion
  const cleanedSponsor = {
    bioguideId: safeStringValue(sponsor.bioguideId),
    firstName: safeStringValue(sponsor.firstName),
    lastName: safeStringValue(sponsor.lastName),
    party: safeStringValue(sponsor.party),
    state: safeStringValue(sponsor.state),
    district: safeStringValue(sponsor.district),
    fullName: `${safeStringValue(sponsor.firstName)} ${safeStringValue(sponsor.lastName)}`,
    sponsorshipDate: sponsor.sponsorshipDate || null,
    isOriginalCosponsor: sponsor.isOriginalCosponsor || false
  };

  // Final validation after cleaning
  if (!cleanedSponsor.firstName || !cleanedSponsor.lastName || !cleanedSponsor.party || !cleanedSponsor.state) {
    return { isValid: false, reason: 'Required fields became empty after cleaning' };
  }

  return { isValid: true, cleanedSponsor };
}

// Helper function to validate date strings - now accepts any valid date
function isValidDateString(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}

// Map Congress.gov action codes and text to our LegislativeStatus type
function mapCongressGovActionToLegislativeStatus(actionCode: string | null | undefined, actionText: string | null | undefined): string {
  const code = actionCode?.toString() || '';
  const text = actionText?.toLowerCase() || '';

  // Check for enacted/signed bills
  if (code === '8000' || code === '17000' || text.includes('became public law') || text.includes('signed by president') || text.includes('became law') || text.includes('public law')) {
    return 'enacted';
  }
  // Check for vetoed bills
  if (code === '9000' || text.includes('vetoed') || text.includes('pocket vetoed')) {
    return 'vetoed';
  }
  // Check for bills sent to president
  if (code === '7000' || text.includes('presented to president') || text.includes('sent to president')) {
    return 'to_president';
  }
  // Check for passed house
  if (code === '8' || code === '36' || text.includes('passed house') || text.includes('passed/agreed to in house')) {
    return 'passed_house';
  }
  // Check for passed senate
  if (code === '17' || code === '25' || text.includes('passed senate') || text.includes('passed/agreed to in senate')) {
    return 'passed_senate';
  }
  // Check for committee actions
  if (code === '14000' || text.includes('reported by committee') || text.includes('committee discharged')) {
    return 'reported_by_committee';
  }
  // Check for referred to committee
  if (code === '11000' || text.includes('referred to') || text.includes('committee consideration')) {
    return 'referred_to_committee';
  }
  // Check for introduced
  if (code === '1000' || code === '10000' || text.includes('introduced') || text.includes('sponsor introductory remarks')) {
    return 'introduced';
  }

  // Default fallback
  return 'introduced';
}

async function testApiConnection(): Promise<boolean> {
  try {
    const testUrl = `${CONGRESS_API_URL}/bill/119/hr/1`;
    console.log('Testing API connection with URL:', testUrl);
    const response = await fetch(testUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Legislative-Clarity/1.0',
        'X-API-Key': CONGRESS_API_KEY
      },
      signal: AbortSignal.timeout(10000) // 10 second timeout for test
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Congress.gov API test failed:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: errorText
      });
      return false;
    }
    console.log('API connection test successful');
    return true;
  } catch (error: any) {
    console.error('Congress.gov API connection test failed:', {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return false;
  }
}

async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: any = null;
  let attempts = 0;
  try {
    // Test API connectivity first
    const isApiAvailable = await testApiConnection();
    if (!isApiAvailable) {
      throw new Error('Congress.gov API is currently unavailable');
    }

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

function processSponsors(sponsorList: any[]): any[] {
    const validSponsors: any[] = [];
    const invalidSponsors: string[] = [];

    (sponsorList || []).forEach((sponsor) => {
        const validation = validateSponsorData(sponsor);
        if (validation.isValid && validation.cleanedSponsor) {
            validSponsors.push({
                ...validation.cleanedSponsor,
                sponsorshipDate: sponsor.sponsorshipDate,
                isOriginalCosponsor: sponsor.isOriginalCosponsor
            });
        } else {
            invalidSponsors.push(`${sponsor.firstName || 'Unknown'} ${sponsor.lastName || 'Unknown'}: ${validation.reason}`);
        }
    });

    if (invalidSponsors.length > 0) {
        console.warn(`Skipped ${invalidSponsors.length} invalid sponsors:`, invalidSponsors);
    }
    return validSponsors;
}

async function fetchBillSponsors(congress: string, billType: string, billNumber: string, billObject: any = null): Promise<any[]> {
  try {
    // Optimization: If the bill object from the list view has sponsors, use them.
    if (billObject && billObject.sponsors && billObject.sponsors.length > 0) {
        console.log(`Using sponsors from bill object for ${congress}/${billType}/${billNumber}`);
        return processSponsors(billObject.sponsors);
    }

    console.log(`Fetching sponsors via API for ${congress}/${billType}/${billNumber}`);
    // First try to get the bill details which includes the primary sponsor
    const detailUrl = `${CONGRESS_API_URL}/bill/${congress}/${billType}/${billNumber}?api_key=${CONGRESS_API_KEY}`;
    const detailResponse = await fetchWithRetry(detailUrl);
    const detailData = await detailResponse.json();
    const primarySponsor = detailData.bill?.sponsors?.[0] ? [detailData.bill.sponsors[0]] : [];

    // Then fetch cosponsors
    const cosponsorUrl = `${CONGRESS_API_URL}/bill/${congress}/${billType}/${billNumber}/cosponsors?api_key=${CONGRESS_API_KEY}`;
    const cosponsorResponse = await fetchWithRetry(cosponsorUrl);
    const cosponsorData = await cosponsorResponse.json();
    const cosponsors = cosponsorData.cosponsors || [];

    return processSponsors([...primarySponsor, ...cosponsors]);

  } catch (error) {
    console.error('Error fetching sponsors:', error);
    return [];
  }
}

async function fetchBillCommittees(congress: string, billType: string, billNumber: string, billObject: any = null): Promise<any[]> {
  try {
    // Optimization: If the bill object from the list view has committees, use them.
    if (billObject && billObject.committees && billObject.committees.length > 0) {
        console.log(`Using committees from bill object for ${congress}/${billType}/${billNumber}`);
        return processCommittees(billObject.committees);
    }

    console.log(`Fetching committee activities via API for ${congress}/${billType}/${billNumber}`);
    const committeesUrl = `${CONGRESS_API_URL}/bill/${congress}/${billType}/${billNumber}/committees?api_key=${CONGRESS_API_KEY}`;
    const response = await fetchWithRetry(committeesUrl);
    const data = await response.json();
    return processCommittees(data.committees);

  } catch (error) {
    console.error('Error fetching committee activities:', error);
    return [];
  }
}

function processCommittees(committeeList: any[]): any[] {
    const committees: any[] = [];
    if (committeeList && Array.isArray(committeeList)) {
      committeeList.forEach((committee) => {
        if (!committee.name || !committee.chamber) {
          console.warn('Skipping committee with missing required fields:', committee);
          return;
        }
        const activities = committee.activities || [];
        activities.forEach((activity: any) => {
          if (!activity.date || !activity.name) {
            console.warn('Skipping activity with missing required fields:', activity);
            return;
          }
          let activityType = 'other';
          const activityName = activity.name.toLowerCase();
          if (activityName.includes('referred')) {
            activityType = 'referred';
          } else if (activityName.includes('markup') || activityName.includes('mark up')) {
            activityType = 'markup';
          } else if (activityName.includes('reported')) {
            activityType = 'reported';
          }

          let chamber = 'house';
          if (committee.chamber.toLowerCase().includes('senate')) {
            chamber = 'senate';
          } else if (committee.chamber.toLowerCase().includes('joint')) {
            chamber = 'joint';
          }

          committees.push({
            committee_name: committee.name,
            committee_chamber: chamber,
            committee_system_code: committee.systemCode || undefined,
            committee_url: committee.url || undefined,
            activity_date: activity.date,
            activity_text: activity.name,
            activity_type: activityType
          });
        });
      });
    }
    console.log(`Found ${committees.length} committee activities.`);
    return committees;
}

async function analyzeBillText(billId: string): Promise<void> {
  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/analyze-bill-text?billId=${billId}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to analyze bill text: ${response.status} ${response.statusText}, body: ${errorText}`);
    }
    const result = await response.json();
    console.log('Text analysis result:', result);
  } catch (error) {
    console.error('Error analyzing bill text:', error);
  }
}

// Improved date validation that ALWAYS prioritizes Congress.gov data
function validateAndNormalizeDates(params: { bill: any; detailData: any; actions: any[]; congress: string }): { introducedDate: string; lastActionDate: string } {
  const { bill, detailData, actions, congress } = params;

  // Log ALL available date sources from Congress.gov
  console.log(`🔍 DEBUGGING: All available date sources for bill ${bill.number}:`, {
    // From bill list API
    'bill.introducedDate': bill.introducedDate,
    'bill.updateDate': bill.updateDate,
    'bill.latestAction?.actionDate': bill.latestAction?.actionDate,
    // From detail API
    'detailData.bill?.introducedDate': detailData.bill?.introducedDate,
    'detailData.bill?.updateDate': detailData.bill?.updateDate,
    'detailData.bill?.latestAction?.actionDate': detailData.bill?.latestAction?.actionDate,
    // From actions
    actionsCount: actions.length,
    firstActionDate: actions[actions.length - 1]?.actionDate,
    firstActionText: actions[actions.length - 1]?.text,
    lastActionDate: actions[0]?.actionDate,
    lastActionText: actions[0]?.text,
    // Raw actions sample
    actionsPreview: actions.slice(0, 3).map((a) => ({
      date: a.actionDate,
      text: a.text?.substring(0, 50) + '...'
    }))
  });

  // Get congress start date as absolute fallback
  const congressNum = parseInt(congress, 10);
  const yearDiff = 118 - congressNum;
  const startYear = 2023 - yearDiff * 2;
  const congressStartDate = new Date(`${startYear}-01-03`).toISOString();

  let introducedDate: string;
  let lastActionDate: string;

  // Priority order for introduced date (most authoritative first):
  // 1. detailData.bill.introducedDate (from detailed API call)
  // 2. bill.introducedDate (from list API call)
  // 3. First action with "introduced" in text
  // 4. First chronological action
  // 5. Congress start date
  const potentialIntroducedDates = [
    { source: 'detailData.bill.introducedDate', value: detailData.bill?.introducedDate },
    { source: 'bill.introducedDate', value: bill.introducedDate }
  ];

  // Find first action that mentions "introduced"
  const introducedAction = actions.find((action) => action.text?.toLowerCase().includes('introduced') || action.actionCode === '1000' || action.actionCode === '10000');
  if (introducedAction) {
    potentialIntroducedDates.push({ source: 'introducedAction.actionDate', value: introducedAction.actionDate });
  }

  // Add first chronological action
  if (actions.length > 0) {
    const firstAction = actions[actions.length - 1];
    potentialIntroducedDates.push({ source: 'firstAction.actionDate', value: firstAction.actionDate });
  }

  // Find the first valid date
  let selectedIntroducedSource: string | null = null;
  for (const dateOption of potentialIntroducedDates) {
    if (dateOption.value && isValidDateString(dateOption.value)) {
      introducedDate = new Date(dateOption.value).toISOString();
      selectedIntroducedSource = dateOption.source;
      console.log(`✓ Using ${dateOption.source} for introduced date: ${introducedDate}`);
      break;
    }
  }

  if (!selectedIntroducedSource) {
    introducedDate = congressStartDate;
    console.log(`⚠ Using congress start date for introduced: ${introducedDate}`);
  }

  // Priority order for last action date:
  // 1. Latest action from actions array
  // 2. detailData.bill.latestAction.actionDate
  // 3. bill.latestAction.actionDate
  // 4. detailData.bill.updateDate
  // 5. bill.updateDate
  // 6. Introduced date (CRITICAL: for bills with only introduction action)
  const potentialLastActionDates = [
    { source: 'latestAction.actionDate', value: actions[0]?.actionDate },
    { source: 'detailData.bill.latestAction.actionDate', value: detailData.bill?.latestAction?.actionDate },
    { source: 'bill.latestAction.actionDate', value: bill.latestAction?.actionDate },
    { source: 'detailData.bill.updateDate', value: detailData.bill?.updateDate },
    { source: 'bill.updateDate', value: bill.updateDate }
  ];

  let selectedLastActionSource: string | null = null;
  for (const dateOption of potentialLastActionDates) {
    if (dateOption.value && isValidDateString(dateOption.value)) {
      lastActionDate = new Date(dateOption.value).toISOString();
      selectedLastActionSource = dateOption.source;
      console.log(`✓ Using ${dateOption.source} for last action date: ${lastActionDate}`);
      break;
    }
  }

  if (!selectedLastActionSource) {
    lastActionDate = introducedDate;
    console.log(`⚠ Using introduced date for last action: ${lastActionDate}`);
  }

  // Ensure logical order: introduced <= last action
  const introducedTime = new Date(introducedDate).getTime();
  const lastActionTime = new Date(lastActionDate).getTime();
  if (introducedTime > lastActionTime) {
    console.log(`⚠ Date order issue: introduced (${introducedDate}) > last action (${lastActionDate}), using introduced for both`);
    lastActionDate = introducedDate;
  }

  console.log(`✅ FINAL AUTHORITATIVE DATES for ${bill.number}:`, {
    introduced: introducedDate,
    introducedSource: selectedIntroducedSource || 'congress-start-fallback',
    lastAction: lastActionDate,
    lastActionSource: selectedLastActionSource || 'introduced-date-fallback',
    dataSource: 'Congress.gov'
  });

  return { introducedDate, lastActionDate };
}

// Updated determineCategory function to use mapped status
function determineCategory(bill: any, mappedStatus: string, actions: any[]): string {
  const daysAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  };

  // Check if bill is enacted
  if (mappedStatus === 'enacted') {
    return 'enacted';
  }

  // Check for trending bills (recent activity)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentActionsCount = (actions || []).filter((action: any) => {
    return new Date(action.date) > thirtyDaysAgo;
  }).length;

  if (recentActionsCount >= 3) {
    return 'trending';
  }

  // Check if bill was introduced recently
  if (bill.introducedDate && daysAgo(bill.introducedDate) <= 30) {
    return 'recent';
  }

  // Check if bill has upcoming votes or is in active consideration
  if (mappedStatus === 'passed_house' || mappedStatus === 'passed_senate' || mappedStatus === 'to_president' || bill.latestAction?.actionCode?.includes('VOTE')) {
    return 'upcoming';
  }

  // Default fallback
  return 'trending'; // Default to trending if no other category fits
}

async function importBills(startCongress = '119', endCongress = '119'): Promise<any> {
  const lockKey = `import_bills_${startCongress}_${endCongress}`;
  if (!await acquireLock(lockKey)) {
    console.log('Another import process is running');
    return { status: 'locked' };
  }

  try {
    console.log(`Starting bill import for Congresses ${endCongress} to ${startCongress}`);
    const types = ['hr', 's', 'hjres', 'sjres', 'hconres', 'sconres', 'hres', 'sres'];
    let totalImported = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    const congresses = Array.from({ length: Number(startCongress) - Number(endCongress) + 1 }, (_, i) => String(Number(startCongress) - i));

    for (const congress of congresses) {
      console.log(`Processing ${congress}th Congress`);
      for (const type of types) {
        try {
          // Determine the start and end dates for this Congress
          const congressStartDate = new Date(`${2023 - (118 - Number(congress)) * 2}-01-03`);
          const congressEndDate = new Date(`${2023 - (118 - Number(congress)) * 2 + 2}-01-03`);

          let currentStartDate = new Date(congressStartDate);
          let allBills: any[] = [];

          // Iterate through months (or other suitable intervals) within the Congress
          while (currentStartDate < congressEndDate) {
            const nextMonth = new Date(currentStartDate);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            const toDateTime = nextMonth < congressEndDate ? nextMonth : congressEndDate;

            // Format dates to YYYY-MM-DDTHH:MM:SSZ
            const formattedFromDateTime = currentStartDate.toISOString().slice(0, 19) + 'Z';
            const formattedToDateTime = toDateTime.toISOString().slice(0, 19) + 'Z';

            let offset = 0;
            const limit = 250;
            let hasMoreInDateRange = true;

            while (hasMoreInDateRange) {
              const url = `${CONGRESS_API_URL}/bill/${congress}/${type}?fromDateTime=${formattedFromDateTime}&toDateTime=${formattedToDateTime}&sort=updateDate+desc&limit=${limit}&offset=${offset}&api_key=${CONGRESS_API_KEY}`;
              console.log(`Fetching bills from: ${url}`);
              const response = await fetchWithRetry(url);
              const data = await response.json();
              const bills = data.bills || [];
              allBills.push(...bills);

              if (bills.length < limit) {
                hasMoreInDateRange = false; // No more bills in this date range
              }
              offset += limit;
            }
            currentStartDate = nextMonth;
          }

          console.log(`Found ${allBills.length} ${type.toUpperCase()} bills in ${congress}th Congress`);

          const batchSize = 2; // Process 2 bills in parallel
          for (let i = 0; i < allBills.length; i += batchSize) {
            const batch = allBills.slice(i, i + batchSize);
            console.log(`Processing batch ${i / batchSize + 1} of ${Math.ceil(allBills.length / batchSize)}`);

            await Promise.all(batch.map(async (bill) => {
              try {
                const billNumber = type.toUpperCase().replace(/^H$/, 'HR').replace(/^S$/, 'S') + bill.number;
                const { data: existingBill, error: checkError } = await supabase.from('bills').select('id, last_action_date, introduced_date, updated_at').eq('number', billNumber).single();

                if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
                  throw checkError;
                }

                // Smart update check
                if (existingBill && bill.updateDate && new Date(existingBill.updated_at) >= new Date(bill.updateDate)) {
                  console.log(`Skipping ${billNumber} as it is already up-to-date.`);
                  return; // Skip to the next bill
                }

                let detailData = { bill: bill }; // Use bill data from list view by default

                // If summary is missing, fetch detailed data as a fallback
                if (!bill.summary) {
                    console.log(`Fetching detailed data for ${billNumber} because summary is missing.`);
                    const detailUrl = `${CONGRESS_API_URL}/bill/${congress}/${type}/${bill.number}?api_key=${CONGRESS_API_KEY}`;
                    const detailResponse = await fetchWithRetry(detailUrl);
                    detailData = await detailData.json();
                }

                const sponsors = await fetchBillSponsors(congress, type, bill.number, detailData.bill);
                const committees = await fetchBillCommittees(congress, type, bill.number, detailData.bill);
                const actions = detailData.bill?.actions || [];
                const validActions = Array.isArray(actions) ? actions.filter((action: any) => isValidDateString(action.actionDate)) : [];
                const sortedActions = validActions.sort((a: any, b: any) => new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime());
                const latestAction = sortedActions[0];

                const mappedStatus = mapCongressGovActionToLegislativeStatus(latestAction?.actionCode || bill.latestAction?.actionCode, latestAction?.text || bill.latestAction?.text);
                console.log(`Bill ${billNumber} mapped status:`, {
                  originalActionCode: latestAction?.actionCode || bill.latestAction?.actionCode,
                  originalActionText: latestAction?.text || bill.latestAction?.text,
                  mappedStatus
                });

                const { introducedDate, lastActionDate } = validateAndNormalizeDates({ bill, detailData, actions: sortedActions, congress });

                const billData = {
                  number: billNumber,
                  title: bill.title || detailData.bill.title,
                  summary: detailData.bill.summary || bill.summary || null,
                  status: mappedStatus,
                  chamber: bill.originChamber || (type.startsWith('h') ? 'house' : 'senate'),
                  introduced_date: introducedDate,
                  last_action_date: lastActionDate,
                  congress,
                  bill_type: type.toUpperCase(),
                  bill_number: bill.number.toString(),
                  category: determineCategory(bill, mappedStatus, sortedActions), // Pass actions
                  updated_at: new Date().toISOString()
                };

                let billId: string;
                if (existingBill) {
                  const { error: updateError } = await supabase.from('bills').update(billData).eq('id', existingBill.id).select('id').single();
                  if (updateError) throw updateError;
                  billId = existingBill.id;
                  totalUpdated++;
                  console.log(`✓ Updated bill ${billNumber} with Congress.gov dates:`, { introduced: introducedDate, lastAction: lastActionDate });
                } else {
                  const { data: newBill, error: insertError } = await supabase.from('bills').insert(billData).select('id').single();
                  if (insertError) throw insertError;
                  billId = newBill.id;
                  totalImported++;
                  console.log(`✓ Imported new bill ${billNumber} with Congress.gov dates:`, { introduced: introducedDate, lastAction: lastActionDate });
                }

                if (sortedActions.length > 0) {
                  await supabase.from('bill_timeline').delete().eq('bill_id', billId);
                  const timelineData = sortedActions.map((action: any) => ({
                      bill_id: billId,
                      date: action.actionDate,
                      action: action.text,
                      status: mapCongressGovActionToLegislativeStatus(action.actionCode, action.text)
                    }));
                  const { error: timelineError } = await supabase.from('bill_timeline').insert(timelineData);
                  if (timelineError) {
                    console.error('Error inserting timeline:', timelineError);
                  }
                }

                if (sponsors.length > 0) {
                  await supabase.from('bill_sponsors').delete().eq('bill_id', billId);
                  const sponsorData = sponsors.map((sponsor: any) => ({
                      bill_id: billId,
                      name: sponsor.fullName || `${sponsor.firstName} ${sponsor.lastName}`,
                      party: sponsor.party,
                      state: sponsor.state,
                      district: sponsor.district || null,
                      bioguide_id: sponsor.bioguideId || null,
                      sponsorship_date: parseDate(sponsor.sponsorshipDate),
                      is_original_cosponsor: sponsor.is_original_cosponsor || false
                    }));
                  const { error: sponsorError } = await supabase.from('bill_sponsors').insert(sponsorData);
                  if (sponsorError) {
                    console.error('Error inserting sponsors:', sponsorError);
                    errors.push(`${billNumber} sponsors: ${sponsorError.message}`);
                  }
                }

                if (committees.length > 0) {
                  await supabase.from('bill_committees').delete().eq('bill_id', billId);
                  const committeeData = committees.map((committee: any) => ({
                      bill_id: billId,
                      committee_name: committee.committee_name,
                      committee_chamber: committee.committee_chamber,
                      committee_system_code: committee.systemCode || null,
                      committee_url: committee.committee_url || null,
                      activity_date: committee.activity_date,
                      activity_text: committee.activity_text,
                      activity_type: committee.activity_type
                    }));
                  const { error: committeeError } = await supabase.from('bill_committees').insert(committeeData);
                  if (committeeError) {
                    console.error('Error inserting committee activities:', committeeError);
                    errors.push(`${billNumber} committees: ${committeeError.message}`);
                  }
                }

                await analyzeBillText(billId);

              } catch (error: any) {
                console.error(`Error processing bill ${bill.number}:`, {
                  error: error instanceof Error ? error.message : 'Unknown error',
                  stack: error instanceof Error ? error.stack : undefined
                });
                errors.push(`${type}${bill.number}: ${error instanceof Error ? error.message : 'Unknown error'}`);
              }
            }));
            // Add a small delay after each batch
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (error: any) {
          console.error(`Error fetching ${type} bills:`, error);
          errors.push(`${type}: ${error.message}`);
        }
      }
    }

    return { status: 'success', imported: totalImported, updated: totalUpdated, errors: errors.length > 0 ? errors : undefined };
  } catch (error: any) {
    console.error('Import failed:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return { status: 'error', message: error instanceof Error ? error.message : 'Unknown error' };
  } finally {
    await releaseLock(lockKey);
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
    const endCongress = url.searchParams.get('endCongress') || '119';

    console.log('Processing request with parameters:', {
      startCongress,
      endCongress,
      method: req.method,
      headers: Object.fromEntries(req.headers.entries())
    });

    const result = await importBills(startCongress, endCongress);
    console.log('Import completed with result:', result);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error: any) {
    console.error('Error in import-bills function:', {
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