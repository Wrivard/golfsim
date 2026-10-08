#!/bin/bash
set -e
pnpm install --frozen-lockfile
# Golf SIM uses an existing user-managed Neon database. Never push schema
# changes automatically during workspace setup or task merges.
