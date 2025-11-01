# 🧩 merge_content_parts_v2.py  
**content_index_for_name/html/attach → content_index.json 병합기 (v2)**  

---

## 📘 개요

`merge_content_parts_v2.py`는  
`build_content_index_v10_emit_parts.py`가 생성한  
3개의 인덱스 파일(`content_index_for_name.json`,  
`content_index_for_html.json`, `content_index_for_attach.json`)을  
우선순위 규칙에 따라 하나의 **`content_index.json`**으로 병합한다.  

---

## ⚙️ 명령 구조

```bash
python3 merge_content_parts_v2.py \
  [--name ./data/content_index_for_name.json] \
  [--html ./data/content_index_for_html.json] \
  [--attach ./data/content_index_for_attach.json] \
  [--out ./data/content_index.json]
```

> 모든 인자는 기본 경로가 지정되어 있어 생략 가능하다.  
> **즉, 다음처럼 아주 간단히 실행 가능 👇**

```bash
python3 merge_content_parts_v2.py
```

---

## 🧱 기본 옵션 및 경로

| 옵션 | 기본값 | 설명 |
|------|---------|------|
| `--name` | `./data/content_index_for_name.json` | 파일명 기반 인덱스 입력 |
| `--html` | `./data/content_index_for_html.json` | HTML 본문 기반 인덱스 입력 |
| `--attach` | `./data/content_index_for_attach.json` | 첨부파일 기반 인덱스 입력 |
| `--out` | `./data/content_index.json` | 최종 병합 결과 출력 파일 |

---

## 🧩 병합 기준

### 병합 키
- `(html_file, folder)` 쌍이 동일한 항목을 하나로 병합

### 우선순위
| 순서 | 파일 | 우선순위 설명 |
|-------|------|----------------|
| ① | `content_index_for_name.json` | 최우선 (기본 메타, 태그 선점) |
| ② | `content_index_for_html.json` | 두 번째 우선순위 |
| ③ | `content_index_for_attach.json` | 마지막으로 병합 |

> 동일 필드 충돌 시 앞쪽 파일의 값이 유지된다.  

---

## 🧠 병합 규칙 요약

| 항목 | 규칙 | 설명 |
|------|------|------|
| **기본키** | `html_file`, `folder` | 동일 문서 판단 기준 |
| **공통 메타** | `date`, `html_text_ref` | 비어 있지 않은 첫 값 채택 |
| **source** | `html_path`, `files_dir` | 기존 값 유지, 일부 키 비면 보충 |
| **tags**, **subtags** | 합집합 | 중복 제거, 기존 순서 유지 |
| **keywords_name**, **summary_name** | 그대로 유지 | name 파트에서 온 값 |
| **keywords_html**, **summary_html** | 그대로 유지 | html 파트에서 온 값 |
| **keywords_attach**, **summary_file** | 그대로 유지 | attach 파트에서 온 값 |
| **attachments[]** | 병합 | filename + text_ref 기준 중복 제거 |
| **기타 필드** | 첫 발견 값 유지 | 알려지지 않은 키는 처음 것만 유지 |

---

## 🧾 출력 예시

```json
{
  "html_file": "내 노트 (24)/Erwin macro manual",
  "folder": "내 노트 (24)",
  "keywords_name": ["erwin", "macro", "manual"],
  "summary_name": "erwin macro manual",
  "keywords_html": ["erwin", "schema", "pdf"],
  "summary_html": "ERwin 매크로 코드와 구조 요약",
  "keywords_attach": ["macro", "schema", "guide"],
  "summary_file": "ERwin Macro Code PDF 내용 요약...",
  "attachments": [
    {
      "filename": "ERwin_Macro_Code.pdf",
      "type": "pdf",
      "keywords": ["macro", "pdf", "schema"],
      "text_ref": "text_cache/Erwin_macro_manual__ERwin_Macro_Code_att.txt"
    }
  ],
  "tags": ["tech/dev"],
  "subtags": ["has_pdf"],
  "date": "2013-02-21",
  "source": {
    "html_path": "내 노트 (24)/Erwin macro manual.html",
    "files_dir": "내 노트 (24)/Erwin macro manual files/"
  },
  "html_text_ref": "text_cache/Erwin_macro_manual_html.txt"
}
```

---

## 🔍 내부 처리 순서

1️⃣ **입력 JSON 로드**
```python
name_list   = load_json_list(Path(args.name))
html_list   = load_json_list(Path(args.html))
attach_list = load_json_list(Path(args.attach))
```

2️⃣ **레코드 병합**
```python
for rec in name_list + html_list + attach_list:
    key = (rec.get("html_file"), rec.get("folder"))
    merged[key] = merge_records(merged[key], rec, label)
```

3️⃣ **정렬 및 출력**
```python
out_items.sort(key=lambda r: (r.get("folder") or "", r.get("html_file") or ""))
out_path.write_text(json.dumps(out_items, ensure_ascii=False, indent=2))
```

---

## 🚀 실행 예시

### 단순 실행 (기본 경로)
```bash
python3 merge_content_parts_v2.py
```

### 사용자 지정 입력·출력
```bash
python3 merge_content_parts_v2.py \
  --name ./custom/name.json \
  --html ./custom/html.json \
  --attach ./custom/attach.json \
  --out ./merged/content_index.json
```

출력:
```
[WRITE] ./data/content_index.json (108 items)
```

---

## 💡 병합 결과 특징

| 항목 | 결과 |
|------|------|
| 중복 제거 | `attachments` 내 `filename`, `text_ref` 기준 |
| 필드 정렬 | `folder`, `html_file` 순서 |
| 인코딩 | UTF-8, indent=2 |
| 누락된 파일 | 자동 건너뛰기 (경고만 출력) |
| 경로 표기 | `/`로 통일 (macOS/Linux/Windows 호환) |

---

## 📂 결과 디렉토리 예시

```
data/
 ├─ content_index_for_name.json
 ├─ content_index_for_html.json
 ├─ content_index_for_attach.json
 └─ content_index.json
```

---

## ⚙️ 확장 아이디어
- `--dry-run` : 병합 결과 미리보기  
- `--validate` : 필수 필드 누락 확인  
- `--report` : 병합 요약 통계 출력  

---

## 📄 참고
- JSON 파일은 UTF-8 인코딩 및 `indent=2`로 저장됨  
- Mac 환경에서 조합형/분리형 한글 파일명 완전 지원  
- 입력 파일 일부가 없으면 자동 스킵 후 병합 수행  
