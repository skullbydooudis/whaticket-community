/*
  # Create Leads Management System

  1. New Tables
    - `Leads`
      - `id` (uuid, primary key)
      - `name` (text) - Lead name
      - `email` (text) - Email address
      - `phone` (text) - Phone number
      - `source` (text) - Lead source (website, whatsapp, referral, facebook, etc)
      - `status` (text) - new, contacted, qualified, negotiating, won, lost
      - `score` (integer) - Lead score 0-100
      - `budget_min` (numeric) - Minimum budget
      - `budget_max` (numeric) - Maximum budget
      - `property_type` (text) - Interested property type
      - `preferred_locations` (jsonb) - Array of preferred locations
      - `notes` (text) - General notes
      - `last_contact_date` (timestamptz) - Last contact date
      - `next_follow_up` (timestamptz) - Next scheduled follow-up
      - `assigned_to` (integer) - User responsible
      - `stage_id` (uuid) - Current pipeline stage
      - `contact_id` (integer) - Link to contacts table
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `Leads` table
    - Policies for authenticated users to manage leads
*/

CREATE TABLE IF NOT EXISTS "Leads" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  source text DEFAULT 'website',
  status text DEFAULT 'new',
  score integer DEFAULT 0,
  budget_min numeric(12, 2),
  budget_max numeric(12, 2),
  property_type text,
  preferred_locations jsonb DEFAULT '[]'::jsonb,
  notes text,
  last_contact_date timestamptz,
  next_follow_up timestamptz,
  assigned_to integer,
  stage_id uuid,
  contact_id integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE "Leads" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view all leads"
  ON "Leads"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create leads"
  ON "Leads"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update leads"
  ON "Leads"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete leads"
  ON "Leads"
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_leads_status ON "Leads"(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON "Leads"(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_stage_id ON "Leads"(stage_id);
CREATE INDEX IF NOT EXISTS idx_leads_email ON "Leads"(email);
CREATE INDEX IF NOT EXISTS idx_leads_phone ON "Leads"(phone);
CREATE INDEX IF NOT EXISTS idx_leads_next_follow_up ON "Leads"(next_follow_up);
