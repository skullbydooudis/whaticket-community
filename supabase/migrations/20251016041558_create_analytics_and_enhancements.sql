/*
  # Create Analytics and Property Enhancements

  1. New Tables
    - `PropertyViews`
      - Track property page views for analytics
      - `id` (uuid, primary key)
      - `property_id` (uuid) - Property viewed
      - `lead_id` (uuid) - Lead who viewed (if logged)
      - `ip_address` (text) - Visitor IP
      - `user_agent` (text) - Browser info
      - `referrer` (text) - Where they came from
      - `duration` (integer) - Time spent in seconds
      - `created_at` (timestamptz)

    - `PropertyDocuments`
      - Store property documents
      - `id` (uuid, primary key)
      - `property_id` (uuid) - Related property
      - `name` (text) - Document name
      - `type` (text) - Document type
      - `url` (text) - Document URL
      - `size` (bigint) - File size in bytes
      - `uploaded_by` (integer) - User who uploaded
      - `created_at` (timestamptz)

  2. Enhancements to Properties Table
    - Add additional professional fields

  3. Security
    - Enable RLS
    - Policies for authenticated users
    - Public read for PropertyViews analytics
*/

CREATE TABLE IF NOT EXISTS "PropertyViews" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES "Properties"(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES "Leads"(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,
  referrer text,
  duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "PropertyDocuments" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES "Properties"(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  url text NOT NULL,
  size bigint,
  uploaded_by integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "PropertyViews" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PropertyDocuments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create property views"
  ON "PropertyViews" FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can view property views"
  ON "PropertyViews" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can view property documents"
  ON "PropertyDocuments" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can manage property documents"
  ON "PropertyDocuments" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_property_views_property ON "PropertyViews"(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_created ON "PropertyViews"(created_at);
CREATE INDEX IF NOT EXISTS idx_property_docs_property ON "PropertyDocuments"(property_id);

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'property_code'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN property_code text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'transaction_type'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN transaction_type text DEFAULT 'sale';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'rental_price'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN rental_price numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'condominium_fee'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN condominium_fee numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'iptu'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN iptu numeric(10, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'year_built'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN year_built integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'furnished'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN furnished boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN video_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'virtual_tour_url'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN virtual_tour_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'view_count'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN view_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'Properties' AND column_name = 'lead_count'
  ) THEN
    ALTER TABLE "Properties" ADD COLUMN lead_count integer DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_properties_code ON "Properties"(property_code);
CREATE INDEX IF NOT EXISTS idx_properties_transaction ON "Properties"(transaction_type);
