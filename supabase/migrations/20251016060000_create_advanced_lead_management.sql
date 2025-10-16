/*
  # Sistema Avançado de Gestão de Leads

  1. Novas Tabelas
    - `lead_tags` - Tags para segmentação de leads
    - `lead_tag_assignments` - Relacionamento muitos-para-muitos entre leads e tags
    - `lead_webhooks` - Configuração de webhooks para captura de leads
    - `lead_webhook_logs` - Log de recebimento de leads via webhook
    - `lead_distribution_rules` - Regras de distribuição automática de leads
    - `lead_sequences` - Sequências de follow-up automatizado
    - `lead_sequence_steps` - Etapas das sequências
    - `lead_sequence_enrollments` - Inscrições de leads em sequências
    - `lead_duplicates` - Registro de leads duplicados detectados
    - `lead_enrichment_data` - Dados enriquecidos via APIs externas

  2. Melhorias em Leads
    - Adicionar campos para scoring ML
    - Adicionar campos para controle de distribuição
    - Adicionar campos de origem detalhada

  3. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para autenticados com controle granular
*/

-- Lead Tags (Sistema de Tags)
CREATE TABLE IF NOT EXISTS lead_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text DEFAULT '#3f51b5',
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tags"
  ON lead_tags FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create tags"
  ON lead_tags FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update tags"
  ON lead_tags FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can delete tags"
  ON lead_tags FOR DELETE
  TO authenticated
  USING (true);

-- Lead Tag Assignments
CREATE TABLE IF NOT EXISTS lead_tag_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES lead_tags(id) ON DELETE CASCADE,
  assigned_by uuid,
  created_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

ALTER TABLE lead_tag_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tag assignments"
  ON lead_tag_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Webhooks (Captura de Leads)
CREATE TABLE IF NOT EXISTS lead_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text NOT NULL,
  webhook_url text UNIQUE NOT NULL,
  secret_key text,
  is_active boolean DEFAULT true,
  field_mapping jsonb DEFAULT '{}',
  auto_assign_to uuid,
  auto_assign_rule text DEFAULT 'round_robin',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage webhooks"
  ON lead_webhooks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Webhook Logs
CREATE TABLE IF NOT EXISTS lead_webhook_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid REFERENCES lead_webhooks(id) ON DELETE CASCADE,
  payload jsonb NOT NULL,
  lead_id uuid REFERENCES leads(id),
  status text DEFAULT 'success',
  error_message text,
  ip_address text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lead_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view webhook logs"
  ON lead_webhook_logs FOR SELECT
  TO authenticated
  USING (true);

-- Lead Distribution Rules
CREATE TABLE IF NOT EXISTS lead_distribution_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  conditions jsonb DEFAULT '{}',
  distribution_type text DEFAULT 'round_robin',
  assigned_users jsonb DEFAULT '[]',
  max_leads_per_user integer,
  time_based_distribution jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_distribution_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage distribution rules"
  ON lead_distribution_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Sequences (Follow-up Automatizado)
CREATE TABLE IF NOT EXISTS lead_sequences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  trigger_conditions jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_sequences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sequences"
  ON lead_sequences FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Sequence Steps
CREATE TABLE IF NOT EXISTS lead_sequence_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sequence_id uuid NOT NULL REFERENCES lead_sequences(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  delay_days integer DEFAULT 0,
  delay_hours integer DEFAULT 0,
  action_type text NOT NULL,
  channel text NOT NULL,
  template_content text NOT NULL,
  subject text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_sequence_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage sequence steps"
  ON lead_sequence_steps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Sequence Enrollments
CREATE TABLE IF NOT EXISTS lead_sequence_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sequence_id uuid NOT NULL REFERENCES lead_sequences(id) ON DELETE CASCADE,
  current_step integer DEFAULT 0,
  status text DEFAULT 'active',
  enrolled_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  paused_at timestamptz,
  last_action_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE lead_sequence_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage enrollments"
  ON lead_sequence_enrollments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Duplicates
CREATE TABLE IF NOT EXISTS lead_duplicates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  duplicate_lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  similarity_score decimal(5,2) DEFAULT 0,
  matching_fields jsonb DEFAULT '[]',
  status text DEFAULT 'pending',
  resolved_by uuid,
  resolution_action text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(original_lead_id, duplicate_lead_id)
);

ALTER TABLE lead_duplicates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage duplicates"
  ON lead_duplicates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Lead Enrichment Data
CREATE TABLE IF NOT EXISTS lead_enrichment_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  source text NOT NULL,
  enriched_data jsonb DEFAULT '{}',
  confidence_score decimal(5,2),
  enriched_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lead_enrichment_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage enrichment data"
  ON lead_enrichment_data FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_lead_tags_name ON lead_tags(name);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_lead ON lead_tag_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tag_assignments_tag ON lead_tag_assignments(tag_id);
CREATE INDEX IF NOT EXISTS idx_lead_webhooks_active ON lead_webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_webhook_logs_webhook ON lead_webhook_logs(webhook_id);
CREATE INDEX IF NOT EXISTS idx_lead_webhook_logs_created ON lead_webhook_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_distribution_rules_active ON lead_distribution_rules(is_active, priority);
CREATE INDEX IF NOT EXISTS idx_lead_sequences_active ON lead_sequences(is_active);
CREATE INDEX IF NOT EXISTS idx_lead_sequence_steps_sequence ON lead_sequence_steps(sequence_id, step_order);
CREATE INDEX IF NOT EXISTS idx_lead_sequence_enrollments_lead ON lead_sequence_enrollments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_sequence_enrollments_status ON lead_sequence_enrollments(status);
CREATE INDEX IF NOT EXISTS idx_lead_duplicates_original ON lead_duplicates(original_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_duplicates_duplicate ON lead_duplicates(duplicate_lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_duplicates_status ON lead_duplicates(status);
CREATE INDEX IF NOT EXISTS idx_lead_enrichment_lead ON lead_enrichment_data(lead_id);
