import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

interface CartItem {
  productId: string;
  quantity: number;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId is required' },
        { status: 400 }
      );
    }

    const where = userId
      ? { userId }
      : { sessionId: sessionId! };

    const cart = await prisma.cart.findFirst({ where });

    if (!cart) {
      return NextResponse.json({ id: null, items: [], products: [] });
    }

    const items = cart.items as unknown as CartItem[];

    // Fetch full product details for cart items
    const productIds = items.map((item) => item.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      include: {
        category: true,
        manufacturer: true,
      },
    });

    const enrichedItems = items
      .map((item) => {
        const product = products.find((p) => p.id === item.productId);
        if (!product) return null;
        return {
          productId: item.productId,
          quantity: item.quantity,
          product,
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      items: enrichedItems,
      updatedAt: cart.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, productId, quantity = 1 } = body;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId is required' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    // Verify product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product || !product.isActive) {
      return NextResponse.json(
        { error: 'Product not found or inactive' },
        { status: 404 }
      );
    }

    if (quantity < 1) {
      return NextResponse.json(
        { error: 'Quantity must be at least 1' },
        { status: 400 }
      );
    }

    const where = userId
      ? { userId }
      : { sessionId: sessionId! };

    let cart = await prisma.cart.findFirst({ where });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId: userId || null,
          sessionId: sessionId || null,
          items: [{ productId, quantity }],
        },
      });
    } else {
      const items = cart.items as unknown as CartItem[];
      const existingIndex = items.findIndex((i) => i.productId === productId);

      if (existingIndex >= 0) {
        items[existingIndex].quantity += quantity;
      } else {
        items.push({ productId, quantity });
      }

      cart = await prisma.cart.update({
        where: { id: cart.id },
        data: { items: items as any },
      });
    }

    return NextResponse.json(cart);
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add item to cart' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, sessionId, productId, quantity } = body;

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId is required' },
        { status: 400 }
      );
    }

    if (!productId || quantity === undefined) {
      return NextResponse.json(
        { error: 'productId and quantity are required' },
        { status: 400 }
      );
    }

    const where = userId
      ? { userId }
      : { sessionId: sessionId! };

    const cart = await prisma.cart.findFirst({ where });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    const items = cart.items as unknown as CartItem[];
    const existingIndex = items.findIndex((i) => i.productId === productId);

    if (existingIndex < 0) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    if (quantity <= 0) {
      items.splice(existingIndex, 1);
    } else {
      items[existingIndex].quantity = quantity;
    }

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { items: items as any },
    });

    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error('Error updating cart:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');
    const productId = searchParams.get('productId');

    if (!userId && !sessionId) {
      return NextResponse.json(
        { error: 'userId or sessionId is required' },
        { status: 400 }
      );
    }

    if (!productId) {
      return NextResponse.json(
        { error: 'productId is required' },
        { status: 400 }
      );
    }

    const where = userId
      ? { userId }
      : { sessionId: sessionId! };

    const cart = await prisma.cart.findFirst({ where });

    if (!cart) {
      return NextResponse.json(
        { error: 'Cart not found' },
        { status: 404 }
      );
    }

    const items = cart.items as unknown as CartItem[];
    const filteredItems = items.filter((i) => i.productId !== productId);

    if (filteredItems.length === items.length) {
      return NextResponse.json(
        { error: 'Item not found in cart' },
        { status: 404 }
      );
    }

    const updatedCart = await prisma.cart.update({
      where: { id: cart.id },
      data: { items: filteredItems as any },
    });

    return NextResponse.json(updatedCart);
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
