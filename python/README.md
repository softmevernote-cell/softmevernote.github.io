# Python Scripts for softmevernote.github.io

This directory contains Python scripts for generating necessary JSON files for the website.

## Scripts

### `files.py`

This script scans the `내 노트*` directories and creates `files.json` in the root directory. This JSON file contains a list of all HTML files within each note directory, and is used by `index.html` to build the main note navigation list.

**Usage:**
```bash
python3 files.py
```
This will generate or overwrite `files.json` in the project root.

### `attach_file.py`

This script scans for all `*.html` files in the `내 노트*` directories, finds their corresponding `* files` attachment directories, and creates `attach_file.json` in the root directory. This JSON file maps each HTML note to its list of attachments, which is then dynamically loaded by the `attach.js` script on each note page.

**Usage:**
```bash
python3 attach_file.py
```
This will generate or overwrite `attach_file.json` in the project root.

---

**Note:** These scripts are designed to be run from the root directory of the project (`/Users/softm/Work/softmevernote.github.io`).
