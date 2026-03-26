import { NextRequest, NextResponse } from 'next/server';
import { verifyRedsysCallback, isPaymentSuccessful } from '@/lib/redsys';
import prisma from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const merchantParams = formData.get('Ds_MerchantParameters') as string;
    const signature = formData.get('Ds_Signature') as string;

    if (!merchantParams || !signature) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const { valid, data } = verifyRedsysCallback(merchantParams, signature);

    if (!valid || !data) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 403 });
    }

    const orderNumber = data.Ds_Order?.replace(/^0+/, '');
    const responseCode = data.Ds_Response || '';

    if (!orderNumber) {
      return NextResponse.json({ error: 'Missing order number' }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { orderNumber: { contains: orderNumber } },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (isPaymentSuccessful(responseCode)) {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'PAID',
          paymentReference: data.Ds_AuthorisationCode || '',
        },
      });
    } else {
      await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'CANCELLED',
          paymentReference: `ERROR: ${responseCode}`,
        },
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('Redsys callback error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
