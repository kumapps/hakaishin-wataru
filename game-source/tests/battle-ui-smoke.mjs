const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({ viewport: { width: 820, height: 1180 } });
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await page.goto("http://localhost:5173");
await page.locator("summary").click();
await page.locator("#test-one").click();
await page.waitForFunction(
  () => window.__explorationDemo?.snapshot().battle?.selected === "w",
  null,
  { timeout: 60000 },
);
await page.getByRole("button", { name: "たたかう", exact: true }).click();
await page.waitForFunction(
  () => window.__explorationDemo.snapshot().battle.quiz,
);
const snap = () =>
  page.evaluate(() => window.__explorationDemo.snapshot().battle);
const before = await snap();
await page.locator(".battle-hud").first().click();
assert.equal((await snap()).attributeActor, "w");
await page
  .locator(".battle-attribute-layer")
  .click({ position: { x: 500, y: 900 } });
assert.equal((await snap()).attributeActor, undefined);
assert.equal((await snap()).quiz.index, before.quiz.index);
if (process.env.BATTLE_SCREENSHOT)
  await page.screenshot({ path: process.env.BATTLE_SCREENSHOT });
for (const size of [
  { width: 820, height: 1180 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
  { width: 1024, height: 768 },
]) {
  await page.setViewportSize(size);
  await page.waitForTimeout(150);
  assert.ok(await page.locator("#quiz-unknown").isVisible());
  const rect = await page.locator("#quiz-unknown").boundingBox();
  assert.ok(
    rect.x >= 0 &&
      rect.y >= 0 &&
      rect.x + rect.width <= size.width + 1 &&
      rect.y + rect.height <= size.height + 1,
  );
}
await page.locator("#quiz-unknown").click();
await page.waitForFunction(
  () => window.__explorationDemo.snapshot().battle.rows.length > 0,
);
assert.equal((await snap()).rows[0].kind, "わからない");
assert.deepEqual(errors, []);
console.log(
  "PASS real app startup, battle, gauge browsing, tap consumption, pass, four viewports; no page errors",
);
await browser.close();
