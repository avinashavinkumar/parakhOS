import { CanActivate, ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AccessTokenClaims } from './auth.types';

type AuthenticatedRequest = { headers: { authorization?: string }; user?: AccessTokenClaims };

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const claims = this.auth.verifyAccessToken(request.headers.authorization);
    if (!claims) throw new UnauthorizedException('A valid bearer token is required');
    if (claims.role !== 'admin') throw new ForbiddenException('Admin access is required');
    request.user = claims;
    return true;
  }
}