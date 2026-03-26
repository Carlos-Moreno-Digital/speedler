import React from 'react';

export default function SequraReturnPage() {
  const [status, setStatus] = React.useState('loading');
  const [orderId, setOrderId] = React.useState(null);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('status');
    const order = params.get('order');
    setOrderId(order);
    setStatus(paymentStatus === 'ok' ? 'success' : paymentStatus === 'cancel' ? 'cancelled' : 'error');
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Procesando resultado del pago...</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-green-500 text-6xl mb-4">&#10003;</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Solicitud de pago aplazado aprobada</h1>
          <p className="text-gray-600 mb-6">
            Tu solicitud de financiacion con seQura ha sido aprobada. Recibiras un email de
            confirmacion con los detalles de tu pedido y las condiciones de pago.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-4">Referencia del pedido: {orderId}</p>
          )}
          <a
            href="/cuenta/pedidos"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver mis pedidos
          </a>
        </div>
      </div>
    );
  }

  if (status === 'cancelled') {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="text-yellow-500 text-6xl mb-4">&#9888;</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Pago cancelado</h1>
          <p className="text-gray-600 mb-6">
            Has cancelado el proceso de pago aplazado con seQura. No se ha realizado ningun cargo.
            Puedes volver a intentarlo o elegir otro metodo de pago.
          </p>
          {orderId && (
            <p className="text-sm text-gray-500 mb-4">Referencia del pedido: {orderId}</p>
          )}
          <div className="space-x-4">
            <a
              href="/checkout"
              className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Volver al checkout
            </a>
            <a
              href="/"
              className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="text-center max-w-md mx-auto p-8">
        <div className="text-red-500 text-6xl mb-4">&#10007;</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Error en la solicitud</h1>
        <p className="text-gray-600 mb-6">
          Ha ocurrido un error al procesar tu solicitud de pago aplazado con seQura. Por favor,
          intentalo de nuevo o elige otro metodo de pago.
        </p>
        {orderId && (
          <p className="text-sm text-gray-500 mb-4">Referencia del pedido: {orderId}</p>
        )}
        <div className="space-x-4">
          <a
            href="/checkout"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Volver al checkout
          </a>
          <a
            href="/"
            className="inline-block bg-gray-200 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Ir al inicio
          </a>
        </div>
      </div>
    </div>
  );
}

export const layout = {
  areaId: 'content',
  sortOrder: 10
};

export const query = `
  query {
    currentUrl
  }
`;
