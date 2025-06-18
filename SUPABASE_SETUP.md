# Supabase Setup Guide for Sports Social

## Step 1: Create a Supabase Project

1. Go to [https://app.supabase.com](https://app.supabase.com)
2. Sign in or create an account
3. Click "New Project"
4. Choose your organization
5. Fill in your project details:
   - **Name**: Sports Social
   - **Database Password**: Choose a strong password
   - **Region**: Select the region closest to your users
6. Click "Create new project"
7. Wait for the project to be set up (this may take a few minutes)

## Step 2: Get Your Project Credentials

1. Once your project is ready, go to **Settings** > **API**
2. You'll find your project credentials:
   - **Project URL**: `https://your-project-ref.supabase.co`
   - **Anon (public) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - **Service role (secret) key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## Step 3: Update Environment Variables

### Frontend (.env)
Replace the placeholder values in `.env`:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
```

### Backend (server/.env)
Replace the placeholder values in `server/.env`:
```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_actual_service_role_key_here
```

## Step 4: Run Database Migrations

1. Go to your Supabase dashboard
2. Navigate to **SQL Editor**
3. Run the migration files in order:

### Migration 1: Initial Schema
Copy and paste the contents of `supabase/migrations/20250613191405_plain_silence.sql` and run it.

### Migration 2: Messaging Enhancements
Copy and paste the contents of `supabase/migrations/20250615183150_dusty_bush.sql` and run it.

### Migration 3: Notification System
Copy and paste the contents of `supabase/migrations/20250615183417_hidden_dust.sql` and run it.

## Step 5: Verify Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Check the server logs for successful Supabase connection
3. Try registering a new user to test the connection

## Features Enabled

Once connected, your Sports Social app will have:

- ✅ User authentication and profiles
- ✅ Post creation and discovery with geolocation
- ✅ Real-time messaging (direct and group)
- ✅ Interest system and group chat creation
- ✅ Follow/unfollow functionality
- ✅ Notification system
- ✅ Location-based post filtering
- ✅ User preferences and settings

## Troubleshooting

### Common Issues:

1. **"Missing Supabase configuration" error**
   - Make sure you've updated both `.env` files with your actual Supabase credentials
   - Restart your development server after updating environment variables

2. **"relation does not exist" errors**
   - Ensure you've run all three migration files in the correct order
   - Check the Supabase dashboard for any migration errors

3. **Authentication issues**
   - Verify your anon key is correct
   - Check that RLS policies are properly set up (they should be from the migrations)

4. **Real-time features not working**
   - Ensure your service role key is correct in the server environment
   - Check that the Socket.io server is running properly

### Getting Help

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the server logs for backend errors
3. Verify your Supabase dashboard for database issues
4. Ensure all environment variables are correctly set

## Security Notes

- Never commit your actual Supabase keys to version control
- The service role key should only be used on the server side
- Row Level Security (RLS) is enabled on all tables for data protection
- Users can only access their own data and public information