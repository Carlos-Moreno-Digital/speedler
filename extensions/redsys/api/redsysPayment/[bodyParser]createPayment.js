import CryptoJS from 'crypto-js';
import { pool } from '@evershop/evershop/src/lib/postgres/connection.js';
import { getConfig } from '@evershop/evershop/src/lib/util/getConfig.js';
import { OK, INTERNAL_SERVER_ERROR, INVALID_PAYLOAD } from '@evershop/evershop/src/lib/util/httpStatus.js';

const SIGNATURE_VERSION = 'HMAC_SHA256_V1';

function base64Encode(data) {
  return Buffer.from(data).toString('base64');
}

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

function createSignature(merchantParams, orderNumber, secretKey) {
  const key = Buffer.from(secretKey, 'base64');
  const encryptedKey = encrypt3DES(orderNumber, key);
  const hmac = CryptoJS.HmacSHA256(
    merchantParams,
    CryptoJS.enc.Base64.parse(encryptedKey)
  );
  return CryptoJS.enc.Base64.stringify(hmac);
}

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
      'SELECT * FROM "order" WHERE "order_id" = $1',
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
    const config = getConfig('system.redsys', {});

    const redsysUrl =
      config.environment === 'production'
        ? 'https://sis.redsys.es/sis/realizarPago'
        : 'https://sis-t.redsys.es:25443/sis/realizarPago';

    const merchantCode = config.merchantCode || '';
    const terminal = config.terminal || '1';
    const secretKey = config.secretKey || '';
    const baseUrl = config.baseUrl || getConfig('shop.baseUrl', 'http://localhost:3000');

    const orderNumber = String(order.order_number || order_id)
      .padStart(12, '0')
      .slice(0, 12);
    const amountInCents = Math.round(Number(order.grand_total || order.total) * 100);

    const merchantParameters = {
      DS_MERCHANT_AMOUNT: amountInCents.toString(),
      DS_MERCHANT_ORDER: orderNumber,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: '978', // EUR
      DS_MERCHANT_TRANSACTIONTYPE: '0', // Authorization
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_MERCHANTURL: `${baseUrl}/api/redsys/callback`,
      DS_MERCHANT_URLOK: `${baseUrl}/redsys/return?status=ok&order=${order_id}`,
      DS_MERCHANT_URLKO: `${baseUrl}/redsys/return?status=ko&order=${order_id}`,
      DS_MERCHANT_PRODUCTDESCRIPTION: `Pedido ${orderNumber} - Speedler`
    };

    const encodedParams = base64Encode(JSON.stringify(merchantParameters));
    const signature = createSignature(encodedParams, orderNumber, secretKey);

    // Update the order payment method
    await pool.query(
      'UPDATE "order" SET "payment_method" = $1, "payment_method_name" = $2 WHERE "order_id" = $3',
      ['redsys', 'Tarjeta de cr\u00e9dito/d\u00e9bito (Redsys)', order_id]
    );

    response.status(OK);
    response.json({
      data: {
        url: redsysUrl,
        Ds_SignatureVersion: SIGNATURE_VERSION,
        Ds_MerchantParameters: encodedParams,
        Ds_Signature: signature
      }
    });
  } catch (error) {
    response.status(INTERNAL_SERVER_ERROR);
    response.json({
      error: {
        status: INTERNAL_SERVER_ERROR,
        message: error.message || 'Error al procesar el pago con Redsys'
      }
    });
  }
}
