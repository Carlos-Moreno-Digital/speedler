import { pool } from '@evershop/evershop/src/lib/postgres/connection.js';
import { getConfig } from '@evershop/evershop/src/lib/util/getConfig.js';
import { OK, INTERNAL_SERVER_ERROR, INVALID_PAYLOAD } from '@evershop/evershop/src/lib/util/httpStatus.js';

async function fetchSequraOrderStatus(sequraOrderId, sequraUrl, authHeader) {
  const statusResponse = await fetch(`${sequraUrl}/orders/${sequraOrderId}`, {
    headers: {
      Authorization: `Basic ${authHeader}`
    }
  });

  if (!statusResponse.ok) {
    throw new Error(`seQura status check failed: ${statusResponse.status}`);
  }

  return statusResponse.json();
}

export default async function handleCallback(request, response, delegate, next) {
  try {
    const { order_ref, sq_order_id, sq_state } = request.body;

    if (!order_ref && !sq_order_id) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Missing seQura callback parameters'
        }
      });
      return;
    }

    const config = getConfig('system.sequra', {});
    const sequraUrl =
      config.environment === 'production'
        ? 'https://live.sequrapi.com'
        : 'https://sandbox.sequrapi.com';
    const merchantRef = config.merchantRef || '';
    const apiKey = config.apiKey || '';
    const authHeader = Buffer.from(`${merchantRef}:${apiKey}`).toString('base64');

    // Find the order
    let orderResult;
    if (order_ref) {
      orderResult = await pool.query(
        'SELECT * FROM "order" WHERE "order_number" = $1 OR "order_id"::text = $1',
        [order_ref]
      );
    } else {
      // Look up by seQura order ID stored in payment reference
      orderResult = await pool.query(
        'SELECT * FROM "order" WHERE "payment_method" = $1',
        ['sequra']
      );
    }

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

    // Verify order status with seQura API if we have an order ID
    let paymentStatus = sq_state || '';
    if (sq_order_id) {
      try {
        const sequraOrder = await fetchSequraOrderStatus(sq_order_id, sequraUrl, authHeader);
        paymentStatus = sequraOrder.state || paymentStatus;
      } catch (err) {
        console.error('Error fetching seQura order status:', err);
      }
    }

    // Map seQura states to internal payment statuses
    const isApproved =
      paymentStatus === 'approved' ||
      paymentStatus === 'confirmed' ||
      paymentStatus === 'disbursed';

    if (isApproved) {
      await pool.query(
        'UPDATE "order" SET "payment_status" = $1 WHERE "order_id" = $2',
        ['paid', order.order_id]
      );

      // Create transaction record if table exists
      try {
        await pool.query(
          `INSERT INTO "payment_transaction"
            ("payment_transaction_id", "order_id", "transaction_id", "transaction_type", "amount", "payment_action")
           VALUES (gen_random_uuid(), $1, $2, 'authorization', $3, 'capture')`,
          [order.order_id, sq_order_id || '', order.grand_total || order.total]
        );
      } catch {
        // Transaction table may not exist, continue silently
      }
    } else if (paymentStatus === 'cancelled' || paymentStatus === 'rejected') {
      await pool.query(
        'UPDATE "order" SET "payment_status" = $1 WHERE "order_id" = $2',
        ['failed', order.order_id]
      );
    }
    // For 'pending' or other states, do not update the order

    response.status(OK);
    response.json({ data: { success: true } });
  } catch (error) {
    console.error('seQura callback error:', error);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: 'Error interno al procesar la respuesta de seQura'
      }
    });
  }
}
