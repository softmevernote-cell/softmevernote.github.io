(function (global) {
    const supportsNormalize = typeof String.prototype.normalize === 'function';
    const toNfc = (value) => (supportsNormalize && typeof value === 'string') ? value.normalize('NFC') : value;

    const folderDomainRules = [
        {
            domain: 'https://evernote.softm.net/',
            folders: new Set([
                '내 노트',
                '내 노트 (1)',
                '내 노트 (2)',
                '내 노트 (3)',
                '내 노트 (4)',
                '내 노트 (5)',
                '내 노트 (6)',
                '내 노트 (7)'
            ].map(toNfc))
        },
        {
            domain: 'https://evernote2.softm.net/',
            folders: new Set([
                '내 노트 (8)',
                '내 노트 (9)',
                '내 노트 (10)',
                '내 노트 (11)',
                '내 노트 (12)',
                '내 노트 (13)',
                '내 노트 (14)'
            ].map(toNfc))
        }
    ];

    const hostRules = {
        'evernote.softm.net': folderDomainRules,
        'evernote2.softm.net': folderDomainRules
    };

    function buildAttachmentPath(htmlFile, fileName) {
        const base = typeof htmlFile === 'string' ? htmlFile : '';
        const trimmed = base.endsWith('.html') ? base.slice(0, -5) : base;
        const filesDir = trimmed.endsWith(' files') ? trimmed : `${trimmed} files`;
        return `${filesDir}/${fileName}`;
    }

    const localHostnames = new Set(['127.0.0.1', 'localhost']);

    function resolveAttachmentDomain(folderName) {
        const hostname = (global.location && global.location.hostname) || '';
        if (!hostname || localHostnames.has(hostname)) {
            return '';
        }
        const rulesForHost = hostRules[hostname];
        if (!rulesForHost || typeof folderName !== 'string') {
            return '';
        }
        const normalizedFolder = toNfc(folderName.trim());
        for (const rule of rulesForHost) {
            if (rule.folders.has(normalizedFolder)) {
                return rule.domain;
            }
        }
        return '';
    }

    function buildAttachmentUrl(fileEntry, fileName) {
        const relativePath = buildAttachmentPath(fileEntry && fileEntry.html_file, fileName);
        const folderName = (fileEntry && fileEntry.folder) || '';
        const domainPrefix = resolveAttachmentDomain(folderName);
        const fullPath = domainPrefix ? `${domainPrefix}${relativePath}` : relativePath;
        return encodeURI(fullPath);
    }

    global.AttachmentUtils = {
        buildAttachmentUrl
    };
})(window);
