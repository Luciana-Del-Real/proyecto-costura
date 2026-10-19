import { Controller, Get, Post, Patch, Param, Request, UseGuards, ForbiddenException } from '@nestjs/common';
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

  // Historial de compras de patrones de una alumna (dueño o admin).
  @Get('pattern-purchases/user/:userId')
  @UseGuards(JwtAuthGuard)
  async getUserPurchases(@Param('userId') userId: string, @Request() req: { user: Principal }) {
    const isOwner = req.user?.id === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('No podés ver las compras de otro usuario');
    }
    return this.patternPurchasesService.getUserPurchases(userId);
  }

  @Get('admin/pattern-purchases/pending')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getPending() {
    return this.patternPurchasesService.getPendingRequests();
  }

  // Historial de todas las compras de patrones (sin filtro de estado) para el
  // panel de ventas del admin. Ruta estática, no colisiona con las de abajo.
  @Get('admin/pattern-purchases')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getAll() {
    return this.patternPurchasesService.getAllPurchases();
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