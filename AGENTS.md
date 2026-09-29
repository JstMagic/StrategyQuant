# Build a fully web-based MVP: Agent Context

This file is the project's working memory. The coding agent reads it BEFORE every change and
appends to the log AFTER, so changes stay consistent as the project grows. Keep durable
conventions and decisions here.

## Stack

- Next.js + NestJS + Tailwind

## Conventions

- `npm run verify` (install + type-check + lint) must pass before a change is done.
- TypeScript is strict and `any` is banned. Use precise types, or `unknown` + narrowing.
- Extend the existing module/page structure; keep the security baseline (validation, headers, etc.).
- Build features end-to-end and wire them so they actually run (migrations applied, frontend↔API connected).

## Architecture decisions

_None recorded yet._

## Project log

- 2026-09-29: Fix the following 2 issues the team's post-build review found in the blueprint build on Build a fully web-based MVP. Fix ONLY these issues, : AGENTS.md, apps/api/src/modules/strategies/backtest.service.spec.ts, apps/api/src/modules/strategies/export.service.spec.ts, apps/api/src/modules/strategies/market-data.service.spec.ts, apps/api/src/modules/strategies/strategies.acceptance.spec.ts, apps/api/src/modules/strategies/strategy-generator.service.spec.ts, apps/api/vitest.config.ts, apps/web/app/strategies/[id]/page.tsx
- 2026-09-29: Implement the approved scope of blueprint v1 for Build a fully web-based MVP. Build the COMPLETE product the blueprint below describes. Its : .gitignore, apps/api/sql/001_trading_platform.sql, apps/api/src/modules/strategies/dto/strategy-config.dto.ts, apps/api/src/modules/strategies/market-data.service.ts, apps/api/src/modules/strategies/strategy-generator.service.ts, apps/api/src/app.module.ts, apps/api/src/modules/strategies/backtest.service.ts, apps/api/src/modules/strategies/export.service.ts
- 2026-09-29: Fix incomplete delivery and add tests. Fixed frontend API URLs to use /api/* proxy instead of hardcoded localhost:3001. Added unit tests for StrategyGeneratorService, BacktestService, ExportService, MarketDataService. Added BDD-style acceptance tests for StrategiesController. Added vitest config for API.
