import { NextResponse } from 'next/server';
import { hashIp } from '@/lib/rate-limit';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const ip = headersList.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

  return NextResponse.json({
    success: true,
    data: {
      ipHash: hashIp(ip),
    },
  });
}
