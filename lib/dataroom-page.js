(function (window, document) {
    const { buildAttachmentUrl, setupLazyImage } = window.AttachmentUtils;
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
    const videoExtensions = ['mp4', 'mov', 'webm'];

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

    function computeHighlightIntervals(text, keywords) {
        if (!keywords || keywords.length === 0) {
            return [];
        }
        const comparable = toComparable(text);
        if (!comparable) {
            return [];
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

        if (!intervals.length) {
            return [];
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
        return merged;
    }

    function countHighlightMatches(text, keywords) {
        return computeHighlightIntervals(text, keywords).length;
    }

    function highlightText(text, keywords) {
        const intervals = computeHighlightIntervals(text, keywords);
        if (!intervals.length) {
            return escapeHtml(text);
        }

        let result = '';
        let cursor = 0;
        intervals.forEach(([start, end]) => {
            result += escapeHtml(text.slice(cursor, start));
            result += '<mark>' + escapeHtml(text.slice(start, end)) + '</mark>';
            cursor = end;
        });
        result += escapeHtml(text.slice(cursor));
        return result;
    }

    function calculateMatchScore(item, keywords) {
        if (!keywords || keywords.length === 0) {
            return 0;
        }
        return keywords.reduce((total, keyword) => {
            let score = 0;
            score += countOccurrences(item.filenameSearch, keyword);
            score += countOccurrences(item.filenameCollapsed, keyword);
            score += countOccurrences(item.filenameStripped, keyword);
            score += countOccurrences(item.htmlFileSearch, keyword);
            score += countOccurrences(item.htmlFileCollapsed, keyword);
            score += countOccurrences(item.htmlFileStripped, keyword);
            return total + score;
        }, 0);
    }

    function countOccurrences(haystack, needle) {
        if (!needle || !haystack) {
            return 0;
        }
        let total = 0;
        let position = 0;
        while (true) {
            const idx = haystack.indexOf(needle, position);
            if (idx === -1) {
                break;
            }
            total += 1;
            position = idx + needle.length;
        }
        return total;
    }

    document.addEventListener('DOMContentLoaded', () => {
        const fileList = document.getElementById('file-list');
        const searchInput = document.getElementById('searchInput');
        const galleryContainer = document.createElement('div');
        galleryContainer.id = 'lightgallery-container';
        galleryContainer.style.display = 'none';
        document.body.appendChild(galleryContainer);

        const modal = document.getElementById('myModal');
        const modalIframe = document.getElementById('modal-iframe');
        const closeModal = document.getElementsByClassName('close')[0];

        closeModal.onclick = () => {
            modal.style.display = 'none';
            modalIframe.src = '';
        };

        window.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
                modalIframe.src = '';
            }
        };

        let items = [];
        let currentMediaEntries = [];

        fetch('files_info.json')
            .then(response => response.json())
            .then(data => {
                const notes = Array.isArray(data) ? data : [];
                const collected = [];

                notes.forEach(note => {
                    const htmlFile = note.html_file || '';
                    const comparableTitle = toComparable(htmlFile);
                    const searchTitle = comparableTitle.trim();
                    const collapsedTitle = removeSpaces(searchTitle);
                    const strippedTitle = removeSpacesAndParens(searchTitle);

                    const attachments = Array.isArray(note.files) ? note.files : [];
                    attachments.forEach(fileName => {
                        const originalFileName = fileName || '';
                        const comparableName = toComparable(originalFileName);
                        const searchName = comparableName.trim();
                        const collapsedName = removeSpaces(searchName);
                        const strippedName = removeSpacesAndParens(searchName);
                        collected.push({
                            htmlFile,
                            htmlFileSearch: searchTitle,
                            htmlFileCollapsed: collapsedTitle,
                            htmlFileStripped: strippedTitle,
                            filename: originalFileName,
                            filenameSearch: searchName,
                            filenameCollapsed: collapsedName,
                            filenameStripped: strippedName,
                            folder: note.folder
                        });
                    });
                });

                items = collected;
                renderList(items, []);

                searchInput.addEventListener('keyup', () => {
                    const rawFilter = (searchInput.value || '').trim();
                    if (!rawFilter) {
                        renderList(items, []);
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

                    const highlightKeywords = Array.from(highlightKeywordSet);
                    const matchKeywords = Array.from(matchKeywordSet);

                    if (matchKeywords.length === 0) {
                        renderList(items, []);
                        return;
                    }

                    const scored = items
                        .map(item => {
                            const matchScore = calculateMatchScore(item, matchKeywords);
                            const highlightScore =
                                countHighlightMatches(item.htmlFile, highlightKeywords) +
                                countHighlightMatches(item.filename, highlightKeywords);
                            return { item, matchScore, highlightScore };
                        })
                        .filter(entry => entry.matchScore > 0 || entry.highlightScore > 0)
                        .sort((a, b) => {
                            if (b.highlightScore !== a.highlightScore) {
                                return b.highlightScore - a.highlightScore;
                            }
                            if (b.matchScore !== a.matchScore) {
                                return b.matchScore - a.matchScore;
                            }
                            return a.item.filename.localeCompare(b.item.filename);
                        })
                        .map(entry => entry.item);

                    renderList(scored, highlightKeywords);
                });
            });

        window.addEventListener('scroll', handleScrollButtonVisibility);

        function renderList(fileItems, highlightKeywords) {
            fileList.innerHTML = '';
            const mediaEntries = [];

            fileItems.forEach(fileItem => {
                const li = document.createElement('li');
                const filePath = buildAttachmentUrl({
                    html_file: fileItem.htmlFile,
                    folder: fileItem.folder
                }, fileItem.filename);
                const fileExt = (fileItem.filename.split('.').pop() || '').toLowerCase();

                const fileInfo = document.createElement('div');
                fileInfo.className = 'file-info';

                const htmlFileLink = document.createElement('a');
                htmlFileLink.href = 'javascript:void(0);';
                htmlFileLink.innerHTML = highlightText(fileItem.htmlFile, highlightKeywords);
                htmlFileLink.onclick = () => {
                    const searchQuery = fileItem.htmlFile.replace('.html', '').replace(/[^a-zA-Z0-9가-힣]/g, ' ');
                    modalIframe.src = `index.html?search=${encodeURIComponent(searchQuery)}`;
                    modal.style.display = 'block';
                };
                const htmlFileSpan = document.createElement('span');
                htmlFileSpan.className = 'html-file';
                htmlFileSpan.appendChild(htmlFileLink);

                const attachFileLink = document.createElement('a');
                attachFileLink.className = 'attach-file';

                let thumbnail;

                if (imageExtensions.includes(fileExt) || videoExtensions.includes(fileExt)) {
                    attachFileLink.href = 'javascript:void(0);';
                    attachFileLink.innerHTML = highlightText(fileItem.filename, highlightKeywords);
                    attachFileLink.onclick = (event) => {
                        event.preventDefault();
                        if (!currentMediaEntries.length) {
                            return;
                        }
                        const galleryIndex = currentMediaEntries.findIndex(entry => entry.src === filePath);
                        if (galleryIndex === -1) {
                            return;
                        }
                        const instance = lightGallery(galleryContainer, {
                            dynamic: true,
                            dynamicEl: currentMediaEntries,
                            index: galleryIndex,
                            plugins: [lgVideo]
                        });
                        instance.openGallery(galleryIndex);
                        instance.on('lgAfterClose', () => {
                            instance.destroy(true);
                        });
                    };

                    if (imageExtensions.includes(fileExt)) {
                        thumbnail = document.createElement('img');
                        thumbnail.alt = fileItem.filename;
                        setupLazyImage(thumbnail, filePath);
                    } else {
                        thumbnail = document.createElement('img');
                        thumbnail.src = 'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/images/video-play.png';
                        thumbnail.alt = `${fileItem.filename} (video)`;
                    }

                    const mediaEntry = { src: filePath };
                    if (videoExtensions.includes(fileExt)) {
                        mediaEntry.video = {
                            source: [
                                {
                                    src: filePath,
                                    type: fileExt === 'mov' ? 'video/quicktime' : `video/${fileExt}`
                                }
                            ],
                            attributes: {
                                preload: 'none',
                                controls: true
                            }
                        };
                    }
                    mediaEntries.push(mediaEntry);
                } else {
                    thumbnail = document.createElement('span');
                    thumbnail.className = `fiv-cla fiv-icon-${fileExt || 'txt'}`;
                    attachFileLink.href = filePath;
                    attachFileLink.download = fileItem.filename;
                    attachFileLink.innerHTML = highlightText(fileItem.filename, highlightKeywords);
                }

                li.appendChild(thumbnail);
                fileInfo.appendChild(htmlFileSpan);
                fileInfo.appendChild(attachFileLink);
                li.appendChild(fileInfo);
                fileList.appendChild(li);
            });

            currentMediaEntries = mediaEntries;
        }
    });

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

    window.scrollToTop = scrollToTop;
})(window, document);
