# Ferment Tracker

Mobile-first, offline-capable field logbook for tracking fertilizer ferments (FPJ, FFJ, LABS, and more).

## Requirements

- Node.js 20+
- pnpm 10+

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Production build |
| `pnpm typecheck` | TypeScript check |
| `pnpm lint` | ESLint |
| `pnpm test` | Unit tests (Vitest) |
| `pnpm db:generate` | Generate Drizzle migrations from schema |
| `pnpm db:migrate` | Apply migrations to Turso |
| `pnpm db:push` | Push schema directly (dev) |
| `pnpm db:seed` | Seed templates and stages |

## Database setup

1. Copy `.env.example` → `.env` and fill in Turso credentials
2. `pnpm db:migrate` — apply schema
3. `pnpm db:seed` — load ferment type templates

## Docs

- [Build plan](docs/ferment-tracker-build-plan.md)
- [Design handoff](docs/design/design_handoff_ferment_tracker_v1/README.md)

## Contributing

Contributions, bug reports, and ideas are welcome — please open an issue or a
pull request. If you're planning a larger change, open an issue first so we can
discuss the approach.

## License

Released under the [MIT License](LICENSE). © 2026 Daniel Crawford.
