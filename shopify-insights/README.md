# Shopify Insights - Multi-Tenant Data Ingestion & Analytics Platform

A full-stack application that connects to Shopify stores, ingests customer, order, and product data, and provides powerful analytics insights through an interactive dashboard.

## 🎯 Features

### ✅ Core Functionality
- **Multi-Tenant Architecture**: Support for multiple Shopify stores with isolated data
- **Real-Time Data Sync**: Webhooks for instant updates from Shopify
- **Scheduled Sync**: Automated data synchronization every 6 hours via Vercel Cron
- **Analytics Dashboard**: Interactive visualizations with charts and metrics
- **Secure Authentication**: Email/password authentication with NextAuth.js
- **RESTful APIs**: Clean API endpoints for data ingestion and analytics

### 📊 Analytics Features
- Total customers, orders, and products count
- Total revenue and average order value
- Orders and revenue trends over time
- Top 5 customers by spend
- Product performance metrics
- Date range filtering capabilities

### 🔐 Security
- Multi-tenant data isolation using tenant IDs
- Secure password hashing with bcryptjs
- Webhook signature verification
- Environment-based configuration
- JWT session management

## 🏗️ Architecture

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: NextAuth.js v5
- **UI Components**: React with Tailwind CSS
- **Charts**: Recharts
- **Deployment**: Vercel

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Shopify Insights                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │   Shopify    │────────>│   Webhooks   │                      │
│  │    Store     │         │   Endpoint   │                      │
│  └──────────────┘         └──────┬───────┘                      │
│         │                         │                               │
│         │                         ▼                               │
│         │                 ┌──────────────┐                       │
│         │                 │  Sync Service │                      │
│         │                 └──────┬───────┘                       │
│         │                         │                               │
│         ▼                         ▼                               │
│  ┌──────────────┐         ┌──────────────┐                      │
│  │  Shopify API │────────>│  PostgreSQL  │<──────────┐          │
│  │  Integration │         │   Database   │           │          │
│  └──────────────┘         └──────────────┘           │          │
│         ▲                         │                    │          │
│         │                         │                    │          │
│         │                         ▼                    │          │
│  ┌──────────────┐         ┌──────────────┐    ┌──────────────┐ │
│  │  Cron Jobs   │         │ Analytics API │    │ NextAuth.js  │ │
│  │  (Vercel)    │         └──────┬───────┘    └──────────────┘ │
│  └──────────────┘                 │                    ▲         │
│                                    │                    │         │
│                                    ▼                    │         │
│                            ┌──────────────┐            │         │
│                            │  Dashboard   │────────────┘         │
│                            │      UI      │                       │
│                            └──────────────┘                       │
│                                                                    │
└────────────────────────────────────────────────────────────────┘
```

### Database Schema

```
User (Authentication)
├── id, email, password, name, role
└── tenantId (FK to Tenant)

Tenant (Shopify Stores)
├── id, name, shopifyDomain
├── shopifyAccessToken, webhookSecret
└── isActive, lastSyncedAt

Customer (Shopify Customers)
├── id, tenantId (FK)
├── shopifyCustomerId, email, name
└── totalSpent, ordersCount

Product (Shopify Products)
├── id, tenantId (FK)
├── shopifyProductId, title, description
└── price, inventory, status

Order (Shopify Orders)
├── id, tenantId (FK), customerId (FK)
├── shopifyOrderId, orderNumber
└── totalPrice, financialStatus

OrderItem (Order Line Items)
├── id, orderId (FK), productId (FK)
└── title, quantity, price

SyncLog (Sync History)
├── id, tenantId (FK)
└── syncType, status, itemsCount
```

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database (local or cloud)
- Shopify development store (free at shopify.dev)

### 1. Clone the Repository

```bash
git clone <repository-url>
cd shopify-insights
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file:

```bash
cp .env.example .env
```

Update the following variables:

```env
# Database - Update with your PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/shopify_insights"

# NextAuth - Generate secret: openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret"

# Cron Job Secret
CRON_SECRET="your-cron-secret"

# Shopify (Optional - per tenant configuration)
SHOPIFY_API_KEY=""
SHOPIFY_API_SECRET=""
```

### 4. Set Up Database

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 5. Run Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/signin` - Sign in user
- `GET /api/auth/signout` - Sign out user

### Tenant Management
- `POST /api/tenants` - Create new tenant (connect Shopify store)
- `GET /api/tenants?tenantId=xxx` - Get tenant details

### Data Sync
- `POST /api/sync` - Trigger manual sync
  - Body: `{ "syncType": "customers" | "products" | "orders" | "all" }`

### Webhooks
- `POST /api/webhooks/shopify` - Shopify webhook endpoint
  - Handles: customers/create, customers/update, orders/create, orders/updated, products/create, products/update

### Analytics
- `GET /api/analytics/overview` - Get dashboard overview metrics
- `GET /api/analytics/orders-over-time?days=30` - Get order trends
- `GET /api/analytics/product-performance` - Get top products

### Cron Jobs
- `GET /api/cron/sync` - Scheduled sync endpoint (Vercel Cron)

## 🛠️ Shopify Setup Guide

### 1. Create Development Store
1. Visit [shopify.dev](https://shopify.dev)
2. Create a free development store
3. Add dummy products, customers, and orders

### 2. Create Custom App
1. In Shopify Admin, go to **Settings → Apps and sales channels**
2. Click **Develop apps → Create an app**
3. Name it "Shopify Insights Connector"

### 3. Configure API Scopes
Add these scopes:
- `read_customers`
- `read_orders`
- `read_products`
- `write_customers` (for webhooks)
- `write_orders` (for webhooks)
- `write_products` (for webhooks)

### 4. Get API Credentials
1. Install the app
2. Copy the **Admin API access token**
3. Copy your **shop domain** (e.g., mystore.myshopify.com)

### 5. Configure Webhooks (Optional)
In your app configuration, add webhook subscriptions:
- `customers/create` → `https://your-domain.vercel.app/api/webhooks/shopify`
- `customers/update` → `https://your-domain.vercel.app/api/webhooks/shopify`
- `orders/create` → `https://your-domain.vercel.app/api/webhooks/shopify`
- `orders/updated` → `https://your-domain.vercel.app/api/webhooks/shopify`
- `products/create` → `https://your-domain.vercel.app/api/webhooks/shopify`
- `products/update` → `https://your-domain.vercel.app/api/webhooks/shopify`

## 🚢 Deployment

### Deploy to Vercel

1. Push code to GitHub

```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. Import project in Vercel
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository

3. Configure Environment Variables
   - Add all variables from `.env.example`
   - Use a production PostgreSQL database (e.g., Neon, Supabase, Railway)

4. Deploy
   - Vercel will automatically deploy
   - Cron jobs are automatically configured from `vercel.json`

5. Run Database Migrations

```bash
# After first deployment
npx prisma migrate deploy
```

### Alternative Deployment Options
- **Railway**: Database + App hosting
- **Render**: Database + Web service
- **Heroku**: Database + Dyno

## 🧪 Testing the Application

### 1. User Registration
1. Visit `/auth/register`
2. Create an account

### 2. Connect Shopify Store
1. Sign in and go to `/onboarding`
2. Enter your Shopify credentials
3. Submit the form

### 3. Sync Data
1. Go to `/dashboard`
2. Click "Sync Data" button
3. Wait for sync to complete

### 4. View Analytics
- Check overview metrics
- View order trends chart
- See top customers

## 📝 Assumptions & Design Decisions

### Assumptions
1. **Single Currency**: Assumes orders are primarily in one currency (USD)
2. **Simplified Variants**: Products store only the first variant's pricing
3. **Customer Matching**: Orders are linked to customers via Shopify customer ID
4. **Access Tokens**: Stores use Admin API access tokens (not OAuth flow)
5. **Data Volume**: Designed for small to medium stores (< 100k orders)

### Design Decisions
1. **Multi-Tenancy**: Row-level isolation with `tenantId` column (simpler than schema-per-tenant)
2. **ORM Choice**: Prisma for type-safety and migrations
3. **Authentication**: NextAuth.js for standard, secure auth
4. **Sync Strategy**: Hybrid approach with webhooks + scheduled jobs
5. **Decimal Types**: Using Decimal for prices to avoid floating-point errors
6. **Soft Deletes**: Not implemented; assumes Shopify is source of truth

## 🔄 Known Limitations

1. **Pagination**: Initial sync fetches limited records (250 per entity)
2. **Variant Support**: Only stores first variant per product
3. **Image Handling**: Stores only first product image URL
4. **Error Recovery**: Partial sync failures don't retry individual items
5. **Webhook Verification**: Basic HMAC verification (could be enhanced)
6. **Real-time Updates**: Dashboard doesn't auto-refresh (manual refresh required)
7. **Rate Limiting**: No built-in Shopify API rate limit handling
8. **Multi-currency**: Revenue calculations assume single currency

## 🎯 Future Enhancements

### Short Term
- [ ] Add pagination for large data sets
- [ ] Implement real-time dashboard updates (WebSockets/SSE)
- [ ] Add export functionality (CSV, PDF reports)
- [ ] Improve error handling and retry logic
- [ ] Add data validation and sanitization

### Medium Term
- [ ] Support multiple product variants
- [ ] Add customer segmentation
- [ ] Implement advanced filters and search
- [ ] Add email notifications for sync status
- [ ] Create admin panel for user management

### Long Term
- [ ] Machine learning for sales predictions
- [ ] Automated inventory alerts
- [ ] Customer lifetime value (CLV) analysis
- [ ] A/B testing framework
- [ ] Mobile app (React Native)

## 🛡️ Production Readiness Checklist

- [ ] Use production PostgreSQL database
- [ ] Enable SSL/TLS for database connections
- [ ] Set up proper error monitoring (Sentry)
- [ ] Configure rate limiting
- [ ] Add request logging
- [ ] Implement data backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Add comprehensive tests (unit, integration, e2e)
- [ ] Configure CORS properly
- [ ] Add API documentation (Swagger/OpenAPI)
- [ ] Implement proper secret rotation
- [ ] Set up database connection pooling
- [ ] Add performance monitoring (New Relic, Datadog)

## 📄 License

MIT

## 👥 Contact

For questions or support, please contact the development team.

---

**Built with ❤️ for the Xeno FDE Internship Assignment 2025**
