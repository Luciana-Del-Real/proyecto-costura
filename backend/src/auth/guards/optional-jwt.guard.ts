import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Principal } from '../../common/principal';

/**
 * Resolves the current principal when a valid JWT is present, but never
 * rejects anonymous callers. Used by public catalog routes that return a
 * richer payload for admins without blocking anonymous visitors.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = Principal | null>(err: unknown, user: TUser): TUser {
    return (user ?? null) as TUser;
  }
}
