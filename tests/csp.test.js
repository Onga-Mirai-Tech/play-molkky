// ビルドした dist/.htaccess の CSP が、index.html の <script> / <style> のハッシュと一致するかを
// Perl（scripts/csp-hashes.pl）とは別に Node で計算して確かめる。ずれると本番で画面が動かなくなる。
const test = require("node:test");
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");

function hashesOf(html, tag) {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "g");
  return [...html.matchAll(re)].map((m) =>
    `'sha256-${crypto.createHash("sha256").update(m[1], "utf8").digest("base64")}'`);
}

test("CSP: 直接書いたスクリプト・スタイルはハッシュで許可し、'unsafe-inline' は使わない", () => {
  execFileSync("bash", ["scripts/build.sh"], { cwd: root, stdio: "pipe" });
  const html = fs.readFileSync(path.join(root, "index.html"), "utf8");
  const htaccess = fs.readFileSync(path.join(root, "dist", ".htaccess"), "utf8");
  const csp = htaccess.match(/Content-Security-Policy "([^"]+)"/)[1];
  const directive = (name) => csp.split(";").map((d) => d.trim()).find((d) => d.startsWith(`${name} `));

  assert.doesNotMatch(csp, /unsafe-inline|__INLINE_/);
  const scripts = hashesOf(html, "script");
  const styles = hashesOf(html, "style");
  assert.ok(scripts.length > 0 && styles.length > 0);
  assert.equal(directive("script-src"), `script-src ${scripts.join(" ")}`);
  assert.equal(directive("style-src"), `style-src ${styles.join(" ")}`);
  assert.equal(directive("connect-src"), "connect-src 'none'");
});
