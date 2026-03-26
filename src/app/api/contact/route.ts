import { NextRequest, NextResponse } from 'next/server';
import { sendContactForm } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const { name, email, subject, message } = await request.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Todos los campos son obligatorios' },
        { status: 400 }
      );
    }

    await sendContactForm(name, email, subject, message);

    return NextResponse.json({
      message: 'Mensaje enviado correctamente. Te responderemos lo antes posible.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
