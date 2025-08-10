// Check what tables exist in the database
// Paste this into browser console to check database status

async function checkDatabase() {
  console.log('🔍 Checking database status...');
  
  // Check if profiles table exists
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Profiles table error:', error);
      if (error.code === '42P01') {
        console.log('📝 Profiles table does not exist. You need to run SUPABASE_ADDITIONAL_TABLES.sql');
      }
    } else {
      console.log('✅ Profiles table exists, found', data?.length || 0, 'profiles');
    }
  } catch (e) {
    console.error('❌ Error checking profiles table:', e);
  }

  // Check if sessions table exists
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Sessions table error:', error);
    } else {
      console.log('✅ Sessions table exists, found', data?.length || 0, 'sessions');
    }
  } catch (e) {
    console.error('❌ Error checking sessions table:', e);
  }

  // Check current user
  try {
    const { data: { user } } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.id || 'Not logged in');
  } catch (e) {
    console.error('❌ Error checking user:', e);
  }
}

// Add to window for easy access
window.checkDatabase = checkDatabase;
console.log('🛠️  Debug function added. Run checkDatabase() to check your database.');