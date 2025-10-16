/*
  # Sistema de Pós-Vendas

  1. Nova Tabela: after_sales
    - `id` (uuid, primary key)
    - `code` (text, unique) - Código único do processo
    - `proposal_id` (uuid) - Proposta relacionada
    - `lead_id` (uuid) - Lead/Cliente
    - `property_id` (uuid) - Imóvel
    - `store_id` (uuid) - Loja responsável
    - `assigned_to` (uuid) - Usuário responsável
    - `status` (text) - Status do processo
    - `type` (text) - Tipo: 'sale', 'rental'
    - `sale_value` (decimal) - Valor da venda/locação
    - `commission_value` (decimal) - Valor da comissão
    - `contract_date` (date) - Data do contrato
    - `delivery_date` (date) - Data prevista de entrega
    - `actual_delivery_date` (date) - Data real de entrega
    - `notes` (text) - Observações
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Nova Tabela: after_sales_documents
    - `id` (uuid, primary key)
    - `after_sales_id` (uuid, foreign key)
    - `document_type` (text) - Tipo do documento
    - `document_name` (text) - Nome do documento
    - `document_url` (text) - URL do documento
    - `file_size` (bigint) - Tamanho do arquivo
    - `mime_type` (text) - Tipo MIME
    - `status` (text) - Status: 'pending', 'received', 'approved', 'rejected'
    - `uploaded_by` (uuid) - Quem enviou
    - `uploaded_at` (timestamptz) - Quando foi enviado
    - `verified_by` (uuid) - Quem verificou
    - `verified_at` (timestamptz) - Quando foi verificado
    - `rejection_reason` (text) - Motivo da rejeição
    - `expiry_date` (date) - Data de validade
    - `notes` (text)
    - `created_at` (timestamptz)

  3. Nova Tabela: after_sales_timeline
    - `id` (uuid, primary key)
    - `after_sales_id` (uuid, foreign key)
    - `event_type` (text) - Tipo do evento
    - `event_title` (text) - Título do evento
    - `event_description` (text) - Descrição
    - `event_date` (timestamptz) - Data do evento
    - `user_id` (uuid) - Usuário que registrou
    - `metadata` (jsonb) - Dados adicionais
    - `created_at` (timestamptz)

  4. Nova Tabela: after_sales_checklist
    - `id` (uuid, primary key)
    - `after_sales_id` (uuid, foreign key)
    - `category` (text) - Categoria
    - `item_name` (text) - Nome do item
    - `description` (text) - Descrição
    - `is_required` (boolean) - Se é obrigatório
    - `is_completed` (boolean) - Se foi concluído
    - `completed_by` (uuid) - Quem completou
    - `completed_at` (timestamptz) - Quando completou
    - `due_date` (date) - Data limite
    - `notes` (text)
    - `order` (integer) - Ordem de exibição
    - `created_at` (timestamptz)

  5. Segurança
    - RLS habilitado em todas tabelas
    - Políticas baseadas em loja e permissões
*/

-- Criar tabela principal de pós-vendas
CREATE TABLE IF NOT EXISTS after_sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  proposal_id uuid,
  lead_id uuid,
  property_id uuid,
  store_id uuid NOT NULL REFERENCES stores(id),
  assigned_to uuid,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'documentation', 'contract_signing', 'payment_processing',
    'deed_transfer', 'key_delivery', 'completed', 'cancelled'
  )),
  type text NOT NULL CHECK (type IN ('sale', 'rental')),
  sale_value decimal(15,2),
  commission_value decimal(15,2),
  contract_date date,
  delivery_date date,
  actual_delivery_date date,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de documentos
CREATE TABLE IF NOT EXISTS after_sales_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  after_sales_id uuid NOT NULL REFERENCES after_sales(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN (
    'identity_document', 'proof_of_residence', 'proof_of_income',
    'marriage_certificate', 'bank_statement', 'tax_declaration',
    'purchase_contract', 'deed', 'registration',
    'payment_receipt', 'commission_invoice', 'other'
  )),
  document_name text NOT NULL,
  document_url text,
  file_size bigint,
  mime_type text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN (
    'pending', 'received', 'under_review', 'approved', 'rejected', 'expired'
  )),
  uploaded_by uuid,
  uploaded_at timestamptz,
  verified_by uuid,
  verified_at timestamptz,
  rejection_reason text,
  expiry_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de timeline/histórico
CREATE TABLE IF NOT EXISTS after_sales_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  after_sales_id uuid NOT NULL REFERENCES after_sales(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'status_change', 'document_uploaded', 'document_approved', 'document_rejected',
    'payment_received', 'contract_signed', 'meeting_scheduled',
    'note_added', 'assignment_changed', 'other'
  )),
  event_title text NOT NULL,
  event_description text,
  event_date timestamptz DEFAULT now(),
  user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Criar tabela de checklist
CREATE TABLE IF NOT EXISTS after_sales_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  after_sales_id uuid NOT NULL REFERENCES after_sales(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN (
    'documentation', 'financial', 'legal', 'property_preparation', 'delivery', 'other'
  )),
  item_name text NOT NULL,
  description text,
  is_required boolean DEFAULT false,
  is_completed boolean DEFAULT false,
  completed_by uuid,
  completed_at timestamptz,
  due_date date,
  notes text,
  "order" integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_after_sales_code ON after_sales(code);
CREATE INDEX IF NOT EXISTS idx_after_sales_store ON after_sales(store_id);
CREATE INDEX IF NOT EXISTS idx_after_sales_assigned ON after_sales(assigned_to);
CREATE INDEX IF NOT EXISTS idx_after_sales_status ON after_sales(status);
CREATE INDEX IF NOT EXISTS idx_after_sales_type ON after_sales(type);
CREATE INDEX IF NOT EXISTS idx_after_sales_lead ON after_sales(lead_id);
CREATE INDEX IF NOT EXISTS idx_after_sales_property ON after_sales(property_id);

CREATE INDEX IF NOT EXISTS idx_documents_after_sales ON after_sales_documents(after_sales_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON after_sales_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_documents_status ON after_sales_documents(status);

CREATE INDEX IF NOT EXISTS idx_timeline_after_sales ON after_sales_timeline(after_sales_id);
CREATE INDEX IF NOT EXISTS idx_timeline_type ON after_sales_timeline(event_type);
CREATE INDEX IF NOT EXISTS idx_timeline_date ON after_sales_timeline(event_date);

CREATE INDEX IF NOT EXISTS idx_checklist_after_sales ON after_sales_checklist(after_sales_id);
CREATE INDEX IF NOT EXISTS idx_checklist_completed ON after_sales_checklist(is_completed);

-- Habilitar RLS
ALTER TABLE after_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE after_sales_checklist ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para after_sales
CREATE POLICY "Usuários podem ver pós-vendas de suas lojas"
  ON after_sales FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_stores us
      WHERE us.user_id = auth.uid()
      AND us.store_id = after_sales.store_id
    )
  );

CREATE POLICY "Usuários podem criar pós-vendas em suas lojas"
  ON after_sales FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_stores us
      WHERE us.user_id = auth.uid()
      AND us.store_id = after_sales.store_id
    )
  );

CREATE POLICY "Usuários podem atualizar pós-vendas de suas lojas"
  ON after_sales FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_stores us
      WHERE us.user_id = auth.uid()
      AND us.store_id = after_sales.store_id
    )
  );

-- Políticas para documentos
CREATE POLICY "Usuários podem ver documentos de pós-vendas de suas lojas"
  ON after_sales_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM after_sales a
      JOIN user_stores us ON us.store_id = a.store_id
      WHERE a.id = after_sales_documents.after_sales_id
      AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem gerenciar documentos de suas lojas"
  ON after_sales_documents FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM after_sales a
      JOIN user_stores us ON us.store_id = a.store_id
      WHERE a.id = after_sales_documents.after_sales_id
      AND us.user_id = auth.uid()
    )
  );

-- Políticas para timeline
CREATE POLICY "Usuários podem ver timeline de suas lojas"
  ON after_sales_timeline FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM after_sales a
      JOIN user_stores us ON us.store_id = a.store_id
      WHERE a.id = after_sales_timeline.after_sales_id
      AND us.user_id = auth.uid()
    )
  );

CREATE POLICY "Usuários podem adicionar eventos ao timeline"
  ON after_sales_timeline FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM after_sales a
      JOIN user_stores us ON us.store_id = a.store_id
      WHERE a.id = after_sales_timeline.after_sales_id
      AND us.user_id = auth.uid()
    )
  );

-- Políticas para checklist
CREATE POLICY "Usuários podem gerenciar checklist de suas lojas"
  ON after_sales_checklist FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM after_sales a
      JOIN user_stores us ON us.store_id = a.store_id
      WHERE a.id = after_sales_checklist.after_sales_id
      AND us.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER after_sales_updated_at
  BEFORE UPDATE ON after_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_stores_updated_at();

-- Função para gerar código único
CREATE OR REPLACE FUNCTION generate_after_sales_code()
RETURNS text AS $$
DECLARE
  new_code text;
  code_exists boolean;
BEGIN
  LOOP
    new_code := 'AS-' || to_char(now(), 'YYYYMMDD') || '-' ||
                substring(gen_random_uuid()::text from 1 for 6);

    SELECT EXISTS(SELECT 1 FROM after_sales WHERE code = new_code) INTO code_exists;

    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Trigger para gerar código automaticamente
CREATE OR REPLACE FUNCTION set_after_sales_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.code IS NULL OR NEW.code = '' THEN
    NEW.code := generate_after_sales_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER after_sales_set_code
  BEFORE INSERT ON after_sales
  FOR EACH ROW
  EXECUTE FUNCTION set_after_sales_code();
