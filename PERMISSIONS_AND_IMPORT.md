# Sistema de Permissões e Importação Automática - MaisCRM

## Índice
1. [Sistema de Permissões Multi-Nível](#sistema-de-permissões-multi-nível)
2. [Atribuição Multi-Usuário de Leads](#atribuição-multi-usuário-de-leads)
3. [Importação Automática do WhatsApp](#importação-automática-do-whatsapp)
4. [Processamento Automático de Mensagens](#processamento-automático-de-mensagens)
5. [Configuração e Uso](#configuração-e-uso)

---

## Sistema de Permissões Multi-Nível

### Visão Geral
O MaisCRM implementa um sistema robusto de controle de acesso baseado em funções (RBAC), permitindo que imobiliárias gerenciem permissões de forma granular.

### Funções (Roles) Disponíveis

#### 1. Director (Diretor)
**Permissões Completas:**
- ✅ Todas as operações de Leads (view, create, edit, delete)
- ✅ Todas as operações de Propriedades (view, create, edit, delete)
- ✅ Todas as operações de Propostas (view, create, edit, delete)
- ✅ Todas as operações de Visitas (view, create, edit, delete)
- ✅ Analytics completo (próprio e de toda equipe)
- ✅ Gerenciar usuários
- ✅ Gerenciar WhatsApp
- ✅ Gerenciar configurações do sistema

**Uso:**
```typescript
user.profile = "director"
```

#### 2. Manager (Gerente)
**Permissões Avançadas:**
- ✅ Todas as operações de Leads (view, create, edit, delete)
- ✅ Todas as operações de Propriedades (view, create, edit, delete)
- ✅ Todas as operações de Propostas (view, create, edit, delete)
- ✅ Todas as operações de Visitas (view, create, edit, delete)
- ✅ Analytics completo (próprio e de toda equipe)
- ✅ Gerenciar usuários
- ❌ Gerenciar WhatsApp (apenas uso)
- ❌ Gerenciar configurações do sistema

**Uso:**
```typescript
user.profile = "manager"
```

#### 3. Broker (Corretor)
**Permissões de Operação:**
- ✅ Ver, criar e editar Leads
- ✅ Ver, criar e editar Propriedades
- ✅ Ver, criar e editar Propostas
- ✅ Ver, criar e editar Visitas
- ✅ Analytics pessoal
- ❌ Deletar leads/propriedades
- ❌ Gerenciar usuários
- ❌ Gerenciar WhatsApp
- ❌ Ver analytics de outros usuários

**Uso:**
```typescript
user.profile = "broker"
```

#### 4. User (Usuário Básico)
**Permissões Limitadas:**
- ✅ Ver e criar Leads
- ✅ Ver Propriedades
- ✅ Ver Propostas
- ✅ Ver e criar Visitas
- ✅ Analytics pessoal básico
- ❌ Editar/deletar qualquer coisa
- ❌ Gerenciar usuários
- ❌ Gerenciar WhatsApp

**Uso:**
```typescript
user.profile = "user"
```

### Middleware de Permissões

```typescript
import checkPermission from "./middleware/checkPermission";

// Uso em rotas
router.get("/leads",
  isAuth,
  checkPermission("view:leads"),
  LeadController.index
);

router.delete("/leads/:id",
  isAuth,
  checkPermission("delete:leads"),
  LeadController.remove
);

// Múltiplas permissões (OR - qualquer uma)
router.post("/properties",
  isAuth,
  checkPermission("create:properties", "manage:properties"),
  PropertyController.store
);
```

### Lista Completa de Permissões

```typescript
type Permission =
  // Leads
  | "view:leads"
  | "create:leads"
  | "edit:leads"
  | "delete:leads"

  // Propriedades
  | "view:properties"
  | "create:properties"
  | "edit:properties"
  | "delete:properties"

  // Propostas
  | "view:proposals"
  | "create:proposals"
  | "edit:proposals"
  | "delete:proposals"

  // Visitas
  | "view:visits"
  | "create:visits"
  | "edit:visits"
  | "delete:visits"

  // Analytics
  | "view:analytics"           // Ver próprios analytics
  | "view:all-analytics"       // Ver analytics de todos

  // Administração
  | "manage:users"
  | "manage:whatsapp"
  | "manage:settings";
```

### Verificação Programática

```typescript
import { hasPermission } from "./middleware/checkPermission";

const user = await User.findByPk(userId);

if (hasPermission(user, "delete:leads")) {
  // Usuário pode deletar leads
}

if (hasPermission(user, "manage:users")) {
  // Usuário pode gerenciar outros usuários
}
```

---

## Atribuição Multi-Usuário de Leads

### Conceito
**Um lead pode estar vinculado a múltiplos usuários simultaneamente**, permitindo que vários corretores trabalhem com o mesmo cliente sem conflitos.

### Modelo de Dados

```typescript
interface LeadUser {
  leadId: number;
  userId: number;
  role: string;                    // "owner", "assigned", "collaborator"
  isPrimary: boolean;              // Responsável principal
  canEdit: boolean;                // Pode editar o lead
  receiveNotifications: boolean;   // Recebe notificações
}
```

### API de Atribuição

#### 1. Atribuir Usuários a um Lead
```http
POST /leads/:leadId/assign-users
Authorization: Bearer {token}
Content-Type: application/json

{
  "users": [
    {
      "userId": 5,
      "role": "owner",
      "isPrimary": true,
      "canEdit": true,
      "receiveNotifications": true
    },
    {
      "userId": 8,
      "role": "assigned",
      "isPrimary": false,
      "canEdit": true,
      "receiveNotifications": true
    },
    {
      "userId": 12,
      "role": "collaborator",
      "isPrimary": false,
      "canEdit": false,
      "receiveNotifications": false
    }
  ]
}
```

**Resposta:**
```json
{
  "id": 15,
  "name": "Maria Silva",
  "email": "maria@email.com",
  "phone": "11999999999",
  "assignedUsers": [
    {
      "id": 5,
      "name": "João Corretor",
      "role": "owner",
      "isPrimary": true
    },
    {
      "id": 8,
      "name": "Ana Corretora",
      "role": "assigned",
      "isPrimary": false
    }
  ]
}
```

#### 2. Listar Usuários Atribuídos
```http
GET /leads/:leadId/assigned-users
Authorization: Bearer {token}
```

**Resposta:**
```json
[
  {
    "leadId": 15,
    "userId": 5,
    "role": "owner",
    "isPrimary": true,
    "canEdit": true,
    "receiveNotifications": true,
    "user": {
      "id": 5,
      "name": "João Corretor",
      "email": "joao@imobiliaria.com",
      "profile": "broker"
    }
  }
]
```

#### 3. Remover Atribuição
```http
DELETE /leads/:leadId/assigned-users/:userId
Authorization: Bearer {token}
```

#### 4. Listar Meus Leads
```http
GET /leads/my-leads?status=active&pageNumber=1
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "leads": [
    {
      "id": 15,
      "name": "Maria Silva",
      "status": "active",
      "score": 85,
      "assignment": {
        "role": "owner",
        "isPrimary": true,
        "canEdit": true,
        "receiveNotifications": true
      }
    }
  ],
  "count": 42,
  "hasMore": true
}
```

### Casos de Uso

#### Caso 1: Lead Compartilhado entre Corretores
```javascript
// Lead entra em contato com 2 corretores diferentes
// Ambos devem ter acesso ao lead

await api.post('/leads/15/assign-users', {
  users: [
    { userId: 5, role: "owner", isPrimary: true, canEdit: true },
    { userId: 8, role: "assigned", isPrimary: false, canEdit: true }
  ]
});

// Agora ambos os corretores:
// - Veem o lead na listagem "Meus Leads"
// - Recebem notificações de atividades
// - Podem adicionar notas e atividades
// - Podem agendar visitas
```

#### Caso 2: Gerente Supervisionando Corretor
```javascript
// Gerente quer acompanhar lead do corretor

await api.post('/leads/15/assign-users', {
  users: [
    { userId: 8, role: "owner", isPrimary: true, canEdit: true },
    { userId: 3, role: "collaborator", isPrimary: false, canEdit: false, receiveNotifications: false }
  ]
});

// Corretor (userId: 8) é o dono
// Gerente (userId: 3) pode visualizar mas não edita
```

#### Caso 3: Transição de Lead
```javascript
// Transferir lead de um corretor para outro

// Remover corretor antigo
await api.delete('/leads/15/assigned-users/8');

// Adicionar novo corretor
await api.post('/leads/15/assign-users', {
  users: [
    { userId: 12, role: "owner", isPrimary: true, canEdit: true }
  ]
});
```

---

## Importação Automática do WhatsApp

### Visão Geral
O sistema importa automaticamente contatos do WhatsApp e os transforma em leads quando conectado.

### Funcionamento

#### 1. Conexão do WhatsApp
Quando um usuário conecta seu WhatsApp ao sistema:
- Sistema estabelece conexão com WhatsApp Web
- Atualiza `user.whatsappId` com o ID da conexão
- WhatsApp fica disponível para importação

#### 2. Importação Manual (On-Demand)

```http
POST /whatsapp/:whatsappId/import-leads
Authorization: Bearer {token}
Content-Type: application/json

{
  "maxContacts": 100,
  "onlyWithMessages": true
}
```

**Parâmetros:**
- `maxContacts`: Número máximo de contatos para importar (padrão: 100)
- `onlyWithMessages`: Importar apenas contatos com histórico de conversas (padrão: true)

**Resposta:**
```json
{
  "message": "Import completed successfully",
  "totalProcessed": 87,
  "newLeads": 42,
  "existingLeads": 45,
  "leads": [
    {
      "leadId": 150,
      "contactName": "Maria Silva",
      "isNew": true
    },
    {
      "leadId": 82,
      "contactName": "João Santos",
      "isNew": false
    }
  ]
}
```

#### 3. Verificar Status de Importação

```http
GET /whatsapp/:whatsappId/import-status
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "whatsappId": 1,
  "name": "WhatsApp - João Corretor",
  "status": "CONNECTED",
  "canImport": true
}
```

### Lógica de Importação

#### Filtros Aplicados:
1. **Grupos Excluídos**: Não importa grupos do WhatsApp
2. **Contatos sem Mensagens**: Opcional (via `onlyWithMessages`)
3. **Limite de Contatos**: Respeitado (via `maxContacts`)

#### Para Cada Contato:
1. **Criar/Atualizar Contato**
   - Número de telefone
   - Nome do contato
   - Foto de perfil (se disponível)

2. **Verificar Lead Existente**
   - Se lead já existe:
     - Atribui usuário atual ao lead (se não estiver atribuído)
     - Registra atividade de importação
   - Se lead não existe:
     - Cria novo lead
     - Calcula score inicial
     - Atribui usuário como "owner"
     - Registra atividade de criação

3. **Atribuição de Usuários**
   - **Prioridade 1**: Usuários vinculados ao WhatsApp específico
   - **Prioridade 2**: Primeiro diretor encontrado
   - Lead pode ser atribuído a múltiplos usuários

### Exemplo de Uso

```javascript
// 1. Verificar se pode importar
const status = await api.get('/whatsapp/1/import-status');

if (status.data.canImport) {
  // 2. Iniciar importação
  const result = await api.post('/whatsapp/1/import-leads', {
    maxContacts: 50,
    onlyWithMessages: true
  });

  console.log(`Importados: ${result.data.newLeads} novos leads`);
  console.log(`Atualizados: ${result.data.existingLeads} leads existentes`);

  // 3. Processar resultados
  result.data.leads.forEach(lead => {
    if (lead.isNew) {
      console.log(`Novo lead criado: ${lead.contactName}`);
    }
  });
}
```

---

## Processamento Automático de Mensagens

### Visão Geral
O sistema processa automaticamente **TODAS** as mensagens recebidas no WhatsApp, criando e atualizando leads em tempo real.

### Quando uma Mensagem é Recebida

#### 1. Filtros Automáticos
- ❌ Ignora mensagens de grupos
- ❌ Ignora mensagens enviadas pelo próprio usuário
- ✅ Processa todas as mensagens recebidas de contatos individuais

#### 2. Processamento do Contato
```typescript
// Para cada mensagem recebida:
1. Extrai número e nome do contato
2. Cria ou atualiza contato no sistema
3. Verifica se já existe lead para este contato
```

#### 3. Lead Existente
Se o lead já existe:
- ✅ Atualiza score do lead
- ✅ Registra atividade de contato
- ✅ Mantém atribuições de usuários existentes
- ✅ Salva referência da mensagem

#### 4. Novo Lead (Criação Automática)

**Critérios para Criar Lead:**

##### A. Mensagem contém palavras-chave imobiliárias:
```typescript
const keywords = [
  "comprar", "alugar", "imóvel", "imovel",
  "apartamento", "casa", "terreno", "cobertura",
  "interesse", "informação", "informacao",
  "visita", "visitar", "preço", "preco",
  "valor", "disponível", "disponivel"
];
```

##### B. Mensagem tem conteúdo significativo (>10 caracteres)

**Se critérios atendidos:**
1. Cria novo lead automaticamente
2. Calcula score inicial
3. Define status como "new"
4. Salva primeira mensagem nas notas
5. Atribui usuários apropriados

#### 5. Atribuição Automática de Usuários

**Prioridade de Atribuição:**
1. **Usuários vinculados ao WhatsApp**: Todos os users com `whatsappId` correspondente
2. **Primeiro diretor**: Se nenhum usuário específico vinculado
3. **Múltiplos usuários**: Se vários usuários têm o mesmo WhatsApp, TODOS são atribuídos

**Exemplo:**
```typescript
// WhatsApp ID: 1 está vinculado a:
// - User 5 (João Corretor)
// - User 8 (Ana Corretora)

// Mensagem recebida cria lead e atribui AMBOS:
LeadUser.create({ leadId: 150, userId: 5, isPrimary: true });
LeadUser.create({ leadId: 150, userId: 8, isPrimary: false });
```

### Fluxo Completo de Mensagem

```
WhatsApp Recebe Mensagem
        ↓
[Filtro: Não é grupo?]
        ↓ Sim
[Criar/Atualizar Contato]
        ↓
[Lead existe?]
   ↓           ↓
  Sim         Não
   ↓           ↓
[Atualizar] [Palavras-chave?]
[Score]         ↓ Sim
   ↓         [Criar Lead]
   ↓            ↓
   ↓      [Atribuir Usuários]
   ↓            ↓
[Registrar Atividade]
        ↓
[Notificar Usuários]
```

### Monitoramento de Atividades

Todas as ações são registradas:

```typescript
// Lead criado automaticamente
Activity: {
  type: "lead_created",
  description: "Lead criado automaticamente via WhatsApp",
  metadata: {
    source: "whatsapp_auto",
    firstMessage: "Olá, gostaria de informações sobre...",
    assignedUsers: [5, 8]
  }
}

// Mensagem recebida de lead existente
Activity: {
  type: "contact",
  description: "Nova mensagem recebida: 'Quando posso visitar?'",
  metadata: {
    messageId: "ABC123",
    source: "whatsapp"
  }
}
```

### Integração no Código

O processamento é chamado automaticamente no `wbotMessageListener`:

```typescript
import HandleIncomingLeadMessage from "./HandleIncomingLeadMessage";

// No listener de mensagens
wbot.on("message", async (message) => {
  // Processar para criação/atualização de leads
  await HandleIncomingLeadMessage({
    messageId: message.id,
    whatsappId: session.id,
    from: message.from,
    body: message.body,
    timestamp: message.timestamp,
    name: message.author || message.from
  });

  // Continuar com lógica normal de tickets...
});
```

---

## Configuração e Uso

### Setup Inicial

#### 1. Definir Roles dos Usuários

```sql
-- Definir usuário como diretor
UPDATE users SET profile = 'director' WHERE id = 1;

-- Definir usuário como gerente
UPDATE users SET profile = 'manager' WHERE id = 2;

-- Definir usuário como corretor
UPDATE users SET profile = 'broker' WHERE id = 3;
```

#### 2. Vincular WhatsApp aos Usuários

```javascript
// Quando usuário conecta WhatsApp
await User.update(
  { whatsappId: whatsappConnection.id },
  { where: { id: userId } }
);
```

#### 3. Testar Importação

```javascript
// Via API
const response = await api.post('/whatsapp/1/import-leads', {
  maxContacts: 10,      // Começar com poucos para testar
  onlyWithMessages: true
});

console.log(response.data);
```

### Melhores Práticas

#### 1. Gestão de Permissões
```typescript
// ✅ BOM: Verificar permissões antes de ações sensíveis
if (hasPermission(user, "delete:leads")) {
  await lead.destroy();
}

// ❌ RUIM: Assumir que usuário pode fazer tudo
await lead.destroy(); // Pode falhar sem verificação
```

#### 2. Atribuição de Leads
```typescript
// ✅ BOM: Atribuir múltiplos usuários quando apropriado
await AssignUsersToLeadService({
  leadId: 15,
  users: [
    { userId: 5, role: "owner", isPrimary: true },
    { userId: 8, role: "assigned", isPrimary: false }
  ]
});

// ❌ RUIM: Deixar lead sem atribuição
await Lead.create({ name: "Maria" });
// Lead criado mas ninguém é notificado
```

#### 3. Importação de Leads
```typescript
// ✅ BOM: Importar em lotes pequenos inicialmente
await ImportLeads({ maxContacts: 50 });

// ❌ RUIM: Importar tudo de uma vez
await ImportLeads({ maxContacts: 10000 });
// Pode sobrecarregar sistema
```

### Troubleshooting

#### Problema: Permissões não funcionando
```typescript
// Verificar role do usuário
const user = await User.findByPk(userId);
console.log(user.profile); // Deve ser: director, manager, broker, ou user

// Verificar middleware aplicado
router.get("/leads", isAuth, checkPermission("view:leads"), ...);
```

#### Problema: Leads não sendo importados
```typescript
// 1. Verificar status do WhatsApp
const status = await api.get('/whatsapp/1/import-status');
console.log(status.data.canImport); // Deve ser true

// 2. Verificar se WhatsApp está conectado
console.log(status.data.status); // Deve ser "CONNECTED"

// 3. Testar com maxContacts pequeno
await api.post('/whatsapp/1/import-leads', { maxContacts: 5 });
```

#### Problema: Mensagens não criando leads
```typescript
// 1. Verificar se mensagem contém palavras-chave
const message = "Olá, quero comprar um apartamento";
// ✅ Contém "comprar" e "apartamento"

// 2. Verificar logs do servidor
console.log("Processing message from:", contactNumber);

// 3. Verificar se contato não é grupo
console.log("Is group:", from.includes("@g.us")); // Deve ser false
```

---

## Resumo dos Endpoints

### Permissões e Usuários
```
GET    /leads/my-leads                      - Lista leads do usuário logado
POST   /leads/:id/assign-users              - Atribui múltiplos usuários
GET    /leads/:id/assigned-users            - Lista usuários atribuídos
DELETE /leads/:id/assigned-users/:userId    - Remove atribuição
```

### Importação WhatsApp
```
POST /whatsapp/:id/import-leads             - Importa leads manualmente
GET  /whatsapp/:id/import-status            - Verifica status de importação
```

### Automático (Sem Endpoint - Automático)
```
- Processamento de mensagens recebidas
- Criação automática de leads
- Atualização de scores
- Registro de atividades
```

---

## Benefícios do Sistema

### 1. Flexibilidade Total
- ✅ Mesmo lead pode ter múltiplos corretores
- ✅ Permissões granulares por função
- ✅ Importação automática e manual

### 2. Automação Inteligente
- ✅ Leads criados automaticamente de mensagens
- ✅ Detecção inteligente por palavras-chave
- ✅ Atribuição automática de usuários

### 3. Controle Gerencial
- ✅ Diretores veem tudo
- ✅ Gerentes supervisionam equipes
- ✅ Corretores focam em seus leads
- ✅ Auditoria completa via activities

### 4. Eficiência Operacional
- ✅ Nenhum lead perdido
- ✅ Resposta rápida a mensagens
- ✅ Colaboração entre equipes
- ✅ Histórico completo de interações

---

**MaisCRM** - CRM Imobiliário Profissional 🏠
Sistema completo com permissões multi-nível e importação automática!
