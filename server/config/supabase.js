import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your .env file.');
  console.error('Required variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Check if using placeholder values
if (supabaseUrl.includes('your-project-ref') || supabaseUrl.includes('your-actual-project-ref')) {
  console.error('❌ Please replace placeholder Supabase URL with your actual project URL');
  console.error('Get your project URL from: https://app.supabase.com');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Test connection
export const testConnection = async () => {
  try {
    console.log('🔄 Testing Supabase connection...');
    
    // Try to query the users table
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection test failed:', error.message);
      
      // Check if it's a table not found error
      if (error.message.includes('relation "users" does not exist')) {
        console.log('💡 It looks like the database tables haven\'t been created yet.');
        console.log('Please run the migration in your Supabase dashboard or use the SQL editor.');
      }
      
      return false;
    }
    
    console.log('✅ Connected to Supabase successfully');
    return true;
  } catch (error) {
    console.log('❌ Supabase connection error:', error.message);
    
    // More specific error handling
    if (error.message.includes('fetch')) {
      console.log('💡 This might be a network issue or invalid Supabase URL.');
    }
    
    return false;
  }
};