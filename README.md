# AV Gear Tracker

A mobile-first web app for checking camera gear in and out with QR codes, built to stop rental equipment from going missing.

> Status: in development (Phase 0: project setup)

## The problem
Rental camera gear (bodies, lenses, batteries, SD cards) kept coming back with items missing, and nobody could say who had what. A temporary Google Sheets app proved the idea; this project rebuilds it as a full-stack application.

## Planned features
- Scan QR labels into a cart and check out several items to a person at once
- Cart-style check-in and a "still out" list after every event
- Full checkout history per item and per person
- AI assistant that answers questions like "Who has the Sony 24-70?"
- Public demo mode with fake data

## Tech stack
- **Frontend:** React, TypeScript, Vite
- **Backend:** Node.js, Express, TypeScript
- **Database:** PostgreSQL (Neon), Prisma ORM
- **Testing:** Vitest, Supertest, Playwright
- **CI/CD:** GitHub Actions

## Running locally
Instructions coming as the project is built.
