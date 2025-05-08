/*
  # Create Collections Schema

  1. Tables
    - collections
      - id (serial, primary key)
      - name (text, not null)
      - description (text)
      - thumbnail_url (text)
      - created_at (timestamptz, default: now())
      - updated_at (timestamptz, default: now())

  2. Security
    - Enable RLS
    - Add policies for public access
*/

-- Create collections table
CREATE TABLE IF NOT EXISTS collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access"
  ON collections
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access"
  ON collections
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON collections
  FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Allow public delete access"
  ON collections
  FOR DELETE
  TO public
  USING (true);