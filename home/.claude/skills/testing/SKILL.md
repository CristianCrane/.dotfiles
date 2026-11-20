---
name: testing
description: Test rules for any repo. Use before writing or editing a test, or changing how tests run.
---

# Testing

A test is worth what it catches. Each rule here came from a test that passed with the code wrong, a run that failed for a reason outside the code, or a timing that measured the machine instead of the change. The repo's own testing doc, which its CLAUDE.md names, adds its harness, its helpers and its budgets.

## Writing a test

- **Each test earns its place.** If another test already checks the same thing at the same level (unit, browser, end-to-end), merge the two or drop one. And it must fail when the code it guards breaks: break that code by hand (flip a condition, drop a call), see the test go red, and put the code back. A bug fix's test, red on the old code (the `change` skill's Survey), has shown that already (2026-11-19: nothing checked a new test against the others, or against broken code).

## Changing how tests run

- **A speed-up runs the same checks faster** (more workers or shards, a quicker setup), **never fewer or weaker ones.** Cutting checks for speed was offered and turned down twice: skipping or thinning a slow suite's tests (empire-cleaning's seed tests, 2026-11-05), and less coverage (2026-11-06).
