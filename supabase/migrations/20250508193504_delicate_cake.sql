/*
  # Update Collections Schema

  This migration updates the collections table and its policies if they don't already exist.
  It uses IF NOT EXISTS checks to avoid conflicts.

  1. Changes
    - Add IF NOT EXISTS checks for table creation
    - Add IF NOT EXISTS checks for policies
    - Add proper error handling
*/

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

  -- Enable RLS if not already enabled
  ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

  -- Create policies if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collections' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access"
      ON collections
      FOR SELECT
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collections' AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access"
      ON collections
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collections' AND policyname = 'Allow public update access'
  ) THEN
    CREATE POLICY "Allow public update access"
      ON collections
      FOR UPDATE
      TO public
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'collections' AND policyname = 'Allow public delete access'
  ) THEN
    CREATE POLICY "Allow public delete access"
      ON collections
      FOR DELETE
      TO public
      USING (true);
  END IF;

END $$;