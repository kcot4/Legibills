import React, { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { BillProvider } from './context/BillContext';
import BillInitializer from './components/BillInitializer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import DisclaimerModal from './components/DisclaimerModal';
import { supabase } from './lib/supabaseClient';
import AuthModal from './components/AuthModal'; // Changed import
import { Session } from '@supabase/supabase-js';

const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <LoadingSpinner 
      variant="bills" 
      size="xl" 
      message="Loading Application"
    />
  </div>
);

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      // Check if user has previously dismissed the disclaimer
      const disclaimerDismissed = localStorage.getItem('disclaimerDismissed');
      if (!disclaimerDismissed) {
        setShowDisclaimer(true);
      }
    }
  }, [session]);

  const handleDisclaimerClose = () => {
    setShowDisclaimer(false);
  };

  return (
    <ErrorBoundary>
      <BillProvider>
        <BillInitializer>
          <Suspense fallback={<LoadingFallback />}>
            <Layout>
              <Outlet />
            </Layout>
            <DisclaimerModal 
              isOpen={showDisclaimer} 
              onClose={handleDisclaimerClose} 
            />
            {/* Render AuthModal when there's no session */}
            <AuthModal 
              isOpen={!session} 
              onClose={() => { /* No action needed here, session change handles close */ }} 
            />
          </Suspense>
        </BillInitializer>
      </BillProvider>
    </ErrorBoundary>
  );
};

export default App;