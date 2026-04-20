# CLAUDE.md — speedler

> Fuente de verdad técnica para cualquier asistente IA o desarrollador que trabaje en este proyecto.
> Leer completo antes de escribir código.

---

## 1. Visión general del producto

**Speedler** es una tienda/SaaS de hardware y configuradores de PC. Permite a clientes navegar catálogo, configurar PCs a medida, gestionar pedidos y acceder a cuenta propia. Incluye panel de administración completo.

**Stack**: Next.js 14 (App Router) + React 18 + TypeScript + Prisma + PostgreSQL + Docker + NextAuth.

---

## 2. Stack técnico

| Capa | Tecnología |
|------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **UI** | React 18 + TypeScript |
| **Estilos** | Tailwind CSS |
| **Auth** | NextAuth v4 (next-auth) |
| **ORM** | Prisma 5 |
| **DB** | PostgreSQL (Docker) |
| **Contenedores** | Docker + Docker Compose |
| **Email** | Nodemailer |
| **Validación** | Zod |
| **Crypto** | crypto-js, bcryptjs |
| **UI extras** | react-hot-toast, react-icons, sharp |

---

## 3. Estructura del proyecto

```
speedler/
├── src/
│   ├── app/
│   │   ├── admin/          # Panel de administración
│   │   │   ├── clientes/
│   │   │   ├── pedidos/
│   │   │   ├── precios/
│   │   │   └── productos/
│   │   ├── api/            # API routes (App Router)
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   ├── cart/
│   │   │   ├── categories/
│   │   │   ├── checkout/
│   │   │   ├── configurator/
│   │   │   ├── contact/
│   │   │   ├── cron/
│   │   │   ├── newsletter/
│   │   │   ├── orders/
│   │   │   ├── payment/
│   │   │   ├── products/
│   │   │   └── shipping/
│   │   ├── auth/           # Páginas auth (login, registro)
│   │   ├── blog/
│   │   ├── carrito/
│   │   ├── checkout/
│   │   ├── configurador-pc/
│   │   ├── cuenta/         # Área cliente
│   │   └── (otras páginas públicas)
│   ├── components/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── configurator/
│   │   ├── home/
│   │   ├── layout/
│   │   ├── products/
│   │   └── ui/             # Primitivos reutilizables
│   ├── hooks/
│   ├── lib/                # Utilidades, prisma client, etc.
│   └── types/
├── prisma/
│   └── schema.prisma
├── public/
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 4. Comandos clave

```bash
# Desarrollo
npm run dev          # Servidor Next.js en desarrollo (localhost:3000)

# Build
npm run build        # Build de producción
npm run start        # Servidor en producción

# Base de datos
npm run db:generate  # Regenerar Prisma client
npm run db:push      # Sincronizar schema sin migraciones
npm run db:seed      # Poblar con datos iniciales
npm run db:studio    # Abrir Prisma Studio (explorador visual)

# Linting
npm run lint         # ESLint

# Docker
docker-compose up -d             # Levantar entorno completo
docker-compose -f docker-compose.prod.yml up -d  # Producción
```

---

## 5. Reglas de desarrollo

### TypeScript
- `strict: true` siempre.
- No usar `any`. Si es inevitable, documentar el motivo.
- Server Components por defecto. Añadir `"use client"` solo cuando sea necesario (interactividad, hooks de estado/efecto).

### Next.js App Router
- **Route Handlers** en `src/app/api/`. Usar `NextRequest`/`NextResponse`.
- **Server Actions** para mutaciones de formularios cuando sea apropiado.
- **Metadata** definida en cada `layout.tsx` / `page.tsx` relevante.
- No mezclar Pages Router con App Router.

### Base de datos
- Siempre usar Prisma transactions para operaciones multi-tabla.
- Nunca exponer el Prisma Client directamente en componentes cliente.
- Toda query de DB en Server Components, Route Handlers, o Server Actions.

### Auth
- NextAuth con adaptador Prisma. Sesiones JWT.
- Proteger rutas `/admin/*` y `/api/admin/*` con middleware o getServerSession.
- Nunca exponer contraseñas ni tokens en client.

### Estilos
- Tailwind CSS. Sin CSS-in-JS.
- Clases utilitarias. Evitar `@apply` salvo para componentes base reutilizables.
- Responsive por defecto: mobile-first.

### Commits (Conventional Commits)
```
feat: nueva funcionalidad
fix: corrección de bug
chore: mantenimiento
docs: documentación
refactor: refactorización
perf: mejora de rendimiento
```

---

## 6. Variables de entorno requeridas

```bash
# .env.local (nunca commitear)
DATABASE_URL="postgresql://user:pass@localhost:5432/speedler"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="min-32-chars"
# Email
EMAIL_HOST=
EMAIL_PORT=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM=
# Pagos (si aplica)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLIC_KEY=
```

---

## 7. Patrones anti-patterns

- **No fetch directamente en Client Components**: usar Server Components o Route Handlers.
- **No exponer DATABASE_URL al cliente**.
- **No hacer `prisma.findMany()` sin paginación** en endpoints de listado.
- **No saltarse validación Zod** en Route Handlers.
- **No mezclar lógica de negocio en componentes UI**: extraer a `lib/` o Server Actions.

---

## 8. MCPs configurados

Ver `.mcp.json` en la raíz del proyecto.

| MCP | Propósito |
|-----|-----------|
| **context7** | Docs actualizadas de Next.js, Prisma, NextAuth, Tailwind |
| **magic** (21st.dev) | Generación de componentes UI premium |

---

## 9. Skills instaladas

Ver `.claude/skills/`. Skills aplicadas a este stack:

- **clean-code** — Nomenclatura, funciones pequeñas, legibilidad
- **clean-architecture** — Separación capas, Dependency Rule
- **refactoring-patterns** — Refactorización segura con tests
- **frontend-design** — Componentes UI de calidad
- **webapp-testing** — Testing con Playwright/Vitest
- **pragmatic-programmer** — DRY, ortogonalidad, tracer bullets
- **release-it** — Circuit breakers, resiliencia en producción
- **domain-driven-design** — Modelado de dominio (tienda, pedidos, productos)

---

*Última actualización: 2026-04-20*
