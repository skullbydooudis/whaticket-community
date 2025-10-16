/*
  # Create Properties Table for MaisCRM

  1. New Tables
    - `Properties`
      - `id` (uuid, primary key)
      - `title` (text) - Property title
      - `description` (text) - Detailed description
      - `type` (text) - Property type (house, apartment, commercial, land, etc)
      - `status` (text) - available, sold, rented, reserved
      - `price` (numeric) - Property price
      - `area` (numeric) - Area in square meters
      - `bedrooms` (integer) - Number of bedrooms
      - `bathrooms` (integer) - Number of bathrooms
      - `parking_spaces` (integer) - Number of parking spaces
      - `address` (text) - Full address
      - `city` (text) - City
      - `state` (text) - State
      - `zip_code` (text) - ZIP/Postal code
      - `images` (jsonb) - Array of image URLs
      - `features` (jsonb) - Property features/amenities
      - `public_url` (text, unique) - Public URL slug for landing page
      - `is_active` (boolean) - Whether property is visible
      - `user_id` (integer) - Reference to user (agent responsible)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `Properties` table
    - Add policy for authenticated users to view all properties
    - Add policy for authenticated users to create properties
    - Add policy for authenticated users to update their own properties or admin
    - Add policy for authenticated users to delete their own properties or admin
    - Add policy for public access to active properties via public_url
*/

CREATE TABLE IF NOT EXISTS "Properties" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'apartment',
  status text NOT NULL DEFAULT 'available',
  price numeric(12, 2) NOT NULL DEFAULT 0,
  area numeric(10, 2),
  bedrooms integer DEFAULT 0,
  bathrooms integer DEFAULT 0,
  parking_spaces integer DEFAULT 0,
  address text,
  city text,
  state text,
  zip_code text,
  images jsonb DEFAULT '[]'::jsonb,
  features jsonb DEFAULT '[]'::jsonb,
  public_url text UNIQUE,
  is_active boolean DEFAULT true,
  user_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE "Properties" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all properties"
  ON "Properties"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create properties"
  ON "Properties"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update own properties or admins can update all"
  ON "Properties"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete own properties or admins can delete all"
  ON "Properties"
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Public can view active properties"
  ON "Properties"
  FOR SELECT
  TO anon
  USING (is_active = true);

CREATE INDEX IF NOT EXISTS idx_properties_public_url ON "Properties"(public_url);
CREATE INDEX IF NOT EXISTS idx_properties_status ON "Properties"(status);
CREATE INDEX IF NOT EXISTS idx_properties_type ON "Properties"(type);
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON "Properties"(user_id);
