/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Backend API base URL (e.g. https://api.abhiiterates.com) */
  readonly VITE_API_URL: string
  /** UPI VPA for student payments (e.g. yourname@upi) */
  readonly VITE_UPI_ID: string
  /** App environment: 'development' | 'production' */
  readonly MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
