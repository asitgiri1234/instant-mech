# Instant Mechanic — Live Vehicle Service Operations Dashboard

Instant Mechanic is an India-based roadside and at-home vehicle servicing company; this
repository holds the live operations dashboard its dispatch team uses to watch bookings move
from request to completion. It is a pnpm monorepo: `apps/web` is a Next.js 15 (App Router,
TypeScript, Tailwind, shadcn/ui) front end, `apps/api` is an Express + Prisma service backed by
Postgres 16, and `packages/shared` holds the TypeScript types both sides import so the wire
contract stays in one place. At present only the scaffold and the database layer exist — schema,
migrations (including a partial unique index enforcing one active job per mechanic), and a seed
script that generates 90 days of realistic booking history. To get running: `docker compose up -d`,
`pnpm install`, `pnpm db:migrate`, then `pnpm db:seed`.
