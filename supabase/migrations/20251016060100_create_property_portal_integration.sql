/*
  # Sistema de Integração com Portais Imobiliários

  1. Novas Tabelas
    - `property_portals` - Configuração de portais imobiliários
    - `property_portal_sync` - Log de sincronização com portais
    - `property_import_jobs` - Jobs de importação em lote
    - `property_import_items` - Itens de importação
    - `property_versions` - Versionamento de alterações
    - `property_comparisons` - Comparações salvas de imóveis
    - `property_matches` - Matches automáticos entre leads e imóveis
    - `property_validation_checklist` - Checklist de documentação

  2. Melhorias em Properties
    - Adicionar campos de geolocalização avançada
    - Adicionar campos de integração com portais
    - Adicionar campos de tour virtual 360

  3. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para autenticados
*/

-- Property Portals (Configuração de Portais)
CREATE TABLE IF NOT EXISTS property_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  api_url text NOT NULL,
  api_key text,
  api_secret text,
  is_active boolean DEFAULT true,
  sync_enabled boolean DEFAULT false,
  sync_frequency text DEFAULT 'daily',
  last_sync_at timestamptz,
  configuration jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_portals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage portals"
  ON property_portals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Property Portal Sync (Log de Sincronização)
CREATE TABLE IF NOT EXISTS property_portal_sync (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  portal_id uuid NOT NULL REFERENCES property_portals(id) ON DELETE CASCADE,
  property_id uuid REFERENCES properties(id) ON DELETE CASCADE,
  sync_type text NOT NULL,
  status text DEFAULT 'pending',
  external_id text,
  external_url text,
  request_payload jsonb DEFAULT '{}',
  response_payload jsonb DEFAULT '{}',
  error_message text,
  synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_portal_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sync logs"
  ON property_portal_sync FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create sync logs"
  ON property_portal_sync FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Property Import Jobs
CREATE TABLE IF NOT EXISTS property_import_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  source text NOT NULL,
  file_url text,
  file_type text,
  status text DEFAULT 'pending',
  total_items integer DEFAULT 0,
  processed_items integer DEFAULT 0,
  successful_items integer DEFAULT 0,
  failed_items integer DEFAULT 0,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_import_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage import jobs"
  ON property_import_jobs FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Property Import Items
CREATE TABLE IF NOT EXISTS property_import_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES property_import_jobs(id) ON DELETE CASCADE,
  row_number integer NOT NULL,
  raw_data jsonb NOT NULL,
  mapped_data jsonb DEFAULT '{}',
  property_id uuid REFERENCES properties(id),
  status text DEFAULT 'pending',
  error_message text,
  created_at timestamptz DEFAULT now(),
  processed_at timestamptz
);

ALTER TABLE property_import_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view import items"
  ON property_import_items FOR SELECT
  TO authenticated
  USING (true);

-- Property Versions (Histórico de Alterações)
CREATE TABLE IF NOT EXISTS property_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  version_number integer NOT NULL,
  changes jsonb NOT NULL,
  previous_data jsonb DEFAULT '{}',
  changed_by uuid,
  change_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE property_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view property versions"
  ON property_versions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create property versions"
  ON property_versions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Property Comparisons (Comparação de Imóveis)
CREATE TABLE IF NOT EXISTS property_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  property_ids jsonb NOT NULL DEFAULT '[]',
  lead_id uuid REFERENCES leads(id) ON DELETE CASCADE,
  contact_id integer,
  notes text,
  shared_with jsonb DEFAULT '[]',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage comparisons"
  ON property_comparisons FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Property Matches (Matching Automático)
CREATE TABLE IF NOT EXISTS property_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  match_score decimal(5,2) DEFAULT 0,
  matching_criteria jsonb DEFAULT '{}',
  status text DEFAULT 'new',
  sent_to_lead boolean DEFAULT false,
  lead_interest text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(lead_id, property_id)
);

ALTER TABLE property_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage property matches"
  ON property_matches FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Property Validation Checklist
CREATE TABLE IF NOT EXISTS property_validation_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  checklist_type text NOT NULL,
  item_name text NOT NULL,
  item_description text,
  is_required boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  document_url text,
  completed_by uuid,
  completed_at timestamptz,
  due_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_validation_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage validation checklist"
  ON property_validation_checklist FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Adicionar campos de geolocalização em properties (se não existirem)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE properties ADD COLUMN latitude decimal(10, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE properties ADD COLUMN longitude decimal(11, 8);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'neighborhood'
  ) THEN
    ALTER TABLE properties ADD COLUMN neighborhood text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'tour_360_url'
  ) THEN
    ALTER TABLE properties ADD COLUMN tour_360_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'video_tour_url'
  ) THEN
    ALTER TABLE properties ADD COLUMN video_tour_url text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'ai_generated_description'
  ) THEN
    ALTER TABLE properties ADD COLUMN ai_generated_description text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'portal_sync_enabled'
  ) THEN
    ALTER TABLE properties ADD COLUMN portal_sync_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'properties' AND column_name = 'external_ids'
  ) THEN
    ALTER TABLE properties ADD COLUMN external_ids jsonb DEFAULT '{}';
  END IF;
END $$;

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_property_portals_active ON property_portals(is_active);
CREATE INDEX IF NOT EXISTS idx_property_portal_sync_portal ON property_portal_sync(portal_id);
CREATE INDEX IF NOT EXISTS idx_property_portal_sync_property ON property_portal_sync(property_id);
CREATE INDEX IF NOT EXISTS idx_property_portal_sync_status ON property_portal_sync(status);
CREATE INDEX IF NOT EXISTS idx_property_import_jobs_status ON property_import_jobs(status);
CREATE INDEX IF NOT EXISTS idx_property_import_items_job ON property_import_items(job_id);
CREATE INDEX IF NOT EXISTS idx_property_versions_property ON property_versions(property_id, version_number DESC);
CREATE INDEX IF NOT EXISTS idx_property_comparisons_lead ON property_comparisons(lead_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_lead ON property_matches(lead_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_property ON property_matches(property_id);
CREATE INDEX IF NOT EXISTS idx_property_matches_status ON property_matches(status);
CREATE INDEX IF NOT EXISTS idx_property_validation_property ON property_validation_checklist(property_id);
CREATE INDEX IF NOT EXISTS idx_properties_location ON properties(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
