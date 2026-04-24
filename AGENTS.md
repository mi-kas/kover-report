# AGENTS Guidelines for This Repository

This repository contains the GitHub Action "kover-report" and is hosted on
GitHub: https://github.com/mi-kas/kover-report.

When working on tasks in this repo:

- Prefer the smallest possible change that fixes the issue.
- Preserve backward compatibility unless the issue explicitly asks for a breaking change.
- Do not change public behavior, output wording, or action inputs unless tests and issue text justify it.
- Add or update tests for every behavior change.
- Keep PRs focused. Avoid opportunistic refactors.
- If the issue is ambiguous, choose the safest behavior and explain the tradeoff in the PR description.
- Update the documentation in `README.md` when you change behavior.
- Prefer improving docs and examples when behavior may be surprising.
- Validate changes against the Node/TypeScript test suite and GitHub Action CI setup. Use realistic Kover XML fixtures
  for coverage parsing changes.
- For parsing/reporting issues, include at least one regression test with realistic fixture input.

## Build and Test Commands

- Node: `>=24.0.0`
- Install: `yarn install`
- Lint: `yarn lint`
- Format: `yarn format .`
- Test: `yarn test`
- Build: `yarn build`
- Package: `yarn package`
- Full verify: `yarn all`

## Coding agreements

- Edit TypeScript source in `src/`. When runtime code changes, run `yarn all` to update `lib/` and `dist/`.
- Use `yarn` as dependency manager
- Always run `yarn all` before committing.
- NEVER use `git push --force` on the `main` branch
- Use conventional commits style for git commit messages
- Use conventional commits style to describe GitHub PR titles