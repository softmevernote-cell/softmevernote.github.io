
import json
import re
from collections import Counter

def generate_wordcloud_data():
    # Load files.json
    with open('../files.json', 'r', encoding='utf-8') as f:
        files_data = json.load(f)

    # Load Korean stop words
    with open('stopwords-ko.txt', 'r', encoding='utf-8') as f:
        stop_words = set(f.read().split())

    word_counts = Counter()

    for file_info in files_data:
        html_file_path = f"../{file_info['html_file']}"
        try:
            with open(html_file_path, 'r', encoding='utf-8') as f:
                html_content = f.read()
                # Strip HTML tags
                text_content = re.sub('<[^<]+?>', '', html_content)
                # Tokenize
                words = re.findall(r'\b[\w-]+\b', text_content.lower())
                
                for word in words:
                    if word not in stop_words and len(word) > 1:
                        word_counts[word] += 1
        except FileNotFoundError:
            print(f"File not found: {html_file_path}")
        except Exception as e:
            print(f"Error processing file {html_file_path}: {e}")

    # Convert to the desired format
    wordcloud_data = [{"text": word, "size": count} for word, count in word_counts.most_common(200)]

    # Save to wordcloud.json
    with open('../wordcloud.json', 'w', encoding='utf-8') as f:
        json.dump(wordcloud_data, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    generate_wordcloud_data()
