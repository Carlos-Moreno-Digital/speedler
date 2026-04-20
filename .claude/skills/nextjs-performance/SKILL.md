# Skill: Performance Next.js

## Cuando usar
Para optimizar velocidad, Core Web Vitals y experiencia de usuario en speedler.

## Imagenes
- Siempre usar next/image con width/height o fill
- Formato WebP/AVIF automatico
- Lazy loading por defecto (priority solo para LCP hero image)

## Fuentes
- next/font/google con display: swap
- Preload solo la fuente principal (Instrument Serif o similar)

## Bundle optimization
- Dynamic imports para componentes pesados: modales, configurador de PC
- import dynamic from next/dynamic con ssr: false cuando no necesita SSR

## Caching estrategia
- fetch cache: force-cache para datos estaticos (productos publicados)
- revalidate: 60 para datos semi-dinamicos (precios, stock)
- cache: no-store para datos completamente dinamicos (carrito, sesion)

## Core Web Vitals objetivos
- LCP < 2.5s
- CLS < 0.1
- INP < 200ms

## Anti-patterns
- No importar librerias enteras: usar imports especificos
- No bloquear el thread principal con calculos pesados: usar Web Workers
- No cargar fuentes externas sin next/font
