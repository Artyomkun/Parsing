// Массив правил, определяющих платформу и версию
const platformRules = [
  {
    platform: 'iOS',
    pattern: /iP(hone|od|ad)/,
    getVersion: () => {
      const match = navigator.userAgent.match(/OS (\d+)_?(\d+)?_?(\d+)?/);
      if (match) {
        return `${match[1]}.${match[2] || 0}.${match[3] || 0}`;
      }
      return undefined;
    }
  },
  {
    platform: 'macOS',
    pattern: /Macintosh/,
    getVersion: () => {
      const match = navigator.userAgent.match(/Mac OS X (\d+)[._](\d+)[._]?(\d+)?/);
      if (match) {
        return `${match[1]}.${match[2]}.${match[3] || 0}`;
      }
      return undefined;
    }
  },
  {
    platform: 'Windows',
    pattern: /Windows NT/,
    getVersion: () => {
      const match = navigator.userAgent.match(/Windows NT (\d+\.\d+)/);
      if (match) {
        type WindowsVersionKey = '10.0' | '6.3' | '6.2' | '6.1' | '6.0' | '5.1' | '5.0';
        const versionMap: Record<WindowsVersionKey, string> = {
          '10.0': 'Windows 10',
          '6.3': 'Windows 8.1',
          '6.2': 'Windows 8',
          '6.1': 'Windows 7',
          '6.0': 'Windows Vista',
          '5.1': 'Windows XP',
          '5.0': 'Windows 2000',
        };

        const key = match[1] as WindowsVersionKey;
        return versionMap[key] || match[1];
      }
      return undefined;
    }
  },
  {
    platform: 'Android',
    pattern: /Android/,
    getVersion: () => {
      const match = navigator.userAgent.match(/Android (\d+\.?\d*)/);
      return match ? match[1] : undefined;
    }
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
    ]
  },
  {
    platform: 'Chrome OS',
    pattern: /CrOS/,
    getVersion: () => {
      const match = navigator.userAgent.match(/Chrome OS ([\d.]+)/);
      return match ? match[1] : undefined;
    }
  },
  {
    platform: 'Kindle Fire',
    pattern: /Silk|KFOT|KFTT/,
    getVersion: () => undefined,
  },
  {
    platform: 'FreeBSD',
    pattern: /FreeBSD/,
    getVersion: () => undefined,
  },
  {
    platform: 'Electron',
    pattern: /Electron/,
    getVersion: () => undefined,
  },
];

// Функция определения платформы и версии
function getFullOSInfo() {
  if (typeof navigator === 'undefined') {
    return { platform: 'Unknown' };
  }

  const ua = navigator.userAgent;

  for (const ext of platformRules) {
    const pattern = new RegExp(ext.pattern);
    if (pattern.test(ua)) {
      let platformName = ext.platform;
      let version;

      // Обработка getVersion
      if (ext.getVersion) {
        if (typeof ext.getVersion === 'string') {
          try {
            version = eval(ext.getVersion);
          } catch (e) {
            console.warn('Ошибка выполнения getVersion:', e);
          }
        } else if (typeof ext.getVersion === 'function') {
          try {
            version = ext.getVersion();
          } catch (e) {
            console.warn('Ошибка вызова getVersion:', e);
          }
        }
      }

      // Обработка Linux-дистрибутивов
      if (platformName === 'Linux' && ext.subRules) {
        for (const sub of ext.subRules) {
          if (new RegExp(sub.pattern).test(ua)) {
            platformName = sub.name;
            break;
          }
        }
      }

      return { platform: platformName, version };
    }
  }

  // Проверки для мобильных устройств
  if (/Android/.test(ua) || /iPhone|iPad|iPod/.test(ua)) {
    return { platform: 'Mobile' };
  }

  return { platform: 'Unknown' };
}

// Вызов функции и вывод результата
const info = getFullOSInfo();
console.log(`Платформа: ${info.platform}${info.version ? ', версия: ' + info.version : ''}`);