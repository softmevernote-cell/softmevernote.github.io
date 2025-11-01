# 🧩 build_content_index_v10_emit_parts.py  
**HTML·첨부파일 기반 콘텐츠 인덱스 생성기 (v10)**  

---

## 📘 개요

`build_content_index_v10_emit_parts.py`는  
Evernote 내보낸 HTML 문서 및 첨부파일 구조(`files_info.json`)를 기반으로  
키워드, 요약, 태그, 메타 정보를 전처리하여 **3가지 파트별 인덱스 JSON**을 생성한다.

각 `--emit` 모드(`name`, `html`, `attach`)마다  
출력 스키마와 **텍스트 캐시(text_cache)** 관리 정책이 다르게 동작한다.

---

## ⚙️ 명령 구조

```bash
python3 build_content_index_v10_emit_parts.py \
  --root <기준 폴더> \
  --files ./files_info.json \
  --outdir ./data \
  --emit <name|html|attach> \
  [기타 옵션]
```

---

## 🧱 주요 역할

| 구분 | 설명 |
|------|------|
| **name** | HTML 파일명 기반 키워드 및 요약 생성 |
| **html** | HTML 본문(innerText) 기반 키워드 및 요약 생성 |
| **attach** | 첨부파일(PDF, DOCX, HWP 등) 기반 키워드 및 요약 생성 |

---

## 🧰 주요 옵션

| 옵션 | 설명 | 기본값 |
|------|------|--------|
| `--root` | HTML 문서 및 첨부파일이 있는 상위 폴더 | (필수) |
| `--files` | `files_info.json` 파일 경로 | (필수) |
| `--outdir` | 출력 폴더 | `./data` |
| `--emit` | 처리할 파트 지정 (`name`, `html`, `attach`, 복수 가능) | `name,html,attach` |
| `--ocr` | 이미지 첨부 OCR 텍스트 추출 (`true/false`) | `false` |
| `--only-attachments` | HTML 무시하고 첨부만 처리 | `false` |
| `--k-name` | 파일명 키워드 개수 | `20` |
| `--k-html` | HTML 본문 키워드 개수 | `50` |
| `--k-attach` | 첨부 키워드 개수 | `40` |
| `--stopwords` | 불용어 JSON 파일 경로 지정 | 내장 기본 사용 |
| `--dry-run` | 결과 출력 미리보기 (파일 저장 안 함) | - |

---

## 🧩 캐시(text_cache) 정책

| emit 모드 | HTML 캐시 | 첨부 캐시 |
|------------|------------|------------|
| `name` | **항상 재생성 (overwrite)** | - |
| `html` | **없을 때만 생성** | - |
| `attach` | **없을 때만 생성** | **항상 재생성 (overwrite)** |

- HTML 캐시 파일명:  
  ```
  text_cache/<slugified_html_file>_html.txt
  ```
- 첨부 캐시 파일명:  
  ```
  text_cache/<slugified_html_file>__<slugified_attach_filename>_att.txt
  ```

---

## 🗂️ 출력 파일 구조

| emit | 출력 파일 | 설명 |
|------|------------|------|
| `name` | `content_index_for_name.json` | 파일명 기반 키워드 인덱스 |
| `html` | `content_index_for_html.json` | HTML 본문 기반 인덱스 |
| `attach` | `content_index_for_attach.json` | 첨부파일 기반 인덱스 |

---

## 🧾 스키마 정의

### ▶️ `--emit name`
```json
{
  "html_file": "내 노트 (24)/Erwin macro manual",
  "folder": "내 노트 (24)",
  "keywords_name": ["erwin","macro","manual"],
  "summary_name": "erwin macro manual",
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

### ▶️ `--emit html`
```json
{
  "html_file": "내 노트 (24)/Erwin macro manual",
  "folder": "내 노트 (24)",
  "keywords_html": ["erwin","schema","pdf"],
  "summary_html": "ERwin 매크로 코드와 구조에 대한 설명...",
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

### ▶️ `--emit attach`
```json
{
  "html_file": "내 노트 (24)/Erwin macro manual",
  "folder": "내 노트 (24)",
  "keywords_attach": ["macro","schema","guide"],
  "summary_file": "ERwin Macro Code PDF 내용 요약...",
  "attachments": [
    {
      "filename": "ERwin_Macro_Code.pdf",
      "type": "pdf",
      "keywords": ["macro","pdf","schema"],
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

## 📦 text_cache 폴더 구조 예시

```
data/
 ├─ text_cache/
 │   ├─ Erwin_macro_manual_html.txt
 │   ├─ Erwin_macro_manual__ERwin_Macro_Code_att.txt
 │   └─ Project_Plan__spec_att.txt
 ├─ content_index_for_name.json
 ├─ content_index_for_html.json
 └─ content_index_for_attach.json
```

---

## 🔍 텍스트 처리 기준

- **HTML**:  
  - `<script>`, `<style>`, `<meta>`, `<head>`, `<template>` 등 제거  
  - `display:none`, `aria-hidden`, `opacity:0` 요소 제거  
  - 엔티티 `&nbsp;`, `&quot;`, `&lt;` 제거  
  - 나머지 HTML은 `innerText` 기준 추출

- **첨부**:  
  - 지원 확장자: `pdf`, `docx`, `txt`, `xlsx`, `csv`, `hwp`, `hwpx`, `zip`(내부 파일 포함)  
  - 이미지(`jpg`, `png` 등)는 OCR(`--ocr true`) 지원

- **키워드 추출**:  
  - 토큰화 + 불용어 제거 + 빈도 기반 상위 N개  
  - N은 `--k-name`, `--k-html`, `--k-attach`로 지정 가능

- **요약(summarize)**:  
  - 문장 단위(마침표/“다”,“요”)로 최대 240자까지 추출

---

## 🏷️ 태그 규칙(RULES)

내장된 간단한 정규식 매칭 기반 태그 분류 예시:
| 패턴 | 태그 |
|-------|------|
| Android, Webview, Gradle 등 | `tech/dev` |
| 가족, 어린이집, 여권 등 | `life/family` |
| 계약서, 신고, 주차단속 등 | `legal/admin` |
| 비염, 안약, 건강 등 | `health` |
| 아이디어, 계획, TODO 등 | `idea/project` |
| 철학, 뉴스, 사회 등 | `society/thought` |
| NAS, FTP, 시놀로지 등 | `hardware/it` |
| 영농, 농업, 스마트팜 등 | `agri/farm` |

> ⚙️ 커스터마이징하려면 `RULES` 배열에 정규식 추가하거나,  
> 차후 버전에 `--tag-rules ./tag_rules.json` 옵션 추가 가능.

---

## 🚀 실행 예시

```bash
# 1️⃣ 파일명 기반 인덱스 (HTML 캐시 강제 재생성)
python3 build_content_index_v10_emit_parts.py \
  --root ../ --files ./files_info.json --outdir ./data --emit name

# 2️⃣ HTML 본문 기반 인덱스 (HTML 캐시 없을 때만 생성)
python3 build_content_index_v10_emit_parts.py \
  --root ../ --files ./files_info.json --outdir ./data --emit html

# 3️⃣ 첨부파일 기반 인덱스 (HTML 캐시는 유지, 첨부 캐시는 재생성)
python3 build_content_index_v10_emit_parts.py \
  --root ../ --files ./files_info.json --outdir ./data --emit attach
```

---

## 🧩 결과 요약

| emit | 캐시 정책 | 주요 속성 | 출력 JSON |
|-------|-------------|-------------|-------------|
| `name` | HTML 캐시 재생성 | keywords_name, summary_name | `content_index_for_name.json` |
| `html` | HTML 캐시 유지(없을 때 생성) | keywords_html, summary_html | `content_index_for_html.json` |
| `attach` | HTML 캐시 유지 + 첨부 캐시 재생성 | keywords_attach, summary_file, attachments[] | `content_index_for_attach.json` |

---

## 📄 참고
- 모든 JSON 파일은 UTF-8로 인코딩되며,  
  `indent=2`로 포맷팅된다.
- 경로는 모두 NFC 정규화(조합형/분리형 한글 디렉터리 호환).  
- Mac 환경에서도 조합형·분리형 한글 폴더명 정상 처리.
