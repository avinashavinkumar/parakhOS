import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { AdminAuthGuard } from './admin-auth.guard';
import { AuthService } from './auth.service';

describe('AdminAuthGuard', () => {
  const context = (authorization?: string) => ({
    switchToHttp: () => ({ getRequest: () => ({ headers: { authorization } }) })
  }) as unknown as ExecutionContext;

  it('rejects a request without a bearer token', () => {
    const auth = { verifyAccessToken: jest.fn() } as unknown as AuthService;
    expect(() => new AdminAuthGuard(auth).canActivate(context())).toThrow(UnauthorizedException);
  });

  it('rejects a valid non-admin token', () => {
    const auth = { verifyAccessToken: jest.fn().mockReturnValue({ sub: 'user-1', role: 'student' }) } as unknown as AuthService;
    expect(() => new AdminAuthGuard(auth).canActivate(context('Bearer token'))).toThrow(ForbiddenException);
  });
});
