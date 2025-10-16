/*
  # Sistema Avançado de Propostas e Negociações

  1. Novas Tabelas
    - `proposal_templates` - Templates de propostas customizáveis
    - `proposal_versions` - Versionamento de propostas
    - `proposal_approvals` - Workflow de aprovação multinível
    - `proposal_signatures` - Assinatura digital
    - `proposal_tracking` - Rastreamento de abertura e leitura
    - `proposal_negotiations` - Chat de negociação
    - `proposal_documents` - Documentos anexados
    - `financial_simulations` - Simulações financeiras
    - `contract_templates` - Templates de contratos

  2. Melhorias em Proposals
    - Adicionar campos de rastreamento avançado
    - Adicionar campos de aprovação
    - Adicionar campos de assinatura digital

  3. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para autenticados e acesso público limitado
*/

-- Proposal Templates
CREATE TABLE IF NOT EXISTS proposal_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  template_type text NOT NULL,
  content_html text NOT NULL,
  variables jsonb DEFAULT '[]',
  css_styles text,
  is_active boolean DEFAULT true,
  is_default boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage proposal templates"
  ON proposal_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Proposal Versions (Versionamento)
CREATE TABLE IF NOT EXISTS proposal_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  changes jsonb NOT NULL,
  previous_data jsonb DEFAULT '{}',
  reason text,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proposal_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view proposal versions"
  ON proposal_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create proposal versions"
  ON proposal_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Proposal Approvals (Workflow de Aprovação)
CREATE TABLE IF NOT EXISTS proposal_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  approval_level integer NOT NULL,
  approver_id uuid NOT NULL,
  status text DEFAULT 'pending',
  approved_at timestamptz,
  rejected_at timestamptz,
  comments text,
  required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE proposal_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view approvals"
  ON proposal_approvals FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Approvers can update their approvals"
  ON proposal_approvals FOR UPDATE
  TO authenticated
  USING (approver_id::text = auth.uid()::text)
  WITH CHECK (approver_id::text = auth.uid()::text);

-- Proposal Signatures (Assinatura Digital)
CREATE TABLE IF NOT EXISTS proposal_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  signer_role text NOT NULL,
  signer_name text NOT NULL,
  signer_email text NOT NULL,
  signer_cpf text,
  signature_data text,
  signature_method text,
  ip_address text,
  device_info jsonb DEFAULT '{}',
  certificate_data jsonb DEFAULT '{}',
  signed_at timestamptz,
  is_valid boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proposal_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view signatures"
  ON proposal_signatures FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can create signatures"
  ON proposal_signatures FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Proposal Tracking (Rastreamento)
CREATE TABLE IF NOT EXISTS proposal_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  ip_address text,
  user_agent text,
  device_type text,
  location jsonb DEFAULT '{}',
  time_spent_seconds integer,
  page_views integer DEFAULT 1,
  timestamp timestamptz DEFAULT now(),
  metadata jsonb DEFAULT '{}'
);

ALTER TABLE proposal_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view tracking"
  ON proposal_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can create tracking events"
  ON proposal_tracking FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Proposal Negotiations (Chat de Negociação)
CREATE TABLE IF NOT EXISTS proposal_negotiations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  sender_type text NOT NULL,
  sender_id uuid,
  message text NOT NULL,
  message_type text DEFAULT 'text',
  attachments jsonb DEFAULT '[]',
  is_counter_offer boolean DEFAULT false,
  counter_offer_value decimal(12, 2),
  counter_offer_terms jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proposal_negotiations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage negotiations"
  ON proposal_negotiations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Proposal Documents (Documentos Anexados)
CREATE TABLE IF NOT EXISTS proposal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_name text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  is_required boolean DEFAULT false,
  is_validated boolean DEFAULT false,
  validated_by uuid,
  validated_at timestamptz,
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE proposal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage proposal documents"
  ON proposal_documents FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Financial Simulations (Simulações Financeiras)
CREATE TABLE IF NOT EXISTS financial_simulations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  property_value decimal(12, 2) NOT NULL,
  financing_amount decimal(12, 2) NOT NULL,
  down_payment decimal(12, 2) NOT NULL,
  interest_rate decimal(5, 4) NOT NULL,
  term_months integer NOT NULL,
  monthly_payment decimal(12, 2),
  total_interest decimal(12, 2),
  total_amount decimal(12, 2),
  bank_name text,
  simulation_type text DEFAULT 'sac',
  additional_costs jsonb DEFAULT '{}',
  amortization_table jsonb DEFAULT '[]',
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE financial_simulations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage simulations"
  ON financial_simulations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contract Templates
CREATE TABLE IF NOT EXISTS contract_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  contract_type text NOT NULL,
  template_content text NOT NULL,
  variables jsonb DEFAULT '[]',
  legal_requirements jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  version text DEFAULT '1.0',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage contract templates"
  ON contract_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Adicionar campos em proposals (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'template_id'
  ) THEN
    ALTER TABLE proposals ADD COLUMN template_id uuid REFERENCES proposal_templates(id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'version'
  ) THEN
    ALTER TABLE proposals ADD COLUMN version integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'approval_status'
  ) THEN
    ALTER TABLE proposals ADD COLUMN approval_status text DEFAULT 'not_required';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'signature_status'
  ) THEN
    ALTER TABLE proposals ADD COLUMN signature_status text DEFAULT 'not_signed';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'times_viewed'
  ) THEN
    ALTER TABLE proposals ADD COLUMN times_viewed integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'total_time_viewed'
  ) THEN
    ALTER TABLE proposals ADD COLUMN total_time_viewed integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'public_access_token'
  ) THEN
    ALTER TABLE proposals ADD COLUMN public_access_token text UNIQUE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'proposals' AND column_name = 'expires_at'
  ) THEN
    ALTER TABLE proposals ADD COLUMN expires_at timestamptz;
  END IF;
END $$;

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_proposal_templates_active ON proposal_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_proposal_versions_proposal ON proposal_versions(proposal_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_approvals_proposal ON proposal_approvals(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_approvals_approver ON proposal_approvals(approver_id);
CREATE INDEX IF NOT EXISTS idx_proposal_approvals_status ON proposal_approvals(status);
CREATE INDEX IF NOT EXISTS idx_proposal_signatures_proposal ON proposal_signatures(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_tracking_proposal ON proposal_tracking(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposal_tracking_event ON proposal_tracking(event_type, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_negotiations_proposal ON proposal_negotiations(proposal_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proposal_documents_proposal ON proposal_documents(proposal_id);
CREATE INDEX IF NOT EXISTS idx_financial_simulations_proposal ON financial_simulations(proposal_id);
CREATE INDEX IF NOT EXISTS idx_financial_simulations_lead ON financial_simulations(lead_id);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_proposals_template ON proposals(template_id);
CREATE INDEX IF NOT EXISTS idx_proposals_approval_status ON proposals(approval_status);
CREATE INDEX IF NOT EXISTS idx_proposals_signature_status ON proposals(signature_status);
CREATE INDEX IF NOT EXISTS idx_proposals_access_token ON proposals(public_access_token);
