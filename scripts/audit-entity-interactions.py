#!/usr/bin/env python3
"""Stream every entity file for interaction contracts without browser memory overhead."""

from __future__ import annotations

import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parent.parent
ENTITY_DIRECTORY = ROOT / "entity"
TAB = re.compile(r'class="tab-btn[^"]*"[^>]*data-tab="([^"]+)"')
PANEL = re.compile(r'<div class="tab-panel[^"]*" id="tab-([^"]+)"')
PLACEHOLDER_LINK = re.compile(r'<a\b[^>]*href="#"[^>]*>')


def main() -> int:
    index = json.loads((ROOT / "assets" / "search-index.json").read_text(encoding="utf-8"))
    statuses = {f"{record['s']}.html": record.get("status", "draft") for record in index}
    tab_issues = []
    placeholder_issues = []
    missing_widgets = []
    stub_pages = 0
    files = sorted(ENTITY_DIRECTORY.glob("*.html"))
    for path in files:
        source = path.read_text(encoding="utf-8")
        tabs = TAB.findall(source)
        panels = PANEL.findall(source)
        if statuses.get(path.name) in {"stub", "quarantined"}:
            stub_pages += 1
        elif len(tabs) != 12 or len(set(tabs)) != len(tabs) or any(tab not in panels for tab in tabs):
            tab_issues.append({"file": path.name, "tabs": len(tabs), "panels": len(panels)})
        if "../assets/widgets.js" not in source:
            missing_widgets.append(path.name)
        for match in PLACEHOLDER_LINK.finditer(source):
            if "js-rand" not in match.group(0):
                placeholder_issues.append({"file": path.name, "markup": match.group(0)})
    print(json.dumps({
        "files": len(files),
        "stubPagesExcludedFromTabContract": stub_pages,
        "tabIssueCount": len(tab_issues),
        "tabIssues": tab_issues[:30],
        "missingWidgetCount": len(missing_widgets),
        "missingWidgets": missing_widgets[:30],
        "placeholderIssueCount": len(placeholder_issues),
        "placeholderIssues": placeholder_issues[:30],
    }, ensure_ascii=False))
    return 1 if tab_issues or missing_widgets or placeholder_issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
