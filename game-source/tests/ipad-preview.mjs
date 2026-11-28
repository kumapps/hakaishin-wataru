// Run after packaging and serving the preview directory on localhost:8765.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage({
    viewport: { width: 820, height: 1180 },
    hasTouch: true,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("http://localhost:8765/BUILD.json");
  await page.evaluate(() => {
    localStorage.setItem(
      "kanji-dungeon.journey.save.v7",
      "STABLE-SAVE-SENTINEL",
    );
    localStorage.setItem("kanji-dungeon.audio.v1", "STABLE-SETTINGS-SENTINEL");
  });
  await page.goto("http://localhost:8765/battle-ui-pr4-ipad.html");
  const frame = page.frames().find((f) => f.parentFrame());
  assert.ok(frame);
  await frame.waitForFunction(() => window.__explorationDemo);
  assert.equal(
    await frame.evaluate(() =>
      localStorage.getItem("kanji-dungeon.journey.save.v7"),
    ),
    null,
  );
  assert.equal(
    await frame.evaluate(() => {
      try {
        return top.localStorage.length;
      } catch {
        return "blocked";
      }
    }),
    "blocked",
  );
  assert.equal(
    await page.locator("iframe").getAttribute("sandbox"),
    "allow-scripts",
  );
  assert.match(
    await frame.locator("#title-screen small").textContent(),
    /戦闘新UI テスト版（PR #4）.*v0.9.36/,
  );
  await frame.locator("summary").click();
  await frame.locator("#test-one").click();
  await frame.waitForFunction(
    () => window.__explorationDemo.snapshot().battle?.selected === "w",
    null,
    { timeout: 60000 },
  );
  await frame.getByRole("button", { name: "たたかう", exact: true }).click();
  await frame.waitForFunction(
    () => window.__explorationDemo.snapshot().battle?.quiz,
  );
  await frame.locator(".battle-hud").first().click();
  assert.equal(
    await frame.evaluate(
      () => window.__explorationDemo.snapshot().battle.attributeActor,
    ),
    "w",
  );
  await frame
    .locator(".battle-attribute-layer")
    .click({ position: { x: 200, y: 400 } });
  assert.equal(
    await frame.evaluate(
      () => window.__explorationDemo.snapshot().battle.attributeActor,
    ),
    undefined,
  );
  await frame.locator("#quiz-unknown").click();
  await frame.waitForFunction(
    () => window.__explorationDemo.snapshot().battle.rows.length > 0,
  );
  await frame.locator("#battle-debug-open").click();
  await frame
    .getByRole("button", { name: "検証：戦闘を終了", exact: true })
    .click();
  await frame.locator("#result-return").click();
  assert.equal(
    await frame.evaluate(() => window.__explorationDemo.snapshot().mode),
    "explore",
  );
  assert.ok(
    await frame.evaluate(() =>
      localStorage.getItem("kanji-dungeon.journey.save.v7"),
    ),
  );
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("kanji-dungeon.journey.save.v7"),
    ),
    "STABLE-SAVE-SENTINEL",
  );
  assert.equal(
    await page.evaluate(() => localStorage.getItem("kanji-dungeon.audio.v1")),
    "STABLE-SETTINGS-SENTINEL",
  );
  await page.reload();
  const fresh = page.frames().find((f) => f.parentFrame());
  await fresh.waitForFunction(() => window.__explorationDemo);
  assert.equal(
    await fresh.evaluate(() =>
      localStorage.getItem("kanji-dungeon.journey.save.v7"),
    ),
    null,
  );
  assert.equal(
    await page.evaluate(() =>
      localStorage.getItem("kanji-dungeon.journey.save.v7"),
    ),
    "STABLE-SAVE-SENTINEL",
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS HTTP single HTML: title, battle, attributes, pass, result/exploration, unchanged host save/settings, reload resets test save",
  );
  if (process.env.PREVIEW_HTML) {
    const local = await browser.newPage();
    await local.goto(pathToFileURL(process.env.PREVIEW_HTML).href);
    const child = local.frames().find((f) => f.parentFrame());
    await child.waitForFunction(() => window.__explorationDemo);
    assert.equal(await child.locator("#title-screen").isVisible(), true);
    await child.locator("summary").click();
    await child.locator("#test-three").click();
    await child.waitForFunction(
      () => window.__explorationDemo.snapshot().battle?.phase === "fight",
      null,
      { timeout: 60000 },
    );
    console.log(
      "PASS file:// single HTML: title and 3-enemy battle boot (desktop Chromium only)",
    );
    await local.close();
  }
} finally {
  await browser.close();
}
