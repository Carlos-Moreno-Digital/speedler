# Skill: Prisma ORM

## Cuándo usar esta skill
Para todas las operaciones de base de datos en speedler: queries, mutaciones, migraciones, relaciones.

## Client setup
```typescript
// src/lib/prisma.ts — singleton (ya existe en el proyecto)
import { PrismaClient } from '@prisma/client'
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }
export const prisma = globalForPrisma.prisma ?? new PrismaClient()
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

## Queries comunes
```typescript
// Buscar con relaciones
const pedido = await prisma.pedido.findUnique({
  where: { id },
  include: { cliente: true, items: { include: { producto: true } } }
})

// Paginación SIEMPRE en listados
const productos = await prisma.producto.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { createdAt: 'desc' }
})

// Transacción para operaciones multi-tabla
const resultado = await prisma.$transaction(async (tx) => {
  const pedido = await tx.pedido.create({ data: pedidoData })
  await tx.stock.update({ where: { productoId }, data: { cantidad: { decrement: 1 } } })
  return pedido
})
```

## Migraciones
```bash
npx prisma migrate dev --name descripcion   # Desarrollo
npx prisma migrate deploy                    # Producción
npx prisma db push                           # Sync sin migración (dev rápido)
npx prisma studio                            # GUI visual
```

## Reglas
- Siempre paginación en findMany de listados públicos
- Transacciones para cualquier operación que toque >1 tabla
- Nunca exponer prisma client en componentes cliente
- Select explícito en lugar de include cuando solo necesitas ciertos campos (performance)
- Índices en campos que filtras frecuentemente (where: { email }, where: { slug })
