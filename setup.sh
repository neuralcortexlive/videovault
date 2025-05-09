#!/bin/bash

echo "🚀 Setting up YouTube Video Manager..."

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

# Check if .env file exists, if not create it from env.txt
if [ ! -f .env ]; then
  echo "⚠️ .env file not found. Creating from env.txt..."
  if [ -f env.txt ]; then
    cp env.txt .env
    echo "✅ Created .env file from env.txt"
  else
    echo "❌ env.txt not found. Please create a .env file with your database credentials."
    exit 1
  fi
fi

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:push

# Start the development server
echo "🚀 Starting development server..."
npm run dev

echo "
✅ Setup complete!
Your application is now running at: http://localhost:5000
"