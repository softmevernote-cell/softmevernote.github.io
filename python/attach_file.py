
import os
import glob
import json

def main():
    root_dir = '/Users/softm/Work/softmevernote.github.io'
    output_data = {}

    html_files = glob.glob(os.path.join(root_dir, '**/내 노트*/**/*.html'), recursive=True)

    for html_file_path in html_files:
        relative_html_path = os.path.relpath(html_file_path, root_dir)
        dir_path = os.path.dirname(html_file_path)
        base_name = os.path.basename(html_file_path)

        files_dir_name = ''
        if base_name.endswith('..html'):
            files_dir_name = base_name.replace('..html', '. files')
        else:
            files_dir_name = base_name.replace('.html', ' files')

        files_dir_path = os.path.join(dir_path, files_dir_name)

        if os.path.isdir(files_dir_path):
            try:
                file_list = [f for f in os.listdir(files_dir_path) if os.path.isfile(os.path.join(files_dir_path, f))]
                if file_list:
                    # Use forward slashes for keys, as they are URL paths
                    key = relative_html_path.replace(os.sep, '/')
                    output_data[key] = {
                        "files_dir": files_dir_name,
                        "files": sorted(file_list)
                    }
            except OSError:
                # Ignore if we can't list the directory
                pass

    with open(os.path.join(root_dir, 'attach_file.json'), 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=2)

if __name__ == '__main__':
    main()
