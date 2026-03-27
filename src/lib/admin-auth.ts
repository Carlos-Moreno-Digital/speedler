import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { NextResponse } from 'next/server';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'No autorizado' }, { status: 401 }), session: null };
  }

  const user = session.user as { id: string; role: string };

  if (user.role !== 'ADMIN') {
    return { error: NextResponse.json({ error: 'Acceso denegado' }, { status: 403 }), session: null };
  }

  return { error: null, session, user };
}
