import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { Principal } from '../common/principal';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getUserNotifications(@Request() req: { user: Principal }) {
    return this.notificationsService.getUserNotifications(req.user.id);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req: { user: Principal }) {
    return this.notificationsService.getUnreadCount(req.user.id);
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: { user: Principal }) {
    return this.notificationsService.markAsRead(id, req.user);
  }

  @Patch('mark-all-read')
  async markAllAsRead(@Request() req: { user: Principal }) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  async deleteNotification(@Param('id') id: string, @Request() req: { user: Principal }) {
    return this.notificationsService.deleteNotification(id, req.user);
  }
}
