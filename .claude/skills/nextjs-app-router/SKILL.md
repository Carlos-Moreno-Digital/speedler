# Skill: Next.js 14 App Router

## Cuándo usar esta skill
Cuando trabajes con rutas, layouts, páginas, Server/Client Components, Route Handlers o Server Actions en speedler.

## Reglas fundamentales

### Server vs Client Components
- **Por defecto: Server Component**. Añade `"use client"` solo cuando necesites: useState, useEffect, onClick, onChange, o cualquier browser API.
- Los Server Components pueden ser async. Haz fetch y queries DB directamente en ellos.
- Nunca importes Server Components desde Client Components.

### Route Handlers
```typescript
// src/app/api/[recurso]/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Validar con Zod
  // Query con Prisma
  return NextResponse.json(data)
}
```

### Server Actions
```typescript
// src/app/[ruta]/actions.ts
'use server'
import { revalidatePath } from 'next/cache'

export async function myAction(formData: FormData) {
  // Validar, mutar DB, revalidar cache
  revalidatePath('/ruta')
}
```

### Metadata
```typescript
// En layout.tsx o page.tsx
export const metadata: Metadata = {
  title: 'Página | Speedler',
  description: '...'
}
```

### Streaming y Suspense
```typescript
// Usa loading.tsx para skeleton automático
// O Suspense manual para componentes lentos
import { Suspense } from 'react'
<Suspense fallback={<Skeleton />}>
  <ComponenteAsíncrono />
</Suspense>
```

## Anti-patterns
- No uses `getServerSideProps` ni `getStaticProps` (son Pages Router)
- No hagas fetch en Client Components directamente — usa Route Handlers o Server Components
- No mezcles lógica de negocio en componentes UI
