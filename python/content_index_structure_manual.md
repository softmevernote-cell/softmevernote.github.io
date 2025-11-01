# 🧩 content_index.json 데이터 구조 설명
**(최종 통합 인덱스 — name + html + attach 병합 결과)**

---

## 📘 개요
`content_index.json`은  
Evernote 내보낸 HTML 문서 및 첨부파일을  
분석·전처리·병합한 **통합 콘텐츠 인덱스** 파일이다.  

이 JSON은
- 검색
- 워드클라우드
- 타임라인
- 지식 네트워크(그래프)
등을 시각화하는 핵심 데이터 원본 역할을 한다.

---

## 🧱 최상위 구조
```json
[
  {
    ... 하나의 문서(html_file) 단위 레코드 ...
  },
  {
    ... 다음 문서 ...
  }
]
```
> 즉, `content_index.json`은 **문서별 객체 리스트**이다.

---

## 🧩 각 문서 객체 구조

| 필드명 | 타입 | 설명 |
|--------|------|------|
| **html_file** | string | HTML 문서의 상대 경로(확장자 없이), 예: `"내 노트 (24)/Erwin macro manual"` |
| **folder** | string | 문서가 속한 폴더명 (Evernote notebook 단위) |
| **date** | string (YYYY-MM-DD 또는 YYYY) | 파일명이나 경로에서 추출된 날짜(없을 수도 있음) |
| **source** | object | 문서 원본의 파일·첨부 디렉토리 정보 |
| **html_text_ref** | string | 본문 캐시 텍스트 파일 경로 (`text_cache/..._html.txt`) |
| **keywords_name** | array[string] | 파일명에서 추출된 주요 키워드 |
| **summary_name** | string | 파일명 기반 요약 |
| **keywords_html** | array[string] | HTML 본문(innerText)에서 추출된 주요 키워드 |
| **summary_html** | string | HTML 본문에서 요약된 내용 |
| **keywords_attach** | array[string] | 첨부파일 전체에서 추출된 주요 키워드 |
| **summary_file** | string | 첨부파일 전체 내용의 요약 |
| **attachments** | array[object] | 첨부파일별 상세 정보 배열 |
| **tags** | array[string] | 문서의 주제 태그 (자동 분류 규칙 기반) |
| **subtags** | array[string] | 문서의 세부 속성 (예: has_pdf, has_hanword 등) |

---

## 📦 source 필드 구조

| 하위키 | 타입 | 설명 |
|--------|------|------|
| **html_path** | string | HTML 문서의 상대 경로 (확장자 포함) |
| **files_dir** | string | 첨부파일이 들어 있는 디렉토리 경로 |

예시:
```json
"source": {
  "html_path": "내 노트 (24)/Erwin macro manual.html",
  "files_dir": "내 노트 (24)/Erwin macro manual files/"
}
```

---

## 📄 attachments 배열 구조

| 필드 | 타입 | 설명 |
|------|------|------|
| **filename** | string | 첨부파일 이름 |
| **type** | string | 파일 유형 (pdf, docx, hwp, txt, image, zip 등) |
| **keywords** | array[string] | 해당 첨부파일에서 추출된 주요 키워드 |
| **text_ref** | string | 첨부 텍스트 캐시 파일 경로 (`text_cache/..._att.txt`) |

예시:
```json
"attachments": [
  {
    "filename": "ERwin_Macro_Code.pdf",
    "type": "pdf",
    "keywords": ["macro", "schema", "pdf"],
    "text_ref": "text_cache/Erwin_macro_manual__ERwin_Macro_Code_att.txt"
  }
]
```

---

## 🏷️ tags / subtags 자동 분류 규칙

| 필드 | 예시 값 | 의미 |
|------|----------|------|
| **tags** | `["tech/dev"]` | 기술, 개발 관련 문서 |
| 〃 | `["life/family"]` | 가족, 일상, 개인 관련 |
| 〃 | `["agri/farm"]` | 농업·영농 관련 |
| **subtags** | `["has_pdf", "has_images"]` | PDF 또는 이미지 첨부 포함 |
| 〃 | `["has_hanword", "has_docx"]` | 한글 또는 워드 문서 첨부 포함 |

> tag 규칙은 `build_content_index_v10_emit_parts.py` 내부의 `RULES` 정규식 기반 자동 매핑.

---

## 🧠 필드 관계 요약 (Mermaid 다이어그램)

```mermaid
graph TD
  A[content_index.json] --> B[Document Record]
  B --> C[html_file]
  B --> D[folder]
  B --> E[keywords_name/html/attach]
  B --> F[summary_name/html/file]
  B --> G[attachments[]]
  B --> H[tags]
  B --> I[subtags]
  B --> J[source]
  J --> J1[html_path]
  J --> J2[files_dir]
  G --> G1[filename]
  G --> G2[type]
  G --> G3[keywords]
  G --> G4[text_ref]
```

---

## 📊 활용 예시

| 목적 | 사용 필드 | 설명 |
|------|------------|------|
| 🔍 **검색 인덱스** | keywords_name, keywords_html, keywords_attach | 키워드 기반 검색 및 필터링 |
| ☁️ **단어 클라우드** | keywords_html, keywords_attach | 문서 주요 키워드 시각화 |
| 🧩 **지식 그래프** | tags, keywords_html, attachments[].keywords | 문서 간 연결 관계 분석 |
| 🕒 **타임라인 시각화** | date | 연도/월별 문서 분포 분석 |

---

## 📂 예시 데이터 구조 (요약)
```json
[
  {
    "html_file": "내 노트 (24)/Erwin macro manual",
    "folder": "내 노트 (24)",
    "date": "2013-02-21",
    "source": {...},
    "keywords_name": [...],
    "keywords_html": [...],
    "keywords_attach": [...],
    "summary_name": "...",
    "summary_html": "...",
    "summary_file": "...",
    "attachments": [...],
    "tags": [...],
    "subtags": [...],
    "html_text_ref": "text_cache/..._html.txt"
  }
]
```

---

## ✅ 정리

| 항목 | 설명 |
|------|------|
| 구조 | 리스트 of 문서 객체 |
| 식별키 | `(html_file, folder)` |
| 주요 분류 | name / html / attach |
| 캐시 연계 | `text_cache/*.txt` |
| 활용처 | 검색, 클라우드, 그래프, 타임라인 |
| 생성 경로 | `merge_content_parts_v2.py` 결과물 |

---
