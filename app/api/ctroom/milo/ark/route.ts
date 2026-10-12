import { NextRequest, NextResponse } from 'next/server';
import { getMiloAdmin } from '@/lib/milo/auth';

// ARK bridge — read files from the KingSharif1/ARK repo via GitHub API.
// GET ?path=life/finance/status.md — returns the file content.
// This is how Milo pulls live context (finance, projects, memory) from ARK.
const ARK_REPO = 'KingSharif1/ARK';

export async function GET(req: NextRequest) {
  const { error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const path = new URL(req.url).searchParams.get('path');
  if (!path || path.includes('..')) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
  }
  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: 'GitHub not connected' }, { status: 500 });

  const res = await fetch(
    `https://api.github.com/repos/${ARK_REPO}/contents/${encodeURIComponent(path)}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github.raw' } },
  );
  if (!res.ok) {
    return NextResponse.json({ error: `ARK read failed: ${res.status}` }, { status: 502 });
  }
  const content = await res.text();
  return NextResponse.json({ path, content: content.slice(0, 20000) });
}
