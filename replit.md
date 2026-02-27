# Golf SIM Sorel-Tracy - Website Documentation

## Overview

Golf SIM Sorel-Tracy is a premium indoor golf simulator facility website built with modern web technologies. The application provides an immersive, magazine-style digital experience for a high-end golf simulation lounge in Sorel-Tracy, Quebec. Users can browse facility information, view pricing, explore galleries, and book simulator bays with integrated Google Calendar synchronization.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Routing**
- React 18 with TypeScript for type-safe component development
- Wouter for lightweight client-side routing (alternative to React Router)
- Vite as the build tool and development server for fast HMR and optimized production builds

**UI Framework & Styling**
- Tailwind CSS v4 (using @tailwindcss/vite plugin) for utility-first styling with custom design tokens
- Shadcn/ui components based on Radix UI primitives for accessible, composable UI elements
- Custom CSS variables for theme colors (cream/white background `#F7F3E8`, black `#1B1A18`, primary green `#2B5734`)
- Font stack: "Oswald" for headings, "DM Sans" for body text

**Animation & Interactivity**
- Framer Motion for page transitions and scroll-based animations
- GSAP with ScrollTrigger and MotionPathPlugin for complex scroll-driven golf ball path animations
- Custom scroll effects including animated golf ball following scroll progress

**Form Handling & Validation**
- React Hook Form for performant form state management
- Zod for schema validation with @hookform/resolvers integration
- Type-safe form schemas shared between client and server

**State Management & Data Fetching**
- TanStack Query (React Query) for server state management, caching, and API communication
- Custom query client configuration with credentials and error handling

### Backend Architecture

**Server Framework**
- Express.js with TypeScript running on Node.js
- HTTP server created via Node's native `http` module
- Custom middleware for JSON parsing, URL encoding, and raw body capture (for webhook support)
- Session-based authentication using express-session with secure cookies

**API Design**
- RESTful API endpoints under `/api/*` namespace
- POST `/api/book` - booking creation with conflict checking and Google Calendar integration
- POST `/api/auth/login` - admin authentication with bcrypt password verification
- POST `/api/auth/logout` - session destruction and logout
- GET `/api/auth/session` - check current authentication status
- GET/PUT `/api/admin/calendar-settings` - protected calendar configuration endpoints
- Validation using Zod schemas shared with frontend via `@shared/schema`

**Database Layer**
- Drizzle ORM for type-safe database operations
- PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Schema definition in `shared/schema.ts` with auto-generated TypeScript types
- Connection pooling for efficient database access

**Database Schema**
- `bookings` table with fields: id (UUID), name, email, phone, date, time, duration, bayType (bay 1-4), players (1-4), notes, calendarEventId, createdAt
- `admin_users` table with fields: id (UUID), username (unique), passwordHash, role, createdAt
- `calendar_settings` table with fields: id (UUID), syncEmail, calendarId, debugMode, updatedAt
- `operating_schedule` table with fields: id (UUID), dayOfWeek (0=Sun–6=Sat, unique), openHour, openMinute, lastBookingHour, lastBookingMinute, closeHour (supports 24/25 for past-midnight), closeMinute, updatedAt
- Unique constraint on (bayType, date, time) to prevent double-booking

**Admin Authentication System**
- Hidden `/login` page accessible at `/login` (not linked in navigation)
- Session-based authentication with bcrypt password hashing
- Protected `/admin` dashboard for calendar settings management
- Default admin credentials: username `admin`, password `golfsim2024`
- SESSION_SECRET environment variable required in production

**Operating Schedule System**
- Database-driven day-of-week operating schedule (editable from admin panel)
- Each day has: openHour/openMinute, lastBookingHour/lastBookingMinute, closeHour/closeMinute
- Close hours ≥24 represent next-day (e.g., 25 = 1AM next day for Fri/Sat)
- Slots can only START between open and lastBookingTime
- Booking end time must be ≤ closeTime
- Schedule fetched from DB on every availability request (no caching — admin changes take effect immediately)
- Default schedule: Mon-Wed close 23h, Thu close midnight, Fri-Sat close 1AM, Sun last booking 21h close 22h
- Admin UI: "Horaire d'ouverture" card in Administration section with per-day editable dropdowns

**Booking Business Logic**
- Conflict detection: checks existing bookings for same bay, date, and overlapping time windows
- Time overlap calculation converts time strings and duration to minutes for precise comparison
- Pricing: 25$/hour per bay for all durations
- Atomic operations: booking creation fails if calendar sync fails (prevents orphaned bookings)

### External Dependencies

**Google Calendar Integration**
- `googleapis` library for official Google Calendar API access
- Authentication via Replit Connectors system (fetches tokens from `REPLIT_CONNECTORS_HOSTNAME`)
- Supports both repl identity tokens and deployment renewal tokens
- OAuth2 client credential management with automatic token refresh
- Event creation with start/end datetime, summary, and description
- Bidirectional sync: stores `calendarEventId` in database for future updates/deletions
- Calendar sync email configurable via admin dashboard

**Development & Deployment Tools**
- Replit-specific plugins:
  - `@replit/vite-plugin-runtime-error-modal` for development error overlay
  - `@replit/vite-plugin-cartographer` for project mapping
  - `@replit/vite-plugin-dev-banner` for development environment indicator
- Custom `vite-plugin-meta-images` to dynamically update OpenGraph meta tags with deployment URL
- ESBuild for server-side bundling with selective dependency externalization

**Build Process**
- Client build via Vite outputs to `dist/public`
- Server build via ESBuild bundles to `dist/index.cjs` with allowlisted dependencies
- Production server serves static assets from `dist/public` and falls back to `index.html` for SPA routing

**Environment Variables**
- `DATABASE_URL` - PostgreSQL connection string (required)
- `SESSION_SECRET` - Secret for session encryption (required in production)
- `REPLIT_CONNECTORS_HOSTNAME` - Replit connectors API endpoint
- `REPL_IDENTITY` or `WEB_REPL_RENEWAL` - Authentication tokens for Replit services
- `NODE_ENV` - environment flag (development/production)

**Asset Management**
- Static assets served from `client/public` directory
- Imported assets from `attached_assets` folder via Vite aliases (`@assets`)
- Support for PNG, JPG, JPEG image formats
- OpenGraph image detection and dynamic URL generation for social sharing

**Session & Storage**
- Express-session for admin authentication with secure cookies
- Storage abstraction layer (`IStorage` interface) in `server/storage.ts` for future flexibility
- Database storage implementation handles CRUD operations for bookings, admin users, and calendar settings

### Security Infrastructure

**Security Middleware** (`server/middleware/security.ts`)
- HTTP security headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Referrer-Policy
- Production-only headers: HSTS (Strict-Transport-Security), Content-Security-Policy
- Rate limiting with isolated per-endpoint counters (prevents cross-route interference)
- Input sanitization functions for strings, emails, and phone numbers
- Generic error handler that redacts stack traces in production

**Rate Limiting Configuration**
- Login endpoint: 5 attempts per 15 minutes per IP address
- Booking endpoints (single and batch): 10 requests per minute per IP address
- Each limiter maintains isolated counters to prevent cross-endpoint interference
- Automatic cleanup of expired rate limit records every 60 seconds

**Session Security**
- Custom session cookie name (`gsim.sid`) instead of default
- HttpOnly cookies to prevent XSS access
- Secure cookies in production (HTTPS only)
- SameSite=lax to prevent CSRF attacks
- 24-hour session expiration with rolling sessions

**Input Sanitization**
- All booking form data sanitized before validation and storage
- HTML/script tags stripped from text fields
- Email addresses validated with regex and lowercased
- Phone numbers restricted to digits and common formatting characters
- Field length limits enforced (1000 chars for text, 254 for email, 20 for phone)

### Legal Pages

**Privacy Policy** (`/politique-de-confidentialite`)
- French-language privacy policy covering data collection, usage, protection, sharing, retention, and user rights
- Contact information for data-related inquiries

**Cookie Policy** (`/politique-de-cookies`)
- French-language cookie policy explaining cookie types (essential, performance, functionality)
- Third-party cookies disclosure (Google Calendar, Google Fonts)
- Browser-specific instructions for cookie management

### Admin Dashboard

**Dashboard Features**
- Company logo in header with site navigation link
- Statistics panel: total reservations, upcoming reservations, total hours booked, estimated revenue
- Search functionality for filtering by name or email
- Filter dropdowns for bay (1-4 or all) and period (all, upcoming, past)
- Scrollable reservations list with delete functionality
- Datetime comparison correctly classifies past/upcoming based on local time

**Datetime Handling**
- Bookings stored with UTC timestamp for date and text for time
- Admin filters combine date (extracted from ISO string) with time for accurate classification
- Local timezone used for all comparisons (designed for Quebec-based facility)

### Multi-Step Booking Flow

**Architecture** (Adapted from Wrivard/golf-logic repository)
- 4-step React booking flow: Duration → Time → Details → Confirmation
- State management via Zustand store (`client/src/lib/booking-store.ts`)
- Smart bay optimization algorithm (`server/booking-logic.ts`) with duration-specific scoring:
  - ScoreBreakdown: base, gapAfter, gapBefore, perfectFit, bayClustering, peakHour, inefficientGap, durationBonus, durationStrategy, total
  - Two gap rating functions:
    - rateRemainingGap(gap, touchesBooking) — used when gap is to a REAL booking (0→+5 adjacent, <30m→-5 unusable, 30-60m→-2, 60m→-1, >60m→0)
    - rateGapToBoundary(gap) — used when gap is to day open/close boundary (0→+3 edge, <30m→-5, 30-60m→-1, 61-120m→0, >120m→-1)
  - Bay clustering: +1 if bay already has bookings
  - Duration profiles via applyDurationStrategy():
    - 1h "Filler": no peak bonus, -4 on empty bay with others, +7 perfect gap fill, +3 edge on empty day, -3 if adjacent to booking but gap > 120min on other side
    - 2h "Standard": +1 peak, -2 empty bay, -3 if occupying gap that fits 3-4h
    - 3h "Popular": +1 bonus, +2 peak, +2 edge on empty bay
    - 4h "Premium": +2 bonus, +1 peak, +3 edge on empty bay
  - 60min gap penalties in applyDurationStrategy only apply when the gap is to a real booking (not to a day boundary)
  - Schedule-aware: reads operating schedule from DB per request (open/lastBooking/close times)
- Per-bay time slot granularity:
  - Bays 1-2: 60-minute granularity (8:00, 9:00, 10:00...)
  - Bays 3-4: 30-minute granularity (8:00, 8:30, 9:00, 9:30...)
- "Meilleur choix" label on slots with score >= 5, displayed first in the grid
- Components: StepDuration, StepTime, StepDetails, StepConfirmation in `client/src/components/booking/`
- Real-time availability fetched via GET `/api/availability/optimized?date=YYYY-MM-DD&duration=N`
- Bay automatically assigned to the optimal simulator for each time slot

**Bidirectional Google Calendar Sync**
- Website → Calendar: Bookings created on website are pushed to Google Calendar (existing)
- Calendar → Website: Events in Google Calendar with "Golf SIM" in summary are pulled into database
- Manual sync via admin dashboard button (POST `/api/admin/calendar/sync`)
- Automatic background sync every 10 minutes
- Duplicate prevention via calendarEventId tracking
- Conflict detection prevents importing overlapping bookings

### Cart-Based Booking System (Legacy)

**Overlap Detection**
- Cart system uses minute-based time slot conflict detection
- Helper functions convert time strings and durations to minutes for precise overlap checking
- Prevents users from selecting bays that would conflict with items already in their cart
- Supports back-to-back bookings (adjacent slots don't conflict)
