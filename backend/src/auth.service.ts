import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { DatabaseService } from './database.service';
import { AccessTokenClaims, Role } from './auth.types';

const scrypt = promisify(scryptCallback);
export type StudentProfile = { name: string; fatherName: string; motherName: string; age: number; classLevel: string; address: string; schoolName: string; schoolAddress: string; schoolPlace: string; schoolCity: string; studentPhone?: string; parentsPhone: string };

@Injectable()
export class AuthService {
  constructor(private readonly database: DatabaseService) {}

  async login(identifier: string, password: string, role: Role) {
    if (!identifier?.trim() || !password) throw new BadRequestException('Identifier and password are required');
    if (!['student', 'parent', 'admin'].includes(role)) throw new BadRequestException('Unsupported login role');
    if (!this.database.isEnabled()) {
      if (identifier === 'demo' && password === 'demo') return { ...this.session('demo-user', role, `${role}@demo.studentos.local`), needsProfile: role === 'student' };
      throw new UnauthorizedException('Database authentication is disabled; use demo / demo for local testing');
    }
    const result = await this.database.query<{ id: string; email: string; phone: string; passwordHash: string; role: string }>(
      `SELECT id::text, COALESCE(email, '') AS email, COALESCE(phone, '') AS phone, password_hash AS "passwordHash", role
       FROM users WHERE (lower(email) = lower($1) OR phone = $1) AND role = $2 AND status = 'active' LIMIT 1`, [identifier.trim(), role]);
    const user = result.rows[0];
    if (!user || !(await AuthService.verifyPassword(password, user.passwordHash))) throw new UnauthorizedException('Invalid credentials');
    if (role !== 'student') return this.session(user.id, role, user.email || user.phone);
    const profile = await this.database.query<{ exists: boolean }>(`SELECT EXISTS (SELECT 1 FROM students WHERE user_id = $1::uuid) AS exists`, [user.id]);
    return { ...this.session(user.id, role, user.email || user.phone), needsProfile: !profile.rows[0]?.exists };
  }

  async signup(identifier: string, password: string, role: Role) {
    if (!identifier?.trim() || !password || password.length < 6) throw new BadRequestException('Identifier and password of at least 6 characters are required');
    if (!['student', 'parent'].includes(role)) throw new BadRequestException('Unsupported signup role');
    if (!this.database.isEnabled()) throw new BadRequestException('PostgreSQL is required for account creation');
    const isEmail = identifier.includes('@');
    const passwordHash = await AuthService.hashPassword(password);
    try {
      const user = await this.database.withTransaction(async (client) => {
        const result = await client.query<{ id: string; email: string; phone: string }>(
          `INSERT INTO users (email, phone, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id::text, COALESCE(email, '') AS email, COALESCE(phone, '') AS phone`,
          [isEmail ? identifier.trim().toLowerCase() : null, isEmail ? null : identifier.trim(), passwordHash, role]);
        if (role === 'parent') await client.query(`INSERT INTO parents (user_id, first_name) VALUES ($1::uuid, 'Parent')`, [result.rows[0].id]);
        return result.rows[0];
      });
      return { ...this.session(user.id, role, user.email || user.phone), needsProfile: role === 'student' };
    } catch (error) {
      if ((error as { code?: string }).code === '23505') throw new ConflictException('An account with this email or phone already exists');
      throw error;
    }
  }

  async completeStudentProfile(authorization: string, profile: StudentProfile) {
    const userId = this.verifyToken(authorization);
    if (!this.database.isEnabled()) throw new BadRequestException('PostgreSQL is required to save a student profile');
    if (!profile.name?.trim() || !profile.fatherName?.trim() || !profile.motherName?.trim() || !profile.address?.trim() || !profile.schoolName?.trim() || !profile.schoolAddress?.trim() || !profile.schoolPlace?.trim() || !profile.schoolCity?.trim() || !profile.parentsPhone?.trim() || !profile.classLevel?.trim() || !Number.isInteger(profile.age)) throw new BadRequestException('All required student and parent profile fields must be provided');
    const [firstName, ...lastNameParts] = profile.name.trim().split(/\s+/);
    const lastName = lastNameParts.join(' ');
    const result = await this.database.withTransaction(async (client) => {
      const existingParentUser = await client.query<{ id: string }>(`SELECT id::text FROM users WHERE phone = $1 LIMIT 1`, [profile.parentsPhone.trim()]);
      const parentUserId = existingParentUser.rows[0]?.id ?? (await client.query<{ id: string }>(`INSERT INTO users (phone, role) VALUES ($1, 'parent') RETURNING id::text`, [profile.parentsPhone.trim()])).rows[0].id;
      const existingParent = await client.query<{ id: string }>(`SELECT id::text FROM parents WHERE user_id = $1::uuid LIMIT 1`, [parentUserId]);
      const parent = existingParent.rows[0] ?? (await client.query<{ id: string }>(`INSERT INTO parents (user_id, first_name, last_name) VALUES ($1::uuid, $2, $3) RETURNING id::text`, [parentUserId, profile.fatherName.trim(), profile.motherName.trim()])).rows[0];
      if (existingParent.rows[0]) await client.query(`UPDATE parents SET first_name = $2, last_name = $3, updated_at = now() WHERE id = $1::uuid`, [parent.id, profile.fatherName.trim(), profile.motherName.trim()]);
      const existingStudent = await client.query<{ id: string }>(`SELECT id::text FROM students WHERE user_id = $1::uuid LIMIT 1`, [userId]);
      const studentValues = [firstName, lastName || null, profile.classLevel.trim(), profile.schoolName.trim(), profile.fatherName.trim(), profile.motherName.trim(), profile.age, profile.address.trim(), profile.schoolAddress.trim(), profile.schoolPlace.trim(), profile.schoolCity.trim(), profile.studentPhone?.trim() || null, profile.parentsPhone.trim()];
      const student = existingStudent.rows[0] ?? (await client.query<{ id: string }>(`INSERT INTO students (user_id, first_name, last_name, grade, school_name, father_name, mother_name, age, address, school_address, school_place, school_city, student_phone, parents_phone) VALUES ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING id::text`, [userId, ...studentValues])).rows[0];
      if (existingStudent.rows[0]) await client.query(`UPDATE students SET first_name = $2, last_name = $3, grade = $4, school_name = $5, father_name = $6, mother_name = $7, age = $8, address = $9, school_address = $10, school_place = $11, school_city = $12, student_phone = $13, parents_phone = $14, updated_at = now() WHERE id = $1::uuid`, [student.id, ...studentValues]);
      await client.query(`INSERT INTO parent_student (parent_id, student_id, relationship, is_primary) VALUES ($1::uuid, $2::uuid, 'PARENT', true) ON CONFLICT (parent_id, student_id) DO UPDATE SET is_primary = true`, [parent.id, student.id]);
      return { studentId: student.id, parentId: parent.id };
    });
    return { ...result, status: 'completed' };
  }

  googleRedirect(role: Role) {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/v1/auth/google/callback';
    if (!clientId) throw new BadRequestException('Google login is not configured');
    const query = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, response_type: 'code', scope: 'openid email profile', access_type: 'offline', prompt: 'select_account', state: role });
    return `https://accounts.google.com/o/oauth2/v2/auth?${query}`;
  }

  async googleCallback(code: string, role: Role) {
    if (!code) throw new BadRequestException('Google authorization code is required');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/v1/auth/google/callback';
    if (!clientId || !clientSecret) throw new BadRequestException('Google login is not configured');
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri: redirectUri, grant_type: 'authorization_code' }) });
    if (!tokenResponse.ok) throw new UnauthorizedException('Google authorization failed');
    const tokenData = await tokenResponse.json() as { id_token?: string };
    if (!tokenData.id_token) throw new UnauthorizedException('Google did not return an identity token');
    const profileResponse = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokenData.id_token)}`);
    if (!profileResponse.ok) throw new UnauthorizedException('Google identity could not be verified');
    const profile = await profileResponse.json() as { sub?: string; email?: string; email_verified?: string };
    if (!profile.sub || !profile.email || profile.email_verified !== 'true') throw new UnauthorizedException('Google email is not verified');
    return this.session(`google:${profile.sub}`, role, profile.email);
  }

  private session(id: string, role: Role, email: string) {
    const now = Math.floor(Date.now() / 1000);
    const accessToken = AuthService.jwt({ sub: id, email, role, iat: now, exp: now + 60 * 60 });
    return { accessToken, tokenType: 'Bearer', expiresIn: 3600, user: { id, email, role } };
  }

  static async hashPassword(password: string) {
    const salt = randomBytes(16).toString('hex');
    const derived = await scrypt(password, salt, 64) as Buffer;
    return `scrypt$${salt}$${derived.toString('hex')}`;
  }

  private static async verifyPassword(password: string, stored: string) {
    const [, salt, expected] = stored?.split('$') ?? [];
    if (!salt || !expected) return false;
    const actual = await scrypt(password, salt, 64) as Buffer;
    const expectedBuffer = Buffer.from(expected, 'hex');
    return expectedBuffer.length === actual.length && timingSafeEqual(actual, expectedBuffer);
  }

  private static jwt(payload: Record<string, string | number>) {
    const secret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? undefined : 'local-development-jwt-secret-change-me');
    if (!secret) throw new Error('JWT_SECRET is required');
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
    const header = encode({ alg: 'HS256', typ: 'JWT' });
    const body = encode(payload);
    const signature = createHmac('sha256', secret).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verifyAccessToken(authorization?: string): AccessTokenClaims {
    const token = authorization?.replace(/^Bearer\s+/i, '');
    const [encodedHeader, encodedBody, signature] = token?.split('.') ?? [];
    const secret = process.env.JWT_SECRET ?? (process.env.NODE_ENV === 'production' ? undefined : 'local-development-jwt-secret-change-me');
    if (!secret || !encodedHeader || !encodedBody || !signature) throw new UnauthorizedException('A valid bearer token is required');
    const expected = createHmac('sha256', secret).update(`${encodedHeader}.${encodedBody}`).digest('base64url');
    if (signature !== expected) throw new UnauthorizedException('Invalid access token');
    try {
      const payload = JSON.parse(Buffer.from(encodedBody, 'base64url').toString()) as Partial<AccessTokenClaims>;
      if (!payload.sub || !payload.email || !payload.role || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) throw new UnauthorizedException('Expired or incomplete access token');
      if (!['student', 'parent', 'admin'].includes(payload.role)) throw new UnauthorizedException('Invalid access token role');
      return payload as AccessTokenClaims;
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Invalid access token');
    }
  }

  private verifyToken(authorization: string) { return this.verifyAccessToken(authorization).sub; }
}