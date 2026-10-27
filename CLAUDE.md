# Rajyash — project rules for Claude Code

Rajyash is a food wastage pickup app for a small NGO in Ahmedabad (Rajyash Foundation).
Read `docs/PLAN.md` before any change. It is the source of truth for scope.

## Scope (v1)
- Only **food wastage pickup**. Do not build injured-animal rescue, food donation, or donor payments yet.
- Admin **assigns** drivers. Drivers do not self-accept in v1.
- The NGO pays drivers monthly. Salary is calculated from trips (km × rate, minimum fare).
- One APK holds driver and admin screens. Role decides what a user sees after login.

## Stack
- Driver app: React Native (Expo), TypeScript, background location for trip GPS.
- Admin panel: React + TypeScript web app, served from the `admin` subdomain.
- Backend: PHP 8 API (`api/`), MySQL 8. Separate database from any other project. Never connect to the SoundLife PMS database.
- Maps: Google Maps Platform (Directions for routes). Keys come from env, never committed.

## Rules
- Never commit secrets, DB passwords, API keys, or `.env` files. Use `.env.example` for names only.
- Every write goes through the API. Never trust `driver_id`, `role`, or `ngo_id` from the request body. Take them from the session token.
- Every status change writes a row to `trip_events`. The trip is closed only when pickup photo, delivery photo, and kg are saved.
- Km comes from the GPS trail. Remove impossible jumps (speed above 80 km/h). Manual km needs a reason and is logged.
- Salary and payout numbers are computed on the server, not in the app.
- Log admin actions to `audit_log`.
- Show errors to users in plain language (English, Hindi, Gujarati). Never show raw database errors.
- Prefer small, reviewed commits. Explain what changed and why in each commit message.

## Commands
- To be filled in once the app is scaffolded (install, test, build APK).
