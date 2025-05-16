-- Create videos table
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  channel_title TEXT NOT NULL,
  description TEXT,
  thumbnail TEXT,
  duration TEXT,
  published_at TIMESTAMP,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  downloaded BOOLEAN NOT NULL DEFAULT FALSE,
  download_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create downloads table
CREATE TABLE IF NOT EXISTS downloads (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  format TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INTEGER,
  total_size INTEGER,
  downloaded_size INTEGER,
  error TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create video_collections table
CREATE TABLE IF NOT EXISTS video_collections (
  id SERIAL PRIMARY KEY,
  video_id INTEGER NOT NULL REFERENCES videos(id),
  collection_id INTEGER NOT NULL REFERENCES collections(id),
  added_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create unique index for video_collections
CREATE UNIQUE INDEX IF NOT EXISTS unique_video_collection ON video_collections(video_id, collection_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_video_collections_video_id ON video_collections(video_id);
CREATE INDEX IF NOT EXISTS idx_video_collections_collection_id ON video_collections(collection_id); 