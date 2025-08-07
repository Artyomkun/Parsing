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
};