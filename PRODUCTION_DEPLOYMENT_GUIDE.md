# Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying the real estate CRM system to production with high availability, security, and performance.

## Table of Contents

1. [Infrastructure Requirements](#infrastructure-requirements)
2. [Environment Configuration](#environment-configuration)
3. [Database Setup](#database-setup)
4. [Redis Configuration](#redis-configuration)
5. [Application Deployment](#application-deployment)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Logging](#monitoring--logging)
8. [Backup & Recovery](#backup--recovery)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

---

## Infrastructure Requirements

### Minimum Requirements

**Application Server:**
- CPU: 4 cores
- RAM: 8GB
- Storage: 50GB SSD
- OS: Ubuntu 22.04 LTS or similar

**Database Server (PostgreSQL):**
- CPU: 4 cores
- RAM: 16GB
- Storage: 200GB SSD with backup
- OS: Ubuntu 22.04 LTS

**Redis Server:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- OS: Ubuntu 22.04 LTS

### Recommended Production Setup

**Application Servers (Load Balanced):**
- 2-3 instances minimum
- CPU: 8 cores
- RAM: 16GB
- Auto-scaling enabled

**Database (Managed Service):**
- Supabase Professional or PostgreSQL cluster
- High availability setup
- Automated backups
- Read replicas for reporting

**Redis (Managed Service):**
- Redis Cloud or AWS ElastiCache
- Cluster mode enabled
- Persistence enabled
- Automatic failover

**Load Balancer:**
- AWS ALB, Google Cloud Load Balancer, or NGINX
- SSL/TLS termination
- Health checks configured
- DDoS protection

---

## Environment Configuration

### Backend Environment Variables

Create `.env` file in `/backend`:

```bash
# Application
NODE_ENV=production
APP_VERSION=1.0.0
PORT=3000
FRONTEND_URL=https://your-domain.com
BACKEND_URL=https://api.your-domain.com

# Database (Supabase)
DATABASE_URL=postgresql://user:password@host:5432/database
DB_HOST=your-supabase-host.supabase.co
DB_NAME=postgres
DB_USER=postgres
DB_PASS=your-secure-password
DB_DIALECT=postgres
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Redis
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
REDIS_TLS=true

# JWT
JWT_SECRET=your-very-secure-random-secret-key-min-32-chars
JWT_REFRESH_SECRET=your-very-secure-refresh-secret-key
JWT_EXPIRATION=1h
JWT_REFRESH_EXPIRATION=7d

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Email (SendGrid/AWS SES/Mailgun)
EMAIL_PROVIDER=sendgrid
EMAIL_API_KEY=your-email-api-key
EMAIL_FROM=noreply@your-domain.com
EMAIL_FROM_NAME=Your Company Name

# WhatsApp
WHATSAPP_SESSION_PATH=/var/lib/whatsapp-sessions
WHATSAPP_MAX_RETRY=3

# Monitoring
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/crm

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGINS=https://your-domain.com,https://www.your-domain.com

# API Keys
API_ENCRYPTION_KEY=your-32-char-encryption-key
```

### Frontend Environment Variables

Create `.env.production` in `/frontend`:

```bash
# API
VITE_API_URL=https://api.your-domain.com
VITE_WS_URL=wss://api.your-domain.com

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Application
VITE_APP_NAME=Real Estate CRM
VITE_APP_VERSION=1.0.0
VITE_ENVIRONMENT=production

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_CHAT=true
VITE_ENABLE_NOTIFICATIONS=true

# Third-party Services
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
VITE_GOOGLE_ANALYTICS_ID=your-ga-id
```

---

## Database Setup

### 1. Supabase Project Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

### 2. Database Initialization

```sql
-- Create database extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create indexes for performance
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_status ON "Leads"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_source ON "Leads"(source);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_status ON "Properties"(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_properties_city ON "Properties"(city);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contacts_phone ON "Contacts"(number);

-- Enable Row Level Security
ALTER TABLE "Leads" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Properties" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proposals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Visits" ENABLE ROW LEVEL SECURITY;
```

### 3. Database Backup Configuration

```bash
# Automated daily backups (cron job)
0 2 * * * pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > /backups/db-$(date +\%Y\%m\%d).sql.gz

# Retention policy (keep 30 days)
find /backups -name "db-*.sql.gz" -mtime +30 -delete
```

---

## Redis Configuration

### 1. Redis Setup

```bash
# Install Redis (if self-hosting)
sudo apt-get update
sudo apt-get install redis-server

# Configure Redis
sudo nano /etc/redis/redis.conf
```

**Key Configuration Settings:**

```conf
# Network
bind 0.0.0.0
port 6379
protected-mode yes
requirepass your-strong-password

# Persistence
save 900 1
save 300 10
save 60 10000

appendonly yes
appendfsync everysec

# Memory
maxmemory 2gb
maxmemory-policy allkeys-lru

# Performance
tcp-keepalive 300
timeout 0
```

### 2. Redis Monitoring

```bash
# Monitor Redis
redis-cli -h localhost -p 6379 -a your-password

# Check memory usage
INFO memory

# Check connected clients
CLIENT LIST

# Monitor commands
MONITOR
```

---

## Application Deployment

### Option 1: Docker Deployment (Recommended)

#### 1. Build Docker Images

```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

#### 2. Docker Compose

```yaml
version: '3.8'

services:
  backend:
    image: your-registry/crm-backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    image: your-registry/crm-frontend:latest
    ports:
      - "80:80"
      - "443:443"
    restart: unless-stopped
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  redis-data:
```

#### 3. Deploy

```bash
# Build images
docker-compose build

# Push to registry
docker-compose push

# Deploy
docker-compose up -d

# View logs
docker-compose logs -f

# Scale services
docker-compose up -d --scale backend=3
```

### Option 2: PM2 Deployment

#### 1. Install PM2

```bash
npm install -g pm2

# Setup PM2 startup
pm2 startup
```

#### 2. PM2 Configuration

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'crm-backend',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    },
    error_file: '/var/log/crm/error.log',
    out_file: '/var/log/crm/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

#### 3. Deploy with PM2

```bash
# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# View status
pm2 status

# View logs
pm2 logs crm-backend

# Restart
pm2 restart crm-backend

# Reload (zero-downtime)
pm2 reload crm-backend

# Monitor
pm2 monit
```

---

## Security Hardening

### 1. SSL/TLS Configuration

```nginx
# NGINX SSL Configuration
server {
    listen 443 ssl http2;
    server_name api.your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Firewall Configuration

```bash
# UFW Configuration
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Fail2Ban
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Security Headers

```typescript
// helmet middleware
import helmet from "helmet";

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.API_URL]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

---

## Monitoring & Logging

### 1. Application Monitoring

```typescript
// Sentry Configuration
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Express({ app })
  ]
});
```

### 2. Health Checks

```bash
# Kubernetes Health Checks
livenessProbe:
  httpGet:
    path: /health/liveness
    port: 3000
  initialDelaySeconds: 30
  periodSeconds: 10

readinessProbe:
  httpGet:
    path: /health/readiness
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
```

### 3. Log Aggregation

```yaml
# Filebeat configuration
filebeat.inputs:
  - type: log
    enabled: true
    paths:
      - /var/log/crm/*.log
    json.keys_under_root: true
    json.add_error_key: true

output.elasticsearch:
  hosts: ["https://your-elasticsearch:9200"]
  username: "elastic"
  password: "${ELASTIC_PASSWORD}"
```

---

## Backup & Recovery

### 1. Automated Backups

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Database backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME | gzip > $BACKUP_DIR/db-$TIMESTAMP.sql.gz

# Redis backup
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --rdb $BACKUP_DIR/redis-$TIMESTAMP.rdb

# File uploads backup
tar -czf $BACKUP_DIR/uploads-$TIMESTAMP.tar.gz /app/public/uploads

# Sync to S3
aws s3 sync $BACKUP_DIR s3://your-backup-bucket/

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

### 2. Disaster Recovery

```bash
# Database restore
gunzip < backup.sql.gz | psql -h $DB_HOST -U $DB_USER -d $DB_NAME

# Redis restore
redis-cli -h $REDIS_HOST -p $REDIS_PORT -a $REDIS_PASSWORD --rdb backup.rdb

# Files restore
tar -xzf uploads-backup.tar.gz -C /app/public/
```

---

## Performance Optimization

### 1. Database Optimization

```sql
-- Analyze tables
ANALYZE "Leads";
ANALYZE "Properties";
ANALYZE "Contacts";

-- Vacuum
VACUUM ANALYZE;

-- Check slow queries
SELECT * FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 10;
```

### 2. Redis Optimization

```bash
# Monitor slow commands
CONFIG SET slowlog-log-slower-than 10000
SLOWLOG GET 10

# Memory optimization
CONFIG SET maxmemory-policy allkeys-lru
CONFIG SET maxmemory 2gb
```

### 3. Application Optimization

- Enable Redis caching
- Use connection pooling
- Implement query result caching
- Optimize images and assets
- Enable gzip compression
- Use CDN for static assets

---

## Troubleshooting

### Common Issues

**1. High Memory Usage:**
```bash
# Check memory
free -h
pm2 list

# Restart application
pm2 restart all
```

**2. Database Connection Issues:**
```bash
# Check connections
SELECT count(*) FROM pg_stat_activity;

# Kill idle connections
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'idle';
```

**3. Redis Connection Issues:**
```bash
# Check Redis
redis-cli -h localhost -p 6379 -a password ping

# Restart Redis
sudo systemctl restart redis
```

**4. Application Errors:**
```bash
# View logs
pm2 logs crm-backend --lines 1000

# Check health
curl http://localhost:3000/health
```

---

## Maintenance Checklist

### Daily
- [ ] Monitor error logs
- [ ] Check health endpoints
- [ ] Review performance metrics
- [ ] Verify backups completed

### Weekly
- [ ] Review slow queries
- [ ] Check disk space
- [ ] Update security patches
- [ ] Analyze traffic patterns

### Monthly
- [ ] Database optimization
- [ ] Security audit
- [ ] Capacity planning
- [ ] Disaster recovery test

---

## Support

For production support:
- Email: devops@your-company.com
- Slack: #crm-support
- On-call: +1-XXX-XXX-XXXX

---

**Last Updated:** 2025-10-16
**Version:** 1.0.0
