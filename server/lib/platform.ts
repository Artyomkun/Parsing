type PlatformInfo = { 
    platform: string;
    version?: string 
};

const platformRules = [
    {
        platform: 'iOS',
        pattern: /iP(hone|od|ad)/,
        getVersion: () => {
            const m = navigator.userAgent.match(/OS (\d+)_?(\d+)?_?(\d+)?/);
            return m ? `${m[1]}.${m[2] || 0}.${m[3] || 0}` : undefined;
        },
    },
    {
        platform: 'macOS',
        pattern: /Macintosh/,
        getVersion: () => {
            const m = navigator.userAgent.match(/Mac OS X (\d+)[._](\d+)[._]?(\d+)?/);
            return m ? `${m[1]}.${m[2]}.${m[3] || 0}` : undefined;
        },
    },
    {
        platform: 'Windows',
        pattern: /Windows NT/,
        getVersion: () => {
            const m = navigator.userAgent.match(/Windows NT (\d+\.\d+)/);
            if (!m) {return undefined;}
            const map: Record<string, string> = {
                '10.0': 'Windows 10',
                '6.3': 'Windows 8.1',
                '6.2': 'Windows 8',
                '6.1': 'Windows 7',
                '6.0': 'Windows Vista',
                '5.1': 'Windows XP',
                '5.0': 'Windows 2000',
            };
            return map[m[1]] ?? m[1];
        },
    },
    {
        platform: 'Android',
        pattern: /Android/,
        getVersion: () => navigator.userAgent.match(/Android (\d+\.?\d*)/)?.[1],
    },
    {
        platform: 'Linux',
        pattern: /Linux/,
        getVersion: () => undefined,
        subRules: [
            { pattern: /Ubuntu/, name: 'Ubuntu' },
            { pattern: /Fedora/, name: 'Fedora' },
            { pattern: /Debian/, name: 'Debian' },
            { pattern: /Arch/, name: 'Arch Linux' },
            { pattern: /Mint/, name: 'Linux Mint' },
            { pattern: /CentOS/, name: 'CentOS' },
            { pattern: /openSUSE/, name: 'openSUSE' },
        ],
    },
    { 
      platform: 'Chrome OS', pattern: /CrOS/,
      getVersion: () => navigator.userAgent.match(/Chrome OS ([\d.]+)/)?.[1] 
    },
    {
      platform: 'Kindle Fire',
      pattern: /Silk|KFOT|KFTT/,
      getVersion: () => undefined
    },
    {
      platform: 'FreeBSD', 
      pattern: /FreeBSD/,
      getVersion: () => undefined
    },
];

function getFullOSInfo(): PlatformInfo {
    if (typeof navigator === 'undefined') {return { platform: 'Unknown' };}

    const ua = navigator.userAgent;

    for (const ext of platformRules) {
        if (!ext.pattern.test(ua)) {continue;}

        let platformName = ext.platform;
        let version: string | undefined;

        if (typeof ext.getVersion === 'function') {
            try {
                version = ext.getVersion();
            } catch (e) {
                console.warn('Ошибка вызова getVersion:', e);
            }
        }

        if (platformName === 'Linux' && ext.subRules) {
            for (const sub of ext.subRules) {
                if (sub.pattern.test(ua)) {
                    platformName = sub.name;
                    break;
                }
            }
        }

        return { platform: platformName, version };
    }

    if (/Android|iPhone|iPad|iPod/.test(ua)) {
      return { platform: 'Mobile' };
    }

    return { platform: 'Unknown' };
}

const info = getFullOSInfo();