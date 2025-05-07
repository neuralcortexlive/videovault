/**
 * Database Initialization Script
 * 
 * This script will create some initial collections in the database
 * to help users get started with the application.
 */

require('dotenv').config();
const { db } = require('./server/db');
const { collections } = require('./shared/schema');

async function initializeCollections() {
  console.log('🔄 Initializing default collections...');

  try {
    // Check if we already have collections
    const existingCollections = await db.select().from(collections);
    
    if (existingCollections.length > 0) {
      console.log(`✅ Database already has ${existingCollections.length} collections. No need to initialize.`);
      return;
    }

    // Create default collections
    const defaultCollections = [
      {
        name: 'Educational',
        description: 'Tutorials and learning content',
        color: '#4285F4', // Google Blue
      },
      {
        name: 'Entertainment',
        description: 'Fun videos to watch in free time',
        color: '#EA4335', // Google Red
      },
      {
        name: 'Music',
        description: 'Favorite songs and playlists',
        color: '#FBBC05', // Google Yellow
      },
      {
        name: 'Watch Later',
        description: 'Videos to watch in the future',
        color: '#34A853', // Google Green
      }
    ];

    // Insert collections
    const insertPromises = defaultCollections.map(collection => 
      db.insert(collections).values(collection)
    );
    
    await Promise.all(insertPromises);
    console.log(`✅ Successfully created ${defaultCollections.length} default collections`);
    
  } catch (error) {
    console.error('❌ Error initializing collections:', error);
  } finally {
    // Close database connection
    process.exit(0);
  }
}

// Run the initialization
initializeCollections();