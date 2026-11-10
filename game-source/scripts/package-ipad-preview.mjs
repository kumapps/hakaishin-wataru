// Test-only packaging. The original game bundle, save schema and keys stay intact.
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
const destination = resolve(process.argv[2] ?? "dist-ipad-preview");
const source = await readFile(
  new URL("../dist/index.html", import.meta.url),
  "utf8",
);
if (!source.includes("v0.9.36") || !source.includes("battle-attribute-layer"))
  throw Error("Build PR #4 first");
const revision = execFileSync("git", ["rev-parse", "HEAD"], {
  encoding: "utf8",
}).trim();
const memoryBootstrap = `<script>
(()=>{
 const createStorage=()=>{const items=new Map();return {
 get length(){return items.size},key(i){return [...items.keys()][Number(i)]??null},
 getItem(k){return items.get(String(k))??null},setItem(k,v){items.set(String(k),String(v))},
 removeItem(k){items.delete(String(k))},clear(){items.clear()}
 }};
 // sandbox omits allow-same-origin, so access to the host's storage is forbidden
 // even if replacing these test-only storage adapters fails.
 Object.defineProperty(window,'localStorage',{value:createStorage()});
 Object.defineProperty(window,'sessionStorage',{value:createStorage()});
})();
</script>`;
let game = source
  .replace("<head>", "<head>" + memoryBootstrap)
  .replace(
    /<title>[^<]*<\/title>/,
    "<title>戦闘新UI テスト版（PR #4） · v0.9.36</title>",
  )
  .replace("全180字・AI認識 · v0.9.36", "戦闘新UI テスト版（PR #4） · v0.9.36");
// Escape '<' before embedding JSON in a script, including nested closing tags.
const serialized = JSON.stringify(game).replace(/</g, "\\u003c");
const html = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"><title>戦闘新UI テスト版（PR #4） · v0.9.36</title><style>html,body{margin:0;width:100%;height:100%;overflow:hidden;background:#101e1a}iframe{border:0;width:100%;height:100%;display:block}</style></head><body><!-- Source commit: ${revision}. Test progress is in-memory only. --><iframe id="preview" title="戦闘新UI テスト版（PR #4）" sandbox="allow-scripts"></iframe><script>document.getElementById('preview').srcdoc=${serialized};</script></body></html>`;
await mkdir(destination, { recursive: true });
await writeFile(resolve(destination, "battle-ui-pr4-ipad.html"), html);
await writeFile(
  resolve(destination, "BUILD.json"),
  JSON.stringify(
    {
      sourceCommit: revision,
      gameVersion: "0.9.36",
      label: "戦闘新UI テスト版（PR #4）",
      bytes: Buffer.byteLength(html),
      sha256: createHash("sha256").update(html).digest("hex"),
      storage: "opaque sandbox, in-memory only; original keys unchanged",
      model: "not embedded; original fixed URL or manual file selection",
    },
    null,
    2,
  ) + "\n",
);
console.log(destination, Buffer.byteLength(html), "bytes");
