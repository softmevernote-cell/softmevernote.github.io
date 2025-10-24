# Python 스크립트

이 디렉토리에는 웹사이트에 필요한 JSON 파일을 생성하기 위한 Python 스크립트가 들어 있습니다.

## 스크립트

### `files.py`

이 스크립트는 `내 노트*` 디렉토리를 스캔하여 루트 디렉토리에 `files.json`을 생성합니다. 이 JSON 파일에는 각 노트 디렉토리 내의 모든 HTML 파일 목록이 포함되어 있으며, `index.html`에서 기본 노트 탐색 목록을 만드는 데 사용됩니다.

**사용법:**
```bash
python3 files.py
```
이 명령을 실행하면 프로젝트 루트에 `files.json`이 생성되거나 덮어쓰여집니다.

### `attach_file.py`

이 스크립트는 `내 노트*` 디렉토리에서 모든 `*.html` 파일을 스캔하고 해당 `* files` 첨부 파일 디렉토리를 찾아 루트 디렉토리에 `attach_file.json`을 생성합니다. 이 JSON 파일은 각 HTML 노트를 첨부 파일 목록에 매핑하며, 각 노트 페이지의 `attach.js` 스크립트에 의해 동적으로 로드됩니다.

**사용법:**
```bash
python3 attach_file.py
```
이 명령을 실행하면 프로젝트 루트에 `attach_file.json`이 생성되거나 덮어쓰여집니다.

### `generate_wordcloud.py`

이 스크립트는 `files.json`에 나열된 모든 HTML 파일의 내용을 읽어 단어 빈도를 계산하고 `wordcloud.json` 파일을 생성합니다. 이 파일은 워드 클라우드 시각화에 사용됩니다.

**사용법:**
```bash
python3 generate_wordcloud.py
```
이 명령을 실행하면 프로젝트 루트에 `wordcloud.json`이 생성되거나 덮어쓰여집니다.

### `normalize_filenames.py`

이 스크립트는 `files.json` 파일의 파일 경로를 NFC(Normalization Form C) 유니코드 형식으로 정규화합니다. 이는 macOS(NFD)와 웹 서버(NFC) 간의 유니코드 처리 차이로 인해 발생할 수 있는 파일 이름 불일치 문제를 해결합니다.

**사용법:**
```bash
python3 normalize_filenames.py
```
이 명령을 실행하면 `files.nfc.json`이라는 이름의 정규화된 새 파일이 생성됩니다.

### `normalize_attach_file.py`

이 스크립트는 `attach_file.json` 파일의 파일 경로를 NFC(Normalization Form C) 유니코드 형식으로 정규화합니다. `normalize_filenames.py`와 마찬가지로 유니코드 정규화 문제를 해결하는 데 사용됩니다.

**사용법:**
```bash
python3 normalize_attach_file.py
```
이 명령을 실행하면 `attach_file.nfc.json`이라는 이름의 정규화된 새 파일이 생성됩니다.

---

**참고:** 이 스크립트들은 프로젝트의 루트 디렉토리(`/Users/softm/Work/softmevernote.github.io`)에서 실행되도록 설계되었습니다.
