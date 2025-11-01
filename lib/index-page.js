(function (window, document) {
    const { buildAttachmentUrl } = window.AttachmentUtils;
    let filesData = [];

    document.addEventListener('DOMContentLoaded', () => {
        fetch('files_info.json')
            .then(response => response.json())
            .then(data => {
                filesData = data;
                const fileList = document.getElementById('files');
                filesData.forEach((fileData, index) => {
                    const li = document.createElement('li');
                    li.textContent = fileData.html_file;
                    li.onclick = () => showFileContent(index);
                    fileList.appendChild(li);
                });

                const urlParams = new URLSearchParams(window.location.search);
                const searchQuery = urlParams.get('search');
                if (searchQuery) {
                    const searchInput = document.getElementById('searchInput');
                    searchInput.value = decodeURIComponent(searchQuery);
                    searchFiles();
                } else {
                    const htmlFile = urlParams.get('htmlFile');
                    if (htmlFile) {
                        const fileIndex = filesData.findIndex(file => file.html_file === htmlFile);
                        if (fileIndex !== -1) {
                            showFileContent(fileIndex);
                        }
                    }
                }
            });

        window.addEventListener('scroll', scrollFunction);
    });

    function showFileContent(index) {
        const contentDiv = document.getElementById('content');
        contentDiv.innerHTML = '';
        const fileData = filesData[index];
        const iframe = document.createElement('iframe');
        iframe.style.width = '100%';
        iframe.style.height = '400px';
        iframe.style.border = '1px solid #ccc';
        iframe.src = encodeURI(fileData.html_file + '.html');
        contentDiv.appendChild(iframe);

        const attachments = Array.isArray(fileData.files) ? fileData.files : [];
        if (attachments.length > 0) {
            const galleryDiv = document.createElement('div');
            galleryDiv.id = 'lightgallery';
            const downloadLinksDiv = document.createElement('div');
            downloadLinksDiv.id = 'download-links';

            attachments.forEach(file => {
                const fileExt = (file.split('.').pop() || '').toLowerCase();
                const fileUrl = buildAttachmentUrl(fileData, file);

                if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(fileExt)) {
                    const a = document.createElement('a');
                    a.href = fileUrl;
                    const img = document.createElement('img');
                    img.alt = file;
                    img.src = fileUrl;
                    a.appendChild(img);
                    galleryDiv.appendChild(a);
                } else if (['mp4', 'mov', 'webm'].includes(fileExt)) {
                    const a = document.createElement('a');
                    a.href = fileUrl;
                    const img = document.createElement('img');
                    img.alt = `${file} (video)`;
                    img.src = 'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/images/video-play.png';
                    a.appendChild(img);
                    galleryDiv.appendChild(a);
                } else {
                    const p = document.createElement('p');
                    const a = document.createElement('a');
                    a.href = fileUrl;
                    a.download = file;
                    const icon = document.createElement('span');
                    icon.className = `fiv-cla fiv-icon-${fileExt}`;
                    a.appendChild(icon);
                    a.appendChild(document.createTextNode(` ${file}`));
                    p.appendChild(a);
                    downloadLinksDiv.appendChild(p);
                }
            });

            if (galleryDiv.children.length > 0) {
                contentDiv.appendChild(galleryDiv);
                lightGallery(galleryDiv, {
                    plugins: [lgVideo],
                });
            }

            if (downloadLinksDiv.children.length > 0) {
                contentDiv.appendChild(downloadLinksDiv);
            }
        }
    }

    function searchFiles() {
        const input = document.getElementById('searchInput');
        const filter = input.value;
        const keywords = filter.split(' ').filter(k => k);
        const ul = document.getElementById('files');
        const li = ul.getElementsByTagName('li');

        for (let i = 0; i < li.length; i++) {
            if (!li[i].dataset.originalText) {
                li[i].dataset.originalText = li[i].textContent;
            }
            const originalText = li[i].dataset.originalText;

            if (keywords.length === 0) {
                li[i].innerHTML = originalText;
                li[i].style.display = '';
                continue;
            }

            const regex = new RegExp(keywords.map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|'), 'gi');
            const hasMatch = regex.test(originalText);

            if (hasMatch) {
                const highlightedText = originalText.replace(regex, match => `<mark>${match}</mark>`);
                li[i].innerHTML = highlightedText;
                li[i].style.display = '';
            } else {
                li[i].innerHTML = originalText;
                li[i].style.display = 'none';
            }
        }
    }

    function scrollFunction() {
        const scrollTopBtn = document.getElementById('scrollTopBtn');
        if (!scrollTopBtn) {
            return;
        }
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollTopBtn.style.display = 'block';
        } else {
            scrollTopBtn.style.display = 'none';
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
