# AliOS Real-World QA Template

Status: reusable documentation template. This file does not validate product behavior by itself and does not change runtime code, storage, routes, tests, or release behavior.

## Stage Metadata

| Field | Value |
| --- | --- |
| Stage number |  |
| Date |  |
| QA executor |  |
| App URL or build source |  |
| Git commit / PR number |  |

## Test Environment

| Field | Value |
| --- | --- |
| Browser |  |
| OS |  |
| Device |  |
| Viewport width |  |
| Language | Persian RTL / English LTR |
| Appearance | light / dark / system |
| Accent color |  |
| View mode | Simple / Full |
| Zoom level |  |

## Interaction Results

| Field | Value |
| --- | --- |
| Keyboard-only result |  |
| Touch/click result |  |
| Screen-reader result, if tested |  |
| Console/network errors |  |
| Horizontal overflow |  |
| Data preservation |  |
| Backup/restore impact, if relevant |  |

## Summary

| Field | Value |
| --- | --- |
| Pass/fail summary |  |
| Screenshots or notes |  |
| Known limitations |  |

## Issue Notes

Use one line per issue when recording problems.

| Field | Value |
| --- | --- |
| Issue route / surface |  |
| Severity |  |
| Reproduction steps |  |
| Expected result |  |
| Actual result |  |
| Evidence |  |
| Suggested owner |  |

## Recording Rules

- Record the exact stage, commit, and environment that were actually tested.
- Separate automated validation from real-world validation.
- Do not mark a browser/device flow as pass unless it was observed in a real session.
- If a check was not run, write `NOT TESTED` or `BLOCKED` instead of inferring the result.
- If the check depends on a missing tool, browser, device, or access path, say so plainly.
