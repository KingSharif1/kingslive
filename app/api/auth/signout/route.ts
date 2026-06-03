import { NextResponse } from 'next/server';

/** @deprecated Use GET /api/auth/signout-redirect */
export async function POST() {
  return NextResponse.redirect(new URL('/api/auth/signout-redirect', process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'), {
    status: 307,
  });
}
