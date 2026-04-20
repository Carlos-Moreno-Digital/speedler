# Comando: Checklist de desarrollo

Antes de hacer PR o deploy, verifica:

## Codigo
- [ ] No hay archivos con any en TypeScript
- [ ] Todas las Route Handlers validan con Zod
- [ ] No hay queries sin paginacion en listados
- [ ] No hay logica de negocio en componentes UI
- [ ] Los errores devuelven codigo HTTP correcto (400, 401, 404, 500)

## Base de datos
- [ ] Nuevos campos tienen migracion creada
- [ ] No hay findMany sin where en endpoints publicos
- [ ] Operaciones multi-tabla usan prisma.$transaction

## Seguridad
- [ ] Rutas /admin/* protegidas con getServerSession
- [ ] No se exponen datos sensibles en respuestas publicas
- [ ] Precios recalculados en servidor en checkout

## Rendimiento
- [ ] Imagenes con next/image (no img)
- [ ] Imports dinamicos para modales y componentes pesados
- [ ] Server Components donde no hay interactividad

## Entorno
- [ ] Variables de entorno en .env.local (no commiteadas)
- [ ] npm run lint pasa sin errores
- [ ] npm run build completa sin errores
