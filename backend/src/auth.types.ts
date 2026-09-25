export type Role = 'student' | 'parent' | 'admin';

export type AccessTokenClaims = {
  sub: string;
  email: string;
  role: Role;
  iat: number;
  exp: number;
};