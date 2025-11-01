#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
merge_content_parts_v2.py

기능:
- content_index_for_name/html/attach.json 을 병합하여 content_index.json 생성
- 우선순위: name > html > attach
- 키: (html_file, folder)

기본값:
--name   ./data/content_index_for_name.json
--html   ./data/content_index_for_html.json
--attach ./data/content_index_for_attach.json
--out    ./data/content_index.json
"""
import argparse, json, sys
from pathlib import Path

def load_json_list(p: Path):
    if not p: 
        return []
    if not p.exists():
        print(f"[WARN] not found: {p}", file=sys.stderr)
        return []
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return data
        print(f"[WARN] expected list in {p}, got {type(data)}", file=sys.stderr)
        return []
    except Exception as e:
        print(f"[WARN] failed reading {p}: {e}", file=sys.stderr)
        return []

def uniq(seq):
    seen = set()
    out = []
    for x in seq:
        if x in seen: 
            continue
        seen.add(x)
        out.append(x)
    return out

def merge_records(dst: dict, src: dict, label: str):
    # 기본키
    for k in ("html_file", "folder"):
        if k in src and k not in dst:
            dst[k] = src[k]

    # 공통 메타
    for k in ("date", "html_text_ref"):
        if not dst.get(k) and src.get(k):
            dst[k] = src.get(k)

    # source(dict) 보충
    if "source" not in dst or not dst.get("source"):
        if src.get("source"):
            dst["source"] = src["source"]
    else:
        if src.get("source"):
            for sk in ("html_path", "files_dir"):
                if not dst["source"].get(sk) and src["source"].get(sk):
                    dst["source"][sk] = src["source"][sk]

    # tags/subtags 합집합
    for k in ("tags", "subtags"):
        cur = dst.get(k) or []
        add = src.get(k) or []
        dst[k] = uniq(cur + add)

    # 파트 전용 필드: 존재하면 그대로 반영
    for k in ("keywords_name", "summary_name",
              "keywords_html", "summary_html",
              "keywords_attach", "summary_file"):
        if k in src and src.get(k) is not None:
            dst[k] = src.get(k)

    # attachments 병합 (filename, text_ref 기준 중복 제거)
    if src.get("attachments"):
        base = dst.get("attachments") or []
        exist = {(a.get("filename"), a.get("text_ref")) for a in base}
        for a in src["attachments"]:
            key = (a.get("filename"), a.get("text_ref"))
            if key not in exist:
                base.append(a)
                exist.add(key)
        dst["attachments"] = base

    # 기타 필드는 첫 발견 값 유지
    for k, v in src.items():
        if k in dst:
            continue
        dst[k] = v

    return dst

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--name", type=str, default="./data/content_index_for_name.json")
    ap.add_argument("--html", type=str, default="./data/content_index_for_html.json")
    ap.add_argument("--attach", type=str, default="./data/content_index_for_attach.json")
    ap.add_argument("--out", type=str, default="./data/content_index.json")
    args = ap.parse_args()

    name_list = load_json_list(Path(args.name))
    html_list = load_json_list(Path(args.html))
    attach_list = load_json_list(Path(args.attach))

    merged = {}

    def add_list(lst, label):
        for rec in lst:
            key = (rec.get("html_file"), rec.get("folder"))
            if key not in merged:
                merged[key] = {}
            merged[key] = merge_records(merged[key], rec, label)

    # 우선순위: name -> html -> attach
    add_list(name_list, "name")
    add_list(html_list, "html")
    add_list(attach_list, "attach")

    out_items = list(merged.values())
    out_items.sort(key=lambda r: (r.get("folder") or "", r.get("html_file") or ""))

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_items, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[WRITE] {out_path} ({len(out_items)} items)")

if __name__ == "__main__":
    main()
