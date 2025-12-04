# Architecture Overview

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SHOPIFY INSIGHTS PLATFORM                        │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Landing     │  │   Auth       │  │  Dashboard   │                  │
│  │  Page        │  │   Pages      │  │  (Protected) │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  Onboarding  │  │  Charts &    │  │  Top         │                  │
│  │  Flow        │  │  Analytics   │  │  Customers   │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │                   Next.js API Routes                        │         │
│  ├────────────────────────────────────────────────────────────┤         │
│  │                                                              │         │
│  │  Authentication APIs        Analytics APIs                  │         │
│  │  ├─ /api/auth/register     ├─ /api/analytics/overview      │         │
│  │  ├─ /api/auth/signin       ├─ /api/analytics/orders        │         │
│  │  └─ /api/auth/[...nextauth]└─ /api/analytics/products      │         │
│  │                                                              │         │
│  │  Tenant Management          Data Sync APIs                  │         │
│  │  ├─ /api/tenants           ├─ /api/sync                    │         │
│  │  └─ GET/POST               └─ POST (manual trigger)         │         │
│  │                                                              │         │
│  │  Webhook Handlers           Cron Jobs                       │         │
│  │  └─ /api/webhooks/shopify  └─ /api/cron/sync               │         │
│  │                                                              │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                    ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │                   Business Logic Layer                      │         │
│  ├────────────────────────────────────────────────────────────┤         │
│  │                                                              │         │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │         │
│  │  │  Auth        │  │  Sync        │  │  Analytics   │     │         │
│  │  │  Service     │  │  Service     │  │  Service     │     │         │
│  │  └──────────────┘  └──────────────┘  └──────────────┘     │         │
│  │                                                              │         │
│  │  ┌──────────────┐  ┌──────────────┐                        │         │
│  │  │  Shopify     │  │  Webhook     │                        │         │
│  │  │  Client      │  │  Validator   │                        │         │
│  │  └──────────────┘  └──────────────┘                        │         │
│  │                                                              │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
                                    ↓
┌─────────────────────────────────────────────────────────────────────────┐
│                            DATA ACCESS LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │                    Prisma ORM Client                        │         │
│  ├────────────────────────────────────────────────────────────┤         │
│  │  - Type-safe database queries                              │         │
│  │  - Automatic migrations                                     │         │
│  │  - Connection pooling                                       │         │
│  │  - Query optimization                                       │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                    ↓                                      │
│  ┌────────────────────────────────────────────────────────────┐         │
│  │                   PostgreSQL Database                       │         │
│  ├────────────────────────────────────────────────────────────┤         │
│  │                                                              │         │
│  │  Tables:                                                     │         │
│  │  ├─ User (authentication)                                   │         │
│  │  ├─ Tenant (stores)                                         │         │
│  │  ├─ Customer (tenantId)                                     │         │
│  │  ├─ Product (tenantId)                                      │         │
│  │  ├─ Order (tenantId)                                        │         │
│  │  ├─ OrderItem                                               │         │
│  │  └─ SyncLog (tenantId)                                      │         │
│  │                                                              │         │
│  │  Indexes:                                                    │         │
│  │  - All tenantId columns                                     │         │
│  │  - Foreign keys                                             │         │
│  │  - Composite unique constraints                             │         │
│  │                                                              │         │
│  └────────────────────────────────────────────────────────────┘         │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          EXTERNAL INTEGRATIONS                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────┐                               │
│  │       Shopify Admin REST API         │                               │
│  ├──────────────────────────────────────┤                               │
│  │  ┌──────────────┐  ┌──────────────┐ │                               │
│  │  │  Customers   │  │  Products    │ │                               │
│  │  │  API         │  │  API         │ │                               │
│  │  └──────────────┘  └──────────────┘ │                               │
│  │  ┌──────────────┐  ┌──────────────┐ │                               │
│  │  │  Orders      │  │  Webhooks    │ │                               │
│  │  │  API         │  │  API         │ │                               │
│  │  └──────────────┘  └──────────────┘ │                               │
│  └──────────────────────────────────────┘                               │
│                          ↓ (Webhooks)                                    │
│                  ┌──────────────┐                                        │
│                  │  POST Events │                                        │
│                  │  - customers/create                                   │
│                  │  - customers/update                                   │
│                  │  - orders/create                                      │
│                  │  - orders/updated                                     │
│                  │  - products/create                                    │
│                  │  - products/update                                    │
│                  └──────────────┘                                        │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        DEPLOYMENT INFRASTRUCTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌──────────────────────────────────────┐                               │
│  │            Vercel Platform            │                               │
│  ├──────────────────────────────────────┤                               │
│  │  - Serverless Functions (API Routes) │                               │
│  │  - Edge Network (Static Assets)      │                               │
│  │  - Automatic HTTPS                   │                               │
│  │  - Environment Variables             │                               │
│  │  - Cron Jobs (Scheduled Sync)        │                               │
│  └──────────────────────────────────────┘                               │
│                                                                           │
└─────────────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. User Registration & Authentication Flow

```
User                   Frontend               Backend                Database
 │                        │                      │                      │
 │─── Register Form ───> │                      │                      │
 │                        │─── POST /api/auth/register ──>             │
 │                        │                      │──── Hash Password ──>│
 │                        │                      │<─── Store User ──────│
 │                        │<─── 201 Created ────│                      │
 │<─── Success Msg ────  │                      │                      │
 │                        │                      │                      │
 │─── Sign In Form ────> │                      │                      │
 │                        │─── POST /api/auth/signin ──>               │
 │                        │                      │──── Verify Pwd ─────>│
 │                        │                      │<─── User + Tenant ───│
 │                        │                      │── Create JWT Token ──│
 │                        │<─── JWT Cookie ──────│                      │
 │<─── Redirect ─────────│                      │                      │
```

### 2. Shopify Store Onboarding Flow

```
User                   Frontend               Backend                Database
 │                        │                      │                      │
 │─── Onboarding Form ──>│                      │                      │
 │    (Store Details)     │                      │                      │
 │                        │─── POST /api/tenants ──>                   │
 │                        │                      │── Validate Domain ───>│
 │                        │                      │<─── Check Exists ────│
 │                        │                      │── Gen Webhook Secret ─│
 │                        │                      │──── Create Tenant ───>│
 │                        │                      │──── Link User ───────>│
 │                        │<─── Tenant Created ──│                      │
 │<─── Redirect to ──────│                      │                      │
 │    Dashboard           │                      │                      │
```

### 3. Data Sync Flow (Manual Trigger)

```
User          Frontend        Backend         Shopify API      Database
 │                │              │                  │              │
 │─ Click Sync ─>│              │                  │              │
 │                │── POST /api/sync ──>           │              │
 │                │              │─── Create SyncLog ──────────────>│
 │                │              │                  │              │
 │                │              │─── GET /customers ──>           │
 │                │              │<─── Customers Data ───          │
 │                │              │─── Upsert Customers ────────────>│
 │                │              │                  │              │
 │                │              │─── GET /products ──>            │
 │                │              │<─── Products Data ────          │
 │                │              │─── Upsert Products ─────────────>│
 │                │              │                  │              │
 │                │              │─── GET /orders ──>              │
 │                │              │<─── Orders Data ─────           │
 │                │              │─── Upsert Orders ───────────────>│
 │                │              │─── Update SyncLog ──────────────>│
 │                │<─── Success ──│                  │              │
 │<─ Show Stats ──│              │                  │              │
```

### 4. Webhook Real-time Update Flow

```
Shopify Store     Our Webhook        Sync Service      Database
      │               Endpoint              │              │
      │                  │                  │              │
 New Order              │                  │              │
 Created                │                  │              │
      │                  │                  │              │
      │─── POST /api/webhooks/shopify ──>  │              │
      │    (HMAC Signed)                    │              │
      │                  │── Verify HMAC ───│              │
      │                  │── Get Tenant ────────────────────>│
      │                  │<─ Tenant + Secret ───────────────│
      │                  │                  │              │
      │                  │── Handle Order Webhook ──>      │
      │                  │                  │── Upsert Order ──────>│
      │                  │                  │── Link Customer ─────>│
      │                  │                  │── Create OrderItems ──>│
      │                  │<─── Success ─────│              │
      │<─── 200 OK ──────│                  │              │
```

### 5. Analytics Dashboard Data Flow

```
User          Frontend        Analytics API       Database
 │                │                 │                 │
 │─ Load Dashboard ──>              │                 │
 │                │── GET /api/analytics/overview ──> │
 │                │                 │─ Query Aggregates ─────>│
 │                │                 │  (COUNT, SUM, AVG)      │
 │                │                 │<─ Metrics Data ─────────│
 │                │<─── Overview Data ──│                 │
 │                │                 │                 │
 │                │── GET /api/analytics/orders-over-time ──>│
 │                │                 │─ Query Orders by Date ──>│
 │                │                 │<─ Time Series Data ──────│
 │                │<─── Chart Data ────│                 │
 │                │                 │                 │
 │<─ Render Charts ──│              │                 │
```

## Technology Stack Details

### Frontend Stack
```
React 19
  └── Next.js 14 (App Router)
      ├── Server Components (SSR)
      ├── Client Components (CSR)
      └── API Routes (Serverless Functions)

Styling
  └── Tailwind CSS 4.x
      ├── Utility-first
      └── JIT Compiler

Data Visualization
  └── Recharts
      ├── Line Charts
      ├── Bar Charts
      └── Responsive Containers
```

### Backend Stack
```
Runtime
  └── Node.js 22.x

Framework
  └── Next.js API Routes
      ├── Route Handlers
      ├── Middleware
      └── Edge Functions

Authentication
  └── NextAuth.js v5 (Beta)
      ├── JWT Strategy
      ├── Credentials Provider
      └── Session Management

ORM
  └── Prisma 7.x
      ├── Schema Definition
      ├── Type-safe Queries
      ├── Migration System
      └── Prisma Client
```

### Database
```
PostgreSQL 15+
  ├── ACID Compliance
  ├── JSON Support
  ├── Full-text Search
  └── Advanced Indexing
```

### Deployment
```
Vercel
  ├── Serverless Functions
  ├── Edge Network (CDN)
  ├── Automatic HTTPS
  ├── Environment Variables
  ├── Preview Deployments
  └── Cron Jobs
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│         Security Layers                 │
├─────────────────────────────────────────┤
│                                          │
│  1. Transport Layer                     │
│     └─ HTTPS/TLS 1.3                    │
│                                          │
│  2. Authentication Layer                │
│     ├─ JWT Tokens                       │
│     ├─ Password Hashing (bcrypt)        │
│     └─ Session Management               │
│                                          │
│  3. Authorization Layer                 │
│     ├─ Role-based Access                │
│     └─ Tenant Isolation                 │
│                                          │
│  4. Data Layer                          │
│     ├─ Row-level Security (tenantId)    │
│     ├─ Parameterized Queries            │
│     └─ Input Validation                 │
│                                          │
│  5. API Layer                           │
│     ├─ CORS Configuration               │
│     ├─ Rate Limiting (TODO)             │
│     └─ Webhook Verification (HMAC)      │
│                                          │
└─────────────────────────────────────────┘
```

## Scaling Considerations

### Current Architecture Limits
- **Database**: Single PostgreSQL instance
- **Compute**: Serverless functions (10s timeout)
- **Storage**: Database storage limits

### Horizontal Scaling Strategy
```
┌─────────────────────────────────────────┐
│  Load Balancer (Vercel Edge)            │
├─────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │Function │  │Function │  │Function │ │
│  │Instance │  │Instance │  │Instance │ │
│  └─────────┘  └─────────┘  └─────────┘ │
└─────────────────────────────────────────┘
           │           │           │
           └───────────┼───────────┘
                       │
         ┌─────────────────────────┐
         │  Connection Pooler      │
         │  (PgBouncer/Supabase)   │
         └─────────────────────────┘
                       │
         ┌─────────────────────────┐
         │  PostgreSQL Primary     │
         ├─────────────────────────┤
         │  Read Replicas (Future) │
         └─────────────────────────┘
```

### Caching Strategy (Future)
```
┌─────────────────────────────────────────┐
│  Application Layer                      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Redis Cache Layer (L1)                 │
│  - Analytics results (TTL: 5min)        │
│  - Top customers (TTL: 10min)           │
│  - Product data (TTL: 1hr)              │
└─────────────────────────────────────────┘
                  ↓ (Cache Miss)
┌─────────────────────────────────────────┐
│  Database (L2)                          │
└─────────────────────────────────────────┘
```

---

**Document Version**: 1.0
**Last Updated**: December 2025
