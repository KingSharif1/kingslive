'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Github,
  RefreshCw,
  ExternalLink,
  GitMerge,
  Rocket,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
  Globe,
  GitPullRequest,
  Settings,
  Link2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'

const HOOKS_KEY = 'ctroom-deploy-hooks'

interface GithubUser {
  login: string
  name: string | null
  avatar: string
  url: string
}

interface Repo {
  id: number
  name: string
  fullName: string
  description: string | null
  url: string
  private: boolean
  language: string | null
  stars: number
  updatedAt: string
  defaultBranch: string
}

interface PullRequest {
  number: number
  title: string
  url: string
  createdAt: string
  draft: boolean
  user: string
  labels: { name: string; color: string }[]
}

interface RepoDetail {
  fullName: string
  description: string | null
  defaultBranch: string
  htmlUrl: string
  private: boolean
  language: string | null
  pushedAt: string
  pullRequests: PullRequest[]
  commits: { sha: string; message: string; author: string; date: string; url: string }[]
}

interface StatusPayload {
  connected: boolean
  source: 'env' | 'settings' | null
  user: GithubUser | null
  scopes: string[] | null
  deployHookRepos?: string[]
  error?: string
  hint?: string
}

function loadHooks(): Record<string, string> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(HOOKS_KEY) || '{}') as Record<string, string>
  } catch {
    return {}
  }
}

function saveHooks(map: Record<string, string>) {
  localStorage.setItem(HOOKS_KEY, JSON.stringify(map))
}

function ghHeaders(token?: string): HeadersInit {
  return token ? { 'x-github-token': token } : {}
}

async function authHeaders(token?: string): Promise<HeadersInit> {
  const { data: { session } } = await supabase.auth.getSession()
  return {
    ...ghHeaders(token),
    ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
    'Content-Type': 'application/json',
  }
}

interface Props {
  githubToken?: string
  onOpenSettings?: () => void
}

export function GitHubView({ githubToken, onOpenSettings }: Props) {
  const [status, setStatus] = useState<StatusPayload | null>(null)
  const [repos, setRepos] = useState<Repo[]>([])
  const [selected, setSelected] = useState<string | null>(null)
  const [detail, setDetail] = useState<RepoDetail | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [actionMsg, setActionMsg] = useState<string | null>(null)
  const [merging, setMerging] = useState<number | null>(null)
  const [deploying, setDeploying] = useState(false)
  const [hooks, setHooks] = useState<Record<string, string>>({})
  const [hookDraft, setHookDraft] = useState('')
  const [mergeMethod, setMergeMethod] = useState<'squash' | 'merge' | 'rebase'>('squash')

  useEffect(() => {
    setHooks(loadHooks())
  }, [])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const headers = ghHeaders(githubToken)
      const [statusRes, reposRes] = await Promise.all([
        fetch('/api/ctroom/github/status', { headers }),
        fetch('/api/ctroom/github/repos', { headers }),
      ])
      const statusJson = (await statusRes.json()) as StatusPayload
      setStatus(statusJson)

      if (reposRes.ok) {
        const reposJson = await reposRes.json()
        setRepos(reposJson.repos || [])
        if (!statusJson.user && reposJson.user) {
          setStatus((s) =>
            s
              ? {
                  ...s,
                  connected: true,
                  user: reposJson.user,
                }
              : s
          )
        }
      } else if (!statusJson.connected) {
        setRepos([])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load GitHub')
    } finally {
      setLoading(false)
    }
  }, [githubToken])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const loadDetail = useCallback(
    async (fullName: string) => {
      setSelected(fullName)
      setDetailLoading(true)
      setActionMsg(null)
      setError(null)
      setHookDraft(loadHooks()[fullName] || '')
      try {
        const res = await fetch(
          `/api/ctroom/github/repo?repo=${encodeURIComponent(fullName)}`,
          { headers: ghHeaders(githubToken) }
        )
        const json = await res.json()
        if (!res.ok) throw new Error(json.error || 'Failed to load repo')
        setDetail(json as RepoDetail)
      } catch (err) {
        setDetail(null)
        setError(err instanceof Error ? err.message : 'Failed to load repo')
      } finally {
        setDetailLoading(false)
      }
    },
    [githubToken]
  )

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return repos
    return repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        (r.description || '').toLowerCase().includes(q) ||
        (r.language || '').toLowerCase().includes(q)
    )
  }, [repos, query])

  const envHasHook = Boolean(
    selected && status?.deployHookRepos?.includes(selected)
  )
  const hasLocalHook = Boolean(selected && hooks[selected])
  const canDeploy = envHasHook || hasLocalHook || Boolean(hookDraft.trim())

  const mergePr = async (pr: PullRequest) => {
    if (!selected) return
    setMerging(pr.number)
    setActionMsg(null)
    setError(null)
    try {
      const headers = await authHeaders(githubToken)
      const res = await fetch('/api/ctroom/github/merge', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          repo: selected,
          pullNumber: pr.number,
          mergeMethod,
          commitTitle: pr.title,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Merge failed')
      setActionMsg(`Merged PR #${pr.number}${json.sha ? ` → ${String(json.sha).slice(0, 7)}` : ''}. If Vercel is linked to this repo, production deploy should start automatically.`)
      await loadDetail(selected)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Merge failed')
    } finally {
      setMerging(null)
    }
  }

  const saveHook = () => {
    if (!selected) return
    const next = { ...hooks }
    const url = hookDraft.trim()
    if (url) next[selected] = url
    else delete next[selected]
    setHooks(next)
    saveHooks(next)
    setActionMsg(url ? 'Deploy hook saved locally for this repo.' : 'Deploy hook cleared.')
  }

  const deploy = async () => {
    if (!selected) return
    setDeploying(true)
    setActionMsg(null)
    setError(null)
    try {
      if (hookDraft.trim() && hookDraft.trim() !== hooks[selected]) {
        const next = { ...hooks, [selected]: hookDraft.trim() }
        setHooks(next)
        saveHooks(next)
      }
      const headers = await authHeaders(githubToken)
      const res = await fetch('/api/ctroom/github/deploy', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          repo: selected,
          hookUrl: hooks[selected] || hookDraft.trim() || undefined,
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Deploy failed')
      setActionMsg('Production deploy triggered via Vercel Deploy Hook.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-foreground flex items-center gap-2">
            <Github className="w-6 h-6" />
            GitHub
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Connection status, pick a repo, merge PRs, and trigger Vercel deploys.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Connection banner */}
      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border',
          status?.connected
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-card border-border'
        )}
      >
        <div
          className={cn(
            'w-12 h-12 rounded-full flex items-center justify-center overflow-hidden flex-shrink-0',
            status?.connected ? '' : 'bg-secondary'
          )}
        >
          {status?.user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={status.user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <Github className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {loading && !status ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking connection…
            </div>
          ) : status?.connected && status.user ? (
            <>
              <div className="text-sm font-medium text-foreground flex items-center gap-2 flex-wrap">
                {status.user.name || status.user.login}
                <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-mono">
                  via {status.source === 'settings' ? 'Settings PAT' : 'GITHUB_TOKEN env'}
                </span>
              </div>
              <div className="text-xs text-muted-foreground mt-0.5">
                @{status.user.login}
                {status.scopes?.length
                  ? ` · scopes: ${status.scopes.slice(0, 6).join(', ')}${status.scopes.length > 6 ? '…' : ''}`
                  : ' · fine-grained or env token'}
              </div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-foreground flex items-center gap-2">
                Not connected
                <XCircle className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <p className="text-xs text-muted-foreground mt-1 max-w-xl">
                {status?.hint ||
                  'Add a GitHub Personal Access Token with repo write access so CTROOM can list private repos, merge PRs, and sync projects.'}
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {status?.user?.url && (
            <a
              href={status.user.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#00ff88', color: '#000' }}
            >
              <Settings className="w-3.5 h-3.5" />
              {status?.connected ? 'Manage token' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {(error || actionMsg) && (
        <div
          className={cn(
            'text-sm px-4 py-3 rounded-lg border',
            error
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          )}
        >
          {error || actionMsg}
        </div>
      )}

      {!status?.connected && !loading ? (
        <div className="rounded-xl border border-border p-6 space-y-3 text-sm text-muted-foreground">
          <p className="text-foreground font-medium">How to connect</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Create a{' '}
              <a
                className="text-foreground underline underline-offset-2"
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
              >
                classic PAT
              </a>{' '}
              with <code className="text-xs">repo</code> scope (needed to merge), or a fine-grained
              token with Contents + Pull requests read/write on your repos.
            </li>
            <li>
              Either set <code className="text-xs">GITHUB_TOKEN</code> on Vercel, or paste the token
              in Settings → Integrations and Save.
            </li>
            <li>Return here — status should show Connected, then pick a repo to merge / deploy.</li>
          </ol>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 items-start">
          {/* Repo list */}
          <div className="rounded-xl border border-border overflow-hidden bg-card/40">
            <div className="p-3 border-b border-border">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter repos…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-secondary/50 border border-border text-sm outline-none focus:border-white/20"
                />
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-border/60">
              {loading ? (
                <div className="p-8 flex justify-center text-muted-foreground">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-sm text-muted-foreground">No repos found.</div>
              ) : (
                filtered.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => void loadDetail(repo.fullName)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-secondary/40 transition-colors',
                      selected === repo.fullName && 'bg-secondary/60'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {repo.name}
                      </span>
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      ) : (
                        <Globe className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                      {repo.fullName}
                      {repo.language ? ` · ${repo.language}` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Detail panel */}
          <div className="rounded-xl border border-border bg-card/40 min-h-[320px]">
            {!selected ? (
              <div className="h-full p-10 text-center text-sm text-muted-foreground">
                Select a repo to see open PRs, merge, and deploy.
              </div>
            ) : detailLoading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : !detail ? (
              <div className="p-6 text-sm text-muted-foreground">Could not load repo detail.</div>
            ) : (
              <div className="p-4 sm:p-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-foreground">{detail.fullName}</h2>
                    {detail.description && (
                      <p className="text-xs text-muted-foreground mt-1">{detail.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground mt-2 font-mono">
                      default: {detail.defaultBranch}
                      {detail.language ? ` · ${detail.language}` : ''}
                    </p>
                  </div>
                  <a
                    href={detail.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-border text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                {/* Deploy */}
                <section className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5" />
                      Deploy
                    </h3>
                    {(envHasHook || hasLocalHook) && (
                      <span className="text-[10px] text-emerald-400 font-mono">
                        {envHasHook ? 'env hook' : 'local hook'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Merging to <code>{detail.defaultBranch}</code> usually auto-deploys if the repo
                    is linked in Vercel. Use a Deploy Hook for a manual production redeploy.
                  </p>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={hookDraft}
                        onChange={(e) => setHookDraft(e.target.value)}
                        placeholder="https://api.vercel.com/v1/integrations/deploy/…"
                        className="w-full pl-8 pr-2 py-2 rounded-lg bg-secondary/50 border border-border text-xs outline-none focus:border-white/20"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={saveHook}
                      className="px-3 py-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!canDeploy || deploying}
                    onClick={() => void deploy()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                    style={{ background: '#00ff88', color: '#000' }}
                  >
                    {deploying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Rocket className="w-3.5 h-3.5" />
                    )}
                    Deploy production
                  </button>
                </section>

                {/* PRs */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <GitPullRequest className="w-3.5 h-3.5" />
                      Open pull requests
                    </h3>
                    <label className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      Merge as
                      <select
                        value={mergeMethod}
                        onChange={(e) =>
                          setMergeMethod(e.target.value as 'squash' | 'merge' | 'rebase')
                        }
                        className="bg-secondary border border-border rounded px-1.5 py-1 text-xs text-foreground"
                      >
                        <option value="squash">squash</option>
                        <option value="merge">merge</option>
                        <option value="rebase">rebase</option>
                      </select>
                    </label>
                  </div>

                  {detail.pullRequests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No open PRs.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.pullRequests.map((pr) => (
                        <li
                          key={pr.number}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-border"
                        >
                          <div className="flex-1 min-w-0">
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-foreground hover:underline"
                            >
                              #{pr.number} {pr.title}
                            </a>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              @{pr.user}
                              {pr.draft ? ' · draft' : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={pr.draft || merging === pr.number}
                            onClick={() => void mergePr(pr)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-secondary disabled:opacity-40"
                          >
                            {merging === pr.number ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <GitMerge className="w-3.5 h-3.5" />
                            )}
                            Merge
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>

                {/* Recent commits */}
                {detail.commits?.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Recent commits
                    </h3>
                    <ul className="space-y-1.5">
                      {detail.commits.slice(0, 8).map((c) => (
                        <li key={c.sha} className="text-xs text-muted-foreground flex gap-2">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-foreground/80 hover:underline shrink-0"
                          >
                            {c.sha}
                          </a>
                          <span className="truncate">{c.message}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
