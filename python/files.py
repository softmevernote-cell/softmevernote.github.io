
import os
import glob
import json

def main():
    root_dir = '/Users/softm/Work/softmevernote.github.io'
    output_data = []
    
    # Find all note directories
    note_dirs = glob.glob(os.path.join(root_dir, '내 노트*'))

    for note_dir in note_dirs:
        if os.path.isdir(note_dir):
            # Get all html files in the current note directory
            html_files_in_dir = glob.glob(os.path.join(note_dir, '*.html'))
            
            # Get just the basenames
            file_basenames = sorted([os.path.basename(f) for f in html_files_in_dir])
            
            relative_note_dir = './' + os.path.relpath(note_dir, root_dir).replace(os.sep, '/')

            # For each html file, create an entry
            for html_file_path in html_files_in_dir:
                relative_html_path = './' + os.path.relpath(html_file_path, root_dir).replace(os.sep, '/')
                entry = {
                    "html_file": relative_html_path,
                    "folder": relative_note_dir,
                    "files": file_basenames
                }
                output_data.append(entry)

    with open(os.path.join(root_dir, 'files.json'), 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)

if __name__ == '__main__':
    main()
