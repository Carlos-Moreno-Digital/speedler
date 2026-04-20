# Skill: TypeScript Strict Mode

## Cuándo usar
Siempre. Este proyecto tiene strict: true. Esta skill codifica las reglas.

## Reglas de tipado

### Nunca usar `any`
```typescript
// MAL
function procesar(data: any) { ... }

// BIEN — unknown + type guard
function procesar(data: unknown) {
  if (!isProducto(data)) throw new Error('Invalid')
  // aquí TypeScript ya sabe que es Producto
}

// BIEN — genérico
function procesar<T extends Producto>(data: T): T { ... }
```

### Tipos para respuestas de API
```typescript
// src/types/api.ts
type ApiSuccess<T> = { success: true; data: T }
type ApiError = { success: false; error: string; code?: string }
type ApiResponse<T> = ApiSuccess<T> | ApiError
```

### Zod para validación + tipos inferidos
```typescript
import { z } from 'zod'

const ProductoSchema = z.object({
  nombre: z.string().min(1),
  precio: z.number().positive(),
  stock: z.number().int().min(0)
})

type Producto = z.infer<typeof ProductoSchema>

// En Route Handler
const parsed = ProductoSchema.safeParse(body)
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
}
```

### Discriminated unions para estados
```typescript
type EstadoPedido =
  | { estado: 'pendiente'; creadoAt: Date }
  | { estado: 'pagado'; pagadoAt: Date; transaccionId: string }
  | { estado: 'enviado'; enviadoAt: Date; trackingId: string }
  | { estado: 'cancelado'; motivoCancelacion: string }
```

## Configuración tsconfig relevante
- `strict: true` — activa strictNullChecks, noImplicitAny, etc.
- `noUncheckedIndexedAccess: true` — arrays devuelven T | undefined
