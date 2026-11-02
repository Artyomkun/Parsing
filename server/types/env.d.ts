declare namespace NodeJS {
    interface ProcessEnv {
        SSL_CERT_PATH?: string;
        SSL_KEY_PATH?: string;
    }
}

interface ImportMetaEnv {
    readonly DEV: boolean;
    readonly PROD: boolean;
    readonly MODE: string;
    readonly BASE_URL: string;
    readonly [key: string]: string | boolean | undefined;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
