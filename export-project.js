/**
 * Export Project Script
 * 
 * This script will create a zip file containing all the necessary files
 * to run this project locally.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Project name for the zip file
const PROJECT_NAME = 'youtube-video-manager';

console.log('📦 Creating project export...');

// Create a README file with setup instructions
const readmeContent = `# YouTube Video Manager

A comprehensive YouTube video management application that enables users to search, discover, and organize video content with enhanced playback and download capabilities.

## Features

- Search YouTube videos
- Download videos with quality options (1080p, 720p)
- Organize videos into collections
- Track watch history
- Inline video playback

## Setup Instructions

1. Install Node.js (v18+ recommended) and npm
2. Install PostgreSQL database
3. Create a database for the application
4. Run the following commands:

\`\`\`bash
# Install dependencies
npm install

# Setup environment variables
# Create a .env file with the following content (replace with your values):
# DATABASE_URL=postgresql://username:password@localhost:5432/youtube_manager
# YOUTUBE_API_KEY=your_youtube_api_key_here

# Push database schema
npm run db:push

# Start development server
npm run dev
\`\`\`

5. Access the application at http://localhost:5000

## Technology Stack

- React.js frontend with TypeScript
- Express.js backend
- PostgreSQL database
- YouTube Data API v3
- Tailwind CSS for UI
- WebSockets for real-time updates

## License

This project is for educational and personal use only.
`;

try {
  fs.writeFileSync('README.md', readmeContent);
  console.log('✅ Created README.md with setup instructions');

  // Create a .env.example file
  const envExampleContent = `# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/youtube_manager

# YouTube API key for search functionality
YOUTUBE_API_KEY=your_youtube_api_key_here
`;

  fs.writeFileSync('.env.example', envExampleContent);
  console.log('✅ Created .env.example file');

  // Create a local setup script
  const setupScriptContent = `#!/bin/bash
# Local setup script

echo "🚀 Setting up YouTube Video Manager locally..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
  echo "❌ Node.js is not installed. Please install Node.js first."
  exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
  echo "❌ npm is not installed. Please install npm first."
  exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
  echo "⚠️ .env file not found. Creating from .env.example..."
  cp .env.example .env
  echo "✅ Created .env file. Please update it with your database and API credentials."
else
  echo "✅ .env file already exists."
fi

# Reminder about database setup
echo "
⚠️ IMPORTANT: Make sure to:
1. Create a PostgreSQL database
2. Update the DATABASE_URL in .env with your database credentials
3. Get a YouTube API key and add it to YOUTUBE_API_KEY in .env
"

# Prompt to run database migrations
read -p "Would you like to run database migrations now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🔄 Running database migrations..."
  npm run db:push
  echo "✅ Database migrations completed."
else
  echo "⏭️ Skipping database migrations. You can run them later with: npm run db:push"
fi

# Prompt to start the server
read -p "Would you like to start the development server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "🚀 Starting development server..."
  npm run dev
else
  echo "⏭️ Skipping server start. You can start it later with: npm run dev"
fi

echo "
✅ Setup complete!
When ready, access your app at: http://localhost:5000
"
`;

  fs.writeFileSync('setup.sh', setupScriptContent);
  fs.chmodSync('setup.sh', '755'); // Make executable
  console.log('✅ Created setup.sh script');

  console.log('\n🎉 Export completed!');
  console.log('\nTo run this project locally:');
  console.log('1. Download all files');
  console.log('2. Install PostgreSQL if you don\'t have it');
  console.log('3. Run setup.sh script or follow the instructions in README.md');
  console.log('4. Get a YouTube API key and configure it in .env file');
  console.log('5. Start the application with npm run dev');

} catch (error) {
  console.error('❌ Error creating export files:', error);
}