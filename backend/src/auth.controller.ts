import { Body, Controller, Get, Headers, Post, Query, Redirect } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Role } from './auth.types';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  login(@Body() body: { identifier: string; password: string; role: Role }) {
    return this.auth.login(body.identifier, body.password, body.role);
  }

  @Post('signup')
  signup(@Body() body: { identifier: string; password: string; role: Role }) {
    return this.auth.signup(body.identifier, body.password, body.role);
  }

  @Post('student-profile')
  studentProfile(@Headers('authorization') authorization: string, @Body() body: Parameters<AuthService['completeStudentProfile']>[1]) {
    return this.auth.completeStudentProfile(authorization, body);
  }

  @Get('google')
  @Redirect()
  google(@Query('role') role: 'student' | 'parent' = 'student') {
    try { return { url: this.auth.googleRedirect(role) }; }
    catch { return { url: `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/login#auth_error=google_not_configured` }; }
  }

  @Get('google/callback')
  @Redirect()
  async googleCallback(@Query('code') code: string, @Query('state') state: 'student' | 'parent' = 'student') {
    const session = await this.auth.googleCallback(code, state);
    const frontend = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    return { url: `${frontend}/login#access_token=${encodeURIComponent(session.accessToken)}&role=${state}` };
  }
}