import { expect, test } from "@playwright/test";

test("health endpoint reports db connected", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
  expect(body.db).toBe("connected");
});

test("homepage renders the masthead", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "State of Us" })).toBeVisible();
  await expect(page.getByText("You answer. India answers back.")).toBeVisible();
});

test("admin surface is gated, never silently open", async ({ request }) => {
  const res = await request.get("/api/admin/anything");
  // 503 when ADMIN_TOKEN unset (admin disabled), 401 when set without cookie
  expect([401, 503]).toContain(res.status());
});
