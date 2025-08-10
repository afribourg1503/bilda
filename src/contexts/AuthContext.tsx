import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { getProfileByUserId } from '@/lib/database';
import { ProfileOnboardingModal } from '@/components/ProfileOnboardingModal';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  needsOnboarding: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  signInWithProvider: (provider: 'github' | 'google') => Promise<{ error: any }>;
  updateProfile: (updates: { name?: string; avatar_url?: string }) => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [showOnboardingModal, setShowOnboardingModal] = useState(false);
  const [profileChecked, setProfileChecked] = useState(false);

  // Check if user needs onboarding - only called once per user
  const checkUserProfile = async (user: User) => {
    if (profileChecked) return;
    
    console.log('🔐 AuthContext: Checking profile for user:', user.id);
    setProfileChecked(true);
    
    try {
      const { data: profile, error } = await getProfileByUserId(user.id);
      
      if (error || !profile || !profile.handle) {
        console.log('🔐 AuthContext: User needs onboarding');
        setNeedsOnboarding(true);
        setShowOnboardingModal(true);
      } else {
        console.log('🔐 AuthContext: User profile found, no onboarding needed');
        setNeedsOnboarding(false);
        setShowOnboardingModal(false);
      }
    } catch (error) {
      console.error('❌ AuthContext: Error checking profile:', error);
      // On error, assume user needs onboarding
      setNeedsOnboarding(true);
      setShowOnboardingModal(true);
    }
  };

  useEffect(() => {
    console.log('🔐 AuthContext: Starting authentication initialization...');
    
    let mounted = true;
    
    // Simple timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) {
        console.warn('⚠️ Auth initialization timeout, forcing loading to false');
        setLoading(false);
      }
    }, 8000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return;
      
      console.log('🔐 AuthContext: Initial session check complete');
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        checkUserProfile(session.user);
      }
      
      setLoading(false);
    }).catch((error) => {
      if (!mounted) return;
      console.error('❌ AuthContext: Error getting session:', error);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      
      console.log('🔐 AuthContext: Auth state changed:', _event);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Reset profile check for new user
        setProfileChecked(false);
        checkUserProfile(session.user);
      } else {
        setNeedsOnboarding(false);
        setShowOnboardingModal(false);
        setProfileChecked(false);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: { name }
      }
    });
    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const signInWithProvider = async (provider: 'github' | 'google') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    return { error };
  };

  const updateProfile = async (updates: { name?: string; avatar_url?: string }) => {
    // This would update the user metadata
    const { error } = await supabase.auth.updateUser({
      data: updates
    });
    return { error };
  };

  const handleOnboardingComplete = () => {
    setNeedsOnboarding(false);
    setShowOnboardingModal(false);
    // Refresh the profile check
    if (user) {
      setProfileChecked(false);
      checkUserProfile(user);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    needsOnboarding,
    signIn,
    signUp,
    signOut,
    signInWithProvider,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
             {showOnboardingModal && (
         <ProfileOnboardingModal
           open={showOnboardingModal}
           onComplete={handleOnboardingComplete}
         />
       )}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 