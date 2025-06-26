import { supabase } from '../config/supabase.js';

// In-memory fallback for development
const inMemoryStore = new Map();

export class EmailVerification {
  // Store OTP for email verification
  static async storeOTP(email, otp, userData) {
    try {
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

      // Try database first
      try {
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

        if (error) throw error;
        return { success: true, data };
      } catch (dbError) {
        console.log('Database table not available, using in-memory storage');
        
        // Fallback to in-memory storage
        const id = Date.now().toString();
        inMemoryStore.set(`${email}_${otp}`, {
          id,
          email,
          otp,
          user_data: userData,
          expires_at: expiresAt,
          verified: false,
          created_at: new Date()
        });

        return { success: true, data: { id } };
      }
    } catch (error) {
      console.error('Error storing OTP:', error);
      return { success: false, error: error.message };
    }
  }

  // Verify OTP and get user data
  static async verifyOTP(email, otp) {
    try {
      // Try database first
      try {
        const { data, error } = await supabase
          .from('email_verifications')
          .select('*')
          .eq('email', email)
          .eq('otp', otp)
          .eq('verified', false)
          .gt('expires_at', new Date().toISOString())
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            return { success: false, error: 'Invalid or expired OTP' };
          }
          throw error;
        }

        // Mark as verified
        await supabase
          .from('email_verifications')
          .update({ verified: true })
          .eq('id', data.id);

        return { success: true, data: data.user_data };
      } catch (dbError) {
        console.log('Database table not available, using in-memory storage');
        
        // Fallback to in-memory storage
        const key = `${email}_${otp}`;
        const record = inMemoryStore.get(key);
        
        if (!record) {
          return { success: false, error: 'Invalid OTP' };
        }

        if (record.verified) {
          return { success: false, error: 'OTP already used' };
        }

        if (new Date() > record.expires_at) {
          inMemoryStore.delete(key);
          return { success: false, error: 'OTP expired' };
        }

        // Mark as verified
        record.verified = true;
        inMemoryStore.set(key, record);

        return { success: true, data: record.user_data };
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      return { success: false, error: error.message };
    }
  }

  // Clean up expired OTPs
  static async cleanupExpiredOTPs() {
    try {
      // Try database cleanup
      try {
        const { error } = await supabase
          .from('email_verifications')
          .delete()
          .lt('expires_at', new Date().toISOString());

        if (error) throw error;
        console.log('Database expired OTPs cleaned up');
      } catch (dbError) {
        // Cleanup in-memory storage
        const now = new Date();
        for (const [key, record] of inMemoryStore.entries()) {
          if (now > record.expires_at) {
            inMemoryStore.delete(key);
          }
        }
        console.log('In-memory expired OTPs cleaned up');
      }
    } catch (error) {
      console.error('Error cleaning up expired OTPs:', error);
    }
  }

  // Resend OTP
  static async resendOTP(email) {
    try {
      // Try database first
      try {
        await supabase
          .from('email_verifications')
          .update({ verified: true }) // Mark as verified to prevent reuse
          .eq('email', email)
          .eq('verified', false);

        return { success: true };
      } catch (dbError) {
        // Cleanup in-memory storage for this email
        for (const [key, record] of inMemoryStore.entries()) {
          if (record.email === email && !record.verified) {
            inMemoryStore.delete(key);
          }
        }
        return { success: true };
      }
    } catch (error) {
      console.error('Error preparing for OTP resend:', error);
      return { success: false, error: error.message };
    }
  }
}
