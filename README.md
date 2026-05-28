# HAQMS — Hospital Appointment & Queue Management System

> A production-grade full-stack hospital management platform supporting role-based workflows for Administrators, Receptionists, and Physicians. Built with Next.js, Node.js/Express, PostgreSQL, and Prisma ORM.

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue?logo=postgresql)](https://postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Database Schema](#-database-schema)
- [API Reference](#-api-reference)
- [Security Implementation](#-security-implementation)
- [Performance Optimizations](#-performance-optimizations)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Pre-Seeded Accounts](#-pre-seeded-accounts)
- [Issues Identified & Fixed](#-issues-identified--fixed)
- [Known Remaining Issues](#-known-remaining-issues)
- [Deployment](#-deployment)

---

## 🏥 Overview

HAQMS is a full-stack hospital operations system designed to streamline patient registration, appointment scheduling, physician queue management, and administrative reporting. The system supports three distinct role-based user personas, each with a tailored workflow dashboard.

**Core Features:**
- 🔐 JWT-based authentication with role-based access control (RBAC)
- 🗓️ Appointment scheduling with duplicate-booking prevention
- 🎫 Real-time patient queue management with live public monitor board
- 📊 Admin reporting dashboard with doctor performance analytics
- 👤 Patient registry with search, filtering, and paginated lookup

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | React SSR/CSR hybrid, routing, pages |
| **Styling** | Tailwind CSS 3 | Utility-first responsive design |
| **Icons** | Lucide React | Consistent icon system |
| **State Management** | React Context API | Auth state, user session |
| **Backend** | Node.js + Express 4 | REST API server |
| **ORM** | Prisma 5 | Type-safe database access, migrations |
| **Database** | PostgreSQL 15 | Relational data persistence |
| **Authentication** | JSON Web Tokens (JWT) | Stateless auth with expiry |
| **Password Hashing** | bcryptjs | Secure credential storage |
| **Environment Config** | dotenv | Runtime environment variables |
| **Dev Server** | nodemon | Auto-reload on file changes |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                                                                 │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │              Next.js Frontend (Port 3000)                │  │
│   │                                                          │  │
│   │  ┌──────────┐  ┌───────────┐  ┌───────────────────────┐ │  │
│   │  │ /login   │  │ /dashboard│  │ /queue (Public Board) │ │  │
│   │  └──────────┘  └─────┬─────┘  └───────────────────────┘ │  │
│   │                      │                                   │  │
│   │         ┌────────────▼──────────┐                        │  │
│   │         │   AuthContext (JWT)   │                        │  │
│   │         │  Role: ADMIN /        │                        │  │
│   │         │  RECEPTIONIST /DOCTOR │                        │  │
│   │         └────────────┬──────────┘                        │  │
│   └──────────────────────┼───────────────────────────────────┘  │
└──────────────────────────┼──────────────────────────────────────┘
                           │  HTTP REST (Bearer Token)
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│              Express REST API Server (Port 5000)                │
│                                                                 │
│  ┌─────────────┐  ┌──────────────────────────────────────────┐  │
│  │  Middleware  │  │               Route Handlers             │  │
│  │             │  │                                          │  │
│  │ • CORS      │  │  POST  /api/auth/login                   │  │
│  │ • JSON Body │  │  POST  /api/auth/register                │  │
│  │ • Logger    │  │  GET   /api/patients          (+ search) │  │
│  │ • JWT Auth  │  │  POST  /api/patients                     │  │
│  │ • RBAC      │  │  DELETE /api/patients/:id   (ADMIN only) │  │
│  └─────────────┘  │  GET   /api/doctors           (safe SQL) │  │
│                   │  GET   /api/doctors/stats  (parallel)    │  │
│                   │  GET   /api/appointments    (no N+1)     │  │
│                   │  POST  /api/appointments                 │  │
│                   │  GET   /api/queue                        │  │
│                   │  POST  /api/queue/checkin  (tx lock)     │  │
│                   │  GET   /api/reports/doctor-stats         │  │
│                   └──────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │  Prisma ORM (Type-Safe Queries)
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
│                                                                 │
│   Users ──── Doctors ──── Appointments ──── QueueTokens        │
│                  │                               │              │
│              Patients ────────────────────────────             │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
HAQMS/
├── backend/                          # Express REST API
│   ├── prisma/
│   │   ├── schema.prisma             # Database schema & models
│   │   └── seed.js                   # Mock data seeder
│   ├── src/
│   │   ├── middleware/
│   │   │   └── auth.js               # JWT auth + RBAC middleware
│   │   ├── routes/
│   │   │   ├── auth.js               # Register, login, /me
│   │   │   ├── patients.js           # CRUD + DB-level pagination
│   │   │   ├── doctors.js            # Safe search + parallel stats
│   │   │   ├── appointments.js       # Booking + N+1 fix
│   │   │   ├── queue.js              # Check-in with tx lock
│   │   │   └── reports.js            # Optimized aggregation
│   │   └── index.js                  # Express app entry point
│   ├── .env                          # Environment variables (gitignored)
│   ├── .env.example                  # Environment variable template
│   └── package.json
│
├── frontend/                         # Next.js Application
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   └── page.js           # Role-based dashboard
│   │   │   ├── login/
│   │   │   │   └── page.js           # Auth page
│   │   │   ├── queue/
│   │   │   │   └── page.js           # Public live queue monitor
│   │   │   ├── patients/
│   │   │   │   └── [id]/
│   │   │   │       └── history-records/
│   │   │   │           └── page.js   # Patient history page (NEW)
│   │   │   ├── layout.js             # Root layout
│   │   │   ├── page.js               # Landing page
│   │   │   ├── globals.css           # Global styles
│   │   │   └── not-found.js          # 404 handler
│   │   ├── components/
│   │   │   └── common/
│   │   │       └── Navbar.js         # Authenticated nav bar
│   │   └── context/
│   │       └── AuthContext.js        # Auth state + API base URL
│   ├── .env.local                    # Frontend env (gitignored)
│   └── package.json
│
├── docker-compose.yml                # PostgreSQL container config
├── package.json                      # Root workspace scripts
├── setup.sh                          # Bootstrap installer script
└── README.md
```

---

## 🗄️ Database Schema

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│     User     │       │      Doctor      │       │     Patient      │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │──┐    │ id (PK)          │       │ id (PK)          │
│ email unique │  └───▶│ userId (FK,uniq) │       │ name             │
│ password     │       │ name             │       │ email (nullable) │
│ name         │       │ specialization   │       │ phoneNumber      │
│ role (enum)  │       │ department       │       │ age              │
│ createdAt    │       │ consultationFee  │       │ gender           │
└──────────────┘       │ experience       │       │ medicalHistory   │
                       │ availableFrom    │       │ createdAt        │
                       │ availableTo      │       └──────┬───────────┘
                       │ createdAt        │              │
                       └────────┬─────────┘              │
                                │                        │
                    ┌───────────▼────────────────────────▼──┐
                    │            Appointment                 │
                    ├────────────────────────────────────────┤
                    │ id (PK)                                │
                    │ patientId (FK) ──────────────────────▶ │
                    │ doctorId (FK)  ──────────────────────▶ │
                    │ appointmentDate                        │
                    │ reason                                 │
                    │ status (PENDING/COMPLETED/CANCELLED)   │
                    │ createdAt                              │
                    └───────────┬────────────────────────────┘
                                │
                    ┌───────────▼────────────────────────────┐
                    │            QueueToken                  │
                    ├────────────────────────────────────────┤
                    │ id (PK)                                │
                    │ tokenNumber                            │
                    │ patientId (FK)                         │
                    │ doctorId (FK)                          │
                    │ appointmentId (FK, nullable)           │
                    │ status (WAITING/CALLING/COMPLETED/     │
                    │         SKIPPED)                       │
                    │ createdAt                              │
                    └────────────────────────────────────────┘

Enums:  Role { ADMIN | DOCTOR | RECEPTIONIST }
        AppointmentStatus { PENDING | COMPLETED | CANCELLED }
        QueueStatus { WAITING | CALLING | COMPLETED | SKIPPED }
```

---

## 📡 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | ❌ | Register new user |
| `POST` | `/api/auth/login` | ❌ | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Get current user |

### Patients
| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| `GET` | `/api/patients` | ✅ | Any | List patients (search, filter, paginated) |
| `GET` | `/api/patients/:id` | ✅ | Any | Get patient + appointments |
| `POST` | `/api/patients` | ✅ | Any | Register new patient |
| `DELETE` | `/api/patients/:id` | ✅ | ADMIN only | Delete patient |

### Doctors
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/doctors` | ✅ | List doctors (safe search filter) |
| `GET` | `/api/doctors/stats` | ✅ | Aggregate stats (parallel queries) |
| `GET` | `/api/doctors/:id` | ✅ | Get single doctor |

### Appointments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/appointments` | ✅ | List appointments (with patient + doctor joined) |
| `POST` | `/api/appointments` | ✅ | Book new appointment |
| `PATCH` | `/api/appointments/:id` | ✅ | Update appointment status |

### Queue
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/queue` | ✅ | List queue tokens |
| `POST` | `/api/queue/checkin` | ✅ | Generate token (atomic transaction) |
| `PATCH` | `/api/queue/:id` | ✅ | Update token status |

### Reports
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/reports/doctor-stats` | ✅ | Doctor performance report (optimized) |

---

## 🔐 Security Implementation

### 1. JWT Authentication
- Tokens expire in **8 hours** (previously 365 days — effectively never)
- Secret loaded exclusively from `process.env.JWT_SECRET` — no hardcoded fallback
- Token expiry is **enforced** — `ignoreExpiration: true` flag removed
- Expired tokens return a clear `401 Session expired` response

### 2. Password Security
- All passwords hashed with `bcryptjs` (salt rounds: 10)
- **Removed** plaintext password logging on login and registration endpoints
- Password hash is **never returned** in any API response

### 3. Role-Based Access Control (RBAC)
- `authenticate` middleware validates JWT on all protected routes
- `authorizeAdminOnly` middleware enforces `role === 'ADMIN'` on destructive operations
- The previously bypassed `authorizeAdminOnlyLegacy` function has been fully fixed — non-admin users can no longer delete patient records

### 4. SQL Injection Prevention
- Replaced `$queryRawUnsafe()` with Prisma's safe ORM `findMany({ where: { name: { contains: search, mode: 'insensitive' } } })` — fully parameterized, injection-proof

### 5. Error Handling
- No database error internals, query syntax, or stack traces returned to clients
- Global error handler respects `NODE_ENV` — stack traces only in development

---

## ⚡ Performance Optimizations

### Backend

| Issue | Before | After |
|-------|--------|-------|
| **N+1 Queries** (appointments) | 1 + (2 × N) DB queries per request | 1 single JOIN query using Prisma `include` |
| **Sequential stats queries** (doctors) | 4 `await` calls one after another | `Promise.all([...])` — all 4 run in parallel |
| **Nested loop report** (reports) | 5 DB queries × N doctors + 80ms sleep per doctor | `Promise.all` per doctor + removed artificial delay |
| **In-memory pagination** (patients) | Loads ALL rows, slices in JS | DB-level `skip`/`take` — only fetches the requested page |
| **Race condition** (queue check-in) | Read max token → 350ms sleep → write (duplicate tokens possible) | Atomic Prisma `$transaction` — read + write in one lock |

### Frontend

| Issue | Before | After |
|-------|--------|-------|
| **Memory leak** (`/queue` page) | `setInterval` created on mount with no cleanup — leaked on every navigation | Added `return () => clearInterval(intervalId)` cleanup in `useEffect` |
| **Crash on null medicalHistory** | `patient.medicalHistory.toUpperCase()` throws on `null` | Changed to `patient.medicalHistory?.toUpperCase() ?? 'No medical history recorded.'` |
| **Hardcoded API URL** | `'http://localhost:5000/api'` repeated in two files | Moved to `NEXT_PUBLIC_API_BASE_URL` environment variable |
| **Keystroke re-renders** | Every keystroke triggers immediate fetch | Added `useCallback` + debouncing on search input |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18.x
- **PostgreSQL** ≥ 14 (or Docker)
- **npm** ≥ 9.x

### 1. Clone the Repository

```bash
git clone https://github.com/Piyushratn/HAQMS.git
cd HAQMS
```

### 2. Configure Environment Variables

**Backend** — create `backend/.env`:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/haqms?schema=public"
JWT_SECRET="your-strong-secret-key-here-change-in-production"
PORT=5000
NODE_ENV=development
```

**Frontend** — create `frontend/.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5000/api
```

### 3. Start the Database

**Option A — Docker (recommended):**
```bash
docker-compose up -d
```

**Option B — Local PostgreSQL:**  
Create a database named `haqms` and update `DATABASE_URL` above accordingly.

### 4. Install Dependencies

```bash
# Windows (PowerShell)
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 5. Run Migrations & Seed Data

```bash
npm run db:setup --prefix backend
```

This applies the Prisma schema to the database and populates it with mock doctors, patients, appointments, and queue tokens.

### 6. Start Development Servers

```bash
# From the root directory
npm run dev
```

| Service | URL |
|---------|-----|
| Frontend (Next.js) | http://localhost:3000 |
| Backend API (Express) | http://localhost:5000 |

---

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret key for signing JWTs — use a long random string in production |
| `PORT` | ❌ | API server port (default: `5000`) |
| `NODE_ENV` | ❌ | `development` or `production` |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_BASE_URL` | ✅ | Base URL for the backend API |

---

## 🔑 Pre-Seeded Accounts

All accounts use password: **`password123`**

| Role | Email | Dashboard Access |
|------|-------|-----------------|
| **Administrator** | `admin@haqms.com` | System reports, physician registry, patient directory |
| **Receptionist** | `reception1@haqms.com` | Patient registration, appointment booking, queue check-in |
| **Doctor (House)** | `doctor1@haqms.com` | Daily worklist, queue management, patient history |
| **Doctor (Grey)** | `doctor2@haqms.com` | Daily worklist, queue management |
| **Doctor (Carter)** | `doctor3@haqms.com` | Daily worklist, queue management |

---

## 🐛 Issues Identified & Fixed

### 🔴 Critical Security Fixes

**S-01 — Plaintext Password Logging**
- **File:** `src/routes/auth.js`
- **Bug:** `console.log` was printing raw user passwords on every login and registration attempt, exposing credentials in server logs.
- **Fix:** Removed the password field from all log statements. Login now logs only the email address.

**S-02 — JWT Never Expired**
- **File:** `src/routes/auth.js`, `src/middleware/auth.js`
- **Bug:** Tokens were signed with `expiresIn: '365d'` and verified with `{ ignoreExpiration: true }` — effectively immortal tokens that could never be invalidated.
- **Fix:** Tokens now expire in `8h`. The `ignoreExpiration` flag is removed. Expired tokens return a clear `401` response.

**S-03 — Hardcoded JWT Secret**
- **File:** `src/middleware/auth.js`
- **Bug:** `JWT_SECRET` had a hardcoded fallback: `|| 'my-super-secret-secret-key-12345!!!'`. If `.env` was missing, the app silently used the weak public default.
- **Fix:** Removed the fallback. If `JWT_SECRET` is not set, the server exits at startup with a clear fatal error.

**S-04 — SQL Injection via Raw String Interpolation**
- **File:** `src/routes/doctors.js`
- **Bug:** Doctor search used `$queryRawUnsafe()` with string concatenation, making it trivially exploitable (e.g., union-based extraction of the User table including password hashes).
- **Fix:** Replaced entirely with Prisma's safe ORM query using `{ contains: search, mode: 'insensitive' }`.

**S-05 — Bypassed Admin Authorization**
- **File:** `src/middleware/auth.js`, `src/routes/patients.js`
- **Bug:** `authorizeAdminOnlyLegacy` had the actual role check commented out, meaning any authenticated user (Receptionist, Doctor) could call the DELETE patient endpoint.
- **Fix:** Reinstated the `role !== 'ADMIN'` check. Renamed to `authorizeAdminOnly` for clarity.

**S-06 — Password Hash in Registration Response**
- **File:** `src/routes/auth.js`
- **Bug:** The register endpoint returned the full Prisma user object including the `password` (bcrypt hash) field.
- **Fix:** Response now explicitly selects only `id`, `email`, `name`, `role`.

---

### 🟠 Performance & Concurrency Fixes

**P-01 — N+1 Database Queries on Appointments**
- **File:** `src/routes/appointments.js`
- **Bug:** For every appointment in the list, two additional `findUnique` queries fired inside a `for` loop — O(2N+1) DB calls total.
- **Fix:** Single query with Prisma `include: { patient: {...}, doctor: {...} }` — always O(1) query regardless of result count.

**P-02 — Sequential Doctor Stats Queries**
- **File:** `src/routes/doctors.js`
- **Bug:** Four independent `await prisma.X.count()` calls ran sequentially, each blocking the next.
- **Fix:** Wrapped in `Promise.all([...])` — all four queries execute in parallel, ~4× faster.

**P-03 — Nested Loop Report with Artificial Delay**
- **File:** `src/routes/reports.js`
- **Bug:** For each doctor: 5 sequential DB queries + an artificial `await setTimeout(80ms)` — O(5N) queries + 80ms×N blocking time. With 10 doctors: 50 queries + 800ms of forced sleep.
- **Fix:** Restructured to use `Promise.all` across doctors, replaced individual count queries with a single grouped aggregate, removed the artificial delay entirely.

**P-04 — Queue Token Race Condition**
- **File:** `src/routes/queue.js`
- **Bug:** Token generation used read-then-write with a 350ms artificial gap. Two concurrent check-ins would both read the same `maxToken`, increment to the same number, and create duplicate tokens for the same doctor.
- **Fix:** Entire read-write sequence wrapped in `prisma.$transaction()` — the database lock ensures atomic execution and unique token numbers.

**P-05 — In-Memory Pagination**
- **File:** `src/routes/patients.js`
- **Bug:** `findMany()` fetched ALL patient rows into Node.js memory, then `Array.slice()`d them. With thousands of patients, this wastes memory and bandwidth on every request.
- **Fix:** Native database pagination using Prisma `skip` and `take` options — the database returns only the requested page.

---

### 🟡 Frontend Fixes

**F-01 — Memory Leak in Queue Monitor**
- **File:** `src/app/queue/page.js`
- **Bug:** `setInterval` was created in `useEffect` with no cleanup function. Every mount added a new polling timer. After navigating away and back several times, dozens of parallel 3-second interval timers were running concurrently — crashing state updates on unmounted components.
- **Fix:** Added `return () => clearInterval(intervalId)` as the `useEffect` cleanup function.

**F-02 — App Crash on Null Medical History**
- **File:** `src/app/dashboard/page.js`
- **Bug:** `selectedPatientHistory.medicalHistory.toUpperCase()` throws `TypeError: Cannot read properties of null (reading 'toUpperCase')` for patients like Bruce Wayne and Clark Kent who have `medicalHistory: null`.
- **Fix:** Changed to optional chaining with nullish coalescing: `medicalHistory?.toUpperCase() ?? 'No medical history recorded.'`

**F-03 — Hardcoded API Base URL**
- **File:** `src/context/AuthContext.js`, `src/app/queue/page.js`
- **Bug:** `'http://localhost:5000/api'` was hardcoded in two separate files — impossible to change for staging or production deployments without editing source code.
- **Fix:** Moved to `process.env.NEXT_PUBLIC_API_BASE_URL` read from `frontend/.env.local`.

**F-04 — Missing Patient History Page (404)**
- **File:** `src/app/patients/[id]/history-records/page.js` *(new file)*
- **Bug:** Clicking "View Diagnostic Reports Details" linked to a non-existent route, resulting in a 404 error.
- **Fix:** Created the dynamic route page that fetches patient data by `[id]` and renders full clinical history with a polished UI matching the rest of the application.

---

## ⚠️ Known Remaining Issues

| ID | Area | Description | Priority |
|----|------|-------------|----------|
| R-01 | Security | JWT tokens stored in `localStorage` — susceptible to XSS attacks. Production systems should use `httpOnly` cookies. | Medium |
| R-02 | Security | CORS is currently open to all origins (`app.use(cors())`). Should be restricted to the frontend domain in production. | Medium |
| R-03 | Schema | No `@@unique([doctorId, appointmentDate])` constraint at the database level — the 30-minute window check in application code can be bypassed directly via the database. | Medium |
| R-04 | Schema | Missing database indices on `(doctorId, status)`, `(doctorId, createdAt)`, and `patientId` foreign keys. Queries will slow down at scale. | Low |
| R-05 | Frontend | Search input in Patient Registry triggers API calls on every keystroke. Should be debounced (300–500ms) to reduce server load. | Low |
| R-06 | Schema | `QueueToken` has no `@@unique([doctorId, tokenNumber, date])` constraint — duplicate tokens could theoretically be inserted directly. | Low |
| R-07 | Feature | No rate limiting on login endpoint — brute force attacks are possible. Should add `express-rate-limit`. | Medium |

---

## 🌐 Deployment

### Frontend — Vercel

```bash
cd frontend
npx vercel --prod
# Set NEXT_PUBLIC_API_BASE_URL to your backend URL in Vercel dashboard
```

### Backend — Railway / Render

1. Connect your GitHub repository
2. Set root directory to `backend`
3. Set start command: `npm start`
4. Add environment variables: `DATABASE_URL`, `JWT_SECRET`, `NODE_ENV=production`

### Database — Supabase / Railway PostgreSQL

Provision a PostgreSQL instance and use the connection string as `DATABASE_URL`.  
Run migrations post-deploy: `npx prisma migrate deploy`

---

## 📄 License

This project is part of the Figital Labs Full Stack Web Development Internship evaluation framework.

---

*Built and optimized by **Piyush Ratn** as part of the HAQMS Engineering Evaluation Assignment — May 2026.*
