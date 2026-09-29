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

- 2026-09-29: Implement the approved scope of blueprint v1 for Build a fully web-based MVP. Build the COMPLETE product the blueprint below describes. Its : .gitignore, apps/api/sql/001_trading_platform.sql, apps/api/src/modules/strategies/dto/strategy-config.dto.ts, apps/api/src/modules/strategies/market-data.service.ts, apps/api/src/modules/strategies/strategy-generator.service.ts, apps/api/src/app.module.ts, apps/api/src/modules/strategies/backtest.service.ts, apps/api/src/modules/strategies/export.service.ts
