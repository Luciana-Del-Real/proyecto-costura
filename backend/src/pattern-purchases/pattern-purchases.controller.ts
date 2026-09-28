import { Controller, Get, Post, Patch, Param, Request, UseGuards } from '@nestjs/common';
import { PatternPurchasesService } from './pattern-purchases.service';
import { JwtAuthGuard } from '../auth/guards/jwt.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { Principal } from '../common/principal';

// Solicitudes de compra de patrones: la alumna pide (POST), el admin ve las
// pendientes y aprueba/rechaza.
@Controller()
export class PatternPurchasesController {
  constructor(private readonly patternPurchasesService: PatternPurchasesService) {}

  @Post('patterns/:patternId/purchase')
  @UseGuards(JwtAuthGuard)
  request(@Param('patternId') patternId: string, @Request() req: { user: Principal }) {
    return this.patternPurchasesService.requestPurchase(req.user.id, patternId);
  }

  @Get('admin/pattern-purchases/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getPending() {
    return this.patternPurchasesService.getPendingRequests();
  }

  @Patch('admin/pattern-purchases/:id/approve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  approve(@Param('id') id: string) {
    return this.patternPurchasesService.approve(id);
  }

  @Patch('admin/pattern-purchases/:id/reject')
  @UseGuards(JwtAuthGuard, AdminGuard)
  reject(@Param('id') id: string) {
    return this.patternPurchasesService.reject(id);
  }
}