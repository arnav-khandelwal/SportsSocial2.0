import nodemailer from 'nodemailer';


console.log('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not set');
console.log('EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? 'Set' : 'Not set');

// Verify required environment variables
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
  console.error('Missing email credentials. Please check your .env file.');
  console.error('Required: EMAIL_USER and EMAIL_PASSWORD');
}

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Test the connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter verification failed:', error);
  } else {
    console.log('Email server is ready to take our messages');
  }
});

// Generate OTP
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Send OTP email
export const sendOTPEmail = async (email, otp, username) => {
  const logoUrl = 'https://ibb.co/7DNgBFz';
  
  const mailOptions = {
    from: {
      name: 'Sports Social',
      address: process.env.EMAIL_USER || 'connect.sportssocial@gmail.com'
    },
    to: email,
    subject: 'Verify Your Sports Social Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <table style="margin: 0 auto; margin-bottom: 10px;">
            <tr>
              <td style="vertical-align: middle; padding-right: 16px;">
                <img src="${logoUrl}" alt="Sports Social Logo" style="width: 48px; height: 48px; border-radius: 8px; display: block;" />
              </td>
              <td style="vertical-align: middle;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; white-space: nowrap;">Sports Social</h1>
              </td>
            </tr>
          </table>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Welcome to the community!</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${username}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Thank you for joining Sports Social! To complete your registration, please verify your email address using the OTP below:
          </p>
          
          <div style="background: #f8f9fa; border: 2px dashed #ff6b35; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #ff6b35; margin: 0; font-size: 32px; letter-spacing: 5px; font-weight: bold;">${otp}</h3>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This OTP is valid for 10 minutes</p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you didn't create an account with Sports Social, please ignore this email.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px; margin-bottom: 15px; font-weight: 500;">Stay Connected</p>
            <div style="display: inline-block;">
              <a href="https://discord.gg/9wFzcndTBX" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: #5865F2; color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                <span style="font-size: 18px;"></span> Discord
              </a>
              <a href="https://www.instagram.com/sportssocial.connect/" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: linear-gradient(135deg, #f093fb, #f5576c); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                <span style="font-size: 18px;"></span> Instagram
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 Sports Social. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('OTP email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset OTP email
export const sendPasswordResetEmail = async (email, otp, username) => {
  const logoUrl = 'https://ibb.co/7DNgBFz';
  
  const mailOptions = {
    from: {
      name: 'Sports Social',
      address: process.env.EMAIL_USER || 'connect.sportssocial@gmail.com'
    },
    to: email,
    subject: 'Reset Your Sports Social Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <table style="margin: 0 auto; margin-bottom: 10px;">
            <tr>
              <td style="vertical-align: middle; padding-right: 16px;">
                <img src="${logoUrl}" alt="Sports Social Logo" style="width: 48px; height: 48px; border-radius: 8px; display: block;" />
              </td>
              <td style="vertical-align: middle;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; white-space: nowrap;">Sports Social</h1>
              </td>
            </tr>
          </table>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Request</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${username}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We received a request to reset your Sports Social password. Use the verification code below to proceed:
          </p>
          
          <div style="background: #f8f9fa; border: 2px dashed #ff6b35; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <h3 style="color: #ff6b35; margin: 0; font-size: 32px; letter-spacing: 5px; font-weight: bold;">${otp}</h3>
            <p style="color: #666; margin: 10px 0 0 0; font-size: 14px;">This code is valid for 10 minutes</p>
          </div>
          
          <div style="background: linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 152, 0, 0.1)); border: 1px solid rgba(255, 107, 53, 0.2); border-radius: 8px; padding: 20px; margin: 20px 0;">
            <p style="color: #ff6b35; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">🔒 Security Notice</p>
            <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.5;">
              If you didn't request a password reset, please ignore this email and your password will remain unchanged. 
              For security, consider changing your password if you suspect unauthorized access.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px; margin-bottom: 15px; font-weight: 500;">Need Help?</p>
            <div style="display: inline-block;">
              <a href="https://sportssocial.netlify.app/" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                Visit Website
              </a>
              <a href="https://discord.gg/9wFzcndTBX" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: #5865F2; color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                Get Support
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 Sports Social. All rights reserved.<br>
              This password reset was requested from your account. If this wasn't you, please contact support immediately.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Password reset email error:', error);
    return { success: false, error: error.message };
  }
};

// Send Password Reset Confirmation email
export const sendPasswordResetConfirmationEmail = async (email, username) => {
  const logoUrl = 'https://ibb.co/7DNgBFz';
  
  const mailOptions = {
    from: {
      name: 'Sports Social',
      address: process.env.EMAIL_USER || 'connect.sportssocial@gmail.com'
    },
    to: email,
    subject: 'Password Reset Successful - Sports Social',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #4CAF50, #45a049); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <table style="margin: 0 auto; margin-bottom: 10px;">
            <tr>
              <td style="vertical-align: middle; padding-right: 16px;">
                <img src="${logoUrl}" alt="Sports Social Logo" style="width: 48px; height: 48px; border-radius: 8px; display: block;" />
              </td>
              <td style="vertical-align: middle;">
                <h1 style="color: white; margin: 0; font-size: 32px; font-weight: bold; white-space: nowrap;">Sports Social</h1>
              </td>
            </tr>
          </table>
          <p style="color: white; margin: 10px 0 0 0; font-size: 16px;">Password Reset Successful</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hi ${username}!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your Sports Social password has been successfully reset. You can now log in with your new password.
          </p>
          
          <div style="background: linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(69, 160, 73, 0.1)); border: 1px solid rgba(76, 175, 80, 0.2); border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0;">
            <p style="color: #4CAF50; font-weight: 600; margin: 0 0 8px 0; font-size: 18px;">✅ Password Updated</p>
            <p style="color: #666; margin: 0; font-size: 14px;">
              Your account is now secure with your new password.
            </p>
          </div>
          
          <div style="background: #f8f9fa; border-left: 4px solid #ff6b35; padding: 20px; margin: 20px 0;">
            <p style="color: #ff6b35; font-weight: 600; margin: 0 0 8px 0; font-size: 16px;">🔐 Security Tips</p>
            <ul style="color: #666; margin: 8px 0 0 0; padding-left: 20px; font-size: 14px; line-height: 1.5;">
              <li>Keep your password private and don't share it</li>
              <li>Use a unique password for Sports Social</li>
              <li>Log out from shared devices</li>
              <li>Contact us if you notice any suspicious activity</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://sportssocial.netlify.app/login" style="display: inline-block; padding: 14px 28px; background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; text-decoration: none; border-radius: 25px; font-weight: 600; font-size: 16px;">
              Login to Your Account
            </a>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 Sports Social. All rights reserved.<br>
              If you didn't reset your password, please contact our support team immediately.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Password reset confirmation email error:', error);
    return { success: false, error: error.message };
  }
};

// Send welcome email
export const sendWelcomeEmail = async (email, username) => {
  const logoUrl = 'https://ibb.co/7DNgBFz';
  
  const mailOptions = {
    from: {
      name: 'Sports Social',
      address: process.env.EMAIL_USER || 'connect.sportssocial@gmail.com'
    },
    to: email,
    subject: 'Welcome to Sports Social! 🏆',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 40px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <table style="margin: 0 auto; margin-bottom: 15px;">
            <tr>
              <td style="vertical-align: middle; padding-right: 15px;">
                <img src="${logoUrl}" alt="Sports Social Logo" style="width: 50px; height: 50px; border-radius: 10px; display: block;" />
              </td>
              <td style="vertical-align: middle;">
                <h1 style="color: white; margin: 0; font-size: 32px; white-space: nowrap;">Welcome to Sports Social!</h1>
              </td>
            </tr>
          </table>
          <p style="color: white; margin: 15px 0 0 0; font-size: 18px;">🎉 Your sports journey starts here</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hey ${username}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            We're thrilled to have you join our growing community of sports enthusiasts! Your account has been successfully created and verified.
          </p>
          
          <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ff6b35; margin: 0 0 15px 0;">🚀 What's next?</h3>
            <ul style="color: #666; line-height: 1.8; margin: 0; padding-left: 20px;">
              <li>Complete your profile and add your favorite sports</li>
              <li>Create your first post to connect with local players</li>
              <li>Browse and join events in your area</li>
              <li>Start messaging other sports enthusiasts</li>
              <li>Share reviews of sports venues and equipment</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}" 
               style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; font-size: 16px;">
              Start Exploring 🏃‍♂️
            </a>
          </div>
          
          <div style="background: #f8f9fa; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              <strong>💡 Pro Tip:</strong> Add multiple sports to your profile to discover more events and connect with diverse sports communities!
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you have any questions or need help getting started, feel free to reach out to our support team. We're here to help you make the most of your Sports Social experience!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px; margin-bottom: 15px; font-weight: 500;">Stay Connected</p>
            <div style="display: inline-block;">
              <a href="https://discord.gg/9wFzcndTBX" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: #5865F2; color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                <span style="font-size: 18px;"></span> Discord
              </a>
              <a href="https://www.instagram.com/sportssocial.connect/" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: linear-gradient(135deg, #f093fb, #f5576c); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                <span style="font-size: 18px;"></span> Instagram
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 Sports Social. All rights reserved.<br>
              You're receiving this email because you created an account with Sports Social.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Welcome email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { success: false, error: error.message };
  }
};

// Send event registration confirmation email
export const sendEventRegistrationEmail = async (email, name, eventTitle, teamName = null) => {
  const logoUrl = 'https://ibb.co/7DNgBFz';
  
  const mailOptions = {
    from: {
      name: 'Sports Social',
      address: process.env.EMAIL_USER || 'connect.sportssocial@gmail.com'
    },
    to: email,
    subject: `Event Registration Confirmed: ${eventTitle} 🏆`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); padding: 40px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <table style="margin: 0 auto; margin-bottom: 15px;">
            <tr>
              <td style="vertical-align: middle; padding-right: 15px;">
                <img src="${logoUrl}" alt="Sports Social Logo" style="width: 50px; height: 50px; border-radius: 10px; display: block;" />
              </td>
              <td style="vertical-align: middle;">
                <h1 style="color: white; margin: 0; font-size: 32px; white-space: nowrap;">Registration Confirmed!</h1>
              </td>
            </tr>
          </table>
          <p style="color: white; margin: 15px 0 0 0; font-size: 18px;">🎉 You're all set for the event</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Hey ${name}! 👋</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Great news! You have successfully registered for the following event:
          </p>
          
          <div style="background: linear-gradient(135deg, #e3f2fd, #f3e5f5); border-radius: 10px; padding: 20px; margin: 20px 0;">
            <h3 style="color: #ff6b35; margin: 0 0 15px 0;">📅 Event Details</h3>
            <div style="color: #666; line-height: 1.8;">
              <p style="margin: 8px 0;"><strong>Event:</strong> ${eventTitle}</p>
              ${teamName ? `<p style="margin: 8px 0;"><strong>Team Name:</strong> ${teamName}</p>` : ''}
              <p style="margin: 8px 0;"><strong>Registered Name:</strong> ${name}</p>
              <p style="margin: 8px 0;"><strong>Email:</strong> ${email}</p>
            </div>
          </div>
          
          <div style="background: #f8f9fa; border-left: 4px solid #ff6b35; padding: 15px; margin: 20px 0;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              <strong>📋 What's Next?</strong> 
              Further details about the event, including venue information, schedule, and any additional requirements will be sent to you shortly. Keep an eye on your inbox!
            </p>
          </div>
          
          <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
            <p style="color: #856404; margin: 0; font-size: 14px;">
              <strong>⚠️ Important:</strong> 
              Please save this email as confirmation of your registration. You may need to present it during the event check-in process.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6;">
            If you have any questions about the event or need to make changes to your registration, please contact our support team as soon as possible.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px; margin: 0;">Good luck and have fun! 🏃‍♂️💪</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <p style="color: #666; font-size: 16px; margin-bottom: 15px; font-weight: 500;">Stay Connected</p>
            <div style="display: inline-block;">
              <a href="https://discord.gg/9wFzcndTBX" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: #5865F2; color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                <span style="font-size: 18px;"></span> Discord
              </a>
              <a href="https://www.instagram.com/sportssocial.connect/" style="display: inline-block; margin: 0 10px; padding: 12px 24px; background: linear-gradient(135deg, #f093fb, #f5576c); color: white; text-decoration: none; border-radius: 25px; font-weight: 500; font-size: 16px;">
                <span style="font-size: 18px;"></span> Instagram
              </a>
            </div>
          </div>
          
          <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center;">
            <p style="color: #999; font-size: 12px; margin: 0;">
              © 2025 Sports Social. All rights reserved.<br>
              You're receiving this email because you registered for an event through Sports Social.
            </p>
          </div>
        </div>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Event registration email sent successfully to:', email);
    return { success: true };
  } catch (error) {
    console.error('Error sending event registration email:', error);
    return { success: false, error: error.message };
  }
};
