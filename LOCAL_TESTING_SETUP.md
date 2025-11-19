# Local Testing Setup Guide 🧪

Follow these steps to test your application locally before pushing to GitHub.

## Step 1: Get Clerk API Keys (Required)

1. Go to [Clerk Dashboard](https://dashboard.clerk.com/)
2. Sign up or log in
3. Create a new application (or use existing)
4. Go to **API Keys** section
5. Copy your keys:
   - `Publishable Key` (starts with `pk_test_...`)
   - `Secret Key` (starts with `sk_test_...`)

## Step 2: Configure Environment Variables

Edit the `.env` file in your project root:

```bash
# Open .env file
nano .env  # or use your preferred editor
```

Update these values:

```env
# Database (already configured for docker-compose)
DATABASE_URL=postgresql://postgres:changeme@localhost:5431/school_db

# Clerk Authentication (REPLACE WITH YOUR KEYS)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_YOUR_KEY_HERE
CLERK_SECRET_KEY=sk_test_YOUR_KEY_HERE
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Important:** Replace `pk_test_YOUR_KEY_HERE` and `sk_test_YOUR_KEY_HERE` with your actual Clerk keys!

## Step 3: Start the Database

The database is already starting via docker-compose. Wait for it to finish, then verify:

```bash
# Check if database is running
docker ps | grep school_management_db

# You should see the container running
```

## Step 4: Set Up the Database

```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database with sample data
npx prisma db seed
```

## Step 5: Configure Clerk Dashboard

In your Clerk dashboard, configure these settings:

### Application URLs
- **Home URL:** `http://localhost:3000`
- **Sign-in URL:** `http://localhost:3000/sign-in`
- **Sign-up URL:** `http://localhost:3000/sign-up`
- **After sign-in URL:** `http://localhost:3000/welcome`
- **After sign-up URL:** `http://localhost:3000/welcome`

### Create Test Users

Create test users in Clerk dashboard with different roles:

1. Go to **Users** section
2. Click **Create User**
3. Fill in user details
4. After creating, click on the user
5. Go to **Metadata** tab
6. Add to **Public metadata**:
   ```json
   {
     "role": "admin"
   }
   ```

Create users with these roles:
- `admin` - Full access
- `teacher` - Teacher dashboard
- `student` - Student dashboard
- `parent` - Parent dashboard

## Step 6: Start the Development Server

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Step 7: Test the Application

### Test Authentication
1. Open `http://localhost:3000`
2. Click "Sign In"
3. Sign in with one of your test users
4. You should be redirected to the appropriate dashboard based on role

### Test Each Role

#### Admin Dashboard (`/admin`)
- View statistics
- Manage students, teachers, classes
- Create/edit/delete records
- View all data

#### Teacher Dashboard (`/teacher`)
- View assigned classes
- Manage assignments and exams
- Mark attendance
- View student results

#### Student Dashboard (`/student`)
- View class schedule
- View assignments
- Check exam results
- View attendance

#### Parent Dashboard (`/parent`)
- View children's information
- Check attendance
- View results
- See announcements

### Test Features
- [ ] User authentication works
- [ ] Role-based access control works
- [ ] Dashboard loads correctly for each role
- [ ] Forms work (create/edit/delete)
- [ ] Search and filters work
- [ ] Pagination works
- [ ] Calendar displays events
- [ ] Messaging system works
- [ ] No console errors in browser

## Troubleshooting

### Database Connection Error
```bash
# Check if database is running
docker ps | grep school_management_db

# Restart database if needed
docker-compose restart postgres
```

### Clerk Authentication Error
- Verify your API keys in `.env`
- Check Clerk dashboard URLs match `http://localhost:3000`
- Clear browser cache and cookies

### Build Errors
```bash
# Clean install
rm -rf node_modules .next
npm install
npx prisma generate
npm run dev
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm run dev
```

## Quick Test Checklist

Before pushing to GitHub, verify:

- [ ] Application starts without errors
- [ ] Can sign in with all role types
- [ ] Each dashboard loads correctly
- [ ] Can create/edit/delete records (as admin)
- [ ] Forms validate correctly
- [ ] No console errors in browser DevTools
- [ ] Database operations work
- [ ] Images load correctly
- [ ] Responsive design works on mobile

## Next Steps

Once local testing is complete:

1. Review `FINAL_REPORT.md` for the complete audit
2. Check `PRODUCTION_CHECKLIST.md` for deployment prep
3. Push to GitHub:
   ```bash
   git add .
   git commit -m "Production-ready School Management System"
   git push origin main
   ```

## Need Help?

- Check browser console for errors (F12)
- Check terminal for server errors
- Review `TESTING_GUIDE.md` for detailed testing
- Check Clerk dashboard for authentication issues

Good luck with testing! 🚀
