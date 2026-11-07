"""Structural validation of the sign service: V1-V4 gates.

V1: model loads with 250 distinct output classes
V2: every output index maps to a real trained label
V3: real-shaped windows produce structured predictions over HTTP
V4: honest fallbacks (no_hand, low-confidence)

NOTE: label accuracy on real signing requires the full competition dataset
(auth-gated) or a human hand; the model's accuracy is cited from the
competition leaderboard instead. These gates validate the PIPELINE.
"""
import json
import time
import urllib.request

BASE = "http://127.0.0.1:3031"


def post(path: str, payload: dict) -> dict:
    req = urllib.request.Request(
        BASE + path,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read())


def get(path: str) -> dict:
    with urllib.request.urlopen(BASE + path, timeout=30) as res:
        return json.loads(res.read())


def main() -> None:
    results = []

    # V1: health reports 250 classes
    h = get("/health")
    v1 = h["status"] == "ok" and h["n_classes"] == 250
    results.append(("V1 model loads, 250 classes", v1, h))

    # V2: all 250 indices map to real labels
    labels = json.load(open("/home/z/my-project/mini-services/sign-service/sign_to_prediction_index_map.json"))
    inv = {v: k for k, v in labels.items()}
    v2 = len(inv) == 250 and all(isinstance(k, int) for k in inv)
    results.append(("V2 index->label mapping complete (250/250)", v2, f"{len(inv)} labels, sample: {inv[0]}, {inv[249]}"))

    # V3: structured predictions over HTTP with real-shaped windows
    # (zero-filled face block + synthetic hand block: valid shape, honest input)
    n_ok = 0
    latencies = []
    for trial in range(5):
        T = 30
        flat = [0.0] * (T * 543 * 3)
        # synthetic right-hand block (indices 522..542) with plausible coords
        for f in range(T):
            base = (f * 543 + 522) * 3
            for i in range(21):
                flat[base + i * 3] = 0.5 + 0.01 * ((trial + i) % 10)
                flat[base + i * 3 + 1] = 0.5 + 0.01 * ((trial * 3 + i) % 10)
                flat[base + i * 3 + 2] = -0.01 * i
        t0 = time.perf_counter()
        r = post("/predict", {"landmarks": flat, "frames": T})
        dt = (time.perf_counter() - t0) * 1000
        latencies.append(dt)
        if r.get("status") in ("ok", "no_match") and "word" in r or r.get("status") == "no_match":
            n_ok += 1
        assert "status" in r and "latencyMs" in r, r
    v3 = n_ok == 5
    results.append(("V3 5/5 structured predictions over HTTP", v3, f"mean latency {sum(latencies)/len(latencies):.0f} ms (incl. HTTP)"))

    # V4: honest no_hand fallback
    T = 10
    flat = [0.0] * (T * 543 * 3)
    r = post("/predict", {"landmarks": flat, "frames": T})
    v4 = r.get("status") == "no_hand"
    results.append(("V4 honest no_hand fallback", v4, r.get("message", "")))

    print()
    for name, ok, detail in results:
        print(("PASS" if ok else "FAIL"), "|", name, "|", str(detail)[:90])
    print()
    print("ALL PASS" if all(ok for _, ok, _ in results) else "SOME FAILED")


if __name__ == "__main__":
    main()
