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
const ACCENT = '#00ff88'

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

function persistHooks(map: Record<string, string>) {
  localStorage.setItem(HOOKS_KEY, JSON.stringify(map))
}

function ghHeaders(token?: string): HeadersInit {
  return token ? { 'x-github-token': token } : {}
}

async function authHeaders(token?: string): Promise<HeadersInit> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
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
            s ? { ...s, connected: true, user: reposJson.user } : s
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

  const envHasHook = Boolean(selected && status?.deployHookRepos?.includes(selected))
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
      setActionMsg(
        `Merged #${pr.number}${json.sha ? ` → ${String(json.sha).slice(0, 7)}` : ''}`
      )
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
    persistHooks(next)
    setActionMsg(url ? 'Deploy hook saved.' : 'Deploy hook cleared.')
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
        persistHooks(next)
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
      setActionMsg('Production deploy triggered.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  const panel = 'rounded-xl border border-white/8 bg-white/[0.03]'
  const monoLabel = 'font-mono text-[10px] uppercase tracking-[0.2em] text-white/35'

  return (
    <div className="space-y-6 text-white max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className={cn(monoLabel, 'mb-2')}>Integrations</p>
          <h1 className="font-display text-3xl text-white flex items-center gap-2">
            <Github className="w-7 h-7" />
            GitHub
          </h1>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-xs font-mono uppercase tracking-wider text-white/60 hover:text-white"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
          Refresh
        </button>
      </div>

      <div
        className={cn(
          'flex flex-col sm:flex-row sm:items-center gap-4 p-4',
          panel,
          status?.connected && 'border-[#00ff88]/25 bg-[#00ff88]/5'
        )}
      >
        <div
          className={cn(
            'w-11 h-11 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-white/10',
            !status?.connected && 'bg-white/5'
          )}
        >
          {status?.user?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={status.user.avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <Github className="w-5 h-5 text-white/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          {loading && !status ? (
            <div className="flex items-center gap-2 text-sm text-white/45">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking connection…
            </div>
          ) : status?.connected && status.user ? (
            <>
              <div className="text-sm font-medium text-white flex items-center gap-2 flex-wrap">
                {status.user.name || status.user.login}
                <span className="inline-flex items-center gap-1 text-xs" style={{ color: ACCENT }}>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Connected
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-white/35">
                  {status.source === 'settings' ? 'Settings PAT' : 'GITHUB_TOKEN'}
                </span>
              </div>
              <div className="text-xs text-white/40 mt-0.5">@{status.user.login}</div>
            </>
          ) : (
            <>
              <div className="text-sm font-medium text-white flex items-center gap-2">
                Not connected
                <XCircle className="w-3.5 h-3.5 text-orange-400" />
              </div>
              <p className="text-xs text-white/40 mt-1 max-w-xl">
                Add a PAT with repo write access in Settings → Integrations, or set GITHUB_TOKEN.
              </p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {status?.user?.url && (
            <a
              href={status.user.url}
              target="_blank"
              rel="noreferrer"
              className="p-2 rounded-lg border border-white/10 text-white/50 hover:text-white"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {onOpenSettings && (
            <button
              type="button"
              onClick={onOpenSettings}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-medium"
              style={{ background: 'rgba(0,255,136,0.15)', border: '1px solid rgba(0,255,136,0.35)', color: ACCENT }}
            >
              <Settings className="w-3.5 h-3.5" />
              {status?.connected ? 'Manage' : 'Connect'}
            </button>
          )}
        </div>
      </div>

      {(error || actionMsg) && (
        <div
          className={cn(
            'text-sm px-4 py-3 rounded-xl border',
            error
              ? 'border-red-500/30 bg-red-500/10 text-red-300'
              : 'border-[#00ff88]/30 bg-[#00ff88]/10 text-[#00ff88]'
          )}
        >
          {error || actionMsg}
        </div>
      )}

      {!status?.connected && !loading ? (
        <div className={cn(panel, 'p-5 space-y-3 text-sm text-white/45')}>
          <p className="text-white font-medium">Connect GitHub</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              Create a{' '}
              <a
                className="text-white underline underline-offset-2"
                href="https://github.com/settings/tokens"
                target="_blank"
                rel="noreferrer"
              >
                classic PAT
              </a>{' '}
              with <code className="text-xs text-white/70">repo</code> scope.
            </li>
            <li>Paste it in Settings → Integrations, or set GITHUB_TOKEN on Vercel.</li>
            <li>Return here, pick a repo, then merge or deploy.</li>
          </ol>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-4 items-start">
          <div className={cn(panel, 'overflow-hidden')}>
            <div className="p-3 border-b border-white/8">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter repos…"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white outline-none focus:border-white/25 placeholder:text-white/25"
                />
              </div>
            </div>
            <div className="max-h-[70vh] overflow-y-auto divide-y divide-white/6">
              {loading ? (
                <div className="p-8 flex justify-center text-white/40">
                  <Loader2 className="w-5 h-5 animate-spin" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-6 text-sm text-white/40">No repos found.</div>
              ) : (
                filtered.map((repo) => (
                  <button
                    key={repo.id}
                    type="button"
                    onClick={() => void loadDetail(repo.fullName)}
                    className={cn(
                      'w-full text-left px-4 py-3 hover:bg-white/[0.04] transition-colors',
                      selected === repo.fullName && 'bg-white/[0.06]'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{repo.name}</span>
                      {repo.private ? (
                        <Lock className="w-3 h-3 text-white/30" />
                      ) : (
                        <Globe className="w-3 h-3 text-white/30" />
                      )}
                    </div>
                    <div className="text-[11px] text-white/35 mt-0.5 truncate">
                      {repo.fullName}
                      {repo.language ? ` · ${repo.language}` : ''}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className={cn(panel, 'min-h-[320px]')}>
            {!selected ? (
              <div className="h-full p-10 text-center text-sm text-white/40">
                Select a repo to merge PRs or deploy.
              </div>
            ) : detailLoading ? (
              <div className="p-10 flex justify-center">
                <Loader2 className="w-5 h-5 animate-spin text-white/40" />
              </div>
            ) : !detail ? (
              <div className="p-6 text-sm text-white/40">Could not load repo.</div>
            ) : (
              <div className="p-4 sm:p-5 space-y-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-medium text-white">{detail.fullName}</h2>
                    {detail.description && (
                      <p className="text-xs text-white/40 mt-1">{detail.description}</p>
                    )}
                    <p className="text-[11px] text-white/30 mt-2 font-mono">
                      {detail.defaultBranch}
                      {detail.language ? ` · ${detail.language}` : ''}
                    </p>
                  </div>
                  <a
                    href={detail.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-lg border border-white/10 text-white/45 hover:text-white"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <section className="space-y-2 rounded-lg border border-white/8 p-3 bg-white/[0.02]">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn(monoLabel, 'flex items-center gap-1.5')}>
                      <Rocket className="w-3.5 h-3.5" />
                      Deploy
                    </h3>
                    {(envHasHook || hasLocalHook) && (
                      <span className="text-[10px] font-mono" style={{ color: ACCENT }}>
                        {envHasHook ? 'env hook' : 'local hook'}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Link2 className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/30" />
                      <input
                        value={hookDraft}
                        onChange={(e) => setHookDraft(e.target.value)}
                        placeholder="Vercel deploy hook URL"
                        className="w-full pl-8 pr-2 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-white outline-none focus:border-white/25 placeholder:text-white/25"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={saveHook}
                      className="px-3 py-2 rounded-lg border border-white/10 text-xs text-white/50 hover:text-white"
                    >
                      Save
                    </button>
                  </div>
                  <button
                    type="button"
                    disabled={!canDeploy || deploying}
                    onClick={() => void deploy()}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono uppercase tracking-wider font-medium disabled:opacity-40"
                    style={{
                      background: 'rgba(0,255,136,0.15)',
                      border: '1px solid rgba(0,255,136,0.35)',
                      color: ACCENT,
                    }}
                  >
                    {deploying ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Rocket className="w-3.5 h-3.5" />
                    )}
                    Deploy production
                  </button>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn(monoLabel, 'flex items-center gap-1.5')}>
                      <GitPullRequest className="w-3.5 h-3.5" />
                      Open PRs
                    </h3>
                    <label className="text-[11px] text-white/40 flex items-center gap-1.5">
                      Merge as
                      <select
                        value={mergeMethod}
                        onChange={(e) =>
                          setMergeMethod(e.target.value as 'squash' | 'merge' | 'rebase')
                        }
                        className="bg-white/5 border border-white/10 rounded px-1.5 py-1 text-xs text-white"
                      >
                        <option value="squash">squash</option>
                        <option value="merge">merge</option>
                        <option value="rebase">rebase</option>
                      </select>
                    </label>
                  </div>

                  {detail.pullRequests.length === 0 ? (
                    <p className="text-sm text-white/40">No open PRs.</p>
                  ) : (
                    <ul className="space-y-2">
                      {detail.pullRequests.map((pr) => (
                        <li
                          key={pr.number}
                          className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-white/8"
                        >
                          <div className="flex-1 min-w-0">
                            <a
                              href={pr.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-white hover:underline"
                            >
                              #{pr.number} {pr.title}
                            </a>
                            <div className="text-[11px] text-white/35 mt-0.5">
                              @{pr.user}
                              {pr.draft ? ' · draft' : ''}
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={pr.draft || merging === pr.number}
                            onClick={() => void mergePr(pr)}
                            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/5 disabled:opacity-40"
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

                {detail.commits?.length > 0 && (
                  <section className="space-y-2">
                    <h3 className={monoLabel}>Recent commits</h3>
                    <ul className="space-y-1.5">
                      {detail.commits.slice(0, 8).map((c) => (
                        <li key={c.sha} className="text-xs text-white/40 flex gap-2">
                          <a
                            href={c.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-mono text-white/70 hover:underline shrink-0"
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
