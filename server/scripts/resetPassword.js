// Password Reset Script
// Run this with: node resetPassword.js user@example.com newPassword123

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function resetPassword(email, newPassword) {
  try {
    console.log(`Resetting password for: ${email}`);
    
    // Hash the new password using the same method as User.js
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    console.log('Generated hash:', hashedPassword);
    
    // Update in database
    const { data, error } = await supabase
      .from('users')
      .update({ 
        password: hashedPassword,
        updated_at: new Date().toISOString()
      })
      .eq('email', email)
      .select();

    if (error) {
      console.error('Error:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Password reset successfully!');
      console.log(`User: ${data[0].username} (${data[0].email})`);
      console.log(`New password: ${newPassword}`);
      console.log('📝 Note: User should change this password on next login');
    } else {
      console.log('❌ User not found with that email');
    }

  } catch (error) {
    console.error('Script error:', error);
  }
}

// Generate temporary password function
function generateTempPassword() {
  const adjectives = ['Quick', 'Safe', 'Fast', 'Smart', 'Cool', 'New', 'Easy'];
  const nouns = ['User', 'Player', 'Gamer', 'Sport', 'Team', 'Hero', 'Star'];
  const numbers = Math.floor(Math.random() * 999) + 100;
  
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  
  return `${adjective}${noun}${numbers}`;
}

// Get command line arguments
const email = process.argv[2];
let newPassword = process.argv[3];

// If no password provided, generate a temporary one
if (!newPassword) {
  newPassword = generateTempPassword();
  console.log(`🔐 Generated temporary password: ${newPassword}`);
}

if (!email) {
  console.log('Usage: node resetPassword.js <email> [newPassword]');
  console.log('Example: node resetPassword.js user@example.com');
  console.log('Example: node resetPassword.js user@example.com MyNewPassword123');
  console.log('If no password is provided, a temporary one will be generated.');
  process.exit(1);
}

resetPassword(email, newPassword);