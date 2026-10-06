// index.html の「==== LOGIC START ====」〜「==== LOGIC END ====」の区間だけを切り出し、
// MolkkyLogic を取り出す。画面（DOM）を使わずに計算ロジックをテストするための仕組み。
const fs = require("node:fs");
const path = require("node:path");

const START = "// ==== LOGIC START ====";
const END = "// ==== LOGIC END ====";

function loadLogic() {
  const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
  const start = html.indexOf(START);
  const end = html.indexOf(END);
  if (start === -1 || end === -1 || end < start) {
    throw new Error("index.html にロジック区間の目印が見つかりません");
  }
  const code = html.slice(start + START.length, end);
  return new Function(`"use strict";\n${code}\nreturn MolkkyLogic;`)();
}

module.exports = { loadLogic };
