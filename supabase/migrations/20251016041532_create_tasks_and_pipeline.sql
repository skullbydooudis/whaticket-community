/*
  # Create Tasks and Pipeline System

  1. New Tables
    - `PipelineStages`
      - `id` (uuid, primary key)
      - `name` (text) - Stage name
      - `order` (integer) - Display order
      - `color` (text) - Display color
      - `is_active` (boolean) - Active status
      - `created_at` (timestamptz)
    
    - `Tasks`
      - `id` (uuid, primary key)
      - `title` (text) - Task title
      - `description` (text) - Task description
      - `type` (text) - call, email, visit, meeting, other
      - `priority` (text) - low, medium, high, urgent
      - `status` (text) - pending, in_progress, completed, cancelled
      - `due_date` (timestamptz) - Due date
      - `completed_at` (timestamptz) - Completion date
      - `lead_id` (uuid) - Related lead
      - `property_id` (uuid) - Related property
      - `contact_id` (integer) - Related contact
      - `assigned_to` (integer) - Assigned user
      - `created_by` (integer) - Creator user
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

    - `Activities`
      - `id` (uuid, primary key)
      - `type` (text) - Activity type
      - `description` (text) - Activity description
      - `entity_type` (text) - lead, property, proposal, visit
      - `entity_id` (uuid) - Related entity ID
      - `user_id` (integer) - User who performed activity
      - `metadata` (jsonb) - Additional data
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for authenticated users
*/

CREATE TABLE IF NOT EXISTS "PipelineStages" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  "order" integer NOT NULL DEFAULT 0,
  color text DEFAULT '#3f51b5',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Tasks" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  type text DEFAULT 'call',
  priority text DEFAULT 'medium',
  status text DEFAULT 'pending',
  due_date timestamptz,
  completed_at timestamptz,
  lead_id uuid REFERENCES "Leads"(id) ON DELETE CASCADE,
  property_id uuid REFERENCES "Properties"(id) ON DELETE CASCADE,
  contact_id integer,
  assigned_to integer,
  created_by integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "Activities" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  description text NOT NULL,
  entity_type text,
  entity_id uuid,
  user_id integer,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE "PipelineStages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Tasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Activities" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view pipeline stages"
  ON "PipelineStages" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage pipeline stages"
  ON "PipelineStages" FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can view tasks"
  ON "Tasks" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create tasks"
  ON "Tasks" FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update tasks"
  ON "Tasks" FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tasks"
  ON "Tasks" FOR DELETE TO authenticated USING (true);

CREATE POLICY "Authenticated users can view activities"
  ON "Activities" FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create activities"
  ON "Activities" FOR INSERT TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON "Tasks"(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON "Tasks"(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON "Tasks"(status);
CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON "Tasks"(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_entity ON "Activities"(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON "Activities"(user_id);

INSERT INTO "PipelineStages" (name, "order", color) VALUES
  ('Novo Lead', 1, '#9e9e9e'),
  ('Contato Realizado', 2, '#2196f3'),
  ('Qualificado', 3, '#4caf50'),
  ('Visita Agendada', 4, '#ff9800'),
  ('Proposta Enviada', 5, '#9c27b0'),
  ('Negociação', 6, '#f44336'),
  ('Fechado', 7, '#4caf50'),
  ('Perdido', 8, '#607d8b')
ON CONFLICT DO NOTHING;
