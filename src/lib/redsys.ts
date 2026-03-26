import CryptoJS from 'crypto-js';

const REDSYS_URL = process.env.REDSYS_URL || 'https://sis-t.redsys.es:25443/sis/realizarPago';
const MERCHANT_CODE = process.env.REDSYS_MERCHANT_CODE || '';
const TERMINAL = process.env.REDSYS_TERMINAL || '1';
const SECRET_KEY = process.env.REDSYS_SECRET_KEY || '';

interface RedsysPaymentParams {
  orderId: string;
  amount: number; // in cents
  description: string;
  callbackUrl: string;
  successUrl: string;
  errorUrl: string;
}

function base64UrlEncode(data: string): string {
  return Buffer.from(data).toString('base64');
}

function encrypt3DES(data: string, key: Buffer): string {
  const keyWords = CryptoJS.enc.Hex.parse(key.toString('hex'));
  const dataWords = CryptoJS.enc.Utf8.parse(data);
  const encrypted = CryptoJS.TripleDES.encrypt(dataWords, keyWords, {
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.ZeroPadding,
    iv: CryptoJS.enc.Hex.parse('0000000000000000'),
  });
  return encrypted.ciphertext.toString(CryptoJS.enc.Base64);
}

function createSignature(merchantParams: string, orderNumber: string): string {
  const key = Buffer.from(SECRET_KEY, 'base64');
  const encryptedKey = encrypt3DES(orderNumber, key);
  const hmac = CryptoJS.HmacSHA256(
    merchantParams,
    CryptoJS.enc.Base64.parse(encryptedKey)
  );
  return CryptoJS.enc.Base64.stringify(hmac);
}

export function createRedsysPayment(params: RedsysPaymentParams) {
  const merchantParameters = {
    DS_MERCHANT_AMOUNT: params.amount.toString(),
    DS_MERCHANT_ORDER: params.orderId.padStart(12, '0').slice(0, 12),
    DS_MERCHANT_MERCHANTCODE: MERCHANT_CODE,
    DS_MERCHANT_CURRENCY: '978', // EUR
    DS_MERCHANT_TRANSACTIONTYPE: '0', // Authorization
    DS_MERCHANT_TERMINAL: TERMINAL,
    DS_MERCHANT_MERCHANTURL: params.callbackUrl,
    DS_MERCHANT_URLOK: params.successUrl,
    DS_MERCHANT_URLKO: params.errorUrl,
    DS_MERCHANT_PRODUCTDESCRIPTION: params.description,
  };

  const encodedParams = base64UrlEncode(JSON.stringify(merchantParameters));
  const signature = createSignature(encodedParams, params.orderId);

  return {
    url: REDSYS_URL,
    Ds_SignatureVersion: 'HMAC_SHA256_V1',
    Ds_MerchantParameters: encodedParams,
    Ds_Signature: signature,
  };
}

export function verifyRedsysCallback(
  merchantParams: string,
  signature: string
): { valid: boolean; data: Record<string, string> | null } {
  try {
    const decoded = JSON.parse(
      Buffer.from(merchantParams, 'base64').toString('utf-8')
    );
    const orderNumber = decoded.Ds_Order || '';
    const expectedSignature = createSignature(merchantParams, orderNumber);

    if (
      expectedSignature.replace(/\+/g, '-').replace(/\//g, '_') ===
      signature.replace(/\+/g, '-').replace(/\//g, '_')
    ) {
      return { valid: true, data: decoded };
    }
    return { valid: false, data: null };
  } catch {
    return { valid: false, data: null };
  }
}

export function isPaymentSuccessful(responseCode: string): boolean {
  const code = parseInt(responseCode, 10);
  return code >= 0 && code <= 99;
}
