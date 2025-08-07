declare namespace Electron {
  // Конфигурация для IPC каналов
  export interface IPCChannels {
    parseData: 'parse:data';
    parseHTML: 'parse:html';
    parseHTMLResponse: 'parse:html:response';
    parseDynamic: 'parse:dynamic';
    parseDynamicResponse: 'parse:dynamic:response';
  }

  // Настройки окна
  export interface WindowSettings {
    width: number;
    height: number;
    minWidth?: number;
    minHeight?: number;
    title: string;
  }
}

export default Electron;