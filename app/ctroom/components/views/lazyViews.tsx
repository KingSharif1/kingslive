'use client'

import dynamic from 'next/dynamic'

function ViewLoading() {
  return (
    <div className="flex h-full min-h-[40vh] items-center justify-center text-[11px] font-mono uppercase tracking-[0.28em] text-muted-foreground">
      Loading…
    </div>
  )
}

export const DashboardView = dynamic(
  () => import('./DashboardView').then((m) => ({ default: m.DashboardView })),
  { ssr: false, loading: ViewLoading }
)

export const ChatView = dynamic(
  () => import('./ChatView').then((m) => ({ default: m.ChatView })),
  { ssr: false, loading: ViewLoading }
)

export const IdeasView = dynamic(
  () => import('./IdeasView').then((m) => ({ default: m.IdeasView })),
  { ssr: false, loading: ViewLoading }
)

export const PlannerView = dynamic(
  () => import('./PlannerView').then((m) => ({ default: m.PlannerView })),
  { ssr: false, loading: ViewLoading }
)

export const MissionsView = dynamic(
  () => import('./MissionsView').then((m) => ({ default: m.MissionsView })),
  { ssr: false, loading: ViewLoading }
)

export const BlogView = dynamic(
  () => import('./BlogView').then((m) => ({ default: m.BlogView })),
  { ssr: false, loading: ViewLoading }
)

export const PortfolioProjectsView = dynamic(
  () => import('./PortfolioProjectsView').then((m) => ({ default: m.PortfolioProjectsView })),
  { ssr: false, loading: ViewLoading }
)

export const GitHubView = dynamic(
  () => import('./GitHubView').then((m) => ({ default: m.GitHubView })),
  { ssr: false, loading: ViewLoading }
)

export const SettingsView = dynamic(
  () => import('./SettingsView').then((m) => ({ default: m.SettingsView })),
  { ssr: false, loading: ViewLoading }
)

export const VaultView = dynamic(
  () => import('./VaultView').then((m) => ({ default: m.VaultView })),
  { ssr: false, loading: ViewLoading }
)

export const DreamboardView = dynamic(() => import('./DreamboardView'), {
  ssr: false,
  loading: ViewLoading,
})
