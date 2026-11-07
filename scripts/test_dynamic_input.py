"""Test if the tflite input is dynamic: can it accept (T, 543, 3) sequences?"""
import numpy as np
from ai_edge_litert.interpreter import Interpreter

MODEL = "/home/z/my-project/sign-model/model.tflite"

for T in (8, 32, 64):
    try:
        interp = Interpreter(model_path=MODEL, num_threads=2)
        interp.resize_tensor_input(0, (T, 543, 3))
        interp.allocate_tensors()
        data = np.random.rand(T, 543, 3).astype(np.float32)
        interp.set_tensor(interp.get_input_details()[0]["index"], data)
        interp.invoke()
        out = interp.get_tensor(interp.get_output_details()[0]["index"])
        print(f"T={T}: OK, output shape {out.shape}")
    except Exception as e:
        print(f"T={T}: FAILED -> {type(e).__name__}: {str(e)[:200]}")

# Also print all tensor shapes to understand internal structure
interp = Interpreter(model_path=MODEL, num_threads=2)
interp.allocate_tensors()
print("\n== ALL TENSORS (sample) ==")
for d in interp.get_tensor_details()[:30]:
    print(d["index"], d["name"][:60], d["shape"])
