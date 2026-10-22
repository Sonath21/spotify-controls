#!/usr/bin/env bash
# Regenerate the translation template and merge it into existing translations.
set -euo pipefail

cd "$(dirname "$(realpath "$0")")"

DOMAIN=$(sed -n 's/.*"gettext-domain": *"\([^"]*\)".*/\1/p' metadata.json)
POT="po/$DOMAIN.pot"

mkdir -p po
xgettext --from-code=UTF-8 --language=JavaScript \
    --keyword=_ --keyword=ngettext:1,2 \
    --add-comments=Translators: \
    --package-name="$DOMAIN" \
    --output="$POT" \
    extension.js prefs.js

for po in po/*.po; do
    [ -e "$po" ] || continue
    msgmerge --update --backup=none "$po" "$POT"
done

echo "Updated $POT."
