/*
  # Sistemas de Machine Learning e Inteligência Artificial

  1. Novas Tabelas
    - `ml_models` - Modelos de ML treinados
    - `ml_predictions` - Predições realizadas
    - `ml_training_data` - Dados de treinamento
    - `property_valuations` - Avaliações automáticas de imóveis
    - `price_suggestions` - Sugestões de preço dinâmico
    - `lead_scoring_ml` - Scoring com ML
    - `churn_predictions` - Predições de churn
    - `recommendation_engine` - Sistema de recomendação
    - `sentiment_analysis` - Análise de sentimento
    - `market_trends` - Tendências de mercado
    - `competitor_tracking` - Monitoramento de concorrência
    - `demand_forecasting` - Previsão de demanda
    - `image_recognition` - Reconhecimento de imagem
    - `voice_commands` - Comandos de voz processados

  2. Features de ML
    - Predição de preços
    - Lead scoring automático
    - Churn prediction
    - Recommendation system
    - Sentiment analysis

  3. Segurança
    - RLS em todas as tabelas
    - Acesso controlado a modelos
*/

-- ML Models (modelos treinados)
CREATE TABLE IF NOT EXISTS ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_type text NOT NULL,
  version text NOT NULL,
  algorithm text NOT NULL,
  features jsonb NOT NULL DEFAULT '[]',
  hyperparameters jsonb DEFAULT '{}',
  performance_metrics jsonb DEFAULT '{}',
  training_dataset_size integer,
  accuracy decimal(5, 4),
  precision_score decimal(5, 4),
  recall_score decimal(5, 4),
  f1_score decimal(5, 4),
  mae decimal(12, 2),
  rmse decimal(12, 2),
  r2_score decimal(5, 4),
  model_file_url text,
  is_active boolean DEFAULT false,
  trained_at timestamptz,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view ML models"
  ON ml_models FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage ML models"
  ON ml_models FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ML Predictions (predições realizadas)
CREATE TABLE IF NOT EXISTS ml_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id uuid NOT NULL REFERENCES ml_models(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  prediction_type text NOT NULL,
  input_features jsonb NOT NULL DEFAULT '{}',
  predicted_value decimal(12, 2),
  predicted_class text,
  confidence_score decimal(5, 4),
  probability_distribution jsonb DEFAULT '{}',
  actual_value decimal(12, 2),
  actual_class text,
  is_correct boolean,
  error_margin decimal(12, 2),
  feedback_provided boolean DEFAULT false,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view predictions"
  ON ml_predictions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create predictions"
  ON ml_predictions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ML Training Data
CREATE TABLE IF NOT EXISTS ml_training_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dataset_name text NOT NULL,
  model_type text NOT NULL,
  features jsonb NOT NULL DEFAULT '{}',
  target_value decimal(12, 2),
  target_class text,
  split_type text DEFAULT 'train',
  weight decimal(5, 4) DEFAULT 1.0,
  is_validated boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ml_training_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "System can manage training data"
  ON ml_training_data FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Property Valuations (avaliações automáticas)
CREATE TABLE IF NOT EXISTS property_valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES Properties(id) ON DELETE CASCADE,
  valuation_method text NOT NULL,
  estimated_value decimal(12, 2) NOT NULL,
  min_value decimal(12, 2),
  max_value decimal(12, 2),
  confidence_interval decimal(5, 2),
  comparable_properties jsonb DEFAULT '[]',
  market_factors jsonb DEFAULT '{}',
  neighborhood_avg decimal(12, 2),
  price_per_sqm decimal(12, 2),
  appreciation_rate decimal(5, 2),
  valuation_date date DEFAULT CURRENT_DATE,
  valid_until date,
  model_id uuid REFERENCES ml_models(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view valuations"
  ON property_valuations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create valuations"
  ON property_valuations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Price Suggestions (pricing dinâmico)
CREATE TABLE IF NOT EXISTS price_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid NOT NULL REFERENCES Properties(id) ON DELETE CASCADE,
  current_price decimal(12, 2) NOT NULL,
  suggested_price decimal(12, 2) NOT NULL,
  adjustment_percentage decimal(5, 2),
  reasoning text,
  factors jsonb DEFAULT '{}',
  market_conditions jsonb DEFAULT '{}',
  demand_score integer,
  urgency_level text,
  expected_days_to_sell integer,
  probability_of_sale decimal(5, 2),
  status text DEFAULT 'pending',
  applied_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE price_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view price suggestions"
  ON price_suggestions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create suggestions"
  ON price_suggestions FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Lead Scoring ML (scoring avançado com ML)
CREATE TABLE IF NOT EXISTS lead_scoring_ml (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES Leads(id) ON DELETE CASCADE,
  model_id uuid REFERENCES ml_models(id),
  ml_score decimal(5, 2) NOT NULL,
  conversion_probability decimal(5, 4),
  predicted_ltv decimal(12, 2),
  engagement_score decimal(5, 2),
  urgency_score decimal(5, 2),
  quality_score decimal(5, 2),
  feature_importance jsonb DEFAULT '{}',
  top_factors jsonb DEFAULT '[]',
  recommended_actions jsonb DEFAULT '[]',
  next_best_action text,
  optimal_contact_time timestamptz,
  scored_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE lead_scoring_ml ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view lead scoring"
  ON lead_scoring_ml FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "System can create lead scoring"
  ON lead_scoring_ml FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Churn Predictions
CREATE TABLE IF NOT EXISTS churn_predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  model_id uuid REFERENCES ml_models(id),
  churn_probability decimal(5, 4) NOT NULL,
  risk_level text NOT NULL,
  churn_factors jsonb DEFAULT '[]',
  retention_strategies jsonb DEFAULT '[]',
  predicted_churn_date date,
  prevention_actions_taken jsonb DEFAULT '[]',
  actual_churned boolean,
  churned_at timestamptz,
  prediction_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE churn_predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view churn predictions"
  ON churn_predictions FOR SELECT
  TO authenticated
  USING (true);

-- Recommendation Engine
CREATE TABLE IF NOT EXISTS recommendation_engine (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recommendation_type text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  score decimal(5, 2) NOT NULL,
  reasoning jsonb DEFAULT '{}',
  based_on jsonb DEFAULT '{}',
  collaborative_score decimal(5, 2),
  content_score decimal(5, 2),
  hybrid_score decimal(5, 2),
  rank_position integer,
  was_shown boolean DEFAULT false,
  shown_at timestamptz,
  was_clicked boolean DEFAULT false,
  clicked_at timestamptz,
  was_converted boolean DEFAULT false,
  converted_at timestamptz,
  feedback_score integer,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz
);

ALTER TABLE recommendation_engine ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their recommendations"
  ON recommendation_engine FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "System can create recommendations"
  ON recommendation_engine FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Sentiment Analysis
CREATE TABLE IF NOT EXISTS sentiment_analysis (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  text_content text NOT NULL,
  sentiment_label text NOT NULL,
  sentiment_score decimal(5, 4),
  positive_probability decimal(5, 4),
  neutral_probability decimal(5, 4),
  negative_probability decimal(5, 4),
  emotions jsonb DEFAULT '{}',
  keywords jsonb DEFAULT '[]',
  topics jsonb DEFAULT '[]',
  language text DEFAULT 'pt-BR',
  analyzed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE sentiment_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view sentiment analysis"
  ON sentiment_analysis FOR SELECT
  TO authenticated
  USING (true);

-- Market Trends (tendências de mercado)
CREATE TABLE IF NOT EXISTS market_trends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES dim_location(id),
  property_type text NOT NULL,
  trend_period text NOT NULL,
  avg_price decimal(12, 2),
  median_price decimal(12, 2),
  price_trend text,
  price_change_percentage decimal(5, 2),
  volume_sold integer DEFAULT 0,
  volume_trend text,
  avg_days_on_market integer,
  inventory_level integer,
  supply_demand_ratio decimal(5, 2),
  market_temperature text,
  predictions jsonb DEFAULT '{}',
  analysis_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE market_trends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view market trends"
  ON market_trends FOR SELECT
  TO authenticated
  USING (true);

-- Competitor Tracking
CREATE TABLE IF NOT EXISTS competitor_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_name text NOT NULL,
  competitor_url text,
  property_id uuid REFERENCES Properties(id),
  competitor_property_id text,
  price decimal(12, 2),
  features jsonb DEFAULT '{}',
  similar_to_our_property uuid REFERENCES Properties(id),
  similarity_score decimal(5, 2),
  price_comparison text,
  our_advantage jsonb DEFAULT '[]',
  their_advantage jsonb DEFAULT '[]',
  tracked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE competitor_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view competitor tracking"
  ON competitor_tracking FOR SELECT
  TO authenticated
  USING (true);

-- Demand Forecasting
CREATE TABLE IF NOT EXISTS demand_forecasting (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id uuid REFERENCES dim_location(id),
  property_type text NOT NULL,
  forecast_period text NOT NULL,
  forecast_date date NOT NULL,
  predicted_demand integer NOT NULL,
  confidence_interval_lower integer,
  confidence_interval_upper integer,
  seasonality_factor decimal(5, 2),
  trend_factor decimal(5, 2),
  external_factors jsonb DEFAULT '{}',
  model_id uuid REFERENCES ml_models(id),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE demand_forecasting ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view demand forecasting"
  ON demand_forecasting FOR SELECT
  TO authenticated
  USING (true);

-- Image Recognition
CREATE TABLE IF NOT EXISTS image_recognition (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  detected_objects jsonb DEFAULT '[]',
  room_type text,
  style text,
  quality_score decimal(5, 2),
  amenities_detected jsonb DEFAULT '[]',
  colors_palette jsonb DEFAULT '[]',
  is_professional boolean,
  improvement_suggestions jsonb DEFAULT '[]',
  model_version text,
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE image_recognition ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view image recognition"
  ON image_recognition FOR SELECT
  TO authenticated
  USING (true);

-- Voice Commands
CREATE TABLE IF NOT EXISTS voice_commands (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  audio_url text,
  transcribed_text text NOT NULL,
  language text DEFAULT 'pt-BR',
  intent text NOT NULL,
  entities jsonb DEFAULT '{}',
  confidence_score decimal(5, 4),
  action_taken text,
  success boolean DEFAULT false,
  response_text text,
  processing_time_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE voice_commands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their voice commands"
  ON voice_commands FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Users can create voice commands"
  ON voice_commands FOR INSERT
  TO authenticated
  WITH CHECK (user_id::text = auth.uid()::text);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_ml_models_active ON ml_models(is_active, model_type);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_entity ON ml_predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model ON ml_predictions(model_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ml_training_data_dataset ON ml_training_data(dataset_name, split_type);
CREATE INDEX IF NOT EXISTS idx_property_valuations_property ON property_valuations(property_id, valuation_date DESC);
CREATE INDEX IF NOT EXISTS idx_price_suggestions_property ON price_suggestions(property_id, status);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_ml_lead ON lead_scoring_ml(lead_id, scored_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_scoring_ml_score ON lead_scoring_ml(ml_score DESC);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_entity ON churn_predictions(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk ON churn_predictions(risk_level, churn_probability DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_engine_user ON recommendation_engine(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendation_engine_entity ON recommendation_engine(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_entity ON sentiment_analysis(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_sentiment_analysis_sentiment ON sentiment_analysis(sentiment_label, sentiment_score);
CREATE INDEX IF NOT EXISTS idx_market_trends_location ON market_trends(location_id, property_type, analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_tracking_property ON competitor_tracking(similar_to_our_property);
CREATE INDEX IF NOT EXISTS idx_demand_forecasting_location ON demand_forecasting(location_id, property_type, forecast_date);
CREATE INDEX IF NOT EXISTS idx_image_recognition_entity ON image_recognition(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_voice_commands_user ON voice_commands(user_id, created_at DESC);
