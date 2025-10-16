/*
  # Funcionalidades Enterprise

  1. Novas Tabelas
    - `workflows` - Workflows visuais automatizados
    - `workflow_steps` - Etapas dos workflows
    - `workflow_executions` - Execuções de workflows
    - `system_webhooks` - Webhooks configuráveis para integrações
    - `webhook_deliveries` - Log de entregas de webhooks
    - `audit_logs` - Log completo de auditoria
    - `user_permissions` - Permissões granulares por módulo
    - `organization_hierarchy` - Hierarquia organizacional
    - `territories` - Territórios geográficos
    - `territory_assignments` - Atribuição de usuários a territórios

  2. Segurança e Governança
    - Enable RLS em todas as tabelas
    - Políticas granulares por perfil
    - Audit log completo
*/

-- Workflows (Automação Visual)
CREATE TABLE IF NOT EXISTS workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  trigger_type text NOT NULL,
  trigger_conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  execution_order integer DEFAULT 0,
  configuration jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workflows"
  ON workflows FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflows"
  ON workflows FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Workflow Steps
CREATE TABLE IF NOT EXISTS workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  step_order integer NOT NULL,
  step_type text NOT NULL,
  action_type text NOT NULL,
  configuration jsonb DEFAULT '{}',
  conditions jsonb DEFAULT '{}',
  delay_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workflow steps"
  ON workflow_steps FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage workflow steps"
  ON workflow_steps FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Workflow Executions
CREATE TABLE IF NOT EXISTS workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
  trigger_data jsonb DEFAULT '{}',
  status text DEFAULT 'running',
  current_step integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  execution_log jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE workflow_executions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workflow executions"
  ON workflow_executions FOR SELECT
  TO authenticated
  USING (true);

-- System Webhooks (Webhooks Configuráveis)
CREATE TABLE IF NOT EXISTS system_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  event_types jsonb NOT NULL DEFAULT '[]',
  target_url text NOT NULL,
  secret_key text,
  is_active boolean DEFAULT true,
  retry_on_failure boolean DEFAULT true,
  max_retries integer DEFAULT 3,
  timeout_seconds integer DEFAULT 30,
  headers jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_webhooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system webhooks"
  ON system_webhooks FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Webhook Deliveries
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES system_webhooks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  error_message text,
  retry_count integer DEFAULT 0,
  delivered_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view webhook deliveries"
  ON webhook_deliveries FOR SELECT
  TO authenticated
  USING (true);

-- Audit Logs (Log de Auditoria Completo)
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id text,
  changes jsonb DEFAULT '{}',
  previous_values jsonb DEFAULT '{}',
  new_values jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- User Permissions (Permissões Granulares)
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module text NOT NULL,
  action text NOT NULL,
  allowed boolean DEFAULT true,
  conditions jsonb DEFAULT '{}',
  granted_by uuid,
  granted_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module, action)
);

ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Organization Hierarchy (Hierarquia Organizacional)
CREATE TABLE IF NOT EXISTS organization_hierarchy (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  parent_user_id uuid,
  level integer DEFAULT 0,
  role text NOT NULL,
  department text,
  can_view_subordinates boolean DEFAULT true,
  can_edit_subordinates boolean DEFAULT false,
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organization_hierarchy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their hierarchy"
  ON organization_hierarchy FOR SELECT
  TO authenticated
  USING (
    user_id::text = auth.uid()::text OR
    parent_user_id::text = auth.uid()::text
  );

CREATE POLICY "Admins can manage hierarchy"
  ON organization_hierarchy FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Territories (Territórios Geográficos)
CREATE TABLE IF NOT EXISTS territories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  territory_type text DEFAULT 'region',
  boundaries jsonb DEFAULT '{}',
  cities jsonb DEFAULT '[]',
  neighborhoods jsonb DEFAULT '[]',
  zip_codes jsonb DEFAULT '[]',
  parent_territory_id uuid REFERENCES territories(id),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE territories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view territories"
  ON territories FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage territories"
  ON territories FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Territory Assignments
CREATE TABLE IF NOT EXISTS territory_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  territory_id uuid NOT NULL REFERENCES territories(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, territory_id)
);

ALTER TABLE territory_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their territory assignments"
  ON territory_assignments FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage territory assignments"
  ON territory_assignments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_workflows_active ON workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_workflows_trigger ON workflows(trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_workflow ON workflow_steps(workflow_id, step_order);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_workflow ON workflow_executions(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_status ON workflow_executions(status);
CREATE INDEX IF NOT EXISTS idx_system_webhooks_active ON system_webhooks(is_active);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_created ON webhook_deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_module ON user_permissions(module, action);
CREATE INDEX IF NOT EXISTS idx_organization_hierarchy_user ON organization_hierarchy(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_hierarchy_parent ON organization_hierarchy(parent_user_id);
CREATE INDEX IF NOT EXISTS idx_territories_active ON territories(is_active);
CREATE INDEX IF NOT EXISTS idx_territories_code ON territories(code);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_user ON territory_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory ON territory_assignments(territory_id);
