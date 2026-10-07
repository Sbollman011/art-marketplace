# Art Marketplace Architecture

## Project Overview
Full-stack art marketplace with Next.js 14, PostgreSQL, Cloudinary storage, Stripe payments, and role-based access control.

**Live URL:** https://art-marketplace-8ahk.vercel.app  
**Repository:** https://github.com/Sbollman011/art-marketplace

---

## Authentication System

### Current Flow (UNIFIED LOGIN - Oct 5, 2026)
All users (admins and customers) login through a single unified login page.

**Login Flow:**
1. User visits `/login` page
2. Enters email + password
3. API checks:
   - Is this email in `admins` table?
   - Is this email in `customers` table?
4. Routes based on role:
   - **Admin only** (no customer account) → `/admin` dashboard
   - **Customer only** (no admin account) → `/customer` dashboard
   - **Both roles** → `/customer` dashboard with "🛠️ Admin Portal" button

### Token System

**localStorage keys:**
- `adminToken` - JWT for admin operations (7-day expiration)
- `adminEmail` - Admin email address
- `customerToken` - JWT for customer operations (30-day expiration)
- `customerEmail` - Customer email address

**Token presence determines UI:**
- `adminToken` only → Show admin sidebar, hide customer features
- `customerToken` only → Show customer dashboard, hide admin button
- Both tokens → Show customer dashboard + Admin Portal button

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
- `app/login/page.js` - **Unified login form** (all users)
- `app/login/layout.js` - Public layout for login page
- `lib/auth.js` - Admin JWT utilities
- `lib/customer-auth.js` - Customer JWT utilities
- `app/api/login/route.js` - **Unified login endpoint**

### Admin Area
- `app/admin/layout.js` - Admin portal container with sidebar (auth protected)
- `app/admin/page.js` - Dashboard
- `app/admin/products/page.js` - Product management with Cloudinary upload
- `app/admin/orders/page.js` - Order management
- `app/admin/settings/page.js` - Admin settings
- `app/api/admin/upload/route.js` - Image upload to Cloudinary
- `app/api/admin/products/route.js` - Product CRUD
- `app/api/admin/orders/route.js` - Order management

### Customer Area
- `app/customer/layout.js` - Customer portal header with logout + admin button
- `app/customer/page.js` - Customer dashboard (order history, account info)

### Public Pages
- `app/page.js` - Gallery/storefront (links to /login for "My Account")
- `app/layout.js` - Root layout with favicon
- `app/api/products/route.js` - Public product listing
- `app/api/orders/route.js` - Public order lookup by email
- `app/api/quote/route.js` - Cart pricing (subtotal + shipping)
- `app/api/checkout-session/route.js` - Order creation + Stripe Checkout

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
- [x] Shipping calculator (size + destination zone from Seattle)
- [x] Sales tax via Stripe Tax

### 🔄 In Progress
- Image display optimization
- Email notifications (Resend integration)
- SMS notifications (Twilio integration)

### ⏳ Planned
- Product reviews/ratings
- Image gallery with lightbox
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
- `POST /api/quote` - Price a cart (subtotal + shipping) for a delivery address
- `POST /api/checkout-session` - Create order and Stripe Checkout session
- `GET /api/orders?email=...` - Get customer orders

### Authentication
- `POST /api/login` - **Unified login** (admin or customer)
  - Request: `{ email, password }`
  - Response: `{ isAdmin, isCustomer, adminToken?, customerToken?, adminEmail?, customerEmail? }`
  - Routes frontend: admin-only → /admin, customer → /customer

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

### Session 2026-10-05 Part 2: Unified Authentication (Latest)
**Goal:** Single login page for all users with role-based routing

**Implementation:**
- One `/login` page serves all user types (admin, customer, or both)
- Unified `/api/login` endpoint checks both tables and returns appropriate tokens
- Frontend routes based on role: admin-only → /admin, customer → /customer
- Admin + Customer users can switch between portals using "Admin Portal" button

**Key Features:**
- Admins without customer account see only admin dashboard
- Customers without admin account see only customer dashboard
- Users with both roles see customer dashboard with admin switch button
- Clean separation of concerns: one entry point, role-based UI

**Changes Made:**
1. Created `app/login/page.js` - unified login UI form
2. Created `app/login/layout.js` - public layout with no auth checks
3. Created `app/api/login/route.js` - endpoint handling all auth logic
4. Removed embedded auth form from customer/layout.js
5. Updated admin/layout.js to redirect to /login instead of /admin/login
6. Updated app/page.js gallery to link to /login for "My Account"

**Files Modified:**
- app/login/page.js (NEW)
- app/login/layout.js (NEW)
- app/api/login/route.js (NEW)
- app/admin/layout.js
- app/customer/layout.js
- app/page.js
- ARCHITECTURE.md

### Session 2026-10-05 Part 1: Hydration Fix + Favicon
**Goal:** Fix blank admin login page, add emoji favicon

**Changes:**
1. Fixed React hydration error with separate /admin/login/layout.js
2. Added 🎨 emoji favicon to browser tabs via SVG data URI
3. Implemented admin/customer dual access with role-based UI visibility

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
