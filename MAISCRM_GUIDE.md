# MaisCRM - Sistema Completo de CRM Imobiliário

## 📋 Visão Geral

MaisCRM é um sistema profissional de CRM (Customer Relationship Management) especializado no mercado imobiliário, com integração WhatsApp para atendimento omnichannel. O sistema oferece gestão completa de leads, imóveis, visitas, propostas comerciais e pipeline de vendas.

## 🚀 Funcionalidades Principais

### 1. Gestão de Leads
- **Captura e Qualificação**: Sistema de pontuação (score) 0-100
- **Múltiplas Origens**: Website, WhatsApp, indicação, redes sociais
- **Status Personalizados**: Novo, contatado, qualificado, negociando, ganho, perdido
- **Informações Detalhadas**:
  - Orçamento mínimo e máximo
  - Tipo de imóvel preferido
  - Localizações de interesse
  - Histórico completo de interações
- **Atribuição**: Leads automaticamente atribuídos a corretores

### 2. Pipeline de Vendas (Kanban)
- **8 Estágios Predefinidos**:
  1. Novo Lead
  2. Contato Realizado
  3. Qualificado
  4. Visita Agendada
  5. Proposta Enviada
  6. Negociação
  7. Fechado
  8. Perdido
- **Drag-and-Drop**: Mova leads entre estágios visualmente
- **Cores Personalizadas**: Cada estágio com cor diferente
- **Métricas em Tempo Real**: Contador de leads por estágio

### 3. Gestão de Imóveis
- **Informações Completas**:
  - Código único do imóvel
  - Tipo (apartamento, casa, comercial, terreno)
  - Transação (venda/aluguel)
  - Preços de venda e aluguel
  - Área, quartos, banheiros, vagas
  - Endereço completo com geolocalização
  - Condomínio e IPTU
  - Ano de construção
  - Mobiliado
- **Mídia Rich**:
  - Múltiplas imagens
  - Vídeo tour
  - Tour virtual 360°
  - Documentos anexados
- **Landing Page Pública**: URL única para cada imóvel
- **Analytics**: Rastreamento de visualizações e leads gerados

### 4. Gestão de Visitas
- **Agendamento Completo**:
  - Vinculação com imóvel e lead/contato
  - Data e hora programadas
  - Status (agendada, realizada, cancelada, não compareceu)
- **Registro Detalhado**:
  - Observações pré-visita
  - Feedback pós-visita
  - Indicador de interesse do cliente
- **Atribuição**: Corretor responsável pela visita

### 5. Propostas Comerciais
- **Numeração Automática**: Código único para cada proposta
- **Tipos de Transação**: Venda ou aluguel
- **Formas de Pagamento**:
  - À vista
  - Financiamento
  - Misto
- **Configuração Flexível**:
  - Valor proposto
  - Entrada (down payment)
  - Parcelamento customizável
- **Status Completos**:
  - Rascunho
  - Enviada
  - Visualizada
  - Negociando
  - Aceita
  - Rejeitada
  - Cancelada
- **Rastreamento**: Data de envio, visualização e resposta
- **Termos e Condições**: Texto personalizável

### 6. Sistema de Tarefas
- **Tipos de Tarefa**:
  - Ligação
  - Email
  - Visita
  - Reunião
  - Outros
- **Prioridades**: Baixa, média, alta, urgente
- **Vinculação**: Tarefas ligadas a leads, imóveis ou contatos
- **Atribuição**: Responsável e criador
- **Datas**: Vencimento e conclusão
- **Status**: Pendente, em andamento, concluída, cancelada

### 7. Dashboard Analytics
- **Métricas em Tempo Real**:
  - Total de leads (com novos em destaque)
  - Total de imóveis (ativos/inativos)
  - Visitas agendadas
  - Propostas ativas
- **Tarefas Pendentes**: Lista priorizada
- **Leads Recentes**: Últimos 5 leads com score visual
- **Atividades**: Histórico de ações no sistema

### 8. Integração WhatsApp
- **Atendimento Omnichannel**: Gestão de múltiplos números
- **Tickets**: Conversas organizadas em filas
- **Respostas Rápidas**: Templates de mensagens
- **Mídia**: Envio e recebimento de imagens, áudios, documentos
- **Conversão Automática**: WhatsApp → Lead → Contato

## 🏗️ Arquitetura Técnica

### Backend (Node.js + TypeScript)

#### Estrutura de Dados
```
┌─────────────────────────────────────────┐
│           ENTIDADES PRINCIPAIS          │
├─────────────────────────────────────────┤
│ Leads                                   │
│ ├─ Informações pessoais                 │
│ ├─ Qualificação e score                 │
│ ├─ Interesses                           │
│ └─ Relacionamentos                      │
├─────────────────────────────────────────┤
│ Properties (Imóveis)                    │
│ ├─ Dados do imóvel                      │
│ ├─ Localização                          │
│ ├─ Mídia (imagens, vídeos)              │
│ ├─ Documentos                           │
│ └─ Analytics                            │
├─────────────────────────────────────────┤
│ Visits (Visitas)                        │
│ ├─ Agendamento                          │
│ ├─ Lead/Contato                         │
│ ├─ Imóvel                               │
│ └─ Feedback                             │
├─────────────────────────────────────────┤
│ Proposals (Propostas)                   │
│ ├─ Configuração financeira              │
│ ├─ Status e rastreamento                │
│ └─ Documentação                         │
├─────────────────────────────────────────┤
│ Tasks (Tarefas)                         │
│ ├─ Tipo e prioridade                    │
│ ├─ Vinculação                           │
│ └─ Responsável                          │
├─────────────────────────────────────────┤
│ PipelineStages                          │
│ ├─ Nome do estágio                      │
│ ├─ Ordem                                │
│ └─ Cor                                  │
├─────────────────────────────────────────┤
│ Activities (Atividades)                 │
│ ├─ Tipo de atividade                    │
│ ├─ Entidade relacionada                 │
│ ├─ Usuário                              │
│ └─ Metadados                            │
└─────────────────────────────────────────┘
```

#### Camadas da Aplicação
1. **Models** (Sequelize TypeScript)
   - Definição de schemas
   - Relacionamentos
   - Validações

2. **Services** (Lógica de Negócio)
   - CreateLeadService
   - ListLeadsService
   - UpdateLeadService
   - Similares para todas as entidades

3. **Controllers** (Handlers de Requisições)
   - LeadController
   - PropertyController
   - VisitController
   - ProposalController
   - TaskController
   - PipelineController

4. **Routes** (Endpoints API)
   - `/leads` - CRUD completo
   - `/properties` - CRUD + público
   - `/visits` - CRUD
   - `/proposals` - CRUD + status
   - `/tasks` - CRUD + completar
   - `/pipeline` - Visualização + mover

### Banco de Dados (Supabase/PostgreSQL)

#### Tabelas Criadas
```sql
-- Core CRM
Leads               (8 campos + metadados)
PipelineStages      (5 campos)
Tasks               (11 campos)
Activities          (7 campos)

-- Imobiliário
Properties          (25+ campos)
PropertyViews       (7 campos - analytics)
PropertyDocuments   (6 campos)
Visits              (9 campos)
Proposals           (16 campos)

-- Existentes (WhatsApp)
Users
Contacts
Tickets
Messages
Queues
Whatsapps
```

#### Segurança (RLS - Row Level Security)
- **Todas as tabelas protegidas** com políticas RLS
- **Autenticação obrigatória** para operações
- **Políticas granulares**:
  - SELECT: Autenticados veem todos
  - INSERT: Autenticados podem criar
  - UPDATE: Autenticados podem atualizar
  - DELETE: Autenticados podem deletar
- **Acesso público limitado**:
  - PropertyViews: Criação anônima para analytics
  - Properties via publicUrl: Leitura pública

#### Indices Otimizados
- Campos de busca frequente (email, phone, status)
- Foreign keys
- Datas (scheduledDate, dueDate, nextFollowUp)
- URLs públicas

### Frontend (React + Material-UI)

#### Páginas Implementadas
1. **Dashboard** (`/`)
   - Cards de métricas
   - Tarefas pendentes
   - Leads recentes

2. **Leads** (`/leads`)
   - Lista com filtros (status, origem)
   - Modal de criação/edição
   - Score visual

3. **Pipeline** (`/pipeline`)
   - Kanban drag-and-drop
   - 8 colunas (estágios)
   - Cards interativos

4. **Imóveis** (`/properties`)
   - CRUD completo
   - Upload de imagens
   - Geração de URL pública

5. **Visitas** (`/visits`)
   - Agendamento
   - Lista e filtros
   - Status tracking

6. **Contatos** (`/contacts`)
   - Integrado com WhatsApp
   - Campos customizáveis

7. **Tickets** (`/tickets`)
   - Atendimento WhatsApp
   - Filas de atendimento

8. **Página Pública** (`/property/:publicUrl`)
   - Showcase do imóvel
   - Dados do corretor
   - Call-to-action

#### Componentes Reutilizáveis
- `LeadModal` - Criação/edição de leads
- `PropertyModal` - Gestão de imóveis
- `VisitModal` - Agendamento de visitas
- `ConfirmationModal` - Confirmações
- `TableRowSkeleton` - Loading states

## 📊 Fluxo de Trabalho Típico

### 1. Captura de Lead
```
WhatsApp → Ticket → Lead Criado
Website → Formulário → Lead Criado
Indicação → Manual → Lead Criado
```

### 2. Qualificação
```
Lead → Atribuído ao Corretor
↓
Contato Inicial → Score Atualizado
↓
Qualificação → Status "Qualificado"
↓
Movido no Pipeline → Estágio "Qualificado"
```

### 3. Apresentação de Imóveis
```
Corretor busca imóveis compatíveis
↓
Envia links públicos via WhatsApp
↓
Lead visualiza → PropertyView registrada
↓
Interesse? → Agendar Visita
```

### 4. Visita
```
Visita Agendada → Task criada
↓
Visita Realizada → Feedback registrado
↓
Interessado? → Criar Proposta
```

### 5. Proposta
```
Proposta Criada → Status "Rascunho"
↓
Enviada → Status "Enviada" + timestamp
↓
Negociação → Status "Negociando"
↓
Aceita → Status "Aceita" + Lead "Ganho"
```

### 6. Analytics
```
Todas as ações geram Activities
↓
Dashboard atualizado em tempo real
↓
Relatórios disponíveis
```

## 🔧 Instalação e Configuração

### Requisitos
- Node.js 14+
- PostgreSQL 12+ (Supabase)
- WhatsApp Business (opcional)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Configure as variáveis de ambiente
npm run build
npx sequelize db:migrate
npx sequelize db:seed:all
npm start
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Configure VITE_API_URL
npm run build
npm start
```

### Supabase
As migrações já foram aplicadas automaticamente:
- create_properties_table
- create_visits_table
- create_leads_system
- create_proposals_system
- create_tasks_and_pipeline
- create_analytics_and_enhancements

## 🔐 Segurança

### Autenticação
- JWT tokens (access + refresh)
- Sessões seguras
- Logout automático

### RLS (Row Level Security)
- Todas as tabelas protegidas
- Políticas por operação (SELECT, INSERT, UPDATE, DELETE)
- Isolamento de dados

### Validações
- Backend: Yup schemas
- Frontend: Formik + Yup
- Sanitização de inputs

## 📈 Próximas Melhorias Sugeridas

### Funcionalidades
- [ ] Sistema de notificações push
- [ ] Calendário integrado de visitas
- [ ] Relatórios exportáveis (PDF, Excel)
- [ ] Integração com portais imobiliários
- [ ] Chat interno entre corretores
- [ ] Gestão de comissões
- [ ] Contratos digitais
- [ ] Assinatura eletrônica
- [ ] Dashboard executivo (gerência)
- [ ] App mobile (React Native)

### Técnicas
- [ ] Testes automatizados (Jest, Cypress)
- [ ] CI/CD pipeline
- [ ] Monitoramento (Sentry)
- [ ] Cache (Redis)
- [ ] Queue workers (BullMQ)
- [ ] Websockets real-time
- [ ] Elasticsearch para buscas
- [ ] S3 para mídia

## 👥 Roles e Permissões

### Admin
- Acesso total ao sistema
- Gerenciar usuários
- Configurar pipeline
- Ver todos os leads

### Corretor
- Gerenciar seus leads
- Ver todos os imóveis
- Agendar visitas
- Criar propostas

### Gerente
- Ver leads da equipe
- Relatórios
- Aprovar propostas

## 📞 Suporte

Para dúvidas e suporte:
- Documentação completa no `/docs`
- Issues no repositório
- Email: suporte@maiscrm.com

---

**MaisCRM** - Transformando o mercado imobiliário com tecnologia de ponta.
