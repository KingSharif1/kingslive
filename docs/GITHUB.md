# CTROOM ↔ GitHub

## What exists today

| Surface | What it does |
|---------|----------------|
| **CTROOM → GitHub** (new) | Connection status, repo picker, merge open PRs, trigger Vercel deploy hooks |
| Settings → Integrations | Paste a Personal Access Token (overrides / supplements `GITHUB_TOKEN`) |
| Projects (missions) | Link a repo; GitHub tab shows commits / issues / PRs |
| Portfolio editor | Pick a GitHub repo URL for a public project card |

There is **no GitHub OAuth App** yet. “Connected” means a valid PAT works (`GITHUB_TOKEN` env **or** Settings token).

## Connect

1. GitHub → Settings → Developer settings → Personal access tokens  
2. Classic token with `repo` (required to **merge**), or fine-grained with Contents + Pull requests **read/write** on the repos you care about  
3. Either:
   - Set `GITHUB_TOKEN` on Vercel for kingslive, **or**
   - CTROOM → Settings → Integrations → GitHub → paste token → Save  
4. Open **CTROOM → GitHub** — banner should say Connected (@yourlogin)

## Merge & deploy flow

1. Open **GitHub** in the sidebar  
2. Select a repo  
3. Open PRs list → **Merge** (squash / merge / rebase)  
4. If the repo is linked in the Vercel dashboard, push/merge to the production branch usually auto-deploys  
5. Optional manual production redeploy: paste a [Vercel Deploy Hook](https://vercel.com/docs/deployments/deploy-hooks) URL for that repo → Save → **Deploy production**

### Env for server-side hooks (optional)

```bash
# JSON map of owner/repo → deploy hook URL (never commit real hooks)
VERCEL_DEPLOY_HOOKS={"KingSharif1/kingslive":"https://api.vercel.com/v1/integrations/deploy/..."}
```

Local hooks are also stored in browser `localStorage` under `ctroom-deploy-hooks`.

## APIs

- `GET /api/ctroom/github/status` — connected? user? scopes?
- `GET /api/ctroom/github/repos` — list repos
- `GET /api/ctroom/github/repo?repo=owner/name` — commits, PRs, issues
- `POST /api/ctroom/github/merge` — admin session + merge PR
- `POST /api/ctroom/github/deploy` — admin session + fire deploy hook

Merge/deploy require a logged-in admin (`Authorization: Bearer <supabase access token>`).
