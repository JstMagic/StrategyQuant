import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('DatabaseService');
  // TLS is the connection string's own: in deploy it asks for sslmode=verify-full against the
  // database certificate authorities the platform puts in the image. A few connections per task:
  // the managed database limits how many this app may open, and a request waits at most ten
  // seconds for one of them.
  readonly pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 3, connectionTimeoutMillis: 10_000 });
  // Boot migration: APPLY every sql/*.sql file in order, including the demo table's own
  // 000_init.sql. That directory is the single place schema is defined: drop in a
  // sql/NNN-name.sql and it runs. Wrapped so a missing database logs a warning rather than
  // crashing the app: /health stays up and the cause is visible in the logs.
  async onModuleInit(): Promise<void> {
    try {
      const dir = join(process.cwd(), 'sql');
      if (!existsSync(dir)) return;
      for (const f of readdirSync(dir).filter((n) => n.endsWith('.sql')).sort()) {
        await this.pool.query(readFileSync(join(dir, f), 'utf8'));
      }
    } catch (err) {
      this.log.warn(`Skipped migrations: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async onModuleDestroy(): Promise<void> { await this.pool.end().catch(() => undefined); }
}
