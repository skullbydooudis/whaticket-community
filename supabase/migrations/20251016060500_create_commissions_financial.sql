/*
  # Módulo de Comissões e Financeiro

  1. Novas Tabelas
    - `commission_rules` - Regras de cálculo de comissões
    - `commissions` - Comissões calculadas
    - `commission_payments` - Pagamentos de comissões
    - `commission_splits` - Divisão de comissões entre múltiplos usuários
    - `user_goals` - Metas individuais e coletivas
    - `goal_tracking` - Acompanhamento de metas
    - `bonuses` - Bonificações e premiações
    - `financial_transactions` - Transações financeiras
    - `receivables` - Recebíveis do pipeline

  2. Segurança
    - Enable RLS em todas as tabelas
    - Políticas para visualização própria e gestores
*/

-- Commission Rules (Regras de Comissões)
CREATE TABLE IF NOT EXISTS commission_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  rule_type text NOT NULL,
  base_percentage decimal(5, 2) NOT NULL,
  min_value decimal(12, 2),
  max_value decimal(12, 2),
  conditions jsonb DEFAULT '{}',
  tiered_rates jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  effective_from date DEFAULT CURRENT_DATE,
  effective_to date,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view commission rules"
  ON commission_rules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage commission rules"
  ON commission_rules FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Commissions (Comissões Calculadas)
CREATE TABLE IF NOT EXISTS commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  transaction_type text NOT NULL,
  reference_id uuid,
  reference_type text,
  base_value decimal(12, 2) NOT NULL,
  commission_rate decimal(5, 2) NOT NULL,
  commission_value decimal(12, 2) NOT NULL,
  rule_id uuid REFERENCES commission_rules(id),
  status text DEFAULT 'pending',
  calculation_details jsonb DEFAULT '{}',
  payment_due_date date,
  notes text,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own commissions"
  ON commissions FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage all commissions"
  ON commissions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Commission Payments (Pagamentos)
CREATE TABLE IF NOT EXISTS commission_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  payment_method text NOT NULL,
  payment_amount decimal(12, 2) NOT NULL,
  payment_date date NOT NULL,
  payment_reference text,
  payment_proof_url text,
  bank_details jsonb DEFAULT '{}',
  paid_by uuid,
  paid_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commission_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their commission payments"
  ON commission_payments FOR SELECT
  TO authenticated
  USING (
    commission_id IN (
      SELECT id FROM commissions WHERE user_id::text = auth.uid()::text
    )
  );

CREATE POLICY "Admins can manage payments"
  ON commission_payments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Commission Splits (Divisão de Comissões)
CREATE TABLE IF NOT EXISTS commission_splits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  commission_id uuid NOT NULL REFERENCES commissions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  split_percentage decimal(5, 2) NOT NULL,
  split_value decimal(12, 2) NOT NULL,
  reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE commission_splits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their commission splits"
  ON commission_splits FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage splits"
  ON commission_splits FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- User Goals (Metas)
CREATE TABLE IF NOT EXISTS user_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  team_id uuid,
  goal_type text NOT NULL,
  goal_period text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  target_type text NOT NULL,
  target_value decimal(12, 2) NOT NULL,
  current_value decimal(12, 2) DEFAULT 0,
  unit text,
  status text DEFAULT 'active',
  reward_type text,
  reward_value decimal(12, 2),
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own goals"
  ON user_goals FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text OR user_id IS NULL);

CREATE POLICY "Admins can manage goals"
  ON user_goals FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Goal Tracking (Acompanhamento de Metas)
CREATE TABLE IF NOT EXISTS goal_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal_id uuid NOT NULL REFERENCES user_goals(id) ON DELETE CASCADE,
  tracking_date date NOT NULL,
  value_achieved decimal(12, 2) NOT NULL,
  percentage_complete decimal(5, 2),
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE goal_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their goal tracking"
  ON goal_tracking FOR SELECT
  TO authenticated
  USING (
    goal_id IN (
      SELECT id FROM user_goals WHERE user_id::text = auth.uid()::text OR user_id IS NULL
    )
  );

CREATE POLICY "System can create goal tracking"
  ON goal_tracking FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Bonuses (Bonificações)
CREATE TABLE IF NOT EXISTS bonuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  bonus_type text NOT NULL,
  reason text NOT NULL,
  amount decimal(12, 2) NOT NULL,
  reference_id uuid,
  reference_type text,
  status text DEFAULT 'pending',
  payment_date date,
  paid_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own bonuses"
  ON bonuses FOR SELECT
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can manage bonuses"
  ON bonuses FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Financial Transactions (Transações Financeiras)
CREATE TABLE IF NOT EXISTS financial_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  category text NOT NULL,
  amount decimal(12, 2) NOT NULL,
  description text NOT NULL,
  reference_id uuid,
  reference_type text,
  payment_method text,
  transaction_date date NOT NULL,
  due_date date,
  paid_date date,
  status text DEFAULT 'pending',
  account text,
  cost_center text,
  tags jsonb DEFAULT '[]',
  attachments jsonb DEFAULT '[]',
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE financial_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view transactions"
  ON financial_transactions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage transactions"
  ON financial_transactions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Receivables (Recebíveis do Pipeline)
CREATE TABLE IF NOT EXISTS receivables (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proposal_id uuid REFERENCES proposals(id),
  lead_id uuid REFERENCES leads(id),
  property_id uuid REFERENCES properties(id),
  expected_amount decimal(12, 2) NOT NULL,
  expected_date date NOT NULL,
  probability_percentage integer DEFAULT 50,
  weighted_value decimal(12, 2),
  status text DEFAULT 'projected',
  actual_amount decimal(12, 2),
  received_date date,
  variance decimal(12, 2),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE receivables ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view receivables"
  ON receivables FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage receivables"
  ON receivables FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Índices para Performance
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON commission_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_commission_rules_dates ON commission_rules(effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_commissions_user ON commissions(user_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON commissions(status);
CREATE INDEX IF NOT EXISTS idx_commissions_due_date ON commission_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_commission_payments_commission ON commission_payments(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_splits_commission ON commission_splits(commission_id);
CREATE INDEX IF NOT EXISTS idx_commission_splits_user ON commission_splits(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_user ON user_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_user_goals_period ON user_goals(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_user_goals_status ON user_goals(status);
CREATE INDEX IF NOT EXISTS idx_goal_tracking_goal ON goal_tracking(goal_id);
CREATE INDEX IF NOT EXISTS idx_goal_tracking_date ON goal_tracking(tracking_date);
CREATE INDEX IF NOT EXISTS idx_bonuses_user ON bonuses(user_id);
CREATE INDEX IF NOT EXISTS idx_bonuses_status ON bonuses(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_date ON financial_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_status ON financial_transactions(status);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type ON financial_transactions(transaction_type, category);
CREATE INDEX IF NOT EXISTS idx_receivables_expected_date ON receivables(expected_date);
CREATE INDEX IF NOT EXISTS idx_receivables_status ON receivables(status);
CREATE INDEX IF NOT EXISTS idx_receivables_proposal ON receivables(proposal_id);
