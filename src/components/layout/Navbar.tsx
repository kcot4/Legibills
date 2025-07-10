import React from 'react';
import { Link } from 'react-router-dom';
import { Bell, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import SearchHeader from './SearchHeader';
import SortDropdown, { SortOption } from './SortDropdown';
import { useBillContext } from '../../context/BillContext';
import { supabase } from '../../lib/supabaseClient'; // Import supabase client

interface NavbarProps {
  setShowAuthModal: (show: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ setShowAuthModal }) => {
  const { sortBy, setSortBy } = useBillContext();
  const [session, setSession] = React.useState<any>(null);

  React.useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <header className="bg-white shadow-sm z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo and title */}
          <Link to="/" className="flex items-center space-x-2">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="text-primary-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-scroll-text">
                <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h4" />
                <path d="M19 17V5a2 2 0 0 0-2-2H4" />
                <path d="M15 8h-5" />
                <path d="M15 12h-5" />
              </svg>
            </motion.div>
            <div className="flex flex-col">
              <span className="font-bold text-xl text-primary-950">Legibills</span>
              <span className="text-xs text-gray-500 -mt-1">Legible Legislature</span>
            </div>
          </Link>

          {/* Center section with search and sort */}
          <div className="flex items-center space-x-4 flex-1 max-w-4xl mx-4">
            {/* Unified Search Header */}
            <SearchHeader />
            
            {/* Sort Dropdown */}
            <SortDropdown 
              currentSort={sortBy} 
              onSortChange={handleSortChange}
            />
          </div>

          {/* Right navigation items */}
          <div className="flex items-center space-x-3">
            {session ? (
              <button
                onClick={handleSignOut}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Sign Out
              </button>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="px-3 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
              >
                Sign In
              </button>
            )}

            {/* Notifications */}
            <Link to="/alerts" className="relative text-gray-500 hover:text-primary-600 p-1">
              <Bell size={20} />
              <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-accent-500 ring-2 ring-white"></span>
            </Link>

            {/* User Profile Link */}
            <Link to="/profile" className="text-gray-500 hover:text-primary-600 p-1">
              <UserCircle size={24} />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
