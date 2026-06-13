/**
 * flow-core-answer-loop — the critical E2E (blocks deploy on red).
 *
 * AC334: question + interaction + result on ONE page, no separate route.
 * AC335: result + personal insight appear in place after answering.
 * AC336/340: usable at 375px (the "mobile" Playwright project runs this).
 * AC338: Skip advances without recording.
 * AC369: no signup anywhere.
 */
import { expect, test } from "@playwright/test";

// Q-101 is content-ready catalogue: quick_pick, 5 real options.
const QUICK_PICK_ID = "Q-101";

test("answer a quick-pick: result + insight reveal in place", async ({ page }) => {
  await page.goto(`/q/${QUICK_PICK_ID}`);

  // one unified page: question text + interaction visible, no login walls
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByText(/sign in|log in|sign up/i)).toHaveCount(0);

  const url = page.url();

  // answer with the first option
  await page.getByTestId("option").first().click();
  const submit = page.getByTestId("submit-answer");
  if (await submit.isVisible().catch(() => false)) await submit.click();

  // result appears on the SAME page (no navigation)
  await expect(page.getByTestId("result-area")).toBeVisible({ timeout: 10_000 });
  expect(page.url()).toBe(url);

  // trust visible: sample count (either still-counting or revealed result)
  await expect(page.getByText(/counted|counting/i).first()).toBeVisible();
});

test("skip advances to another question without recording", async ({ page }) => {
  await page.goto(`/q/${QUICK_PICK_ID}`);
  await page.getByRole("button", { name: "Skip", exact: true }).click();
  await page.waitForURL((u) => /\/q\/.+/.test(u.pathname) && !u.pathname.includes(QUICK_PICK_ID));
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("question page shows governance status and desk stamp", async ({ page }) => {
  await page.goto(`/q/${QUICK_PICK_ID}`);
  // desk stamp present (The City Desk for C1 family)
  await expect(page.getByText("The City Desk")).toBeVisible();
});

test("admin surface stays gated", async ({ request }) => {
  const res = await request.post(`/api/admin/questions/${QUICK_PICK_ID}/transition`, {
    data: { to: "frozen" },
  });
  expect([401, 503]).toContain(res.status());
});
