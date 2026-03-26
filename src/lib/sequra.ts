const SEQURA_URL = process.env.SEQURA_URL || 'https://sandbox.sequrapi.com';
const SEQURA_MERCHANT_REF = process.env.SEQURA_MERCHANT_REF || '';
const SEQURA_API_KEY = process.env.SEQURA_API_KEY || '';

interface SequraOrderParams {
  orderId: string;
  amount: number;
  currency: string;
  customer: {
    email: string;
    name: string;
    phone?: string;
    nif?: string;
  };
  shippingAddress: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  items: {
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }[];
  callbackUrl: string;
  successUrl: string;
  cancelUrl: string;
}

export async function createSequraOrder(params: SequraOrderParams) {
  const authHeader = Buffer.from(
    `${SEQURA_MERCHANT_REF}:${SEQURA_API_KEY}`
  ).toString('base64');

  const body = {
    merchant: {
      id: SEQURA_MERCHANT_REF,
    },
    order: {
      merchant_reference: {
        order_ref_1: params.orderId,
      },
      cart: {
        currency: params.currency || 'EUR',
        items: params.items.map((item) => ({
          reference: item.name,
          name: item.name,
          quantity: item.quantity,
          price_with_tax: Math.round(item.unitPrice * 100),
          total_with_tax: Math.round(item.totalPrice * 100),
        })),
        order_total_with_tax: Math.round(params.amount * 100),
      },
      delivery_address: {
        street: params.shippingAddress.street,
        city: params.shippingAddress.city,
        postal_code: params.shippingAddress.postalCode,
        country_code: params.shippingAddress.country || 'ES',
      },
    },
    customer: {
      email: params.customer.email,
      given_names: params.customer.name.split(' ')[0],
      surnames: params.customer.name.split(' ').slice(1).join(' ') || params.customer.name,
      ref: params.customer.email,
      nin: params.customer.nif || '',
    },
    platform: {
      name: 'Speedler',
      version: '1.0',
    },
    gui: {
      layout: 'desktop',
    },
  };

  const response = await fetch(`${SEQURA_URL}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${authHeader}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Sequra API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  return {
    formUrl: data.uri || data.form?.uri,
    orderId: data.id,
  };
}

export async function getSequraOrderStatus(sequraOrderId: string) {
  const authHeader = Buffer.from(
    `${SEQURA_MERCHANT_REF}:${SEQURA_API_KEY}`
  ).toString('base64');

  const response = await fetch(`${SEQURA_URL}/orders/${sequraOrderId}`, {
    headers: {
      Authorization: `Basic ${authHeader}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Sequra API error: ${response.status}`);
  }

  return response.json();
}
