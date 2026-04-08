# Golf SIM Sorel-Tracy - Website Documentation

## Overview

Golf SIM Sorel-Tracy is a premium indoor golf simulator facility website designed to provide an immersive, magazine-style digital experience. The platform allows users to browse facility information, view pricing, explore galleries, and book simulator bays with integrated Google Calendar synchronization. The project aims to offer a high-end online presence for a golf simulation lounge in Sorel-Tracy, Quebec, focusing on user experience and efficient booking management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend

The frontend is built with React 18 and TypeScript, utilizing Wouter for routing and Vite for fast development and optimized builds. Styling is managed with Tailwind CSS v4 and Shadcn/ui components based on Radix UI, ensuring accessibility and customizability with a specific color palette (cream/white, black, primary green) and fonts ("Oswald", "DM Sans"). Animations are handled by Framer Motion and GSAP with ScrollTrigger for complex scroll-driven effects, including an animated golf ball. Form management uses React Hook Form with Zod for validation, ensuring type-safe schemas. State management and API communication are handled by TanStack Query for efficient server state caching.

### Backend

The backend is developed with Express.js and Node.js in TypeScript, featuring a RESTful API. It includes custom middleware for parsing and session-based authentication using `express-session`. Key API endpoints manage bookings (creation, admin edits), user authentication, and calendar settings. SEO is robustly implemented with server-side meta tag injection, dynamic sitemap and robots.txt generation, and Schema.org structured data. The database layer uses Drizzle ORM with PostgreSQL via Neon for type-safe operations. Core database tables include `bookings`, `admin_users`, `calendar_settings`, and `operating_schedule`, with unique constraints to prevent double-booking. An admin authentication system secures access to a dashboard for managing calendar settings and operating schedules. The booking logic includes conflict detection, pricing rules (25$/hour for 1h, 28$/hour for 2-4h), and atomic operations for calendar synchronization.

### Multi-Step Booking Flow

The booking process is a 4-step React flow (Duration → Time → Details → Confirmation) managed by a Zustand store. It incorporates a sophisticated bay optimization algorithm (adapted from Wrivard/golf-logic) that scores available slots based on factors like gaps, bay clustering, peak hours, and duration-specific strategies to suggest the "Meilleur choix." Bays 1-2 have 60-minute granularity, while Bays 3-4 have 30-minute granularity. Real-time availability is fetched from the backend, and the optimal simulator bay is automatically assigned.

### Security

Security middleware includes HTTP security headers, rate limiting for login and booking endpoints, and input sanitization for all form data. Session security is enforced with HttpOnly, secure (in production), and SameSite=lax cookies, with a custom name and 24-hour expiration. Input sanitization involves stripping HTML/script tags, validating emails, and formatting phone numbers, alongside enforcing field length limits.

## External Dependencies

*   **Google Calendar Integration:** `googleapis` library for API access, authenticating via Replit Connectors. Supports event creation, bidirectional sync through webhooks (with fallback polling), and automatic watch channel renewal.
*   **PostgreSQL:** Utilized through Neon serverless driver for database operations.
*   **Development & Deployment Tools:** Replit-specific plugins (e.g., `@replit/vite-plugin-runtime-error-modal`, `@replit/vite-plugin-cartographer`, `@replit/vite-plugin-dev-banner`) and `vite-plugin-meta-images` for dynamic OpenGraph tags. ESBuild is used for server-side bundling.
*   **Environment Variables:** `DATABASE_URL`, `SESSION_SECRET`, `REPLIT_CONNECTORS_HOSTNAME`, `REPL_IDENTITY` or `WEB_REPL_RENEWAL`, `NODE_ENV`.