#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collect_file_info.py

여러 개의 "문서폴더"를 인자로 받아, 각 폴더(하위 폴더 포함)에서
HTML 파일을 찾고 해당 HTML 파일명(확장자 제거한 'html파일명만')에
대응하는 "html파일명만 + ' files'" 디렉토리 안의 첨부 파일 목록을 수집하여
files.json 형태로 출력합니다.

요구사항 정리:
- 인자: 하나 이상의 문서폴더 경로 (예: 내노트1 내노트2 ...)
- 각 폴더의 하위 폴더를 재귀적으로 순회하여 *.html 파일을 수집
- HTML 파일명에서 확장자를 제거한 'stem'을 이용해
  "{stem} files" 디렉토리를 찾아 그 안의 파일명을 'files' 배열로 기록
- 출력 JSON 구조 (배열):
  [
    {
      "html_file": "문서폴더1/html파일명",   # 확장자 제거(사용자 스펙 준수)
      "folder": "문서폴더1",
      "files": [ ...html파일의첨부파일들 ]
    },
    ...
  ]

주의:
- 실제 물리 경로/파일은 변경하지 않습니다(읽기 전용).
- 첨부 폴더가 없거나 비어있으면 'files'는 빈 배열([]).
- 'html_file'은 폴더 기준의 상대 경로로 "문서폴더/파일명(확장자제외)" 형태를 사용합니다.
- 기본 출력 파일명: files.json (옵션 --out 으로 변경 가능)

사용 예시:
  python collect_file_info.py "내 노트 (15)" "다른 노트" --out /path/to/files.json
"""

import argparse
import json
import sys
from pathlib import Path
from typing import List, Dict, Any

def list_htmls(base: Path) -> List[Path]:
    # 재귀적으로 *.html 수집
    return sorted(base.rglob("*.html"))

def collect_for_base(base: Path) -> List[Dict[str, Any]]:
    records = []
    base = base.resolve()
    # 폴더명은 사용자가 준 "문서폴더"를 그대로 유지 (basename이 아니라 전체 경로 문자열)
    folder_str = str(base)
    html_paths = list_htmls(base)
    for html_path in html_paths:
        stem = html_path.stem  # 확장자 제거
        # 첨부 디렉토리 규칙: "<stem> files"
        files_dir = html_path.with_name(f"{stem} files")
        files_list = []
        if files_dir.exists() and files_dir.is_dir():
            # Evernote export 관례상 하위 폴더는 없다고 가정하고 1-depth만 수집
            for p in sorted(files_dir.iterdir()):
                if p.is_file():
                    files_list.append(p.name)

        # html_file: "문서폴더/html파일명" (확장자 제거)
        # 경로는 base 기준의 상대 경로를 사용하되, 앞에 문서폴더(사용자 입력 경로 문자열)로 시작하도록 구성
        rel = html_path.relative_to(base)
        rel_no_ext = rel.with_suffix("")  # "sub/dir/파일명"
        html_file_field = str(Path(folder_str) / rel_no_ext)

        records.append({
            "html_file": html_file_field.replace("\\", "/"),
            "folder": folder_str.replace("\\", "/"),
            "files": files_list
        })
    return records

def main():
    ap = argparse.ArgumentParser(description="Collect HTML and attachment file info from multiple document folders.")
    ap.add_argument("folders", nargs="+", help="문서폴더 경로(여러 개 가능)")
    ap.add_argument("--out", default="files.json", help="출력 파일 경로 (기본값: files.json)")
    args = ap.parse_args()

    all_records: List[Dict[str, Any]] = []
    for f in args.folders:
        base = Path("../" +f)
        if not base.exists() or not base.is_dir():
            print(f"[WARN] 디렉토리가 아님 또는 없음: {base}", file=sys.stderr)
            continue
        recs = collect_for_base(base)
        all_records.extend(recs)

    # JSON 출력
    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fo:
        json.dump(all_records, fo, ensure_ascii=False, indent=2)

    print(f"[DONE] {len(all_records)}개 HTML 레코드 → {out_path}")

if __name__ == "__main__":
    main()
