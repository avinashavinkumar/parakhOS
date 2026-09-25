import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DatabaseService } from './database.service';

describe('AuthService', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'development';
    delete process.env.JWT_SECRET;
  });

  it('issues a JWT for local demo credentials when the database is disabled', async () => {
    const database = { isEnabled: () => false } as unknown as DatabaseService;
    const result = await new AuthService(database).login('demo', 'demo', 'student');

    expect(result.tokenType).toBe('Bearer');
    expect(result.accessToken.split('.')).toHaveLength(3);
    expect(result.user).toEqual({ id: 'demo-user', email: 'student@demo.studentos.local', role: 'student' });
  });

  it('rejects non-demo credentials when the database is disabled', async () => {
    const database = { isEnabled: () => false } as unknown as DatabaseService;
    await expect(new AuthService(database).login('student@example.com', 'wrong', 'student')).rejects.toThrow(UnauthorizedException);
  });

  it('returns a conflict when signup identifier already exists', async () => {
    const database = {
      isEnabled: () => true,
      withTransaction: jest.fn().mockRejectedValue({ code: '23505' })
    } as unknown as DatabaseService;
    await expect(new AuthService(database).signup('existing@example.com', 'password', 'student')).rejects.toThrow('already exists');
  });
});
