<<<<<<< HEAD
import { FusesPlugin } from '@electron-forge/plugin-fuses';
const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    new FusesPlugin({
      version: FuseVersion.V1,
      [FuseV1Options.RunAsNode]: false,
      [FuseV1Options.EnableCookieEncryption]: true,
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false,
      [FuseV1Options.EnableNodeCliInspectArguments]: false,
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true,
      [FuseV1Options.OnlyLoadAppFromAsar]: true,
    }),
  ],
  
  // Добавьте этот раздел для настройки порта разработки
  developers: {
    port: 39143, 
    open: true, 
    logger: {
      level: 'debug' 
    }
  }
=======
export default {
  build: {
    rollupOptions: {
      input: {
        main: './src/main/main.ts',
        preload: './src/preload/preload.ts',
        renderer: './src/renderer/MyApp/MyApp.tsx'
      }
    }
  }
}

module.exports = {
  packagerConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {
        name: 'myapp',
        authors: 'Your Name',
        description: 'My Electron App',
        exe: 'myapp.exe',
        setupIcon: './assets/icon.ico',
        noMsi: true
    },
      },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin', 'linux', 'win32'],
      config: {
        icon: './assets/icon.icns',
        overwrite: true,
      },
    },
    {
      name: '@electron-forge/maker-deb',
      config: {
        options: {
          icon: './assets/icon.png',
          categories: ['Utility'],
          maintainer: 'Your Name',
          homepage: 'https://example.com',
          description: 'My Electron App',
          depends: ['libappindicator1', 'libnotify-bin'],
          section: 'utils',
          priority: 'optional',
          version: '1.0.0',
          arch: 'amd64',
          name: 'myapp',
          productName: 'MyApp',
          genericName: 'My Electron Application',
          mimeType: 'application/x-myapp',
          scripts: {
            postinst: 'postinst.sh',
            postrm: 'postrm.sh'
          }
        }
      }
    },
    {
      name: '@electron-forge/maker-rpm',
    },
    {
      name: '@electron-forge/maker-dmg',
      config: {
        format: 'ULFO',
        icon: './assets/icon.icns',
        overwrite: true,
      },
    },
    {
      name: '@electron-forge/maker-appx',
      config: {
        packageName: 'com.example.myapp',
        publisher: 'CN=YourPublisherName',
        identityName: 'YourIdentityName',
        displayName: 'MyApp',
        version: '1.0.0',
        description: 'My Electron App',
        backgroundColor: '#FFFFFF',
        logo: './assets/icon.png',
        resources: {
          logo: './assets/icon.png',
          smallLogo: './assets/icon.png',
          square150x150Logo: './assets/icon.png',
          square44x44Logo: './assets/icon.png',
        },
        capabilities: [
          'internetClient',
          'privateNetworkClientServer',
          'documentsLibrary',
          'musicLibrary',
          'picturesLibrary',
          'videosLibrary',
          'removableStorage',
          'enterpriseAuthentication',
          'sharedUserCertificates',
          'appointments',
          'contacts',
          'location',
          'phoneCall',
          'voip',
          'backgroundTasks',
          'backgroundMediaPlayback',
          'backgroundTransfer',
          'backgroundLocation',
          'backgroundTasksSystem',
          'backgroundTasksSystemMedia',
          'backgroundTasksSystemLocation',
          'backgroundTasksSystemNetwork',
          'backgroundTasksSystemUserNotification',
          'backgroundTasksSystemUserNotificationManagement',
          'backgroundTasksSystemUserNotificationManagementMedia',
          'backgroundTasksSystemUserNotificationManagementLocation',
          'backgroundTasksSystemUserNotificationManagementNetwork',
          'backgroundTasksSystemUserNotificationManagementUser',
          'backgroundTasksSystemUserNotificationManagementBackground',
          'backgroundTasksSystemUserNotificationManagementBackgroundMedia',
          'backgroundTasksSystemUserNotificationManagementBackgroundLocation',
          'backgroundTasksSystemUserNotificationManagementBackgroundNetwork',
          'backgroundTasksSystemUserNotificationManagementBackgroundUser',
          'backgroundTasksSystemUserNotificationManagementBackgroundTasks',
          'backgroundTasksSystemUserNotificationManagementBackgroundTasksMedia',
          'backgroundTasksSystemUserNotificationManagementBackgroundTasksLocation',
          'backgroundTasksSystemUserNotificationManagementBackgroundTasksNetwork',
          'backgroundTasksSystemUserNotificationManagementBackgroundTasksUser'
        ]
      },
    },
  ],
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
};