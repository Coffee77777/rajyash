# Rajyash

Food wastage pickup app for Rajyash Foundation, Ahmedabad.

- `docs/PLAN.md`: scope, trip lifecycle, calculations, open questions
- `CLAUDE.md`: rules for working in this repo
- `db/schema.sql`: first database draft

## Planned layout
```
app/        Expo driver app (APK) with admin screens behind login
admin/      Web admin panel (admin subdomain)
api/        PHP 8 API
db/         schema and migrations
docs/       plan and notes
```

## Setup
Not yet scaffolded. Start with Claude Code using the prompt in the team notes.

## Secrets
Never commit `.env`. Copy `.env.example` (to be created) and fill it in locally.
