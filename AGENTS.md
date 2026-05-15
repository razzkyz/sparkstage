# Spark Stage Repo Memory

## Purpose

Spark Stage is a fullstack booking ticket and commerce app.

- Frontend: Vite + React + TypeScript in `frontend/`
- Backend: Supabase Postgres + Edge Functions in `supabase/`
- Payments: DOKU for tickets and product orders

## Repo Map

- `frontend/src/pages/`: route-level pages
- `frontend/src/components/`: shared UI and admin UI
- `frontend/src/hooks/`: data-fetching and domain hooks
- `frontend/src/lib/`: Supabase, query client, shared helpers
- `supabase/migrations/`: database schema, RPC, RLS
- `supabase/functions/`: server-side workflows and payment handlers
- `supabase/functions/_shared/`: shared payment and infra helpers
- `docs/architecture.md`: current architecture and risk zones
- `docs/runbooks/`: operational runbooks
- `docs/decisions/`: stable feature decisions and constraints

## Source Of Truth

- App structure and module map: `docs/architecture.md`
- DB change workflow: `docs/runbooks/db-migrations.md`
- DOKU payment flow: `docs/runbooks/doku-payments.md`
- WhatsApp invoice notifications: `docs/runbooks/WHATSAPP_README.md`
- Voucher behavior: `docs/decisions/voucher-system.md`
- ImageKit migration status: `docs/runbooks/imagekit-migration.md`
- Product admin data-entry rules: `docs/runbooks/admin-product-entry.md`
- Kasir (Cashier) role setup: `docs/runbooks/kasir-setup.md`

## Core Commands

```bash
npm run dev
npm run build
npm run lint
npm run test
npm run supabase:db:push
npm run supabase:functions:serve
```

## Guardrails

- Run all commands from the repo root.
- Treat `supabase/migrations/` as the database source of truth.
- Do not change production schema or RLS manually without a migration file.
- Keep payment side-effects idempotent across webhook, sync, and reconciliation flows.
- Keep docs compact. Update an existing doc before adding a new one.

## Risk Zones

- Ticket payment flow: `create-doku-ticket-checkout`, `doku-webhook`, `sync-doku-ticket-status`
- Product payment flow: `create-doku-product-checkout`, `sync-doku-product-status`
- Shared payment logic: `supabase/functions/_shared/payment-effects.ts`
- WhatsApp invoice sending: `supabase/functions/send-whatsapp-invoice`, `supabase/functions/_shared/fonnte.ts`
- Session and auth timing: `frontend/src/contexts/AuthContext.tsx`, `frontend/src/hooks/useSessionRefresh.ts`
- Large route map: `frontend/src/App.tsx`
- Role-based routing: `frontend/src/pages/Login.tsx` (kasir vs admin dashboard)

## Auth & Roles

Current roles: `admin`, `super_admin`, `starguide`, `kasir`
- **Admin**: Full access to all admin features
- **StarGuide**: Ticket scanning only (entrance management)
- **Kasir**: Sales dashboard + product QR scanning (read-only)

Role assignment: `user_role_assignments` table, managed via `frontend/src/auth/adminRole.ts`

## Working Rules

- Prefer TanStack Query patterns already used in the app.
- Put long-lived decisions in `docs/decisions/`.
- Put operational or recovery steps in `docs/runbooks/`.
- Delete stale planning docs after their final state is absorbed into active docs.
