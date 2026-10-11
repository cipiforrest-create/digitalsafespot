"""Translate extracted site segments with local OPUS-MT models."""

from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer


HERE = Path(__file__).resolve().parent
os.environ.setdefault("HF_HUB_DISABLE_XET", "1")


def run_model(model_name: str, texts: list[str], batch_size: int = 64) -> list[str]:
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
    torch.set_num_threads(max(1, min(8, os.cpu_count() or 1)))
    model.eval()
    progress_path = HERE / f".{model_name.rsplit('/', 1)[-1]}-progress.json"
    output: list[str] = json.loads(progress_path.read_text(encoding="utf-8")) if progress_path.exists() else []
    for start in range(len(output), len(texts), batch_size):
        batch = texts[start : start + batch_size]
        encoded = tokenizer(batch, return_tensors="pt", padding=True, truncation=True, max_length=512)
        with torch.inference_mode():
            generated = model.generate(**encoded, max_new_tokens=512, num_beams=1)
        output.extend(tokenizer.batch_decode(generated, skip_special_tokens=True))
        progress_path.write_text(json.dumps(output, ensure_ascii=False), encoding="utf-8")
        print(f"{min(start + batch_size, len(texts))}/{len(texts)}", flush=True)
    progress_path.unlink(missing_ok=True)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--lang", choices=("en", "de"), required=True)
    args = parser.parse_args()
    source = json.loads((HERE / "localization-segments.json").read_text(encoding="utf-8"))
    english_path = HERE / "translations-en.json"
    if args.lang == "en":
        translated = run_model("Helsinki-NLP/opus-mt-sla-en", source)
    else:
        if not english_path.exists():
            raise SystemExit("Generate translations-en.json first")
        english_map = json.loads(english_path.read_text(encoding="utf-8"))
        english = [english_map[text] for text in source]
        translated = run_model("Helsinki-NLP/opus-mt-en-de", english)
    target = HERE / f"translations-{args.lang}.json"
    target.write_text(json.dumps(dict(zip(source, translated)), ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {target}")


if __name__ == "__main__":
    main()