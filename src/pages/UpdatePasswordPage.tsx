import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';

const UpdatePasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setHasValidSession(true);
      } else {
        // If no session, check if it's a recovery link that hasn't been processed yet
        const urlParams = new URLSearchParams(window.location.hash);
        const type = urlParams.get('type');
        const accessToken = urlParams.get('access_token');

        if (type === 'recovery' && accessToken) {
          // Supabase client should automatically pick up the session from the URL hash
          // We just need to wait for the next onAuthStateChange event or getSession
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            setHasValidSession(true);
          } else {
            setError('Invalid or expired password reset link. Please request a new one.');
            setHasValidSession(false);
          }
        } else {
          setError('No active session or valid password reset link found.');
          setHasValidSession(false);
        }
      }
      setSessionLoaded(true);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handlePasswordUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const { data, error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        console.error('Supabase update user error:', updateError);
        throw updateError;
      }

      if (data.user) {
        setMessage('Your password has been updated successfully!');
        // Redirect to dashboard or home after successful update
        setTimeout(() => navigate('/'), 3000);
      } else {
        // This case might happen if the session is somehow invalid after update
        setError('Failed to update password. Please try logging in or requesting a new reset link.');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!sessionLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4 mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 space-y-6">
        <h2 className="text-2xl font-bold text-center text-gray-900">Set New Password</h2>
        <p className="text-center text-gray-600">Enter your new password below.</p>

        {message && <p className="text-green-600 text-center">{message}</p>}
        {error && <p className="text-red-600 text-center">{error}</p>}

        {hasValidSession ? (
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
              <div className="relative">
                <Lock size={18} className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="password"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Enter new password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
              <div className="relative">
                <Lock size={18} className="lucide lucide-lock absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Confirm new password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>
            <button
              type="submit"
              className="w-full bg-primary-600 text-white py-3 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        ) : (
          <p className="text-center text-red-600">{error || 'Please ensure you are using a valid password reset link.'}</p>
        )}
      </div>
    </div>
  );
};

export default UpdatePasswordPage;