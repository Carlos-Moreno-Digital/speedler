# Skill: Patrones E-commerce

## Cuando usar
Para logica de carrito, pedidos, configurador de PC, checkout y gestion de stock en speedler.

## Carrito (estado cliente)
- El carrito vive en localStorage/cookies para usuarios no autenticados
- Al hacer login, merge del carrito anonimo con el carrito de DB
- Nunca confiar en el precio del cliente -- recalcular SIEMPRE en servidor al hacer checkout

## Flujo de pedido
Carrito > Checkout > Validacion (stock, precios) > Pago > Confirmacion > Fulfillment

Cada transicion debe:
1. Validar stock disponible (transaccion DB)
2. Bloquear stock temporalmente (reserva)
3. Liberar si el pago falla o expira (cron job)

## Configurador de PC
- Guardar configuracion como JSON en DB, no como productos individuales
- Validar compatibilidad en servidor (no solo en UI)
- Precio de configuracion = suma de precios actuales de componentes (recalcular al checkout)

## Anti-patterns ecommerce
- Nunca decrementar stock antes de confirmar el pago
- Nunca mostrar precio del carrito sin recalcular en servidor
- Nunca permitir checkout con stock = 0 (usar transaccion para evitar race condition)
- No almacenar datos de tarjeta (usar Stripe)

## Gestion de precios admin
- Precios centralizados en tabla Producto.precio
- Historial de cambios de precio para auditoria
