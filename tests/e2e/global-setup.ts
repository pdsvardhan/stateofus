/**
 * Playwright global setup — intentionally a no-op.
 *
 * Seeding moved into scripts/e2e-server.cjs (the webServer command) so the
 * standalone server only ever opens a fully-seeded db. Seeding here raced the
 * webServer: Playwright starts the server BEFORE globalSetup, so an rm+reseed
 * here orphaned the server's open fd on the deleted inode and every /q/* 404'd.
 */
export default function globalSetup() {
  // no-op — see scripts/e2e-server.cjs
}
