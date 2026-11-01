# gbdemos

Small, single-user demo apps, one per technology worth trying.

## Layout

```
AGENTS.md                     rules for cloud agents
skills/project-planning/      planning skill agents follow before building
apps/<slug>/                  one self-contained Bun app per demo
tracking/seen-bookmarks.json  picks: proposed, approved, skipped, built
```

Entries in `tracking/seen-bookmarks.json` look like `{ "id", "title", "url", "date" }`.

## Workflow

1. A daily X scout picks one technology from bookmarks.
2. The owner approves, tweaks, or skips it.
3. A cloud agent plans it (`apps/<slug>/PLAN.md`), builds it under `apps/<slug>/`, and opens one PR with at least one screenshot and one video of the running app.

## Preview deploys (planned)

Cloudflare Pages previews will use one Pages project, with a path per `apps/<slug>/`. They need these repo secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`. No workflow exists yet.
