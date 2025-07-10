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
  const [showAuthModal, setShowAuthModal] = useState(false); // Default to false

  useEffect(() => {
    const checkModals = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);

      const disclaimerDismissed = localStorage.getItem('disclaimerDismissed');
      if (!disclaimerDismissed) {
        setShowDisclaimer(true);
        // If disclaimer is shown, do not show auth modal yet
        setShowAuthModal(false);
      } else if (!currentSession && localStorage.getItem('authModalDismissed') !== 'true') {
        // Only show auth modal if no session and not previously dismissed, AND disclaimer is not shown
        setShowAuthModal(true);
      }
    };

    checkModals();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      // If session becomes active, hide auth modal
      if (session) {
        setShowAuthModal(false);
      } else if (localStorage.getItem('authModalDismissed') !== 'true') {
        // If session ends and not dismissed, show auth modal
        setShowAuthModal(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []); // Empty dependency array means this runs once on mount

  const handleDisclaimerClose = () => {
    setShowDisclaimer(false);
    // After disclaimer is closed, check if auth modal should be shown
    if (!session && localStorage.getItem('authModalDismissed') !== 'true') {
      setShowAuthModal(true);
    }
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
            <Layout setShowAuthModal={setShowAuthModal}> 
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