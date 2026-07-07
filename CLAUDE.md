# CLAUDE.md — SEHATI Codebase Guide

**SEHATI** (Sistem E-Office HETI Terintegrasi) is an internal secretariat management system for PMU HETI (Kemdiktisaintek, Indonesia). It handles monthly activity reporting and multi-level approval workflows.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS 4 + Shadcn/ui (radix-nova) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| Forms | React Hook Form + Zod |
| PDF | @react-pdf/renderer |
| Icons | Lucide React |
| Dates | date-fns |
| Theme | next-themes (dark/light) |
| Deployment | PM2 + GitHub Actions (Tailscale SSH) |

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/              # Auth pages: reset-password, update-password
│   ├── (dashboard)/         # Dashboard layout group
│   │   ├── admin/           # Admin pages: users, bidang management
│   │   ├── log/             # Monthly log pages
│   │   ├── profil/          # User profile
│   │   ├── review/          # Log review/approval pages
│   │   └── page.tsx         # Dashboard home
│   ├── api/time/            # GET /api/time — server time endpoint
│   ├── auth/callback/       # Supabase auth callback
│   ├── login/               # Login page
│   ├── verify/              # Email verification
│   ├── actions/             # Next.js Server Actions
│   │   └── user.ts          # createUser, updateLogStatus
│   ├── globals.css
│   ├── layout.tsx           # Root layout
│   └── not-found.tsx
├── components/
│   ├── admin/               # Admin tables/forms
│   ├── layout/              # Sidebar, header, footer, mobile menu
│   ├── log/                 # Log creation/viewing components
│   ├── onboarding/          # Welcome tutorial modal
│   ├── pdf/                 # PDF export components
│   ├── profil/              # Profile components
│   ├── ui/                  # Shadcn UI primitives (do not modify directly)
│   └── theme-provider.tsx
├── hooks/
│   ├── useRole.ts           # Client-side role state
│   └── useSidebar.ts        # Sidebar open/close context
├── lib/
│   ├── supabase/
│   │   ├── admin.ts         # Service-role client (bypasses RLS)
│   │   ├── client.ts        # Browser client
│   │   └── server.ts        # Server-side client (SSR cookies)
│   ├── get-user-role.ts     # Server-side role fetch + auth guard
│   ├── fonts.ts             # Font imports
│   └── utils.ts             # cn() helper (clsx + tailwind-merge)
└── middleware.ts            # Auth middleware (protects all routes)
```

---

## Development Commands

```bash
npm run dev       # Start local dev server (http://localhost:3000)
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run ESLint
```

No test framework is currently set up.

---

## Environment Variables

Create `.env.local` (never commit it):

```env
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Server-side service role key (never expose client-side)
```

---

## Database Schema (Supabase / PostgreSQL)

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | FK → auth.users |
| full_name | text | |
| role | text | See roles below |
| bidang_id | int | FK → bidang |
| email | text | |
| avatar_url | text | |
| is_active | bool | |

### `bidang` (Departments)
| Column | Type |
|--------|------|
| id | int |
| nama | text |

### `log_bulanan` (Monthly Logs)
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | |
| user_id | uuid | FK → users |
| bulan | int | 1–12 |
| tahun | int | |
| status | text | See statuses below |
| submitted_at | timestamp | |
| created_at | timestamp | |

### `log_entry` (Activity Entries)
| Column | Type |
|--------|------|
| id | uuid |
| log_bulanan_id | uuid |
| tanggal | date |
| kegiatan | text |
| output | text |
| link_dokumen | text |
| tag_kategori | text |
| status_kegiatan | text |

### `log_approval` (Approval History)
| Column | Type |
|--------|------|
| id | uuid |
| log_bulanan_id | uuid |
| reviewer_id | uuid |
| role_reviewer | text |
| status | text |
| komentar | text |
| urutan | int |
| reviewed_at | timestamp |

---

## Roles & Authorization

Roles (stored in `users.role`):

| Role | Description |
|------|-------------|
| `admin` | Full system access, user management |
| `kasubdit` | Sub-director, final approval |
| `kepala_sekretariat` | Secretary head, second-level approval |
| `pic` | Point of contact, first-level review |
| `karyawan` | Regular staff, creates monthly logs |

Authorization is enforced at two levels:
- **Supabase RLS** — database-level policies
- **`get-user-role.ts`** — server-side guard used in page components

Use `lib/supabase/admin.ts` (service role) only for privileged operations that need to bypass RLS (e.g., creating users). Never import the admin client in client components.

---

## Approval Workflow

Log statuses follow this flow:

```
draft → submitted → reviewed_pic → verified_kasek → approved
                                                   ↘ revision (any step)
```

Each transition inserts a record into `log_approval` and updates `log_bulanan.status`.

---

## Key Conventions

### Server vs Client Components
- Pages and data-fetching layouts are **Server Components** (async functions, no `'use client'`).
- Interactive UI (forms, dropdowns, hooks) uses `'use client'` at the top.
- Never use `useState`/`useEffect` in Server Components.

### Supabase Client Usage
| Context | Client to use |
|---------|--------------|
| Server component / Server Action | `lib/supabase/server.ts` |
| Client component / hook | `lib/supabase/client.ts` |
| Privileged admin operations | `lib/supabase/admin.ts` |

### Path Aliases
All imports use the `@/*` alias (maps to `src/*`):
```ts
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
```

### Styling
- Use Tailwind utilities and Shadcn component variants — do not write raw CSS.
- Use `cn()` from `@/lib/utils` for conditional class merging.
- Dark mode is handled by `next-themes`; prefer `dark:` variant classes over JS checks.

### File Naming
- Pages and components: `kebab-case.tsx`
- No barrel `index.ts` files — import directly from file path.

### Localization
- All UI text is in **Bahasa Indonesia**.
- Month names, status labels, and user-facing strings must remain in Indonesian.
- Date formatting should use Indonesian locale where applicable.

### Server Actions
Server Actions live in `src/app/actions/`. They must:
- Call `revalidatePath()` after mutations to invalidate cached pages.
- Use the server Supabase client (or admin client when needed).
- Never be imported in client-side code except via `<form action={...}>` or `startTransition`.

### Shadcn Components
- Components are in `src/components/ui/` — do not hand-edit these files.
- Add new Shadcn components via the CLI: `npx shadcn add <component>`.
- Component config is in `components.json`.

---

## Deployment

**CI/CD:** GitHub Actions (`.github/workflows/deploy.yml`)
- Triggers on push to `main` or `development`.
- Connects to private server via Tailscale VPN + SSH.
- Runs: `git pull → npm install → npm run build → pm2 restart sehati`.

**Branch Strategy:**
- `main` — production, triggers auto-deploy.
- `development` — staging, also triggers auto-deploy.
- Feature branches: `claude/<feature-name>` or descriptive names.

**Process Manager:** PM2 (`sehati` process name).

---

## Common Patterns

### Fetching data in a Server Component
```tsx
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('log_bulanan')
    .select('*, log_entry(*)')
    .eq('user_id', userId)

  if (error) throw error
  return <LogList logs={data} />
}
```

### Role guard in a page
```tsx
import { getUserRole } from '@/lib/get-user-role'

export default async function AdminPage() {
  const { user, role } = await getUserRole()
  if (role !== 'admin') redirect('/')
  // ...
}
```

### Form with Server Action
```tsx
'use client'
import { createUser } from '@/app/actions/user'

export function CreateUserForm() {
  return (
    <form action={createUser}>
      {/* fields */}
    </form>
  )
}
```

### Conditional class merging
```tsx
import { cn } from '@/lib/utils'

<div className={cn('base-class', isActive && 'active-class', className)} />
```

---

## What Does Not Exist Yet

- No test framework (no Jest, Vitest, Playwright, etc.)
- No Prettier config (formatting is manual/ESLint only)
- No pre-commit hooks (no Husky)
- No `.env.example` file
- No API documentation beyond this file
- No database migration tooling (schema managed directly in Supabase dashboard)
