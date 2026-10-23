// ソースに「見えない文字」や「文字の向きを変える文字」が生のまま入っていないかを確かめる。
// これらがあると、エディタや GitHub で見たコードと実際に動くコードが食いちがって見える
// （Trojan Source, CVE-2021-42574）。必要なときは "\u202E" のようにエスケープで書く。
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const BINARY = /\.(png|jpe?g|gif|ico|webp|pdf)$/i;
// 双方向制御文字・幅ゼロの文字・BOM（絵文字の見た目を決める異体字セレクタ U+FE0E/U+FE0F は無害なので対象外）
const HIDDEN = /[\u061C\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF]/u;

test("リポジトリのファイルに、見えない文字・向きを変える文字が生のまま入っていない", () => {
  const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" })
    .split("\n").filter((f) => f && !BINARY.test(f));
  const found = [];
  for (const file of files) {
    const full = path.join(root, file);
    if (!fs.existsSync(full)) continue;
    fs.readFileSync(full, "utf8").split("\n").forEach((line, i) => {
      const m = line.match(HIDDEN);
      if (m) found.push(`${file}:${i + 1} U+${m[0].codePointAt(0).toString(16).toUpperCase().padStart(4, "0")}`);
    });
  }
  assert.deepEqual(found, []);
});
