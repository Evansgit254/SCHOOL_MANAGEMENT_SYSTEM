# Testing Guide 🧪

This guide will help you test your School Management System before pushing to GitHub.

## Quick Test

Run the automated production readiness test:

```bash
npm run test:production
```

This will check:
- Environment configuration
- Dependencies
- TypeScript compilation
- ESLint
- Prisma schema
- Security issues
- Documentation files
- Production build
- Git configuration

## Manual Testing Checklist

### 1. Environment Setup

```bash
# Copy environment variables
cp .env.example .env

# Edit .env with your actual credentials
nano .env
```

Required variables:
- `DATABASE_URL` - Your PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_SECRET_KEY` - From Clerk dashboard

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run migrations
npm run db:migrate

# Seed the database
npm run db:seed
```

### 3. Build Test

```bash
# Test production build
npm run build

# If successful, test the production server
npm start
```

Visit http://localhost:3000 and verify:
- Landing page loads
- Sign-in page works
- No console errors

### 4. Development Test

```bash
# Start development server
npm run dev
```

Test each role:

#### Admin Tests
1. Sign in as admin
2. Navigate to `/admin`
3. Check dashboard loads
4. Test creating a new student
5. Test creating a new teacher
6. Test creating a new class
7. Test viewing lists (students, teachers, classes, etc.)
8. Test search functionality
9. Test pagination
10. Test forms validation

#### Teacher Tests
1. Sign in as teacher
2. Navigate to `/teacher`
3. Check dashboard loads
4. View assigned classes
5. View assigned lessons
6. Create an assignment
7. Create an exam
8. Mark attendance
9. View student results
10. Send messages

#### Student Tests
1. Sign in as student
2. Navigate to `/student`
3. Check dashboard loads
4. View class schedule
5. View assignments
6. View exam results
7. View attendance
8. Check calendar events
9. View announcements
10. Send messages

#### Parent Tests
1. Sign in as parent
2. Navigate to `/parent`
3. Check dashboard loads
4. View children's information
5. View children's attendance
6. View children's results
7. View children's schedule
8. View announcements
9. Send messages to teachers

### 5. API Tests

Test API endpoints:

```bash
# Test health check (if you have one)
curl http://localhost:3000/api/health

# Test authentication
# (requires valid session)
```

### 6. Docker Test

```bash
# Build and run with Docker
docker-compose up --build

# Test the application at http://localhost:3000

# Stop containers
docker-compose down
```

### 7. Security Tests

Check for common security issues:

```bash
# Check for hardcoded secrets
grep -r "api_key\|secret\|password" src/ --exclude-dir=node_modules

# Check for console.log in production
grep -r "console.log" src/ --exclude-dir=node_modules

# Run security audit
npm audit

# Fix vulnerabilities
npm audit fix
```

### 8. Performance Tests

```bash
# Build for production
npm run build

# Analyze bundle size
npm run build -- --analyze  # (if you have this configured)

# Check for large files
find . -type f -size +1M -not -path "./node_modules/*" -not -path "./.git/*"
```

### 9. Database Tests

```bash
# Open Prisma Studio to inspect data
npm run db:studio

# Test migrations
npx prisma migrate dev --name test_migration

# Reset database (WARNING: deletes all data)
npx prisma migrate reset
```

### 10. Accessibility Tests

Manual checks:
- [ ] All images have alt text
- [ ] Forms have proper labels
- [ ] Keyboard navigation works
- [ ] Color contrast is sufficient
- [ ] Screen reader friendly

## Common Issues and Solutions

### Issue: Build fails with "Cannot find module"
**Solution:** Run `npm install` and `npx prisma generate`

### Issue: Database connection error
**Solution:** Check your `DATABASE_URL` in .env and ensure PostgreSQL is running

### Issue: Clerk authentication not working
**Solution:** Verify your Clerk keys in .env and check Clerk dashboard settings

### Issue: TypeScript errors
**Solution:** Run `npx tsc --noEmit` to see all errors, then fix them

### Issue: Docker build fails
**Solution:** Check Dockerfile and ensure all files are present

### Issue: Large bundle size
**Solution:** Check for unnecessary imports and use dynamic imports for large components

## Pre-Push Checklist

Before pushing to GitHub:

- [ ] All tests pass
- [ ] No console errors in browser
- [ ] No TypeScript errors
- [ ] No ESLint errors
- [ ] Production build succeeds
- [ ] .env is in .gitignore
- [ ] No sensitive data in code
- [ ] README.md is up to date
- [ ] All features documented
- [ ] Screenshots added (optional)
- [ ] CHANGELOG updated (optional)

## Automated Testing (Future)

Consider adding:
- Unit tests with Jest
- Integration tests with React Testing Library
- E2E tests with Playwright or Cypress
- API tests with Supertest
- Performance tests with Lighthouse CI

## Continuous Integration

The project includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:
- Runs on every push to main
- Runs on every pull request
- Checks TypeScript compilation
- Runs ESLint
- Builds the project

## Getting Help

If you encounter issues:
1. Check the error message carefully
2. Search for the error in GitHub issues
3. Check the documentation
4. Ask in discussions
5. Create a new issue with details

## Success Criteria

Your application is ready for production when:
- ✅ All automated tests pass
- ✅ Manual testing completed for all roles
- ✅ No security vulnerabilities
- ✅ Production build succeeds
- ✅ Docker deployment works
- ✅ Documentation is complete
- ✅ Performance is acceptable
- ✅ All features work as expected

Good luck! 🚀
