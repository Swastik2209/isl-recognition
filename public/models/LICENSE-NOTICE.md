# Models & self-hosted assets — licence notices

All model/WASM assets in `public/` are self-hosted so that AccessBridge makes **zero third-party requests** at runtime.

| File(s) | Source | Licence | Notes |
| --- | --- | --- | --- |
| `public/models/gesture_recognizer.task` | Google MediaPipe — https://storage.googleapis.com/mediapipe-models/gesture_recognizer/gesture_recognizer/float16/1/gesture_recognizer.task | Apache-2.0 (Google LLC) | Recognises exactly 7 canned gestures (labels verified from the binary: Closed_Fist, ILoveYou, Open_Palm, Pointing_Up, Thumb_Down, Thumb_Up, Victory + None) |
| `public/wasm/*` (vision_wasm_*.js/.wasm) | `@mediapipe/tasks-vision` npm package | Apache-2.0 (Google LLC) | Runtime WASM for tasks-vision |
| `public/mediapipe/holistic/*` | `@mediapipe/holistic` npm package | Apache-2.0 (Google LLC) | Legacy Holistic solution: produces the 543-landmark format (face 468 / lh 21 / pose 33 / rh 21) |
| `mini-services/sign-service/model.tflite` | https://huggingface.co/sign/kaggle-asl-signs-1st-place (MIT) — 1st-place solution, Google Isolated Sign Language Recognition competition | MIT | See `mini-services/sign-service/LICENSE-NOTICE.md` |
| `mini-services/sign-service/sign_to_prediction_index_map.json` | Official ASL-signs vocabulary (Google, CC-BY 4.0 data) | CC-BY 4.0 | 250 classes; the source of truth for `src/lib/asl-vocab.ts` (generated) |
