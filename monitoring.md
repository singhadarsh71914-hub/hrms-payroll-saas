# HRMS Monitoring Guide

This project is integrated with Sentry to capture errors, unhandled exceptions, and performance traces for both the Backend API and the Frontend React client.

## Setup Instructions

1. Retrieve a Data Source Name (DSN) by creating a new project in your [Sentry Dashboard](https://sentry.io).
2. Configure your environment variables on both your server `.env` and client `.env` files.

### Required Environment Variables

```env
# Backend .env
SENTRY_DSN="your_sentry_backend_dsn_here"
SENTRY_ENVIRONMENT="production"
SENTRY_RELEASE="hrms-api@1.0.0"

# Frontend .env (client directory)
VITE_SENTRY_DSN="your_sentry_frontend_dsn_here"
VITE_SENTRY_ENVIRONMENT="production"
VITE_SENTRY_RELEASE="hrms-client@1.0.0"
```

## Features Implemented

### Backend (Node/Express)
- Captures unhandled promise rejections and exceptions.
- Captures Prisma database failures.
- Captures Express route crashes automatically via `Sentry.setupExpressErrorHandler(app)`.
- Scrubs sensitive information such as passwords, auth tokens, and session cookies in the `beforeSend` intercept hook.
- Appends user context (`userId`, `companyId`, `role`) for targeted debugging of crashes.

### Frontend (React/Vite)
- Wraps the entire application tree with `Sentry.ErrorBoundary` capturing React render crashes.
- Catches unhandled promise rejections or faulty API responses (via standard tracing integrations).
- Replays user sessions during crashes (`Sentry.replayIntegration()`) to visually debug issues leading up to an error.
- Enriches issue reports with exact browser versions, OS, IP addresses, and user profiles attached upon login.

## How to Verify
Use the profile dropdown in the application to manually trigger intentional crashes to verify your Sentry tracking:
1. `Test Sentry (Frontend)` -> Triggers a crash directly in the browser.
2. `Test Sentry (Backend)` -> Triggers a simulated Express route failure (`/debug-sentry`).
