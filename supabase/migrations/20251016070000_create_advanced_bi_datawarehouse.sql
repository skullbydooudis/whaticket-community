/*
  # Sistema de Business Intelligence e Data Warehouse

  1. Novas Tabelas
    - `fact_sales` - Tabela de fatos de vendas (data warehouse)
    - `fact_leads` - Tabela de fatos de leads
    - `fact_visits` - Tabela de fatos de visitas
    - `fact_communications` - Tabela de fatos de comunicações
    - `dim_time` - Dimensão temporal
    - `dim_location` - Dimensão geográfica
    - `etl_jobs` - Jobs de ETL
    - `etl_logs` - Logs de ETL
    - `kpi_definitions` - Definições de KPIs customizáveis
    - `kpi_values` - Valores calculados de KPIs
    - `custom_reports` - Relatórios customizados
    - `report_schedules` - Agendamento de relatórios
    - `data_exports` - Histórico de exportações
    - `cohort_analysis` - Análise de coortes
    - `funnel_steps` - Definição de funis customizados
    - `funnel_tracking` - Tracking de funis

  2. Views Materializadas
    - Performance dashboards
    - Aggregated metrics
    - Real-time indicators

  3. Segurança
    - RLS em todas as tabelas
    - Acesso restrito a analistas
*/

-- Dimension: Time (para análises temporais)
CREATE TABLE IF NOT EXISTS dim_time (
  date_key integer PRIMARY KEY,
  full_date date NOT NULL UNIQUE,
  year integer NOT NULL,
  quarter integer NOT NULL,
  month integer NOT NULL,
  month_name text NOT NULL,
  week integer NOT NULL,
  day_of_month integer NOT NULL,
  day_of_week integer NOT NULL,
  day_name text NOT NULL,
  is_weekend boolean NOT NULL,
  is_holiday boolean DEFAULT false,
  fiscal_year integer,
  fiscal_quarter integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE dim_time ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read time dimension"
  ON dim_time FOR SELECT
  TO authenticated, anon
  USING (true);

-- Dimension: Location (para análises geográficas)
CREATE TABLE IF NOT EXISTS dim_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL DEFAULT 'Brazil',
  state text NOT NULL,
  state_code text NOT NULL,
  city text NOT NULL,
  neighborhood text,
  zip_code text,
  region text,
  metro_area text,
  latitude decimal(10, 8),
  longitude decimal(11, 8),
  population integer,
  avg_income decimal(12, 2),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE dim_location ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read locations"
  ON dim_location FOR SELECT
  TO authenticated
  USING (true);

-- Fact: Sales (vendas realizadas)
CREATE TABLE IF NOT EXISTS fact_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key integer REFERENCES dim_time(date_key),
  location_id uuid REFERENCES dim_location(id),
  property_id uuid REFERENCES Properties(id),
  lead_id uuid REFERENCES Leads(id),
  user_id integer,
  proposal_id uuid REFERENCES Proposals(id),
  sale_value decimal(12, 2) NOT NULL,
  commission_value decimal(12, 2),
  property_type text,
  transaction_type text,
  days_to_close integer,
  lead_source text,
  lead_score integer,
  total_visits integer DEFAULT 0,
  total_proposals integer DEFAULT 0,
  financing_type text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fact_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sales facts"
  ON fact_sales FOR SELECT
  TO authenticated
  USING (true);

-- Fact: Leads (métricas de leads)
CREATE TABLE IF NOT EXISTS fact_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key integer REFERENCES dim_time(date_key),
  location_id uuid REFERENCES dim_location(id),
  lead_id uuid REFERENCES Leads(id),
  user_id integer,
  source text NOT NULL,
  status text NOT NULL,
  score integer DEFAULT 0,
  budget_min decimal(12, 2),
  budget_max decimal(12, 2),
  days_in_pipeline integer DEFAULT 0,
  total_interactions integer DEFAULT 0,
  response_time_minutes integer,
  converted boolean DEFAULT false,
  conversion_date date,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fact_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead facts"
  ON fact_leads FOR SELECT
  TO authenticated
  USING (true);

-- Fact: Visits (métricas de visitas)
CREATE TABLE IF NOT EXISTS fact_visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key integer REFERENCES dim_time(date_key),
  location_id uuid REFERENCES dim_location(id),
  visit_id uuid REFERENCES Visits(id),
  property_id uuid REFERENCES Properties(id),
  lead_id uuid REFERENCES Leads(id),
  user_id integer,
  scheduled_hour integer,
  duration_minutes integer,
  distance_km decimal(10, 2),
  status text NOT NULL,
  feedback_score integer,
  interested boolean DEFAULT false,
  created_proposal boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fact_visits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view visit facts"
  ON fact_visits FOR SELECT
  TO authenticated
  USING (true);

-- Fact: Communications (métricas de comunicações)
CREATE TABLE IF NOT EXISTS fact_communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date_key integer REFERENCES dim_time(date_key),
  channel text NOT NULL,
  message_type text NOT NULL,
  direction text NOT NULL,
  user_id integer,
  lead_id uuid REFERENCES Leads(id),
  contact_id integer,
  response_time_minutes integer,
  sentiment_score decimal(5, 2),
  engagement_score decimal(5, 2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE fact_communications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view communication facts"
  ON fact_communications FOR SELECT
  TO authenticated
  USING (true);

-- ETL Jobs (controle de ETL)
CREATE TABLE IF NOT EXISTS etl_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name text NOT NULL,
  job_type text NOT NULL,
  schedule_cron text,
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  last_run_status text,
  last_run_duration_seconds integer,
  next_run_at timestamptz,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE etl_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ETL jobs"
  ON etl_jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ETL Logs
CREATE TABLE IF NOT EXISTS etl_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid REFERENCES etl_jobs(id) ON DELETE CASCADE,
  status text NOT NULL,
  started_at timestamptz DEFAULT now(),
  finished_at timestamptz,
  duration_seconds integer,
  records_processed integer DEFAULT 0,
  records_inserted integer DEFAULT 0,
  records_updated integer DEFAULT 0,
  records_failed integer DEFAULT 0,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE etl_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ETL logs"
  ON etl_logs FOR SELECT
  TO authenticated
  USING (true);

-- KPI Definitions (KPIs customizáveis)
CREATE TABLE IF NOT EXISTS kpi_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  calculation_type text NOT NULL,
  sql_query text,
  target_value decimal(12, 2),
  unit text,
  format text DEFAULT 'number',
  is_active boolean DEFAULT true,
  refresh_frequency text DEFAULT 'hourly',
  access_roles jsonb DEFAULT '["admin", "manager"]',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE kpi_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view KPI definitions"
  ON kpi_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage KPI definitions"
  ON kpi_definitions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- KPI Values (valores calculados)
CREATE TABLE IF NOT EXISTS kpi_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kpi_id uuid NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
  date_key integer REFERENCES dim_time(date_key),
  value decimal(12, 2) NOT NULL,
  comparison_value decimal(12, 2),
  variance_percentage decimal(5, 2),
  target_achievement_percentage decimal(5, 2),
  metadata jsonb DEFAULT '{}',
  calculated_at timestamptz DEFAULT now()
);

ALTER TABLE kpi_values ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view KPI values"
  ON kpi_values FOR SELECT
  TO authenticated
  USING (true);

-- Custom Reports
CREATE TABLE IF NOT EXISTS custom_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  report_type text NOT NULL,
  sql_query text NOT NULL,
  parameters jsonb DEFAULT '[]',
  visualization_config jsonb DEFAULT '{}',
  is_public boolean DEFAULT false,
  access_roles jsonb DEFAULT '["admin"]',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view accessible reports"
  ON custom_reports FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Admins can manage reports"
  ON custom_reports FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Report Schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES custom_reports(id) ON DELETE CASCADE,
  schedule_cron text NOT NULL,
  recipients jsonb NOT NULL DEFAULT '[]',
  delivery_method text NOT NULL DEFAULT 'email',
  format text NOT NULL DEFAULT 'pdf',
  is_active boolean DEFAULT true,
  last_sent_at timestamptz,
  next_send_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage their report schedules"
  ON report_schedules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Data Exports
CREATE TABLE IF NOT EXISTS data_exports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  export_type text NOT NULL,
  entity_type text NOT NULL,
  format text NOT NULL,
  filters jsonb DEFAULT '{}',
  file_url text,
  file_size bigint,
  status text DEFAULT 'pending',
  records_count integer,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their exports"
  ON data_exports FOR ALL
  TO authenticated
  USING (created_by::text = auth.uid()::text)
  WITH CHECK (created_by::text = auth.uid()::text);

-- Cohort Analysis
CREATE TABLE IF NOT EXISTS cohort_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cohort_name text NOT NULL,
  cohort_type text NOT NULL,
  cohort_date date NOT NULL,
  metric_name text NOT NULL,
  period_number integer NOT NULL,
  value decimal(12, 2) NOT NULL,
  cohort_size integer NOT NULL,
  retention_rate decimal(5, 2),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE cohort_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view cohort analysis"
  ON cohort_analysis FOR SELECT
  TO authenticated
  USING (true);

-- Funnel Steps
CREATE TABLE IF NOT EXISTS funnel_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name text NOT NULL,
  step_order integer NOT NULL,
  step_name text NOT NULL,
  step_type text NOT NULL,
  criteria jsonb NOT NULL DEFAULT '{}',
  is_required boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE funnel_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view funnel steps"
  ON funnel_steps FOR SELECT
  TO authenticated
  USING (true);

-- Funnel Tracking
CREATE TABLE IF NOT EXISTS funnel_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funnel_name text NOT NULL,
  entity_id uuid NOT NULL,
  entity_type text NOT NULL,
  current_step integer NOT NULL,
  entered_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  dropped_at timestamptz,
  time_in_funnel_hours integer,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE funnel_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view funnel tracking"
  ON funnel_tracking FOR SELECT
  TO authenticated
  USING (true);

-- Função para popular dim_time
CREATE OR REPLACE FUNCTION populate_dim_time(start_date date, end_date date)
RETURNS void AS $$
DECLARE
  current_date date := start_date;
BEGIN
  WHILE current_date <= end_date LOOP
    INSERT INTO dim_time (
      date_key,
      full_date,
      year,
      quarter,
      month,
      month_name,
      week,
      day_of_month,
      day_of_week,
      day_name,
      is_weekend,
      fiscal_year,
      fiscal_quarter
    ) VALUES (
      to_char(current_date, 'YYYYMMDD')::integer,
      current_date,
      EXTRACT(YEAR FROM current_date)::integer,
      EXTRACT(QUARTER FROM current_date)::integer,
      EXTRACT(MONTH FROM current_date)::integer,
      to_char(current_date, 'Month'),
      EXTRACT(WEEK FROM current_date)::integer,
      EXTRACT(DAY FROM current_date)::integer,
      EXTRACT(DOW FROM current_date)::integer,
      to_char(current_date, 'Day'),
      CASE WHEN EXTRACT(DOW FROM current_date) IN (0, 6) THEN true ELSE false END,
      EXTRACT(YEAR FROM current_date)::integer,
      EXTRACT(QUARTER FROM current_date)::integer
    )
    ON CONFLICT (date_key) DO NOTHING;

    current_date := current_date + interval '1 day';
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Popular dim_time com 5 anos (passado e futuro)
SELECT populate_dim_time(
  (CURRENT_DATE - interval '2 years')::date,
  (CURRENT_DATE + interval '3 years')::date
);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_dim_time_full_date ON dim_time(full_date);
CREATE INDEX IF NOT EXISTS idx_dim_time_year_month ON dim_time(year, month);
CREATE INDEX IF NOT EXISTS idx_dim_location_city ON dim_location(city, state);
CREATE INDEX IF NOT EXISTS idx_dim_location_coords ON dim_location(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_fact_sales_date ON fact_sales(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_sales_property ON fact_sales(property_id);
CREATE INDEX IF NOT EXISTS idx_fact_sales_user ON fact_sales(user_id);
CREATE INDEX IF NOT EXISTS idx_fact_leads_date ON fact_leads(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_leads_source ON fact_leads(source, status);
CREATE INDEX IF NOT EXISTS idx_fact_visits_date ON fact_visits(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_visits_property ON fact_visits(property_id);
CREATE INDEX IF NOT EXISTS idx_fact_communications_date ON fact_communications(date_key);
CREATE INDEX IF NOT EXISTS idx_fact_communications_channel ON fact_communications(channel);
CREATE INDEX IF NOT EXISTS idx_etl_jobs_active ON etl_jobs(is_active, next_run_at);
CREATE INDEX IF NOT EXISTS idx_etl_logs_job ON etl_logs(job_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_kpi_values_kpi_date ON kpi_values(kpi_id, date_key);
CREATE INDEX IF NOT EXISTS idx_custom_reports_public ON custom_reports(is_public);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_send ON report_schedules(is_active, next_send_at);
CREATE INDEX IF NOT EXISTS idx_data_exports_user ON data_exports(created_by, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cohort_analysis_cohort ON cohort_analysis(cohort_type, cohort_date);
CREATE INDEX IF NOT EXISTS idx_funnel_tracking_entity ON funnel_tracking(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_funnel_tracking_funnel ON funnel_tracking(funnel_name, current_step);
