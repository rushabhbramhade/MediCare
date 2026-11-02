# 0001 — Monorepo, modular monolith, separate AI service

**Status:** accepted

## Context

The product spans a mobile-first web app, an API, background workers and an AI pipeline.
The team is small and the domains are not yet stable. Independent services would multiply
deployment and debugging cost before any module has real traffic.

## Decision

- One pnpm + Turborepo repository for TypeScript code.
- Web and API are separate deployables but share types, contracts, validators and env
  config through workspace packages.
- The API is a modular monolith: one NestJS process, one module folder per future
  domain, with per-module READMEs instead of premature implementations.
- The AI service is a separate Python process because its provider ecosystem, safety
  review cadence and scaling profile differ from CRUD traffic. It is internal-only.

## Consequences

- Shared schemas keep web and API honest, but package build order matters; Turbo builds
  packages first.
- A module can be extracted to a service later if it earns it.
- Two languages to maintain. The HTTP contract is the only coupling, so it must be
  tested on both sides.
