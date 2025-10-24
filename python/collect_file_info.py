#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
collect_file_info_v4.py

v4 추가 사항 (macOS 한글 조합형/NFC, 분리형/NFD 모두 대응):
- 입력 인자, glob 확장, 라벨, 출력 경로 모두 내부적으로 NFC 정규화
- 와일드카드 확장 시 NFC/NFD 두 형태의 패턴을 모두 시도하여 매칭 누락 방지
- HTML 파일명에서 파생되는 "<stem> files" 폴더 탐색도 NFC/NFD 후보 모두 확인

기능 요약
- 다중 문서폴더 + 재귀 *.html 수집
- --base 기반 디렉토리 지정 (상대/절대 혼용)
- 와일드카드(*, ?) 지원
- "<stem> files" 첨부 목록 수집
- 결과를 files.json 로 출력 (원본 경로 변경 없음)

사용 예시:
  python collect_file_info_v4.py --base ../ "내 노트*" --out /mnt/data/files.json
"""

import argparse
import json
import sys
import glob
import unicodedata as ud
from pathlib import Path
from typing import List, Dict, Any, Tuple, Iterable

def nfc(s: str) -> str:
    return ud.normalize("NFC", s)

def nfd(s: str) -> str:
    return ud.normalize("NFD", s)

def norm_variants(s: str) -> List[str]:
    """Return unique NFC/NFD variants (NFC first)."""
    a = nfc(s)
    b = nfd(s)
    return [a] if a == b else [a, b]

def list_htmls(base: Path) -> List[Path]:
    """재귀적으로 *.html 수집"""
    return sorted(base.rglob("*.html"))

def expand_one_arg_to_paths(folder_arg: str, base_root: Path) -> List[Path]:
    """
    folder_arg를 실제 경로 리스트로 확장 (Unicode NFC/NFD 모두 시도).
    - 절대경로 + 와일드카드: 두 정규화 패턴 모두 glob
    - 절대경로 (와일드카드 없음): 해당 경로의 NFC/NFD 형태 모두 검사
    - 상대경로 + 와일드카드: (base_root / pattern)으로 두 형태 glob
    - 상대경로 (와일드카드 없음): base_root / folder_arg 의 두 형태 모두 검사
    """
    has_wildcard = any(ch in folder_arg for ch in ["*", "?"])
    paths: List[Path] = []

    def existing_dirs(candidates: Iterable[Path]) -> List[Path]:
        out = []
        for c in candidates:
            try:
                if c.exists() and c.is_dir():
                    out.append(c.resolve())
            except Exception:
                pass
        return out

    if Path(folder_arg).is_absolute():
        if has_wildcard:
            cand = []
            for pat in norm_variants(folder_arg):
                cand.extend(glob.glob(pat))
            paths = [Path(x).resolve() for x in cand if Path(x).is_dir()]
        else:
            cand = [Path(x) for x in norm_variants(folder_arg)]
            paths = existing_dirs(cand)
    else:
        if has_wildcard:
            cand = []
            for pat in norm_variants(str((base_root / folder_arg))):
                cand.extend(glob.glob(pat))
            paths = [Path(x).resolve() for x in cand if Path(x).is_dir()]
        else:
            cand = [base_root / folder_arg]
            s = str(cand[0])
            cand = [Path(x) for x in norm_variants(s)]
            paths = existing_dirs(cand)

    # Dedup
    seen = set()
    uniq: List[Path] = []
    for p in paths:
        if p not in seen:
            uniq.append(p)
            seen.add(p)
    return uniq

def derive_folder_label(matched_path: Path, base_root: Path) -> str:
    try:
        rel = matched_path.relative_to(base_root)
        parts = rel.parts
        label = parts[0] if parts else matched_path.name
    except Exception:
        label = matched_path.name
    return nfc(label)

def candidate_files_dirs(html_path: Path) -> List[Path]:
    stem = html_path.stem
    names = [f"{stem} files"]
    names.extend(norm_variants(f"{stem} files"))
    candidates = [html_path.with_name(name) for name in names]
    out = []
    seen = set()
    for p in candidates:
        try:
            rp = p.resolve()
        except Exception:
            rp = p
        if rp in seen:
            continue
        seen.add(rp)
        try:
            if p.exists() and p.is_dir():
                out.append(p)
        except Exception:
            pass
    return out

def collect_for_folder(folder_label: str, folder_path: Path) -> List[Dict[str, Any]]:
    records: List[Dict[str, Any]] = []
    if not folder_path.exists() or not folder_path.is_dir():
        print(f"[WARN] 디렉토리가 아님 또는 없음: {folder_path}", file=sys.stderr)
        return records

    html_paths = list_htmls(folder_path)
    for html_path in html_paths:
        files_list: List[str] = []
        for fdir in candidate_files_dirs(html_path):
            try:
                for p in sorted(fdir.iterdir()):
                    if p.is_file():
                        files_list.append(nfc(p.name))
            except Exception:
                pass

        rel = html_path.relative_to(folder_path)
        rel_no_ext = rel.with_suffix("")
        html_file_field = nfc(f"{folder_label}/{rel_no_ext}".replace("\\", "/"))

        records.append({
            "html_file": html_file_field,
            "folder": nfc(folder_label),
            "files": sorted(list(dict.fromkeys(files_list)))
        })
    return records

def main():
    ap = argparse.ArgumentParser(description="Collect HTML and attachment file info from multiple document folders (base + wildcard + Unicode NFC/NFD safe).")
    ap.add_argument("folders", nargs="+", help="문서폴더 경로 또는 패턴(여러 개 가능). 예: '내 노트*'")
    ap.add_argument("--base", default=".", help="기반 디렉토리 (기본값: 현재 폴더). 절대 경로/패턴이 주어지면 우선.")
    ap.add_argument("--out", default="files.json", help="출력 파일 경로 (기본값: files.json)")
    args = ap.parse_args()

    base_root = Path(args.base).resolve()

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

    # Dedup by path
    dedup: Dict[Path, str] = {}
    for label, path in expanded:
        if path not in dedup:
            dedup[path] = label
    final_items = [(lbl, p) for p, lbl in dedup.items()]

    all_records: List[Dict[str, Any]] = []
    for folder_label, folder_path in final_items:
        recs = collect_for_folder(folder_label, folder_path)
        all_records.extend(recs)

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as fo:
        json.dump(all_records, fo, ensure_ascii=False, indent=2)

    print(f"[DONE] {len(all_records)}개 HTML 레코드 → {out_path}")

if __name__ == "__main__":
    main()
