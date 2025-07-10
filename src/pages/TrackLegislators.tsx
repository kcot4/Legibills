import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Legislator } from '../types/types'; // Assuming you have a Legislator type defined
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { Search, UserPlus, UserMinus } from 'lucide-react';

const TrackLegislators: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [legislators, setLegislators] = useState<Legislator[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackedLegislatorIds, setTrackedLegislatorIds] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);

  // Fetch current user and their tracked legislators
  useEffect(() => {
    const fetchUserAndTracked = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data, error } = await supabase
          .from('tracked_legislators')
          .select('legislator_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching tracked legislators:', error);
          setError(error.message);
        } else {
          setTrackedLegislatorIds(data?.map(item => item.legislator_id) || []);
        }
      }
    };
    fetchUserAndTracked();
  }, []);

  // Search for legislators
  const searchLegislators = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('legislators').select('*');

      if (searchTerm) {
        query = query.ilike('full_name', `%${searchTerm}%`);
      }

      const { data, error } = await query.limit(50); // Limit search results

      if (error) throw error;
      setLegislators(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during search.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm) {
        searchLegislators();
      } else {
        setLegislators([]); // Clear results if search term is empty
      }
    }, 500); // Debounce search
    return () => clearTimeout(handler);
  }, [searchTerm, searchLegislators]);

  const handleTrackToggle = async (legislatorId: string) => {
    if (!user) {
      alert('Please sign in to track legislators.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (trackedLegislatorIds.includes(legislatorId)) {
        // Untrack
        const { error } = await supabase
          .from('tracked_legislators')
          .delete()
          .eq('user_id', user.id)
          .eq('legislator_id', legislatorId);

        if (error) throw error;
        setTrackedLegislatorIds(prev => prev.filter(id => id !== legislatorId));
      } else {
        // Track
        const { error } = await supabase
          .from('tracked_legislators')
          .insert({ user_id: user.id, legislator_id: legislatorId });

        if (error) throw error;
        setTrackedLegislatorIds(prev => [...prev, legislatorId]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update tracked status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Track Legislators</h1>

      <div className="mb-6 relative">
        <input
          type="text"
          placeholder="Search by name..."
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {loading && <LoadingSpinner variant="bills" size="lg" message="Searching..." />}
      {error && <div className="text-red-600 mb-4">Error: {error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {legislators.map((legislator) => (
          <div key={legislator.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-lg">{legislator.full_name}</h2>
              <p className="text-gray-600 text-sm">{legislator.party} - {legislator.state}</p>
            </div>
            <button
              onClick={() => handleTrackToggle(legislator.id)}
              className={`px-4 py-2 rounded-md text-white font-medium ${trackedLegislatorIds.includes(legislator.id) ? 'bg-red-500 hover:bg-red-600' : 'bg-primary-600 hover:bg-primary-700'}`}
              disabled={loading}
            >
              {trackedLegislatorIds.includes(legislator.id) ? (
                <span className="flex items-center"><UserMinus size={16} className="mr-2" /> Untrack</span>
              ) : (
                <span className="flex items-center"><UserPlus size={16} className="mr-2" /> Track</span>
              )}
            </button>
          </div>
        ))}
      </div>

      {legislators.length === 0 && searchTerm && !loading && !error && (
        <p className="text-center text-gray-500 mt-8">No legislators found matching your search.</p>
      )}

      {trackedLegislatorIds.length > 0 && !searchTerm && !loading && !error && (
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4">Your Tracked Legislators</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {legislators.filter(l => trackedLegislatorIds.includes(l.id)).map(legislator => (
              <div key={legislator.id} className="bg-white p-4 rounded-lg shadow flex items-center justify-between border-2 border-primary-500">
                <div>
                  <h2 className="font-semibold text-lg">{legislator.full_name}</h2>
                  <p className="text-gray-600 text-sm">{legislator.party} - {legislator.state}</p>
                </div>
                <button
                  onClick={() => handleTrackToggle(legislator.id)}
                  className="px-4 py-2 rounded-md text-white font-medium bg-red-500 hover:bg-red-600"
                  disabled={loading}
                >
                  <span className="flex items-center"><UserMinus size={16} className="mr-2" /> Untrack</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrackLegislators;
