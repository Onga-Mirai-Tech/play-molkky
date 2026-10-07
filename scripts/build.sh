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

# サーバー（Xserver / Apache）専用の設定。
# CSP に index.html の <script> / <style> のハッシュを埋め込む（中身が変わるたびに計算し直す）
SCRIPT_HASHES="$(perl scripts/csp-hashes.pl index.html script)"
STYLE_HASHES="$(perl scripts/csp-hashes.pl index.html style)"
sed -e "s|__INLINE_SCRIPT_HASHES__|$SCRIPT_HASHES|" \
    -e "s|__INLINE_STYLE_HASHES__|$STYLE_HASHES|" \
    server/.htaccess > dist/.htaccess
if grep 'Content-Security-Policy' dist/.htaccess | grep -qE "__INLINE_|'unsafe-inline'"; then
  echo "dist/.htaccess の CSP にハッシュを埋め込めませんでした" >&2
  exit 1
fi

echo "dist/ を作成しました:"
find dist -type f | sort
