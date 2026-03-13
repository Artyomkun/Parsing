declare global {
  namespace App {
    namespace Electron {
      interface FileInfo {
        path: string;
        name: string;
        size: number;
        createdAt: Date;
        modifiedAt: Date;
        isDirectory: boolean;
      }
    }
    
    namespace Parsing {
      interface ParserOptions {
        delimiter?: string;
        indent?: number;
        headers?: boolean;
      }
    }
  }
}

export {};