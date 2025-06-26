-- Create email_verifications table
CREATE TABLE email_verifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    otp VARCHAR(6) NOT NULL,
    user_data JSONB NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX idx_email_verifications_email_otp ON email_verifications(email, otp);
CREATE INDEX idx_email_verifications_expires_at ON email_verifications(expires_at);

-- Enable RLS
ALTER TABLE email_verifications ENABLE ROW LEVEL SECURITY;

-- Create policy (for now, allow all operations - you can restrict this later)
CREATE POLICY "Enable all operations for email_verifications" ON email_verifications
FOR ALL USING (true) WITH CHECK (true);
