import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import SearchFilters from '../components/search/SearchFilters';
import SearchResults from '../components/search/SearchResults';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { supabase } from '../lib/supabaseClient'; // Changed import to supabaseClient
import { Bill } from '../types/types';
import { useBillContext } from '../context/BillContext';

export default function Search() {
  const [searchParams] = useSearchParams();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { sortBy } = useBillContext();
  const [trackedLegislatorIds, setTrackedLegislatorIds] = useState<string[]>([]);
  const [filterByTrackedLegislators, setFilterByTrackedLegislators] = useState(false);

  const query = searchParams.get('q') || '';
  const category = searchParams.get('category') || '';
  const status = searchParams.get('status') || '';
  const chamber = searchParams.get('chamber') || '';
  const congress = searchParams.get('congress') || '';

  // Fetch tracked legislators for the current user
  useEffect(() => {
    async function fetchTrackedLegislators() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data, error } = await supabase
          .from('tracked_legislators')
          .select('legislator_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching tracked legislators:', error);
        } else {
          setTrackedLegislatorIds(data?.map(item => item.legislator_id) || []);
        }
      }
    }
    fetchTrackedLegislators();
  }, []);

  useEffect(() => {
    async function fetchBills() {
      try {
        setLoading(true);
        setError(null);

        const startTime = Date.now();

        let queryBuilder = supabase
          .from('bills')
          .select(`
            *,
            bill_sponsors (
              id,
              name,
              party,
              state,
              bioguide_id
            ),
            bill_topics (
              topic
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
          `);

        if (query) {
          queryBuilder = queryBuilder.textSearch('search_vector', query);
        }

        if (category) {
          queryBuilder = queryBuilder.eq('category', category);
        }

        if (status) {
          queryBuilder = queryBuilder.eq('status', status);
        }

        if (chamber) {
          queryBuilder = queryBuilder.eq('chamber', chamber.toLowerCase());
        }

        if (congress) {
          queryBuilder = queryBuilder.eq('congress', congress);
        }

        // Filter by tracked legislators if the toggle is active and there are tracked legislators
        if (filterByTrackedLegislators && trackedLegislatorIds.length > 0) {
          // This assumes bill_sponsors is linked to legislators via bioguide_id or similar
          // You might need to adjust this filter based on your exact schema and relationships
          queryBuilder = queryBuilder.in('bill_sponsors.bioguide_id', trackedLegislatorIds);
        }

        const { data, error: supabaseError } = await queryBuilder;

        if (supabaseError) {
          throw supabaseError;
        }

        const transformedBills = (data || []).map(bill => ({
          ...bill,
          introducedDate: bill.introduced_date,
          lastActionDate: bill.last_action_date,
          expectedVoteDate: bill.expected_vote_date,
          sponsors: bill.bill_sponsors || [],
          topics: Array.isArray(bill.topics) ? bill.topics : 
                 (bill.bill_topics || []).map(t => t.topic),
          timeline: (bill.bill_timeline || [])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(t => ({
              date: t.date,
              action: t.action,
              status: t.status
            })),
          votes: (bill.bill_votes || [])
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map(v => ({
              chamber: v.chamber,
              date: v.date,
              yeas: v.yeas,
              nays: v.nays,
              notVoting: v.not_voting
            }))
        }));

        // Apply sorting based on current sort preference
        const sortedBills = applySorting(transformedBills, sortBy);
        setBills(sortedBills);

        console.log(`Search completed in ${Date.now() - startTime}ms`);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred while fetching bills');
      } finally {
        setLoading(false);
      }
    }

    fetchBills();
  }, [query, category, status, chamber, congress, sortBy, filterByTrackedLegislators, trackedLegislatorIds]);

  // Helper function to apply sorting to search results
  const applySorting = useCallback((billsToSort: Bill[], sortOption: string): Bill[] => {
    const billsCopy = [...billsToSort];
    
    switch (sortOption) {
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
  }, [sortBy]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 dark:text-white">Search Bills</h1>
        <SearchFilters 
          filterByTrackedLegislators={filterByTrackedLegislators}
          setFilterByTrackedLegislators={setFilterByTrackedLegislators}
        />
        <div className="mt-8">
          <LoadingSpinner 
            variant="bills" 
            size="lg" 
            message="Searching Bills"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8 dark:text-white">Search Bills</h1>
      
      <SearchFilters 
        filterByTrackedLegislators={filterByTrackedLegislators}
        setFilterByTrackedLegislators={setFilterByTrackedLegislators}
      />
      
      {error ? (
        <div className="text-red-600 mb-4 dark:text-red-400">{error}</div>
      ) : (
        <SearchResults 
          bills={bills} 
          loading={loading} 
        />
      )}
    </div>
  );
}