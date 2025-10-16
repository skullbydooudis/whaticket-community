/*
  # Create Proposals Management System

  1. New Tables
    - `Proposals`
      - `id` (uuid, primary key)
      - `proposal_number` (text, unique) - Unique proposal identifier
      - `lead_id` (uuid) - Link to lead
      - `property_id` (uuid) - Link to property
      - `contact_id` (integer) - Link to contact
      - `type` (text) - sale, rent
      - `proposed_value` (numeric) - Proposed value
      - `payment_method` (text) - cash, financing, mixed
      - `down_payment` (numeric) - Down payment amount
      - `installments` (integer) - Number of installments
      - `status` (text) - draft, sent, viewed, negotiating, accepted, rejected, cancelled
      - `valid_until` (date) - Proposal expiration date
      - `notes` (text) - Internal notes
      - `terms_conditions` (text) - Terms and conditions
      - `sent_at` (timestamptz) - When proposal was sent
      - `viewed_at` (timestamptz) - When proposal was viewed
      - `responded_at` (timestamptz) - When client responded
      - `created_by` (integer) - User who created
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `Proposals` table
    - Policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS "Proposals" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_number text UNIQUE NOT NULL,
  lead_id uuid REFERENCES "Leads"(id) ON DELETE SET NULL,
  property_id uuid REFERENCES "Properties"(id) ON DELETE CASCADE,
  contact_id integer,
  type text DEFAULT 'sale',
  proposed_value numeric(12, 2) NOT NULL,
  payment_method text DEFAULT 'cash',
  down_payment numeric(12, 2),
  installments integer,
  status text DEFAULT 'draft',
  valid_until date,
  notes text,
  terms_conditions text,
  sent_at timestamptz,
  viewed_at timestamptz,
  responded_at timestamptz,
  created_by integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE "Proposals" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view proposals"
  ON "Proposals"
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create proposals"
  ON "Proposals"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update proposals"
  ON "Proposals"
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete proposals"
  ON "Proposals"
  FOR DELETE
  TO authenticated
  USING (true);

CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON "Proposals"(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_property_id ON "Proposals"(property_id);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON "Proposals"(status);
CREATE INDEX IF NOT EXISTS idx_proposals_created_by ON "Proposals"(created_by);
CREATE INDEX IF NOT EXISTS idx_proposals_number ON "Proposals"(proposal_number);
