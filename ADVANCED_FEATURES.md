# MaisCRM - Funcionalidades Avançadas

## Índice
1. [Qualificação Inteligente de Leads](#qualificação-inteligente-de-leads)
2. [Matching Automático de Propriedades](#matching-automático-de-propriedades)
3. [Agendamento Inteligente de Visitas](#agendamento-inteligente-de-visitas)
4. [Geração de Propostas com Templates](#geração-de-propostas-com-templates)
5. [Busca Avançada de Propriedades](#busca-avançada-de-propriedades)
6. [Sistema de Notificações](#sistema-de-notificações)

---

## Qualificação Inteligente de Leads

### Visão Geral
Sistema automático que analisa leads e fornece insights acionáveis para os corretores.

### Endpoint
```http
POST /leads/:leadId/qualify
Authorization: Bearer {token}
```

### Como Funciona

O sistema analisa automaticamente:
1. **Completude dos Dados** (40 pontos)
   - Email e telefone presentes: +20
   - Orçamento definido: +30
   - Tipo de imóvel: +15
   - Localizações preferidas: +15

2. **Engajamento** (20 pontos)
   - Atividade recente (últimos 7 dias): +20

3. **Match com Inventário** (20 pontos)
   - Possui imóveis compatíveis: +20

### Resposta
```json
{
  "isQualified": true,
  "qualificationScore": 85,
  "matchingProperties": [
    {
      "id": 1,
      "title": "Apartamento 3 quartos",
      "price": 450000,
      "city": "São Paulo"
    }
  ],
  "recommendations": [
    "Lead qualificado e pronto para apresentação de imóveis"
  ],
  "nextActions": [
    "Apresentar 5 imóveis compatíveis",
    "Agendar visita ao imóvel mais adequado"
  ]
}
```

### Quando Usar
- Ao receber um novo lead
- Após atualizar informações do lead
- Antes de iniciar processo de vendas
- Para priorizar leads na fila

---

## Matching Automático de Propriedades

### Visão Geral
Algoritmo inteligente que encontra os imóveis mais adequados para cada lead.

### Endpoint
```http
GET /leads/:leadId/match-properties?limit=20
Authorization: Bearer {token}
```

### Critérios de Matching

#### Pontuação por Critério:
- **Tipo de Imóvel** (30 pontos)
  - Tipo exato: 30 pontos

- **Preço** (40 pontos)
  - Dentro do orçamento: 40 pontos
  - Até ±20% do orçamento: 20 pontos

- **Localização** (30 pontos)
  - Cidade preferida: 30 pontos

- **Bônus Adicionais** (até 25 pontos)
  - Número ideal de quartos: +10
  - Muitos diferenciais: +10
  - Imóvel novo (< 7 dias): +5

### Exemplo de Resposta
```json
{
  "properties": [
    {
      "id": 1,
      "title": "Cobertura Duplex - Jardins",
      "price": 1200000,
      "matchScore": 95,
      "matchReasons": [
        "Tipo de imóvel corresponde",
        "Preço dentro do orçamento",
        "Localização preferida",
        "Número ideal de quartos",
        "Imóvel com muitos diferenciais"
      ]
    }
  ]
}
```

### Boas Práticas
- Execute após qualificar o lead
- Mostre top 3-5 imóveis para o cliente
- Use o matchScore para priorizar apresentações
- Acompanhe quais imóveis geram mais interesse

---

## Agendamento Inteligente de Visitas

### Visão Geral
Sistema que previne conflitos de agenda e otimiza o agendamento de visitas.

### Endpoint Principal
```http
POST /visits/schedule
Authorization: Bearer {token}
Content-Type: application/json

{
  "propertyId": 1,
  "contactId": 5,
  "leadId": 3,
  "scheduledDate": "2025-10-20T14:00:00Z",
  "notes": "Cliente prefere período da tarde"
}
```

### Detecção de Conflitos

#### Quando há conflito:
```json
{
  "visit": null,
  "conflicts": [
    {
      "id": 10,
      "scheduledDate": "2025-10-20T14:00:00Z",
      "contact": {
        "name": "João Silva"
      }
    }
  ],
  "suggestions": [
    "2025-10-20T15:00:00Z",
    "2025-10-20T16:00:00Z",
    "2025-10-20T17:00:00Z"
  ]
}
```

#### Quando agendamento é bem-sucedido:
```json
{
  "visit": {
    "id": 15,
    "propertyId": 1,
    "contactId": 5,
    "scheduledDate": "2025-10-20T14:00:00Z",
    "status": "scheduled"
  },
  "conflicts": [],
  "suggestions": []
}
```

### Verificar Disponibilidade
```http
GET /visits/availability?propertyId=1&date=2025-10-20
Authorization: Bearer {token}
```

Resposta:
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

### Automações
- ✅ Confirmação automática por WhatsApp
- ✅ Lembrete 24h antes
- ✅ Detecção de conflitos
- ✅ Sugestão de horários alternativos

---

## Geração de Propostas com Templates

### Visão Geral
Sistema profissional de geração de propostas comerciais com templates customizáveis.

### Endpoint
```http
POST /proposals/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "leadId": 3,
  "propertyId": 1,
  "proposedValue": 450000,
  "downPayment": 90000,
  "installments": 12,
  "notes": "Proposta especial para primeiro cliente",
  "template": "premium"
}
```

### Templates Disponíveis

#### 1. Standard (Padrão)
Proposta comercial clássica com:
- Apresentação
- Detalhes do Imóvel
- Condições Comerciais
- Observações
- Validade

#### 2. Premium (Executiva)
Proposta diferenciada com:
- Apresentação Executiva
- Visão Geral do Imóvel
- Diferenciais e Comodidades
- Investimento
- Próximos Passos
- Informações Adicionais

### Workflow Completo

#### 1. Gerar Proposta
```javascript
const proposal = await api.post('/proposals/generate', {
  leadId: 3,
  propertyId: 1,
  proposedValue: 450000,
  downPayment: 90000,
  installments: 12,
  template: 'premium'
});
// Status: 'draft'
```

#### 2. Revisar e Enviar
```javascript
await api.post(`/proposals/${proposal.id}/send`, {
  sendNotification: true
});
// Status: 'sent'
// Cliente recebe WhatsApp automaticamente
```

#### 3. Cliente Responde
```javascript
// Aceitar
await api.post(`/proposals/${proposal.id}/change-status`, {
  status: 'accepted'
});
// Imóvel → status: 'reserved'
// Lead → status: 'converted'

// Rejeitar
await api.post(`/proposals/${proposal.id}/change-status`, {
  status: 'rejected',
  rejectionReason: 'Valor acima do orçamento'
});
```

### Automações
- ✅ Cálculo automático de parcelas
- ✅ Formatação de valores em reais
- ✅ Notificação por WhatsApp
- ✅ Atualização de status do imóvel
- ✅ Conversão automática do lead

---

## Busca Avançada de Propriedades

### Visão Geral
Sistema de busca multi-filtro com ordenação e paginação.

### Endpoint
```http
GET /properties/search
Authorization: Bearer {token}
```

### Parâmetros Disponíveis

```javascript
const params = {
  // Busca textual
  query: 'cobertura jardins',

  // Filtros múltiplos (separados por vírgula)
  type: 'apartment,penthouse',
  status: 'available,reserved',
  city: 'São Paulo,Santos',

  // Faixas numéricas
  priceMin: 500000,
  priceMax: 2000000,
  areaMin: 80,
  areaMax: 200,

  // Arrays de números (separados por vírgula)
  bedrooms: '2,3,4',
  bathrooms: '2,3',
  parkingSpaces: '1,2',

  // Ordenação
  sortBy: 'price',        // price, area, createdAt
  sortOrder: 'DESC',      // ASC, DESC

  // Paginação
  limit: 20,
  offset: 0
};
```

### Exemplo de Resposta
```json
{
  "properties": [
    {
      "id": 1,
      "title": "Cobertura Duplex - Jardins",
      "price": 1800000,
      "area": 180,
      "bedrooms": 3,
      "bathrooms": 3,
      "parkingSpaces": 2,
      "city": "São Paulo"
    }
  ],
  "total": 42,
  "filters": {
    "availableTypes": ["apartment", "house", "penthouse"],
    "availableCities": ["São Paulo", "Santos", "Campinas"],
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

### Uso no Frontend
```javascript
// Busca básica
const results = await api.get('/properties/search', {
  params: { query: 'jardins', limit: 10 }
});

// Busca avançada
const filtered = await api.get('/properties/search', {
  params: {
    type: 'apartment',
    city: 'São Paulo',
    priceMin: 500000,
    priceMax: 1000000,
    bedrooms: '2,3',
    sortBy: 'price',
    sortOrder: 'ASC'
  }
});

// Use filters.* para popular dropdowns dinamicamente
const cities = results.filters.availableCities;
const types = results.filters.availableTypes;
```

---

## Sistema de Notificações

### Visão Geral
Sistema automático de notificações por WhatsApp e Email (estrutura pronta).

### WhatsApp - Casos de Uso

#### 1. Novo Lead (Boas-vindas)
```javascript
await SendNewLeadNotification({ leadId: 3 });
```
Mensagem enviada:
```
Olá Maria! 👋

Obrigado pelo seu interesse! Recebemos sua solicitação
e em breve entraremos em contato.

💰 Orçamento: R$ 400.000 - R$ 600.000
🏠 Tipo: Apartamento

Seu consultor será: João Silva

Estamos à disposição para ajudá-lo a encontrar o imóvel ideal!
```

#### 2. Confirmação de Visita
```javascript
await ScheduleVisitService({
  propertyId: 1,
  contactId: 5,
  scheduledDate: new Date('2025-10-20T14:00:00'),
  userId: 1
});
```
Mensagem enviada automaticamente:
```
Olá Maria! 👋

Sua visita foi agendada com sucesso!

🏠 Imóvel: Apartamento 3 quartos - Jardins
📍 Endereço: Rua das Flores, 123, São Paulo
📅 Data e Hora: 20/10/2025 14:00

Aguardamos você! Em caso de dúvidas, estamos à disposição.
```

#### 3. Lembrete de Visita (24h antes)
```javascript
await SendVisitReminder();
```
Mensagem enviada:
```
Olá Maria! 👋

Lembrando que amanhã você tem uma visita agendada ao imóvel:

📍 Apartamento 3 quartos - Jardins
🏠 Rua das Flores, 123, São Paulo
⏰ Horário: 14:00

Estamos à disposição para qualquer dúvida!
```

#### 4. Envio de Proposta
```javascript
await SendProposalService({
  proposalId: 5,
  userId: 1
});
```
Mensagem enviada:
```
Olá Maria! 🎉

Temos o prazer de enviar uma proposta para o imóvel:

🏠 Apartamento 3 quartos - Jardins
📍 Rua das Flores, 123, São Paulo

💰 Valor proposto: R$ 450.000,00
💳 Entrada: R$ 90.000,00
📊 Parcelamento: 12x

Estamos à disposição para negociar e esclarecer qualquer dúvida!
```

### Email - Estrutura Pronta

#### Tipos de Email Implementados:
1. **Welcome** - Boas-vindas ao sistema
2. **Follow-up** - Acompanhamento de leads inativos
3. **Qualification** - Notificação de qualificação
4. **Matching** - Envio de imóveis compatíveis

#### Uso:
```javascript
import SendLeadNotificationEmail from './services/NotificationServices/SendLeadNotificationEmail';

// Email de boas-vindas
await SendLeadNotificationEmail({
  leadId: 3,
  type: 'welcome'
});

// Email com matching de imóveis
await SendLeadNotificationEmail({
  leadId: 3,
  type: 'matching',
  matchingProperties: [...]
});
```

### Configuração de Email

Para ativar o envio de emails, basta integrar com um provedor:

1. **SendGrid**
2. **AWS SES**
3. **Mailgun**
4. **Resend**

Substitua a implementação em:
`backend/src/services/NotificationServices/SendEmailService.ts`

---

## Resumo de Endpoints

### Leads Avançados
```
POST /leads/:id/qualify              - Qualifica lead
GET  /leads/:id/match-properties     - Lista matches
```

### Visitas Inteligentes
```
POST /visits/schedule                - Agenda com validação
GET  /visits/availability            - Verifica disponibilidade
```

### Propostas Profissionais
```
POST /proposals/generate             - Gera com template
POST /proposals/:id/send             - Envia ao cliente
POST /proposals/:id/change-status    - Atualiza status
```

### Busca Avançada
```
GET  /properties/search              - Busca multi-filtro
```

### Analytics
```
GET  /analytics/dashboard            - Métricas consolidadas
GET  /properties/:id/analytics       - Analytics do imóvel
```

---

## Próximos Passos

1. **Testar os endpoints** usando Postman ou Insomnia
2. **Integrar no frontend** as novas funcionalidades
3. **Configurar provedor de email** se desejado
4. **Personalizar templates** de propostas
5. **Ajustar horários** de disponibilidade conforme necessário

## Suporte

Para dúvidas sobre implementação, consulte:
- `IMPLEMENTATION_SUMMARY.md` - Detalhes técnicos
- `MAISCRM_GUIDE.md` - Guia geral do sistema
- Código-fonte dos services para exemplos

---

**MaisCRM** - CRM Imobiliário Profissional 🏠
