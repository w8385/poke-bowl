import { NextResponse } from 'next/server';

import { authEnabled, handlers } from '@/auth';

export async function GET(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!authEnabled || !handlers?.GET) {
    return NextResponse.json({ error: 'Google auth is not configured' }, { status: 503 });
  }

  return handlers.GET(request, context);
}

export async function POST(request: Request, context: { params: Promise<{ nextauth: string[] }> }) {
  if (!authEnabled || !handlers?.POST) {
    return NextResponse.json({ error: 'Google auth is not configured' }, { status: 503 });
  }

  return handlers.POST(request, context);
}
