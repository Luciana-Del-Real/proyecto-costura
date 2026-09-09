import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';
import { PushNotificationsService } from './push-notifications.service';
import { CreatePushSubscriptionDto } from './dtos/create-push-subscription.dto';

/**
 * Endpoints use a URL-encoded endpoint in the path (push endpoints contain
 * reserved characters). Express already decodes path params; when it does,
 * the decoded value is returned unchanged (plain URLs are not malformed for
 * decodeURIComponent), so double-decoding is harmless.
 */
function safeDecodeEndpoint(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

@Controller('push-subscriptions')
@UseGuards(JwtAuthGuard)
export class PushNotificationsController {
  constructor(
    private readonly pushNotificationsService: PushNotificationsService,
  ) {}

  /** Upserts the caller's subscription; returns 201 with the stored row. */
  @Post()
  async upsert(
    @Body() dto: CreatePushSubscriptionDto,
    @Request() req: { user: Principal },
  ) {
    return this.pushNotificationsService.upsertSubscription(req.user.id, dto);
  }

  /** Deletes the caller's subscription; 204 on success, 404 absent, 403 cross-owner. */
  @Delete(':endpoint')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('endpoint') endpoint: string,
    @Request() req: { user: Principal },
  ) {
    await this.pushNotificationsService.deleteSubscription(
      safeDecodeEndpoint(endpoint),
      req.user,
    );
  }
}