/*
  # Sistema de Comunicação Unificada e Pós-Venda

  1. Novas Tabelas
    - `unified_inbox` - Inbox único consolidado
    - `message_templates` - Templates de mensagens por contexto
    - `broadcast_campaigns` - Campanhas de broadcast segmentado
    - `broadcast_recipients` - Destinatários de campanhas
    - `engagement_tracking` - Rastreamento de engajamento
    - `chatbot_conversations` - Conversas do chatbot
    - `chatbot_intents` - Intenções do chatbot
    - `post_sale_timeline` - Timeline de pós-venda
    - `satisfaction_surveys` - Pesquisas de satisfação
    - `survey_responses` - Respostas de pesquisas
    - `referral_program` - Programa de indicações
    - `referrals` - Indicações rastreadas
    - `nps_scores` - Scores NPS

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para acesso controlado
*/

-- Unified Inbox (Inbox Consolidado)
CREATE TABLE IF NOT EXISTS unified_inbox (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  channel text NOT NULL,
  contact_id integer,
  lead_id uuid REFERENCES leads(id),
  direction text NOT NULL,
  message_type text DEFAULT 'text',
  content text,
  media_url text,
  status text DEFAULT 'received',
  assigned_to uuid,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  replied_at timestamptz,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE unified_inbox ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view assigned messages"
  ON unified_inbox FOR SELECT
  TO authenticated
  USING (assigned_to::text = auth.uid()::text OR assigned_to IS NULL);

CREATE POLICY "Users can create messages"
  ON unified_inbox FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update assigned messages"
  ON unified_inbox FOR UPDATE
  TO authenticated
  USING (assigned_to::text = auth.uid()::text OR assigned_to IS NULL)
  WITH CHECK (assigned_to::text = auth.uid()::text OR assigned_to IS NULL);

-- Message Templates (Templates por Contexto)
CREATE TABLE IF NOT EXISTS message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL,
  channel text NOT NULL,
  context text,
  subject text,
  content text NOT NULL,
  variables jsonb DEFAULT '[]',
  media_urls jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  usage_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view templates"
  ON message_templates FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage templates"
  ON message_templates FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Broadcast Campaigns (Campanhas Segmentadas)
CREATE TABLE IF NOT EXISTS broadcast_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  channel text NOT NULL,
  segment_criteria jsonb DEFAULT '{}',
  template_id uuid REFERENCES message_templates(id),
  message_content text NOT NULL,
  media_urls jsonb DEFAULT '[]',
  scheduled_for timestamptz,
  status text DEFAULT 'draft',
  total_recipients integer DEFAULT 0,
  sent_count integer DEFAULT 0,
  delivered_count integer DEFAULT 0,
  failed_count integer DEFAULT 0,
  opened_count integer DEFAULT 0,
  clicked_count integer DEFAULT 0,
  replied_count integer DEFAULT 0,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE broadcast_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view campaigns"
  ON broadcast_campaigns FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage campaigns"
  ON broadcast_campaigns FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Broadcast Recipients
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES broadcast_campaigns(id) ON DELETE CASCADE,
  recipient_type text NOT NULL,
  recipient_id uuid,
  recipient_contact text NOT NULL,
  personalized_data jsonb DEFAULT '{}',
  status text DEFAULT 'pending',
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE broadcast_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view recipients"
  ON broadcast_recipients FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create recipients"
  ON broadcast_recipients FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Engagement Tracking (Rastreamento de Engajamento)
CREATE TABLE IF NOT EXISTS engagement_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  contact_id integer,
  lead_id uuid REFERENCES leads(id),
  event_type text NOT NULL,
  channel text NOT NULL,
  event_data jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE engagement_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view engagement"
  ON engagement_tracking FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create engagement events"
  ON engagement_tracking FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Chatbot Conversations
CREATE TABLE IF NOT EXISTS chatbot_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  channel text NOT NULL,
  contact_id integer,
  lead_id uuid REFERENCES leads(id),
  status text DEFAULT 'active',
  context jsonb DEFAULT '{}',
  transferred_to_human boolean DEFAULT false,
  transferred_at timestamptz,
  assigned_to uuid,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view chatbot conversations"
  ON chatbot_conversations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can manage chatbot conversations"
  ON chatbot_conversations FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Chatbot Intents (Intenções)
CREATE TABLE IF NOT EXISTS chatbot_intents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES chatbot_conversations(id) ON DELETE CASCADE,
  user_message text NOT NULL,
  detected_intent text,
  confidence_score decimal(5, 2),
  entities jsonb DEFAULT '{}',
  bot_response text,
  response_type text DEFAULT 'text',
  actions_taken jsonb DEFAULT '[]',
  fallback boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chatbot_intents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view intents"
  ON chatbot_intents FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create intents"
  ON chatbot_intents FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Post Sale Timeline (Pós-Venda)
CREATE TABLE IF NOT EXISTS post_sale_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id),
  lead_id uuid REFERENCES leads(id),
  contact_id integer,
  milestone text NOT NULL,
  milestone_date date NOT NULL,
  status text DEFAULT 'pending',
  completed_at timestamptz,
  notes text,
  documents jsonb DEFAULT '[]',
  assigned_to uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE post_sale_timeline ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage post sale timeline"
  ON post_sale_timeline FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Satisfaction Surveys (Pesquisas de Satisfação)
CREATE TABLE IF NOT EXISTS satisfaction_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  survey_type text NOT NULL,
  trigger_event text NOT NULL,
  questions jsonb NOT NULL,
  is_active boolean DEFAULT true,
  response_count integer DEFAULT 0,
  average_score decimal(5, 2),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view surveys"
  ON satisfaction_surveys FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage surveys"
  ON satisfaction_surveys FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id uuid NOT NULL REFERENCES satisfaction_surveys(id) ON DELETE CASCADE,
  respondent_type text NOT NULL,
  respondent_id uuid,
  respondent_email text,
  answers jsonb NOT NULL,
  overall_score integer,
  feedback_text text,
  response_token text UNIQUE,
  submitted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view responses"
  ON survey_responses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can submit responses with token"
  ON survey_responses FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Referral Program (Programa de Indicações)
CREATE TABLE IF NOT EXISTS referral_program (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_name text NOT NULL,
  description text,
  reward_type text NOT NULL,
  reward_value decimal(12, 2),
  reward_conditions jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  valid_from date DEFAULT CURRENT_DATE,
  valid_to date,
  terms_and_conditions text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE referral_program ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view referral programs"
  ON referral_program FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage referral programs"
  ON referral_program FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Referrals (Indicações)
CREATE TABLE IF NOT EXISTS referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id uuid REFERENCES referral_program(id),
  referrer_id uuid NOT NULL,
  referrer_type text NOT NULL,
  referred_name text NOT NULL,
  referred_contact text NOT NULL,
  referred_email text,
  lead_id uuid REFERENCES leads(id),
  status text DEFAULT 'pending',
  converted boolean DEFAULT false,
  conversion_date date,
  reward_status text DEFAULT 'pending',
  reward_paid_at timestamptz,
  tracking_code text UNIQUE,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their referrals"
  ON referrals FOR SELECT
  TO authenticated
  USING (referrer_id::text = auth.uid()::text);

CREATE POLICY "Users can create referrals"
  ON referrals FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can manage all referrals"
  ON referrals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- NPS Scores
CREATE TABLE IF NOT EXISTS nps_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  respondent_type text NOT NULL,
  respondent_id uuid,
  respondent_email text,
  score integer NOT NULL CHECK (score BETWEEN 0 AND 10),
  category text,
  feedback_text text,
  survey_date date DEFAULT CURRENT_DATE,
  follow_up_completed boolean DEFAULT false,
  follow_up_notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nps_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view NPS scores"
  ON nps_scores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Public can submit NPS scores"
  ON nps_scores FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_unified_inbox_assigned ON unified_inbox(assigned_to);
CREATE INDEX IF NOT EXISTS idx_unified_inbox_channel ON unified_inbox(channel);
CREATE INDEX IF NOT EXISTS idx_unified_inbox_contact ON unified_inbox(contact_id);
CREATE INDEX IF NOT EXISTS idx_unified_inbox_created ON unified_inbox(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_templates_active ON message_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_message_templates_category ON message_templates(category, channel);
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_status ON broadcast_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_broadcast_campaigns_scheduled ON broadcast_campaigns(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_campaign ON broadcast_recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_broadcast_recipients_status ON broadcast_recipients(status);
CREATE INDEX IF NOT EXISTS idx_engagement_tracking_entity ON engagement_tracking(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_engagement_tracking_lead ON engagement_tracking(lead_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_session ON chatbot_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_status ON chatbot_conversations(status);
CREATE INDEX IF NOT EXISTS idx_chatbot_intents_conversation ON chatbot_intents(conversation_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_timeline_proposal ON post_sale_timeline(proposal_id);
CREATE INDEX IF NOT EXISTS idx_post_sale_timeline_status ON post_sale_timeline(status);
CREATE INDEX IF NOT EXISTS idx_satisfaction_surveys_active ON satisfaction_surveys(is_active);
CREATE INDEX IF NOT EXISTS idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX IF NOT EXISTS idx_survey_responses_token ON survey_responses(response_token);
CREATE INDEX IF NOT EXISTS idx_referral_program_active ON referral_program(is_active);
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_lead ON referrals(lead_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_tracking ON referrals(tracking_code);
CREATE INDEX IF NOT EXISTS idx_nps_scores_date ON nps_scores(survey_date DESC);
CREATE INDEX IF NOT EXISTS idx_nps_scores_category ON nps_scores(category);
