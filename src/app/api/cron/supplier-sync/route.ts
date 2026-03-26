import { NextRequest, NextResponse } from 'next/server';
import { runAllActiveSupplierSyncs } from '@/lib/supplier-sync';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const results = await runAllActiveSupplierSyncs();

    return NextResponse.json({
      message: 'Sync completed',
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Allow GET for Vercel Cron
  return POST(request);
}
