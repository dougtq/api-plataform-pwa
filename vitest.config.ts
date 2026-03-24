import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // DB tests don't strictly need JSDOM
    setupFiles: ['./src/renderer/test/setup.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/tests/e2e/**'],
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
    },
  },
})
