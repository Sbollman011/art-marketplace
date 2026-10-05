# Art Marketplace Architecture

## Project Overview
Full-stack art marketplace with Next.js 14, PostgreSQL, Cloudinary storage, Stripe payments, and role-based access control.

**Live URL:** https://art-marketplace-8ahk.vercel.app  
**Repository:** https://github.com/Sbollman011/art-marketplace

---

## Authentication System

### Current Flow (UNIFIED LOGIN)
All users (admins and customers) login through a single unified login page.

1. **Login Page** (`/login`)
   - Single form for all user types
   - Accepts email + password
   - Redirects based on role after successful login

2. **After Login**
   - **Admin only**: Shows admin dashboard (`/admin`) with products, orders, settings
   - **Customer only**: Shows customer dashboard (`/customer`) with order history
   - **Admin + Customer**: Shows customer dashboard with "🛠️ Admin Portal" button to switch to admin area

### Token System

**localStorage keys:**
- `adminToken` - JWT for admin operations (7-day expiration)
- `adminEmail` - Admin email address
- `customerToken` - JWT for customer operations (30-day expiration)
- `customerEmail` - Customer email address

### Database Tables
```sql
admins (id, email, password_hash, created_at)
customers (id, email, password_hash, created_at)
products (id, title, description, price, image_url, created_at)
orders (id, customer_id, total_price, status, created_at)
order_items (id, order_id, product_id, quantity, price)
```

---

## File Structure

### Authentication Files
- `app/login/page.js` - Unified login form (admin + customer)
- `app/login/layout.js` - Public layout for login page
- `lib/auth.js` - Admin JWT utilities
- `lib/customer-auth.js` - Customer JWT utilities
- `app/api/login/route.js` - Unified login endpoint

### Admin Area
- `app/admin/layout.js` - Admin portal container with sidebar (auth protected)
- `app/admin/login/layout.js` - Separate layout for admin login (removed, use unified /login now)
- `app/admin/page.js` - Dashboard
- `app/admin/products/page.js` - Product management with Cloudinary upload
- `app/admin/orders/page.js` - Order management
- `app/admin/settings/page.js` - Admin settings
- `app/api/admin/login/route.js` - OLD: Admin login endpoint (deprecated, use /api/login)
- `app/api/admin/upload/route.js` - Image upload to Cloudinary
- `app/api/admin/products/route.js` - Product CRUD
- `app/api/admin/orders/route.js` - Order management

### Customer Area
- `app/customer/layout.js` - Customer portal header with logout + admin button
- `app/customer/page.js` - Customer dashboard (order history, account info)
- `app/api/customer/login/route.js` - OLD: Customer login endpoint (deprecated, use /api/login)

### Public Pages
- `app/page.js` - Gallery/storefront
- `app/layout.js` - Root layout with favicon
- `app/api/products/route.js` - Public product listing
- `app/api/orders/route.js` - Public order creation

### Image Storage
- **Cloudinary** - Cloud image storage (unsigned upload)
- Env vars: `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`, `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`
- Upload folder: `goodness-gracious-gabriel`
- Free tier: 25GB storage, unlimited uploads

---

## Key Features

### ✅ Implemented
- [x] Public product gallery
- [x] Shopping cart (client-side)
- [x] Order creation with Stripe integration
- [x] Unified login (single page for all user types)
- [x] Admin dashboard with protected routes
- [x] Product management (create/read/update/delete)
- [x] Image upload from device to Cloudinary
- [x] Order management
- [x] Role-based UI (only show features for your role)
- [x] Admin + Customer dual access with portal switcher
- [x] Favicon (🎨 emoji)

### 🔄 In Progress
- Image display optimization
- Email notifications (Resend integration)
- SMS notifications (Twilio integration)

### ⏳ Planned
- Product reviews/ratings
- Image gallery with lightbox
- Shipping calculator
- Email order tracking
- Refund management
- Analytics dashboard

---

## Environment Variables

**Required for development:**
```
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
JWT_SECRET=your_secret_key
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=hmunsrg
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=GGG-GD
```

**Optional:**
```
RESEND_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE=...
```

---

## API Endpoints

### Public
- `GET /api/products` - List all products
- `GET /api/products?id=123` - Get single product
- `POST /api/orders` - Create order (requires customerToken)
- `GET /api/orders?email=...` - Get customer orders

### Authentication
- `POST /api/login` - Unified login (admin or customer)

### Admin (requires adminToken)
- `GET /api/admin/products` - List products
- `POST /api/admin/products` - Create product
- `PATCH /api/admin/products` - Update product
- `DELETE /api/admin/products` - Delete product
- `GET /api/admin/orders` - List all orders
- `PATCH /api/admin/orders` - Update order status
- `POST /api/admin/upload` - Upload image to Cloudinary

---

## Deployment

**Platform:** Vercel (serverless)  
**Database:** Railway PostgreSQL  
**Storage:** Cloudinary  
**Payments:** Stripe (test mode)  
**Email:** Resend (optional)

### Deploy Steps
1. Push to GitHub (main branch)
2. Vercel auto-deploys automatically (~2-3 minutes)
3. Check deployment status: https://vercel.com/dashboard

---

## Development

### Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run db:migrate
npm run dev
```

### Local Testing
- Gallery: http://localhost:3000
- Login: http://localhost:3000/login
- Admin (if logged in as admin): http://localhost:3000/admin
- Customer (if logged in as customer): http://localhost:3000/customer

### Build & Deploy
```bash
npm run build  # Verify no errors
git add -A
git commit -m "Your message"
git push origin main  # Triggers Vercel deployment
```

---

## Recent Changes

### Session 2026-10-05
**Goal:** Unified login with role-based UI

**Changes:**
1. Created `/login/page.js` - Single login page for all users
2. Created `/api/login/route.js` - Unified login endpoint
3. Modified admin layout to require auth only on protected routes
4. Modified customer layout to show Admin Portal button when user has adminToken
5. Added favicon (🎨 emoji) to browser tabs
6. Fixed React hydration errors with separate login layout

**Result:** Users can login once, see appropriate features based on role

**Files Modified:**
- `app/admin/layout.js`
- `app/customer/layout.js`
- `app/login/page.js` (new)
- `app/login/layout.js` (new)
- `app/api/login/route.js` (new)
- `app/layout.js`

---

## Testing Checklist

### Admin-Only Account
- [ ] Login at `/login` with admin credentials
- [ ] Should see admin dashboard, NOT customer area
- [ ] Should NOT see Admin Portal button (because no customer account)

### Customer-Only Account
- [ ] Login at `/login` with customer credentials
- [ ] Should see customer dashboard
- [ ] Should NOT see Admin Portal button

### Admin + Customer Account
- [ ] Login at `/login` with admin email that has customer account
- [ ] Should see customer dashboard (primary view)
- [ ] Should see "🛠️ Admin Portal" button
- [ ] Click Admin Portal → should see admin dashboard
- [ ] From admin, navigate to customer area → should show Admin Portal button

### Favicon
- [ ] Visit any page
- [ ] Browser tab should show 🎨 emoji

---

## Common Issues & Solutions

**Problem:** Blank white page at `/admin/login`  
**Solution:** Use `/login` instead - single unified page for all users

**Problem:** See both admin and customer UI mixed together  
**Solution:** Architecture now prevents this - shows one or the other based on role

**Problem:** Image upload returns 500 error  
**Solution:** Using Cloudinary (cloud storage) instead of filesystem - works on serverless

**Problem:** Can't login as admin  
**Solution:** Make sure account exists in `admins` table with hashed password

---

## Next Steps for New Developers

1. Read this file to understand architecture
2. Check `.env.local` for required credentials
3. Review git log for recent changes: `git log --oneline -10`
4. Test locally: `npm run dev` then visit http://localhost:3000
5. For auth issues, check `lib/auth.js` and `lib/customer-auth.js`
6. For database issues, check database URL and schema in `lib/db.js`

---

**Last Updated:** 2026-10-05  
**By:** GitHub Copilot  
**Status:** Active Development
