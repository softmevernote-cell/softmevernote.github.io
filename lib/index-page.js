(function (window, document) {
    const { buildAttachmentUrl } = window.AttachmentUtils;

    let notes = [];
    let defaultItems = [];
    let currentHighlightKeywords = [];

    document.addEventListener('DOMContentLoaded', () => {
        fetch('files_info.json')
            .then(response => response.json())
            .then(data => {
                notes = Array.isArray(data) ? data : [];
                notes.forEach((note, index) => {
                    const comparableTitle = toComparable(note.html_file || '');
                    const searchTitle = comparableTitle.trim();
                    note._index = index;
                    note._searchTitle = searchTitle;
                    note._searchTitleCollapsed = removeSpaces(searchTitle);
                    note._searchTitleStripped = removeSpacesAndParens(searchTitle);

                    const attachmentSearchValues = Array.isArray(note.files)
                        ? note.files.map(file => normalizeForSearch(file || ''))
                        : [];
                    note._searchAttachments = attachmentSearchValues;
                    note._searchAttachmentsCollapsed = attachmentSearchValues.map(removeSpaces);
                    note._searchAttachmentsStripped = attachmentSearchValues.map(removeSpacesAndParens);
                });

                defaultItems = notes.map(note => ({ note, index: note._index }));
                renderFileList(defaultItems);
                currentHighlightKeywords = [];

                const urlParams = new URLSearchParams(window.location.search);
                const searchQuery = urlParams.get('search');
                if (searchQuery) {
                    const searchInput = document.getElementById('searchInput');
                    searchInput.value = decodeURIComponent(searchQuery);
                    searchFiles();
                } else {
                    const htmlFile = urlParams.get('htmlFile');
                    if (htmlFile) {
                        const note = notes.find(item => item.html_file === htmlFile);
                        if (note) {
                            showFileContent(note._index);
                        }
                    }
                }
            });

        window.addEventListener('scroll', handleScrollButtonVisibility);
    });

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function toComparable(value) {
        return (value || '').normalize('NFKC').toLowerCase();
    }

    function normalizeForSearch(value) {
        return toComparable(value).trim();
    }

    function removeSpaces(value) {
        return value.replace(/\s+/g, '');
    }

    function removeSpacesAndParens(value) {
        return value.replace(/\s+/g, '').replace(/[()]/g, '');
    }

    function highlightText(text, keywords) {
        if (!keywords || keywords.length === 0) {
            return escapeHtml(text);
        }
        const comparable = toComparable(text);
        if (!comparable) {
            return escapeHtml(text);
        }

        const collapsedChars = [];
        const collapsedToOriginal = [];
        for (let i = 0; i < comparable.length; i++) {
            const ch = comparable[i];
            if (/\s/.test(ch) || ch === '(' || ch === ')') {
                continue;
            }
            collapsedChars.push(ch);
            collapsedToOriginal.push(i);
        }
        const collapsedComparable = collapsedChars.join('');

        const intervals = [];
        const addInterval = (start, end) => {
            if (start >= end) {
                return;
            }
            intervals.push([start, end]);
        };

        keywords.forEach(keyword => {
            const baseKeyword = normalizeForSearch(keyword);
            if (!baseKeyword) {
                return;
            }

            let position = 0;
            while (position < comparable.length) {
                const found = comparable.indexOf(baseKeyword, position);
                if (found === -1) {
                    break;
                }
                addInterval(found, found + baseKeyword.length);
                position = found + Math.max(baseKeyword.length, 1);
            }

            const collapsedKeyword = removeSpacesAndParens(baseKeyword);
            if (!collapsedKeyword || collapsedComparable.length === 0) {
                return;
            }

            let collapsedPosition = 0;
            while (collapsedPosition < collapsedComparable.length) {
                const foundCollapsed = collapsedComparable.indexOf(collapsedKeyword, collapsedPosition);
                if (foundCollapsed === -1) {
                    break;
                }
                const originalStart = collapsedToOriginal[foundCollapsed];
                const originalEnd = collapsedToOriginal[foundCollapsed + collapsedKeyword.length - 1] + 1;
                addInterval(originalStart, originalEnd);
                collapsedPosition = foundCollapsed + Math.max(collapsedKeyword.length, 1);
            }
        });

        if (intervals.length === 0) {
            return escapeHtml(text);
        }

        intervals.sort((a, b) => (a[0] - b[0]) || (a[1] - b[1]));
        const merged = [];
        intervals.forEach(([start, end]) => {
            if (!merged.length || start > merged[merged.length - 1][1]) {
                merged.push([start, end]);
            } else {
                merged[merged.length - 1][1] = Math.max(merged[merged.length - 1][1], end);
            }
        });

        let result = '';
        let cursor = 0;
        merged.forEach(([start, end]) => {
            result += escapeHtml(text.slice(cursor, start));
            result += '<mark>' + escapeHtml(text.slice(start, end)) + '</mark>';
            cursor = end;
        });
        result += escapeHtml(text.slice(cursor));
        return result;
    }

    function countOccurrences(haystack, needle) {
        if (!needle || !haystack) {
            return 0;
        }
        let total = 0;
        let position = 0;
        while (true) {
            const index = haystack.indexOf(needle, position);
            if (index === -1) {
                break;
            }
            total += 1;
            position = index + needle.length;
        }
        return total;
    }

    function calculateMatchScore(note, matchKeywords) {
        if (!matchKeywords || matchKeywords.length === 0) {
            return 0;
        }
        return matchKeywords.reduce((total, keyword) => {
            let score = 0;
            score += countOccurrences(note._searchTitle, keyword);
            score += countOccurrences(note._searchTitleCollapsed, keyword);
            score += countOccurrences(note._searchTitleStripped, keyword);
            note._searchAttachments.forEach((attachmentValue, idx) => {
                score += countOccurrences(attachmentValue, keyword);
                score += countOccurrences(note._searchAttachmentsCollapsed[idx], keyword);
                score += countOccurrences(note._searchAttachmentsStripped[idx], keyword);
            });
            return total + score;
        }, 0);
    }

    function renderFileList(items, highlightKeywords = []) {
        const fileList = document.getElementById('files');
        fileList.innerHTML = '';

        items.forEach(({ note, index }) => {
            const li = document.createElement('li');
            li.dataset.index = index;
            li.innerHTML = highlightText(note.html_file, highlightKeywords);
            li.onclick = () => showFileContent(index);
            fileList.appendChild(li);
        });
    }

    function showFileContent(index) {
        const note = notes[index];
        if (!note) {
            return;
        }
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = '';

        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '400px';
        iframe.style.border = '1px solid #ccc';
        iframe.src = encodeURI(note.html_file + '.html');
        contentDiv.appendChild(iframe);

        const attachments = Array.isArray(note.files) ? note.files : [];
        if (attachments.length === 0) {
            return;
        }

        const galleryContainer = document.createElement('div');
        galleryContainer.id = 'lightgallery';

        const downloadContainer = document.createElement('div');
        downloadContainer.id = 'download-links';

        attachments.forEach(file => {
            const fileExt = (file.split('.').pop() || '').toLowerCase();
            const fileUrl = buildAttachmentUrl(note, file);
            if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt)) {
                const anchor = document.createElement('a');
                anchor.href = fileUrl;
                const img = document.createElement('img');
                img.alt = file;
                img.src = fileUrl;
                anchor.appendChild(img);
                galleryContainer.appendChild(anchor);
            } else if (['mp4', 'mov', 'webm'].includes(fileExt)) {
                const anchor = document.createElement('a');
                anchor.href = fileUrl;
                const img = document.createElement('img');
                img.alt = `${file} (video)`;
                img.src = 'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/images/video-play.png';
                anchor.appendChild(img);
                galleryContainer.appendChild(anchor);
            } else {
                const p = document.createElement('p');
                const anchor = document.createElement('a');
                anchor.href = fileUrl;
                anchor.download = file;
                const icon = document.createElement('span');
                icon.className = `fiv-cla fiv-icon-${fileExt}`;
                anchor.appendChild(icon);
                const labelSpan = document.createElement('span');
                labelSpan.innerHTML = ' ' + highlightText(file, currentHighlightKeywords);
                anchor.appendChild(labelSpan);
                p.appendChild(anchor);
                downloadContainer.appendChild(p);
            }
        });

        if (galleryContainer.children.length > 0) {
            contentDiv.appendChild(galleryContainer);
            lightGallery(galleryContainer, {
                plugins: [lgVideo],
            });
        }

        if (downloadContainer.children.length > 0) {
            contentDiv.appendChild(downloadContainer);
        }
    }

    function searchFiles() {
        if (!notes.length) {
            return;
        }
        const input = document.getElementById('searchInput');
        const rawFilter = (input.value || '').trim();
        if (!rawFilter) {
            currentHighlightKeywords = [];
            renderFileList(defaultItems);
            return;
        }

        const rawWords = rawFilter.split(/\s+/);
        const highlightKeywordSet = new Set();
        const matchKeywordSet = new Set();

        rawWords.forEach(word => {
            const normalizedWord = normalizeForSearch(word);
            if (!normalizedWord) {
                return;
            }
            highlightKeywordSet.add(normalizedWord);
            matchKeywordSet.add(normalizedWord);

            const collapsed = removeSpaces(normalizedWord);
            if (collapsed && collapsed !== normalizedWord) {
                matchKeywordSet.add(collapsed);
            }

            const stripped = removeSpacesAndParens(normalizedWord);
            if (stripped && stripped !== normalizedWord && stripped !== collapsed) {
                matchKeywordSet.add(stripped);
            }
        });

        const matchKeywords = Array.from(matchKeywordSet);
        const highlightKeywords = Array.from(highlightKeywordSet);

        if (matchKeywords.length === 0) {
            currentHighlightKeywords = [];
            renderFileList(defaultItems);
            return;
        }

        currentHighlightKeywords = highlightKeywords;

        const scoredItems = notes
            .map(note => ({
                note,
                index: note._index,
                score: calculateMatchScore(note, matchKeywords),
            }))
            .filter(item => item.score > 0)
            .sort((a, b) => {
                if (b.score !== a.score) {
                    return b.score - a.score;
                }
                return a.note.html_file.localeCompare(b.note.html_file);
            })
            .map(item => ({ note: item.note, index: item.index }));

        renderFileList(scoredItems, highlightKeywords);
    }

    function handleScrollButtonVisibility() {
        const button = document.getElementById('scrollTopBtn');
        if (!button) {
            return;
        }
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            button.style.display = 'block';
        } else {
            button.style.display = 'none';
        }
    }

    function scrollToTop() {
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;
    }

    window.showFileContent = showFileContent;
    window.searchFiles = searchFiles;
    window.scrollToTop = scrollToTop;
})(window, document);
