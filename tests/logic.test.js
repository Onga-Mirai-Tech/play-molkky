// 計算ロジックのテスト（設計書 7-2 のテストケース）
const test = require("node:test");
const assert = require("node:assert/strict");
const { loadLogic } = require("./load-logic");

const L = loadLogic();

// n人で試合を作り、inputs を手番の順に投げる。数字は点数、"F" はフォルト。
function play(inputs, { n = 2, ...overrides } = {}) {
  const game = {
    settings: { ...L.DEFAULT_SETTINGS, ...overrides },
    players: Array.from({ length: n }, (_, i) => ({ id: `p${i + 1}`, name: `人${i + 1}` })),
    throws: [],
  };
  for (const v of inputs) {
    const playerId = L.computeState(game).currentPlayerId;
    game.throws.push(v === "F"
      ? { playerId, points: 0, fault: true }
      : { playerId, points: v, fault: false });
  }
  return { game, state: L.computeState(game) };
}
const who = (state, id) => state.players.find((p) => p.id === id);

test("標準ルール: 目標50・超過で25・連続3回ミスで失格・フォルトも数える", () => {
  assert.deepEqual({ ...L.DEFAULT_SETTINGS }, {
    target: 50,
    resetMode: "half",
    resetValue: 25,
    missLimitEnabled: true,
    missLimit: 3,
    faultCountsAsMiss: true,
  });
  assert.equal(L.resetPoint(L.DEFAULT_SETTINGS), 25);
});

test("T-01: 0点から12 → 12点", () => {
  const { state } = play([12]);
  assert.equal(who(state, "p1").score, 12);
  assert.equal(state.last.result, "ADD");
  assert.equal(state.currentPlayerId, "p2");
});

test("T-02: 42点から8 → 50点で勝利", () => {
  const { state } = play([12, 1, 12, 1, 12, 1, 6, 1, 8]);
  assert.equal(who(state, "p1").score, 50);
  assert.equal(state.last.result, "WIN");
  assert.equal(state.finished, true);
  assert.equal(state.winnerId, "p1");
  assert.equal(state.currentPlayerId, null);
});

test("T-03: 45点から8 → 超過して25点", () => {
  const { state } = play([12, 1, 12, 1, 12, 1, 9, 1, 8]);
  assert.equal(state.last.before, 45);
  assert.equal(state.last.result, "OVER");
  assert.equal(who(state, "p1").score, 25);
  assert.equal(state.finished, false);
});

test("T-04: 49点から1 → 50点で勝利", () => {
  const { state } = play([12, 1, 12, 1, 12, 1, 12, 1, 1, 1, 1]);
  assert.equal(state.last.before, 49);
  assert.equal(state.last.result, "WIN");
  assert.equal(state.winnerId, "p1");
});

// 3人で p1 を 30点・ミス2 にする
const P1_30_MISS2 = [10, 1, 1, 10, 1, 1, 10, 1, 1, 0, 1, 1, 0, 1, 1];

test("T-05: 30点から0, 0 → 30点のまま・ミス2・つぎ0点だとおしまい", () => {
  const { state } = play(P1_30_MISS2, { n: 3 });
  const p1 = who(state, "p1");
  assert.equal(p1.score, 30);
  assert.equal(p1.misses, 2);
  assert.equal(p1.atRisk, true);
  assert.equal(who(state, "p2").atRisk, false);
});

test("T-06: 30点・ミス2から0 → 0点で失格、以後の手番を飛ばす", () => {
  const { state } = play([...P1_30_MISS2, 0, 1, 1], { n: 3 });
  const p1 = who(state, "p1");
  assert.equal(p1.out, true);
  assert.equal(p1.score, 0);
  assert.equal(p1.atRisk, false);
  assert.equal(state.history[P1_30_MISS2.length].result, "OUT");
  // p2, p3 が投げたあと、p1 を飛ばして p2 の番。先頭を越えたのでラウンドが進む
  assert.equal(state.currentPlayerId, "p2");
  assert.equal(state.round, 7);
  assert.equal(state.finished, false);
});

test("T-07: 30点・ミス2から5 → 35点、ミス数0に戻る", () => {
  const { state } = play([...P1_30_MISS2, 5], { n: 3 });
  const p1 = who(state, "p1");
  assert.equal(p1.score, 35);
  assert.equal(p1.misses, 0);
  assert.equal(p1.atRisk, false);
});

test("T-08: 3人中2人が失格 → 残る1人の勝利で終了", () => {
  const before = play([0, 0, 1, 0, 0, 1, 0], { n: 3 }).state;
  assert.equal(who(before, "p1").out, true);
  assert.equal(before.finished, false);

  const { state } = play([0, 0, 1, 0, 0, 1, 0, 0], { n: 3 });
  assert.equal(who(state, "p2").out, true);
  assert.equal(state.finished, true);
  assert.equal(state.winnerId, "p3");
});

test("T-09: 勝利直後に1投戻す → 勝利が取り消され、勝者の手番に戻る", () => {
  const { game } = play([12, 1, 12, 1, 12, 1, 6, 1, 8]);
  const undone = L.computeState({ ...game, throws: game.throws.slice(0, -1) });
  assert.equal(undone.finished, false);
  assert.equal(undone.winnerId, null);
  assert.equal(undone.currentPlayerId, "p1");
  assert.equal(who(undone, "p1").score, 42);
});

test("T-10: 目標35・戻り半分で 33+5 → 超過して17点（切り捨て）", () => {
  const { state } = play([11, 1, 11, 1, 11, 1, 5], { target: 35 });
  assert.equal(state.last.result, "OVER");
  assert.equal(who(state, "p1").score, 17);
});

test("T-11: 目標50・戻り任意0で 45+8 → 超過して0点", () => {
  const { state } = play([12, 1, 12, 1, 12, 1, 9, 1, 8], { resetMode: "custom", resetValue: 0 });
  assert.equal(state.last.result, "OVER");
  assert.equal(who(state, "p1").score, 0);
});

test("T-12: 失格オフで0を5回 → 失格にならず点数そのまま", () => {
  const { state } = play([10, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], { missLimitEnabled: false });
  const p1 = who(state, "p1");
  assert.equal(p1.score, 10);
  assert.equal(p1.misses, 5);
  assert.equal(p1.out, false);
  assert.equal(p1.atRisk, false);
  assert.equal(state.finished, false);
});

test("T-15: フォルトを数える設定で、30点・ミス2からフォルト → 失格", () => {
  const { state } = play([...P1_30_MISS2, "F"], { n: 3 });
  const p1 = who(state, "p1");
  assert.equal(p1.out, true);
  assert.equal(p1.score, 0);
  assert.equal(state.last.result, "OUT");
  assert.equal(state.last.fault, true);
});

test("T-16: フォルトを数えない設定で、30点・ミス2からフォルト → 30点・ミス2のまま", () => {
  const { state } = play([...P1_30_MISS2, "F"], { n: 3, faultCountsAsMiss: false });
  const p1 = who(state, "p1");
  assert.equal(p1.out, false);
  assert.equal(p1.score, 30);
  assert.equal(p1.misses, 2);
  assert.equal(state.last.result, "FAULT");
  assert.equal(state.currentPlayerId, "p2");
});

test("フォルトを数えない設定でも、0点・フォルト・0点はミス2（フォルトで連続が切れない）", () => {
  const { state } = play([0, 1, "F", 1, 0], { faultCountsAsMiss: false });
  assert.equal(who(state, "p1").misses, 2);
});

test("フォルトを数える設定では、0点・フォルト・0点で失格", () => {
  const { state } = play([0, 1, "F", 1, 0]);
  assert.equal(who(state, "p1").out, true);
});

test("ラウンド: 全員が1回ずつ投げると次のまわりになる", () => {
  assert.equal(play([1, 1], { n: 3 }).state.round, 1);
  assert.equal(play([1, 1, 1], { n: 3 }).state.round, 2);
});

test("あと何点: 目標点との差", () => {
  const { state } = play([12, 5]);
  assert.equal(who(state, "p1").remaining, 38);
  assert.equal(who(state, "p2").remaining, 45);
});

test("記録の矛盾はエラーにする（手番違い・終了後の投擲・範囲外の点数）", () => {
  const base = { settings: { ...L.DEFAULT_SETTINGS }, players: [{ id: "p1" }, { id: "p2" }] };
  assert.throws(() => L.computeState({ ...base, throws: [{ playerId: "p2", points: 1 }] }), /手番/);
  for (const points of [13, -1, 1.5, "3"]) {
    assert.throws(() => L.computeState({ ...base, throws: [{ playerId: "p1", points }] }), /点数/);
  }
  const { game } = play([12, 1, 12, 1, 12, 1, 6, 1, 8]);
  assert.throws(() => L.computeState({ ...game, throws: [...game.throws, { playerId: "p2", points: 1 }] }), /試合終了後/);
});

test("T-14（ロジック部分）: 準備画面の入力チェック", () => {
  const ok = { ...L.DEFAULT_SETTINGS };
  assert.deepEqual(L.validateSetup(ok, 2), []);
  assert.deepEqual(L.validateSetup(ok, 12), []);
  assert.deepEqual(L.validateSetup({ ...ok, resetMode: "custom", resetValue: 0 }, 2), []);
  assert.deepEqual(L.validateSetup({ ...ok, missLimitEnabled: false, missLimit: 99 }, 2), []);

  // 戻り点が目標点以上 → エラー（開始ボタン無効）
  assert.equal(L.validateSetup({ ...ok, resetMode: "custom", resetValue: 50 }, 2).length, 1);
  assert.equal(L.validateSetup({ ...ok, resetMode: "custom", resetValue: -1 }, 2).length, 1);
  assert.equal(L.validateSetup({ ...ok, target: 9 }, 2).length, 1);
  assert.equal(L.validateSetup({ ...ok, target: 201 }, 2).length, 1);
  assert.equal(L.validateSetup({ ...ok, missLimit: 6 }, 2).length, 1);
  assert.equal(L.validateSetup(ok, 1).length, 1);
  assert.equal(L.validateSetup(ok, 13).length, 1);
});
