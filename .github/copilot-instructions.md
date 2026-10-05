# Art Marketplace - Copilot Instructions

## Project Overview
Full-stack art selling website with Next.js, PostgreSQL, Stripe, and notification system (email/SMS).

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   ```bash
   cp .env.example .env.local
   ```
   Edit `.env.local` with:
   - DATABASE_URL: PostgreSQL connection string
   - STRIPE_SECRET_KEY & NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
   - RESEND_API_KEY
   - TWILIO credentials
   - JWT_SECRET

3. **Set Up Database**
   ```bash
   npm run db:migrate
   node scripts/seed-admin.js [password]
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

## Project Structure

- `/app/api/` - Backend API routes (products, orders, payments)
- `/app/admin/` - Admin dashboard (protected)
- `/app/` - Public storefront
- `/lib/` - Utilities (db, auth, stripe, notifications)
- `/scripts/` - Database migrations and seeding

## Features

- ✅ Public product listing
- ✅ Shopping cart
- ✅ Order creation
- ✅ Stripe payment integration (demo mode)
- ✅ Email notifications (Resend)
- ✅ SMS notifications (Twilio)
- ✅ Admin dashboard with auth
- ✅ Order management
- ✅ Product management

## API Endpoints

### Public
- `GET /api/products` - List products
- `GET /api/products/[id]` - Get product
- `POST /api/orders` - Create order
- `GET /api/orders?email=...` - Get customer orders

### Admin (requires Bearer token)
- `GET/POST /api/admin/products` - Manage products
- `GET/PATCH /api/admin/orders` - Manage orders
- `POST /api/admin/login` - Admin authentication

## Deployment

### Recommended Stack (Cost-Effective)

**Database**: Railway or Render
- Railway: $5/month free tier
- Render: Free tier (limited)

**Hosting**: Vercel (free)
- Deploy directly from GitHub
- Free tier included

**Payments**: Stripe (free until first transaction)

**Email**: Resend (1000/day free)

**SMS**: Twilio (free trial credits)

### Deploy Steps

1. Push code to GitHub
2. Connect Vercel to your repo
3. Add environment variables in Vercel dashboard
4. Deploy

## Development Notes

- Admin email: Use value from ADMIN_EMAIL env var (default: admin@example.com)
- Default password: Set when running `npm run seed-admin.js`
- JWT tokens expire after 7 days
- Payment processing is in demo mode - integrate Stripe.js for production
- All prices stored in cents (multiply by 100)

## Next Steps

- Integrate Stripe Checkout/Elements for real payments
- Add product image upload (S3/Cloudinary)
- Implement shipping calculator
- Add email templates
- Create order tracking page
- Add reviews/ratings system
