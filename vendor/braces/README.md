# @yls/braces-depth-guard (private vendored fork)

Official [braces](https://www.npmjs.com/package/braces) 3.0.3 plus an in-repo
maximum parse/compile/expand/stringify depth. This replaces the third-party
npm alias override.

The depth bound rejects excessive brace/paren nesting before recursive compilation.

This is a private local fork, version `3.0.3-yls.1`, installed under the `braces`
dependency name for compatibility. It is not unmodified upstream `braces@3.0.3`.
The upstream advisory GHSA-vfj7-8cjw-p6xm remains applicable to that upstream
release; this fork carries the parser and recursive AST depth guards locally.
Tests exercise the installed transitive copy, malicious nesting/ASTs and normal
patterns. npm audit does not review private fork source; these checks and code
review remain necessary even when the registry audit has no high findings.
