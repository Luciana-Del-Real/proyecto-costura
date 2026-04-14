import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
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
  async getPendingRequests() {
    return this.purchasesService.getPendingRequests();
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
