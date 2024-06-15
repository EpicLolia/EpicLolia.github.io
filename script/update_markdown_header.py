# 为所有Markdown文件添加一个头部，包括文件名、作者、日期和版本号。

import os
import re
from yaml import load, dump, FullLoader


def get_source_path():
    return os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def get_all_markdown_files(dir):
    result = []
    for root, _, filenames in os.walk(dir):
        result.extend([f"{root}/{file}".replace("\\", "/") for file in filenames if file.endswith('.md')])
    return result


def find_yaml_block(lines):
    if len(lines) > 0 and lines[0].startswith('---'):
        for index, line in enumerate(lines):
            if index != 0 and line.startswith("---"):
                return index
    return 0


def parse_categories(path):
    match = re.search(r'/(?:_posts|_drafts)/(.*)', path)
    if match:
        sub_path = match.group(1)
        dir_path = os.path.dirname(sub_path)
        return len(dir_path) > 0 and dir_path.split('/') or None
    return None


def add_header(path):
    print(f"Updating header in {path}")

    with open(path, 'r+', encoding='utf-8') as file:
        lines = file.readlines()

        header_yaml = {}

        separator_line = find_yaml_block(lines)
        if separator_line > 0:
            yaml_block = lines[1:separator_line]
            header_yaml = load("".join(yaml_block), Loader=FullLoader)

        title = os.path.basename(path).replace('.md', '')
        header_yaml['title'] = title

        header_yaml['categories'] = parse_categories(path)
        if header_yaml['categories'] is None:
            del header_yaml['categories']

        header_str = dump(header_yaml, allow_unicode=True, sort_keys=False)

        print("---\n" + header_str + "---\n")

        if separator_line > 0:
            del lines[1:separator_line]
        else:
            lines = ["---\n", "---\n\n"] + lines

        lines.insert(1, header_str)

        file.seek(0)
        file.writelines(lines)
        file.truncate()


def main():
    files = []
    files.extend(get_all_markdown_files(get_source_path() + '/_drafts'))
    files.extend(get_all_markdown_files(get_source_path() + '/_posts'))

    print(f"Found {len(files)} markdown files.")

    # add_header(files[0])
    for file in files:
        add_header(file)


if __name__ == "__main__":
    main()
