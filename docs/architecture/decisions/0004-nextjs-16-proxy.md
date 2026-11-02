# 0004 — Next.js 16 `proxy.ts` instead of `middleware.ts`

**Status:** accepted

## Context

Next.js 16 renamed the request-boundary file `middleware.ts` to `proxy.ts` and deprecated
the old name. The product specification asked for middleware-style auth protection.

## Decision

- Implement the auth guard in `apps/web/src/proxy.ts` with the exported `proxy` function
  and the same `config.matcher` semantics.
- Keep the guard fail-closed: without Supabase configuration, protected paths redirect
  to `/login`.
- Use `supabase.auth.getUser()` so the token is validated with Supabase rather than
  trusted from an unverified cookie.

## Consequences

- The behaviour matches the requested middleware design; the filename differs because of
  the framework version.
- Documentation and future contributors must not re-add `middleware.ts`, which would
  create two competing guards.
- The matcher must keep `sw.js`, icons and the manifest excluded so the PWA still loads
  for signed-out users.
