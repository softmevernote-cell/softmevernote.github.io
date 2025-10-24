#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collect_file_info_v3.py

기능 요약
- 여러 개의 문서폴더 인자 처리 (하위 재귀 검색)
- --base 기반 디렉토리 지정 (예: --base ../)
- 문서폴더 인자에 와일드카드(*, ?) 허용. 예: "내 노트*"
- 절대경로와 와일드카드 혼용 가능
- HTML 파일과 동일 경로의 "<stem> files" 디렉토리에서 첨부파일 목록 수집
- 결과를 files.json 형식으로 출력 (물리 경로 미변경, 읽기 전용)

출력 JSON 구조 (배열):
[
  {
    "html_file": "문서폴더/서브경로/파일명",  # 확장자 제거 (폴더 라벨 기준 상대경로)
    "folder": "문서폴더",                    # 폴더 라벨 (와일드카드 확장 후, 매칭된 실제 폴더명)
    "files": [ "첨부1.ext", "첨부2.ext", ... ]
  },
  ...
]

사용 예시:
  # ../ 하위에서 "내 노트*" 패턴에 맞는 모든 폴더 처리
  python collect_file_info_v3.py --base ../ "내 노트*" --out /mnt/data/files.json

  # 절대 경로와 상대(패턴) 혼용
  python collect_file_info_v3.py --base ../ "/abs/path/Docs*" "내 노트 (15)" --out files.json
"""

import argparse
import json
import sys
import glob
from pathlib import Path
from typing import List, Dict, Any, Tuple

def list_htmls(base: Path) -> List[Path]:
    """재귀적으로 *.html 수집"""
    return sorted(base.rglob("*.html"))

def expand_one_arg_to_paths(folder_arg: str, base_root: Path) -> List[Path]:
    """
    folder_arg를 실제 경로 리스트로 확장.
    - 절대경로 + 와일드카드: glob로 확장
    - 절대경로 (와일드카드 없음): 그대로
    - 상대경로 + 와일드카드: (base_root / pattern)으로 glob 확장
    - 상대경로 (와일드카드 없음): base_root / folder_arg
    """
    p = Path(folder_arg)
    has_wildcard = any(ch in folder_arg for ch in ["*", "?"])

    if p.is_absolute():
        if has_wildcard:
            return [Path(x).resolve() for x in glob.glob(folder_arg)]
        return [p.resolve()]
    else:
        pattern = str((base_root / folder_arg).resolve()) if has_wildcard else None
        if has_wildcard:
            return [Path(x).resolve() for x in glob.glob(pattern)]
        return [(base_root / folder_arg).resolve()]

def derive_folder_label(matched_path: Path, base_root: Path) -> str:
    """
    폴더 라벨을 결정:
    - base_root 하위면 base_root 기준 상대 경로의 첫 토큰(최상위 디렉토리명)
    - 아니면 matched_path.name (리프 폴더명)
    """
    try:
        rel = matched_path.relative_to(base_root)
        # 첫 토큰
        parts = rel.parts
        return parts[0] if parts else matched_path.name
    except Exception:
        return matched_path.name

def collect_for_folder(folder_label: str, folder_path: Path) -> List[Dict[str, Any]]:
    """단일 폴더에 대해 HTML과 첨부 목록 수집"""
    records: List[Dict[str, Any]] = []
    if not folder_path.exists() or not folder_path.is_dir():
        print(f"[WARN] 디렉토리가 아님 또는 없음: {folder_path}", file=sys.stderr)
        return records

    html_paths = list_htmls(folder_path)
    for html_path in html_paths:
        stem = html_path.stem  # 확장자 제거
        files_dir = html_path.with_name(f"{stem} files")

        files_list: List[str] = []
        if files_dir.exists() and files_dir.is_dir():
            for p in sorted(files_dir.iterdir()):
                if p.is_file():
                    files_list.append(p.name)

        # folder_path 기준 상대경로(확장자 제거)
        rel = html_path.relative_to(folder_path)
        rel_no_ext = rel.with_suffix("")  # "sub/dir/파일명"
        html_file_field = str(Path(folder_label) / rel_no_ext).replace("\\", "/")

        records.append({
            "html_file": html_file_field,
            "folder": folder_label.replace("\\", "/"),
            "files": files_list
        })
    return records

def main():
    ap = argparse.ArgumentParser(description="Collect HTML and attachment file info from multiple document folders (with base and wildcard support).")
    ap.add_argument("folders", nargs="+", help="문서폴더 경로 또는 패턴(여러 개 가능). 예: '내 노트*'")
    ap.add_argument("--base", default=".", help="기반 디렉토리 (기본값: 현재 폴더). 절대 경로 폴더가 주어지면 무시됨.")
    ap.add_argument("--out", default="files.json", help="출력 파일 경로 (기본값: files.json)")
    args = ap.parse_args()

    base_root = Path(args.base).resolve()

    # 1) 인자별로 실제 경로로 확장
    expanded: List[Tuple[str, Path]] = []
    for folder_arg in args.folders:
        paths = expand_one_arg_to_paths(folder_arg, base_root)
        if not paths:
            print(f"[WARN] 패턴에 해당하는 폴더 없음: {folder_arg}", file=sys.stderr)
            continue
        for path in paths:
            if not path.exists() or not path.is_dir():
                print(f"[WARN] 디렉토리가 아님 또는 없음(건너뜀): {path}", file=sys.stderr)
                continue
            label = derive_folder_label(path, base_root)
            expanded.append((label, path))

    # 2) 중복 제거 (같은 경로가 여러 패턴으로 잡히는 경우)
    dedup: Dict[Path, str] = {}
    for label, path in expanded:
        if path not in dedup:
            dedup[path] = label
    final_items = [(lbl, p) for p, lbl in dedup.items()]

    # 3) 수집
    all_records: List[Dict[str, Any]] = []
    for folder_label, folder_path in final_items:
        recs = collect_for_folder(folder_label, folder_path)
        all_records.extend(recs)

    # 4) JSON 출력
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fo:
        json.dump(all_records, fo, ensure_ascii=False, indent=2)

    print(f"[DONE] {len(all_records)}개 HTML 레코드 → {out_path}")

if __name__ == "__main__":
    main()
