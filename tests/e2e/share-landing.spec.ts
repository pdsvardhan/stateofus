/**
 * flow-inbound-share — feat-share-landing + feat-og-image-gen E2E.
 * AC382: ?s=1 shows the shared context without spoiling the result.
 * AC383: answering unlocks the comparison on the same page.
 * AC331/332: OG card serves a real PNG; meta tags point at it.
 */
import { expect, test } from "@playwright/test";

const SHARED_ID = "Q-201";

test("inbound share shows context band, answer unlocks comparison", async ({ page }) => {
  await page.goto(`/q/${SHARED_ID}?s=1`);
  await expect(page.getByText("PASSED ALONG")).toBeVisible();

  // result is NOT shown before answering
  await expect(page.getByTestId("result-area")).toHaveCount(0);

  await page.getByTestId("option").first().click();
  const submit = page.getByTestId("submit-answer");
  if (await submit.isVisible().catch(() => false)) await submit.click();

  await expect(page.getByTestId("result-area")).toBeVisible({ timeout: 10_000 });
});

test("OG card endpoint serves a PNG with cache semantics", async ({ request }) => {
  const res = await request.get(`/api/og/${SHARED_ID}`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toBe("image/png");
  const body = await res.body();
  expect(body.byteLength).toBeGreaterThan(5_000);
  // second hit caches
  const res2 = await request.get(`/api/og/${SHARED_ID}`);
  expect(res2.headers()["x-og-cache"]).toBe("hit");
});

test("question page carries OG meta tags", async ({ page }) => {
  await page.goto(`/q/${SHARED_ID}`);
  const ogImage = page.locator('meta[property="og:image"]');
  await expect(ogImage).toHaveAttribute("content", new RegExp(`/api/og/${SHARED_ID}`));
});
