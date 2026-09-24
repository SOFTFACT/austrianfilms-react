import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

/**
 * Unit tests: contracts checked without a browser, a 4D backend or seeded
 * data, in milliseconds. Merges vite.config so the `@` alias and plugins are
 * not restated by hand.
 *
 * `include` is deliberately narrow: Vitest's default pattern would also
 * collect Playwright's e2e/*.spec.ts and run them without a browser.
 */
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    },
  }),
)
