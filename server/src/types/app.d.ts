import Parsing from "./parsing";

declare interface IElectronAPI {
  parseData: (config: Parsing.ParseConfig) => Promise<string>;
  parseHTML: (url: string, selector: string) => Promise<string[]>;
  parseDynamic: (url: string, selector: string) => Promise<string[]>;
}

declare interface Window {
  electronAPI: IElectronAPI;
}

declare module "*.module.css" {
  const classes: { [key: string]: string };
  export default classes;
}

declare module "*.svg" {
  const content: React.FunctionComponent<React.SVGProps<SVGSVGElement>>;
  export default content;
}