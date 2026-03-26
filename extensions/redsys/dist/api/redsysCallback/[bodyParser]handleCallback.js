import CryptoJS from 'crypto-js';
import { pool } from '@evershop/evershop/src/lib/postgres/connection.js';
import { getConfig } from '@evershop/evershop/src/lib/util/getConfig.js';
import { OK, INTERNAL_SERVER_ERROR, INVALID_PAYLOAD } from '@evershop/evershop/src/lib/util/httpStatus.js';

function encrypt3DES(data, key) {
  const keyWords = CryptoJS.enc.Hex.parse(key.toString('hex'));
  const dataWords = CryptoJS.enc.Utf8.parse(data);
  const encrypted = CryptoJS.TripleDES.encrypt(dataWords, keyWords, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding,
    iv: CryptoJS.enc.Hex.parse('0000000000000000')
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

function verifySignature(merchantParams, receivedSignature, secretKey) {
  try {
    const decoded = JSON.parse(
      Buffer.from(merchantParams, 'base64').toString('utf-8')
    );
    const orderNumber = decoded.Ds_Order || '';
    const key = Buffer.from(secretKey, 'base64');
    const encryptedKey = encrypt3DES(orderNumber, key);
    const hmac = CryptoJS.HmacSHA256(
      merchantParams,
      CryptoJS.enc.Base64.parse(encryptedKey)
    );
    const expectedSignature = CryptoJS.enc.Base64.stringify(hmac);

    // Compare signatures with URL-safe base64 normalization
    const normalize = (s) => s.replace(/\+/g, '-').replace(/\//g, '_');
    if (normalize(expectedSignature) === normalize(receivedSignature)) {
      return { valid: true, data: decoded };
    }
    return { valid: false, data: null };
  } catch {
    return { valid: false, data: null };
  }
}

function isPaymentSuccessful(responseCode) {
  const code = parseInt(responseCode, 10);
  return code >= 0 && code <= 99;
}

export default async function handleCallback(request, response, delegate, next) {
  try {
    const { Ds_MerchantParameters, Ds_Signature } = request.body;

    if (!Ds_MerchantParameters || !Ds_Signature) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Missing Redsys parameters'
        }
      });
      return;
    }

    const config = getConfig('system.redsys', {});
    const secretKey = config.secretKey || '';

    const { valid, data } = verifySignature(Ds_MerchantParameters, Ds_Signature, secretKey);

    if (!valid || !data) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'Firma no v\u00e1lida'
        }
      });
      return;
    }

    const orderNumber = (data.Ds_Order || '').replace(/^0+/, '');
    const responseCode = data.Ds_Response || '';
    const authorisationCode = data.Ds_AuthorisationCode || '';

    if (!orderNumber) {
      response.status(INVALID_PAYLOAD);
      response.json({
        error: {
          status: INVALID_PAYLOAD,
          message: 'N\u00famero de pedido no encontrado'
        }
      });
      return;
    }

    // Find order by order number
    const orderResult = await pool.query(
      'SELECT * FROM "order" WHERE "order_number" = $1 OR "order_id"::text LIKE $2',
      [orderNumber, `%${orderNumber}%`]
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

    if (isPaymentSuccessful(responseCode)) {
      // Payment successful - update order status
      await pool.query(
        'UPDATE "order" SET "payment_status" = $1, "payment_method" = $2 WHERE "order_id" = $3',
        ['paid', 'redsys', order.order_id]
      );

      // Create transaction record if table exists
      try {
        await pool.query(
          `INSERT INTO "payment_transaction"
            ("payment_transaction_id", "order_id", "transaction_id", "transaction_type", "amount", "payment_action")
           VALUES (gen_random_uuid(), $1, $2, 'authorization', $3, 'capture')`,
          [order.order_id, authorisationCode, order.grand_total || order.total]
        );
      } catch {
        // Transaction table may not exist, continue silently
      }
    } else {
      // Payment failed
      await pool.query(
        'UPDATE "order" SET "payment_status" = $1 WHERE "order_id" = $2',
        ['failed', order.order_id]
      );
    }

    response.status(OK);
    response.json({ data: { success: true } });
  } catch (error) {
    console.error('Redsys callback error:', error);
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: 'Error interno al procesar la respuesta de Redsys'
      }
    });
  }
}
