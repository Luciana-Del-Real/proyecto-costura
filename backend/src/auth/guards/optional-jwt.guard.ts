import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Resolves the current principal when a valid JWT is present, but never
 * rejects anonymous callers. Used by public catalog routes that return a
 * richer payload for admins without blocking anonymous visitors.
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any): any {
    return user ?? null;
  }
}