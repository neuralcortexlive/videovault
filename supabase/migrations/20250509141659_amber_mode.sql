DO $$ 
BEGIN
  -- Create collections table if it doesn't exist
  CREATE TABLE IF NOT EXISTS collections (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    thumbnail_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
  );

  -- Create videos table if it doesn't exist
  CREATE TABLE IF NOT EXISTS videos (
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

  -- Create video_collections table if it doesn't exist
  CREATE TABLE IF NOT EXISTS video_collections (
    id SERIAL PRIMARY KEY,
    video_id INTEGER REFERENCES videos(id) ON DELETE CASCADE,
    collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE
  );

  -- Create download_tasks table if it doesn't exist
  CREATE TABLE IF NOT EXISTS download_tasks (
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

  -- Enable RLS for all tables if not already enabled
  DO $$
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'collections' 
      AND rowsecurity = true
    ) THEN
      ALTER TABLE collections ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'videos' 
      AND rowsecurity = true
    ) THEN
      ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'video_collections' 
      AND rowsecurity = true
    ) THEN
      ALTER TABLE video_collections ENABLE ROW LEVEL SECURITY;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename = 'download_tasks' 
      AND rowsecurity = true
    ) THEN
      ALTER TABLE download_tasks ENABLE ROW LEVEL SECURITY;
    END IF;
  END $$;

  -- Create policies for collections if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON collections FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow public insert access') THEN
    CREATE POLICY "Allow public insert access" ON collections FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow public update access') THEN
    CREATE POLICY "Allow public update access" ON collections FOR UPDATE TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collections' AND policyname = 'Allow public delete access') THEN
    CREATE POLICY "Allow public delete access" ON collections FOR DELETE TO public USING (true);
  END IF;

  -- Create policies for videos if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON videos FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Allow public insert access') THEN
    CREATE POLICY "Allow public insert access" ON videos FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Allow public update access') THEN
    CREATE POLICY "Allow public update access" ON videos FOR UPDATE TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Allow public delete access') THEN
    CREATE POLICY "Allow public delete access" ON videos FOR DELETE TO public USING (true);
  END IF;

  -- Create policies for video_collections if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_collections' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON video_collections FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_collections' AND policyname = 'Allow public insert access') THEN
    CREATE POLICY "Allow public insert access" ON video_collections FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_collections' AND policyname = 'Allow public update access') THEN
    CREATE POLICY "Allow public update access" ON video_collections FOR UPDATE TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_collections' AND policyname = 'Allow public delete access') THEN
    CREATE POLICY "Allow public delete access" ON video_collections FOR DELETE TO public USING (true);
  END IF;

  -- Create policies for download_tasks if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'download_tasks' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON download_tasks FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'download_tasks' AND policyname = 'Allow public insert access') THEN
    CREATE POLICY "Allow public insert access" ON download_tasks FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'download_tasks' AND policyname = 'Allow public update access') THEN
    CREATE POLICY "Allow public update access" ON download_tasks FOR UPDATE TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'download_tasks' AND policyname = 'Allow public delete access') THEN
    CREATE POLICY "Allow public delete access" ON download_tasks FOR DELETE TO public USING (true);
  END IF;

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Error creating schema: %', SQLERRM;
  RAISE;
END $$;