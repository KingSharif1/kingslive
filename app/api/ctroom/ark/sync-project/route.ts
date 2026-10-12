import { NextRequest, NextResponse } from 'next/server';
import { getMiloAdmin } from '@/lib/milo/auth';

const ARK_REPO = 'KingSharif1/ARK';

// Sync a CTROOM mission to ARK.
// Writes ARK/projects/<slug>/ctroom-sync.md via GitHub API (dedicated file,
// never touches hand-maintained status.md). Called on mission save/update.
export async function POST(req: NextRequest) {
  const { supabase, error } = await getMiloAdmin(req);
  if (error) return NextResponse.json({ error }, { status: error === 'Forbidden' ? 403 : 401 });

  const { missionId } = await req.json();
  if (!missionId) return NextResponse.json({ error: 'Missing missionId' }, { status: 400 });

  const { data: mission } = await supabase.from('missions').select('*').eq('id', missionId).single();
  if (!mission) return NextResponse.json({ error: 'Mission not found' }, { status: 404 });

  const token = process.env.GITHUB_TOKEN;
  if (!token) return NextResponse.json({ error: 'GitHub not connected' }, { status: 500 });

  const slug = (mission.repo_url?.split('/').pop() || mission.name)
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const path = `projects/${slug}/ctroom-sync.md`;
  const body = `# ${mission.name} — CTROOM sync

> Synced from CTROOM ${new Date().toISOString()}. This file is machine-managed; hand notes go in status.md.

- **Status:** ${mission.status}
- **Progress:** ${mission.progress || 0}%
- **Priority:** ${mission.priority || '-'}
- **Description:** ${mission.description || '-'}
- **Repo:** ${mission.repo_url || '-'}
- **Target date:** ${mission.target_date || '-'}
- **Notes:** ${mission.notes || '-'}
`;

  // Get current sha (if file exists) for update
  const getRes = await fetch(
    `https://api.github.com/repos/${ARK_REPO}/contents/${path}`,
    { headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' } },
  );
  let sha: string | undefined;
  if (getRes.ok) {
    const existing = await getRes.json();
    sha = existing.sha;
  }

  const putRes = await fetch(
    `https://api.github.com/repos/${ARK_REPO}/contents/${path}`,
    {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/vnd.github+json' },
      body: JSON.stringify({
        message: `ctroom-sync: ${slug} status ${mission.status} ${mission.progress || 0}%`,
        content: Buffer.from(body).toString('base64'),
        ...(sha ? { sha } : {}),
      }),
    },
  );
  if (!putRes.ok) {
    return NextResponse.json({ error: `GitHub write failed: ${putRes.status}` }, { status: 502 });
  }

  await supabase.from('milo_actions').insert({
    action: 'ark.sync_project',
    target: slug,
    result: `Synced ${mission.name} to ARK`,
  });
  return NextResponse.json({ ok: true, path });
}
