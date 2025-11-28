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

**API Design**
- RESTful API endpoints under `/api/*` namespace
- POST `/api/book` - booking creation with conflict checking and Google Calendar integration
- Validation using Zod schemas shared with frontend via `@shared/schema`

**Database Layer**
- Drizzle ORM for type-safe database operations
- PostgreSQL via Neon serverless driver (`@neondatabase/serverless`)
- Schema definition in `shared/schema.ts` with auto-generated TypeScript types
- Connection pooling for efficient database access

**Database Schema**
- `bookings` table with fields: id (UUID), name, email, phone, date, time, duration, bayType (standard/premium), players (1-4), notes, calendarEventId, createdAt
- Unique constraint on (bayType, date, time) to prevent double-booking
- Timestamps stored as `Date` objects in JavaScript for consistent timezone handling

**Booking Business Logic**
- Conflict detection: checks existing bookings for same bay, date, and overlapping time windows
- Time overlap calculation converts time strings and duration to minutes for precise comparison
- Atomic operations: booking creation fails if calendar sync fails (prevents orphaned bookings)

### External Dependencies

**Google Calendar Integration**
- `googleapis` library for official Google Calendar API access
- Authentication via Replit Connectors system (fetches tokens from `REPLIT_CONNECTORS_HOSTNAME`)
- Supports both repl identity tokens and deployment renewal tokens
- OAuth2 client credential management with automatic token refresh
- Event creation with start/end datetime, summary, and description
- Bidirectional sync: stores `calendarEventId` in database for future updates/deletions

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
- `REPLIT_CONNECTORS_HOSTNAME` - Replit connectors API endpoint
- `REPL_IDENTITY` or `WEB_REPL_RENEWAL` - Authentication tokens for Replit services
- `NODE_ENV` - environment flag (development/production)

**Asset Management**
- Static assets served from `client/public` directory
- Imported assets from `attached_assets` folder via Vite aliases (`@assets`)
- Support for PNG, JPG, JPEG image formats
- OpenGraph image detection and dynamic URL generation for social sharing

**Session & Storage**
- No authentication system currently implemented
- Storage abstraction layer (`IStorage` interface) in `server/storage.ts` for future flexibility
- Database storage implementation handles CRUD operations for bookings