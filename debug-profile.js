// Debug script to check and fix profile issues
// Run this in browser console if you need to manually fix profile issues

async function debugProfile() {
  const { supabase } = window;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  console.log('Current user:', user);
  
  if (!user) {
    console.log('No user logged in');
    return;
  }
  
  // Check if profile exists
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  console.log('Profile check:', { profile, error });
  
  // If no profile exists, create one manually
  if (error && error.code === 'PGRST116') {
    console.log('No profile found, creating one...');
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        user_id: user.id,
        handle: `user_${Date.now()}`,
        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Builder',
        avatar_url: user.user_metadata?.avatar_url
      })
      .select()
      .single();
    
    console.log('Profile creation result:', { newProfile, createError });
  }
}

// Add to window for easy access
window.debugProfile = debugProfile;
console.log('Debug function added. Run debugProfile() to check your profile.');