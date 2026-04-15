import { Role } from '../../common/enums';

export interface JwtPayload {
  sub: string; // userId
  email: string;
  role: Role;
  iat?: number;
  exp?: number;
}
