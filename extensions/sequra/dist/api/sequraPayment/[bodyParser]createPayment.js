import { pool } from '@evershop/evershop/src/lib/postgres/connection.js';
import { getConfig } from '@evershop/evershop/src/lib/util/getConfig.js';
import { OK, INTERNAL_SERVER_ERROR, INVALID_PAYLOAD } from '@evershop/evershop/src/lib/util/httpStatus.js';

export default async function createPayment(request, response, delegate, next) {
  try {
    const { order_id } = request.body;

    if (!order_id) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'El campo order_id es obligatorio'
        }
      });
      return;
    }

    // Look up the order from the database
    const orderResult = await pool.query(
      `SELECT o.*, json_agg(json_build_object(
        'product_name', oi.product_name,
        'qty', oi.qty,
        'unit_price', oi.final_price,
        'total', oi.line_total
      )) as items
      FROM "order" o
      LEFT JOIN "order_item" oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1
      GROUP BY o.order_id`,
      [order_id]
    );

    if (orderResult.rows.length === 0) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Pedido no encontrado'
        }
      });
      return;
    }

    const order = orderResult.rows[0];
    const config = getConfig('system.sequra', {});

    const sequraUrl =
      config.environment === 'production'
        ? 'https://live.sequrapi.com'
        : 'https://sandbox.sequrapi.com';

    const merchantRef = config.merchantRef || '';
    const apiKey = config.apiKey || '';
    const baseUrl = config.baseUrl || getConfig('shop.baseUrl', 'http://localhost:3000');

    const authHeader = Buffer.from(`${merchantRef}:${apiKey}`).toString('base64');

    // Build seQura order payload
    const orderItems = (order.items || []).map((item) => ({
      reference: item.product_name,
      name: item.product_name,
      quantity: parseInt(item.qty, 10) || 1,
      price_with_tax: Math.round(Number(item.unit_price || 0) * 100),
      total_with_tax: Math.round(Number(item.total || 0) * 100)
    }));

    const sequraPayload = {
      merchant: {
        id: merchantRef
      },
      order: {
        merchant_reference: {
          order_ref_1: order.order_number || order_id
        },
        cart: {
          currency: 'EUR',
          items: orderItems,
          order_total_with_tax: Math.round(Number(order.grand_total || order.total) * 100)
        },
        delivery_address: {
          street: order.shipping_address_line_1 || '',
          city: order.shipping_city || '',
          postal_code: order.shipping_postcode || '',
          country_code: order.shipping_country || 'ES'
        }
      },
      customer: {
        email: order.customer_email || '',
        given_names: (order.customer_full_name || '').split(' ')[0] || '',
        surnames:
          (order.customer_full_name || '').split(' ').slice(1).join(' ') ||
          order.customer_full_name ||
          '',
        ref: order.customer_email || ''
      },
      platform: {
        name: 'Speedler',
        version: '1.0'
      },
      gui: {
        layout: 'desktop'
      }
    };

    const sequraResponse = await fetch(`${sequraUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authHeader}`
      },
      body: JSON.stringify(sequraPayload)
    });

    if (!sequraResponse.ok) {
      const errorText = await sequraResponse.text();
      throw new Error(`seQura API error: ${sequraResponse.status} - ${errorText}`);
    }

    const sequraData = await sequraResponse.json();
    const formUrl = sequraData.uri || (sequraData.form && sequraData.form.uri);
    const sequraOrderId = sequraData.id || '';

    // Update the order payment method and reference
    await pool.query(
      'UPDATE "order" SET "payment_method" = $1, "payment_method_name" = $2 WHERE "order_id" = $3',
      ['sequra', 'Pago aplazado (seQura)', order_id]
    );

    response.status(OK);
    response.json({
      data: {
        formUrl,
        sequraOrderId
      }
    });
  } catch (error) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: error.message || 'Error al procesar el pago con seQura'
      }
    });
  }
}
