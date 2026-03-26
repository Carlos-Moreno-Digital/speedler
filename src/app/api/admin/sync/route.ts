import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { runSupplierSync } from '@/lib/supplier-sync';

export async function GET() {
  try {
    const suppliers = await prisma.supplierSync.findMany({
      include: {
        logs: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(suppliers);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.action === 'sync') {
      const result = await runSupplierSync(body.supplierSyncId);
      return NextResponse.json(result);
    }

    // Create new supplier sync config
    const supplier = await prisma.supplierSync.create({
      data: {
        supplierName: body.supplierName,
        syncType: body.syncType,
        endpoint: body.endpoint,
        credentials: body.credentials || null,
        syncIntervalMinutes: body.syncIntervalMinutes || 360,
        fieldMapping: body.fieldMapping || {},
        isActive: body.isActive ?? true,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    const supplier = await prisma.supplierSync.update({
      where: { id: body.id },
      data: {
        supplierName: body.supplierName,
        syncType: body.syncType,
        endpoint: body.endpoint,
        credentials: body.credentials,
        syncIntervalMinutes: body.syncIntervalMinutes,
        fieldMapping: body.fieldMapping,
        isActive: body.isActive,
      },
    });

    return NextResponse.json(supplier);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    await prisma.supplierSync.delete({ where: { id } });

    return NextResponse.json({ message: 'Proveedor eliminado' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
