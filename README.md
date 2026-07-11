# Khelaghor Server

A RESTful backend API for **Khelaghor**, a sports field booking platform built for Bangladesh. The platform connects players with field hosts, allowing users to browse available fields, book time slots, and pay online — while giving hosts full control over their field listings.

---

## Live Demo

**Base API URL:** [https://khelaghor-server-m9i5.onrender.com](https://khelaghor-server-m9i5.onrender.com)

---

## Project Overview

Khelaghor is designed to solve a real problem: finding and booking sports fields in Bangladesh is largely informal and phone-based. This backend handles everything from user authentication and host management to slot scheduling, payment processing, and in-app notifications.

The system supports three roles — **User**, **Host**, and **Admin** — each with their own set of permissions and capabilities.

---

## Features

**Authentication**
- Email/password registration and login
- Google OAuth 2.0 with a secure one-time exchange code pattern (cross-origin safe)
- JWT-based access and refresh tokens stored in HTTP-only cookies
- Refresh token rotation with Redis-backed invalidation
- Email OTP for account verification and password reset
- Change password while authenticated

**User Management**
- View and update personal profile (with avatar upload via Cloudinary)
- Delete own account
- Admin can list, update status/role, and delete any user

**Host Management**
- Users can apply to become a host
- Admin approval flow for host profiles
- Hosts can update their profile information

**Field Management**
- Hosts can create, update, and deactivate their sports fields
- Multiple images per field, uploaded to Cloudinary
- Filterable public listing by sport type, division, and status
- Full-text search support

**Slot Management**
- Hosts create time slots for their fields with custom pricing
- Slots can be updated or deleted
- Slot availability is automatically managed based on booking state

**Booking System**
- Users can book an available slot for a future date
- A user cannot book their own field
- Bookings have an expiry window — unpaid bookings are automatically cancelled by a cron job and the slot is released
- Hosts and admins can view bookings with advanced filtering (status, payment status, sport type, date range, etc.)
- Users can cancel their bookings

**Payments**
- Integrated with **SSLCommerz** for online payment processing
- IPN (Instant Payment Notification) endpoint for server-side payment verification
- Handles success, failure, and cancel redirects
- Payment status is updated transactionally alongside booking status

**Reviews**
- Authenticated users can submit a review and rating for a field
- Public endpoint returns all reviews for a field along with the average rating and total review count

**Notifications**
- In-app notifications triggered on key events (booking confirmed, booking expired, etc.)
- Users can mark individual or all notifications as read
- Unread count endpoint for badge display on the frontend
- Automated cleanup of old notifications via a scheduled cron job

**Map Integration**
- Address autocomplete powered by the Barikoi Maps API
- Reverse geocoding support (coordinates to address)

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js v5 |
| Database | PostgreSQL |
| ORM | Prisma |
| Caching / Session Store | Redis |
| Authentication | JWT, Passport.js (Google OAuth 2.0) |
| Payment Gateway | SSLCommerz |
| File Uploads | Multer + Cloudinary |
| Email | Nodemailer (SMTP) |
| Maps | Barikoi Maps API |
| Validation | Zod |
| Scheduler | node-cron |
| Build Tool | tsup |

---

## Installation

**Prerequisites:** Node.js, PostgreSQL, and Redis must be running locally.

```bash
# 1. Clone the repository
git clone https://github.com/emonpappu17/khelaghor-server.git
cd khelaghor-server

# 2. Install dependencies
npm install

# 3. Set up your environment variables (see section below)
cp .env.example .env

# 4. Run database migrations and generate the Prisma client
npm run db:all

# 5. Start the development server
npm run dev
```

---

## Environment Variables

Create a `.env` file in the root directory with the following keys:

```env
NODE_ENV=development
PORT=5000

# PostgreSQL
DATABASE_URL=your_postgresql_connection_url

# JWT
JWT_ACCESS_SECRET=your_access_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_ACCESS_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d
RESET_PASS_SECRET=your_reset_secret
RESET_PASS_EXPIRES_IN=5m

# Bcrypt
BCRYPT_SALT_ROUNDS=10

# Super Admin Seed
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=your_super_admin_password

# Client
CLIENT_URL=http://localhost:3000
SERVER_URL=http://localhost:5000

# Redis
REDIS_HOST=your_redis_host
REDIS_PORT=6379
REDIS_USERNAME=your_redis_username
REDIS_PASSWORD=your_redis_password

# SMTP
SMTP_HOST=your_smtp_host
SMTP_PORT=465
SMTP_USER=your_smtp_email
SMTP_PASS=your_smtp_password
SMTP_FROM=your_from_email

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=your_google_callback_url

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Barikoi Maps
BARIKOI_API_KEY=your_barikoi_api_key

# SSLCommerz
SSLCOMMERZ_STORE_ID=your_store_id
SSLCOMMERZ_STORE_PASSWORD=your_store_password
SSLCOMMERZ_IS_LIVE=false
```

---

## Project Structure

```
src/
├── app/
│   ├── config/         # Environment config, Passport, SSLCommerz setup
│   ├── cron/           # Scheduled jobs (booking expiry, notification cleanup)
│   ├── errors/         # Custom error classes
│   ├── lib/            # Prisma client, Redis client, notification emitter
│   ├── middlewares/    # Auth guard, error handler, rate limiter, not-found
│   ├── modules/        # Feature modules (auth, user, host, field, slot, booking, payment, review, notification, map)
│   ├── routes/         # Central route registration
│   ├── types/          # Shared TypeScript types
│   └── utils/          # Helper utilities (JWT, cookies, pagination, etc.)
├── generated/          # Prisma generated client
├── app.ts              # Express app setup
└── server.ts           # Entry point (starts server, Redis, cron jobs)
```

Each module follows a consistent structure: `controller`, `service`, `routes`, and `validation`.

---

## Available Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start the development server with watch mode |
| `npm run build` | Build the project for production |
| `npm run start` | Run the production build |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:all` | Run migrations and generate client in one step |
| `npm run db:reset` | Reset the database (drops all data) |
| `npm run db:deploy` | Deploy migrations in a production environment |
| `npm run db:studio` | Open Prisma Studio |
| `npm run render-build` | Full build command used on Render deployment |

---

## Future Improvements

- **Real-time communication** using Socket.IO for live booking status updates and chat
- **Tournament management** allowing hosts to organize and manage tournaments on their fields
- **Player matchmaking** so users booking a solo slot can find others to fill remaining spots
- **Opponent/team finder** for users looking for teams or individuals to play against
- **Payment refund system** to handle automated and manual refunds for cancelled bookings

---

## License

All rights reserved. This project is not open-source. Unauthorized use, distribution, or modification is prohibited.
