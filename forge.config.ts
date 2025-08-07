import { ForgeConfig } from '@electron-forge/shared-types';
import VitePlugin from '@electron-forge/plugin-vite';
import path from 'path';

const config: ForgeConfig = {
  makers: [ /* your makers config */ ],
  plugins: [
    new VitePlugin({
      build: [
        {
          entry: path.resolve(__dirname, 'src/main/main.ts'),
          config: 'vite.main.config.ts',
        },
        {
          entry: path.resolve(__dirname, 'src/preload/preload.ts'),
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