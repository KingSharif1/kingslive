import { NextRequest, NextResponse } from 'next/server';

/** Fetch latest price via Yahoo Finance chart API (no key required). */
export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get('symbol')?.toUpperCase();
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 });
  }

  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'KingsLive-Vault/1.0' }, next: { revalidate: 300 } },
    );
    if (!res.ok) {
      return NextResponse.json({ error: 'Quote unavailable' }, { status: 502 });
    }
    const json = await res.json();
    const price = json?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price == null) {
      return NextResponse.json({ error: 'No price data' }, { status: 404 });
    }
    return NextResponse.json({ symbol, price: Number(price) });
  } catch {
    return NextResponse.json({ error: 'Quote fetch failed' }, { status: 500 });
  }
}
