import { expect, test } from "@playwright/test";

test("health endpoint reports db connected", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.db).toBe("connected");
});

test("homepage renders the curated front page, not the scaffold", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("link", { name: "State of Us — front page" })).toBeVisible();
  await expect(page.getByText("You answer. India answers back.")).toBeVisible();
  // curated modules the scaffold placeholder does NOT have (this assertion is
  // what would have caught the scaffold shipping to prod):
  await expect(page.getByText("Heating up")).toBeVisible();
  await expect(page.getByText("House rules")).toBeVisible();
  // at least one real question card links into the experience
  await expect(page.locator('a[href^="/q/"]').first()).toBeVisible();
  // the scaffold's tell must be absent
  await expect(page.getByText("the presses are being built")).toHaveCount(0);
});

test("admin surface is gated, never silently open", async ({ request }) => {
  const res = await request.get("/api/admin/anything");
  // 503 when ADMIN_TOKEN unset (admin disabled), 401 when set without cookie
  expect([401, 503]).toContain(res.status());
});
