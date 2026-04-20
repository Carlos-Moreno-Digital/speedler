# Skill: NextAuth + Seguridad

## Cuándo usar
Para todo lo relacionado con autenticación, autorización, protección de rutas y sesiones en speedler.

## Proteger rutas de servidor
```typescript
// En Server Component o Route Handler
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const session = await getServerSession(authOptions)
if (!session) {
  redirect('/auth/login')  // Server Component
  // o return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
```

## Middleware para rutas /admin
```typescript
// middleware.ts (raíz del proyecto)
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === 'admin'
  }
})

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*']
}
```

## Reglas de seguridad
- Nunca exponer contraseñas ni tokens en client-side code
- Usar `getServerSession` en Server Components (no `useSession` en server)
- Hashear contraseñas con bcryptjs (ya en stack)
- Validar rol/permisos en CADA Route Handler protegido, no solo en el middleware
- JWT secrets mínimo 32 chars, rotar en producción
- NEXTAUTH_SECRET nunca en repositorio

## Sesión extendida con rol
```typescript
// En authOptions callbacks
callbacks: {
  session: ({ session, token }) => ({
    ...session,
    user: { ...session.user, role: token.role }
  }),
  jwt: ({ token, user }) => {
    if (user) token.role = user.role
    return token
  }
}
```
