# もるっくん（モルックの点数けいさん）

https://play-molkky.onga-mirai-tech.com/

スマホ1台で、モルックの全プレイヤーの得点を1画面で記録・自動計算するWEBアプリ。
目標点（標準50）と超過時の戻り点（標準は目標点の半分）は、ゲーム開始前に変更できる。

- 設計書: [docs/design.md](docs/design.md)
- 実装計画: [docs/implementation-plan.md](docs/implementation-plan.md)

## 公開の仕組み

main ブランチへ push すると、GitHub Actions がテストを実行し、公開ファイル（`index.html` と `.htaccess`）だけを Xサーバーへ rsync で同期する。
詳しい設定手順は設計書の「6. 技術構成とデプロイ」を参照。

## 更新履歴

- 2026-10-06: v1.0 公開（準備・質問式の入力・ひとつもどす・きろく・再戦・自動保存と再開・画面の消灯防止）
