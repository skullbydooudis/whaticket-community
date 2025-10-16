/*
  # Create Visits Table for MaisCRM

  1. New Tables
    - `Visits`
      - `id` (uuid, primary key)
      - `property_id` (uuid) - Reference to property
      - `contact_id` (integer) - Reference to contact (potential buyer/renter)
      - `user_id` (integer) - Reference to user (agent responsible)
      - `scheduled_date` (timestamptz) - When the visit is scheduled
      - `status` (text) - scheduled, completed, cancelled, no_show
      - `notes` (text) - Visit notes and observations
      - `feedback` (text) - Client feedback after visit
      - `interested` (boolean) - Whether client showed interest
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `Visits` table
    - Add policy for authenticated users to view all visits
    - Add policy for authenticated users to create visits
    - Add policy for authenticated users to update visits
    - Add policy for authenticated users to delete visits

  3. Notes
    - Visits link properties with contacts through scheduled appointments
    - This allows tracking of property viewings and client engagement
*/

CREATE TABLE IF NOT EXISTS "Visits" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES "Properties"(id) ON DELETE CASCADE,
  contact_id integer,
  user_id integer,
  scheduled_date timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  feedback text,
  interested boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE "Visits" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visits"
  ON "Visits"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create visits"
  ON "Visits"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update visits"
  ON "Visits"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete visits"
  ON "Visits"
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_visits_property_id ON "Visits"(property_id);
CREATE INDEX IF NOT EXISTS idx_visits_contact_id ON "Visits"(contact_id);
CREATE INDEX IF NOT EXISTS idx_visits_user_id ON "Visits"(user_id);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_date ON "Visits"(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_visits_status ON "Visits"(status);
