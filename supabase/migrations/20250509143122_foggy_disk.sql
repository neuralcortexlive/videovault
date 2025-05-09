/*
  # Initial Database Schema
  
  This migration creates the core schema for the YouTube video manager application.

  1. Tables
    - collections: Store video collections
      - id (serial primary key)
      - name (text, not null)
      - description (text)
      - thumbnail_url (text)
      - created_at (timestamptz)
      - updated_at (timestamptz)
    
    - videos: Store video metadata
      - id (serial primary key)
      - video_id (text, unique)
      - title (text)
      - description (text)
      - channel_title (text)
      - thumbnail_url (text)
      - published_at (text)
      - duration (text)
      - view_count (text)
      - download_path (text)
      - format (text)
      - quality (text)
      - file_size (integer)
      - is_downloaded (boolean)
      - is_watched (boolean)
      - downloaded_at (timestamptz)
      - metadata (jsonb)
    
    - video_collections: Many-to-many relationship
      - id (serial primary key)
      - video_id (integer, references videos)
      - collection_id (integer, references collections)
    
    - download_tasks: Track download progress
      - id (serial primary key)
      - video_id (text)
      - title (text)
      - status (text)
      - progress (integer)
      - format (text)
      - quality (text)
      - error_message (text)
      - created_at (timestamptz)
      - completed_at (timestamptz)
      - file_size (integer)
      - file_path (text)
      - collection_id (integer, references collections)

  2. Security
    - Enable RLS on all tables
    - Add public access policies
*/

-- Create collections table
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create videos table
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
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

-- Create video_collections table
CREATE TABLE video_collections (
  id SERIAL PRIMARY KEY,
  video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
  collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE
);

-- Create download_tasks table
CREATE TABLE download_tasks (
  id SERIAL PRIMARY KEY,
  video_id TEXT NOT NULL,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  progress INTEGER DEFAULT 0,
  format TEXT DEFAULT 'mp4',
  quality TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  file_size INTEGER,
  file_path TEXT,
  collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE download_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies for collections
CREATE POLICY "Allow public read access" ON collections FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access" ON collections FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access" ON collections FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access" ON collections FOR DELETE TO public USING (true);

-- Create policies for videos
CREATE POLICY "Allow public read access" ON videos FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access" ON videos FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access" ON videos FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access" ON videos FOR DELETE TO public USING (true);

-- Create policies for video_collections
CREATE POLICY "Allow public read access" ON video_collections FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access" ON video_collections FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access" ON video_collections FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access" ON video_collections FOR DELETE TO public USING (true);

-- Create policies for download_tasks
CREATE POLICY "Allow public read access" ON download_tasks FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert access" ON download_tasks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update access" ON download_tasks FOR UPDATE TO public USING (true);
CREATE POLICY "Allow public delete access" ON download_tasks FOR DELETE TO public USING (true);