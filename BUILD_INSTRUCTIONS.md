# Build Instructions

## Local Development Build

To build the project locally, you need to have valid environment variables set up:

```bash
# 1. Copy .env.example to .env
cp .env.example .env

# 2. Edit .env with your actual Clerk credentials
# Get your keys from: https://dashboard.clerk.com

# 3. Build the project
npm run build
```

## CI/CD Build (GitHub Actions)

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that automatically builds on push/PR.

The workflow uses dummy environment variables for the build process. This is configured in the workflow file.

## Production Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the repository to Vercel
3. Add environment variables in Vercel dashboard:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - Other optional variables from `.env.example`
4. Deploy

Vercel will automatically build and deploy your application.

### Docker

```bash
# Build the Docker image
docker-compose build

# Run the containers
docker-compose up -d
```

Make sure to set environment variables in a `.env` file or `docker-compose.override.yml`.

### Other Platforms

For other platforms (AWS, Google Cloud, Azure, etc.), ensure you:

1. Set all required environment variables
2. Run database migrations: `npx prisma migrate deploy`
3. Build the application: `npm run build`
4. Start the server: `npm start`

## Troubleshooting

### Build fails with "Missing publishableKey"

This happens when Clerk environment variables are not set. Solutions:

1. **Local development**: Copy `.env.example` to `.env` and add your Clerk keys
2. **CI/CD**: The GitHub Actions workflow handles this automatically
3. **Production**: Set environment variables in your deployment platform

### Database connection errors during build

The build process doesn't require a database connection for most pages. However, some pages with server-side rendering do need it.

For CI/CD builds, you can use a dummy DATABASE_URL as shown in `.github/workflows/ci.yml`.

### TypeScript errors

Run `npm run lint` to check for TypeScript and ESLint errors before building.

## Environment Variables Required for Build

Minimum required for build:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `DATABASE_URL`

Optional (but recommended for production):
- `NEXT_PUBLIC_SITE_URL`
- `REDIS_URL`
- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`
- And others from `.env.example`

## Build Output

After a successful build, you'll find:
- `.next/` directory with the production build
- Static assets optimized and ready for deployment
- Server-side code bundled and optimized

The build is ready to be deployed to any Node.js hosting platform.
