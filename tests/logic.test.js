const test = require("node:test");
const assert = require("node:assert/strict");
const { loadLogic } = require("./load-logic");

const L = loadLogic();

test("標準ルール: 目標50・超過で25・連続3回ミスで失格・フォルトも数える", () => {
  assert.deepEqual({ ...L.DEFAULT_SETTINGS }, {
    target: 50,
    resetMode: "half",
    resetValue: 25,
    missLimitEnabled: true,
    missLimit: 3,
    faultCountsAsMiss: true,
  });
});
