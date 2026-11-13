import { NextResponse } from 'next/server';
import { syncSocialMetricsForClient } from '@/lib/composio';

export async function POST(req: Request) {
  try {
    const { clientId, period } = await req.json();

    if (!clientId) {
      return NextResponse.json({ success: false, error: 'clientId es requerido' }, { status: 400 });
    }

    const report = await syncSocialMetricsForClient(clientId, period);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (error: any) {
    console.error('Error in social sync:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
