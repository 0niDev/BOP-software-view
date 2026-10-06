/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** SQLite Cloud Weblite REST endpoint, e.g. https://<project>.<zone>.sqlite.cloud/v2/weblite/sql */
  readonly VITE_SQLITECLOUD_URL?: string
  /** SQLite Cloud API key. Never commit the real value — set it in a local .env.local or a CI secret. */
  readonly VITE_SQLITECLOUD_API_KEY?: string
  /** Database file name on the node, e.g. MainDatabase.sqlite */
  readonly VITE_SQLITECLOUD_DATABASE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
