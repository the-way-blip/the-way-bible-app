#!/bin/sh
# Web bundle for the iOS shell: the app loads https://thewaybible.app (server.url),
# so the ~200 MB of /data study files are left out of the binary.
set -e
cd "$(dirname "$0")/.."
npx vite build
rsync -a --delete --exclude 'data/' dist/ ios-web/
npx cap sync ios
du -sh ios-web ios/App/App/public
