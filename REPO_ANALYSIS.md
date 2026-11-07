# REPO_ANALYSIS — AccessBridge Foundations

**Date:** 7 November 2025 (rebuilt session)
**Scope:** which existing open-source work AccessBridge builds on, what was reused, what was written from scratch, and why.

---

## 1. What AccessBridge needed

AccessBridge is a laptop-first, browser-based communication aid with four features flowing into one shared text workspace:

1. **Sign to Text** — webcam recognition of signs/gestures → phrases/words
2. **Morse Decoder** — dots/dashes → text (pad, typing, real timing key)
3. **Live Captions** — speech → text
4. **Read Aloud** — text → speech

The hard requirement that shaped everything: **recognition must actually work on a normal laptop webcam**, run **locally wherever possible**, and be **honest about what it recognises** (no fake predictions, no pretending a gesture board translates sign language).

## 2. Candidates examined

| Candidate | What it is | Verdict |
| --- | --- | --- |
| **google-ai-edge/mediapipe-samples** (Apache-2.0) | Official web samples for MediaPipe Tasks (GestureRecognizer, HandLandmarker, …) | **Selected** — the `gesture_recognizer` web sample defines the exact in-browser recognition pattern AccessBridge uses |
| **sign/kaggle-asl-signs-1st-place** (Hugging Face, MIT) | The winning model of Google's *Isolated Sign Language Recognition* competition, as `model.tflite` (11 MB) + the 250-sign vocabulary | **Selected** for the ASL-words mode — pretrained on Google's MediaPipe landmark data, downloads without login, runs under LiteRT with no custom ops |
| **louis-she/gislr-live** (live webcam demo of the same competition) | Browser demo that feeds MediaPipe **Holistic** landmarks (543 per frame) to a competition model | **Reference** — validated the exact landmark packing order `[face 468, left hand 21, pose 33, right hand 21]` and the zero-fill convention for missing hands |
| **ffs333/2nd_place_GISLR** (MIT) | 2nd-place solution with inference notebooks | **Reference** — confirmed the `(543, 3)`-per-frame input contract used by competition models |
| AI4Bharat **INCLUDE** (video dataset) | Indian Sign Language video corpus | Considered in earlier iterations; videos require heavy download/extraction and video-trained models suffered a live-camera domain gap. Superseded by the pretrained landmark-native model. |
| Kaggle landmark datasets (eraakash ISL letters, rayeed045 digits, HaGRID) | Landmark corpora used in an earlier in-house-trained model | Used historically; this rebuild standardises on the two selected foundations above for maintainability |

## 3. What is reused vs. written fresh

### Reused as-is / self-hosted
- **`@mediapipe/tasks-vision`** runtime + **`gesture_recognizer.task`** model (float16, 8.4 MB). Both are self-hosted from `public/wasm` and `public/models` — **no third-party requests at runtime**. The seven embedded gesture labels (`Closed_Fist, ILoveYou, Open_Palm, Pointing_Up, Thumb_Down, Thumb_Up, Victory` + `None`) were verified from the model binary itself, not from documentation.
- **`@mediapipe/holistic`** (legacy JS solution) — the only browser model that produces the exact 543-landmark Holistic format the ASL competition model was trained on. Assets self-hosted in `public/mediapipe/holistic`.
- **Pretrained `model.tflite` + `sign_to_prediction_index_map.json`** — served by the local FastAPI service from `mini-services/sign-service/`. Input `(T, 543, 3)` float32, output 250 scores; verified dynamically resizable across T = 8/32/64 frames and running under `ai-edge-litert` with standard ops.

### Written for AccessBridge (no suitable reusable component existed)
- The **shared workspace** state layer (append-only rule, history, persistence).
- The **Morse engine**: International Morse codec, the timing-key state machine (dot/dash thresholds, letter/word gaps, manual close controls) and its calibration UI.
- The **auto-commit policy** for quick gestures (hold-to-commit with honest reset behaviour).
- The **capture pipeline** for ASL words: 3-2-1 countdown pacing (learned from field testing — an immediate window records idle frames and produces confidently wrong predictions), landmark packing, honest `no_hand` / `no_match` handling, margins and alternatives.
- All UI, the accessible design system, and the FastAPI service wrapper.

## 4. Licensing & attribution

| Component | Licence | Obligation |
| --- | --- | --- |
| MediaPipe tasks-vision + gesture model | Apache-2.0 | Keep notices; no endorsement |
| `@mediapipe/holistic` assets | Apache-2.0 (Google) | Keep notices |
| Gislr 1st-place tflite + label map | MIT (per HF model card) | Keep copyright notice — see `mini-services/sign-service/LICENSE-NOTICE.md` |
| Google asl-signs training data (upstream of the model) | CC-BY 4.0 | Attribution in docs |
| Next.js scaffold, shadcn/ui, Tailwind, lucide-react | MIT | Standard notices |

All licence files/notices are preserved in `public/models/LICENSE-NOTICE.md` and the service folder. Nothing unlicensed was copied.

## 5. Implementation strategy that resulted

1. **In-browser first**: quick-gesture recognition runs entirely on-device with the self-hosted model — instant, private, zero-install. This is the default mode because it *works on any webcam*.
2. **Local service for the big vocabulary**: the 250-class model is 11 MB and runs comfortably in LiteRT on a CPU; a 2-3 line FastAPI service keeps the browser light and the model loaded once. Landmarks (numbers, never video) go only to `127.0.0.1`.
3. **Same landmark family across capture and training data** (MediaPipe Holistic) — this is the fix for the historical "hello → paint" mis-recognition: the model sees exactly the kind of data it was trained on.
4. **Honesty as a feature**: every uncertain state (no hand, no confident match, close margin, service offline, camera denied) has a designed, labelled state instead of a guess.
