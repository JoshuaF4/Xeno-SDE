# Quick Start Guide - Shopify Insights Platform

## 🎉 Welcome!

This guide will help you get started with the Shopify Insights platform in under 10 minutes.

## 📋 Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] PostgreSQL database (local or cloud)
- [ ] Shopify development store (get one free at [shopify.dev](https://shopify.dev))
- [ ] Git installed

## 🚀 5-Minute Setup

### Step 1: Navigate to the Project

```bash
cd shopify-insights
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, Prisma, NextAuth, and Recharts.

### Step 3: Set Up Environment Variables

```bash
cp .env.example .env
```

Edit `.env` and update these critical variables:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://username:password@localhost:5432/shopify_insights"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"

# Your application URL
NEXTAUTH_URL="http://localhost:3000"
```

### Step 4: Initialize Database

```bash
# Generate Prisma Client
npx prisma generate

# Create database tables
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view your database
npx prisma studio
```

### Step 5: Start Development Server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) 🎊

## 📝 First-Time User Flow

### 1. Create an Account

1. Go to [http://localhost:3000/auth/register](http://localhost:3000/auth/register)
2. Fill in your details:
   - Name
   - Email
   - Password (min 6 characters)
3. Click "Create Account"

### 2. Sign In

1. Go to [http://localhost:3000/auth/signin](http://localhost:3000/auth/signin)
2. Enter your email and password
3. Click "Sign In"

### 3. Connect Your Shopify Store

You'll be automatically redirected to the onboarding page, or visit [http://localhost:3000/onboarding](http://localhost:3000/onboarding)

**Required Information:**
- **Store Name**: Any friendly name (e.g., "My Test Store")
- **Shopify Domain**: Your store URL (e.g., `mystore.myshopify.com`)
- **Access Token**: Get this from Shopify Admin (see below)
- **API Key**: (Optional) Your Shopify app's API key

### 4. Get Shopify Credentials

#### Creating a Shopify Development Store (Free)

1. Visit [https://shopify.dev](https://shopify.dev)
2. Sign up for a free developer account
3. Create a development store
4. Add some dummy data:
   - 5-10 products
   - 5-10 customers
   - 10-20 orders

#### Creating a Custom App for API Access

1. In Shopify Admin, go to **Settings** → **Apps and sales channels**
2. Click **Develop apps** → **Create an app**
3. Name it "Shopify Insights Connector"
4. Click **Configure Admin API scopes**
5. Select these scopes:
   - ✅ `read_customers`
   - ✅ `read_orders`
   - ✅ `read_products`
6. Click **Save**
7. Click **Install app**
8. Copy the **Admin API access token** (starts with `shpat_`)

### 5. Sync Your Data

1. After connecting your store, you'll be redirected to the dashboard
2. Click the **"Sync Data"** button in the top right
3. Wait for the sync to complete (usually 10-30 seconds)
4. Your dashboard will update with:
   - Total customers, orders, products
   - Total revenue and average order value
   - Order trends chart
   - Top 5 customers by spend

## 🎯 What You Can Do Now

### View Analytics
- **Overview Metrics**: See total customers, orders, products, and revenue
- **Order Trends**: Visualize orders and revenue over the last 30 days
- **Top Customers**: See your highest-spending customers
- **Product Performance**: View top-selling products

### Manual Sync
- Click "Sync Data" anytime to fetch the latest data from Shopify

### Automatic Sync
- Webhooks provide real-time updates (when deployed)
- Scheduled sync runs every 6 hours (when deployed to Vercel)

## 🚢 Deploy to Production

### Option 1: Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables** in Vercel Dashboard:
   ```
   DATABASE_URL=your-production-database-url
   NEXTAUTH_SECRET=your-production-secret
   NEXTAUTH_URL=https://your-app.vercel.app
   CRON_SECRET=your-cron-secret
   ```

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

5. **Run Database Migrations**
   ```bash
   npx prisma migrate deploy
   ```

### Recommended Database Providers

1. **Neon** (Serverless PostgreSQL)
   - Free tier: 0.5GB
   - Auto-scaling
   - [https://neon.tech](https://neon.tech)

2. **Supabase** (PostgreSQL + Tools)
   - Free tier: 500MB
   - Built-in connection pooler
   - [https://supabase.com](https://supabase.com)

3. **Railway** (Full Platform)
   - Database + App hosting
   - $5/month credit
   - [https://railway.app](https://railway.app)

### Configure Shopify Webhooks (After Deployment)

Once deployed, set up webhooks in your Shopify app for real-time updates:

1. In your Shopify app settings, go to **Webhooks**
2. Add these webhook subscriptions:

   | Event | URL |
   |-------|-----|
   | `customers/create` | `https://your-app.vercel.app/api/webhooks/shopify` |
   | `customers/update` | `https://your-app.vercel.app/api/webhooks/shopify` |
   | `orders/create` | `https://your-app.vercel.app/api/webhooks/shopify` |
   | `orders/updated` | `https://your-app.vercel.app/api/webhooks/shopify` |
   | `products/create` | `https://your-app.vercel.app/api/webhooks/shopify` |
   | `products/update` | `https://your-app.vercel.app/api/webhooks/shopify` |

3. Format: **JSON**
4. API version: **2024-01**

## 📚 Additional Resources

- **README.md** - Complete feature list and setup instructions
- **DOCUMENTATION.md** - Technical documentation and API specs
- **ARCHITECTURE.md** - System architecture and data flow diagrams
- **.env.example** - All available environment variables

## 🆘 Common Issues

### Database Connection Failed
**Error**: `Can't reach database server`

**Solution**:
- Verify your DATABASE_URL is correct
- Check if PostgreSQL is running: `brew services list` (macOS) or `sudo service postgresql status` (Linux)
- Test connection: `psql $DATABASE_URL`

### Prisma Client Not Found
**Error**: `@prisma/client did not initialize yet`

**Solution**:
```bash
npx prisma generate
npm run build
```

### Authentication Errors
**Error**: `Invalid session`

**Solution**:
- Clear browser cookies
- Verify NEXTAUTH_SECRET is set
- Make sure NEXTAUTH_URL matches your current URL

### Shopify API Errors
**Error**: `Unauthorized` or `Invalid access token`

**Solution**:
- Regenerate your Shopify access token
- Verify API scopes are correct
- Check that your store is active

## 💡 Pro Tips

1. **Use Prisma Studio** to visualize your database:
   ```bash
   npx prisma studio
   ```

2. **Check Logs** in Vercel dashboard for debugging production issues

3. **Test Webhooks Locally** using ngrok:
   ```bash
   npx ngrok http 3000
   ```
   Use the ngrok URL for webhook endpoints during development

4. **Monitor Sync Logs** in the database to track sync history and errors

## 🎓 Next Steps

- [ ] Add more products and customers in Shopify
- [ ] Test the webhook integration
- [ ] Explore the analytics dashboard
- [ ] Customize the UI to your liking
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Add more analytics features

## 📞 Need Help?

Check out the comprehensive documentation:
- **README.md** for feature overview
- **DOCUMENTATION.md** for API details
- **ARCHITECTURE.md** for system design

## 🎉 You're All Set!

Your Shopify Insights platform is ready to use. Happy analyzing! 📊

---

**Built for Xeno FDE Internship 2025**
