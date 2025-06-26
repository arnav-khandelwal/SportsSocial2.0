import nodemailer from 'nodemailer';

// Debug: Check if environment variables are loaded
console.log('Email configuration:');
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
          <h1 style="color: white; margin: 0; font-size: 28px;">Sports Social</h1>
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

// Send welcome email
export const sendWelcomeEmail = async (email, username) => {
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
          <h1 style="color: white; margin: 0; font-size: 32px;">🎉 Welcome to Sports Social!</h1>
          <p style="color: white; margin: 15px 0 0 0; font-size: 18px;">Your sports journey starts here</p>
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
