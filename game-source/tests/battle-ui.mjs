// Run against npm run dev. Playwright is a test-runner dependency, not shipped with the game.
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE ?? "playwright"
);
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM_PATH ?? "/usr/bin/chromium",
  headless: true,
  args: ["--no-sandbox"],
});
const page = await browser.newPage({
  viewport: { width: 1024, height: 1536 },
  hasTouch: true,
});
page.on("pageerror", (e) => console.log("PAGEERROR", e.message));
let html = await fs.readFile(new URL("../index.html", import.meta.url), "utf8");
html = html.replace(
  '<script type="module" src="/src/main.ts"></script>',
  `<script type="module">
import '/src/style.css';import '/src/art.css';import '/src/practice-page.css';
import {Battle} from '/src/battle.ts';import {fresh,save,load} from '/src/state.ts';import {journey} from '/src/journey.ts';import {seal,release,attributes,ensureParty} from '/src/seals.ts';import {battleSpriteBounds} from '/src/sprite-geometry.ts';
window.api={Battle,fresh,save,load,journey,seal,release,attributes,ensureParty,battleSpriteBounds};
for(const id of ['title-screen','resume-screen','controls','panel'])document.getElementById(id).hidden=true;
window.make=(count=1)=>{window.b?.dispose();const s=fresh();s.tutorialDone=true;s.enemyCount=count;journey(s);s.position={x:11.5,y:49.5};s.follower={x:11.5,y:52.1};window.b=new Battle(s,{active:()=>true,explain:(_s,_t,done)=>done(),persist:()=>save(s),finish:()=>{} });b.phase='fight';b.actors.forEach(a=>{a.pos={...a.home}});window.project=(p,z=0)=>({x:512+(p.x-b.cameraPoint.x)*90,y:540+(p.y-b.cameraPoint.y)*56-z,s:1});b.layout(project,1024,998.4);return b;};window.make();
</script>`,
);
await page.route("**/__test", (r) =>
  r.fulfill({ contentType: "text/html", body: html }),
);
await page.goto("http://localhost:5173/__test");
await page.waitForFunction(() => window.b);
const checks = [];
async function test(name, fn) {
  await fn();
  checks.push(name);
  console.log("PASS", name);
}
const ev = (fn) => page.evaluate(fn);
await test("unsealed attributes and next tap consumes behind operation", async () => {
  await page.locator(".battle-hud").first().click();
  assert.equal(await ev(() => b.attributeActor?.id), "w");
  const attrs = await ev(() =>
    [...b.attributeLayer.querySelectorAll(".attribute-symbol")].map(
      (e) => e.textContent,
    ),
  );
  assert.deepEqual(attrs, await ev(() => api.attributes(b.state, "w")));
  await page
    .locator(".battle-attribute-layer")
    .click({ position: { x: 500, y: 900 } });
  assert.equal(await ev(() => b.attributeActor), null);
  assert.equal(await ev(() => b.quiz), null);
});
await test("touch tap closes panel without falling through", async () => {
  await ev(() => b.openAttributes(b.hero));
  await page.touchscreen.tap(500, 1200);
  assert.equal(await ev(() => b.attributeActor), null);
  assert.equal(await ev(() => b.quiz), null);
});
await test("existing selectable gauge switches instead of browsing", async () => {
  await ev(() => {
    b.hero.atb = 100;
    b.sister.atb = 100;
    b.selected = b.hero;
    b.layout(project, 1024, 998.4);
  });
  await page.locator(".battle-hud").nth(1).click();
  assert.equal(await ev(() => b.selected.id), "s");
  assert.equal(await ev(() => b.attributeActor), null);
});
await test("sealed marker is single and only effective max red", async () => {
  await ev(() => {
    b.state.journey.registered.push("火", "水");
    api.seal(b.state, "w", "火");
    api.seal(b.state, "w", "水");
    b.hero.max = 90;
    b.hero.hp = 90;
    b.hero.atb = 0;
    b.layout(project, 1024, 998.4);
  });
  assert.equal(
    await page.locator(".hud-name").first().textContent(),
    "わたる 封",
  );
  assert.equal(await page.locator(".original-max").count(), 0);
  assert.equal(
    await page.locator(".battle-hud").first().locator(".reduced").textContent(),
    "90",
  );
  await page.locator(".battle-hud").first().click();
  assert.equal(await page.locator(".battle-attributes .sealed").count(), 2);
  await page.locator(".battle-attributes").click();
});
await test("open panel reflects seal changes and survives existing pause", async () => {
  await ev(() => {
    b.openAttributes(b.hero);
    api.release(b.state, "w", "火");
    b.layout(project, 1024, 998.4);
  });
  assert.equal(await page.locator(".battle-attributes .sealed").count(), 1);
  await ev(() => b.pause(true));
  assert.equal(
    await page.locator(".battle-attribute-layer").isVisible(),
    false,
  );
  await ev(() => b.pause(false));
  assert.equal(await page.locator(".battle-attribute-layer").isVisible(), true);
  await page.locator(".battle-attributes").click();
});
await test("410px cell, vertical answer and controls do not overlap", async () => {
  await ev(() => {
    make();
    b.ready(b.hero);
    b.command = "attack";
    b.startQuiz();
    b.quiz.questions[0] = {
      type: "write",
      prompt: "ひ",
      characters: ["火"],
      answer: "火",
    };
    b.showQuestion();
  });
  const r = await page.locator(".ink-cell").first().boundingBox();
  assert.equal(Math.round(r.width), 410);
  assert.equal(Math.round(r.height), 410);
  assert.equal(
    await page
      .locator("#ink-submit")
      .evaluate((e) => getComputedStyle(e).writingMode),
    "vertical-rl",
  );
  for (const id of ["ink-submit", "ink-erase", "quiz-unknown", "quiz-finish"]) {
    const q = await page.locator("#" + id).boundingBox();
    assert.ok(
      q.x + q.width <= r.x ||
        q.x >= r.x + r.width ||
        q.y + q.height <= r.y ||
        q.y >= r.y + r.height,
      id,
    );
  }
});
await test("real pointer handwriting and erase", async () => {
  const r = await page.locator(".ink-cell canvas").first().boundingBox();
  await page.mouse.move(r.x + 30, r.y + 30);
  await page.mouse.down();
  await page.mouse.move(r.x + 200, r.y + 200, { steps: 12 });
  await page.mouse.up();
  assert.equal(await ev(() => b.cells[0].strokes.length), 1);
  await page.locator("#ink-erase").click();
  assert.equal(await ev(() => b.cells[0].strokes.length), 0);
});
await test("answer button processing pauses answer clock and rejects late result after death", async () => {
  await ev(() => {
    make();
    b.ready(b.hero);
    b.command = "attack";
    b.startQuiz();
    b.quiz.questions[0] = {
      type: "write",
      prompt: "ひ",
      characters: ["火"],
      answer: "火",
    };
    b.showQuestion();
    b.cells[0].judge = () =>
      new Promise((resolve) => (window.resolveJudge = resolve));
    b.state.quizAtb = false;
    b.quiz.remaining = 10;
  });
  await page.locator("#ink-submit").click();
  await page.waitForFunction(() => window.resolveJudge);
  assert.equal(await ev(() => b.quiz.processing), true);
  await ev(() => b.tick(0.5));
  assert.equal(await ev(() => b.quiz.remaining), 10);
  await ev(() => {
    b.hero.hp = 0;
    b.onDeath(b.hero);
    resolveJudge({ kind: "correct", order: true });
  });
  await page.waitForTimeout(100);
  assert.equal(await ev(() => b.rows.length), 0);
  assert.equal(await ev(() => b.quiz), null);
  await ev(() => {
    make();
    b.ready(b.hero);
    b.command = "attack";
    b.startQuiz();
    b.quiz.questions[0] = {
      type: "write",
      prompt: "ひ",
      characters: ["火"],
      answer: "火",
    };
    b.showQuestion();
  });
});
await test("answer button applies successful judgment", async () => {
  await ev(
    () => (b.cells[0].judge = async () => ({ kind: "correct", order: true })),
  );
  await page.locator("#ink-submit").click();
  await page.waitForFunction(() => window.b.quiz?.feedback > 0);
  assert.equal(await ev(() => b.quiz.success), 1);
  assert.equal(await ev(() => b.rows.length), 1);
  await ev(() => {
    make();
    b.ready(b.hero);
    b.command = "attack";
    b.startQuiz();
    b.quiz.questions[0] = {
      type: "write",
      prompt: "ひ",
      characters: ["火"],
      answer: "火",
    };
    b.showQuestion();
  });
});
await test("panel retains strokes success time; OFF freezes ATB and queue only", async () => {
  await ev(() => {
    b.state.quizAtb = false;
    b.quiz.success = 2;
    b.quiz.remaining = 10;
    b.cells[0].strokes = [
      [
        [0.1, 0.1],
        [0.8, 0.8],
      ],
    ];
    b.enqueue(b.enemy, b.hero, "enemy", 10, 0);
    b.openAttributes(b.hero);
    b.tick(0.5);
  });
  assert.deepEqual(
    await ev(() => ({
      time: b.quiz.remaining,
      success: b.quiz.success,
      strokes: b.cells[0].strokes.length,
      atb: b.sister.atb,
      queue: b.queue.length,
      action: b.action,
    })),
    { time: 9.5, success: 2, strokes: 1, atb: 0, queue: 1, action: null },
  );
  await page
    .locator(".battle-attribute-layer")
    .click({ position: { x: 900, y: 1200 } });
  assert.equal(await ev(() => b.quiz.success), 2);
});
await test("ON charges ATB and starts queue while browsing", async () => {
  await ev(() => {
    b.state.quizAtb = true;
    b.openAttributes(b.hero);
    b.tick(0.5);
  });
  assert.ok(await ev(() => b.sister.atb > 0));
  assert.equal(await ev(() => b.action.actor.id), "e");
  assert.equal(await ev(() => b.attributeActor.id), "w");
});
await test("acting HUD hidden and returns to fixed home; started action completes under OFF", async () => {
  const out = await ev(() => {
    b.layout(project, 1024, 998.4);
    const hidden = b.huds[2].hidden,
      pos = [b.huds[2].style.left, b.huds[2].style.top];
    b.state.quizAtb = false;
    for (let i = 0; i < 200 && b.action; i++) b.tick(0.05);
    b.layout(project, 1024, 998.4);
    return {
      hidden,
      after: b.huds[2].hidden,
      pos,
      restored: [b.huds[2].style.left, b.huds[2].style.top],
      action: !!b.action,
    };
  });
  assert.ok(out.hidden);
  assert.equal(out.after, false);
  assert.deepEqual(out.pos, out.restored);
  assert.equal(out.action, false);
});
await test("timeout closes browsing and records only current answer", async () => {
  await ev(() => {
    b.quiz.remaining = 0.1;
    b.tick(0.2);
  });
  assert.equal(await ev(() => b.attributeActor), null);
  assert.equal(await ev(() => b.rows.at(-1).kind), "時間切れ");
});
await test("one question pass retains successes; early finish leaves unanswered unrecorded", async () => {
  await ev(() => {
    make();
    b.ready(b.hero);
    b.command = "attack";
    b.startQuiz();
    b.quiz.questions[0] = {
      type: "write",
      prompt: "ひ",
      characters: ["火"],
      answer: "火",
    };
    b.showQuestion();
    b.quiz.success = 1;
  });
  await page.locator("#quiz-unknown").click();
  assert.equal(await ev(() => b.quiz.success), 1);
  await ev(() => b.tick(1.1));
  assert.equal(await ev(() => b.quiz.index), 1);
  await page.locator("#quiz-finish").click();
  assert.equal(await ev(() => b.quiz), null);
  assert.equal(await ev(() => b.rows.length), 1);
  assert.equal(await ev(() => b.queue[0].combo), 1);
});
await test("actor action starts closes own panel", async () => {
  await ev(() => {
    make();
    b.enqueue(b.hero, b.enemy, "attack", 10, 1);
    b.openAttributes(b.hero);
    b.tick(0.01);
    b.layout(project, 1024, 998.4);
  });
  assert.equal(await ev(() => b.attributeActor), null);
  assert.equal(await ev(() => b.huds[0].hidden), true);
});
await test("death, all enemies dead and result close browsing", async () => {
  await ev(() => {
    make();
    b.openAttributes(b.hero);
    b.hero.hp = 0;
    b.onDeath(b.hero);
  });
  assert.equal(await ev(() => b.attributeActor), null);
  await ev(() => {
    make();
    b.openAttributes(b.hero);
    b.enemy.hp = 0;
    b.onDeath(b.enemy);
  });
  assert.equal(await ev(() => b.attributeActor), null);
  await ev(() => {
    make();
    b.openAttributes(b.hero);
    b.end(true);
  });
  assert.equal(await ev(() => b.attributeActor), null);
  assert.equal(await page.locator("#battle-result").isVisible(), true);
});
await test("save and resume preserve personal seals and settings", async () => {
  const d = await ev(() => {
    make();
    b.state.quizAtb = false;
    b.state.journey.registered.push("火");
    api.seal(b.state, "w", "火");
    api.save(b.state);
    const s = api.load().data;
    return { seals: s.party.w.sealed, other: s.party.s.sealed, atb: s.quizAtb };
  });
  assert.deepEqual(d, { seals: ["火"], other: [], atb: false });
});
await test("two and three character spell cells inside answer region", async () => {
  for (const count of [2, 3]) {
    await ev(() => {
      make();
      b.ready(b.hero);
      b.command = "attack";
      b.startQuiz();
      b.quiz.questions[0] = {
        type: "write",
        prompt: "ひ",
        characters: ["火"],
        answer: "火",
      };
      b.showQuestion();
    });
    await ev(() => {
      b.quiz.questions[0] = {
        type: "magic",
        prompt: "ひのや",
        characters: ["火", "矢"],
        answer: "火の矢",
        fixedKana: true,
      };
      b.showQuestion();
    });
    if (count === 3)
      await ev(() => {
        b.quiz.questions[0].characters = ["火", "水", "土"];
        b.quiz.questions[0].fixedKana = false;
        b.showQuestion();
      });
    const cells = await page.locator(".ink-cell").all();
    let previous = null;
    for (const c of cells) {
      const r = await c.boundingBox();
      assert.ok(r.width > 100);
      if (previous) assert.ok(previous.x + previous.width <= r.x);
      previous = r;
    }
  }
});
await test("1/2/3 enemies HUDs fit without intersecting HUDs or sprite bounds", async () => {
  for (const count of [1, 2, 3]) {
    const r = await page.evaluate((count) => {
      make(count);
      return {
        huds: b.huds.map((h) => ({
          x: parseFloat(h.style.left),
          y: parseFloat(h.style.top),
          w: 264,
          h: 100,
        })),
        sprites: b.actors.map((a) =>
          api.battleSpriteBounds({ ...a, pos: a.home }, project),
        ),
      };
    }, count);
    const sprites = r.sprites,
      huds = r.huds;
    for (const h of huds)
      for (const s of sprites)
        assert.ok(
          h.x >= s.left + s.width ||
            h.x + h.w <= s.left ||
            h.y >= s.top + s.height ||
            h.y + h.h <= s.top,
        );
    const r2 = huds;
    for (let i = 0; i < r2.length; i++) {
      assert.ok(
        r2[i].x >= 0 &&
          r2[i].x + r2[i].w <= 1024 &&
          r2[i].y >= 0 &&
          r2[i].y + r2[i].h <= 998.4,
      );
      for (let j = 0; j < i; j++)
        assert.ok(
          r2[i].x >= r2[j].x + r2[j].w ||
            r2[i].x + r2[i].w <= r2[j].x ||
            r2[i].y >= r2[j].y + r2[j].h ||
            r2[i].y + r2[i].h <= r2[j].y,
        );
    }
  }
});
console.log(`${checks.length} scenarios passed`);
await browser.close();
