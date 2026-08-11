#!/usr/bin/env python3
"""Repair imported UTF-8 text that was decoded as Windows-1252/Latin-1."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

from ftfy import fix_text
from ftfy.badness import badness


ROOT = Path(__file__).resolve().parent.parent
TEXT_SUFFIXES = {".html", ".js", ".json", ".css", ".md", ".xml", ".webmanifest"}
SUSPICIOUS = re.compile(r"[\u00c2\u00c3\u00e2\u00c5\u00c4\u00d0\u00d1]")


def repair_text(value: str) -> str:
    repaired = fix_text(value, normalization="NFC")
    return repaired if badness(repaired) < badness(value) else value


def candidate_files() -> list[Path]:
    files = [path for path in ROOT.iterdir() if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES]
    for directory_name in ("assets", "data", "docs", "entity", "wings"):
        directory = ROOT / directory_name
        if directory.exists():
            files.extend(path for path in directory.rglob("*") if path.is_file() and path.suffix.lower() in TEXT_SUFFIXES)
    return sorted(set(files))


def read_exact(path: Path) -> str:
    with path.open("r", encoding="utf-8", newline="") as handle:
        return handle.read()


def write_exact(path: Path, value: str) -> None:
    with path.open("w", encoding="utf-8", newline="") as handle:
        handle.write(value)


def run(check_only: bool) -> dict[str, object]:
    scanned = changed = candidates = 0
    samples: list[str] = []
    for path in candidate_files():
        scanned += 1
        source = read_exact(path)
        if not SUSPICIOUS.search(source):
            continue
        candidates += 1
        repaired = repair_text(source)
        if repaired == source:
            continue
        changed += 1
        if len(samples) < 30:
            samples.append(str(path.relative_to(ROOT)))
        if not check_only:
            write_exact(path, repaired)
    return {"filesScanned": scanned, "candidates": candidates, "filesNeedingRepair": changed, "samples": samples}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="report without writing")
    parser.add_argument("--text", help="repair one argument and print it without a newline")
    args = parser.parse_args()
    if args.text is not None:
        print(repair_text(args.text), end="")
        return 0
    print(json.dumps(run(args.check), ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
