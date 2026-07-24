# AliOS QA Coverage Matrix - Stage 163

Status: documentation-only evidence matrix. No product behavior is changed by this document.

## Coverage Matrix

| Surface | Automated coverage | Real-world coverage | Last related stage | Risk | Recommended follow-up |
| --- | --- | --- | --- | --- | --- |
| Home | partial | partial | Stage 148 | medium | Include in the next structured browser pass at desktop and 360/390/430 px. |
| Inbox | partial | partial | Stage 23 | medium | Smoke-test capture, filtering, and bulk actions with long item lists. |
| Today | partial | known | Stage 154 | high | Verify create/edit/complete/delete, MIT, filters, recurrence, and task handoff. |
| Weekly Review | partial | partial | Stage 166 | high | Follow up with the next browser pass only if exact environment details or review-density friction need confirmation. |
| Goals | known | partial | Stage 161 | medium | Check Simple/Full View, templates, and primary create actions. |
| Personal Manual | known | partial | Stage 161 | medium | Check Simple/Full View, templates, search, and edit flows. |
| Decision Log | known | partial | Stage 160 | medium | Check contextual help, record creation, and review flow. |
| Finance | partial | partial | Stage 154 | high | Smoke-test transactions, obligations, summaries, and list density. |
| Calendar | partial | missing | Stage 141 | medium | Confirm date handoff, month/week navigation, and ICS export. |
| Settings | partial | known | Stage 156 | high | Verify appearance, language, view mode, backup, and help sections. |
| Backup/Restore | known | known | Stage 146 | high | Confirm backup export, restore preview, cancel, and restore confirmation. |
| Search | partial | partial | Stage 26 | medium | Confirm query, results, and focus navigation still work. |
| Simple/Full View | known | partial | Stage 157C | high | Repeat the browser/device matrix because Stage 157C was blocked. |
| RTL/LTR | partial | partial | Stage 80 | medium | Check Persian and English in the same browser pass. |
| Mobile widths | partial | partial | Stage 53 | high | Verify 360 px, 390 px, and 430 px in the live app. |
| 200% zoom | unknown | missing | Stage 157C | high | Add a real zoom check because current evidence is incomplete. |
| Keyboard-only | partial | missing | Stage 83 | high | Run a focus-traversal smoke test on the highest-risk surfaces. |
| Screen-reader | unknown | missing | Stage 157C | high | Add at least one screen-reader smoke check before new feature scope. |
| Console/network | partial | missing | Stage 157C | medium | Record console and network state during the next browser pass. |
| Backup export/import | known | partial | Stage 146 | high | Recheck backup export and restore safety with disposable data. |

## Status Legend

- Automated coverage:
  - `known` means the repository has direct automated checks or strong documented coverage for the surface.
  - `partial` means some coverage exists, but it does not fully prove the current release behavior.
  - `unknown` means the repository does not currently show enough direct coverage to rely on.
- Real-world coverage:
  - `known` means a real-browser or real-device pass is recorded with enough detail to trust.
  - `partial` means some manual evidence exists, but the environment, viewport, or interaction coverage is incomplete.
  - `missing` means there is no reliable real-world evidence for the surface in the current record set.

## Stage 163 Follow-Up Priority

1. Weekly Review.
2. Today.
3. Settings and Backup/Restore.
4. Finance.
5. Calendar.

## Stage 166 User QA

- Stage 164 attempted to run the structured real-world QA pass referenced by this matrix, but the current Codex environment did not expose a usable browser surface.
- Stage 166 adds user-reported real-world coverage for Weekly Review on the live AliOS app.
- Weekly Review was reported OK with no issue reported.
- Coverage for Weekly Review is now partial user-reported coverage only; exact browser, device, viewport, and other environment details remain incomplete.
- This update applies only to Weekly Review and does not upgrade the other surface rows in this matrix.
