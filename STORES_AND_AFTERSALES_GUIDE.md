## Sistema de Lojas/Filiais e Pós-Vendas - MaisCRM

## Índice
1. [Sistema de Lojas e Filiais](#sistema-de-lojas-e-filiais)
2. [Vinculação Usuário-Loja](#vinculação-usuário-loja)
3. [Permissões por Loja](#permissões-por-loja)
4. [Sistema Completo de Pós-Vendas](#sistema-completo-de-pós-vendas)
5. [Gestão de Documentos](#gestão-de-documentos)
6. [Timeline e Histórico](#timeline-e-histórico)
7. [Checklist Automático](#checklist-automático)

---

## Sistema de Lojas e Filiais

### Visão Geral
Sistema hierárquico que permite imobiliárias gerenciarem múltiplas lojas, filiais e franquias com controle granular de dados e permissões.

### Tipos de Loja

#### 1. Headquarters (Matriz)
- Loja principal da imobiliária
- Pode visualizar dados de todas as filiais
- Gerencia configurações globais

#### 2. Branch (Filial)
- Filial própria da imobiliária
- Vinculada à matriz via `parent_store_id`
- Compartilha alguns dados com matriz

#### 3. Franchise (Franquia)
- Franquia independente
- Dados isolados por padrão
- Pode ter configurações próprias

### Estrutura de Dados

```typescript
interface Store {
  id: number;
  name: string;              // Nome da loja
  code: string;              // Código único (ex: "SP001")
  type: "headquarters" | "branch" | "franchise";
  cnpj: string;              // CNPJ da loja
  email: string;             // Email da loja
  phone: string;             // Telefone
  address: string;           // Endereço completo
  city: string;              // Cidade
  state: string;             // Estado (UF)
  zipCode: string;           // CEP
  managerId: number;         // ID do gerente responsável
  parentStoreId?: number;    // ID da loja matriz (para filiais)
  isActive: boolean;         // Se está ativa
  settings: object;          // Configurações específicas
}
```

### API de Lojas

#### Criar Loja
```http
POST /stores
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mais Imóveis - Moema",
  "code": "SP-MOEMA",
  "type": "branch",
  "cnpj": "12.345.678/0001-90",
  "email": "moema@maisimoveis.com",
  "phone": "(11) 98765-4321",
  "address": "Av. Moema, 1000",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "04077-020",
  "managerId": 5,
  "parentStoreId": 1
}
```

#### Listar Lojas
```http
GET /stores?type=branch&isActive=true
Authorization: Bearer {token}
```

#### Detalhes da Loja
```http
GET /stores/:id
Authorization: Bearer {token}
```

Resposta inclui:
- Dados da loja
- Gerente
- Loja matriz (se filial)
- Filiais (se matriz)
- Usuários vinculados
- Estatísticas

---

## Vinculação Usuário-Loja

### Conceito
**Cada usuário pode estar vinculado a múltiplas lojas**, permitindo que trabalhem em diferentes unidades.

### Modelo de Vinculação

```typescript
interface UserStore {
  userId: number;
  storeId: number;
  isPrimary: boolean;        // Se é a loja principal do usuário
  permissions: {
    can_manage_stores?: boolean;
    can_manage_users?: boolean;
    can_view_all_data?: boolean;
    can_create_leads?: boolean;
    can_edit_leads?: boolean;
    can_delete_leads?: boolean;
  };
}
```

### API de Vinculação

#### Vincular Usuário a Loja
```http
POST /stores/:storeId/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 8,
  "isPrimary": false,
  "permissions": {
    "can_create_leads": true,
    "can_edit_leads": true,
    "can_view_all_data": false
  }
}
```

#### Listar Usuários da Loja
```http
GET /stores/:storeId/users
Authorization: Bearer {token}
```

#### Listar Lojas do Usuário
```http
GET /users/:userId/stores
Authorization: Bearer {token}
```

Resposta:
```json
{
  "stores": [
    {
      "id": 1,
      "name": "Mais Imóveis - Matriz",
      "code": "SP-MATRIZ",
      "isPrimary": true,
      "permissions": {
        "can_manage_stores": true,
        "can_manage_users": true,
        "can_view_all_data": true
      }
    },
    {
      "id": 3,
      "name": "Mais Imóveis - Moema",
      "code": "SP-MOEMA",
      "isPrimary": false,
      "permissions": {
        "can_create_leads": true,
        "can_edit_leads": true
      }
    }
  ]
}
```

---

## Permissões por Loja

### Sistema de Permissões Hierárquico

As permissões funcionam em 3 níveis:

#### Nível 1: Role Global (Director, Manager, Broker, User)
Define permissões base do usuário no sistema

#### Nível 2: Loja (Store)
Define a qual loja o usuário tem acesso

#### Nível 3: Permissões Específicas na Loja
Define O QUE o usuário pode fazer NAQUELA loja

### Exemplo Prático

```javascript
// Usuário João é Broker (role global)
user.profile = "broker"

// João trabalha em 2 lojas:
// Loja 1 (Moema) - Permissões completas
UserStore.create({
  userId: 8,
  storeId: 1,
  isPrimary: true,
  permissions: {
    can_create_leads: true,
    can_edit_leads: true,
    can_delete_leads: false,
    can_view_all_data: true
  }
});

// Loja 2 (Pinheiros) - Apenas visualização
UserStore.create({
  userId: 8,
  storeId: 2,
  isPrimary: false,
  permissions: {
    can_create_leads: false,
    can_edit_leads: false,
    can_view_all_data: false
  }
});
```

### Verificação de Permissões com Loja

```typescript
// Middleware atualizado
export const checkStorePermission = (permission: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const userId = req.user.id;
    const storeId = req.body.storeId || req.query.storeId;

    const userStore = await UserStore.findOne({
      where: { userId, storeId }
    });

    if (!userStore) {
      return res.status(403).json({
        error: "User not authorized for this store"
      });
    }

    if (!userStore.permissions[permission]) {
      return res.status(403).json({
        error: `Permission ${permission} denied for this store`
      });
    }

    next();
  };
};
```

### Filtros Automáticos por Loja

Todas as consultas são automaticamente filtradas pela loja do usuário:

```typescript
// Exemplo: Listar leads
GET /leads?storeId=1

// Retorna apenas leads da loja 1
// Se usuário não tem acesso à loja 1, retorna erro 403
```

---

## Sistema Completo de Pós-Vendas

### Visão Geral
Sistema profissional para gerenciar TODO o processo após a aceitação da proposta até a entrega final do imóvel.

### Fluxo Completo

```
Proposta Aceita
      ↓
[Criar Pós-Venda]
      ↓
pending → documentation → contract_signing →
payment_processing → deed_transfer → key_delivery → completed
```

### Estados do Processo

1. **pending** - Aguardando início
2. **documentation** - Coletando documentos
3. **contract_signing** - Assinatura de contratos
4. **payment_processing** - Processamento de pagamentos
5. **deed_transfer** - Transferência de escritura (venda)
6. **key_delivery** - Entrega de chaves
7. **completed** - Concluído
8. **cancelled** - Cancelado

### Estrutura de Dados

```typescript
interface AfterSales {
  id: number;
  code: string;              // Código único (ex: "AS-20251016-ABC123")
  proposalId: number;        // Proposta relacionada
  leadId: number;            // Cliente
  propertyId: number;        // Imóvel
  storeId: number;           // Loja responsável
  assignedTo: number;        // Responsável pelo processo
  status: string;            // Status atual
  type: "sale" | "rental";   // Venda ou locação
  saleValue: number;         // Valor da venda/locação
  commissionValue: number;   // Valor da comissão
  contractDate: Date;        // Data do contrato
  deliveryDate: Date;        // Data prevista de entrega
  actualDeliveryDate: Date;  // Data real de entrega
  notes: string;             // Observações
}
```

### API de Pós-Vendas

#### Criar Processo
```http
POST /after-sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "proposalId": 25,
  "storeId": 1,
  "assignedTo": 8,
  "type": "sale",
  "saleValue": 450000,
  "commissionValue": 22500,
  "contractDate": "2025-10-20",
  "deliveryDate": "2025-12-15",
  "notes": "Cliente quer entrega até o Natal"
}
```

**Resposta:**
```json
{
  "id": 1,
  "code": "AS-20251016-A1B2C3",
  "status": "pending",
  "type": "sale",
  "saleValue": 450000,
  "checklist": [
    {
      "id": 1,
      "itemName": "RG e CPF do comprador",
      "isCompleted": false,
      "isRequired": true
    }
  ]
}
```

#### Listar Processos
```http
GET /after-sales?storeId=1&status=documentation
Authorization: Bearer {token}
```

Filtros disponíveis:
- `storeId` - Filtrar por loja
- `status` - Filtrar por status
- `type` - sale ou rental
- `assignedTo` - Responsável
- `startDate` / `endDate` - Período

#### Atualizar Status
```http
PUT /after-sales/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "documentation",
  "notes": "Iniciando coleta de documentos"
}
```

#### Atribuir Responsável
```http
PUT /after-sales/:id/assign
Authorization: Bearer {token}
Content-Type: application/json

{
  "assignedTo": 12,
  "notifyUser": true
}
```

---

## Gestão de Documentos

### Visão Geral
Sistema completo para upload, verificação e aprovação de documentos necessários no processo.

### Tipos de Documentos

#### Documentação Pessoal
- `identity_document` - RG/CNH
- `proof_of_residence` - Comprovante de residência
- `proof_of_income` - Comprovante de renda
- `marriage_certificate` - Certidão de casamento
- `bank_statement` - Extrato bancário
- `tax_declaration` - Declaração de imposto de renda

#### Documentação Legal
- `purchase_contract` - Contrato de compra e venda
- `deed` - Escritura
- `registration` - Registro

#### Documentação Financeira
- `payment_receipt` - Comprovante de pagamento
- `commission_invoice` - Nota fiscal de comissão

#### Outros
- `other` - Outros documentos

### Estados do Documento

1. **pending** - Aguardando envio
2. **received** - Recebido
3. **under_review** - Em análise
4. **approved** - Aprovado
5. **rejected** - Rejeitado (com motivo)
6. **expired** - Expirado

### API de Documentos

#### Upload de Documento
```http
POST /after-sales/:id/documents
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "documentType": "identity_document",
  "documentName": "RG - João Silva",
  "file": [arquivo],
  "expiryDate": "2030-12-31",
  "notes": "RG atualizado"
}
```

#### Listar Documentos
```http
GET /after-sales/:id/documents
Authorization: Bearer {token}
```

Resposta:
```json
{
  "documents": [
    {
      "id": 1,
      "documentType": "identity_document",
      "documentName": "RG - João Silva",
      "documentUrl": "https://storage.../rg-joao.pdf",
      "fileSize": 1024000,
      "mimeType": "application/pdf",
      "status": "approved",
      "uploadedBy": {
        "id": 8,
        "name": "Ana Corretora"
      },
      "uploadedAt": "2025-10-16T10:30:00Z",
      "verifiedBy": {
        "id": 3,
        "name": "Carlos Gerente"
      },
      "verifiedAt": "2025-10-16T14:20:00Z",
      "expiryDate": "2030-12-31"
    }
  ]
}
```

#### Aprovar Documento
```http
PUT /after-sales/documents/:documentId/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Documento verificado e aprovado"
}
```

#### Rejeitar Documento
```http
PUT /after-sales/documents/:documentId/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "rejectionReason": "Documento ilegível, solicitar novo scan",
  "requiresReupload": true
}
```

### Notificações Automáticas

O sistema envia notificações automáticas:
- ✅ Quando documento é enviado
- ✅ Quando documento é aprovado
- ✅ Quando documento é rejeitado
- ✅ Quando documento está próximo do vencimento
- ✅ Quando documento expirou

---

## Timeline e Histórico

### Visão Geral
Registro completo de TODOS os eventos que acontecem no processo de pós-venda.

### Tipos de Eventos

- `status_change` - Mudança de status
- `document_uploaded` - Documento enviado
- `document_approved` - Documento aprovado
- `document_rejected` - Documento rejeitado
- `payment_received` - Pagamento recebido
- `contract_signed` - Contrato assinado
- `meeting_scheduled` - Reunião agendada
- `note_added` - Nota adicionada
- `assignment_changed` - Responsável alterado
- `other` - Outros eventos

### API de Timeline

#### Adicionar Evento
```http
POST /after-sales/:id/timeline
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventType": "meeting_scheduled",
  "eventTitle": "Reunião de assinatura agendada",
  "eventDescription": "Reunião com cliente para assinatura do contrato",
  "eventDate": "2025-10-25T14:00:00Z",
  "metadata": {
    "location": "Escritório Moema",
    "attendees": ["João Silva", "Ana Corretora", "Carlos Advogado"]
  }
}
```

#### Listar Timeline
```http
GET /after-sales/:id/timeline?limit=50
Authorization: Bearer {token}
```

Resposta:
```json
{
  "timeline": [
    {
      "id": 15,
      "eventType": "status_change",
      "eventTitle": "Status alterado para 'documentation'",
      "eventDescription": "Iniciada fase de coleta de documentos",
      "eventDate": "2025-10-16T09:00:00Z",
      "user": {
        "id": 8,
        "name": "Ana Corretora"
      },
      "metadata": {
        "previousStatus": "pending",
        "newStatus": "documentation"
      }
    },
    {
      "id": 16,
      "eventType": "document_uploaded",
      "eventTitle": "RG enviado",
      "eventDescription": "Cliente enviou documento de identidade",
      "eventDate": "2025-10-16T10:30:00Z",
      "user": {
        "id": 8,
        "name": "Ana Corretora"
      },
      "metadata": {
        "documentId": 1,
        "documentType": "identity_document"
      }
    }
  ]
}
```

### Timeline Automático

Eventos são registrados automaticamente quando:
- ✅ Status é alterado
- ✅ Documento é enviado, aprovado ou rejeitado
- ✅ Checklist item é marcado como concluído
- ✅ Responsável é alterado
- ✅ Qualquer campo importante é atualizado

---

## Checklist Automático

### Visão Geral
Sistema de checklist customizável que é criado automaticamente ao iniciar o pós-venda.

### Categorias

1. **documentation** - Documentação
2. **financial** - Financeiro
3. **legal** - Jurídico
4. **property_preparation** - Preparação do imóvel
5. **delivery** - Entrega
6. **other** - Outros

### Checklist para Venda (13 itens padrão)

```typescript
[
  // Documentação (4 itens)
  { itemName: "RG e CPF do comprador", category: "documentation", isRequired: true },
  { itemName: "Comprovante de residência", category: "documentation", isRequired: true },
  { itemName: "Comprovante de renda", category: "documentation", isRequired: true },
  { itemName: "Certidão de estado civil", category: "documentation", isRequired: true },

  // Financeiro (2 itens)
  { itemName: "Sinal de entrada", category: "financial", isRequired: true },
  { itemName: "Aprovação de crédito", category: "financial", isRequired: false },

  // Jurídico (3 itens)
  { itemName: "Elaboração do contrato", category: "legal", isRequired: true },
  { itemName: "Assinatura do contrato", category: "legal", isRequired: true },
  { itemName: "Registro em cartório", category: "legal", isRequired: true },

  // Preparação do Imóvel (2 itens)
  { itemName: "Vistoria do imóvel", category: "property_preparation", isRequired: true },
  { itemName: "Limpeza do imóvel", category: "property_preparation", isRequired: false },

  // Entrega (2 itens)
  { itemName: "Entrega das chaves", category: "delivery", isRequired: true },
  { itemName: "Transferência de contas", category: "delivery", isRequired: true }
]
```

### Checklist para Locação (8 itens padrão)

```typescript
[
  // Documentação (3 itens)
  { itemName: "RG e CPF do locatário", category: "documentation", isRequired: true },
  { itemName: "Comprovante de renda", category: "documentation", isRequired: true },
  { itemName: "Referências pessoais", category: "documentation", isRequired: true },

  // Financeiro (1 item)
  { itemName: "Caução/Depósito", category: "financial", isRequired: true },

  // Jurídico (2 itens)
  { itemName: "Elaboração do contrato", category: "legal", isRequired: true },
  { itemName: "Assinatura do contrato", category: "legal", isRequired: true },

  // Preparação (1 item)
  { itemName: "Vistoria de entrada", category: "property_preparation", isRequired: true },

  // Entrega (1 item)
  { itemName: "Entrega das chaves", category: "delivery", isRequired: true }
]
```

### API de Checklist

#### Listar Checklist
```http
GET /after-sales/:id/checklist
Authorization: Bearer {token}
```

Resposta:
```json
{
  "checklist": [
    {
      "id": 1,
      "category": "documentation",
      "itemName": "RG e CPF do comprador",
      "description": "Documentos de identidade e CPF atualizados",
      "isRequired": true,
      "isCompleted": true,
      "completedBy": {
        "id": 8,
        "name": "Ana Corretora"
      },
      "completedAt": "2025-10-16T11:00:00Z",
      "dueDate": "2025-10-20",
      "order": 1
    },
    {
      "id": 2,
      "category": "documentation",
      "itemName": "Comprovante de residência",
      "isRequired": true,
      "isCompleted": false,
      "dueDate": "2025-10-20",
      "order": 2
    }
  ],
  "progress": {
    "total": 13,
    "completed": 1,
    "percentage": 7.7
  }
}
```

#### Marcar Item como Concluído
```http
PUT /after-sales/checklist/:itemId/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Documento recebido e verificado"
}
```

#### Adicionar Item Customizado
```http
POST /after-sales/:id/checklist
Authorization: Bearer {token}
Content-Type: application/json

{
  "category": "other",
  "itemName": "Aprovação do condomínio",
  "description": "Aguardar aprovação da assembleia do condomínio",
  "isRequired": true,
  "dueDate": "2025-10-30",
  "order": 14
}
```

#### Remover Item
```http
DELETE /after-sales/checklist/:itemId
Authorization: Bearer {token}
```

---

## Relatórios e Analytics

### Dashboard de Pós-Vendas

```http
GET /after-sales/analytics/dashboard?storeId=1
Authorization: Bearer {token}
```

Resposta:
```json
{
  "summary": {
    "total": 45,
    "active": 23,
    "completed": 20,
    "cancelled": 2,
    "avgDuration": 45.5
  },
  "byStatus": {
    "pending": 3,
    "documentation": 8,
    "contract_signing": 5,
    "payment_processing": 4,
    "deed_transfer": 2,
    "key_delivery": 1,
    "completed": 20,
    "cancelled": 2
  },
  "byType": {
    "sale": 30,
    "rental": 15
  },
  "revenue": {
    "totalSales": 13500000,
    "totalCommissions": 675000,
    "avgCommission": 22500
  },
  "performance": {
    "onTimeDeliveries": 18,
    "delayedDeliveries": 2,
    "onTimeRate": 90
  }
}
```

---

## Integrações

### WhatsApp
- Notificações automáticas de status
- Lembretes de documentos pendentes
- Confirmação de reuniões

### Email
- Envio de contratos
- Relatórios mensais
- Alertas de vencimento

### Storage
- Upload de documentos para S3/Storage
- Geração de URLs públicas temporárias
- Backup automático

---

## Fluxo Completo de Uso

### Cenário: Venda de Apartamento

```
1. Proposta Aceita
   - Sistema cria pós-venda automaticamente
   - Gera checklist de 13 itens
   - Envia notificação ao responsável

2. Fase de Documentação (1-2 semanas)
   - Cliente envia documentos via sistema
   - Corretor revisa e aprova
   - Timeline registra cada documento
   - Checklist atualizado automaticamente

3. Assinatura de Contrato (1 dia)
   - Reunião agendada via timeline
   - Contrato gerado e assinado
   - Upload do contrato assinado
   - Status muda para payment_processing

4. Processamento de Pagamento (2-4 semanas)
   - Acompanhamento de parcelas
   - Registro de cada pagamento
   - Notas sobre financiamento

5. Transferência de Escritura (2-3 semanas)
   - Agendamento de cartório
   - Upload de documentos registrados
   - Pagamento de taxas

6. Entrega de Chaves (1 dia)
   - Vistoria final
   - Entrega oficial
   - Checklist 100% completo
   - Status: completed

7. Pós-Entrega
   - Timeline completo disponível
   - Documentos arquivados
   - Relatórios gerados
```

---

## Resumo dos Endpoints

### Lojas
```
GET    /stores                     - Listar lojas
POST   /stores                     - Criar loja
GET    /stores/:id                 - Detalhes da loja
PUT    /stores/:id                 - Atualizar loja
DELETE /stores/:id                 - Desativar loja
GET    /stores/:id/users           - Usuários da loja
POST   /stores/:id/users           - Vincular usuário
DELETE /stores/:id/users/:userId   - Desvincular usuário
```

### Pós-Vendas
```
GET    /after-sales                       - Listar processos
POST   /after-sales                       - Criar processo
GET    /after-sales/:id                   - Detalhes
PUT    /after-sales/:id                   - Atualizar
PUT    /after-sales/:id/status            - Mudar status
PUT    /after-sales/:id/assign            - Atribuir responsável
DELETE /after-sales/:id                   - Cancelar
```

### Documentos
```
GET    /after-sales/:id/documents         - Listar documentos
POST   /after-sales/:id/documents         - Upload documento
GET    /after-sales/documents/:docId      - Detalhes do documento
PUT    /after-sales/documents/:docId/approve  - Aprovar
PUT    /after-sales/documents/:docId/reject   - Rejeitar
DELETE /after-sales/documents/:docId      - Remover
```

### Timeline
```
GET    /after-sales/:id/timeline          - Listar eventos
POST   /after-sales/:id/timeline          - Adicionar evento
```

### Checklist
```
GET    /after-sales/:id/checklist         - Listar checklist
POST   /after-sales/:id/checklist         - Adicionar item
PUT    /after-sales/checklist/:itemId/complete  - Marcar concluído
DELETE /after-sales/checklist/:itemId     - Remover item
```

---

**MaisCRM** - Sistema Completo de Gestão Imobiliária 🏢
Com lojas, filiais e pós-vendas profissional!
