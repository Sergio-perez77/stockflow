# E2E tests for StockFlow

This folder contains an E2E script that exercises the import flow and saves artifacts.

Run locally (dev server must be running on http://localhost:3000):

```bash
npm run dev
# in another terminal
npm run test:e2e
```

Artifacts (downloaded CSV) are saved to `test-artifacts/` and the CI workflow uploads them.
