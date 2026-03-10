#!/usr/bin/env bash

# build-lambdas.sh
# - Builds local Lambda zip artifacts required by Terraform
#
# Usage:
#   bash infra/scripts/build-lambdas.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INFRA_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$INFRA_DIR/.." && pwd)"

SOURCE_DIR="$REPO_ROOT/backend"
BUILD_DIR="$REPO_ROOT/build"
TMP_DIR="$BUILD_DIR/.tmp/fantasy-ufc-backend"
ARTIFACT_PATH="$BUILD_DIR/fantasy-ufc-backend.zip"

log() {
  echo "[build-lambdas] $1"
}

fail() {
  echo "[build-lambdas] ERROR: $1"
  exit 1
}

has_npm_script() {
  local script_name="$1"

  [ -f "package.json" ] || return 1

  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    process.exit(pkg.scripts && pkg.scripts['$script_name'] ? 0 : 1);
  "
}

zip_directory() {
  local source_dir="$1"
  local artifact_path="$2"

  rm -f "$artifact_path"

  if command -v zip >/dev/null 2>&1; then
    (
      cd "$source_dir" || exit 1
      zip -qr "$artifact_path" .
    )
    return $?
  fi

  if command -v powershell.exe >/dev/null 2>&1; then
    local win_source_dir="$source_dir"
    local win_artifact_path="$artifact_path"

    if command -v cygpath >/dev/null 2>&1; then
      win_source_dir="$(cygpath -w "$source_dir")"
      win_artifact_path="$(cygpath -w "$artifact_path")"
    fi

    powershell.exe -NoProfile -Command "
      \$ErrorActionPreference = 'Stop'
      if (Test-Path '$win_artifact_path') {
        Remove-Item '$win_artifact_path' -Force
      }
      Compress-Archive -Path '$win_source_dir\*' -DestinationPath '$win_artifact_path' -Force
    "
    return $?
  fi

  fail "Neither 'zip' nor 'powershell.exe' is available"
}

main() {
  log "Source directory: $SOURCE_DIR"
  log "Artifact path: $ARTIFACT_PATH"

  [ -d "$SOURCE_DIR" ] || fail "Source directory not found: $SOURCE_DIR"

  mkdir -p "$BUILD_DIR"
  rm -rf "$BUILD_DIR/.tmp"
  mkdir -p "$TMP_DIR"

  cp -R "$SOURCE_DIR"/. "$TMP_DIR"

  rm -rf \
    "$TMP_DIR/node_modules" \
    "$TMP_DIR/.git" \
    "$TMP_DIR/.terraform" \
    "$TMP_DIR/coverage" \
    "$TMP_DIR/build"

  (
    cd "$TMP_DIR" || exit 1

    if [ -f "package.json" ]; then
      command -v npm >/dev/null 2>&1 || fail "npm is required"

      if has_npm_script "build"; then
        log "Installing dependencies"
        if [ -f "package-lock.json" ]; then
          npm ci
        else
          npm install
        fi

        log "Running build"
        npm run build

        log "Pruning dev dependencies"
        npm prune --omit=dev
      else
        log "Installing production dependencies"
        if [ -f "package-lock.json" ]; then
          npm ci --omit=dev
        else
          npm install --omit=dev
        fi
      fi
    fi
  ) || fail "Build failed"

  zip_directory "$TMP_DIR" "$ARTIFACT_PATH" || fail "Failed to create zip"
  [ -f "$ARTIFACT_PATH" ] || fail "Zip file was not created"

  rm -rf "$BUILD_DIR/.tmp"

  log "Created: $ARTIFACT_PATH"
  log "Done"
}

main