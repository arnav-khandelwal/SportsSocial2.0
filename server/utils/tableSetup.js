import { supabase } from '../config/supabase.js';

// Create email_verifications table manually
export const createEmailVerificationsTable = async () => {
  try {
    // First check if table exists
    const { data: tables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'email_verifications');

    if (checkError) {
      console.log('Cannot check table existence, will try to create...');
    }

    // Create table using raw SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS email_verifications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) NOT NULL,
          otp VARCHAR(6) NOT NULL,
          user_data JSONB NOT NULL,
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_email_verifications_email_otp ON email_verifications(email, otp);
        CREATE INDEX IF NOT EXISTS idx_email_verifications_expires_at ON email_verifications(expires_at);
      `
    });

    if (error) {
      console.error('Error creating email_verifications table:', error);
      return false;
    }

    console.log('Email verifications table created successfully');
    return true;
  } catch (error) {
    console.error('Error in createEmailVerificationsTable:', error);
    return false;
  }
};

// Alternative: Insert directly without table creation
export const insertEmailVerification = async (email, otp, userData) => {
  try {
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
    
    const { data, error } = await supabase
      .from('email_verifications')
      .insert({
        email,
        otp,
        user_data: userData,
        expires_at: expiresAt.toISOString(),
        verified: false
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error inserting email verification:', error);
    // If table doesn't exist, we'll store in memory for now
    return { success: false, error: error.message };
  }
};
