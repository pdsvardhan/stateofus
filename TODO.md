# stateofus — TODO

## CI
- [ ] **Fix red CI** — push runs fail (stale vitest/E2E are hard gates) and Chrome re-downloads (~290 MB) every run. Pause tests behind a `RUN_TESTS` toggle (keep typecheck/lint/build hard); switch E2E to the prebuilt `mcr.microsoft.com/playwright` image. Re-arm tests at production. → `.gitea/workflows/ci.yml`
