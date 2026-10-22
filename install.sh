#!/usr/bin/env bash
# Pack and install the extension for the current user.
set -euo pipefail

cd "$(dirname "$(realpath "$0")")"

UUID=$(sed -n 's/.*"uuid": *"\([^"]*\)".*/\1/p' metadata.json)
OUT=$(mktemp -d)
trap 'rm -rf "$OUT"' EXIT

EXTRA=(--extra-source=icons)
[ -f authors.ini ] && EXTRA+=(--extra-source=authors.ini)
[ -d po ] && EXTRA+=(--podir=po)

gnome-extensions pack --force \
    "${EXTRA[@]}" \
    --schema=schemas/org.gnome.shell.extensions.spotify-controls.gschema.xml \
    --out-dir="$OUT" \
    .

gnome-extensions install --force "$OUT/$UUID.shell-extension.zip"

echo "Installed $UUID."
echo "Log out and back in (Wayland), then: gnome-extensions enable $UUID"
