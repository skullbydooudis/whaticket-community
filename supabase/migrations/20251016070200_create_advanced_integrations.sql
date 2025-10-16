/*
  # Sistemas Avançados de Integrações e Automação

  1. Novas Tabelas
    - `video_conferences` - Videoconferências para visitas virtuais
    - `video_recordings` - Gravações de visitas
    - `auction_events` - Leilões online de imóveis
    - `auction_bids` - Lances em leilões
    - `service_marketplace` - Marketplace de serviços
    - `service_providers` - Prestadores de serviços
    - `service_bookings` - Reservas de serviços
    - `blockchain_contracts` - Contratos inteligentes
    - `contract_signatures_blockchain` - Assinaturas em blockchain
    - `payment_plans` - Planos de pagamento recorrente
    - `payment_transactions` - Transações de pagamento
    - `split_rules` - Regras de split de pagamento
    - `api_keys` - Chaves de API pública
    - `api_usage` - Uso da API
    - `rate_limits` - Limites de taxa
    - `contract_renewals` - Renovações automáticas
    - `maintenance_requests` - Solicitações de manutenção
    - `tenant_management` - Gestão de inquilinos

  2. Integrações Avançadas
    - Sistema de videoconferência
    - Leilões online
    - Marketplace de serviços
    - Blockchain para contratos
    - Pagamentos recorrentes

  3. Segurança
    - RLS completo
    - Rate limiting
    - API authentication
*/

-- Video Conferences (para visitas virtuais)
CREATE TABLE IF NOT EXISTS video_conferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id uuid REFERENCES Visits(id),
  property_id uuid REFERENCES Properties(id),
  lead_id uuid REFERENCES Leads(id),
  host_user_id uuid NOT NULL,
  meeting_url text NOT NULL,
  meeting_id text UNIQUE NOT NULL,
  meeting_password text,
  platform text NOT NULL DEFAULT 'zoom',
  status text DEFAULT 'scheduled',
  scheduled_start timestamptz NOT NULL,
  scheduled_end timestamptz NOT NULL,
  actual_start timestamptz,
  actual_end timestamptz,
  duration_minutes integer,
  participants jsonb DEFAULT '[]',
  recording_url text,
  recording_duration integer,
  transcription_url text,
  notes text,
  feedback_score integer,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE video_conferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage video conferences"
  ON video_conferences FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Video Recordings
CREATE TABLE IF NOT EXISTS video_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conference_id uuid REFERENCES video_conferences(id) ON DELETE CASCADE,
  recording_url text NOT NULL,
  file_size bigint,
  duration_minutes integer,
  format text DEFAULT 'mp4',
  thumbnail_url text,
  transcription text,
  highlights jsonb DEFAULT '[]',
  ai_summary text,
  shared_with jsonb DEFAULT '[]',
  view_count integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE video_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view recordings"
  ON video_recordings FOR SELECT
  TO authenticated
  USING (true);

-- Auction Events (leilões online)
CREATE TABLE IF NOT EXISTS auction_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES Properties(id),
  title text NOT NULL,
  description text,
  starting_price decimal(12, 2) NOT NULL,
  reserve_price decimal(12, 2),
  current_bid decimal(12, 2),
  bid_increment decimal(12, 2) DEFAULT 1000.00,
  total_bids integer DEFAULT 0,
  leading_bidder_id uuid,
  status text DEFAULT 'draft',
  auction_type text DEFAULT 'english',
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  auto_extend boolean DEFAULT true,
  extension_minutes integer DEFAULT 5,
  required_deposit decimal(12, 2),
  terms_and_conditions text,
  winner_id uuid,
  final_price decimal(12, 2),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE auction_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active auctions"
  ON auction_events FOR SELECT
  TO authenticated, anon
  USING (status = 'active');

CREATE POLICY "Authenticated users can manage auctions"
  ON auction_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Auction Bids
CREATE TABLE IF NOT EXISTS auction_bids (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auction_id uuid NOT NULL REFERENCES auction_events(id) ON DELETE CASCADE,
  bidder_id uuid NOT NULL,
  bid_amount decimal(12, 2) NOT NULL,
  max_bid decimal(12, 2),
  is_proxy_bid boolean DEFAULT false,
  is_winning boolean DEFAULT false,
  ip_address text,
  user_agent text,
  bid_time timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE auction_bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their bids"
  ON auction_bids FOR SELECT
  TO authenticated
  USING (bidder_id::text = auth.uid()::text);

CREATE POLICY "Users can create bids"
  ON auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (bidder_id::text = auth.uid()::text);

-- Service Marketplace (marketplace de serviços)
CREATE TABLE IF NOT EXISTS service_marketplace (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name text NOT NULL,
  category text NOT NULL,
  description text,
  base_price decimal(12, 2) NOT NULL,
  pricing_model text DEFAULT 'fixed',
  duration_minutes integer,
  availability jsonb DEFAULT '{}',
  rating decimal(3, 2) DEFAULT 0,
  total_bookings integer DEFAULT 0,
  is_active boolean DEFAULT true,
  provider_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_marketplace ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active services"
  ON service_marketplace FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Service Providers
CREATE TABLE IF NOT EXISTS service_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name text NOT NULL,
  provider_type text NOT NULL,
  company_name text,
  email text NOT NULL,
  phone text NOT NULL,
  document text,
  address jsonb DEFAULT '{}',
  certifications jsonb DEFAULT '[]',
  insurance_info jsonb DEFAULT '{}',
  rating decimal(3, 2) DEFAULT 0,
  total_services integer DEFAULT 0,
  completion_rate decimal(5, 2),
  response_time_hours integer,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view verified providers"
  ON service_providers FOR SELECT
  TO authenticated, anon
  USING (is_verified = true AND is_active = true);

-- Service Bookings
CREATE TABLE IF NOT EXISTS service_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES service_marketplace(id),
  provider_id uuid NOT NULL REFERENCES service_providers(id),
  property_id uuid REFERENCES Properties(id),
  customer_id uuid NOT NULL,
  booking_date timestamptz NOT NULL,
  status text DEFAULT 'pending',
  price decimal(12, 2) NOT NULL,
  notes text,
  completion_notes text,
  rating integer,
  review text,
  payment_status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their bookings"
  ON service_bookings FOR ALL
  TO authenticated
  USING (customer_id::text = auth.uid()::text)
  WITH CHECK (customer_id::text = auth.uid()::text);

-- Blockchain Contracts (contratos inteligentes)
CREATE TABLE IF NOT EXISTS blockchain_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type text NOT NULL,
  contract_address text UNIQUE NOT NULL,
  blockchain_network text DEFAULT 'ethereum',
  proposal_id uuid REFERENCES Proposals(id),
  property_id uuid REFERENCES Properties(id),
  parties jsonb NOT NULL DEFAULT '[]',
  contract_terms jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'deployed',
  transaction_hash text,
  block_number bigint,
  gas_used bigint,
  deployment_cost decimal(18, 8),
  escrow_amount decimal(12, 2),
  milestones jsonb DEFAULT '[]',
  events jsonb DEFAULT '[]',
  deployed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blockchain_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view blockchain contracts"
  ON blockchain_contracts FOR SELECT
  TO authenticated
  USING (true);

-- Contract Signatures Blockchain
CREATE TABLE IF NOT EXISTS contract_signatures_blockchain (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES blockchain_contracts(id) ON DELETE CASCADE,
  signer_address text NOT NULL,
  signer_role text NOT NULL,
  signature_hash text NOT NULL,
  transaction_hash text,
  signed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contract_signatures_blockchain ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view signatures"
  ON contract_signatures_blockchain FOR SELECT
  TO authenticated
  USING (true);

-- Payment Plans (planos de pagamento recorrente)
CREATE TABLE IF NOT EXISTS payment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_name text NOT NULL,
  plan_type text NOT NULL,
  billing_cycle text NOT NULL,
  amount decimal(12, 2) NOT NULL,
  setup_fee decimal(12, 2) DEFAULT 0,
  trial_days integer DEFAULT 0,
  max_installments integer,
  features jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active plans"
  ON payment_plans FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- Payment Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  payer_id uuid NOT NULL,
  amount decimal(12, 2) NOT NULL,
  fee_amount decimal(12, 2) DEFAULT 0,
  net_amount decimal(12, 2),
  currency text DEFAULT 'BRL',
  payment_method text NOT NULL,
  payment_provider text NOT NULL,
  provider_transaction_id text,
  status text DEFAULT 'pending',
  installments integer DEFAULT 1,
  installment_number integer,
  due_date date,
  paid_at timestamptz,
  refunded_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their transactions"
  ON payment_transactions FOR SELECT
  TO authenticated
  USING (payer_id::text = auth.uid()::text);

-- Split Rules (regras de divisão de pagamento)
CREATE TABLE IF NOT EXISTS split_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  split_type text NOT NULL,
  percentage decimal(5, 2),
  fixed_amount decimal(12, 2),
  priority integer DEFAULT 0,
  conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE split_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage split rules"
  ON split_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- API Keys (para API pública)
CREATE TABLE IF NOT EXISTS api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key_name text NOT NULL,
  api_key text UNIQUE NOT NULL,
  api_secret text NOT NULL,
  user_id uuid NOT NULL,
  scopes jsonb DEFAULT '[]',
  rate_limit_per_hour integer DEFAULT 1000,
  is_active boolean DEFAULT true,
  last_used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their API keys"
  ON api_keys FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text)
  WITH CHECK (user_id::text = auth.uid()::text);

-- API Usage
CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id uuid REFERENCES api_keys(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer,
  response_time_ms integer,
  ip_address text,
  user_agent text,
  request_size integer,
  response_size integer,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their API usage"
  ON api_usage FOR SELECT
  TO authenticated
  USING (
    api_key_id IN (
      SELECT id FROM api_keys WHERE user_id::text = auth.uid()::text
    )
  );

-- Rate Limits
CREATE TABLE IF NOT EXISTS rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  identifier_type text NOT NULL,
  endpoint text,
  request_count integer DEFAULT 0,
  window_start timestamptz NOT NULL,
  window_end timestamptz NOT NULL,
  is_blocked boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System manages rate limits"
  ON rate_limits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Contract Renewals (renovações automáticas)
CREATE TABLE IF NOT EXISTS contract_renewals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_type text NOT NULL,
  entity_id uuid NOT NULL,
  current_end_date date NOT NULL,
  renewal_date date NOT NULL,
  new_terms jsonb DEFAULT '{}',
  price_adjustment decimal(5, 2),
  status text DEFAULT 'pending',
  auto_renew boolean DEFAULT true,
  notification_sent boolean DEFAULT false,
  renewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contract_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view renewals"
  ON contract_renewals FOR SELECT
  TO authenticated
  USING (true);

-- Maintenance Requests (solicitações de manutenção)
CREATE TABLE IF NOT EXISTS maintenance_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES Properties(id),
  tenant_id uuid,
  request_type text NOT NULL,
  priority text DEFAULT 'medium',
  description text NOT NULL,
  location_in_property text,
  photos jsonb DEFAULT '[]',
  status text DEFAULT 'pending',
  assigned_to uuid,
  scheduled_date timestamptz,
  completed_at timestamptz,
  estimated_cost decimal(12, 2),
  actual_cost decimal(12, 2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE maintenance_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage maintenance requests"
  ON maintenance_requests FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Tenant Management (gestão de inquilinos)
CREATE TABLE IF NOT EXISTS tenant_management (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES Properties(id),
  tenant_id uuid NOT NULL,
  lease_start date NOT NULL,
  lease_end date NOT NULL,
  monthly_rent decimal(12, 2) NOT NULL,
  deposit_amount decimal(12, 2),
  status text DEFAULT 'active',
  payment_day integer DEFAULT 1,
  late_fee_percentage decimal(5, 2),
  emergency_contacts jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE tenant_management ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage tenants"
  ON tenant_management FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices
CREATE INDEX idx_video_conferences_visit ON video_conferences(visit_id);
CREATE INDEX idx_video_conferences_property ON video_conferences(property_id);
CREATE INDEX idx_video_conferences_scheduled ON video_conferences(scheduled_start);
CREATE INDEX idx_auction_events_property ON auction_events(property_id);
CREATE INDEX idx_auction_events_status ON auction_events(status, end_time);
CREATE INDEX idx_auction_bids_auction ON auction_bids(auction_id, bid_amount DESC);
CREATE INDEX idx_auction_bids_bidder ON auction_bids(bidder_id);
CREATE INDEX idx_service_marketplace_category ON service_marketplace(category, is_active);
CREATE INDEX idx_service_providers_type ON service_providers(provider_type, is_verified);
CREATE INDEX idx_service_bookings_customer ON service_bookings(customer_id);
CREATE INDEX idx_blockchain_contracts_proposal ON blockchain_contracts(proposal_id);
CREATE INDEX idx_payment_transactions_payer ON payment_transactions(payer_id, created_at DESC);
CREATE INDEX idx_payment_transactions_entity ON payment_transactions(entity_type, entity_id);
CREATE INDEX idx_split_rules_entity ON split_rules(entity_type, entity_id);
CREATE INDEX idx_api_keys_key ON api_keys(api_key) WHERE is_active = true;
CREATE INDEX idx_api_usage_key ON api_usage(api_key_id, created_at DESC);
CREATE INDEX idx_rate_limits_identifier ON rate_limits(identifier, window_end);
CREATE INDEX idx_contract_renewals_date ON contract_renewals(renewal_date, status);
CREATE INDEX idx_maintenance_requests_property ON maintenance_requests(property_id, status);
CREATE INDEX idx_tenant_management_property ON tenant_management(property_id, status);
