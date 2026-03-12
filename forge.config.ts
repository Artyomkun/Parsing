import { ForgeConfig } from '@electron-forge/shared-types';
import VitePlugin from '@electron-forge/plugin-vite';
import path from 'path';

const config: ForgeConfig = {
  makers: [ /* your makers config */ ],
  plugins: [
    new VitePlugin({
      build: [
        {
<<<<<<< HEAD
          entry: path.resolve(__dirname, 'server/MyApp/src/main/main.ts'),
          config: 'vite.main.config.ts',
        },
        {
          entry: path.resolve(__dirname, 'server/MyApp/src/preload/preload.ts'),
=======
          entry: path.resolve(__dirname, 'src/main/main.ts'),
          config: 'vite.main.config.ts',
        },
        {
          entry: path.resolve(__dirname, 'src/preload/preload.ts'),
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
          config: 'vite.preload.config.ts',
        },
      ],
      renderer: [
        {
          name: 'main_window',
          config: 'vite.renderer.config.ts',
        }
      ],
    }),
  ],
};

export default config;