# Quick Start Guide - Real Estate CRM

## 🚀 Getting Started in 15 Minutes

This guide will help you get the Real Estate CRM system running on your local machine quickly.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.x or higher ([Download](https://nodejs.org/))
- **PostgreSQL** 15.x or higher ([Download](https://www.postgresql.org/download/))
- **Redis** 7.x or higher ([Download](https://redis.io/download))
- **Git** ([Download](https://git-scm.com/downloads))

### Optional but Recommended:
- **Docker** & **Docker Compose** ([Download](https://www.docker.com/products/docker-desktop))

---

## Option 1: Quick Setup with Docker (Recommended)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd real-estate-crm
```

### Step 2: Configure Environment

```bash
# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Step 3: Update Backend `.env`

```bash
# Database (use Docker services)
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/crm_db
DB_HOST=postgres
DB_NAME=crm_db
DB_USER=postgres
DB_PASS=postgres
DB_DIALECT=postgres

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# JWT Secrets (generate new ones for production!)
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production

# Application
PORT=3000
FRONTEND_URL=http://localhost:3001
NODE_ENV=development
```

### Step 4: Update Frontend `.env`

```bash
VITE_API_URL=http://localhost:3000
VITE_WS_URL=ws://localhost:3000
```

### Step 5: Start with Docker Compose

```bash
docker-compose up -d
```

This will start:
- PostgreSQL database (port 5432)
- Redis cache (port 6379)
- Backend API (port 3000)
- Frontend UI (port 3001)

### Step 6: Access the Application

- **Frontend:** http://localhost:3001
- **Backend API:** http://localhost:3000
- **Health Check:** http://localhost:3000/health
- **API Docs:** http://localhost:3000/api-docs

### Default Credentials

```
Email: admin@admin.com
Password: 123456
```

---

## Option 2: Manual Setup (Without Docker)

### Step 1: Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd frontend
npm install
```

### Step 2: Setup PostgreSQL

```bash
# Create database
createdb crm_db

# Or using psql
psql -U postgres
CREATE DATABASE crm_db;
\q
```

### Step 3: Setup Redis

```bash
# Start Redis server
redis-server

# Or as a service (Linux)
sudo systemctl start redis

# Or using Homebrew (Mac)
brew services start redis
```

### Step 4: Configure Environment

```bash
# Backend
cd backend
cp .env.example .env

# Edit .env with your database credentials
nano .env
```

Update these values:
```bash
DB_HOST=localhost
DB_NAME=crm_db
DB_USER=postgres
DB_PASS=your-postgres-password

REDIS_HOST=localhost
REDIS_PORT=6379

JWT_SECRET=your-generated-secret
JWT_REFRESH_SECRET=your-generated-refresh-secret
```

### Step 5: Run Database Migrations

```bash
cd backend

# Run migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

### Step 6: Start the Application

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

### Step 7: Access the Application

- **Frontend:** http://localhost:3001
- **Backend:** http://localhost:3000
- **Health:** http://localhost:3000/health

---

## 🧪 Verify Installation

### 1. Check Backend Health

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-16T...",
  "uptime": 45.123,
  "services": {
    "database": { "status": "up", "responseTime": 12 },
    "redis": { "status": "up", "responseTime": 3 },
    "memory": { "status": "up", "percentage": 25.5 },
    "disk": { "status": "up", "percentage": 45.2 }
  }
}
```

### 2. Check Database Connection

```bash
# Backend should log:
# ✅ Database connected successfully
# ✅ Redis connected successfully
# ✅ Workers initialized successfully
```

### 3. Test API Endpoint

```bash
curl -X POST http://localhost:3000/sessions \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@admin.com","password":"123456"}'
```

### 4. Check Workers

```bash
# View worker status
curl http://localhost:3000/health/workers

# Check queue sizes
redis-cli
> LLEN queue:email
> LLEN queue:notification
> exit
```

---

## 📝 Common Tasks

### Create a New User

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123",
    "profile": "user"
  }'
```

### Create a Lead

```bash
curl -X POST http://localhost:3000/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "+5511999999999",
    "source": "website"
  }'
```

### List Properties

```bash
curl http://localhost:3000/properties \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🔧 Troubleshooting

### Issue: Database Connection Failed

**Solution:**
```bash
# Check if PostgreSQL is running
pg_isready

# Start PostgreSQL
sudo systemctl start postgresql

# Check connection
psql -U postgres -d crm_db
```

### Issue: Redis Connection Failed

**Solution:**
```bash
# Check if Redis is running
redis-cli ping

# Start Redis
redis-server

# Or as service
sudo systemctl start redis
```

### Issue: Port Already in Use

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue: Migration Failed

**Solution:**
```bash
# Reset database
npm run db:migrate:undo:all
npm run db:migrate

# Or recreate database
dropdb crm_db
createdb crm_db
npm run db:migrate
npm run db:seed
```

### Issue: Module Not Found

**Solution:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# For TypeScript issues
npm run build
```

### Issue: Workers Not Starting

**Solution:**
```bash
# Check Redis connection
redis-cli ping

# Check logs
npm run dev

# Look for:
# ✅ Workers initialized successfully
```

---

## 🎯 Next Steps

### 1. Configure Supabase (Recommended for Production)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### 2. Configure Email Service

Update `backend/.env`:
```bash
# SendGrid
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com

# Or AWS SES
EMAIL_PROVIDER=ses
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_REGION=us-east-1
```

### 3. Configure WhatsApp

```bash
# Connect WhatsApp via QR Code
# Access: http://localhost:3001/connections
# Scan QR code with WhatsApp app
```

### 4. Setup Monitoring

```bash
# Sentry for error tracking
SENTRY_DSN=your-sentry-dsn

# Access metrics
curl http://localhost:3000/health/metrics
```

### 5. Enable Production Features

```bash
# Update .env
NODE_ENV=production
REDIS_TLS=true
RATE_LIMIT_ENABLED=true

# Build for production
npm run build

# Start with PM2
pm2 start ecosystem.config.js
```

---

## 📚 Documentation

- **Production Deployment:** See `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Technical Architecture:** See `TECHNICAL_ARCHITECTURE.md`
- **Advanced Features:** See `ENTERPRISE_ADVANCED_FEATURES.md`
- **API Reference:** See `API_REFERENCE.md`
- **Implementation Notes:** See `FINAL_IMPLEMENTATION_NOTES.md`

---

## 🆘 Getting Help

### Check Logs

```bash
# Backend logs
npm run dev

# Or with PM2
pm2 logs backend

# Docker logs
docker-compose logs -f backend
```

### Health Checks

```bash
# Full health check
curl http://localhost:3000/health

# Liveness probe
curl http://localhost:3000/health/liveness

# Readiness probe
curl http://localhost:3000/health/readiness

# Metrics
curl http://localhost:3000/health/metrics
```

### Database Queries

```bash
# Check tables
psql -U postgres -d crm_db -c "\dt"

# Check users
psql -U postgres -d crm_db -c "SELECT * FROM \"Users\";"

# Check leads
psql -U postgres -d crm_db -c "SELECT * FROM \"Leads\" LIMIT 5;"
```

### Redis Commands

```bash
redis-cli

# Check connection
PING

# List all keys
KEYS *

# Check queue sizes
LLEN queue:email
LLEN queue:notification

# Get cache stats
GET cache:stats:hits
GET cache:stats:misses

# Clear cache
FLUSHDB
```

---

## 🎓 Learning Path

### For Developers

1. Read `TECHNICAL_ARCHITECTURE.md` to understand the system
2. Review `backend/src/services/` for business logic
3. Explore `backend/src/controllers/` for API endpoints
4. Check `frontend/src/pages/` for UI components

### For Operators

1. Read `PRODUCTION_DEPLOYMENT_GUIDE.md`
2. Set up monitoring and alerts
3. Configure backups
4. Review security checklist

### For Business Users

1. Check `MAISCRM_GUIDE.md` for features
2. Review `ADVANCED_FEATURES.md` for capabilities
3. Test the demo environment

---

## ✅ Quick Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL 15+ installed and running
- [ ] Redis 7+ installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Database migrations run (`npm run db:migrate`)
- [ ] Backend running (`npm run dev`)
- [ ] Frontend running (`npm run dev`)
- [ ] Health check passing (http://localhost:3000/health)
- [ ] Login successful with default credentials

---

## 🚀 You're Ready!

Your Real Estate CRM system is now running!

Start by:
1. Logging in with admin@admin.com / 123456
2. Creating your first property
3. Adding a new lead
4. Scheduling a visit

For production deployment, continue to `PRODUCTION_DEPLOYMENT_GUIDE.md`.

---

**Need Help?**
- 📖 Check the documentation files in the project root
- 🐛 Review logs for error messages
- 💬 Contact: support@yourcompany.com

---

**Last Updated:** October 16, 2025
**Version:** 1.0.0
