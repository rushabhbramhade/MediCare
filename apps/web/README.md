# Web

Next.js 16 App Router, React 19, Tailwind 4, PWA. Mobile-first.

## Commands

```bash
pnpm --filter @medicare/web dev
pnpm --filter @medicare/web build
pnpm --filter @medicare/web typecheck
pnpm --filter @medicare/web test
pnpm --filter @medicare/web lint
```

Environment: copy `apps/web/.env.example` to `apps/web/.env.local`. Only `NEXT_PUBLIC_*`
values reach the browser. Without Supabase values, sign-in and protected routes are
unavailable by design.

## Routes

| Path                  | Access    | State                                    |
| --------------------- | --------- | ---------------------------------------- |
| `/`                   | public    | landing                                  |
| `/emergency`          | public    | emergency numbers, no login              |
| `/login`, `/register` | public    | phone OTP UI; requires Supabase          |
| `/dashboard`          | protected | session summary, API health, quick links |
| `/hospitals`          | protected | map + honest "no source configured"      |
| `/doctors`            | protected | no provider integration                  |
| `/medicines`          | protected | no catalogue integration                 |
| `/ambulance`          | protected | public emergency information             |
| `/medical-records`    | protected | upload not implemented                   |
| `/icare`              | protected | AI not connected in this build           |
| `/profile`            | protected | read-only session summary                |

`src/proxy.ts` is the auth boundary (Next 16 renamed `middleware.ts`). The service
worker caches only static assets and an offline fallback; it never caches API responses
or patient pages.

## Shared code

Use `@medicare/types`, `@medicare/contracts`, `@medicare/validators` and
`@medicare/api-client`. Do not duplicate a schema or route string in the app.
