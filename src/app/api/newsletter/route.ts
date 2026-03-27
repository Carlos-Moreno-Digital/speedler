import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || '';
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || '';
const MAILCHIMP_SERVER = MAILCHIMP_API_KEY.split('-').pop() || '';

async function addToMailchimp(email: string): Promise<void> {
  if (!MAILCHIMP_API_KEY || !MAILCHIMP_LIST_ID || !MAILCHIMP_SERVER) {
    console.log('Mailchimp not configured, skipping');
    return;
  }

  const url = `https://${MAILCHIMP_SERVER}.api.mailchimp.com/3.0/lists/${MAILCHIMP_LIST_ID}/members`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString('base64')}`,
    },
    body: JSON.stringify({
      email_address: email,
      status: 'subscribed',
      tags: ['web-signup'],
    }),
  });

  if (!response.ok && response.status !== 400) {
    // 400 = already subscribed, which is fine
    const error = await response.text();
    console.error('Mailchimp error:', error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Email no válido' },
        { status: 400 }
      );
    }

    await prisma.newsletter.upsert({
      where: { email },
      update: { isSubscribed: true },
      create: { email, isSubscribed: true },
    });

    // Sync with Mailchimp
    try {
      await addToMailchimp(email);
    } catch (mailchimpError) {
      console.error('Mailchimp sync failed:', mailchimpError);
    }

    return NextResponse.json({
      message: '¡Te has suscrito correctamente a nuestro newsletter!',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requerido' }, { status: 400 });
    }

    await prisma.newsletter.update({
      where: { email },
      data: { isSubscribed: false },
    });

    return NextResponse.json({ message: 'Suscripción cancelada' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
