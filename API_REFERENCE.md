# MaisCRM - Referência Completa da API v1.0

## Índice Geral
1. [Autenticação](#autenticação)
2. [Usuários e Permissões](#usuários-e-permissões)
3. [Lojas e Filiais](#lojas-e-filiais)
4. [Leads](#leads)
5. [Propriedades](#propriedades)
6. [Visitas](#visitas)
7. [Propostas](#propostas)
8. [Pós-Vendas](#pós-vendas)
9. [WhatsApp](#whatsapp)
10. [Analytics](#analytics)

---

## Autenticação

### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "João Silva",
    "email": "joao@exemplo.com",
    "profile": "broker"
  }
}
```

### Refresh Token
```http
POST /auth/refresh
Authorization: Bearer {refresh_token}
```

---

## Usuários e Permissões

### Listar Usuários
```http
GET /users?profile=broker&storeId=1
Authorization: Bearer {token}
```

**Filtros:**
- `profile` - director, manager, broker, user
- `storeId` - Filtrar por loja
- `searchParam` - Buscar por nome/email

### Criar Usuário
```http
POST /users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Ana Corretora",
  "email": "ana@imobiliaria.com",
  "password": "senha123",
  "profile": "broker"
}
```

### Atualizar Perfil
```http
PUT /users/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Ana Corretora Senior",
  "profile": "manager"
}
```

### Meus Leads
```http
GET /leads/my-leads?status=active
Authorization: Bearer {token}
```

---

## Lojas e Filiais

### Listar Lojas
```http
GET /stores?type=branch&isActive=true
Authorization: Bearer {token}
```

**Filtros:**
- `type` - headquarters, branch, franchise
- `isActive` - true/false
- `parentStoreId` - ID da matriz
- `searchParam` - Buscar por nome/código/cidade

**Resposta:**
```json
{
  "stores": [
    {
      "id": 1,
      "name": "Mais Imóveis - Moema",
      "code": "SP-MOEMA",
      "type": "branch",
      "cnpj": "12.345.678/0001-90",
      "city": "São Paulo",
      "state": "SP",
      "isActive": true,
      "manager": {
        "id": 5,
        "name": "Carlos Gerente"
      },
      "parentStore": {
        "id": 1,
        "name": "Mais Imóveis - Matriz",
        "code": "SP-MATRIZ"
      }
    }
  ],
  "count": 5,
  "hasMore": false
}
```

### Criar Loja
```http
POST /stores
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Mais Imóveis - Pinheiros",
  "code": "SP-PINH",
  "type": "branch",
  "cnpj": "12.345.678/0002-71",
  "email": "pinheiros@maisimoveis.com",
  "phone": "(11) 98765-4321",
  "address": "Rua dos Pinheiros, 500",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "05422-000",
  "managerId": 8,
  "parentStoreId": 1
}
```

### Detalhes da Loja
```http
GET /stores/:id
Authorization: Bearer {token}
```

**Resposta inclui:**
- Dados da loja
- Gerente
- Loja matriz (se filial)
- Filiais (se matriz)
- Usuários vinculados

### Vincular Usuário à Loja
```http
POST /stores/:storeId/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "userId": 12,
  "isPrimary": false,
  "permissions": {
    "can_create_leads": true,
    "can_edit_leads": true,
    "can_view_all_data": false
  }
}
```

### Remover Usuário da Loja
```http
DELETE /stores/:storeId/users/:userId
Authorization: Bearer {token}
```

---

## Leads

### Listar Leads
```http
GET /leads?status=active&storeId=1&assignedTo=5
Authorization: Bearer {token}
```

**Filtros:**
- `status` - new, active, qualified, converted
- `source` - whatsapp, website, referral
- `storeId` - Filtrar por loja
- `assignedTo` - Usuário responsável
- `stageId` - Estágio no pipeline
- `searchParam` - Buscar por nome/email/telefone

### Criar Lead
```http
POST /leads
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Maria Santos",
  "email": "maria@email.com",
  "phone": "11999998888",
  "source": "whatsapp",
  "propertyType": "apartment",
  "budgetMin": 400000,
  "budgetMax": 600000,
  "preferredLocations": ["Moema", "Vila Mariana"],
  "notes": "Cliente quer comprar até dezembro"
}
```

### Qualificar Lead
```http
POST /leads/:id/qualify
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "isQualified": true,
  "qualificationScore": 85,
  "matchingProperties": [...],
  "recommendations": [
    "Lead qualificado e pronto para apresentação de imóveis"
  ],
  "nextActions": [
    "Apresentar 5 imóveis compatíveis",
    "Agendar visita ao imóvel mais adequado"
  ]
}
```

### Matching de Propriedades
```http
GET /leads/:id/match-properties?limit=10
Authorization: Bearer {token}
```

### Atribuir Usuários ao Lead
```http
POST /leads/:id/assign-users
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
      "canEdit": true
    }
  ]
}
```

---

## Propriedades

### Busca Avançada
```http
GET /properties/search?type=apartment&city=São Paulo&priceMin=500000&priceMax=1000000
Authorization: Bearer {token}
```

**Filtros Disponíveis:**
- `query` - Busca textual (título, descrição, endereço)
- `type` - apartment, house, penthouse, land (separar por vírgula)
- `status` - available, sold, rented (separar por vírgula)
- `city` - Cidades (separar por vírgula)
- `priceMin` / `priceMax` - Faixa de preço
- `areaMin` / `areaMax` - Faixa de área
- `bedrooms` - Número de quartos (separar por vírgula)
- `bathrooms` - Número de banheiros
- `parkingSpaces` - Vagas de garagem
- `sortBy` - price, area, createdAt
- `sortOrder` - ASC, DESC
- `limit` - Itens por página (padrão: 20)
- `offset` - Offset para paginação

**Resposta:**
```json
{
  "properties": [...],
  "total": 42,
  "filters": {
    "availableTypes": ["apartment", "house", "penthouse"],
    "availableCities": ["São Paulo", "Santos"],
    "priceRange": {
      "min": 150000,
      "max": 5000000
    },
    "areaRange": {
      "min": 45,
      "max": 350
    }
  }
}
```

### Criar Propriedade
```http
POST /properties
Authorization: Bearer {token}
Content-Type: application/json

{
  "title": "Apartamento 3 quartos - Moema",
  "description": "Lindo apartamento com vista privilegiada",
  "type": "apartment",
  "status": "available",
  "price": 850000,
  "area": 120,
  "bedrooms": 3,
  "bathrooms": 2,
  "parkingSpaces": 2,
  "address": "Rua das Flores, 123",
  "city": "São Paulo",
  "state": "SP",
  "zipCode": "04077-020",
  "features": [
    "Piscina",
    "Academia",
    "Salão de festas",
    "Varanda gourmet"
  ],
  "images": [
    "https://storage.../img1.jpg",
    "https://storage.../img2.jpg"
  ],
  "publicUrl": "apartamento-moema-3-quartos"
}
```

### Analytics da Propriedade
```http
GET /properties/:id/analytics
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "views": 150,
  "visits": {
    "total": 12,
    "scheduled": 3,
    "completed": 8,
    "cancelled": 1
  },
  "proposals": {
    "total": 5,
    "accepted": 1,
    "pending": 2,
    "rejected": 2
  },
  "conversionRate": 20,
  "daysOnMarket": 45,
  "avgViewsPerDay": 3.3,
  "lastActivity": "2025-10-15T14:30:00Z",
  "avgProposalValue": 825000
}
```

---

## Visitas

### Agendar Visita (com validação)
```http
POST /visits/schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "propertyId": 1,
  "contactId": 5,
  "leadId": 3,
  "scheduledDate": "2025-10-25T14:00:00Z",
  "notes": "Cliente prefere tarde"
}
```

**Se houver conflito:**
```json
{
  "visit": null,
  "conflicts": [
    {
      "id": 10,
      "scheduledDate": "2025-10-25T14:00:00Z",
      "contact": { "name": "João Silva" }
    }
  ],
  "suggestions": [
    "2025-10-25T15:00:00Z",
    "2025-10-25T16:00:00Z",
    "2025-10-25T17:00:00Z"
  ]
}
```

### Verificar Disponibilidade
```http
GET /visits/availability?propertyId=1&date=2025-10-25
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "availability": [
    { "time": "09:00", "available": true },
    { "time": "10:00", "available": false, "visitId": 8 },
    { "time": "11:00", "available": true },
    { "time": "14:00", "available": true },
    { "time": "15:00", "available": true }
  ]
}
```

### Atualizar Status da Visita
```http
PUT /visits/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "completed",
  "feedback": "Cliente gostou muito do imóvel"
}
```

---

## Propostas

### Gerar Proposta com Template
```http
POST /proposals/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "leadId": 3,
  "propertyId": 1,
  "proposedValue": 850000,
  "downPayment": 170000,
  "installments": 12,
  "notes": "Proposta especial para fechamento rápido",
  "template": "premium"
}
```

**Templates disponíveis:**
- `standard` - Proposta comercial padrão
- `premium` - Proposta executiva

### Enviar Proposta
```http
POST /proposals/:id/send
Authorization: Bearer {token}
Content-Type: application/json

{
  "sendNotification": true
}
```

### Mudar Status da Proposta
```http
POST /proposals/:id/change-status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "accepted"
}
```

**Status válidos:**
- `draft` - Rascunho
- `sent` - Enviada
- `viewed` - Visualizada
- `negotiating` - Em negociação
- `accepted` - Aceita (cria pós-venda automaticamente)
- `rejected` - Rejeitada

---

## Pós-Vendas

### Criar Processo de Pós-Venda
```http
POST /after-sales
Authorization: Bearer {token}
Content-Type: application/json

{
  "proposalId": 25,
  "storeId": 1,
  "assignedTo": 8,
  "type": "sale",
  "saleValue": 850000,
  "commissionValue": 42500,
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
  "saleValue": 850000,
  "commissionValue": 42500,
  "lead": {...},
  "property": {...},
  "store": {...}
}
```

### Listar Processos
```http
GET /after-sales?storeId=1&status=documentation&type=sale
Authorization: Bearer {token}
```

**Filtros:**
- `storeId` - Loja
- `status` - pending, documentation, contract_signing, payment_processing, deed_transfer, key_delivery, completed, cancelled
- `type` - sale, rental
- `assignedTo` - Responsável
- `searchParam` - Buscar por código, nome do lead ou imóvel
- `startDate` / `endDate` - Período

**Resposta inclui estatísticas:**
```json
{
  "afterSales": [...],
  "count": 23,
  "hasMore": true,
  "stats": {
    "total": 23,
    "byStatus": {
      "pending": 3,
      "documentation": 8,
      "contract_signing": 5,
      "completed": 7
    },
    "byType": {
      "sale": 18,
      "rental": 5
    }
  }
}
```

### Detalhes Completos
```http
GET /after-sales/:id
Authorization: Bearer {token}
```

**Resposta inclui:**
- Dados do processo
- Todos os documentos
- Timeline completa (últimos 50 eventos)
- Checklist completo
- Progresso do checklist

### Atualizar Status
```http
PUT /after-sales/:id/status
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "documentation",
  "notes": "Iniciando coleta de documentos"
}
```

**Notificações automáticas são enviadas ao cliente**

### Upload de Documento
```http
POST /after-sales/:id/documents
Authorization: Bearer {token}
Content-Type: application/json

{
  "documentType": "identity_document",
  "documentName": "RG - João Silva",
  "documentUrl": "https://storage.../rg-joao.pdf",
  "fileSize": 1024000,
  "mimeType": "application/pdf",
  "expiryDate": "2030-12-31",
  "notes": "RG atualizado"
}
```

**Tipos de documentos:**
- `identity_document` - RG/CNH
- `proof_of_residence` - Comprovante de residência
- `proof_of_income` - Comprovante de renda
- `marriage_certificate` - Certidão de casamento
- `bank_statement` - Extrato bancário
- `tax_declaration` - Declaração de IR
- `purchase_contract` - Contrato de compra e venda
- `deed` - Escritura
- `registration` - Registro
- `payment_receipt` - Comprovante de pagamento
- `commission_invoice` - Nota fiscal de comissão
- `other` - Outros

### Aprovar Documento
```http
PUT /after-sales/documents/:documentId/approve
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Documento verificado e aprovado"
}
```

### Rejeitar Documento
```http
PUT /after-sales/documents/:documentId/reject
Authorization: Bearer {token}
Content-Type: application/json

{
  "rejectionReason": "Documento ilegível, solicitar novo scan"
}
```

**Cliente recebe notificação automática via WhatsApp**

### Adicionar Evento à Timeline
```http
POST /after-sales/:id/timeline
Authorization: Bearer {token}
Content-Type: application/json

{
  "eventType": "meeting_scheduled",
  "eventTitle": "Reunião de assinatura agendada",
  "eventDescription": "Reunião com cliente para assinatura do contrato",
  "metadata": {
    "location": "Escritório Moema",
    "date": "2025-10-25T14:00:00Z"
  }
}
```

### Concluir Item do Checklist
```http
PUT /after-sales/checklist/:itemId/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "notes": "Documento recebido e verificado"
}
```

### Adicionar Item ao Checklist
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

**Categorias:**
- `documentation` - Documentação
- `financial` - Financeiro
- `legal` - Jurídico
- `property_preparation` - Preparação do imóvel
- `delivery` - Entrega
- `other` - Outros

### Dashboard de Pós-Vendas
```http
GET /after-sales/dashboard?storeId=1
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "summary": {
    "total": 45,
    "active": 23,
    "completed": 20,
    "cancelled": 2,
    "avgDuration": 45
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
  }
}
```

---

## WhatsApp

### Importar Leads do WhatsApp
```http
POST /whatsapp/:whatsappId/import-leads
Authorization: Bearer {token}
Content-Type: application/json

{
  "maxContacts": 100,
  "onlyWithMessages": true
}
```

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
    }
  ]
}
```

### Status da Importação
```http
GET /whatsapp/:whatsappId/import-status
Authorization: Bearer {token}
```

---

## Analytics

### Dashboard Executivo
```http
GET /analytics/dashboard
Authorization: Bearer {token}
```

**Resposta:**
```json
{
  "leads": {
    "total": 450,
    "new": 35,
    "active": 180,
    "converted": 150,
    "avgScore": 72
  },
  "properties": {
    "total": 125,
    "available": 85,
    "sold": 30,
    "rented": 10,
    "avgPrice": 650000
  },
  "visits": {
    "total": 230,
    "scheduled": 45,
    "completed": 175,
    "cancelled": 10,
    "conversionRate": 65
  },
  "proposals": {
    "total": 120,
    "pending": 25,
    "accepted": 45,
    "rejected": 50,
    "avgValue": 625000
  },
  "tickets": {
    "total": 580,
    "open": 45,
    "pending": 15,
    "closed": 520
  },
  "performance": {
    "currentMonth": {...},
    "lastMonth": {...},
    "growth": {...}
  }
}
```

---

## Códigos de Erro

### 400 - Bad Request
- Dados inválidos ou faltando
- Formato incorreto

### 401 - Unauthorized
- Token não fornecido
- Token inválido ou expirado

### 403 - Forbidden
- Sem permissão para essa ação
- Tentativa de acessar dados de outra loja

### 404 - Not Found
- Recurso não encontrado

### 409 - Conflict
- Conflito de horário (visitas)
- Recurso já existe

### 500 - Internal Server Error
- Erro no servidor

---

## Paginação

Endpoints de listagem suportam paginação:

```http
GET /leads?pageNumber=2
```

**Resposta padrão:**
```json
{
  "items": [...],
  "count": 150,
  "hasMore": true
}
```

- `pageNumber` - Página atual (padrão: 1)
- `limit` - Itens por página (padrão: 20)
- `count` - Total de itens
- `hasMore` - Se há mais páginas

---

## Rate Limiting

- **Limite:** 100 requisições por minuto por IP
- **Headers de resposta:**
  - `X-RateLimit-Limit` - Limite total
  - `X-RateLimit-Remaining` - Requisições restantes
  - `X-RateLimit-Reset` - Timestamp do reset

---

## Webhooks (Futuro)

Em desenvolvimento:
- Notificação de novos leads
- Mudança de status de propostas
- Documentos aprovados/rejeitados
- Visitas agendadas/concluídas

---

## Versionamento

- **Versão Atual:** v1.0
- **Base URL:** `https://api.maiscrm.com/v1`
- **Backward Compatibility:** Mantida por 6 meses

---

## Suporte

- **Email:** suporte@maiscrm.com
- **Documentação:** https://docs.maiscrm.com
- **Status:** https://status.maiscrm.com

---

**MaisCRM API v1.0** - Documentação Completa
Última atualização: 2025-10-16
