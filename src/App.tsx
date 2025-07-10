import React, { Suspense, useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Layout from './components/layout/Layout';
import { BillProvider } from './context/BillContext';
import BillInitializer from './components/BillInitializer';
import ErrorBoundary from './components/ErrorBoundary';
import LoadingSpinner from './components/ui/LoadingSpinner';
import DisclaimerModal from './components/DisclaimerModal';
import { supabase } from './lib/supabaseClient';
import AuthModal from './components/AuthModal';
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
  const [showAuthModal, setShowAuthModal] = useState(false); // New state for AuthModal visibility

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      // Only show auth modal initially if no session and not previously dismissed
      if (!session && localStorage.getItem('authModalDismissed') !== 'true') {
        setShowAuthModal(true);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If session becomes active, hide auth modal
      if (session) {
        setShowAuthModal(false);
      }
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

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
    localStorage.setItem('authModalDismissed', 'true'); // Remember dismissal
  };

  return (
    <ErrorBoundary>
      <BillProvider>
        <BillInitializer>
          <Suspense fallback={<LoadingFallback />}>
            <Layout setShowAuthModal={setShowAuthModal}> {/* Pass setter to Layout */}
              <Outlet />
            </Layout>
            <DisclaimerModal 
              isOpen={showDisclaimer} 
              onClose={handleDisclaimerClose} 
            />
            <AuthModal 
              isOpen={showAuthModal} 
              onClose={handleAuthModalClose} 
            />
          </Suspense>
        </BillInitializer>
      </BillProvider>
    </ErrorBoundary>
  );
};

export default App;
