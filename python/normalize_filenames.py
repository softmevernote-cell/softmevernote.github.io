
import json
import unicodedata

def normalize_to_nfc(data):
    if isinstance(data, dict):
        return {normalize_to_nfc(k): normalize_to_nfc(v) for k, v in data.items()}
    elif isinstance(data, list):
        return [normalize_to_nfc(elem) for elem in data]
    elif isinstance(data, str):
        return unicodedata.normalize('NFC', data)
    else:
        return data

with open('/Users/softm/Work/softmevernote.github.io/files.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

normalized_data = normalize_to_nfc(data)

with open('/Users/softm/Work/softmevernote.github.io/files.nfc.json', 'w', encoding='utf-8') as f:
    json.dump(normalized_data, f, ensure_ascii=False, indent=4)

print("Conversion to NFC complete. Output written to files.nfc.json")
