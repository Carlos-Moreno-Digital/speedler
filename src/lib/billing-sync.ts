import prisma from './prisma';

const BILLING_API_URL = process.env.BILLING_API_URL || '';
const BILLING_API_KEY = process.env.BILLING_API_KEY || '';

interface BillingInvoiceData {
  invoiceNumber: string;
  orderNumber: string;
  customer: {
    name: string;
    email: string;
    nif?: string;
    address: string;
  };
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  subtotal: number;
  canonDigital: number;
  iva: number;
  recargoEquivalencia: number;
  shipping: number;
  total: number;
  date: string;
}

export async function syncInvoiceWithBilling(invoiceId: string): Promise<boolean> {
  if (!BILLING_API_URL || !BILLING_API_KEY) {
    console.log('Billing API not configured, skipping sync');
    return false;
  }

  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      order: {
        include: {
          user: true,
          items: { include: { product: true } },
          shippingAddress: true,
          billingAddress: true,
        },
      },
    },
  });

  if (!invoice || invoice.syncedWithBilling) return false;

  const order = invoice.order;
  const billingAddress = order.billingAddress || order.shippingAddress;
  const addressStr = billingAddress
    ? `${billingAddress.street}, ${billingAddress.postalCode} ${billingAddress.city}, ${billingAddress.province}`
    : '';

  const data: BillingInvoiceData = {
    invoiceNumber: invoice.invoiceNumber,
    orderNumber: order.orderNumber,
    customer: {
      name: order.user.name,
      email: order.user.email,
      nif: order.user.nif || undefined,
      address: addressStr,
    },
    items: order.items.map((item) => ({
      description: item.product.name,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
      totalPrice: Number(item.totalPrice),
    })),
    subtotal: Number(order.subtotal),
    canonDigital: Number(order.canonDigitalTotal),
    iva: Number(order.ivaTotal),
    recargoEquivalencia: Number(order.recargoEquivalenciaTotal),
    shipping: Number(order.shippingCost),
    total: Number(order.total),
    date: invoice.issuedAt.toISOString(),
  };

  try {
    const response = await fetch(`${BILLING_API_URL}/invoices`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${BILLING_API_KEY}`,
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { syncedWithBilling: true },
      });
      return true;
    }

    console.error('Billing sync failed:', await response.text());
    return false;
  } catch (error) {
    console.error('Billing sync error:', error);
    return false;
  }
}

export async function syncPendingInvoices(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await prisma.invoice.findMany({
    where: { syncedWithBilling: false },
    take: 50,
  });

  let synced = 0;
  let failed = 0;

  for (const invoice of pending) {
    const success = await syncInvoiceWithBilling(invoice.id);
    if (success) synced++;
    else failed++;
  }

  return { synced, failed };
}
