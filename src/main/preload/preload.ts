import { ipcRenderer } from 'electron';

// Типы для API
type ParseConfig = {
  type: string;
  data: string;
};

type ParseResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: string;
};

// Универсальная функция для обработки IPC вызовов
const createIPCHandler = <T>(channel: string) => {
  return (...args: any[]) => 
    new Promise<T>((resolve, reject) => {
      const responseChannel = `${channel}:response`;
      
      // Обработчик однократного ответа
      const responseHandler = (_: any, response: ParseResponse<T>) => {
        ipcRenderer.removeListener(responseChannel, responseHandler);
        if (response.success && response.data !== undefined) {
          resolve(response.data);
        } else {
          reject(response.error || 'Unknown error');
        }
      };

      ipcRenderer.on(responseChannel, responseHandler);
      ipcRenderer.send(channel, ...args);
    });
};

contextBridge.exposeInMainWorld('electronAPI', {
  parseHTML: createIPCHandler<string[]>('parse:html'),
  parseDynamic: createIPCHandler<string[]>('parse:dynamic'),
  parseData: createIPCHandler<string>('parse:data')
});