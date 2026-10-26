# SPS GitHub zero-additional-cost policy

- Source changes may be committed to the private GitHub repository. Commit and push do not require enabling a metered runner.
- Never activate GitHub Actions, Codespaces, paid runners, hosted deployment, package storage with paid overages, or cloud services without explicit project-owner approval.
- Keep any sample workflow outside `.github/workflows/` until approved.
- Use `node scripts/verify-engineering.mjs` locally. It exits nonzero if any required check fails and writes `engineering-evidence.json` (exclude from Git).
- A missing lockfile or package installation is a blocker, not a PASS.
- The owner must separately verify billing budgets/limits; the repository cannot guarantee zero charge across third-party operations.
