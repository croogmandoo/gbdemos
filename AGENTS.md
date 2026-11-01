# AGENTS.md

Rules for cloud agents working in this repo.

## Scope
- One demo app per pick, in `apps/<kebab-slug>/`.
- Touch only your own `apps/<slug>/` folder. Do not edit other apps, `skills/`, `tracking/`, or root config unless the task says so.
- Never create a new repository. Everything lives here.

## Plan first
- Read `skills/project-planning/SKILL.md` and follow it.
- Write the plan to `apps/<slug>/PLAN.md` before writing code.

## Stack
- Runtime: Bun.
- Before any install, create `apps/<slug>/bunfig.toml` with:

  ```toml
  [install]
  minimumReleaseAge = 259200
  ```

- Start from the official `bunx create-*` scaffold for the framework you pick.
- UI: shadcn/ui with the minimalist preset.
- The app must be self-contained: `bun install && bun run dev` from `apps/<slug>/` runs it.

## Pull requests
- One PR per demo.
- Every PR must attach at least one screenshot AND at least one video of the running app. These are validation artifacts, not optional.
