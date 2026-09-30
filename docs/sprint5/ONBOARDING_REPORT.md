# Onboarding and full-width walkthrough

**Date:** 2026-09-30
**Repository:** nikimpatel/ai-investment-coach
**Branch:** `feat/onboarding-fullwidth-walkthrough`
**Status:** Implemented and verified locally. Production has not been updated.

This is local verification. The production site, deployment configuration, and `main` were left unchanged.

## What changed

The landing prototype now opens with a first-visit briefing, then a full-width walkthrough that can optionally be shown in a desktop phone frame. A short coach sentence sits with the step rail and hides while guided Apple analysis is open.

### Slice 1 — `53a5f4f` `feat: add walkthrough briefing and primary CTA`

- First visit shows the briefing. Start and Skip write `aic.prototypeBriefingDismissed.v1` as `{"dismissed":true}` after mount and move focus to `#prototype-walkthrough`.
- Hero and header “Try the walkthrough” links are real `<a href="#prototype">` controls. Early access stays secondary.
- `src/app/page.tsx` remains a Server Component. Briefing state lives in `PrototypeExperience`.

Files: `package.json`, `src/components/landing/Header.tsx`, `src/components/landing/Hero.tsx`, `src/components/landing/MobilePreview.tsx`, `src/components/landing/PrototypeExperience.tsx`, `src/lib/prototype-briefing-storage.ts`, `tests/prototype-briefing-storage.test.ts`, `tsconfig.test.json`.

### Slice 2 — `ec11aa2` `feat: add responsive walkthrough and phone preview`

- At the `lg` breakpoint (1024px) the walkthrough defaults to a wide panel. “Show phone preview” is desktop-only session state.
- Below 1024px the walkthrough uses the available width, with no phone bezel.
- `PhoneFrame` keeps one element tree so Harborline inputs, the current step, and guided Apple state stay mounted.

Files: `src/components/landing/MobilePreview.tsx`, `src/components/landing/PrototypeExperience.tsx`, `src/components/prototype/PhoneFrame.tsx`, `src/components/prototype/PrototypeApp.tsx`, `src/components/prototype/StepRail.tsx`, plus `docs/deployment/evidence/slice2-desktop-wide.png`, `slice2-desktop-phone-preview.png`, and `slice2-mobile-finance.png`.

### Environment merge — `a9bd997`

`origin/main` environment commits `5bc66d3` and `6450bb1` merged with the `ort` strategy and no conflicts. Those commits add `.cursor/environment.json`, `.cursor/install.sh`, and `.gitattributes`.

### Slice 3 — `1b5e0c3` `feat: add walkthrough step coaching`

Coach copy, shown for the current step and hidden together with the step rail while `guidedOpen` is true:

- Research: “Why does this idea interest you? Don't pick a stock yet.”
- Finance: “Look at ten years of numbers before you write a story.”
- Thesis: “Write down what would prove you wrong.”
- Decision: “Record your stance and what would make you reconsider.”
- Reflect: “This is the product: a playbook of your habits, not a return score.”

Files: `src/components/prototype/PrototypeApp.tsx`, `src/components/prototype/StepRail.tsx`.

### Slice 4 fix

Desktop phone preview is about 340px wide, while the coach row was using the viewport `sm` breakpoint. Inside that frame the sentence was clipped beside the step rail. The coach band is now a container: it sits beside the rail from the `@md` container size (28rem) upward, and stacks underneath in the phone frame and at 390px.

File: `src/components/prototype/PrototypeApp.tsx`.

## Verification

Isolated headless Chrome contexts on `http://127.0.0.1:3001/` (`next start` with `API_BASE_URL=http://127.0.0.1:5080`). The .NET API was the local fixture server. Disposable values were `slice4-harborline-note` and `slice4-circle-note`. Each context started from cleared `localStorage`.

Viewports checked: **1440×900**, **768×900**, and **390×844**. Measured `clientWidth` values were 1440, 768, and 390.

| Check | Result |
| --- | --- |
| Fresh visit shows the briefing. Keyboard Tab reaches Start with a visible outline. Enter dismisses it, writes the dismissal key, and focuses `#prototype-walkthrough`. | Passed |
| A separate 390px session: Skip does the same dismissal and focus move. | Passed |
| Reload after Start stays on the walkthrough. | Passed |
| Hero and header “Try the walkthrough” links scroll `#prototype` to within 48px of the top. | Passed |
| 1440px default layout: walkthrough width 1088px, bezel notch `display: none`, no horizontal overflow. Coach sits beside the rail (303px wide). | Passed |
| Desktop phone preview: walkthrough width 392px, notch `display: flex`, Finance remains current, Harborline note and `dataset.live` remain, coach box 294×39 and fully inside the walkthrough. | Passed |
| 768px: walkthrough width 704px, notch hidden, phone-preview toggle `display: none`, Harborline note and `dataset.live` remain, no horizontal overflow. | Passed |
| 390px: walkthrough width 350px, notch hidden, coach stacked under the rail at 310px wide, no horizontal overflow. | Passed |
| Returning the viewport above 1024px keeps `dataset.live === "keep"`. | Passed |
| All five coach sentences render with `white-space: normal`. | Passed |
| Guided Apple “Your Circle of Competence” and `slice4-circle-note` survive toggling phone preview off and on. Step rail and coach are absent. | Passed |
| Reload keeps the briefing dismissed. Choosing Finance resumes the saved Circle of Competence screen and note. Exit guide restores the Finance coach and the step rail. | Passed |
| Restart returns to Research, removes the Harborline note, leaves `aic.appleGuidedAnalysis.v1` byte-identical, and does not show the briefing. | Passed |
| “Reset guided Apple analysis” opens a dialog titled “Reset guided Apple analysis?” with a “Reset analysis” action. Cancel closes it and leaves the saved analysis unchanged. | Passed |
| Enter on the focused Thesis step selects it. A later Tab lands on a button. | Passed |
| Application console: no error, warning, page error, or hydration message. | Passed |

### Automated checks

After the phone-preview coach fix, on the source that was then verified in the browser:

- `npm test` — 12 passed, 0 failed (`tsc -p tsconfig.test.json` and `node --test`).
- `npm run typecheck` — passed.
- `npm run lint` — passed.
- `npm run build` — passed (Next.js 16.2.12).

No dependency or test framework was added.

## Screenshots

- `docs/deployment/evidence/slice4-briefing-1440.png`
- `docs/deployment/evidence/slice4-briefing-390.png`
- `docs/deployment/evidence/slice4-finance-1440.png`
- `docs/deployment/evidence/slice4-finance-390.png`
- `docs/deployment/evidence/slice4-desktop-phone-preview.png`
- `docs/deployment/evidence/slice4-apple-guide-hidden-rail.png`

The Apple guide screenshot shows Circle of Competence with the step rail and coach strip hidden.

## Limitations

- Verification used the local production server on port 3001 and the local fixture API. The `next dev` process on port 3000 was not the browser target.
- The browser driver was puppeteer-core installed outside this repository, against system Chrome. It is not a project dependency.
- Reset confirmation was checked by opening the dialog and choosing Cancel. “Reset analysis” was not activated.
- Keyboard coverage is Start, Skip, Enter on Thesis, and one Tab inside the restored guide.
- The Harborline observation field is inside the scrolling finance panel, so the section screenshots show the Finance layout and coach. The script read the textarea value directly.
- Phone preview remains session state and returns to the wide layout on reload, as specified.
- The branch has no upstream. It has not been pushed, and no pull request has been opened.
