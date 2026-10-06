# モルック得点計算アプリ

スマホ1台でモルックの全員の得点を記録・自動計算するWEBアプリ。

- 公開URL: `https://play-molkky.onga-mirai-tech.com/`（Xサーバーのサブドメイン）
- デプロイ: main への push で GitHub Actions が `dist/` を rsync 同期（Disaster Chronicle・遠賀町ナビと同じ方式）。接続情報は GitHub の secrets にのみ置き、ファイルに書かない

- 設計の正: `docs/design.md`（ルール仕様・画面・データ・テストケースT-01〜T-14）
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
- 設計を変更したら `docs/design.md` を更新し、判断ログに残す

## 公開物に含めないもの

`scripts/build.sh` が `dist/` に集めたものだけが公開される: `index.html` と `server/.htaccess`（と任意で `icon-180.png`）。公開ファイルを足したら `scripts/build.sh` にも追記する。

- 外部への通信や読み込みを足すと、`server/.htaccess` の CSP（`connect-src 'none'` など）で本番だけ壊れる。足す場合は CSP も更新する
- ドメインは `server/.htaccess`・`.github/workflows/deploy.yml`・`docs/` に書かれている。変えるときは `grep -rn play-molkky.onga-mirai-tech.com` で漏れなく置き換える
