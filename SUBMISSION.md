# HAQMS Optimization & Security Engineering Audit Report

## 1. Executive Summary
Over a target engineering window, I conducted a complete architectural audit of the HAQMS ecosystem. The codebase contained several classic production vulnerabilities, blocking resource locks, and UI vulnerability patterns left by junior developers. By isolating issues across four categories, I systematically refactored the platform into a secure, predictable, enterprise-ready state.

---

## 2. Issues Identified & Fixed

### 🔒 Category 1: Security Hardening

#### 1. Vertical Privilege Escalation Bypass
* **File Location:** `backend/src/middleware/auth.js`
* **The Trap:** The critical `authorizeAdminOnlyLegacy` middleware was completely empty, allowing non-admin personnel (like receptionists or doctors) to drop rows from core directories via structural route commands.
* **The Engineering Fix:** Rewrote the entry point logic to explicitly validate `req.user.role === 'ADMIN'`. Unauthorized accounts are now instantly repelled with an HTTP 403 Forbidden sequence.

#### 2. Raw SQL Injection Vulnerability
* **File Location:** `backend/src/routes/doctors.js`
* **The Trap:** The search endpoint accepted a text query string parameter and plugged it directly into a raw query using string interpolation (`$queryRawUnsafe`). This meant anyone could input a standard SQL statement split (`' UNION SELECT...`) and read or delete everything in the database.
* **The Engineering Fix:** Re-implemented the database lookup utilizing strict parameterized template tag boundaries via `Prisma.sql` hooks. The query wrapper automatically parameterizes input boundaries, completely sealing the injection risk.

#### 3. Insecure Log Leaks & Inconsistent JSON Layouts
* **File Location:** `backend/src/routes/auth.js`
* **The Trap:** The system was capturing raw signup payloads and logging raw text passwords directly into shell outputs. Furthermore, successful user creation loops blindly printed out sensitive password hashes to the client, while standard responses lacked structured wrapping signatures.
* **The Engineering Fix:** Removed text payload prints from the logging paths, modified queries to return explicitly specified column maps (`select`), and wrapped outputs inside standardized success JSON formats.

---

### ⚡ Category 2: Backend Performance & Concurrency Optimization

#### 1. The N+1 Database Query Loop
* **File Location:** `backend/src/routes/appointments.js`
* **The Trap:** To show patient and doctor details on a booking row, the endpoint was fetching a master array of appointments, loop-iterating through every single entry, and executing two individual, separate queries per item. This hits the database hundreds of times, causing terrible lag at scale.
* **The Engineering Fix:** Ditched the sequential loop structure. I utilized Prisma's eager relation paths (`include`) to combine the fetching matrix into a single database trip using native inner joins.

#### 2. Synchronous Event-Loop Blocking
* **File Location:** `backend/src/routes/doctors.js` (`/stats` route)
* **The Trap:** Separate, non-dependent analytical aggregate indicators (total doctors, counts of surgeons, averages, max tracking indices) were written tracking one after another using blocking `await` triggers. The event loop had to halt and wait for each counter to finish before starting the next one.
* **The Engineering Fix:** Wrapped all standalone calculations inside a concurrent execution wrapper using `Promise.all()`. This allows all indicators to compile at the exact same millisecond.

#### 3. Check-In Concurrency Race Condition
* **File Location:** `backend/src/routes/queue.js`
* **The Trap:** Building live checkout token values was written as an asynchronous split operational set: compute maximum existing numbers, sleep for an artificial delay, and then insert an incremented integer (`currentMax + 1`). If two patients check in at the exact same time, they get assigned duplicate token values.
* **The Engineering Fix:** Removed the junior-dev timeout loops and packaged the generation steps inside an isolated, atomic database transaction (`$transaction`). This blocks other records from writing until the current token is successfully locked in.

---

### 💾 Category 3: Database Directory Slicing

#### 1. In-Memory Slicing Degradation
* **File Location:** `backend/src/routes/patients.js`
* **The Trap:** Page layouts fetched the *entire* patient table list into RAM, filtered matches through heavy array search computations, and then trimmed items locally using an inline memory split (`.slice()`). This eats up server memory and completely locks up if you have thousands of records.
* **The Engineering Fix:** Transferred the calculation load down to PostgreSQL by configuring native database query operators. Implemented native `skip` and `take` variables inside the queries to run efficient pagination directly on the database server.

---

### 🖥️ Category 4: Frontend Stability & Memory Safeguards

#### 1. Severe Event Loop Polling Memory Leak
* **File Location:** `frontend/src/app/queue/page.js`
* **The Trap:** The public screen was spinning up background data sync workers using a `setInterval` loop with zero clean-up instructions attached. Navigating away and back to the page left old loops running forever in the background, crashing the user's browser.
* **The Engineering Fix:** Added an explicit return function returning `clearInterval` inside the page's structural `useEffect` hook. This safely wipes out any active background sync loop the millisecond a user leaves the page.

#### 2. Empty Field UI Crash
* **File Location:** `frontend/src/app/dashboard/page.js`
* **The Trap:** Clicking on a patient who didn't have any past medical background notes added (like Bruce Wayne) threw a fatal unhandled property error, completely crashing the entire React app. This happened because the code was running text manipulation (`.toUpperCase()`) directly on a `null` variable.
* **The Engineering Fix:** Put defensive programming blocks in place. Implemented optional chaining validations (`?.`) and built an inline fallback layout string if data fields return empty.

---

## 3. Remaining Known Issues & Next Steps
1. **Move Hardcoded API Strings to Environment Variables:** The frontend components have several hardcoded target base domain links (`http://localhost:5000/api`). Moving forward, these should be loaded from a single project-level configuration setup using Next.js environment environment variables (`NEXT_PUBLIC_API_BASE_URL`).
2. **Database Schema Constraints:** Missing compound unique index blocks within `schema.prisma` should be activated to enforce time slot rules right at the database engine level (e.g., adding `@@unique([doctorId, appointmentDate])`).