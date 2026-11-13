/// <reference types="vite/client" />

// SHA-256 of the site password, injected at build time by vite.config.ts (never the password itself)
declare const __PASS_HASH__: string
