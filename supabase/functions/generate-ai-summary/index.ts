import { createClient } from 'npm:@supabase/supabase-js@2.39.0';
import { backOff } from 'npm:exponential-backoff@3.1.1';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing required environment variables');
}

if (!GEMINI_API_KEY) {
  throw new Error('Gemini API key is not configured');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function acquireLock(lockKey: string, timeoutMs = 5000): Promise<boolean> {
  const startTime = Date.now();
  
  try {
    // First clean up any stale locks
    const staleTimeout = new Date();
    staleTimeout.setMinutes(staleTimeout.getMinutes() - 5);
    
    await supabase
      .from('system_locks')
      .delete()
      .lt('locked_at', staleTimeout.toISOString());

    // Try to acquire the lock
    const { error } = await supabase
      .from('system_locks')
      .insert({ lock_key: lockKey });

    if (!error) {
      console.log(`Lock acquired: ${lockKey}`);
      return true;
    }

    // If lock exists, wait and retry until timeout
    while (Date.now() - startTime < timeoutMs) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: existingLock } = await supabase
        .from('system_locks')
        .select('locked_at')
        .eq('lock_key', lockKey)
        .single();

      if (!existingLock) {
        const { error: retryError } = await supabase
          .from('system_locks')
          .insert({ lock_key: lockKey });

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
    const { error } = await supabase
      .from('system_locks')
      .delete()
      .eq('lock_key', lockKey);

    if (error) {
      console.error('Error releasing lock:', error);
    } else {
      console.log(`Lock released: ${lockKey}`);
    }
  } catch (error) {
    console.error('Error releasing lock:', error);
  }
}

interface BillAnalysis {
  summary: string;
  keyProvisions: string[];
  potentialImpact: string[];
  potentialControversy: string[];
}

async function generateStructuredAnalysis(text: string, billTitle: string): Promise<BillAnalysis> {
  try {
    console.log('Generating structured analysis with Gemini:', {
      textLength: text.length,
      title: billTitle,
      preview: text.slice(0, 100).replace(/\n/g, ' ')
    });

    const prompt = `You are an expert legislative analyst. Analyze this bill and provide a comprehensive structured response in the following JSON format:

{
  "summary": "A clear, concise summary of the bill in 2-3 paragraphs that explains what the bill does and why it matters to the general public",
  "keyProvisions": [
    "First major provision or requirement - be specific about what it mandates or changes",
    "Second major provision or requirement - include details about implementation",
    "Third major provision or requirement - explain the mechanism or process",
    "Fourth major provision - continue adding as many as needed to fully cover the bill",
    "Fifth major provision - for complex bills, include 8-15 key provisions",
    "Additional provisions as needed - ensure comprehensive coverage",
    "Every bill should have every section summarized, especially the giant omnibus bills with a multitude of different provisions. when necessary, break down different sections into bullet points"
  ],
  "potentialImpact": [
    "First potential impact on society, economy, or specific groups - be specific about who is affected",
    "Second potential impact - include quantitative estimates where possible",
    "Third potential impact - consider both short-term and long-term effects",
    "Fourth potential impact - address different stakeholder groups",
    "Fifth potential impact - consider economic, social, and political ramifications",
    "Additional impacts as needed - aim for 5-10 comprehensive impact assessments",
    "Every bill should have every section summarized, especially the giant omnibus bills with a multitude of different provisions. when necessary, break down different sections into bullet points"
  ],
  "potentialControversy": [
    "First potential area of controversy or debate - explain why this might be contentious",
    "Second potential area of controversy - consider different political perspectives",
    "Third potential area of controversy - address constitutional or legal concerns",
    "Fourth potential area of controversy - consider implementation challenges",
    "Fifth potential area of controversy - address stakeholder conflicts",
    "Additional controversial aspects as needed - aim for 3-8 areas of potential debate",
    "Every bill should have every section summarized, especially the giant omnibus bills with a multitude of different provisions. when necessary, break down different sections into bullet points"
  ]
}

CRITICAL INSTRUCTIONS:
- For COMPLEX or LENGTHY bills (like omnibus spending bills, comprehensive reform acts, or bills with multiple titles/sections), provide key provisions to ensure thorough coverage, essentially summarizing every section
- For SIMPLE bills (single-issue, short bills), provide 3-8 key provisions
- Each key provision should be specific and actionable - avoid vague statements
- Include dollar amounts, timelines, and specific requirements where mentioned in the bill
- Break down complex provisions into separate, understandable points
- For omnibus bills, organize provisions by major section or topic area
- Write in plain English that anyone can understand
- Avoid legal jargon and technical terms
- Focus on real-world implications
- Be objective and balanced
- For controversy, consider different political perspectives, economic impacts, and stakeholder concerns
- If the bill appears non-controversial, still identify potential areas of debate or concern

Bill Title: ${billTitle}

Bill Text:
${text}

Respond ONLY with valid JSON:`;

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 4096, // Increased token limit for more comprehensive analysis
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Gemini API error:', {
        status: response.status,
        statusText: response.statusText,
        error: error
      });
      throw new Error(`Gemini API error: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    console.log('Gemini response:', {
      candidates: data.candidates?.length,
      usageMetadata: data.usageMetadata
    });

    // Extract the generated text from Gemini's response structure
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      console.error('No text generated by Gemini:', data);
      throw new Error('No analysis was generated by Gemini');
    }

    console.log('Raw Gemini response:', generatedText);

    // Parse the JSON response
    let analysisData;
    try {
      // Clean up the response - remove any markdown formatting
      const cleanedText = generatedText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      
      analysisData = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', {
        error: parseError,
        rawText: generatedText
      });
      
      // Fallback: try to extract content manually
      throw new Error('Failed to parse structured analysis from AI response');
    }

    // Validate the structure
    if (!analysisData.summary || !Array.isArray(analysisData.keyProvisions) || 
        !Array.isArray(analysisData.potentialImpact) || !Array.isArray(analysisData.potentialControversy)) {
      console.error('Invalid analysis structure:', analysisData);
      throw new Error('AI response does not match expected structure');
    }

    console.log('Successfully parsed structured analysis:', {
      summaryLength: analysisData.summary.length,
      provisionsCount: analysisData.keyProvisions.length,
      impactCount: analysisData.potentialImpact.length,
      controversyCount: analysisData.potentialControversy.length
    });

    return {
      summary: analysisData.summary,
      keyProvisions: analysisData.keyProvisions,
      potentialImpact: analysisData.potentialImpact,
      potentialControversy: analysisData.potentialControversy
    };
  } catch (error) {
    console.error('Error generating structured analysis:', error);
    throw error;
  }
}

async function generateBillAnalysis(billId: string): Promise<{
  status: string;
  analysis?: BillAnalysis;
  message?: string;
}> {
  console.log(`Starting comprehensive analysis generation for bill ${billId}`);
  const lockKey = `generate_analysis_${billId}`;
  
  if (!(await acquireLock(lockKey))) {
    console.log(`Lock acquisition failed for bill ${billId}`);
    return {
      status: 'locked',
      message: 'Another analysis generation is in progress for this bill'
    };
  }

  try {
    // Get the bill text and details
    console.log(`Fetching bill ${billId} from database`);
    const { data: bill, error: billError } = await supabase
      .from('bills')
      .select('original_text, summary, title, number')
      .eq('id', billId)
      .single();

    if (billError) {
      console.error(`Error fetching bill ${billId}:`, billError);
      throw billError;
    }

    if (!bill) {
      console.error(`Bill ${billId} not found`);
      throw new Error('Bill not found');
    }

    // Use the best available text for analysis
    const textToAnalyze = bill.original_text || bill.summary || bill.title;
    if (!textToAnalyze) {
      console.error(`No text available for bill ${billId}`);
      throw new Error('No text available for analysis');
    }

    console.log(`Generating comprehensive analysis for bill ${bill.number} using ${
      bill.original_text ? 'original text' : 
      bill.summary ? 'summary' : 'title'
    }`);

    // Generate structured analysis using Gemini
    const analysis = await generateStructuredAnalysis(textToAnalyze, bill.title);

    console.log(`Updating bill ${billId} with generated analysis`);
    // Update the bill with all the analysis components
    const { error: updateError } = await supabase
      .from('bills')
      .update({ 
        ai_summary: analysis.summary,
        key_provisions: analysis.keyProvisions,
        potential_impact: analysis.potentialImpact,
        potential_controversy: analysis.potentialControversy
      })
      .eq('id', billId);

    if (updateError) {
      console.error(`Error updating bill ${billId}:`, updateError);
      throw updateError;
    }

    console.log(`Successfully generated and saved comprehensive analysis for bill ${billId}`);
    return {
      status: 'success',
      analysis
    };
  } catch (error) {
    console.error(`Error generating bill analysis for ${billId}:`, error);
    return {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  } finally {
    await releaseLock(lockKey);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Incoming request:', {
      method: req.method,
      url: req.url,
      headers: Object.fromEntries(req.headers.entries())
    });

    let billId: string | null = null;

    // First try to get billId from URL parameters
    const url = new URL(req.url);
    billId = url.searchParams.get('billId');

    // If not found in URL, try to get from request body
    if (!billId && req.body) {
      try {
        const body = await req.json();
        billId = body.billId;
        console.log('Found billId in request body:', billId);
      } catch (error) {
        console.error('Error parsing request body:', error);
      }
    }

    if (!billId) {
      console.error('Bill ID not found in URL params or request body');
      throw new Error('Bill ID is required');
    }

    console.log(`Processing comprehensive analysis generation for bill ${billId}`);
    const result = await generateBillAnalysis(billId);
    
    console.log(`Analysis generation completed for bill ${billId}:`, result);
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json'
        },
        status: result.status === 'locked' ? 423 : 200
      }
    );
  } catch (error) {
    console.error('Error in generate-ai-summary function:', error);
    
    return new Response(
      JSON.stringify({
        status: 'error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});