from datasets import load_dataset
import pandas as pd

print("Loading dataset...")
ds = load_dataset("nutthakorn7/SALAD-SOC", split="train")
df = ds.to_pandas()
print(df.head())
print(df.columns)
