# Technical Architecture Guide

## System Overview

This document provides a comprehensive technical overview of the real estate CRM system architecture, design patterns, and implementation details.

## Table of Contents

1. [Architecture Layers](#architecture-layers)
2. [Technology Stack](#technology-stack)
3. [Design Patterns](#design-patterns)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Scalability Considerations](#scalability-considerations)
7. [Code Organization](#code-organization)
8. [Best Practices](#best-practices)

---

## Architecture Layers

### 1. Presentation Layer (Frontend)

**Technology:** React + Vite + Material-UI

**Responsibilities:**
- User interface rendering
- Client-side state management
- Form validation
- Real-time updates via WebSockets
- Client-side routing

**Structure:**
```
frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Page-level components
│   ├── context/        # React Context providers
│   ├── hooks/          # Custom React hooks
│   ├── services/       # API client services
│   ├── routes/         # Routing configuration
│   └── translate/      # Internationalization
```

### 2. Application Layer (Backend)

**Technology:** Node.js + Express + TypeScript

**Responsibilities:**
- Business logic implementation
- Request validation
- Authentication & authorization
- Data transformation
- Integration with external services

**Structure:**
```
backend/
├── src/
│   ├── controllers/    # Request handlers
│   ├── services/       # Business logic
│   ├── models/         # Data models (Sequelize)
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── helpers/        # Utility functions
│   ├── workers/        # Background jobs
│   └── config/         # Configuration files
```

### 3. Data Layer

**Database:** PostgreSQL (via Supabase)

**Responsibilities:**
- Data persistence
- Data integrity constraints
- Complex queries
- Row Level Security (RLS)

**Cache:** Redis

**Responsibilities:**
- Session storage
- Query result caching
- Rate limiting counters
- Job queues

### 4. Integration Layer

**Services:**
- WhatsApp API (whatsapp-web.js)
- Email services (SendGrid/AWS SES)
- File storage (Supabase Storage)
- External APIs

---

## Technology Stack

### Backend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Runtime | Node.js | 18.x | JavaScript runtime |
| Framework | Express | 4.x | Web framework |
| Language | TypeScript | 4.x | Type safety |
| ORM | Sequelize | 5.x | Database ORM |
| Database | PostgreSQL | 15.x | Primary database |
| Cache | Redis | 7.x | Caching & sessions |
| Auth | JWT | 8.x | Authentication |
| Validation | Yup | 0.32.x | Schema validation |
| WebSocket | Socket.io | 3.x | Real-time communication |
| Logging | Pino | 6.x | Structured logging |

### Frontend Stack

| Component | Technology | Version | Purpose |
|-----------|-----------|---------|---------|
| Framework | React | 18.x | UI framework |
| Build Tool | Vite | 4.x | Build tooling |
| UI Library | Material-UI | 5.x | Component library |
| State | React Context | - | State management |
| HTTP Client | Axios | 1.x | API communication |
| i18n | i18next | 21.x | Internationalization |

### DevOps Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Container | Docker | Application containerization |
| Orchestration | Docker Compose | Multi-container deployment |
| Process Manager | PM2 | Node.js process management |
| Reverse Proxy | NGINX | Load balancing & SSL |
| Monitoring | Sentry | Error tracking |
| CI/CD | GitHub Actions | Automated deployment |

---

## Design Patterns

### 1. MVC Pattern

**Model-View-Controller architecture:**

```typescript
// Controller Layer
class LeadController {
  async store(req: Request, res: Response) {
    // Validate input
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().email()
    });

    await schema.validate(req.body);

    // Delegate to service
    const lead = await CreateLeadService(req.body);

    // Return response
    return res.status(201).json(lead);
  }
}

// Service Layer (Business Logic)
const CreateLeadService = async (data) => {
  // Business logic
  const lead = await Lead.create(data);

  // Side effects
  await SendNewLeadNotification({ leadId: lead.id });

  return lead;
};

// Model Layer (Data)
class Lead extends Model {
  @Column
  name: string;

  @Column
  email: string;

  @HasMany(() => Visit)
  visits: Visit[];
}
```

### 2. Repository Pattern

```typescript
// Abstract repository
interface IRepository<T> {
  findAll(options?: any): Promise<T[]>;
  findById(id: number): Promise<T | null>;
  create(data: Partial<T>): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

// Implementation
class LeadRepository implements IRepository<Lead> {
  async findAll(options?: FindOptions): Promise<Lead[]> {
    return await Lead.findAll(options);
  }

  async findById(id: number): Promise<Lead | null> {
    return await Lead.findByPk(id);
  }

  // ... other methods
}
```

### 3. Service Pattern

```typescript
// Service with single responsibility
class LeadScoringService {
  async calculateScore(leadId: number): Promise<number> {
    const lead = await Lead.findByPk(leadId);

    let score = 0;

    // Scoring logic
    if (lead.email) score += 20;
    if (lead.phone) score += 20;
    if (lead.budgetMax) score += 30;

    await lead.update({ score });

    return score;
  }
}
```

### 4. Factory Pattern

```typescript
// Worker factory
class WorkerFactory {
  static create(type: string): BaseWorker {
    switch (type) {
      case 'email':
        return new EmailWorker();
      case 'notification':
        return new NotificationWorker();
      default:
        throw new Error(`Unknown worker type: ${type}`);
    }
  }
}

// Usage
const emailWorker = WorkerFactory.create('email');
await emailWorker.start();
```

### 5. Observer Pattern

```typescript
// Event emitter for side effects
class LeadEventEmitter extends EventEmitter {
  onLeadCreated(handler: (lead: Lead) => void) {
    this.on('lead:created', handler);
  }

  emitLeadCreated(lead: Lead) {
    this.emit('lead:created', lead);
  }
}

// Usage
leadEvents.onLeadCreated(async (lead) => {
  await SendNewLeadNotification({ leadId: lead.id });
  await CalculateLeadScoreService(lead.id);
});
```

### 6. Middleware Pattern

```typescript
// Composable middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization;

  if (!token) {
    throw new AppError("No token provided", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;

  next();
};

const authorize = (roles: string[]) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.profile)) {
      throw new AppError("Insufficient permissions", 403);
    }

    next();
  };
};

// Usage
router.post(
  '/admin/users',
  authenticate,
  authorize(['admin']),
  UserController.store
);
```

### 7. Strategy Pattern

```typescript
// Notification strategies
interface NotificationStrategy {
  send(recipient: string, message: string): Promise<void>;
}

class EmailNotification implements NotificationStrategy {
  async send(recipient: string, message: string) {
    // Send email
  }
}

class WhatsAppNotification implements NotificationStrategy {
  async send(recipient: string, message: string) {
    // Send WhatsApp message
  }
}

// Context
class NotificationService {
  constructor(private strategy: NotificationStrategy) {}

  async notify(recipient: string, message: string) {
    await this.strategy.send(recipient, message);
  }
}

// Usage
const emailNotifier = new NotificationService(new EmailNotification());
const whatsappNotifier = new NotificationService(new WhatsAppNotification());
```

---

## Data Flow

### 1. Request Flow

```
Client Request
    ↓
NGINX (SSL/Load Balancer)
    ↓
Express Middleware Stack
    ├── CORS
    ├── Body Parser
    ├── Rate Limiter
    ├── Authentication
    ├── Authorization
    └── Validation
    ↓
Controller
    ↓
Service Layer
    ├── Business Logic
    ├── Cache Check (Redis)
    ├── Database Query (PostgreSQL)
    └── External API Calls
    ↓
Response
    ├── Transform Data
    ├── Cache Result
    └── Send JSON
```

### 2. Real-time Updates

```
Client
    ↓ (WebSocket Connection)
Socket.io Server
    ↓
Event Handlers
    ├── ticket:created
    ├── message:new
    ├── lead:updated
    └── notification:new
    ↓
Broadcast to Clients
    ├── Room-based (ticketId, userId)
    └── Global events
```

### 3. Background Jobs

```
API Request
    ↓
Add Job to Queue (Redis)
    ↓
Worker Polls Queue
    ↓
Execute Job
    ├── Send Email
    ├── Process Webhook
    ├── Generate Report
    └── Sync Data
    ↓
Save Result
    ↓
Emit Event (if needed)
```

---

## Security Architecture

### 1. Authentication Flow

```
1. User Login
   ↓
2. Validate Credentials
   ↓
3. Generate Tokens
   ├── Access Token (JWT, 1h)
   └── Refresh Token (JWT, 7d)
   ↓
4. Store Refresh Token
   ├── Database (encrypted)
   └── HTTP-only Cookie
   ↓
5. Return Tokens to Client
```

### 2. Authorization

```typescript
// Role-Based Access Control (RBAC)
const permissions = {
  admin: ['*'],
  manager: ['leads:*', 'properties:*', 'users:read'],
  user: ['leads:read', 'properties:read', 'tickets:*']
};

// Check permission
const checkPermission = (req, resource, action) => {
  const userRole = req.user.profile;
  const required = `${resource}:${action}`;

  const userPerms = permissions[userRole];

  return userPerms.includes('*') ||
         userPerms.includes(`${resource}:*`) ||
         userPerms.includes(required);
};
```

### 3. Data Protection

**Encryption:**
- Passwords: bcrypt with salt rounds = 12
- Sensitive data: AES-256-GCM
- Communication: TLS 1.3

**Row Level Security (RLS):**
```sql
-- Users can only access their own leads
CREATE POLICY "Users can view own leads"
  ON leads FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can access all leads
CREATE POLICY "Admins can view all leads"
  ON leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.profile = 'admin'
    )
  );
```

---

## Scalability Considerations

### 1. Horizontal Scaling

**Application Servers:**
- Stateless design
- Load balancer distribution
- Auto-scaling based on metrics
- Health checks for instance management

**Database:**
- Read replicas for reporting
- Connection pooling
- Query optimization
- Partitioning for large tables

### 2. Caching Strategy

**Multi-level Cache:**

```typescript
// L1: In-memory cache (Node.js)
const memoryCache = new Map();

// L2: Redis cache
const redisCache = redisClient;

// L3: Database
const database = sequelize;

// Get data with fallback
async function getData(key: string) {
  // Check L1
  if (memoryCache.has(key)) {
    return memoryCache.get(key);
  }

  // Check L2
  const cached = await redisCache.get(key);
  if (cached) {
    memoryCache.set(key, cached);
    return cached;
  }

  // Fetch from L3
  const data = await database.query(/* ... */);

  // Cache in L2
  await redisCache.set(key, data, 3600);

  // Cache in L1
  memoryCache.set(key, data);

  return data;
}
```

### 3. Database Optimization

**Indexing Strategy:**
```sql
-- Frequently queried columns
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Composite indexes for complex queries
CREATE INDEX idx_properties_status_city
  ON properties(status, city);

-- Partial indexes for specific conditions
CREATE INDEX idx_active_leads
  ON leads(created_at)
  WHERE status = 'active';

-- Text search indexes
CREATE INDEX idx_properties_search
  ON properties
  USING gin(to_tsvector('portuguese', title || ' ' || description));
```

### 4. Async Processing

**Job Queue Architecture:**

```typescript
// Producer (API)
await emailWorker.addJob('welcome_email', {
  to: user.email,
  name: user.name
});

// Consumer (Worker)
emailWorker.process(async (job) => {
  await sendEmail(job.data);
});

// Benefits:
// - Non-blocking API responses
// - Retry failed jobs
// - Scale workers independently
// - Monitor job progress
```

---

## Code Organization

### 1. Service Layer Structure

```typescript
// services/LeadServices/CreateLeadService.ts
interface CreateLeadData {
  name: string;
  email?: string;
  phone: string;
  source: string;
}

const CreateLeadService = async (data: CreateLeadData): Promise<Lead> => {
  // Validation
  const schema = validateLeadData;
  await schema.validate(data);

  // Business logic
  const lead = await Lead.create(data);

  // Side effects (async)
  Promise.all([
    SendNewLeadNotification({ leadId: lead.id }),
    CalculateLeadScoreService(lead.id)
  ]).catch(error => {
    logger.error("Lead side effects failed:", error);
  });

  // Emit event
  leadEvents.emitLeadCreated(lead);

  return lead;
};

export default CreateLeadService;
```

### 2. Controller Structure

```typescript
// controllers/LeadController.ts
class LeadController {
  async index(req: Request, res: Response): Promise<Response> {
    const { page = 1, limit = 20, status } = req.query;

    const leads = await ListLeadsService({
      page: Number(page),
      limit: Number(limit),
      status: status as string
    });

    return res.json(leads);
  }

  async store(req: Request, res: Response): Promise<Response> {
    const lead = await CreateLeadService(req.body);
    return res.status(201).json(lead);
  }
}

export default new LeadController();
```

### 3. Route Organization

```typescript
// routes/leadRoutes.ts
import { Router } from "express";
import LeadController from "../controllers/LeadController";
import { isAuth } from "../middleware/isAuth";
import { validate } from "../middleware/validation";
import { validateLeadData } from "../middleware/validation";

const router = Router();

router.use(isAuth);

router.get("/", LeadController.index);
router.post(
  "/",
  validate({ body: validateLeadData }),
  LeadController.store
);
router.get("/:id", LeadController.show);
router.put("/:id", LeadController.update);
router.delete("/:id", LeadController.remove);

export default router;
```

---

## Best Practices

### 1. Error Handling

```typescript
// Custom error class
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

// Global error handler
app.use((error, req, res, next) => {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      status: "error",
      message: error.message
    });
  }

  logger.error("Unexpected error:", error);

  return res.status(500).json({
    status: "error",
    message: "Internal server error"
  });
});
```

### 2. Logging

```typescript
// Structured logging
logger.info("Lead created", {
  leadId: lead.id,
  userId: req.user.id,
  source: lead.source,
  timestamp: new Date().toISOString()
});

logger.error("Failed to send email", {
  error: error.message,
  stack: error.stack,
  leadId: lead.id
});
```

### 3. Testing

```typescript
// Unit test
describe("CreateLeadService", () => {
  it("should create a lead with valid data", async () => {
    const data = {
      name: "John Doe",
      email: "john@example.com",
      phone: "1234567890",
      source: "website"
    };

    const lead = await CreateLeadService(data);

    expect(lead).toBeDefined();
    expect(lead.name).toBe(data.name);
    expect(lead.email).toBe(data.email);
  });

  it("should throw error for invalid email", async () => {
    const data = {
      name: "John Doe",
      email: "invalid-email",
      phone: "1234567890",
      source: "website"
    };

    await expect(CreateLeadService(data)).rejects.toThrow();
  });
});
```

### 4. API Versioning

```typescript
// Version in URL
app.use("/api/v1", routesV1);
app.use("/api/v2", routesV2);

// Version in header
app.use((req, res, next) => {
  const version = req.headers["api-version"] || "1";
  req.apiVersion = version;
  next();
});
```

### 5. Documentation

```typescript
/**
 * Create a new lead
 *
 * @route POST /api/v1/leads
 * @group Leads - Lead management operations
 * @param {CreateLeadData} request.body.required - Lead data
 * @returns {Lead} 201 - Created lead
 * @returns {Error} 400 - Validation error
 * @returns {Error} 401 - Unauthorized
 * @security JWT
 */
async store(req: Request, res: Response) {
  // Implementation
}
```

---

## Conclusion

This architecture provides:

- **Scalability**: Horizontal scaling with load balancing
- **Maintainability**: Clean code organization and separation of concerns
- **Reliability**: Error handling, logging, and monitoring
- **Security**: Authentication, authorization, and data protection
- **Performance**: Caching, optimization, and async processing

The system is designed to handle enterprise-level traffic while maintaining code quality and developer productivity.

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
