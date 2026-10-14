---
name: Release runtime verification
description: Avoid false Node 22 verification through Nix launchers pinned to another Node version.
---

Verify the runtime used by child build/test tools, not just the Node version of the top-level build script.

**Why:** In this workspace the Nix-provided pnpm launcher pinned Node 24 in its shebang, even when a Node 22 binary was first in PATH and launched the parent build script. That produced misleading runtime checks.

**How to apply:** When validating Vercel's Node 22 target locally, invoke the discovered pnpm CLI with the chosen Node binary directly, or invoke the actual compiler/bundler entrypoints with it. Check the runtime before claiming that the release was tested on Node 22. Do not change the global workspace toolchain merely to run these checks.
