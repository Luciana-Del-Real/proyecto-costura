import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('purchases')
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async requestPurchase(
    @Request() req: any,
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchasesService.requestPurchase(req.user.id, dto);
  }

  @Get('pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getPendingRequests(@Query('page') page?: string, @Query('limit') limit?: string) {
    let p = parseInt(page as any, 10);
    if (isNaN(p) || p < 1) p = 1;

    let l = parseInt(limit as any, 10);
    if (isNaN(l) || l < 1) l = 20;
    const MAX = 100;
    if (l > MAX) l = MAX;

    return this.purchasesService.getPendingRequests(p, l);
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllPurchases() {
    return this.purchasesService.getAllPurchases();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getPurchaseById(@Param('id') id: string) {
    return this.purchasesService.getPurchaseById(id);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async approvePurchase(@Param('id') id: string) {
    return this.purchasesService.approvePurchase(id);
  }

  @Patch(':id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async rejectPurchase(@Param('id') id: string) {
    return this.purchasesService.rejectPurchase(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPurchases(@Param('userId') userId: string) {
    return this.purchasesService.getUserPurchases(userId);
  }
}
