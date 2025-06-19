# Supabase Integration Setup Guide

## Prerequisites
1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project in your Supabase dashboard

## Database Setup

### Step 1: Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy your Project URL and anon/public key

### Step 2: Update Configuration
1. Open `supabase-client.js`
2. Replace `YOUR_SUPABASE_URL` with your Project URL
3. Replace `YOUR_SUPABASE_ANON_KEY` with your anon/public key

\`\`\`javascript
const SUPABASE_URL = 'https://your-project-id.supabase.co'
const SUPABASE_ANON_KEY = 'your-anon-key-here'
\`\`\`

### Step 3: Run SQL Scripts
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the scripts in order:
   - First run `scripts/01-create-tables.sql`
   - Then run `scripts/02-seed-data.sql`

### Step 4: Set Up Row Level Security (Optional but Recommended)
Add these RLS policies in the SQL Editor:

\`\`\`sql
-- Enable RLS
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_tracking ENABLE ROW LEVEL SECURITY;

-- Allow public read access to vehicles
CREATE POLICY "Public vehicles are viewable by everyone" ON vehicles
    FOR SELECT USING (true);

-- Allow public insert/update for bookings (in production, you'd want proper auth)
CREATE POLICY "Anyone can create bookings" ON bookings
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can view their bookings" ON bookings
    FOR SELECT USING (true);

-- Allow public read access to tracking data
CREATE POLICY "Public tracking data is viewable" ON vehicle_tracking
    FOR SELECT USING (true);
\`\`\`

## Features Enabled

### Real-time Data Persistence
- All vehicle data is stored in PostgreSQL
- Bookings are saved to the database
- Vehicle status updates in real-time
- Admin dashboard shows live data

### Database Tables Created
1. **vehicles** - Store all vehicle information
2. **bookings** - Store customer bookings
3. **vehicle_tracking** - Store GPS tracking data

### API Endpoints Available
- `DatabaseService.getVehicles()` - Get all vehicles
- `DatabaseService.getAvailableVehicles()` - Get available vehicles only
- `DatabaseService.createBooking()` - Create new booking
- `DatabaseService.getBookingById()` - Get booking details
- `DatabaseService.getStatistics()` - Get dashboard statistics
- And many more...

## Testing the Integration

1. Open the website in your browser
2. Navigate to the Fleet page - vehicles should load from Supabase
3. Try making a booking - it should save to the database
4. Check the admin dashboard - statistics should reflect real data
5. Use the tracking feature with a booking ID from the database

## Troubleshooting

### Common Issues:
1. **CORS Errors**: Make sure your domain is added to the allowed origins in Supabase settings
2. **Connection Errors**: Verify your URL and API key are correct
3. **Permission Errors**: Check that RLS policies are set up correctly
4. **Data Not Loading**: Check browser console for error messages

### Debug Mode:
Open browser developer tools and check the Console tab for any error messages.

## Production Considerations

1. **Environment Variables**: Store credentials in environment variables
2. **Authentication**: Implement proper user authentication
3. **RLS Policies**: Set up proper row-level security
4. **API Rate Limits**: Monitor usage and implement rate limiting
5. **Backup Strategy**: Set up automated backups
6. **SSL/HTTPS**: Ensure all connections are secure

## Next Steps

1. Add user authentication with Supabase Auth
2. Implement real-time subscriptions for live updates
3. Add image upload functionality with Supabase Storage
4. Set up automated email notifications
5. Implement payment processing integration
