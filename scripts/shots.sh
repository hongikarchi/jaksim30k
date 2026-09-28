#!/usr/bin/env bash
# 개발용: 웹으로 빌드한 뒤 화면을 찍는다. 사용: scripts/shots.sh <출력 폴더> <경로>...
set -e
OUT=$1; shift
WEB=${WEB_BUILD:-/tmp/jaksim30k-web}
if [ -z "$SKIP_BUILD" ]; then npx expo export --platform web --output-dir "$WEB" > /dev/null; fi
node "$(dirname "$0")/shot.mjs" "$WEB" "$OUT" - "$@"
