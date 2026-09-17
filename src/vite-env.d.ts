/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADMIN_USERNAME: string;
  readonly VITE_ADMIN_PASSWORD_SHA256: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
