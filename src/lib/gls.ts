const GLS_API_URL = process.env.GLS_API_URL || '';
const GLS_API_KEY = process.env.GLS_API_KEY || '';
const GLS_CLIENT_CODE = process.env.GLS_CLIENT_CODE || '';

interface GlsShipmentParams {
  orderId: string;
  recipient: {
    name: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
    phone: string;
    email: string;
  };
  packages: {
    weight: number; // kg
    length?: number; // cm
    width?: number; // cm
    height?: number; // cm
  }[];
  reference?: string;
  cashOnDelivery?: number;
}

interface GlsShipmentResponse {
  trackingNumber: string;
  labelUrl: string;
  shipmentId: string;
}

export async function createGlsShipment(
  params: GlsShipmentParams
): Promise<GlsShipmentResponse> {
  if (!GLS_API_URL) {
    // Development mode - return mock data
    const mockTracking = `GLS${Date.now()}`;
    return {
      trackingNumber: mockTracking,
      labelUrl: `${GLS_API_URL}/labels/${mockTracking}.pdf`,
      shipmentId: mockTracking,
    };
  }

  const body = {
    clientCode: GLS_CLIENT_CODE,
    shipments: [
      {
        reference: params.reference || params.orderId,
        deliveryAddress: {
          name: params.recipient.name,
          street: params.recipient.street,
          city: params.recipient.city,
          zipCode: params.recipient.postalCode,
          country: params.recipient.country || 'ES',
          phone: params.recipient.phone,
          email: params.recipient.email,
        },
        parcels: params.packages.map((pkg) => ({
          weight: pkg.weight,
          length: pkg.length || 0,
          width: pkg.width || 0,
          height: pkg.height || 0,
        })),
        service: 'BUSINESS_PARCEL',
        ...(params.cashOnDelivery
          ? { cod: { amount: params.cashOnDelivery, currency: 'EUR' } }
          : {}),
      },
    ],
  };

  const response = await fetch(`${GLS_API_URL}/shipments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${GLS_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GLS API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const shipment = data.shipments?.[0] || data;

  return {
    trackingNumber: shipment.trackingNumber || shipment.parcelNumber,
    labelUrl: shipment.labelUrl || shipment.label,
    shipmentId: shipment.shipmentId || shipment.id,
  };
}

export async function getGlsTracking(trackingNumber: string) {
  if (!GLS_API_URL) {
    return {
      trackingNumber,
      status: 'IN_TRANSIT',
      events: [
        {
          date: new Date().toISOString(),
          status: 'PICKED_UP',
          location: 'Centro de distribución',
          description: 'Envío recogido',
        },
      ],
    };
  }

  const response = await fetch(
    `${GLS_API_URL}/tracking/${trackingNumber}`,
    {
      headers: {
        Authorization: `Bearer ${GLS_API_KEY}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`GLS tracking error: ${response.status}`);
  }

  return response.json();
}

export function getGlsTrackingUrl(trackingNumber: string): string {
  return `https://www.gls-spain.es/es/seguimiento-envios/?match=${trackingNumber}`;
}

export function calculateShippingCost(
  totalWeight: number,
  orderTotal: number
): number {
  // Free shipping for orders over 100€
  if (orderTotal >= 100) return 0;

  if (totalWeight <= 5) return 4.95;
  if (totalWeight <= 15) return 6.95;
  if (totalWeight <= 30) return 9.95;
  return 14.95;
}
