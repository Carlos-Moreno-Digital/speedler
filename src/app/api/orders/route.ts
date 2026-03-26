import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { generateOrderNumber } from '@/lib/utils';
import { calculateTaxes } from '@/lib/recargo-equivalencia';

interface CartItem {
  productId: string;
  quantity: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const status = searchParams.get('status');
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const pageSize = 20;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    const where: Prisma.OrderWhereInput = { userId };

    if (status) {
      where.status = status as Prisma.EnumOrderStatusFilter['equals'];
    }

    const skip = (page - 1) * pageSize;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  image: true,
                  sku: true,
                },
              },
            },
          },
          shippingAddress: true,
          billingAddress: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
      prisma.order.count({ where }),
    ]);

    return NextResponse.json({
      orders,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      shippingAddressId,
      billingAddressId,
      paymentMethod,
      notes,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Fetch user with cart
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { cart: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    if (!user.cart) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    const cartItems = user.cart.items as unknown as CartItem[];

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Fetch products for cart items
    const productIds = cartItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    // Validate all products exist and have stock
    const orderItems: {
      productId: string;
      quantity: number;
      unitPrice: number;
      canonDigital: number;
      totalPrice: number;
    }[] = [];

    let subtotal = 0;
    let canonDigitalTotal = 0;

    for (const cartItem of cartItems) {
      const product = products.find((p) => p.id === cartItem.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${cartItem.productId} not found or inactive` },
          { status: 400 }
        );
      }
      if (product.stock < cartItem.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient stock for ${product.name}. Available: ${product.stock}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.salePrice);
      const canonDigital = Number(product.canonDigital);
      const totalPrice = Math.round(unitPrice * cartItem.quantity * 100) / 100;

      subtotal += totalPrice;
      canonDigitalTotal += Math.round(canonDigital * cartItem.quantity * 100) / 100;

      orderItems.push({
        productId: product.id,
        quantity: cartItem.quantity,
        unitPrice,
        canonDigital,
        totalPrice,
      });
    }

    subtotal = Math.round(subtotal * 100) / 100;
    canonDigitalTotal = Math.round(canonDigitalTotal * 100) / 100;

    // Calculate taxes
    const shippingCost = 0; // Could be calculated based on shipping rates
    const taxes = calculateTaxes(
      subtotal,
      canonDigitalTotal,
      shippingCost,
      user.isRecargoEquivalencia
    );

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          subtotal: taxes.subtotal,
          canonDigitalTotal: taxes.canonDigitalTotal,
          ivaTotal: taxes.ivaAmount,
          recargoEquivalenciaTotal: taxes.recargoEquivalenciaAmount,
          shippingCost: taxes.shippingCost,
          total: taxes.total,
          paymentMethod: paymentMethod || null,
          shippingAddressId: shippingAddressId || null,
          billingAddressId: billingAddressId || null,
          notes: notes || null,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: { product: true },
          },
        },
      });

      // Decrement stock for each product
      for (const item of orderItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Clear the cart
      await tx.cart.update({
        where: { id: user.cart!.id },
        data: { items: [] },
      });

      return newOrder;
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    );
  }
}
