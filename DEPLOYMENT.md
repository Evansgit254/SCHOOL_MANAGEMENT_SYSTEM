# School Management System - Deployment Guide

## Prerequisites
- A GitHub account
- A Vercel account (free at vercel.com)
- A production database (Supabase, PlanetScale, or Railway)

## Step 1: Prepare Your Database

### Option A: Supabase (Recommended)
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Get your database URL from Settings > Database
4. Update your `DATABASE_URL` in production environment

### Option B: PlanetScale
1. Go to [planetscale.com](https://planetscale.com)
2. Create a new database
3. Get your connection string
4. Update your `DATABASE_URL` in production environment

### Option C: Railway
1. Go to [railway.app](https://railway.app)
2. Create a new PostgreSQL database
3. Get your connection string
4. Update your `DATABASE_URL` in production environment

## Step 2: Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure environment variables:
   ```
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
   CLERK_SECRET_KEY=your_clerk_secret_key
   DATABASE_URL=your_production_database_url
   ```
5. Deploy!

### Method 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts and set environment variables
```

## Step 3: Configure Clerk for Production

1. Go to your [Clerk Dashboard](https://dashboard.clerk.com)
2. Update your application settings:
   - Add your production domain to allowed origins
   - Update redirect URLs to include your production domain
3. Copy your production keys to Vercel environment variables

## Step 4: Database Migration

After deployment, run database migrations:
```bash
# Connect to your production database
npx prisma db push --accept-data-loss
# OR
npx prisma migrate deploy
```

## Step 5: Seed Production Data (Optional)

If you want to seed your production database:
```bash
npx prisma db seed
```

## Environment Variables for Production

Set these in your Vercel dashboard:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_secret
DATABASE_URL=postgresql://username:password@host:port/database
```

## Troubleshooting

### Common Issues:
1. **Database Connection**: Ensure your `DATABASE_URL` is correct and accessible
2. **Clerk Authentication**: Verify your Clerk keys are production keys, not test keys
3. **Build Errors**: Check the build logs in Vercel dashboard

### Support:
- Vercel Documentation: https://vercel.com/docs
- Clerk Documentation: https://clerk.com/docs
- Prisma Documentation: https://www.prisma.io/docs 