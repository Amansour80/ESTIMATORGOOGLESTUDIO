import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import Login from './components/Login';
import App from './App';
import { OrganizationProvider } from './contexts/OrganizationContext';
import type { User } from '@supabase/supabase-js';

export default function AuthWrapper() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error('Session error:', error);
        setError(error.message);
      }
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to get session:', err);
      setError('Failed to initialize authentication');
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    }

    setAuthLoading(false);
  };

  const handleSignup = async (
    email: string,
    password: string,
    orgData: {
      organizationName: string;
      industry: string;
      companySize: string;
      country: string;
      phone?: string;
      website?: string;
    }
  ) => {
    setAuthLoading(true);
    setError(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_name: orgData.organizationName,
          industry: orgData.industry,
          company_size: orgData.companySize,
          country: orgData.country,
          phone: orgData.phone,
          website: orgData.website,
        }
      }
    });

    if (signUpError) {
      setError(signUpError.message);
    }

    setAuthLoading(false);
  };

  const handleLogout = async () => {
    setAuthLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setAuthLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded text-red-700 max-w-md">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={handleLogin} onSignup={handleSignup} error={error} loading={authLoading} />;
  }

  return (
    <OrganizationProvider>
      <App user={user} onLogout={handleLogout} />
    </OrganizationProvider>
  );
}
