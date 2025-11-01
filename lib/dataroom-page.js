(function (window, document) {
    const { buildAttachmentUrl } = window.AttachmentUtils;

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

        closeModal.onclick = function () {
            modal.style.display = 'none';
            modalIframe.src = '';
        };

        window.onclick = function (event) {
            if (event.target === modal) {
                modal.style.display = 'none';
                modalIframe.src = '';
            }
        };

        let allFiles = [];
        let galleryItems = [];

        fetch('files_info.json')
            .then(response => response.json())
            .then(data => {
                for (const htmlFile in data) {
                    if (!Object.prototype.hasOwnProperty.call(data, htmlFile)) {
                        continue;
                    }
                    const htmlInfo = data[htmlFile];
                    htmlInfo.files.forEach(file => {
                        allFiles.push({
                            html_file: htmlInfo.html_file,
                            filename: file,
                            folder: htmlInfo.folder
                        });
                    });
                }
                galleryItems = allFiles
                    .filter(f => ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm'].includes(f.filename.split('.').pop().toLowerCase()))
                    .map(f => ({ src: buildAttachmentUrl(f, f.filename) }));

                const lg = lightGallery(galleryContainer, {
                    dynamic: true,
                    dynamicEl: galleryItems,
                    plugins: [lgVideo]
                });

                function renderList(filesToRender) {
                    fileList.innerHTML = '';
                    filesToRender.forEach(fileData => {
                        const li = document.createElement('li');
                        const fileUrl = buildAttachmentUrl(fileData, fileData.filename);
                        const fileExt = fileData.filename.split('.').pop().toLowerCase();

                        let thumbnail;
                        const fileInfo = document.createElement('div');
                        fileInfo.className = 'file-info';

                        const htmlFileLink = document.createElement('a');
                        htmlFileLink.href = 'javascript:void(0);';
                        htmlFileLink.textContent = fileData.html_file;
                        htmlFileLink.onclick = () => {
                            const searchQuery = fileData.html_file.replace('.html', '').replace(/[^a-zA-Z0-9가-힣]/g, ' ');
                            modalIframe.src = `index.html?search=${encodeURIComponent(searchQuery)}`;
                            modal.style.display = 'block';
                        };
                        const htmlFileSpan = document.createElement('span');
                        htmlFileSpan.className = 'html-file';
                        htmlFileSpan.appendChild(htmlFileLink);

                        const attachFileLink = document.createElement('a');
                        attachFileLink.className = 'attach-file';
                        attachFileLink.textContent = fileData.filename;

                        if (['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'webm'].includes(fileExt)) {
                            attachFileLink.href = 'javascript:void(0);';
                            attachFileLink.dataset.src = fileUrl;
                            attachFileLink.onclick = (e) => {
                                e.preventDefault();
                                const clickedSrc = e.currentTarget.dataset.src;
                                const galleryIndex = galleryItems.findIndex(item => item.src === clickedSrc);
                                if (galleryIndex !== -1) {
                                    lg.openGallery(galleryIndex);
                                }
                            };

                            if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExt)) {
                                thumbnail = document.createElement('img');
                                thumbnail.src = fileUrl;
                            } else {
                                thumbnail = document.createElement('img');
                                thumbnail.src = 'https://cdn.jsdelivr.net/npm/lightgallery@2.7.2/images/video-play.png';
                                thumbnail.alt = `${fileData.filename} (video)`;
                            }
                        } else {
                            thumbnail = document.createElement('span');
                            thumbnail.className = `fiv-cla fiv-icon-${fileExt}`;
                            attachFileLink.href = fileUrl;
                            attachFileLink.download = fileData.filename;
                        }

                        li.appendChild(thumbnail);
                        fileInfo.appendChild(htmlFileSpan);
                        fileInfo.appendChild(attachFileLink);
                        li.appendChild(fileInfo);
                        fileList.appendChild(li);
                    });
                }

                renderList(allFiles);

                searchInput.addEventListener('keyup', function () {
                    const filter = searchInput.value.toLowerCase();
                    const filteredFiles = allFiles.filter(fileData => {
                        return fileData.filename.toLowerCase().includes(filter) || fileData.html_file.toLowerCase().includes(filter);
                    });
                    renderList(filteredFiles);
                });
            });

        window.addEventListener('scroll', scrollFunction);
    });

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

    window.scrollToTop = scrollToTop;
})(window, document);
