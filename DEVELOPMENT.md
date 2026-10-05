# Development Guide

## Quick Start

### Setup
```bash
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Visit: http://localhost:3000

### Environment Variables
```
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=hmunsrg
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=GGG-GD
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Authentication System

### Login Flow
1. User visits `/login`
2. Enters email + password
3. POST to `/api/login`
4. API returns tokens based on user role:
   ```javascript
   {
     isAdmin: true/false,
     isCustomer: true/false,
     adminToken: "jwt...",      // only if admin
     customerToken: "jwt...",   // only if customer
     adminEmail: "...",
     customerEmail: "..."
   }
   ```
5. Frontend routes:
   - Admin only → `/admin`
   - Customer only → `/customer`
   - Both → `/customer` (with Admin Portal button)

### Token Verification

**Admin-protected routes:**
```javascript
const adminToken = req.headers.get('authorization')?.replace('Bearer ', '');
const { verifyToken } = await import('@/lib/auth');
const adminId = verifyToken(adminToken);
```

**Customer-protected routes:**
```javascript
const customerToken = req.headers.get('authorization')?.replace('Bearer ', '');
const { verifyCustomerToken } = await import('@/lib/customer-auth');
const customerId = verifyCustomerToken(customerToken);
```

---

## Adding New Features

### Admin Feature
1. Create route/component in `/app/admin/`
2. Protect with adminToken check
3. Use `lib/auth.js` utilities
4. Add sidebar link in `app/admin/layout.js`

### Customer Feature
1. Create route/component in `/app/customer/`
2. Protect with customerToken check
3. Use `lib/customer-auth.js` utilities
4. Add header link in `app/customer/layout.js`

### Public Feature
1. Create route/component in `/app/`
2. No token required
3. Optionally use localStorage for context

---

## Database

### Schema
```sql
-- Admins
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customers
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Products
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  title VARCHAR NOT NULL,
  description TEXT,
  price INTEGER NOT NULL, -- stored in cents
  image_url VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Orders
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  total INTEGER NOT NULL,
  status VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Order Items
CREATE TABLE order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER,
  price INTEGER
);
```

### Running Migrations
```bash
npm run db:migrate
```

---

## Testing

### Test Login
1. **Admin only:**
   - Email: admin@example.com
   - Should only see `/admin` after login
   - Should NOT see Admin Portal button in customer area

2. **Customer only:**
   - Create via signup or database
   - Should only see `/customer` after login
   - Should NOT see Admin Portal button

3. **Admin + Customer:**
   - Admin email with customer account in both tables
   - Should see `/customer` with Admin Portal button
   - Can switch to `/admin` via button

### Test Image Upload
1. Login as admin
2. Go to Products page
3. Select image from device
4. Should upload to Cloudinary
5. Image URL appears in product list
6. Gallery shows the image

---

## Common Tasks

### Add Admin User
```javascript
// In database
INSERT INTO admins (email, password_hash) 
VALUES ('user@example.com', bcryptjs.hashSync('password', 10));
```

### Add Customer User
```javascript
// In database
INSERT INTO customers (email, password_hash) 
VALUES ('user@example.com', bcryptjs.hashSync('password', 10));
```

### Reset Auth
```javascript
// Clear all tokens
localStorage.removeItem('adminToken');
localStorage.removeItem('adminEmail');
localStorage.removeItem('customerToken');
localStorage.removeItem('customerEmail');
window.location.href = '/login';
```

### Debug Auth
```javascript
// Check tokens
console.log('Admin:', localStorage.getItem('adminToken'));
console.log('Customer:', localStorage.getItem('customerToken'));

// Check API response
fetch('/api/login', {
  method: 'POST',
  body: JSON.stringify({ email: 'test@example.com', password: 'password' })
}).then(r => r.json()).then(console.log);
```

---

## Deployment

### Build
```bash
npm run build
# Check for errors
```

### Deploy
```bash
git add -A
git commit -m "Your message"
git push origin main
# Vercel auto-deploys automatically
```

### Verify Production
1. Visit https://art-marketplace-8ahk.vercel.app
2. Test login at `/login`
3. Check favicon 🎨 in browser tab
4. Test admin features (if admin account)
5. Test customer features (if customer account)

---

## File Organization

```
app/
├── login/
│   ├── page.js          # Unified login form
│   └── layout.js        # Public layout
├── admin/
│   ├── layout.js        # Admin container
│   ├── page.js          # Dashboard
│   ├── products/
│   ├── orders/
│   ├── settings/
│   └── login/           # (deprecated - use /login)
├── customer/
│   ├── layout.js        # Customer header
│   └── page.js          # Dashboard
├── api/
│   ├── login/
│   │   └── route.js     # UNIFIED LOGIN
│   ├── admin/
│   ├── customer/
│   └── products/
├── page.js              # Gallery/storefront
└── layout.js            # Root layout
lib/
├── auth.js              # Admin JWT
├── customer-auth.js     # Customer JWT
├── db.js                # Database queries
└── stripe.js            # Stripe utilities
```

---

## Key Concepts

### Unified Login
- One entry point: `/login`
- Checks both admins and customers tables
- Routes based on role found
- Supports dual-role users

### Token Management
- Admin token: 7 days
- Customer token: 30 days
- Both stored in localStorage
- Used in Authorization header

### Layout Pattern
- Each area has its own layout.js (admin/customer/login)
- Layouts handle auth checks and navigation
- Children rendered inside authenticated container

### Image Upload
- Client uploads to Cloudinary (unsigned)
- No backend file handling
- Returns image URL
- URL saved to database

---

## Troubleshooting

**Blank page at /admin/login**
- This is deprecated, use /login instead

**Can't login as admin**
- Check if account exists in admins table
- Verify password is hashed with bcryptjs

**Image upload 500 error**
- Check Cloudinary env vars
- Verify upload preset is correct
- Check file size (max 5MB)

**Auth token not working**
- Verify Authorization header format: "Bearer {token}"
- Check token expiration (admin 7d, customer 30d)
- Verify JWT_SECRET matches

---

**Last Updated:** 2026-10-05  
**Created By:** GitHub Copilot  
**For:** New developers joining the project
