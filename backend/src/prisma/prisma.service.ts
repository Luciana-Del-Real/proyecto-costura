import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';

// Opciones para las transacciones interactivas. Prisma corta a los 5 s por
// defecto (y espera 2 s por una conexión del pool): con una base remota o
// cargada, una transacción con varias consultas superaba ese límite y fallaba
// con "Transaction already closed" (p. ej. aprobar una solicitud de curso).
export const TRANSACTION_OPTIONS = { maxWait: 15000, timeout: 30000 } as const;

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Transacción interactiva con los límites holgados de arriba. Usar SIEMPRE
  // esta forma en lugar de `this.prisma.$transaction(fn)` directo.
  runInTransaction<T>(fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    return this.$transaction(fn, TRANSACTION_OPTIONS);
  }
}
