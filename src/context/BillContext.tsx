import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, diagnoseConnection } from '../lib/supabase';
import { Bill, Topic, UserPreferences, Committee, CommitteeActivity } from '../types/types';
import { SortOption } from '../components/layout/SortDropdown';

interface BillContextType {
  bills: Bill[];
  loading: boolean;
  error: string | null;
  userPreferences: UserPreferences;
  sortBy: SortOption;
  refreshBills: () => Promise<void>;
  filterBillsByTopic: (topic: Topic) => Bill[];
  trackBill: (billId: string) => void;
  untrackBill: (billId: string) => void;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
  setSortBy: (sort: SortOption) => void;
  getSortedBills: () => Bill[];
  loadingProgress: number;
  connectionStatus: 'unknown' | 'connected' | 'disconnected' | 'error';
}

const defaultPreferences: UserPreferences = {
  trackedBills: [],
  topics: [],
  emailNotifications: false,
  preferredCommittees: [],
  preferredStages: []
};

// Load preferences from localStorage with better error handling
const loadPreferences = (): UserPreferences => {
  try {
    const saved = localStorage.getItem('userPreferences');
    if (saved) {
      const parsed = JSON.parse(saved);
      console.log('Loaded preferences from localStorage:', parsed);
      
      // Ensure the structure is correct
      return {
        trackedBills: Array.isArray(parsed.trackedBills) ? parsed.trackedBills : [],
        topics: Array.isArray(parsed.topics) ? parsed.topics : [],
        emailNotifications: Boolean(parsed.emailNotifications),
        preferredCommittees: Array.isArray(parsed.preferredCommittees) ? parsed.preferredCommittees : [],
        preferredStages: Array.isArray(parsed.preferredStages) ? parsed.preferredStages : []
      };
    }
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
  console.log('Using default preferences');
  return defaultPreferences;
};

// Save preferences to localStorage with validation
const savePreferences = (prefs: UserPreferences): void => {
  try {
    const toSave = {
      trackedBills: Array.isArray(prefs.trackedBills) ? prefs.trackedBills : [],
      topics: Array.isArray(prefs.topics) ? prefs.topics : [],
      emailNotifications: Boolean(prefs.emailNotifications),
      preferredCommittees: Array.isArray(prefs.preferredCommittees) ? prefs.preferredCommittees : [],
      preferredStages: Array.isArray(prefs.preferredStages) ? prefs.preferredStages : []
    };
    
    localStorage.setItem('userPreferences', JSON.stringify(toSave));
    console.log('Saved preferences to localStorage:', toSave);
  } catch (error) {
    console.error('Error saving preferences:', error);
  }
};

// Load sort preference from localStorage
const loadSortPreference = (): SortOption => {
  try {
    const saved = localStorage.getItem('billSortPreference');
    if (saved) {
      return saved as SortOption;
    }
  } catch (error) {
    console.error('Error loading sort preference:', error);
  }
  return 'introduced_date_desc'; // Default sort
};

const BillContext = createContext<BillContextType>({
  bills: [],
  loading: false,
  error: null,
  userPreferences: defaultPreferences,
  sortBy: 'introduced_date_desc',
  refreshBills: async () => {},
  filterBillsByTopic: () => [],
  trackBill: () => {},
  untrackBill: () => {},
  setUserPreferences: () => {},
  setSortBy: () => {},
  getSortedBills: () => [],
  loadingProgress: 0,
  connectionStatus: 'unknown'
});

export const BillProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [userPreferences, setUserPrefs] = useState<UserPreferences>(loadPreferences);
  const [sortBy, setSortByState] = useState<SortOption>(loadSortPreference);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected' | 'error'>('unknown');

  const refreshBills = useCallback(async () => {
    try {
      setLoading(true);
      setLoadingProgress(0);
      setError(null);
      setConnectionStatus('unknown');
      
      console.log('Starting bill fetch...');
      setLoadingProgress(10);
      
      const startTime = Date.now();
      
      // Enhanced connection diagnostics
      console.log('Running connection diagnostics...');
      const diagnostics = await diagnoseConnection();
      console.log('Connection diagnostics:', diagnostics);
      
      if (!diagnostics.hasConfig) {
        setConnectionStatus('error');
        throw new Error('Supabase configuration is missing. Please check your environment variables.');
      }
      
      if (!diagnostics.canReachServer) {
        setConnectionStatus('disconnected');
        throw new Error(diagnostics.error || 'Cannot reach Supabase server. Please check your internet connection and Supabase project status.');
      }
      
      if (!diagnostics.canQueryDatabase) {
        setConnectionStatus('error');
        throw new Error(diagnostics.error || 'Cannot query database. Please check your Supabase project configuration.');
      }
      
      setConnectionStatus('connected');
      setLoadingProgress(20);

      // Test database connection first with enhanced error handling
      try {
        const { error: connectionError } = await supabase
          .from('bills')
          .select('*', { count: 'exact', head: true });

        if (connectionError) {
          console.error('Database connection test failed:', connectionError);
          setConnectionStatus('error');
          
          // Provide more specific error messages
          if (connectionError.message.includes('Failed to fetch')) {
            throw new Error('Network connection failed. Please check:\n1. Your internet connection\n2. Supabase project status\n3. CORS settings in Supabase dashboard');
          } else if (connectionError.code === 'PGRST301') {
            throw new Error('Database schema validation failed. Please check your Supabase project setup.');
          } else if (connectionError.code === '42P01') {
            throw new Error('Bills table not found. Please run the database migrations.');
          } else if (connectionError.code === '28P01') {
            throw new Error('Invalid database credentials. Please check your VITE_SUPABASE_ANON_KEY.');
          }
          
          throw new Error(`Database connection failed: ${connectionError.message}`);
        }
      } catch (fetchError) {
        setConnectionStatus('error');
        if (fetchError instanceof Error && fetchError.message.includes('Failed to fetch')) {
          throw new Error('Unable to connect to database. Please check:\n1. Your internet connection\n2. Supabase project status\n3. CORS settings (add localhost:5173 to allowed origins)\n4. Environment variables in .env file');
        }
        throw fetchError;
      }

      setLoadingProgress(30);

      // Optimized query with better error handling and committee data
      console.log('Fetching bills data...');
      
      const pageSize = 1000; // Supabase default limit per request
      let allFetchedBills: Bill[] = [];
      let offset = 0;
      let count = 0;
      let hasMore = true;

      // First, get the total count of bills
      const { count: totalCount, error: countError } = await supabase
        .from('bills')
        .select('id', { count: 'exact', head: true });

      if (countError) {
        throw new Error(`Failed to get total bill count: ${countError.message}`);
      }
      count = totalCount || 0;
      console.log(`Total bills in database: ${count}`);
      setLoadingProgress(30);

      while (hasMore) {
        const { data, error: fetchError } = await supabase
          .from('bills')
          .select(`
            id,
            number,
            title,
            summary,
            simplified_text,
            original_text,
            status,
            chamber,
            introduced_date,
            last_action_date,
            expected_vote_date,
            category,
            congress,
            bill_type,
            bill_number,
            topics,
            ai_summary,
            key_provisions,
            potential_impact,
            potential_controversy,
            bill_sponsors (
              id,
              name,
              party,
              state,
              district,
              bioguide_id,
              sponsorship_date,
              is_original_cosponsor
            ),
            bill_timeline (
              date,
              action,
              status
            ),
            bill_votes (
              chamber,
              date,
              yeas,
              nays,
              not_voting
            ),
            bill_committees (
              id,
              committee_name,
              committee_chamber,
              committee_system_code,
              committee_url,
              activity_date,
              activity_text,
              activity_type
            )
          `)
          .order('introduced_date', { ascending: false })
          .range(offset, offset + pageSize - 1); // Fetch in chunks

        if (fetchError) {
          console.error('Database fetch error during pagination:', {
            message: fetchError.message,
            details: fetchError.details,
            hint: fetchError.hint,
            code: fetchError.code
          });
          setConnectionStatus('error');
          throw new Error(`Failed to fetch bills: ${fetchError.message}`);
        }

        if (data) {
          allFetchedBills = [...allFetchedBills, ...data];
          offset += data.length;
          setLoadingProgress(30 + (offset / count) * 60); // Update progress from 30% to 90%
          if (data.length < pageSize) {
            hasMore = false;
          }
        } else {
          hasMore = false;
        }
      }

      console.log(`Fetched ${allFetchedBills.length} bills in ${Date.now() - startTime}ms`);
      setLoadingProgress(90); // Set to 90% before transformation

      // Use allFetchedBills for transformation
      const transformedBills = (allFetchedBills || []).map(bill => {
        try {
          // Process timeline data efficiently with null checks
          const timelineData = (bill.bill_timeline || [])
            .filter(t => t && t.date && t.action) // Filter out invalid timeline entries
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(t => ({
              date: t.date,
              action: t.action,
              status: t.status || 'unknown'
            }));

          // Process sponsors with null checks
          const sponsorsData = (bill.bill_sponsors || [])
            .filter(s => s && s.name) // Filter out invalid sponsors
            .map(s => ({
              id: s.id,
              name: s.name,
              party: s.party || 'Unknown',
              state: s.state || 'Unknown',
              district: s.district,
              bioguideId: s.bioguide_id,
              sponsorshipDate: s.sponsorship_date,
              isOriginalCosponsor: s.is_original_cosponsor || false
            }));

          // Process votes with null checks
          const votesData = (bill.bill_votes || [])
            .filter(v => v && v.chamber && v.date) // Filter out invalid votes
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(v => ({
              chamber: v.chamber,
              date: v.date,
              yeas: v.yeas || 0,
              nays: v.nays || 0,
              notVoting: v.not_voting || 0
            }));

          // Process committee activities with null checks
          const committeesData = (bill.bill_committees || [])
            .filter(c => c && c.committee_name && c.activity_date) // Filter out invalid committee data
            .sort((a, b) => new Date(b.activity_date).getTime() - new Date(a.activity_date).getTime())
            .map(c => ({
              id: c.id,
              committee: {
                name: c.committee_name,
                chamber: c.committee_chamber as 'house' | 'senate' | 'joint',
                systemCode: c.committee_system_code,
                url: c.committee_url
              } as Committee,
              date: c.activity_date,
              activity: c.activity_text,
              activityType: c.activity_type as CommitteeActivity['activityType']
            }));

          return {
            ...bill,
            introducedDate: bill.introduced_date,
            lastActionDate: bill.last_action_date,
            expectedVoteDate: bill.expected_vote_date,
            sponsors: sponsorsData,
            topics: Array.isArray(bill.topics) ? bill.topics.filter(Boolean) : [], // Filter out null topics
            timeline: timelineData,
            votes: votesData,
            committees: committeesData,
            aiSummary: bill.ai_summary,
            keyProvisions: Array.isArray(bill.key_provisions) ? bill.key_provisions : [],
            potentialImpact: Array.isArray(bill.potential_impact) ? bill.potential_impact : [],
            potentialControversy: Array.isArray(bill.potential_controversy) ? bill.potential_controversy : []
          };
        } catch (transformError) {
          console.error(`Error transforming bill ${bill.id}:`, transformError);
          // Return a minimal bill object if transformation fails
          return {
            ...bill,
            introducedDate: bill.introduced_date || new Date().toISOString(),
            lastActionDate: bill.last_action_date || new Date().toISOString(),
            expectedVoteDate: bill.expected_vote_date,
            sponsors: [],
            topics: [],
            timeline: [],
            votes: [],
            committees: [],
            aiSummary: bill.ai_summary,
            keyProvisions: [],
            potentialImpact: [],
            potentialControversy: []
          };
        }
      });

      setLoadingProgress(95);
      setBills(transformedBills);
      setLoadingProgress(100);
      setConnectionStatus('connected');
      
      console.log(`Bill transformation completed in ${Date.now() - startTime}ms`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching bills';
      console.error('Error fetching bills:', {
        error: errorMessage,
        stack: err instanceof Error ? err.stack : undefined,
        type: err instanceof Error ? err.constructor.name : typeof err
      });
      
      setError(errorMessage);
      setConnectionStatus('error');
      
      // If we have cached bills, keep them visible
      if (bills.length === 0) {
        setBills([]);
      }
    } finally {
      setLoading(false);
      // Reset progress after a short delay
      setTimeout(() => setLoadingProgress(0), 500);
    }
  }, [bills.length]);

  // Memoized sorting function for better performance
  const getSortedBills = useCallback((): Bill[] => {
    const billsCopy = [...bills];
    
    switch (sortBy) {
      case 'introduced_date_desc':
        return billsCopy.sort((a, b) => new Date(b.introducedDate).getTime() - new Date(a.introducedDate).getTime());
      
      case 'introduced_date_asc':
        return billsCopy.sort((a, b) => new Date(a.introducedDate).getTime() - new Date(b.introducedDate).getTime());
      
      case 'last_action_desc':
        return billsCopy.sort((a, b) => new Date(b.lastActionDate).getTime() - new Date(a.lastActionDate).getTime());
      
      case 'last_action_asc':
        return billsCopy.sort((a, b) => new Date(a.lastActionDate).getTime() - new Date(b.lastActionDate).getTime());
      
      case 'title_asc':
        return billsCopy.sort((a, b) => a.title.localeCompare(b.title));
      
      case 'title_desc':
        return billsCopy.sort((a, b) => b.title.localeCompare(a.title));
      
      case 'number_asc':
        return billsCopy.sort((a, b) => {
          const aNum = parseInt(a.number.replace(/\D/g, ''), 10) || 0;
          const bNum = parseInt(b.number.replace(/\D/g, ''), 10) || 0;
          return aNum - bNum;
        });
      
      case 'number_desc':
        return billsCopy.sort((a, b) => {
          const aNum = parseInt(a.number.replace(/\D/g, ''), 10) || 0;
          const bNum = parseInt(b.number.replace(/\D/g, ''), 10) || 0;
          return bNum - aNum;
        });
      
      case 'status_asc':
        return billsCopy.sort((a, b) => a.status.localeCompare(b.status));
      
      case 'status_desc':
        return billsCopy.sort((a, b) => b.status.localeCompare(a.status));
      
      case 'sponsors_desc':
        return billsCopy.sort((a, b) => (b.sponsors?.length || 0) - (a.sponsors?.length || 0));
      
      case 'sponsors_asc':
        return billsCopy.sort((a, b) => (a.sponsors?.length || 0) - (b.sponsors?.length || 0));
      
      default:
        return billsCopy;
    }
  }, [bills, sortBy]);

  const filterBillsByTopic = useCallback((topic: Topic) => {
    return getSortedBills().filter(bill => 
      bill.topics?.some(t => 
        t && t.toLowerCase() === topic.toLowerCase()
      )
    );
  }, [getSortedBills]);

  const trackBill = useCallback((billId: string) => {
    console.log('🔖 Tracking bill:', billId);
    
    setUserPrefs(prev => {
      // Ensure we don't add duplicates
      const currentTracked = Array.isArray(prev.trackedBills) ? prev.trackedBills : [];
      
      if (currentTracked.includes(billId)) {
        console.log('Bill already tracked:', billId);
        return prev;
      }
      
      const newPrefs = {
        ...prev,
        trackedBills: [...currentTracked, billId]
      };
      
      console.log('New tracked bills:', newPrefs.trackedBills);
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const untrackBill = useCallback((billId: string) => {
    console.log('🗑️ Untracking bill:', billId);
    
    setUserPrefs(prev => {
      const currentTracked = Array.isArray(prev.trackedBills) ? prev.trackedBills : [];
      const newPrefs = {
        ...prev,
        trackedBills: currentTracked.filter(id => id !== billId)
      };
      
      console.log('Remaining tracked bills:', newPrefs.trackedBills);
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setUserPreferences = useCallback((prefs: Partial<UserPreferences>) => {
    console.log('📝 Updating user preferences:', prefs);
    
    setUserPrefs(prev => {
      const newPrefs = { ...prev, ...prefs };
      savePreferences(newPrefs);
      return newPrefs;
    });
  }, []);

  const setSortBy = useCallback((sort: SortOption) => {
    setSortByState(sort);
    localStorage.setItem('billSortPreference', sort);
  }, []);

  // Load preferences on mount and watch for changes
  useEffect(() => {
    const savedPrefs = loadPreferences();
    console.log('Loading preferences on mount:', savedPrefs);
    setUserPrefs(savedPrefs);
  }, []);

  // Debug: Log tracked bills whenever they change
  useEffect(() => {
    console.log('👀 Current tracked bills:', userPreferences.trackedBills);
  }, [userPreferences.trackedBills]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    bills,
    loading,
    error,
    userPreferences,
    sortBy,
    refreshBills,
    filterBillsByTopic,
    trackBill,
    untrackBill,
    setUserPreferences,
    setSortBy,
    getSortedBills,
    loadingProgress,
    connectionStatus
  }), [
    bills,
    loading,
    error,
    userPreferences,
    sortBy,
    refreshBills,
    filterBillsByTopic,
    trackBill,
    untrackBill,
    setUserPreferences,
    setSortBy,
    getSortedBills,
    loadingProgress,
    connectionStatus
  ]);

  return (
    <BillContext.Provider value={contextValue}>
      {children}
    </BillContext.Provider>
  );
};
      

export const useBillContext = () => {
  const context = useContext(BillContext);
  if (context === undefined) {
    throw new Error('useBillContext must be used within a BillProvider');
  }
  return context;
};