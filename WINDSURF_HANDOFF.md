# 🔄 PROJECT HANDOFF: Claude Code → Windsurf

## SESSION SUMMARY (2026-05-22 / 23)

---

## WHAT WAS DONE THIS SESSION

### 1. ✅ Supabase Project Clarified
- **Active project**: `fcdzbnuyzdzqkuizvexk` — "kinglive cms" (us-east-2, ACTIVE_HEALTHY)
- **Other projects on account**:
  - `ocjqsnocuqyumoltighi` — "CareFlow-Transit" (different project, don't touch)
  - `btpjzsyqogtnqksfhpth` — "budget" (INACTIVE/paused)
- **Decided to stay on Supabase** (not migrate to Neon). Reason: Neon has no built-in auth and the auth system was just rebuilt.

---

### 2. ✅ Critical Bug Fixed: Wrong SUPABASE_SERVICE_ROLE_KEY
The old `.env.local` had a service role key for `CareFlow-Transit` (`ocjqsn...`) instead of `kinglive cms` (`fcdzbn...`). This was breaking `/api/auth/verify-admin` completely — it was querying the wrong database.

**Fixed**: Updated `SUPABASE_SERVICE_ROLE_KEY` to the correct key for `fcdzbnuyzdzqkuizvexk`.

---

### 3. ✅ Env Files Consolidated
- **Deleted** `.env` (was duplicate + had stale/placeholder values)
- **Kept** `.env.local` as the single source of truth
- All keys merged into `.env.local` with sections:
  - Supabase (URL, anon key, service role key)
  - Auth/CTRoom
  - AI APIs (OpenAI, Anthropic, Gemini, HuggingFace)
  - Google Search, GitHub, Sanity CMS
  - Email (Brevo)
  - Finance (Plaid, Teller)
  - Google Sheets

---

### 4. ✅ 5-Hour Inactivity Auto-Logout Implemented
**How it works (sliding window):**
1. User logs in via magic link → `auth/callback/route.ts` sets `ctroom_last_active` cookie (5h maxAge)
2. Every request to `/ctroom` → middleware refreshes the cookie (resets 5h window)
3. If no `/ctroom` visit for 5+ hours → cookie expires → next visit, middleware redirects to `/api/auth/signout-redirect`
4. `/api/auth/signout-redirect` signs out the Supabase session and redirects to `/ctroom` (shows login)

**Files modified:**
- `middleware.ts` — changed `LAST_ACTIVE_MAX_AGE` from 2 days → 5 hours, added inactivity redirect logic
- `app/auth/callback/route.ts` — sets `ctroom_last_active` cookie on login (5h), ensures first arrival after login doesn't trigger false inactivity logout
- `app/api/auth/signout-redirect/route.ts` — **NEW FILE** — handles forced sign-out on inactivity, redirects to `/ctroom`

---

### 5. ✅ Hydration Error Fixed
**Root cause**: Server rendered `CtroomDashboard` with `auth='checking'` (spinner), but client was detecting an existing Supabase session and jumping to `auth='in'` (dashboard) before hydration completed. Mismatch.

**Fix applied to `CtroomDashboard.tsx`**:
- Added `const [mounted, setMounted] = useState(false)`
- `setMounted(true)` called in `useEffect` (client-only)
- Auth guard changed to `if (!mounted || auth === 'checking')` → always returns spinner until client-side mount
- Removed `typeof window !== 'undefined'` from useState initializers (was also causing hydration issues with localStorage) — localStorage reads now happen inside the mount `useEffect`
- Also changed `import UsageModal` to named import `{ UsageModal }` (was using default, both exist but named is cleaner)

**`app/ctroom/page.tsx`** — reverted to simple server component (no `'use client'`, no `dynamic`):
```tsx
import { CtroomDashboard } from './components/CtroomDashboard';
export default function CtroomPage() {
  return <CtroomDashboard />;
}
```

---

### 6. ✅ Stale .next Cache Cleared
Deleted `.next` folder to resolve `Cannot read properties of undefined (reading 'call')` webpack chunk error that was caused by stale build artifacts after `package-lock.json` deletion + npm reinstall from previous session.

---

## CURRENT FILE STATE

| File | Status | Notes |
|------|--------|-------|
| `app/ctroom/page.tsx` | ✅ Clean | Server component, simple import |
| `app/ctroom/components/CtroomDashboard.tsx` | ✅ Fixed | mounted state, localStorage in useEffect |
| `app/ctroom/components/LoginScreen.tsx` | ✅ Exists | Magic link login UI |
| `app/ctroom/services/authService.ts` | ✅ Working | handleLogin, signOut, getCurrentUser |
| `app/api/auth/verify-admin/route.ts` | ✅ Fixed | Now uses correct service role key |
| `app/api/auth/signout/route.ts` | ✅ Working | POST endpoint, clears cookies |
| `app/api/auth/signout-redirect/route.ts` | ✅ NEW | GET endpoint for inactivity logout |
| `app/auth/callback/route.ts` | ✅ Fixed | Sets ctroom_last_active (5h) on login |
| `middleware.ts` | ✅ Updated | 5h inactivity, sliding window |
| `.env.local` | ✅ Consolidated | Single env file, correct service role key |
| `.env` | ✅ Deleted | No longer exists |

---

## DATABASE STATE (Supabase: fcdzbnuyzdzqkuizvexk)

| Table | RLS | Rows | Notes |
|-------|-----|------|-------|
| `admin_users` | ✅ ON | 2 | sharifahmed.dev@gmail.com + kingsharif314@gmail.com |
| `missions` | ❌ OFF | 0 | **SECURITY ISSUE — needs RLS** |
| `systems` | ❌ OFF | 0 | **SECURITY ISSUE — needs RLS** |
| `vault_transactions` | ✅ ON | 2,249 | Live financial data |
| `tasks` | ✅ ON | 0 | |
| `ideas` | ✅ ON | 0 | |
| All other tables | ✅ ON | 0 | |

### 🔴 PENDING: Enable RLS on missions + systems
Run this in Supabase SQL Editor:
```sql
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated" ON public.missions
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated" ON public.systems
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

---

## KNOWN REMAINING ISSUES / TODO

### Priority 1 — Test Auth End to End
- Magic link flow: enter email → check inbox → click link → should land on dashboard
- Verify admin check works (correct service role key now in place)
- Test 5h inactivity: manually expire `ctroom_last_active` cookie and confirm redirect to login

### Priority 2 — Fix RLS (SQL above)

### Priority 3 — Dependency Cleanup
Remove unused packages (verified not imported anywhere):
```bash
npm uninstall @huggingface/inference teller-connect-react recharts \
  html2canvas react-rnd axios styled-components \
  @tanstack/react-query embla-carousel-react \
  react-markdown cmdk date-fns react-day-picker
```
30+ Radix UI packages installed, only ~8 used — prune unused ones.

### Priority 4 — Replace googleapis (50MB)
`app/api/chat/route.ts:2` — replace `import { google } from 'googleapis'` with direct fetch:
```typescript
const res = await fetch(`https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${query}`);
```

### Priority 5 — 6 Low-Priority npm Vulns
postcss, undici, vite — all dev-only. Do NOT run `npm audit fix --force` (downgrades Next.js).

---

## HOW TO RUN
```bash
npm run dev   # runs on localhost:3000
```
Dev server: Next.js 15.5.18
Node: check .nvmrc if issues

---

## AUTH FLOW OVERVIEW
1. User visits `/ctroom`
2. `CtroomDashboard` mounts → `useEffect` checks `supabase.auth.getUser()`
3. If no session → `setAuth('out')` → shows `LoginScreen`
4. User enters email → `AuthService.handleLogin()` → checks `/api/auth/verify-admin` first → sends magic link via Supabase
5. User clicks link → hits `/auth/callback?code=...` → exchanges code for session → sets `ctroom_last_active` cookie → redirects to `/ctroom`
6. Middleware refreshes `ctroom_last_active` on every `/ctroom` request
7. If 5h inactivity → redirect to `/api/auth/signout-redirect` → sign out → back to login

---

**Project path**: `C:\Users\kings\wrkspace\kingslive`
**Supabase project**: `fcdzbnuyzdzqkuizvexk` (kinglive cms)
**Admin emails**: sharifahmed.dev@gmail.com, kingsharif314@gmail.com
