/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_REGISTRY_PROCESS_ID: string;
  readonly VITE_CU_URL: string;
  readonly VITE_MU_URL: string;
  readonly VITE_HYPERBEAM_NODE: string;
  readonly DEV: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
