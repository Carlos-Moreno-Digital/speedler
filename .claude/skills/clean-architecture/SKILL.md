# Skill: Clean Architecture para Next.js

## Cuando usar
Para organizar logica de negocio, mantener separacion de capas y evitar acoplamiento en speedler.

## Capas
UI (components/) > Server Actions/Route Handlers > lib/ > prisma/

La logica de negocio va en lib/, nunca en Route Handlers ni en componentes.

## Estructura recomendada en lib/
- auth.ts -- authOptions de NextAuth
- prisma.ts -- Prisma singleton
- pedidos/ -- Logica de pedidos
- productos/ -- Logica de productos
- configurador/ -- Logica del configurador
- validaciones/ -- Schemas Zod compartidos

## Reglas
- Un Route Handler = orquestacion, no logica
- Las funciones en lib/ son testables en aislamiento
- No hay logica en types/ -- solo tipos e interfaces
- Nunca prisma.$queryRaw sin sanitizar inputs

