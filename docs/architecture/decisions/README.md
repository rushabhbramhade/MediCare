# Architecture decisions

Short records of choices that are expensive to reverse. Status is `accepted` unless
noted.

| ADR                                                  | Decision                                                 |
| ---------------------------------------------------- | -------------------------------------------------------- |
| [0001](0001-monorepo-and-stack.md)                   | pnpm monorepo, modular monolith API, separate AI service |
| [0002](0002-raw-sql-and-migrations.md)               | Raw SQL + checksummed migrations instead of an ORM       |
| [0003](0003-providers-disabled-by-default.md)        | Every external provider defaults to disabled             |
| [0004](0004-nextjs-16-proxy.md)                      | Use Next.js 16 `proxy.ts` instead of `middleware.ts`     |
| [0005](0005-audit-persistence-and-failure-policy.md) | Persistent audit; mutations fail closed, reads fail open |
