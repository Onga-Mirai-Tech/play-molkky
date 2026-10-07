# もるっくん（モルックの点数けいさん）

スマホ1台でモルックの全員の得点を記録・自動計算するWEBアプリ。

- 公開URL: `https://play-molkky.onga-mirai-tech.com/`（Xサーバーのサブドメイン）
- デプロイ: main への push で GitHub Actions が `dist/` を rsync 同期（Disaster Chronicle・遠賀町ナビと同じ方式）。接続情報は GitHub の secrets にのみ置き、ファイルに書かない

- 設計の正: `docs/design.md`（ルール仕様・画面・データ・テストケースT-01〜T-16）
- 作業手順: `docs/implementation-plan.md`（M0〜M5。各マイルストーンの完了条件つき）

## 制約（設計書 8-2）

- 成果物は `index.html` 1ファイル。外部ライブラリ・CDN・フォント読み込みは使わない
- 素のJavaScript、ビルド工程なし。サーバー側処理・DBなし
- 計算は純粋関数（`// ==== LOGIC START/END ====` で区切る）、画面は計算結果から毎回描き直す。状態を画面側で直接書き換えない
- 保存するのは「設定」「プレイヤー」「投擲の記録」だけ。現在点・ミス数・手番は記録から毎回計算する
- localStorageの読み書きは必ず try/catch
- プレイヤー名は `textContent` で表示する（`innerHTML` に入れない）
- 文言はすべて日本語。画面の言葉はやさしい口調（「失格」→「おしまい」など、設計書 4-5 の言いかえ表に従う）
- 配色はオレンジ・茶色の木の色（設計書 4-5、見本 `docs/design-mockup.html`）。暗い色・ダークモードは使わない
- 設計書と違う判断をするときは、実装前に理由を添えて確認する

## 進め方

- `docs/implementation-plan.md` のマイルストーン順に進める。**各マイルストーンの終わりで止まり、確認を取ってから次へ**
- UIを変えたら、スマホ幅（375×812）で実際に開いてスクリーンショットで確認する
- 保存・再開を確かめるときは http で開く（`.claude/launch.json` の `play-molkky`＝`python3 -m http.server 8765`）。ファイルを直接開くと `data:` 扱いになり localStorage が使えない
- 設計を変更したら `docs/design.md` を更新し、判断ログに残す

## 公開物に含めないもの

`scripts/build.sh` が `dist/` に集めたものだけが公開される: `index.html`・`favicon.svg`・`icon-180.png`・`ogp.png` と `server/.htaccess`。公開ファイルを足したら `scripts/build.sh` にも追記する。

- アイコン・カード画像の絵は `favicon.svg` が元。変えたら `bash scripts/brand/generate.sh` で `icon-180.png` と `ogp.png` を作り直す
- 外部への通信や読み込みを足すと、`server/.htaccess` の CSP（`connect-src 'none'` など）で本番だけ壊れる。足す場合は CSP も更新する
- CSP は index.html の <script>・<style> の中身のハッシュで許可している（`scripts/csp-hashes.pl` → `scripts/build.sh`）。<script>/<style> を増やしても自動で入るが、`style="…"` 属性・`onclick="…"` 属性・JS からの `el.style` 書き換えは動かないので使わない
- 本番と同じ CSP で確かめるときは `.claude/launch.json` の `play-molkky-dist`（`scripts/serve-dist.py`）で開く
- ドメインは `index.html`（canonical・OGP）・`scripts/brand/ogp.html`・`server/.htaccess`・`.github/workflows/deploy.yml`・`docs/` に書かれている。変えるときは `grep -rn play-molkky.onga-mirai-tech.com` で漏れなく置き換える
