import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Loader, AlertTriangle, FileText, Sparkles } from 'lucide-react';

interface TextComparisonProps {
  originalText: string | null;
  simplifiedText: string;
  aiSummary?: string | null;
  billId: string;
}

const TextComparison: React.FC<TextComparisonProps> = ({ 
  originalText: initialOriginalText, 
  simplifiedText, 
  aiSummary: initialAiSummary,
  billId 
}) => {
  const [activeTab, setActiveTab] = useState<'enhanced' | 'original' | 'side-by-side'>('enhanced');
  const [showFullOriginal, setShowFullOriginal] = useState(false);
  const [originalText, setOriginalText] = useState<string | null>(initialOriginalText);
  const [aiSummary, setAiSummary] = useState<string | null>(initialAiSummary || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // Validate environment variables
  const validateEnvironment = () => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase configuration. Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file.'
      );
    }
    
    // Validate URL format
    try {
      new URL(supabaseUrl);
    } catch (e) {
      throw new Error(`Invalid VITE_SUPABASE_URL format: ${supabaseUrl}`);
    }
    
    return { supabaseUrl, supabaseAnonKey };
  };

  const fetchOriginalText = async () => {
    if (originalText && originalText.length > 0) {
      console.log('Using cached text:', { length: originalText.length });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { supabaseUrl, supabaseAnonKey } = validateEnvironment();
      
      console.log('Fetching bill text for ID:', billId);
      const apiUrl = `${supabaseUrl}/functions/v1/get-bill-text?billId=${billId}`;
      console.log('API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch bill text: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('Text API response:', {
        status: data.status,
        hasText: !!data.text,
        textLength: data.text?.length
      });
      
      if (data.status === 'not_available') {
        setError('The text for this bill is not yet available from Congress.gov.');
        setOriginalText(null);
        return;
      }

      if (data.status === 'error') {
        throw new Error(data.error || `Failed to fetch bill text`);
      }

      if (!data.text) {
        setError('The text for this bill is not yet available from Congress.gov.');
        setOriginalText(null);
        return;
      }

      console.log('Setting bill text:', {
        length: data.text.length,
        preview: data.text.slice(0, 100)
      });

      setOriginalText(data.text);
    } catch (err) {
      console.error('Error fetching bill text:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage.includes('Missing Supabase configuration') 
        ? errorMessage 
        : 'The text for this bill is not yet available from Congress.gov.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateComprehensiveAnalysis = async () => {
    if (aiSummary && aiSummary.length > 0) {
      console.log('AI analysis already exists');
      return;
    }

    setIsGeneratingAI(true);
    setError(null); // Clear any previous errors when starting new generation

    try {
      const { supabaseUrl, supabaseAnonKey } = validateEnvironment();
      
      console.log('Generating comprehensive AI analysis for bill ID:', billId);
      const apiUrl = `${supabaseUrl}/functions/v1/generate-ai-summary?billId=${billId}`;
      console.log('AI API URL:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('AI API Error Response:', errorText);
        
        // Check for specific error types
        if (response.status === 500 && errorText.includes('Gemini API key is not configured')) {
          throw new Error('AI analysis is currently unavailable. The Gemini API key needs to be configured in the system.');
        }
        
        throw new Error(`Failed to generate AI analysis: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('AI analysis response:', data);
      
      if (data.status === 'error') {
        if (data.message?.includes('Gemini API key')) {
          throw new Error('AI analysis is currently unavailable. The system needs to be configured with a Gemini API key.');
        }
        throw new Error(data.message || 'Failed to generate AI analysis');
      }

      if (data.status === 'locked') {
        throw new Error('AI analysis generation is currently in progress. Please try again in a moment.');
      }

      if (data.analysis?.summary) {
        setAiSummary(data.analysis.summary);
        console.log('AI analysis generated successfully');
        
        // Clear any errors since generation was successful
        setError(null);
      } else {
        throw new Error('No analysis was generated');
      }
    } catch (err) {
      console.error('Error generating AI analysis:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate AI analysis';
      setError(errorMessage);
    } finally {
      setIsGeneratingAI(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'original' || activeTab === 'side-by-side') {
      fetchOriginalText();
    }
  }, [activeTab, billId]);

  const originalParagraphs = originalText?.split('\n\n') || [];
  const displayOriginalText = showFullOriginal 
    ? originalText 
    : originalParagraphs.slice(0, 3).join('\n\n') + (originalParagraphs.length > 3 ? '...' : '');

  const renderErrorMessage = () => (
    <div className="text-center p-8">
      <AlertTriangle className="h-12 w-12 text-error-500 mx-auto mb-4" />
      <p className="text-error-600 mb-4 whitespace-pre-line">{error}</p>
      {retryCount < 3 && !error?.includes('Missing Supabase configuration') && !error?.includes('Gemini API key') && (
        <button 
          onClick={() => {
            setRetryCount(prev => prev + 1);
            if (activeTab === 'enhanced') {
              generateComprehensiveAnalysis();
            } else {
              fetchOriginalText();
            }
          }}
          className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          Try Again
        </button>
      )}
      {(error?.includes('Missing Supabase configuration') || error?.includes('Gemini API key')) && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-left">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Configuration Issue:</strong>
          </p>
          {error?.includes('Missing Supabase configuration') ? (
            <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>Check that your .env file exists in the project root</li>
              <li>Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set</li>
              <li>Restart the development server after updating .env</li>
            </ol>
          ) : (
            <ol className="text-sm text-yellow-700 list-decimal list-inside space-y-1">
              <li>AI analysis requires a Gemini API key to be configured</li>
              <li>Contact your administrator to set up the GEMINI_API_KEY</li>
              <li>For now, you can use the enhanced analysis version</li>
            </ol>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="border-b border-gray-200">
        <nav className="flex -mb-px">
          <button
            onClick={() => setActiveTab('enhanced')}
            className={`
              py-3 px-4 text-sm font-medium border-b-2 flex items-center
              ${activeTab === 'enhanced' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <Sparkles size={16} className="mr-2" />
            Enhanced AI Analysis
          </button>
          <button
            onClick={() => setActiveTab('original')}
            className={`
              py-3 px-4 text-sm font-medium border-b-2 
              ${activeTab === 'original' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Bill Text
          </button>
          <button
            onClick={() => setActiveTab('side-by-side')}
            className={`
              py-3 px-4 text-sm font-medium border-b-2 
              ${activeTab === 'side-by-side' 
                ? 'border-primary-500 text-primary-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Side by Side
          </button>
        </nav>
      </div>

      <div className="p-4">
        {activeTab === 'enhanced' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* Enhanced AI Analysis Section */}
            <div className="mt-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2 text-purple-600" />
                  Comprehensive AI Analysis
                </h3>
                {!aiSummary && !isGeneratingAI && !error && (
                  <button
                    onClick={generateComprehensiveAnalysis}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                  >
                    Generate Analysis
                  </button>
                )}
              </div>

              {isGeneratingAI ? (
                <div className="flex items-center justify-center p-8 bg-purple-50 rounded-lg">
                  <Loader className="animate-spin h-6 w-6 text-purple-600 mr-2" />
                  <span className="text-purple-700">Generating comprehensive AI analysis...</span>
                </div>
              ) : error ? (
                renderErrorMessage()
              ) : aiSummary ? (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="prose max-w-none">
                    {aiSummary.split('\n').map((paragraph, index) => (
                      <p key={index} className="my-3 text-purple-900 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 text-center">
                  <Sparkles className="h-8 w-8 text-purple-400 mx-auto mb-2" />
                  <p className="text-purple-800 text-sm font-medium mb-2">
                    AI Analysis Available
                  </p>
                  <p className="text-purple-600 text-sm">
                    Generate an AI analysis to get deeper insights into key provisions, potential impacts, and areas of debate.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'original' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-blue-50 p-2 rounded-md mb-4 text-sm text-blue-800 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              <span>This is the official bill text from Congress.gov.</span>
            </div>
            
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <Loader className="animate-spin h-6 w-6 text-primary-600 mr-2" />
                <span className="text-gray-600">Loading bill text...</span>
              </div>
            ) : error ? (
              renderErrorMessage()
            ) : originalText ? (
              <>
                <div className="font-mono text-sm whitespace-pre-line bg-gray-50 p-4 rounded-md overflow-auto">
                  {displayOriginalText}
                </div>
                
                {originalParagraphs.length > 3 && (
                  <button 
                    onClick={() => setShowFullOriginal(!showFullOriginal)}
                    className="mt-3 text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center"
                  >
                    {showFullOriginal ? (
                      <>
                        Show less <ChevronUp size={16} className="ml-1" />
                      </>
                    ) : (
                      <>
                        Show full text <ChevronDown size={16} className="ml-1" />
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center p-8 text-gray-500">
                No bill text available.
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'side-by-side' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bill Text</h4>
              {isLoading ? (
                <div className="flex items-center justify-center p-8 bg-gray-50 rounded-md">
                  <Loader className="animate-spin h-6 w-6 text-primary-600 mr-2" />
                  <span className="text-gray-600">Loading...</span>
                </div>
              ) : error ? (
                renderErrorMessage()
              ) : (
                <div className="font-mono text-sm whitespace-pre-line bg-gray-50 p-3 rounded-md overflow-auto h-[400px]">
                  {originalText || 'No bill text available.'}
                </div>
              )}
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Enhanced AI Analysis</h4>
              <div className="prose max-w-none bg-purple-50 p-3 rounded-md overflow-auto h-[400px] text-sm">
                {aiSummary ? (
                  aiSummary.split('\n').map((paragraph, index) => (
                    <p key={index} className="my-2 text-purple-900">{paragraph}</p>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Sparkles className="h-6 w-6 text-purple-400 mb-2" />
                    <p className="text-purple-800 text-sm font-medium">
                      AI Analysis Not Generated Yet
                    </p>
                    <button
                      onClick={generateComprehensiveAnalysis}
                      disabled={isGeneratingAI}
                      className="mt-4 px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm"
                    >
                      {isGeneratingAI ? 'Generating...' : 'Generate Analysis'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TextComparison;