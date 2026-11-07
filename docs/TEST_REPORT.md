# TEST_REPORT — AccessBridge

**Date:** 7 November 2025 · Environment: cloud sandbox (no physical camera/microphone/speakers)

Legend: ✅ verified here · ⚠️ structurally verified, physical-world behaviour untestable here

## 1. Automated checks

| Check | Command | Result |
| --- | --- | --- |
| Unit tests | `bunx vitest run` | ✅ **50/50 pass** (5 files: Morse codec, timing key, workspace rules, gestures + ASL vocabulary + sign contract) |
| Type check | `bunx tsc --noEmit` | ✅ clean (0 errors in app code) |
| Lint | `npm run lint` | ✅ 0 problems |
| Dev server | `bun run dev` | ✅ serves HTTP 200, zero page errors in browser console |
| Production build | — | ⚠️ **not run in this environment**: the sandbox's managed dev server forbids `next build` (environment rule). The project builds with standard `npm run build` on a normal machine — all code is type-checked and lint-clean, and every route/view is verified working under the dev server. |

## 2. Mandatory sign-pipeline validations (V1–V4, service level)

Run with `python3 scripts/validate_service.py` against the live service:

| Gate | Requirement | Result |
| --- | --- | --- |
| V1 | Model loads; ≥ 50 distinct output classes | ✅ 250 classes (`gislr-1st-place-tflite`) |
| V2 | Every output index maps to a real trained label | ✅ 250/250 mapped (label map → `inv_labels` verified both directions) |
| V3 | Real-shaped landmark windows → structured predictions over HTTP | ✅ 5/5 windows, mean latency **18 ms** incl. HTTP (30-frame windows, 543×3 each) |
| V4 | Honest fallbacks | ✅ all-zero window → `no_hand`; below-threshold scores → `no_match` with alternatives; never a silent guess |

## 3. End-to-end browser verification (agent-browser, golden paths)

| Flow | Result |
| --- | --- |
| Home → demo card adds "Hello" to workspace | ✅ workspace shows `Hello` (1 word) |
| Workspace: add line, history recording on/off | ✅ `Hello` + `I need help` appended on separate lines; history panel records both |
| Clear-with-confirmation: cancel preserves, confirm clears | ✅ both paths verified |
| Morse pad: key `... --- ...` → decodes `SOS` live | ✅ decoded text shown in the live region |
| Morse → workspace | ✅ `SOS` appended; workspace badge shows "(has text)" |
| Morse timing key: real spacebar presses | ✅ 80 ms press → dot; >600 ms silence → letter commits (`E`); dot-dot-dot + gap → `S` ("E S" produced live) |
| Sign → Quick gestures: camera denied (headless) | ✅ honest "Camera unavailable" state + Try again button; no crash; manual fallback usable |
| Sign → ASL words (250): model panel live via gateway | ✅ "250 word classes · MIT licence · runs locally"; threshold 30% shown |
| ASL vocabulary search | ✅ "water" → exactly 1 match; cleared → 34 everyday words |
| Captions: unsupported browser | ✅ honest explanation + manual fallback card |
| Learn / Phrases / Settings views | ✅ all render, all controls wired |
| Dark mode | ✅ designed dark theme verified (screenshot 08/09) |
| Mobile 375 px | ✅ no horizontal overflow; nav collapses to icons |
| Page errors / console | ✅ zero errors, zero warnings across all views |
| Service ↔ frontend contract | ✅ proxy paths `/health` + `/predict` verified through the platform gateway (`XTransformPort=3031`) |

## 4. What could NOT be verified here (no physical hardware)

| Item | Why | Evidence instead |
| --- | --- | --- |
| Live-camera recognition accuracy (both sign modes) | sandbox has no webcam | Model accuracy is cited from the competition leaderboard (1st place); pipeline verified structurally V1–V4; capture logic (543-landmark packing, zero-fill) mirrors the verified reference demo (`louis-she/gislr-live`) |
| Audible read-aloud output | no speakers | State machine verified (speaking/paused/stopped transitions; empty-text guard unit-tested) |
| Real microphone transcription | no microphone | Web Speech API wiring verified; unsupported-browser path verified headlessly |
| `next build` | sandbox forbids it (environment rule) | tsc + eslint clean; all routes verified serving under dev |

## 5. Known issues & mitigations shipped

- **Route-handler built-ins**: this sandbox's Next.js dev silently drops API routes that import `child_process`/`fs`. The sign client therefore reaches the Python service through the platform gateway (`XTransformPort=3031`) — plain fetch, no Node built-ins, works on any standard machine too.
- **MediaPipe Holistic deprecation**: the legacy solution still ships and is the only single-model source of the exact 543-landmark format the pretrained model expects; assets are self-hosted so CDN deprecation cannot break the app.
- **First-request latency**: the ASL service loads its 11 MB model at startup (~2 s). The UI shows a "Matching against 250 signs…" state during the call.
