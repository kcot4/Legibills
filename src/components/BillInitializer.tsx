import { useEffect, useState } from 'react';
import { useBillContext } from '../context/BillContext';
import { supabase } from '../lib/supabase';

const BillInitializer = ({ children }: { children: React.ReactNode }) => {
  const { refreshBills, connectionStatus } = useBillContext();
  const [isInitializing, setIsInitializing] = useState(false);
  const [initializationStatus, setInitializationStatus] = useState<string>('checking');

  useEffect(() => {
    const initializeBills = async () => {
      if (isInitializing) {
        console.log('Initialization already in progress, skipping...');
        return;
      }
      
      setIsInitializing(true);
      setInitializationStatus('checking');
      
      try {
        console.log('Starting bill initialization check...');
        
        // Enhanced connection check with better error handling
        try {
          const { data: existingBills, error: countError, count } = await supabase
            .from('bills')
            .select('*', { count: 'exact', head: true });

          if (countError) {
            console.error('Error checking bills:', {
              message: countError.message,
              details: countError.details,
              hint: countError.hint,
              code: countError.code
            });
            
            // Handle specific error cases
            if (countError.message.includes('Failed to fetch')) {
              console.log('Network connectivity issue detected, attempting to refresh...');
              setInitializationStatus('refreshing');
              await refreshBills();
              return;
            } else if (countError.code === 'PGRST301' || countError.code === '42P01') {
              console.log('Database schema issue detected, attempting to refresh...');
              setInitializationStatus('refreshing');
              await refreshBills();
              return;
            }
            
            throw countError;
          }

          console.log('Bill count check result:', { count, hasData: !!existingBills?.length });

          if (count && count > 0) {
            console.log(`Database already contains ${count} bills, refreshing data...`);
            setInitializationStatus('refreshing');
            await refreshBills();
            console.log('Bills refreshed successfully');
            return;
          }
        } catch (connectionError) {
          console.error('Connection error during initialization:', connectionError);
          
          // If it's a network error, still try to refresh to get proper error handling
          if (connectionError instanceof Error && connectionError.message.includes('Failed to fetch')) {
            console.log('Network error detected, attempting refresh for proper error handling...');
            setInitializationStatus('refreshing');
            await refreshBills();
            return;
          }
          
          throw connectionError;
        }

        console.log('No bills found, attempting to import...');
        setInitializationStatus('importing');

        // Check if import function is available with better error handling
        const importUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-bills`;
        console.log('Testing import function availability...');

        try {
          const testResponse = await fetch(importUrl, {
            method: 'HEAD',
            headers: {
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            }
          });
          
          if (!testResponse.ok && testResponse.status === 404) {
            console.log('Import function not available, skipping import');
            setInitializationStatus('refreshing');
            await refreshBills();
            return;
          }
        } catch (error) {
          console.log('Import function test failed, proceeding with import attempt...');
        }

        // Attempt to import bills with enhanced error handling
        const maxRetries = 2;
        let retryCount = 0;
        let success = false;

        while (retryCount < maxRetries && !success) {
          try {
            console.log(`Attempting to import bills (attempt ${retryCount + 1}/${maxRetries})`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000);
            
            const response = await fetch(importUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json'
              },
              signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
              const errorText = await response.text();
              throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
            }

            const data = await response.json();
            console.log('Import response:', data);
            
            if (data.status === 'error') {
              throw new Error(data.message || 'Unknown error importing bills');
            }

            if (data.status === 'locked') {
              console.log('Import process is locked, another import is in progress');
              await new Promise(resolve => setTimeout(resolve, 2000));
              setInitializationStatus('refreshing');
              await refreshBills();
              return;
            }

            console.log('Import completed successfully:', data);
            success = true;
            
            setInitializationStatus('refreshing');
            await refreshBills();
            console.log('Bills initialized and refreshed successfully');
            
          } catch (error) {
            retryCount++;
            console.error(`Failed to import bills (attempt ${retryCount}/${maxRetries}):`, {
              error: error instanceof Error ? error.message : 'Unknown error',
              name: error instanceof Error ? error.name : 'Unknown',
              stack: error instanceof Error ? error.stack : undefined
            });
            
            // If it's an AbortError (timeout) or network error, don't retry
            if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('Failed to fetch'))) {
              console.log('Network/timeout error, proceeding with refresh...');
              break;
            }
            
            if (retryCount < maxRetries) {
              const delay = Math.min(2000 * retryCount, 4000);
              console.log(`Waiting ${delay}ms before retry...`);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }

        if (!success) {
          console.log(`Import failed after ${maxRetries} attempts, proceeding with refresh...`);
        }

        // Always try to refresh bills, even if import failed
        setInitializationStatus('refreshing');
        await refreshBills();
        
      } catch (error) {
        console.error('Error in bill initialization:', {
          error: error instanceof Error ? error.message : 'Unknown error',
          name: error instanceof Error ? error.name : 'Unknown',
          stack: error instanceof Error ? error.stack : undefined
        });
        
        // Even if initialization fails, try to refresh bills for proper error handling
        try {
          setInitializationStatus('refreshing');
          await refreshBills();
        } catch (refreshError) {
          console.error('Failed to refresh bills after initialization error:', refreshError);
          setInitializationStatus('error');
        }
      } finally {
        setIsInitializing(false);
        setInitializationStatus('complete');
      }
    };

    // Only run initialization once
    initializeBills();
  }, []); // Remove refreshBills from dependencies to prevent re-runs

  // Show status during initialization for debugging
  if (process.env.NODE_ENV === 'development' && (isInitializing || connectionStatus === 'error')) {
    console.log('Initialization status:', initializationStatus, 'Connection status:', connectionStatus);
  }

  return <>{children}</>;
};

export default BillInitializer;