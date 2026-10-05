#!/bin/sh
# AND MORE — local light pipeline (§3B). Zero third-party deps.
set -e
cd "$(dirname "$0")/.."
node scripts/run-light-checks.mjs
