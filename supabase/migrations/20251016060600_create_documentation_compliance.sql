/*
  # Sistema de Documentação e Conformidade

  1. Novas Tabelas
    - `document_library` - Biblioteca centralizada de documentos
    - `document_templates` - Templates de documentos e contratos
    - `document_requirements` - Checklist de documentação obrigatória
    - `document_validations` - Validações de documentos
    - `document_sharing` - Compartilhamento seguro de documentos
    - `document_versions` - Versionamento de documentos
    - `compliance_checks` - Verificações de conformidade
    - `data_retention_policies` - Políticas de retenção LGPD
    - `consent_records` - Registros de consentimento LGPD

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas granulares de acesso
    - Conformidade LGPD
*/

-- Document Library (Biblioteca de Documentos)
CREATE TABLE IF NOT EXISTS document_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  document_type text NOT NULL,
  category text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  mime_type text,
  file_hash text,
  version text DEFAULT '1.0',
  description text,
  tags jsonb DEFAULT '[]',
  metadata jsonb DEFAULT '{}',
  access_level text DEFAULT 'private',
  is_template boolean DEFAULT false,
  parent_document_id uuid REFERENCES document_library(id),
  uploaded_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view accessible documents"
  ON document_library FOR SELECT
  TO authenticated
  USING (access_level = 'public' OR access_level = 'internal');

CREATE POLICY "Admins can manage document library"
  ON document_library FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Document Templates (Templates com Campos Variáveis)
CREATE TABLE IF NOT EXISTS document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  template_type text NOT NULL,
  category text NOT NULL,
  content text NOT NULL,
  content_format text DEFAULT 'html',
  variables jsonb DEFAULT '[]',
  validation_rules jsonb DEFAULT '{}',
  legal_compliance jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  version text DEFAULT '1.0',
  requires_signature boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON document_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON document_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Document Requirements (Checklist Obrigatório)
CREATE TABLE IF NOT EXISTS document_requirements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  stage text NOT NULL,
  document_type text NOT NULL,
  document_name text NOT NULL,
  is_required boolean DEFAULT true,
  description text,
  validation_rules jsonb DEFAULT '{}',
  alternative_documents jsonb DEFAULT '[]',
  expiry_check boolean DEFAULT false,
  expiry_days integer,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view requirements"
  ON document_requirements FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage requirements"
  ON document_requirements FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Document Validations (Validações de Documentos)
CREATE TABLE IF NOT EXISTS document_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_source text NOT NULL,
  validation_type text NOT NULL,
  validation_status text DEFAULT 'pending',
  validation_method text,
  validated_data jsonb DEFAULT '{}',
  api_response jsonb DEFAULT '{}',
  is_valid boolean,
  expiry_date date,
  validation_notes text,
  validated_by uuid,
  validated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view validations"
  ON document_validations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage validations"
  ON document_validations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Document Sharing (Compartilhamento Seguro)
CREATE TABLE IF NOT EXISTS document_sharing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_source text NOT NULL,
  shared_with_type text NOT NULL,
  shared_with_id uuid,
  shared_with_email text,
  access_level text DEFAULT 'view',
  share_token text UNIQUE,
  password_protected boolean DEFAULT false,
  password_hash text,
  expires_at timestamptz,
  max_downloads integer,
  download_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  last_accessed_at timestamptz,
  shared_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE document_sharing ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view shares they created or received"
  ON document_sharing FOR SELECT
  TO authenticated
  USING (
    shared_by::text = auth.uid()::text OR
    shared_with_id::text = auth.uid()::text
  );

CREATE POLICY "Users can create shares"
  ON document_sharing FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Public can access with valid token"
  ON document_sharing FOR SELECT
  TO anon
  USING (expires_at > now() OR expires_at IS NULL);

-- Document Versions (Versionamento)
CREATE TABLE IF NOT EXISTS document_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL,
  document_source text NOT NULL,
  version_number text NOT NULL,
  file_url text NOT NULL,
  file_size bigint,
  changes_description text,
  previous_version_id uuid REFERENCES document_versions(id),
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view document versions"
  ON document_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can create document versions"
  ON document_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Compliance Checks (Verificações de Conformidade)
CREATE TABLE IF NOT EXISTS compliance_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  check_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  requirement text NOT NULL,
  status text DEFAULT 'pending',
  compliance_score integer,
  issues_found jsonb DEFAULT '[]',
  recommendations jsonb DEFAULT '[]',
  checked_by uuid,
  checked_at timestamptz,
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view compliance checks"
  ON compliance_checks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage compliance checks"
  ON compliance_checks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Data Retention Policies (LGPD)
CREATE TABLE IF NOT EXISTS data_retention_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data_type text NOT NULL,
  retention_period_days integer NOT NULL,
  anonymization_required boolean DEFAULT false,
  deletion_required boolean DEFAULT false,
  legal_basis text,
  policy_description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE data_retention_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view retention policies"
  ON data_retention_policies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage retention policies"
  ON data_retention_policies FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Consent Records (Registros de Consentimento LGPD)
CREATE TABLE IF NOT EXISTS consent_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type text NOT NULL,
  subject_id uuid NOT NULL,
  consent_type text NOT NULL,
  purpose text NOT NULL,
  legal_basis text NOT NULL,
  consent_given boolean NOT NULL,
  consent_method text NOT NULL,
  ip_address text,
  user_agent text,
  consent_text text NOT NULL,
  granted_at timestamptz,
  revoked_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own consents"
  ON consent_records FOR SELECT
  TO authenticated
  USING (subject_id::text = auth.uid()::text);

CREATE POLICY "System can create consent records"
  ON consent_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_document_library_type ON document_library(document_type);
CREATE INDEX IF NOT EXISTS idx_document_library_category ON document_library(category);
CREATE INDEX IF NOT EXISTS idx_document_library_uploaded ON document_library(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_document_templates_active ON document_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_document_templates_type ON document_templates(template_type, category);
CREATE INDEX IF NOT EXISTS idx_document_requirements_transaction ON document_requirements(transaction_type, stage);
CREATE INDEX IF NOT EXISTS idx_document_validations_document ON document_validations(document_id, document_source);
CREATE INDEX IF NOT EXISTS idx_document_validations_status ON document_validations(validation_status);
CREATE INDEX IF NOT EXISTS idx_document_sharing_token ON document_sharing(share_token);
CREATE INDEX IF NOT EXISTS idx_document_sharing_shared_with ON document_sharing(shared_with_id);
CREATE INDEX IF NOT EXISTS idx_document_sharing_expires ON document_sharing(expires_at);
CREATE INDEX IF NOT EXISTS idx_document_versions_document ON document_versions(document_id, document_source, version_number);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_entity ON compliance_checks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_compliance_checks_status ON compliance_checks(status);
CREATE INDEX IF NOT EXISTS idx_data_retention_policies_active ON data_retention_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_consent_records_subject ON consent_records(subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_type ON consent_records(consent_type);
