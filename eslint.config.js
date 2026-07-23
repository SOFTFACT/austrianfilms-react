import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    // shadcn/ui primitives deliberately export non-components next to the
    // component itself — the cva variant objects (buttonVariants, …) are part
    // of the public API so styling can be reused without the component
    // (`<Link className={buttonVariants({variant:'ghost'})}>`), and useSidebar
    // must live in the file that owns its context. Satisfying the rule here
    // would mean breaking that API. The only cost is a full reload instead of
    // a hot swap when editing these files, so silence it rather than let it
    // drown out real findings in `npm run lint`.
    files: ['src/components/ui/**'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
])
