const fs = require('fs');
const path = require('path');

// Supabase connection details
const SUPABASE_URL = 'https://uysatbupbbnjbvgckays.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c2F0YnVwYmJuamJ2Z2NrYXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzYxMjksImV4cCI6MjA2MjI1MjEyOX0.NpqSkNBr2LZfGRsZm7JeTfi99zd_V5Lr8C54MAvdlKY';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c2F0YnVwYmJuamJ2Z2NrYXlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NjY3NjEyOSwiZXhwIjoyMDYyMjUyMTI5fQ.v1Wz5QFGSVvmw7AQC2KZhY_2dJPbJxqHPVXOqyB8KDg';

// Environment variables content
const envContent = `VITE_SUPABASE_URL=${SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
DATABASE_URL=postgres://postgres.uysatbupbbnjbvgckays:YourStrongPassword123@aws-0-us-west-1.pooler.supabase.com:5432/postgres
YOUTUBE_API_KEY=AIzaSyDmhH5AZ52qIIIKN-l2r1LXK40Qi5JW7Q8`;

// Write environment variables
fs.writeFileSync(path.join(__dirname, '.env'), envContent);

console.log('✅ Environment variables set up successfully');