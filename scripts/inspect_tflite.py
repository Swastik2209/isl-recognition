"""Inspect the pretrained Gislr tflite model: input signature, output, custom ops, run test."""
import json
import numpy as np
from ai_edge_litert.interpreter import Interpreter

MODEL = "/home/z/my-project/sign-model/model.tflite"

labels = json.load(open("/home/z/my-project/sign-model/sign_to_prediction_index_map.json"))

interp = Interpreter(model_path=MODEL, num_threads=2)
interp.allocate_tensors()
inputs = interp.get_input_details()
outputs = interp.get_output_details()

print("== INPUTS ==")
for i in inputs:
    print("name:", i["name"], "| shape:", i["shape"], "| dtype:", i["dtype"], "| quant:", i.get("quantization"))
print("== OUTPUTS ==")
for o in outputs:
    print("name:", o["name"], "| shape:", o["shape"], "| dtype:", o["dtype"])

# Try running with a random input of the declared shape
try:
    inp = inputs[0]
    data = np.random.rand(*inp["shape"]).astype(inp["dtype"])
    interp.set_tensor(inp["index"], data)
    interp.invoke()
    out = interp.get_tensor(outputs[0]["index"])
    print("== RUN OK ==")
    print("output shape:", out.shape, "dtype:", out.dtype)
    probs = out.flatten()
    top = probs.argsort()[::-1][:5]
    inv = {v: k for k, v in labels.items()}
    print("top5 (random input):", [(int(t), float(probs[t]), inv.get(int(t), "?")) for t in top])
except Exception as e:
    print("== RUN FAILED ==")
    print(type(e).__name__, str(e)[:500])
