import json
from pathlib import Path

RESULTS_DIR = Path("D:/CryptoAnalyzer/experiments/results")

experiments = ["EXP_A_PRICE", "EXP_B_PRICE_VOL", "EXP_C_TECH_IND", "EXP_D_FULL"]

combined = {}

for exp in experiments:
    file_path = RESULTS_DIR / f"{exp}_baselines.json"
    if file_path.exists():
        with open(file_path) as f:
            combined[exp] = json.load(f)
        print(f"Loaded {exp}: {list(combined[exp].keys())}")
    else:
        print(f"Missing: {file_path}")

output_path = RESULTS_DIR / "all_baselines_results.json"
with open(output_path, "w") as f:
    json.dump(combined, f, indent=2)

print(f"Combined results saved to {output_path}")
print(f"Experiments in combined: {list(combined.keys())}")