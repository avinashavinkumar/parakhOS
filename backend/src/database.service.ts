import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private readonly enabled = process.env.DB_ENABLED !== 'false';
  private readonly pool = new Pool({
    host: process.env.DB_HOST ?? '127.0.0.1',
    port: Number(process.env.DB_PORT ?? 5432),
    database: process.env.DB_NAME ?? 'studentos',
    user: process.env.DB_USER ?? 'studentos',
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined,
    max: Number(process.env.DB_POOL_MAX ?? 10)
  });

  async onModuleInit() {
    if (!this.enabled) return;
    await this.initializeSchema();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  isEnabled() {
    return this.enabled;
  }

  async query<Row extends QueryResultRow = QueryResultRow>(text: string, values: unknown[] = []): Promise<QueryResult<Row>> {
    if (!this.enabled) throw new Error('PostgreSQL is disabled. Set DB_ENABLED=true to enable it.');
    return this.pool.query<Row>(text, values);
  }

  async withTransaction<T>(work: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async isHealthy() {
    if (!this.enabled) return { enabled: false, connected: false };
    try {
      await this.pool.query('SELECT 1');
      return { enabled: true, connected: true };
    } catch {
      return { enabled: true, connected: false };
    }
  }

  private async initializeSchema() {
    const schemaPath = join(process.cwd(), 'database', 'schema.sql');
    const schema = await readFile(schemaPath, 'utf8');
    await this.pool.query(schema);
  }
}
