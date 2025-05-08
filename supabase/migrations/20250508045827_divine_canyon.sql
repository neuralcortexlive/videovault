/*
  # Schema Update with Policy Checks
  
  1. Tables
    - `videos`: Stores video information and metadata
    - `collections`: Stores video collections/playlists
    - `video_collections`: Many-to-many mapping between videos and collections
    - `download_tasks`: Tracks video download progress and status
    
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users (with existence checks)
*/

-- Videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  channel_title TEXT,
  thumbnail_url TEXT,
  published_at TEXT,
  duration TEXT,
  view_count TEXT,
  download_path TEXT,
  format TEXT DEFAULT 'mp4',
  quality TEXT,
  file_size INTEGER,
  is_downloaded BOOLEAN DEFAULT false,
  is_watched BOOLEAN DEFAULT false,
  downloaded_at TIMESTAMPTZ,
  metadata JSONB
);

-- Collections table
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Video collections mapping table
CREATE TABLE IF NOT EXISTS video_collections (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id),
  collection_id INTEGER NOT NULL REFERENCES collections(id)
);

-- Download tasks table
CREATE TABLE IF NOT EXISTS download_tasks (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  format TEXT DEFAULT 'mp4',
  quality TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  file_size INTEGER,
  file_path TEXT,
  collection_id INTEGER REFERENCES collections(id)
);

-- Enable Row Level Security
DO $$ 
BEGIN
  -- Enable RLS only if not already enabled
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'videos' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'collections' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'video_collections' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'download_tasks' 
    AND rowsecurity = true
  ) THEN
    ALTER TABLE download_tasks ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Create default policies
DO $$ 
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Enable read access for all users" ON videos;
  DROP POLICY IF EXISTS "Enable read access for all users" ON collections;
  DROP POLICY IF EXISTS "Enable read access for all users" ON video_collections;
  DROP POLICY IF EXISTS "Enable read access for all users" ON download_tasks;

  -- Create new policies
  CREATE POLICY "Enable read access for all users" ON videos FOR SELECT USING (true);
  CREATE POLICY "Enable read access for all users" ON collections FOR SELECT USING (true);
  CREATE POLICY "Enable read access for all users" ON video_collections FOR SELECT USING (true);
  CREATE POLICY "Enable read access for all users" ON download_tasks FOR SELECT USING (true);
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_download_tasks_video_id ON download_tasks(video_id);
CREATE INDEX IF NOT EXISTS idx_video_collections_collection_id ON video_collections(collection_id);