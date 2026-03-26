import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = process.env.SMTP_FROM || 'noreply@speedler.es';

interface OrderEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  canonDigital: number;
  iva: number;
  recargoEquivalencia: number;
  shipping: number;
  total: number;
  shippingAddress: string;
}

function generateOrderEmailHtml(data: OrderEmailData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(2)} &euro;</td>
    </tr>`
    )
    .join('');

  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <div style="background: linear-gradient(135deg, #E8A54B, #D4691A); padding: 30px; text-align: center;">
        <h1 style="color: white; margin: 0;">Speedler</h1>
      </div>
      <div style="padding: 30px;">
        <h2 style="color: #5B2C0E;">Confirmación de pedido</h2>
        <p>Hola ${data.customerName},</p>
        <p>Tu pedido <strong>${data.orderNumber}</strong> ha sido recibido correctamente.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <thead>
            <tr style="background: #F5F0EB;">
              <th style="padding: 10px; text-align: left;">Producto</th>
              <th style="padding: 10px; text-align: center;">Cant.</th>
              <th style="padding: 10px; text-align: right;">Precio</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>

        <div style="background: #F5F0EB; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <div style="display: flex; justify-content: space-between; margin: 5px 0;">
            <span>Subtotal:</span><span>${data.subtotal.toFixed(2)} &euro;</span>
          </div>
          ${data.canonDigital > 0 ? `<div style="margin: 5px 0;"><span>Canon digital:</span> <span>${data.canonDigital.toFixed(2)} &euro;</span></div>` : ''}
          <div style="margin: 5px 0;">
            <span>IVA (21%):</span> <span>${data.iva.toFixed(2)} &euro;</span>
          </div>
          ${data.recargoEquivalencia > 0 ? `<div style="margin: 5px 0;"><span>Recargo equivalencia:</span> <span>${data.recargoEquivalencia.toFixed(2)} &euro;</span></div>` : ''}
          <div style="margin: 5px 0;">
            <span>Envío:</span> <span>${data.shipping === 0 ? 'Gratis' : data.shipping.toFixed(2) + ' €'}</span>
          </div>
          <hr style="border: 1px solid #D4691A; margin: 10px 0;">
          <div style="font-size: 18px; font-weight: bold; color: #5B2C0E; margin: 5px 0;">
            <span>Total:</span> <span>${data.total.toFixed(2)} &euro;</span>
          </div>
        </div>

        <div style="margin: 20px 0;">
          <h3 style="color: #5B2C0E;">Dirección de envío</h3>
          <p>${data.shippingAddress}</p>
        </div>

        <p style="color: #888; font-size: 12px;">
          Si tienes alguna duda, no dudes en contactarnos en info@speedler.es
        </p>
      </div>
      <div style="background: #5B2C0E; color: white; padding: 15px; text-align: center; font-size: 12px;">
        &copy; ${new Date().getFullYear()} Speedler. Todos los derechos reservados.
      </div>
    </body>
    </html>
  `;
}

export async function sendOrderConfirmation(data: OrderEmailData) {
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured, skipping order confirmation email');
    return;
  }

  await transporter.sendMail({
    from: `Speedler <${FROM}>`,
    to: data.customerEmail,
    subject: `Pedido confirmado: ${data.orderNumber} - Speedler`,
    html: generateOrderEmailHtml(data),
  });
}

export async function sendShippingNotification(
  email: string,
  name: string,
  orderNumber: string,
  trackingNumber: string,
  trackingUrl: string
) {
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured, skipping shipping notification');
    return;
  }

  await transporter.sendMail({
    from: `Speedler <${FROM}>`,
    to: email,
    subject: `Tu pedido ${orderNumber} ha sido enviado - Speedler`,
    html: `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #E8A54B, #D4691A); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Speedler</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #5B2C0E;">¡Tu pedido está en camino!</h2>
          <p>Hola ${name},</p>
          <p>Tu pedido <strong>${orderNumber}</strong> ha sido enviado.</p>
          <p>Número de seguimiento: <strong>${trackingNumber}</strong></p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${trackingUrl}"
               style="background: #E88B2D; color: white; padding: 12px 30px;
                      text-decoration: none; border-radius: 8px; font-weight: bold;">
              Seguir mi envío
            </a>
          </div>
        </div>
        <div style="background: #5B2C0E; color: white; padding: 15px; text-align: center; font-size: 12px;">
          &copy; ${new Date().getFullYear()} Speedler. Todos los derechos reservados.
        </div>
      </body>
      </html>
    `,
  });
}

export async function sendContactForm(
  name: string,
  email: string,
  subject: string,
  message: string
) {
  if (!process.env.SMTP_USER) {
    console.log('SMTP not configured, skipping contact form email');
    return;
  }

  await transporter.sendMail({
    from: `Speedler <${FROM}>`,
    to: process.env.SMTP_USER,
    replyTo: email,
    subject: `[Contacto Speedler] ${subject}`,
    html: `
      <h2>Nuevo mensaje de contacto</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Asunto:</strong> ${subject}</p>
      <p><strong>Mensaje:</strong></p>
      <p>${message}</p>
    `,
  });
}
