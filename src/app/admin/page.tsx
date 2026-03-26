import prisma from '@/lib/prisma';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

async function getStats() {
  const [productCount, orderCount, customerCount, revenue, recentOrders] =
    await Promise.all([
      prisma.product.count({ where: { isActive: true } }),
      prisma.order.count(),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      prisma.order.aggregate({
        _sum: { total: true },
        where: { status: { in: ['PAID', 'SHIPPED', 'DELIVERED'] } },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { user: true },
      }),
    ]);

  return {
    productCount,
    orderCount,
    customerCount,
    revenue: Number(revenue._sum.total || 0),
    recentOrders,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  const statCards = [
    { label: 'Productos', value: stats.productCount, color: 'bg-blue-500' },
    { label: 'Pedidos', value: stats.orderCount, color: 'bg-green-500' },
    { label: 'Clientes', value: stats.customerCount, color: 'bg-purple-500' },
    {
      label: 'Facturación',
      value: formatPrice(stats.revenue),
      color: 'bg-brand-orange',
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-brown-dark mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat) => (
          <div key={stat.label} className="bg-white rounded-xl shadow-sm p-6">
            <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center text-white text-xl mb-4`}>
              {stat.label === 'Productos' && '📦'}
              {stat.label === 'Pedidos' && '🛒'}
              {stat.label === 'Clientes' && '👥'}
              {stat.label === 'Facturación' && '💰'}
            </div>
            <p className="text-gray-500 text-sm">{stat.label}</p>
            <p className="text-2xl font-bold text-brand-brown-dark">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-bold text-brand-brown-dark mb-4">
          Pedidos recientes
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 pr-4">Pedido</th>
                <th className="pb-3 pr-4">Cliente</th>
                <th className="pb-3 pr-4">Estado</th>
                <th className="pb-3 pr-4">Total</th>
                <th className="pb-3">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentOrders.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="py-3 pr-4 font-medium">{order.orderNumber}</td>
                  <td className="py-3 pr-4">{order.user.name}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'PAID'
                          ? 'bg-green-100 text-green-800'
                          : order.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : order.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : order.status === 'CANCELLED'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-3 pr-4">{formatPrice(Number(order.total))}</td>
                  <td className="py-3">
                    {new Date(order.createdAt).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
              {stats.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No hay pedidos todavía
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
