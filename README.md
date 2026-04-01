# Speedler

Plataforma eCommerce especializada en componentes y hardware informatico, desarrollada con tecnologias modernas y optimizada para el mercado espanol. Soporta ventas B2C y B2B, sincronizacion automatizada con multiples mayoristas, configurador de PC a medida y cumplimiento fiscal completo (IVA, Canon Digital, Recargo de Equivalencia).

## Stack Tecnologico

| Capa | Tecnologia |
|------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Frontend** | React 18, TypeScript 5.5, Tailwind CSS 3.4 |
| **Base de datos** | PostgreSQL 16 |
| **ORM** | Prisma 5.22 |
| **Autenticacion** | NextAuth 4.24 (JWT, Credentials) |
| **Pagos** | Redsys, Sequra (pago aplazado), Transferencia |
| **Envios** | GLS |
| **Email** | Nodemailer + Mailchimp |
| **Infraestructura** | Docker, Docker Compose, GitHub Actions CI/CD |
| **Servidor** | VPS con Traefik (reverse proxy) |

## Funcionalidades Principales

### Tienda B2C
- Catalogo de productos con filtros avanzados (precio, categoria, fabricante, stock, busqueda)
- Carrito de compra persistente
- Checkout simplificado con multiples metodos de pago
- Gestion de cuenta: pedidos, direcciones, historial
- Newsletter integrada con Mailchimp
- Blog, paginas legales (privacidad, terminos, cookies, devoluciones)

### Area B2B
- Grupos de clientes con tarifas diferenciadas
- Precios sin IVA para cuentas de empresa
- Recargo de Equivalencia automatico

### Configurador de PC
- Ensamblaje interactivo por componentes
- Matrices de compatibilidad (sockets CPU/placa base, formato caja/fuente)
- Guardado de configuraciones (publicas/privadas)

### Sincronizacion de Mayoristas
- Adaptadores para 3 tipos de origen: CSV (URL), API REST, FTP
- Soporte para 7+ proveedores (Aseuropa, Compuspain, Desyman, DMI, Globomatik, Infortisa, Supercomp)
- Deduplicacion por EAN/Part Number
- Logica de priorizacion: stock propio primero, luego el mayorista con menor coste
- Doble cronjob: sincronizacion masiva (2x/dia) + flash de stock (cada 15 min)

### Panel de Administracion
- CRUD de productos, pedidos, clientes
- Reglas de precios dinamicas (porcentaje/fijo, por categoria/fabricante/producto/global)
- Gestion de sincronizaciones con proveedores
- Logs de sincronizacion

### Fiscalidad Espanola
- IVA 21% (configurable)
- Canon Digital LPI (variable segun tipo de producto: 1.2% - 3.6%)
- Recargo de Equivalencia (0% - 20.38% segun tipo de IVA)

## Requisitos Previos

- **Docker** y **Docker Compose** (recomendado)
- O bien: **Node.js 20+** y **PostgreSQL 16**

## Instalacion y Desarrollo

### Con Docker (recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/carlos-moreno-digital/speedler.git
cd speedler

# 2. Copiar variables de entorno
cp .env.example .env

# 3. Levantar servicios (app + PostgreSQL + cron)
docker compose up -d

# 4. La aplicacion estara disponible en http://localhost:3000
```

### Sin Docker

```bash
# 1. Instalar dependencias
npm install

# 2. Copiar y configurar variables de entorno
cp .env.example .env
# Editar .env con los datos de tu PostgreSQL

# 3. Ejecutar migraciones y seed
npx prisma migrate deploy
npx prisma db seed

# 4. Iniciar en modo desarrollo
npm run dev
```

### Usuario Admin por defecto

- **Email:** admin@speedler.es
- **Password:** admin123

## Variables de Entorno

| Variable | Descripcion |
|----------|-------------|
| `DATABASE_URL` | Conexion PostgreSQL |
| `NEXTAUTH_URL` | URL base de la aplicacion |
| `NEXTAUTH_SECRET` | Clave secreta para JWT |
| `REDSYS_*` | Credenciales pasarela Redsys |
| `SEQURA_*` | Credenciales Sequra (pago aplazado) |
| `GLS_*` | API de envios GLS |
| `SMTP_*` | Configuracion servidor de correo |
| `MAILCHIMP_*` | API newsletter |
| `CRON_SECRET` | Token de autenticacion para cronjobs |

Ver `.env.example` para la lista completa.

## Estructura del Proyecto

```
src/
├── app/
│   ├── admin/              # Panel de administracion
│   ├── api/                # Endpoints REST (25+)
│   │   ├── auth/           # Autenticacion (NextAuth)
│   │   ├── products/       # Productos y importacion
│   │   ├── orders/         # Pedidos
│   │   ├── cart/           # Carrito
│   │   ├── checkout/       # Proceso de compra
│   │   ├── configurator/   # Configurador de PC
│   │   ├── payment/        # Redsys, Sequra, Transferencia
│   │   ├── shipping/       # Tarifas y GLS
│   │   └── cron/           # Sincronizacion programada
│   ├── tienda/             # Catalogo de productos
│   ├── configurador-pc/    # Ensamblador de PCs
│   ├── checkout/           # Pagina de pago
│   └── cuenta/             # Area de usuario
├── components/             # Componentes React reutilizables
├── hooks/                  # Custom hooks (useCart)
├── lib/                    # Servicios y utilidades
│   ├── auth.ts             # Configuracion NextAuth
│   ├── prisma.ts           # Cliente Prisma singleton
│   ├── pricing.ts          # Motor de precios dinamicos
│   ├── canon-digital.ts    # Calculo Canon Digital
│   ├── recargo-equivalencia.ts  # Recargo de Equivalencia
│   ├── redsys.ts           # Pasarela Redsys
│   ├── sequra.ts           # Pasarela Sequra
│   ├── gls.ts              # Integracion GLS
│   ├── supplier-sync.ts    # Motor de sincronizacion
│   └── supplier-adapters/  # Adaptadores CSV, API, FTP
└── types/                  # Definiciones TypeScript
prisma/
├── schema.prisma           # Esquema de base de datos (17 modelos)
└── seed.ts                 # Datos iniciales (1000+ productos)
```

## Endpoints API Principales

| Metodo | Ruta | Descripcion |
|--------|------|-------------|
| GET | `/api/products` | Listado con filtros |
| GET | `/api/products/[id]` | Detalle de producto |
| POST | `/api/products/import` | Importacion masiva CSV |
| GET/POST | `/api/orders` | Listado y creacion de pedidos |
| GET/POST | `/api/cart` | Gestion del carrito |
| POST | `/api/checkout` | Procesar compra |
| POST | `/api/payment/redsys` | Pago con tarjeta |
| POST | `/api/payment/sequra` | Pago aplazado |
| GET | `/api/shipping/rates` | Tarifas de envio |
| POST | `/api/shipping/gls` | Crear envio GLS |
| GET | `/api/configurator/components` | Componentes para PC |
| POST | `/api/configurator/validate` | Validar compatibilidad |
| POST | `/api/cron/supplier-sync` | Trigger sincronizacion |

## Despliegue en Produccion

```bash
# Usar docker-compose de produccion
docker compose -f docker-compose.prod.yml up -d
```

El pipeline de CI/CD (GitHub Actions) despliega automaticamente al hacer push a `main`:
1. Conexion SSH al VPS
2. Pull del codigo actualizado
3. Rebuild de la imagen Docker
4. Restart de contenedores
5. Limpieza de imagenes obsoletas

### Requisitos del Servidor (minimos recomendados)

- 8 Cores CPU
- 16 GB RAM
- Almacenamiento NVMe
- OPcache y Redis habilitados

## Licencia

Proyecto privado. Todos los derechos reservados.
