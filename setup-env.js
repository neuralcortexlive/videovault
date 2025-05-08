const fs = require('fs');
const path = require('path');

// Environment variables
const envContent = `VITE_SUPABASE_URL=https://uysatbupbbnjbvgckays.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV5c2F0YnVwYmJuamJ2Z2NrYXlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY2NzYxMjksImV4cCI6MjA2MjI1MjEyOX0.NpqSkNBr2LZfGRsZm7JeTfi99zd_V5Lr8C54MAvdlKY
SUPABASE_SERVICE_ROLE_KEY=sbp_fcb0d4e4e3d835bfcef3f1abe6a34d2b966e57a4
DATABASE_URL=postgres://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.uysatbupbbnjbvgckays.supabase.co:5432/postgres
YOUTUBE_API_KEY=AIzaSyDmhH5AZ52qIIIKN-l2r1LXK40Qi5JW7Q8`;

// Write environment variables
fs.writeFileSync(path.join(__dirname, '.env'), envContent);

console.log('✅ Environment variables set up successfully');