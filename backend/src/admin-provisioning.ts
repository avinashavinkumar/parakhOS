import 'dotenv/config';
import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';

export async function provisionAdmin(database: DatabaseService, email: string, password: string, phone?: string) {
  if (!email?.trim() || !password || password.length < 6) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD of at least 6 characters are required');
  if (!database.isEnabled()) throw new Error('PostgreSQL must be enabled to provision an admin');
  const passwordHash = await AuthService.hashPassword(password);
  try {
    const result = await database.query<{ id: string; email: string }>(
      `INSERT INTO users (email, phone, password_hash, role, status)
       VALUES ($1, $2, $3, 'admin', 'active')
       RETURNING id::text, email`,
      [email.trim().toLowerCase(), phone?.trim() || null, passwordHash]
    );
    return result.rows[0];
  } catch (error) {
    if ((error as { code?: string }).code === '23505') throw new ConflictException('An account with this email or phone already exists');
    throw error;
  }
}

async function main() {
  const database = new DatabaseService();
  await database.onModuleInit();
  try {
    const admin = await provisionAdmin(database, process.env.ADMIN_EMAIL ?? '', process.env.ADMIN_PASSWORD ?? '', process.env.ADMIN_PHONE);
    console.log(`Provisioned admin ${admin.email} (${admin.id})`);
  } finally {
    await database.onModuleDestroy();
  }
}

if (require.main === module) void main().catch((error: unknown) => { console.error(error); process.exitCode = 1; });