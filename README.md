# AccessBridge

**One accessible page where gestures, Morse code, captions and read-aloud all flow into a single shared text workspace.**

AccessBridge is a laptop-first web application for people who communicate best through different input and output methods. Everything runs locally in your browser — no accounts, no uploads, no tracking.

---

## What it does

| Feature | How it works | Goes where |
| --- | --- | --- |
| **Sign to Text — Quick gestures** | Google's pretrained MediaPipe GestureRecognizer (7 gestures, self-hosted model) runs in your browser. Hold a gesture ~0.5 s and its phrase is added automatically. | Shared workspace |
| **Sign to Text — ASL words (250)** | A short, countdown-paced capture is matched against the **pretrained winner of Google's Isolated Sign Language Recognition challenge** (250 word classes, MIT licence) running in a small local service. Honest "no confident match" instead of guesses. | Shared workspace |
| **Morse Decoder** | On-screen pad, direct `. -` typing, or a real **timing key** on the spacebar with adjustable thresholds and a live measured-pulse timeline. Unknown sequences decode to `[?]`. | Shared workspace |
| **Live Captions** | The browser's Web Speech API turns speech into text, with confirmed vs. interim wording shown separately. | Shared workspace |
| **Read Aloud** | Speech synthesis reads the *actual* workspace text with voice + rate controls, pause/resume, and honest unsupported states. | — |

Everything a feature produces is **appended on its own line** in the shared workspace — never overwriting. From there you edit, copy, download as `.txt`, or read aloud.

## Screenshots

`screenshots/` (delivered alongside the source) shows every view: home, both sign modes, the timing key mid-keying, captions, learn, phrases, dark mode, workspace, and mobile.

## Technologies

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui**
- **@mediapipe/tasks-vision** (gesture recognition, in-browser, self-hosted WASM + model)
- **@mediapipe/holistic** (543-landmark capture for the ASL-words mode, self-hosted)
- **FastAPI + LiteRT (`ai-edge-litert`)** for the local 250-class sign service
- **Vitest** for unit tests

## Prerequisites

- **Node.js 20+** (or Bun 1.1+) — <https://nodejs.org>
- **Python 3.11/3.12** with `pip` — only needed for the ASL-words mode
- A **webcam** and/or **microphone** for the camera/mic features (everything else works without)
- **Chrome or Edge** recommended: live captions and speech synthesis depend on the browser's speech engines

## Install & run (exact commands)

```bash
# 1. Frontend (from the project root)
bun install          # or: npm install
bun run dev          # or: npm run dev
# → http://localhost:3000

# 2. Sign service for the ASL-words mode (new terminal, same machine)
python3 -m pip install fastapi "uvicorn[standard]" numpy ai-edge-litert
python3 mini-services/sign-service/app.py
# → serves 127.0.0.1:3031 (loopback only; the browser reaches it through the app's gateway)
```

The **Quick gestures** mode, Morse, Captions, Read Aloud and the whole workspace work **without** the Python service. Starting the service adds the 250-word ASL vocabulary mode; if it is not running, the UI says so honestly and everything else keeps working.

### Production build

```bash
npm run build        # creates the production build
npm start            # serves it (http://localhost:3000)
```

### Tests, types, lint

```bash
bunx vitest run      # 50 unit tests (Morse codec, timing key, workspace rules, gestures, vocabulary, service contract)
bunx tsc --noEmit    # TypeScript, no errors
npm run lint         # ESLint, clean
```

## Browser requirements

| Feature | Requirement |
| --- | --- |
| Quick gestures | Any modern browser with `getUserMedia` (camera). Recognition runs on-device via WASM; no network needed after first load. |
| ASL words (250) | Camera + the local Python service running. Landmarks — never video — go to `127.0.0.1:3031`. |
| Live captions | Web Speech API: Chrome/Edge, microphone permission, and network access to the browser vendor's speech service. |
| Read aloud | Speech Synthesis API (available in all major browsers). |

**HTTPS note:** browsers only grant camera/microphone access on `https://` pages or on `localhost`. If you deploy AccessBridge to a LAN address over plain HTTP, device permissions will be blocked — serve it over HTTPS or test from `localhost`.

## The ASL-words model

- **File:** `mini-services/sign-service/model.tflite` (11 MB) + `sign_to_prediction_index_map.json` (250 classes)
- **Origin:** <https://huggingface.co/sign/kaggle-asl-signs-1st-place> — the 1st-place solution of Google's *Isolated Sign Language Recognition* competition, trained on Google's MediaPipe-landmark ASL dataset (CC-BY 4.0 data, MIT model code)
- **Input contract (verified empirically):** dynamic-length `(T, 543, 3)` float32 — MediaPipe Holistic landmarks per frame in the order *face 468, left hand 21, pose 33, right hand 21*; missing hands are zero-filled
- **Behaviour:** scores → softmax; below the 30 % confidence threshold the service answers `no_match` instead of guessing; the top-3 alternatives are always shown so a human can correct a near-miss with one click
- The vocabulary module `src/lib/asl-vocab.ts` is **generated from the label map itself** — the UI always displays the model's real classes

## Project layout

```
src/
  app/page.tsx                  → renders the single-page app
  app/api/                      → (scaffold health route)
  components/accessbridge/      → app shell + 8 views
  hooks/                        → workspace, settings, library, captions,
                                  read-aloud, sign-recognition, asl-words
  lib/                          → morse, keying, gestures, sign-client,
                                  asl-vocab (generated), workspace, phrases, stores
mini-services/sign-service/     → FastAPI + pretrained tflite model
public/models, public/wasm      → self-hosted MediaPipe assets (no CDN)
public/mediapipe/holistic       → self-hosted Holistic assets
tests/                          → Vitest unit tests
docs/                           → SIGN_RECOGNITION_UPGRADE.md, TEST_REPORT.md
```

## Privacy

- **Nothing is uploaded.** There is no server-side storage, no analytics, no accounts.
- Quick-gesture recognition, Morse, workspace and read-aloud are **100 % on-device**.
- ASL-words sends **landmark numbers only** (never video/audio) to the service on your own machine (`127.0.0.1`).
- Live captions use your **browser vendor's** speech service (Chromium sends audio to Google's speech servers when you use Chrome's Web Speech API — this is a browser feature, disclosed here).
- Workspace text, settings, and custom phrases live in your browser's `localStorage`. Clearing site data removes everything.
- Camera and microphone are requested **only** when you activate the matching feature, and the camera is fully released on stop.

## Known limitations (honest)

1. **Quick gestures are a communication board, not sign language.** Seven fixed hand shapes → seven phrases. They do not translate ASL/ISL grammar or continuous signing.
2. **ASL-words is isolated-word recognition.** One sign per capture, after the GO countdown, hand(s) in frame. It will not follow conversational signing. Accuracy on your specific camera/lighting varies; weak matches are refused rather than guessed — expect some `no confident match` results, which is by design.
3. **Sign vocabulary is ASL-based.** The 250 classes come from an ASL dataset; they are not ISL labels and the two are not interchangeable.
4. **Live captions** need Chrome/Edge + network; other browsers fall back to the manual text path.
5. **Read-aloud pause/resume** depends on the browser's implementation and is feature-detected.
6. **First load** of each camera mode downloads its self-hosted model (8.4 MB for gestures; the ASL service loads its 11 MB model at service startup).

## Attribution & licences

- MediaPipe (tasks-vision, holistic) — Google, Apache-2.0
- Gesture recognizer model — Google MediaPipe, Apache-2.0
- ASL-words model & label map — `sign/kaggle-asl-signs-1st-place`, MIT (notices in `mini-services/sign-service/LICENSE-NOTICE.md`)
- Google Isolated Sign Language Recognition dataset — Google, CC-BY 4.0
- Next.js, React, Tailwind CSS, shadcn/ui, lucide-react, Vitest — their respective MIT/Apache licences

## Documentation

- `REPO_ANALYSIS.md` — foundations, what was reused and why
- `docs/SIGN_RECOGNITION_UPGRADE.md` — how the 7-gesture → 250-class upgrade works, with validation evidence
- `docs/TEST_REPORT.md` — what was tested, what passed, what could not be verified here
- `AccessBridge-Design-Course-Report.pdf` — the in-depth design-course report (what/why/how/hurdles)
- `miro-board/` — importable Miro board package explaining the whole project
