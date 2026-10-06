# Xserver（独自ドメイン）へのデプロイ手順

- 公開URL: `https://play-molkky.onga-mirai-tech.com/`
- ホスティング: Xserver（レンタルサーバー）。`onga-mirai-tech.com` の**サブドメイン**として配信します。
- Disaster Chronicle・遠賀町ナビと同じ Xserver アカウント・同じ仕組みです。サーバーのホスト名・サーバーID・SSH 鍵・`known_hosts` は既存のものを流用できます。

## 仕組み

```
main へ push
   └─ GitHub Actions（.github/workflows/deploy.yml）
        ├─ build        … テスト（node --test "tests/*.test.js"）とビルドの確認
        ├─ deploy       … scripts/build.sh で dist/ を作り、rsync over SSH で Xserver に同期
        │                 （手順は .github/actions/deploy-xserver/action.yml）
        └─ deploy-retry … deploy が失敗したときだけ、別の実行環境（別の IP）でやり直す
```

- サーバーに置かれるのは `dist/` の中身だけです（`index.html` / `.htaccess`）。`.git` や `docs/`、`tests/` などは公開されません。
- 接続情報や鍵は **GitHub の Environment secrets にだけ**保存します。リポジトリは公開されているため、ファイルには絶対に書かないでください。
- `DEPLOY_ENABLED` が `true` になるまで、main に push してもデプロイは実行されません（テストとビルドのみ）。
- rsync は `--delete` で同期します。デプロイ先は**このサイト専用のディレクトリ**でなければなりません（`.well-known/` と `.user.ini` は消さずに残します）。

> ドメイン名は `server/.htaccess`、`.github/workflows/deploy.yml`、`scripts/setup-deploy-env.sh`、`docs/` に書かれています。変更するときは `grep -rn play-molkky.onga-mirai-tech.com` で漏れなく置き換えてください。

---

## 1. Xserver 側の準備

### 1-1. サブドメインの追加（2026-10-06 作成済み）

サーバーパネル → **サブドメイン設定** → `onga-mirai-tech.com` → サブドメイン `play-molkky`。

ドキュメントルート（手順 2 の `XSERVER_DEPLOY_PATH`）は通常次の形です。

```
/home/<サーバーID>/onga-mirai-tech.com/public_html/play-molkky.onga-mirai-tech.com
```

### 1-2. 無料独自SSLの設定

サーバーパネル → **SSL設定** → `play-molkky.onga-mirai-tech.com` に無料独自SSLを追加します。DNS の反映後でないと失敗するので、失敗した場合は時間をおいて再試行してください。

### 1-3. SSH とデプロイ用の鍵

他のサイトで設定済みのため、SSH の ON・「国外IPアクセス制限」の OFF・公開鍵の登録は**不要**です。既存のデプロイ用の鍵（例: `~/.ssh/xserver_onga_deploy`）をそのまま使います。

## 2. GitHub 側の設定

`gh auth login` 済みの Mac で次を実行すると、Environment `production` と Secrets・Variables を対話式で登録します（鍵や接続情報はチャットやファイルに残りません）。

```bash
bash scripts/setup-deploy-env.sh
```

登録される項目:

| 種類 | 名前 | 値 |
| --- | --- | --- |
| Secret | `XSERVER_SSH_HOST` | サーバーのホスト名（例: `sv12345.xserver.jp`） |
| Secret | `XSERVER_SSH_USER` | サーバーID |
| Secret | `XSERVER_SSH_KEY` | デプロイ用の**秘密鍵**の中身すべて |
| Secret | `XSERVER_KNOWN_HOSTS` | `ssh-keyscan -p 10022 <ホスト名>` の出力すべて |
| Secret | `XSERVER_DEPLOY_PATH` | 1-1 のドキュメントルート |
| Variable | `XSERVER_SSH_PORT` | `10022` |
| Variable | `DEPLOY_ENABLED` | 最初は未設定のまま（3 で設定） |

## 3. 初回デプロイ

1. `DEPLOY_ENABLED` を `true` に設定
2. **Actions → Build & Deploy → Run workflow** で `dry_run` にチェックを入れて実行し、ログで転送予定のファイルを確認
   - `deleting ...` に、サーバー上の消えては困るファイルが含まれていないか**必ず確認**してください（`--delete` で同期するため）
3. 問題なければ `dry_run` なしで再実行

以降は main への push（PR のマージ）で自動デプロイされます。

## 4. 動作確認チェックリスト

- [ ] `https://play-molkky.onga-mirai-tech.com/` が表示される
- [ ] `http://` でアクセスすると `https://` に転送される
- [ ] `https://onga-mirai-tech.com/play-molkky.onga-mirai-tech.com/` が正規URLに転送される
- [ ] ブラウザの開発者ツールのコンソールに CSP（Content-Security-Policy）違反のエラーが出ていない
- [ ] 試合中に画面が消灯しない（Wake Lock は HTTPS でのみ動作）
- [ ] スマートフォン実機（iPhone Safari・Android Chrome）で1試合を最後まで通せる

## トラブルシューティング

| 症状 | 確認すること |
| --- | --- |
| `Host key verification failed` | `XSERVER_KNOWN_HOSTS` が `ssh-keyscan -p 10022` の出力と一致しているか |
| `Permission denied (publickey)` | 公開鍵がサーバーに登録されているか、`XSERVER_SSH_KEY` に秘密鍵全体が入っているか |
| SSH 接続がタイムアウトする | GitHub Actions の実行環境の IP によっては接続できないことがある。deploy-retry が自動でやり直す。両方失敗したら「Re-run failed jobs」 |
| `XSERVER_DEPLOY_PATH は public_html 配下の…` | サイト専用でない場所を指定していないか（`--delete` で他サイトを消さないための安全装置） |
| 画面が崩れる・ボタンが動かない | コンソールの CSP 違反を確認し、`server/.htaccess` の CSP を見直す |
