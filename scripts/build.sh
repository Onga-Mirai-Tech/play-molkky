#!/usr/bin/env bash
# 公開用ファイルだけを dist/ に集める。
# サーバーへはこの dist/ の中身だけがアップロードされるため、
# .git や docs、tests、CLAUDE.md などリポジトリ管理用のファイルは公開されない。
# 公開ファイルを追加したら、下の PUBLIC_FILES にも追記すること。
set -euo pipefail

cd "$(dirname "$0")/.."

# 公開するファイル
PUBLIC_FILES=(
  index.html
  favicon.svg    # タブのアイコン・アプリの見出しの絵（もるっくん）
  icon-180.png   # ホーム画面に追加したときのアイコン（scripts/brand/generate.sh で作る）
  ogp.png        # リンクを貼ったときのカード画像（同上）
)

rm -rf dist
mkdir -p dist

for f in "${PUBLIC_FILES[@]}"; do
  cp -R "$f" "dist/$f"
done

# サーバー（Xserver / Apache）専用の設定
cp server/.htaccess dist/.htaccess

echo "dist/ を作成しました:"
find dist -type f | sort
