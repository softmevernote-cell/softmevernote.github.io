#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collect_file_info_v2.py

여러 개의 "문서폴더"를 인자로 받아, 각 폴더(하위 폴더 포함)에서
HTML 파일을 찾고 해당 HTML 파일명(확장자 제거한 'html파일명만')에
대응하는 "html파일명만 + ' files'" 디렉토리 안의 첨부 파일 목록을 수집하여
files.json 형태로 출력합니다.

추가 기능:
- --base 옵션으로 "기반 디렉토리"를 지정할 수 있습니다. (예: --base ../)
- folders 인자는 보통 기반 디렉토리 하위의 폴더명(또는 경로)을 나열합니다.
- 절대 경로를 folders에 넘기면 --base는 무시하고 해당 절대 경로를 사용합니다.

출력 JSON 구조 (배열):
[
  {
    "html_file": "문서폴더/서브경로/파일명",  # 확장자 제거 (입력한 폴더 라벨 기준)
    "folder": "문서폴더",                    # 사용자가 전달한 폴더 라벨(문자열)
    "files": [ "첨부1.ext", "첨부2.ext", ... ]
  },
  ...
]

사용 예시:
  python collect_file_info_v2.py --base ../ "내 노트 (15)" "다른 노트" --out /mnt/data/files.json
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

def list_htmls(base: Path) -> List[Path]:
    # 재귀적으로 *.html 수집
    return sorted(base.rglob("*.html"))

def resolve_folder_path(folder_arg: str, base_root: Path) -> Path:
    fpath = Path(folder_arg)
    if fpath.is_absolute():
        return fpath.resolve()
    return (base_root / fpath).resolve()

def collect_for_folder(folder_label: str, folder_path: Path) -> List[Dict[str, Any]]:
    """
    folder_label: 출력에 사용할 라벨(사용자 입력을 그대로)
    folder_path : 실제 파일 탐색에 사용할 절대 경로
    """
    records = []
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

        # folder 내부 기준의 상대경로(확장자 제거)
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
    ap = argparse.ArgumentParser(description="Collect HTML and attachment file info from multiple document folders.")
    ap.add_argument("folders", nargs="+", help="문서폴더 경로(여러 개 가능). 보통 --base 하위 폴더명을 나열.")
    ap.add_argument("--base", default=".", help="기반 디렉토리 (기본값: 현재 폴더). 절대 경로 폴더가 주어지면 무시됨.")
    ap.add_argument("--out", default="files.json", help="출력 파일 경로 (기본값: files.json)")
    args = ap.parse_args()

    base_root = Path(args.base).resolve()

    all_records: List[Dict[str, Any]] = []
    for folder_arg in args.folders:
        folder_label = folder_arg  # 출력용 라벨은 사용자가 넘긴 문자열 그대로
        folder_path = resolve_folder_path(folder_arg, base_root)
        recs = collect_for_folder(folder_label, folder_path)
        all_records.extend(recs)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fo:
        json.dump(all_records, fo, ensure_ascii=False, indent=2)

    print(f"[DONE] {len(all_records)}개 HTML 레코드 → {out_path}")

if __name__ == "__main__":
    main()
