# Shopify Insights - Technical Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [Architecture Details](#architecture-details)
3. [Data Models](#data-models)
4. [API Specification](#api-specification)
5. [Security Considerations](#security-considerations)
6. [Deployment Guide](#deployment-guide)
7. [Troubleshooting](#troubleshooting)

## System Overview

Shopify Insights is a multi-tenant SaaS platform that provides analytics and insights for Shopify stores. The system follows a modern full-stack architecture with clear separation of concerns.

### Key Components

1. **Frontend**: Next.js 14 with React Server Components and Client Components
2. **Backend**: Next.js API Routes (serverless functions)
3. **Database**: PostgreSQL with Prisma ORM
4. **Authentication**: NextAuth.js with JWT sessions
5. **External Integration**: Shopify Admin REST API
6. **Deployment**: Vercel with Edge Network

### Data Flow

```
Shopify Store
    ↓ (Webhooks/API Calls)
Shopify API Integration Layer
    ↓ (Transform & Validate)
Sync Service
    ↓ (Persist)
PostgreSQL Database
    ↓ (Query)
Analytics API
    ↓ (Render)
Dashboard UI
```

## Architecture Details

### Multi-Tenancy Implementation

The application uses **row-level multi-tenancy** with a shared database schema. Each table that stores tenant-specific data includes a `tenantId` column.

**Advantages:**
- Simpler infrastructure management
- Easier to scale initially
- Lower operational costs
- Simplified backups and maintenance

**Security Measures:**
- All queries filtered by `tenantId`
- JWT tokens include tenant context
- Middleware validates tenant access
- Database indexes on `tenantId` for performance

### Authentication Flow

```
1. User registers → POST /api/auth/register
   ↓
2. Password hashed with bcrypt (10 rounds)
   ↓
3. User record created in database
   ↓
4. User signs in → POST /api/auth/signin
   ↓
5. Credentials validated
   ↓
6. JWT token generated with user + tenant info
   ↓
7. Token stored in httpOnly cookie
   ↓
8. Subsequent requests include token
   ↓
9. Middleware validates token and injects session
```

### Data Synchronization

The system uses a **hybrid sync approach**:

#### 1. Webhooks (Real-time)
- Shopify sends POST requests on data changes
- HMAC signature verification for security
- Immediate database updates
- Best for: New orders, customer updates

#### 2. Scheduled Sync (Batch)
- Runs every 6 hours via Vercel Cron
- Fetches all data to ensure consistency
- Handles: Missed webhooks, deleted items
- Best for: Data reconciliation

#### 3. Manual Sync (On-demand)
- User-triggered from dashboard
- Useful for initial setup
- Provides immediate feedback

### State Management

- **Server State**: React Server Components fetch data server-side
- **Client State**: React hooks (useState, useEffect) for UI state
- **Session State**: NextAuth.js manages authentication state
- **Form State**: Controlled components with local state

## Data Models

### User Model
```typescript
{
  id: string          // CUID
  email: string       // Unique
  password: string    // Bcrypt hashed
  name: string?
  role: string        // "user" | "admin"
  tenantId: string?   // FK to Tenant
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Tenant Model
```typescript
{
  id: string                 // CUID
  name: string
  shopifyDomain: string      // Unique (mystore.myshopify.com)
  shopifyAccessToken: string? // Encrypted
  shopifyApiKey: string?
  webhookSecret: string?     // For HMAC verification
  isActive: boolean
  lastSyncedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Customer Model
```typescript
{
  id: string               // CUID
  tenantId: string         // FK
  shopifyCustomerId: string // Shopify's ID
  email: string?
  firstName: string?
  lastName: string?
  phone: string?
  totalSpent: Decimal      // Precision (10,2)
  ordersCount: int
  state: string?           // enabled, disabled, invited
  shopifyCreatedAt: DateTime?
  shopifyUpdatedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
// Unique constraint: (tenantId, shopifyCustomerId)
```

### Order Model
```typescript
{
  id: string                // CUID
  tenantId: string          // FK
  shopifyOrderId: string    // Shopify's ID
  orderNumber: string?      // Human-readable
  customerId: string?       // FK to Customer
  email: string?
  financialStatus: string?  // paid, pending, refunded
  fulfillmentStatus: string? // fulfilled, partial, null
  totalPrice: Decimal
  subtotalPrice: Decimal
  totalTax: Decimal
  currency: string          // USD, EUR, etc.
  cancelledAt: DateTime?
  closedAt: DateTime?
  processedAt: DateTime?
  shopifyCreatedAt: DateTime?
  shopifyUpdatedAt: DateTime?
  createdAt: DateTime
  updatedAt: DateTime
}
// Unique constraint: (tenantId, shopifyOrderId)
```

## API Specification

### Authentication APIs

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123"
}

Response: 201 Created
{
  "user": {
    "id": "...",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

### Tenant APIs

#### Create Tenant
```http
POST /api/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "My Store",
  "shopifyDomain": "mystore.myshopify.com",
  "shopifyAccessToken": "shpat_...",
  "shopifyApiKey": "..."
}

Response: 201 Created
{
  "tenant": {
    "id": "...",
    "name": "My Store",
    "shopifyDomain": "mystore.myshopify.com",
    "isActive": true
  }
}
```

### Sync APIs

#### Trigger Sync
```http
POST /api/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "syncType": "all" // or "customers", "products", "orders"
}

Response: 200 OK
{
  "success": true,
  "result": {
    "customers": { "success": true, "itemsCount": 150 },
    "products": { "success": true, "itemsCount": 45 },
    "orders": { "success": true, "itemsCount": 320 }
  }
}
```

### Analytics APIs

#### Get Overview
```http
GET /api/analytics/overview
Authorization: Bearer <token>

Response: 200 OK
{
  "overview": {
    "totalCustomers": 150,
    "totalOrders": 320,
    "totalProducts": 45,
    "totalRevenue": 12450.50,
    "averageOrderValue": 38.91
  },
  "topCustomers": [
    {
      "id": "...",
      "email": "customer@example.com",
      "firstName": "Jane",
      "lastName": "Smith",
      "totalSpent": 1250.00,
      "ordersCount": 15
    }
  ]
}
```

#### Get Orders Over Time
```http
GET /api/analytics/orders-over-time?days=30
Authorization: Bearer <token>

Response: 200 OK
{
  "data": [
    {
      "date": "2025-01-01",
      "orders": 12,
      "revenue": 456.78
    },
    {
      "date": "2025-01-02",
      "orders": 8,
      "revenue": 321.45
    }
  ]
}
```

## Security Considerations

### 1. Authentication Security
- Passwords hashed with bcrypt (cost factor: 10)
- JWT tokens stored in httpOnly cookies
- CSRF protection via SameSite cookie attribute
- Session expiration after 30 days

### 2. Data Protection
- Multi-tenant isolation via row-level filtering
- Parameterized queries prevent SQL injection
- Input validation on all endpoints
- XSS protection via React's automatic escaping

### 3. API Security
- CORS configured for specific origins
- Rate limiting recommended for production
- Webhook signature verification (HMAC-SHA256)
- Secrets stored in environment variables

### 4. Database Security
- Connection over SSL in production
- Least-privilege database user
- Regular backups and point-in-time recovery
- Encrypted sensitive fields (access tokens)

### 5. Deployment Security
- HTTPS enforced
- Environment variables encrypted
- No secrets in code repository
- Security headers configured

## Deployment Guide

### Local Development

```bash
# 1. Install dependencies
npm install

# 2. Set up database
createdb shopify_insights
npx prisma migrate dev

# 3. Start dev server
npm run dev
```

### Production Deployment (Vercel)

```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Link project
vercel link

# 3. Set environment variables
vercel env add DATABASE_URL
vercel env add NEXTAUTH_SECRET
vercel env add CRON_SECRET

# 4. Deploy
vercel --prod

# 5. Run migrations
npx prisma migrate deploy
```

### Database Providers

**Recommended Options:**
1. **Neon** (Serverless Postgres)
   - Automatic scaling
   - 0.5GB free tier
   - Connection pooling included

2. **Supabase** (Postgres + Tools)
   - 500MB free tier
   - Built-in connection pooler
   - Realtime capabilities

3. **Railway** (Full Platform)
   - Database + app hosting
   - $5/month credit
   - Easy setup

### Environment Variables

```env
# Required
DATABASE_URL=
NEXTAUTH_URL=
NEXTAUTH_SECRET=

# Optional
CRON_SECRET=
SHOPIFY_API_KEY=
SHOPIFY_API_SECRET=
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Errors
```
Error: Can't reach database server
```
**Solution:**
- Verify DATABASE_URL is correct
- Check if database is running
- Ensure firewall allows connection
- Use connection pooling for serverless

#### 2. Prisma Client Errors
```
Error: @prisma/client did not initialize
```
**Solution:**
```bash
npx prisma generate
npm run build
```

#### 3. Authentication Issues
```
Error: Invalid session
```
**Solution:**
- Clear browser cookies
- Verify NEXTAUTH_SECRET is set
- Check NEXTAUTH_URL matches deployment URL

#### 4. Sync Failures
```
Error: Shopify API error: Unauthorized
```
**Solution:**
- Verify access token is valid
- Check API scopes are correct
- Ensure store is active

#### 5. Webhook Verification Fails
```
Error: Invalid webhook signature
```
**Solution:**
- Update webhookSecret in database
- Verify HMAC calculation
- Check webhook is coming from Shopify

### Performance Optimization

1. **Database Indexes**
   - All foreign keys are indexed
   - `tenantId` indexed on all tables
   - Composite indexes on frequently queried columns

2. **Query Optimization**
   - Use Prisma's `include` carefully
   - Implement cursor-based pagination
   - Add database query timeout limits

3. **Caching Strategy**
   - Cache analytics results (Redis)
   - Use stale-while-revalidate pattern
   - Edge caching for static assets

4. **Code Splitting**
   - Lazy load chart components
   - Dynamic imports for heavy libraries
   - Tree shaking enabled

## Monitoring & Logging

### Recommended Tools

1. **Vercel Analytics**
   - Web vitals tracking
   - Traffic analysis
   - Error monitoring

2. **Sentry**
   - Error tracking
   - Performance monitoring
   - User feedback

3. **LogRocket**
   - Session replay
   - Performance monitoring
   - User behavior analysis

### Logging Strategy

```typescript
// Structured logging
console.log(JSON.stringify({
  level: 'info',
  timestamp: new Date().toISOString(),
  message: 'Sync completed',
  tenantId: tenant.id,
  itemsCount: result.itemsCount
}))
```

## Next Steps for Production

1. **Testing**
   - [ ] Unit tests (Jest)
   - [ ] Integration tests (Playwright)
   - [ ] Load testing (k6)

2. **Monitoring**
   - [ ] Set up error tracking
   - [ ] Configure performance monitoring
   - [ ] Add custom metrics

3. **Documentation**
   - [ ] API documentation (Swagger)
   - [ ] User guide
   - [ ] Video tutorials

4. **Infrastructure**
   - [ ] Set up staging environment
   - [ ] Configure CI/CD pipeline
   - [ ] Implement blue-green deployments

---

**Last Updated**: December 2025
