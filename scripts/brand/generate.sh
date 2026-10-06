#!/usr/bin/env bash
# favicon.svg（もるっくんの絵）から、ホーム画面アイコン icon-180.png と
# カード画像 ogp.png（1200x630）を作る。Google Chrome（ヘッドレス）と macOS の sips を使う。
# macOS 以外では CHROME にパスを指定し、sips の代わりに ImageMagick などで縮小する。
#   例) CHROME=/usr/bin/google-chrome bash scripts/brand/generate.sh
set -euo pipefail

cd "$(dirname "$0")/../.."

CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

shot() {  # shot <html> <幅> <高さ> <出力>
  "$CHROME" --headless --disable-gpu --hide-scrollbars \
    --force-device-scale-factor=1 --allow-file-access-from-files \
    --window-size="$2,$3" --screenshot="$4" "file://$PWD/$1" >/dev/null 2>&1
}

shot scripts/brand/icon.html 512 512 "$TMP/icon-512.png"
sips -z 180 180 "$TMP/icon-512.png" --out icon-180.png >/dev/null

shot scripts/brand/ogp.html 1200 630 ogp.png

echo "icon-180.png と ogp.png を作成しました"
