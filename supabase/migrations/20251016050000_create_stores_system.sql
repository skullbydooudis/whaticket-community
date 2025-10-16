/*
  # Sistema de Lojas/Filiais

  1. Nova Tabela: stores
    - `id` (uuid, primary key)
    - `name` (text) - Nome da loja/filial
    - `code` (text, unique) - Código único da loja
    - `type` (text) - Tipo: 'headquarters', 'branch', 'franchise'
    - `cnpj` (text) - CNPJ da loja
    - `email` (text) - Email da loja
    - `phone` (text) - Telefone
    - `address` (text) - Endereço completo
    - `city` (text) - Cidade
    - `state` (text) - Estado
    - `zip_code` (text) - CEP
    - `manager_id` (uuid) - ID do gerente responsável
    - `parent_store_id` (uuid) - ID da loja matriz (para filiais)
    - `is_active` (boolean) - Se a loja está ativa
    - `settings` (jsonb) - Configurações específicas da loja
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  2. Nova Tabela: user_stores
    - `id` (uuid, primary key)
    - `user_id` (uuid, foreign key)
    - `store_id` (uuid, foreign key)
    - `is_primary` (boolean) - Se é a loja principal do usuário
    - `permissions` (jsonb) - Permissões específicas nesta loja
    - `created_at` (timestamptz)

  3. Segurança
    - RLS habilitado em ambas tabelas
    - Políticas baseadas em autenticação e hierarquia
*/

-- Criar tabela de lojas
CREATE TABLE IF NOT EXISTS stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('headquarters', 'branch', 'franchise')),
  cnpj text,
  email text,
  phone text,
  address text,
  city text,
  state text,
  zip_code text,
  manager_id uuid,
  parent_store_id uuid REFERENCES stores(id),
  is_active boolean DEFAULT true,
  settings jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Criar tabela de relacionamento usuário-loja
CREATE TABLE IF NOT EXISTS user_stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  permissions jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, store_id)
);

-- Criar índices
CREATE INDEX IF NOT EXISTS idx_stores_code ON stores(code);
CREATE INDEX IF NOT EXISTS idx_stores_type ON stores(type);
CREATE INDEX IF NOT EXISTS idx_stores_parent ON stores(parent_store_id);
CREATE INDEX IF NOT EXISTS idx_stores_active ON stores(is_active);
CREATE INDEX IF NOT EXISTS idx_user_stores_user ON user_stores(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_store ON user_stores(store_id);
CREATE INDEX IF NOT EXISTS idx_user_stores_primary ON user_stores(user_id, is_primary);

-- Habilitar RLS
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stores ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para stores
CREATE POLICY "Usuários autenticados podem ver lojas"
  ON stores FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Gerentes podem criar lojas"
  ON stores FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_stores us
      WHERE us.user_id = auth.uid()
      AND us.permissions->>'can_manage_stores' = 'true'
    )
  );

CREATE POLICY "Gerentes podem atualizar suas lojas"
  ON stores FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_stores us
      WHERE us.user_id = auth.uid()
      AND us.store_id = stores.id
      AND us.permissions->>'can_manage_stores' = 'true'
    )
  );

-- Políticas de segurança para user_stores
CREATE POLICY "Usuários podem ver suas próprias lojas"
  ON user_stores FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Gerentes podem gerenciar usuários de lojas"
  ON user_stores FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_stores us
      WHERE us.user_id = auth.uid()
      AND us.store_id = user_stores.store_id
      AND us.permissions->>'can_manage_users' = 'true'
    )
  );

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_stores_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER stores_updated_at
  BEFORE UPDATE ON stores
  FOR EACH ROW
  EXECUTE FUNCTION update_stores_updated_at();
