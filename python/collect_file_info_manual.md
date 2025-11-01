# 📄 collect_file_info.py
**Evernote HTML 내보내기 구조를 읽어 `files_info.json` 생성**

---

## 1) 무엇을 하는 스크립트인가
- 지정한 **기준 디렉터리**(`--base`, 예: `../`) 아래에서
- 한 개 이상 **문서 폴더**(와일드카드 지원, 예: `"내 노트*"` )를 찾아
- 각 폴더 내의 **.html 파일**을 스캔하고
- 같은 이름의 `"<html파일명> files/"` 디렉토리 안 **첨부파일 목록**을 수집해
- 다음 형태의 **`files_info.json`**을 만든다.

```json
[
  {
    "html_file": "내 노트 (24)/Erwin macro manual",
    "folder": "내 노트 (24)",
    "files": ["ERwin_Macro_Code.pdf", "thumb.png"]
  },
  ...
]
```
> `html_file` 값은 **확장자(.html) 없이** `폴더/파일명` 형태다.

---

## 2) 실행법 (예시와 단계)
### A. 기본
```bash
python3 collect_file_info.py "내 노트 (24)" --out ./files_info.json --base ../
```

### B. 여러 폴더 한 번에 (스페이스로 구분)
```bash
python3 collect_file_info.py "내 노트 (24)" "내 노트 (25)" --out ./files_info.json --base ../
```

### C. 와일드카드 사용
```bash
python3 collect_file_info.py "내 노트*" --out ./files_info.json --base ../
```

### D. 드라이런(생성 전 미리보기)
```bash
python3 collect_file_info.py "내 노트*" --out ./files_info.json --base ../ --dry-run
```

---

## 3) 주요 옵션
| 옵션 | 타입/기본값 | 설명 |
|---|---|---|
| `--out` | 경로 / `./files_info.json` | 결과 JSON 저장 경로 |
| `--base` | 경로 / `.` | 문서폴더들이 위치한 **기준 디렉토리** |
| `--encoding` | 문자열 / `utf-8` | 파일명·경로 읽기 기본 인코딩 |
| `--include-hidden` | bool / `false` | 숨김 폴더/파일 포함 여부 |
| `--dry-run` | flag | 실제 파일 저장 없이 콘솔로 요약 출력 |
| `--follow-symlinks` | bool / `false` | 심볼릭 링크 추적 여부 |

> 구현에 따라 옵션 이름이 약간 다를 수 있다. 기본적으로 **폴더 인자(위치 인자)**에는 `"내 노트*"`, `"문서폴더1"` 같이 **여러 개**를 전달할 수 있다.

---

## 4) 스캔 규칙 (Step-by-step)
1. **기준 디렉터리**로 이동: `--base` 기준 경로를 잡는다.  
2. **와일드카드 확장**: 쉘 글로빙 또는 Python `glob`로 `"내 노트*"` 같은 패턴을 **실제 폴더 목록**으로 확장.  
3. 각 **문서 폴더**에서 **모든 .html 파일** 탐색(재귀 포함 가능).  
4. 각 HTML에 대해 **확장자 제거한 파일명**을 얻고, **동일 이름의 첨부 디렉토리** `"<stem> files/"`를 확인.  
5. 첨부 디렉토리가 있으면 내부 파일명을 **상대경로 없이 파일명만** 수집.  
6. `{"html_file": "폴더/파일명", "folder": "폴더", "files": [...]}` 레코드를 결과 배열에 추가.  
7. 최종적으로 배열을 **폴더/파일명 기준 정렬** 후 `--out` 경로에 저장.

---

## 5) 한글(조합형/분리형) 파일명 대응
- macOS에서 흔한 **분리형(NFD)** 과 **조합형(NFC)** 혼재 문제를 피하려고,
  내부적으로 경로와 파일명을 **NFC 정규화**하여 처리한다.  
- 따라서 `"내 노트"`처럼 한글 폴더/파일명이 **조합형/분리형 어디든 안전**하게 동작한다.

---

## 6) 예시 입·출력

### 입력 디렉토리 구조
```
../
 └─ 내 노트 (24)/
     ├─ Erwin macro manual.html
     └─ Erwin macro manual files/
         ├─ ERwin_Macro_Code.pdf
         └─ thumb.png
```

### 출력 `files_info.json`
```json
[
  {
    "html_file": "내 노트 (24)/Erwin macro manual",
    "folder": "내 노트 (24)",
    "files": ["ERwin_Macro_Code.pdf", "thumb.png"]
  }
]
```

---

## 7) 자주 하는 실수 & 해결
- **No such file or directory**  
  → 현재 위치 기준이 아니라 **`--base`가 올바른지** 확인.  
  → 예: 저장소 루트에서 실행한다면 `--base ../` 처럼 상위 경로를 정확히 지정.
- **와일드카드가 확장되지 않음**  
  → 쉘이 아닌 환경(예: Python에서 직접 문자열)을 쓸 때는 스크립트가
  내부적으로 `glob`하도록 되어 있어야 한다.  
- **첨부 디렉토리 이름 오탈자**  
  → Evernote 규칙은 정확히 **`<html파일명> + " files"`**. 공백 포함 여부 주의.
- **숨김 파일이 결과에 들어옴/안 들어옴**  
  → `--include-hidden` 플래그 확인.

---

## 8) 워크플로우 연계
1. `collect_file_info.py` → `files_info.json` 생성  
2. `build_content_index_v10_emit_parts.py`로 name/html/attach 파트 인덱스 생성  
3. `merge_content_parts.py`로 최종 `content_index.json` 병합  
4. `processing.html` / `dashboard.html`에서 시각화(검색/워드클라우드/네트워크/타임라인)

---

## 9) 빠른 체크리스트
- [ ] `--base` 올바른가?  
- [ ] 와일드카드가 원하는 폴더들을 가리키나?  
- [ ] Evernote 첨부 폴더가 `"<stem> files/"` 형태인가?  
- [ ] 결과 `files_info.json`에서 `html_file`에 **확장자가 제거**되었는가?

---

## 10) 최소 실행 예시(복붙용)
```bash
python3 collect_file_info.py "내 노트*" \
  --out ./files_info.json \
  --base ../
```
