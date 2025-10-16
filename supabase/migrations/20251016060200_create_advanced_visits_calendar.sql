/*
  # Sistema Avançado de Visitas e Calendário

  1. Novas Tabelas
    - `visit_confirmations` - Confirmações automáticas de visitas
    - `visit_feedback_forms` - Formulários de feedback estruturado
    - `visit_routes` - Rotas otimizadas para múltiplas visitas
    - `visit_checkin_checkout` - Check-in e check-out com geolocalização
    - `calendar_integrations` - Integração com Google Calendar
    - `calendar_sync_log` - Log de sincronização de calendário
    - `visit_no_shows` - Registro de faltas e penalidades

  2. Melhorias em Visits
    - Adicionar campos de confirmação automática
    - Adicionar campos de performance
    - Adicionar campos de integração externa

  3. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para autenticados
*/

-- Visit Confirmations (Confirmações Automáticas)
CREATE TABLE IF NOT EXISTS visit_confirmations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  confirmation_type text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  sent_at timestamptz,
  delivery_status text DEFAULT 'pending',
  response_status text,
  response_at timestamptz,
  channel text NOT NULL,
  message_content text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visit_confirmations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage visit confirmations"
  ON visit_confirmations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Visit Feedback Forms (Formulários de Feedback)
CREATE TABLE IF NOT EXISTS visit_feedback_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  submitted_by uuid,
  interest_level integer CHECK (interest_level BETWEEN 1 AND 5),
  price_perception text,
  location_rating integer CHECK (location_rating BETWEEN 1 AND 5),
  condition_rating integer CHECK (condition_rating BETWEEN 1 AND 5),
  liked_features jsonb DEFAULT '[]',
  concerns jsonb DEFAULT '[]',
  comparison_comments text,
  next_steps text,
  will_make_offer boolean,
  estimated_offer_value decimal(12, 2),
  decision_timeline text,
  additional_notes text,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visit_feedback_forms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage feedback forms"
  ON visit_feedback_forms FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Visit Routes (Rotas Otimizadas)
CREATE TABLE IF NOT EXISTS visit_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  date date NOT NULL,
  assigned_to uuid,
  visit_ids jsonb DEFAULT '[]',
  optimized_order jsonb DEFAULT '[]',
  total_distance decimal(10, 2),
  estimated_duration integer,
  start_location jsonb,
  end_location jsonb,
  status text DEFAULT 'planned',
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE visit_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage visit routes"
  ON visit_routes FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Visit Check-in/Check-out
CREATE TABLE IF NOT EXISTS visit_checkin_checkout (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  check_type text NOT NULL,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  location_accuracy decimal(10, 2),
  device_info jsonb DEFAULT '{}',
  timestamp timestamptz DEFAULT now(),
  notes text,
  photos jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visit_checkin_checkout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage checkin checkout"
  ON visit_checkin_checkout FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Calendar Integrations
CREATE TABLE IF NOT EXISTS calendar_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  provider_account_id text NOT NULL,
  access_token text,
  refresh_token text,
  token_expires_at timestamptz,
  calendar_id text,
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT true,
  last_sync_at timestamptz,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, provider)
);

ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own calendar integrations"
  ON calendar_integrations FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text)
  WITH CHECK (auth.uid()::text = user_id::text);

-- Calendar Sync Log
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id uuid NOT NULL REFERENCES calendar_integrations(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  visit_id uuid REFERENCES visits(id),
  external_event_id text,
  status text DEFAULT 'success',
  error_message text,
  synced_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync logs"
  ON calendar_sync_log FOR SELECT
  TO authenticated
  USING (
    integration_id IN (
      SELECT id FROM calendar_integrations WHERE user_id::text = auth.uid()::text
    )
  );

-- Visit No-Shows (Faltas)
CREATE TABLE IF NOT EXISTS visit_no_shows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES leads(id),
  contact_id integer,
  no_show_reason text,
  penalty_applied boolean DEFAULT false,
  penalty_type text,
  penalty_details jsonb DEFAULT '{}',
  follow_up_scheduled boolean DEFAULT false,
  notes text,
  recorded_by uuid,
  recorded_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE visit_no_shows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage no-shows"
  ON visit_no_shows FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Adicionar campos em visits (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'confirmation_status'
  ) THEN
    ALTER TABLE visits ADD COLUMN confirmation_status text DEFAULT 'not_sent';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'confirmed_at'
  ) THEN
    ALTER TABLE visits ADD COLUMN confirmed_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'reminder_sent'
  ) THEN
    ALTER TABLE visits ADD COLUMN reminder_sent boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'external_calendar_id'
  ) THEN
    ALTER TABLE visits ADD COLUMN external_calendar_id text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'duration_minutes'
  ) THEN
    ALTER TABLE visits ADD COLUMN duration_minutes integer DEFAULT 60;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'check_in_at'
  ) THEN
    ALTER TABLE visits ADD COLUMN check_in_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'visits' AND column_name = 'check_out_at'
  ) THEN
    ALTER TABLE visits ADD COLUMN check_out_at timestamptz;
  END IF;
END $$;

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_visit ON visit_confirmations(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_scheduled ON visit_confirmations(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_visit_confirmations_status ON visit_confirmations(delivery_status);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_forms_visit ON visit_feedback_forms(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_feedback_forms_interest ON visit_feedback_forms(interest_level);
CREATE INDEX IF NOT EXISTS idx_visit_routes_date ON visit_routes(date);
CREATE INDEX IF NOT EXISTS idx_visit_routes_assigned ON visit_routes(assigned_to);
CREATE INDEX IF NOT EXISTS idx_visit_routes_status ON visit_routes(status);
CREATE INDEX IF NOT EXISTS idx_visit_checkin_checkout_visit ON visit_checkin_checkout(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_checkin_checkout_user ON visit_checkin_checkout(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_active ON calendar_integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_calendar_sync_log_integration ON calendar_sync_log(integration_id);
CREATE INDEX IF NOT EXISTS idx_visit_no_shows_visit ON visit_no_shows(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_no_shows_lead ON visit_no_shows(lead_id);
CREATE INDEX IF NOT EXISTS idx_visits_confirmation_status ON visits(confirmation_status);
CREATE INDEX IF NOT EXISTS idx_visits_scheduled_date ON visits(scheduled_date);
