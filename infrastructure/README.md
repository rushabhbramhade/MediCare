# Infrastructure

| Path               | Purpose                                           |
| ------------------ | ------------------------------------------------- |
| `compose/`         | local Postgres + Redis                            |
| `docker/postgres/` | custom Postgres image (pgvector + PostGIS)        |
| `scripts/`         | migration runner, secret scan, PWA icon generator |
| `monitoring/`      | observability plan and current signals            |
| `deployment/`      | production deployment notes                       |

```bash
pnpm db:up        # start postgres and redis
pnpm db:migrate   # apply database/migrations
pnpm db:logs
pnpm db:down
```

Nothing here deploys to a cloud provider. There is no Terraform, Kubernetes or
hosted infrastructure in this repository yet.
