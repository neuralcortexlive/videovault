const fs = require('fs');
const path = require('path');

// Database connection details
const DATABASE_URL = 'postgresql://neondb_owner:npg_jV8y7NgZraGo@ep-orange-moon-a4zqsh6t-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

// Environment variables content
const envContent = `DATABASE_URL=${DATABASE_URL}
YOUTUBE_API_KEY=AIzaSyDmhH5AZ52qIIIKN-l2r1LXK40Qi5JW7Q8`;

// Write environment variables
fs.writeFileSync(path.join(__dirname, '.env'), envContent);

console.log('✅ Environment variables set up successfully');