import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateTaxes } from '@/lib/recargo-equivalencia';
import { generateOrderNumber } from '@/lib/utils';

interface CartItem {
  productId: string;
  quantity: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      sessionId,
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

    // Fetch user with cart and check recargo equivalencia status
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

    // Try user cart first, fall back to session cart
    let cart = user.cart;
    if (!cart && sessionId) {
      cart = await prisma.cart.findFirst({
        where: { sessionId },
      });
    }

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 400 }
      );
    }

    const cartItems = cart.items as unknown as CartItem[];

    if (cartItems.length === 0) {
      return NextResponse.json(
        { error: 'Cart is empty' },
        { status: 400 }
      );
    }

    // Validate shipping address if provided
    if (shippingAddressId) {
      const shippingAddress = await prisma.address.findUnique({
        where: { id: shippingAddressId },
      });
      if (!shippingAddress || shippingAddress.userId !== userId) {
        return NextResponse.json(
          { error: 'Invalid shipping address' },
          { status: 400 }
        );
      }
    }

    // Validate billing address if provided
    if (billingAddressId) {
      const billingAddress = await prisma.address.findUnique({
        where: { id: billingAddressId },
      });
      if (!billingAddress || billingAddress.userId !== userId) {
        return NextResponse.json(
          { error: 'Invalid billing address' },
          { status: 400 }
        );
      }
    }

    // Fetch all products in the cart
    const productIds = cartItems.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
    });

    // Validate all products exist, are active, and have sufficient stock
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
            error: `Insufficient stock for "${product.name}". Available: ${product.stock}, requested: ${cartItem.quantity}`,
          },
          { status: 400 }
        );
      }

      const unitPrice = Number(product.salePrice);
      const canonDigital = Number(product.canonDigital);
      const totalPrice = Math.round(unitPrice * cartItem.quantity * 100) / 100;
      const itemCanonDigital = Math.round(canonDigital * cartItem.quantity * 100) / 100;

      subtotal += totalPrice;
      canonDigitalTotal += itemCanonDigital;

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

    // Calculate shipping cost based on shipping rates
    let shippingCost = 0;
    const applicableRate = await prisma.shippingRate.findFirst({
      where: {
        isActive: true,
        OR: [
          {
            minPrice: { lte: subtotal },
            maxPrice: { gte: subtotal },
          },
          {
            minPrice: { lte: subtotal },
            maxPrice: null,
          },
          {
            minPrice: null,
            maxPrice: { gte: subtotal },
          },
        ],
      },
      orderBy: { cost: 'asc' },
    });

    if (applicableRate) {
      shippingCost = Number(applicableRate.cost);
    }

    // Calculate taxes including canon digital and recargo equivalencia
    const taxes = calculateTaxes(
      subtotal,
      canonDigitalTotal,
      shippingCost,
      user.isRecargoEquivalencia
    );

    // Create order in a transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create the order with items
      const newOrder = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: 'PENDING',
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
        where: { id: cart.id },
        data: { items: [] },
      });

      // If the cart was session-based and user has no cart, link it
      if (!user.cart && cart.sessionId) {
        await tx.cart.update({
          where: { id: cart.id },
          data: { userId, sessionId: null },
        });
      }

      return newOrder;
    });

    return NextResponse.json(
      {
        order,
        taxBreakdown: {
          subtotal: taxes.subtotal,
          canonDigitalTotal: taxes.canonDigitalTotal,
          ivaRate: taxes.ivaRate,
          ivaAmount: taxes.ivaAmount,
          recargoEquivalenciaRate: taxes.recargoEquivalenciaRate,
          recargoEquivalenciaAmount: taxes.recargoEquivalenciaAmount,
          shippingCost: taxes.shippingCost,
          total: taxes.total,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing checkout:', error);
    return NextResponse.json(
      { error: 'Failed to process checkout' },
      { status: 500 }
    );
  }
}
