import Parsing from "./parsing";

export namespace Electron {
  export interface FileDialogOptions {
    title?: string;
    buttonLabel?: string;
    filters?: { name: string; extensions: string[] }[];
    properties?: string[];
  }
}

export namespace Components {
  export interface ButtonProps {
    variant?: string;
    size?: string;
  }
}

export interface App {}

declare interface IElectronAPI {
  parseData: (config: Parsing.ParseConfig) => Promise<string>;
  parseHTML: (url: string, selector: string) => Promise<string[]>;
  parseDynamic: (url: string, selector: string) => Promise<string[]>;
  fileApi: {
    openDialog: (options?: Electron.FileDialogOptions) => Promise<string[]>;
  };
}

declare interface Window {
  electronAPI: IElectronAPI;
}