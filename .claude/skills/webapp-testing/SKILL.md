# Skill: Testing de aplicaciones web

## Cuando usar
Para escribir tests en speedler: unitarios, integracion y E2E.

## Stack recomendado
- Vitest: tests unitarios de funciones lib/
- Supertest: tests de Route Handlers
- Playwright: E2E (flujos de compra, checkout, admin)

## Que testear primero (prioridad)
1. Calculos de precio y totales (lib/pedidos/)
2. Validaciones Zod de los schemas principales
3. Flujo de autenticacion (login, proteccion rutas admin)
4. Checkout completo (E2E con Playwright)
5. Stock management (race conditions)

## Convenciones
- Aniadir data-testid a elementos clave para Playwright
- Tests unitarios junto al codigo: lib/pedidos/calcularTotal.test.ts
- Tests E2E en carpeta tests/e2e/
- No testear implementacion, testear comportamiento observable

## Comandos
npx vitest run            # Correr tests unitarios
npx vitest --watch        # Watch mode
npx playwright test       # Tests E2E
