import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import eslintConfigPrettier from 'eslint-config-prettier'

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/.expo/**',
      '**/coverage/**',
      'apps/mobile/**', // React Native / JSX — not covered by this Node-focused config yet
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-restricted-properties': [
        'error',
        {
          object: 'process',
          property: 'env',
          message: 'Use `env.X` from lib/env.ts instead of raw process.env — it validates at boot and gives you types.',
        },
      ],
    },
  },
  {
    // lib/env.ts is the one designated place allowed to read raw process.env.
    files: ['apps/api/src/lib/env.ts'],
    rules: {
      'no-restricted-properties': 'off',
    },
  },
  {
    // Fastify plugins/routes are required to be async by the FastifyPluginAsync
    // contract (Fastify awaits registration for correct lifecycle ordering), even
    // when a specific plugin body has no direct `await` of its own.
    files: ['**/*.routes.ts', '**/*-routes.ts', 'apps/api/src/plugins/**/*.ts'],
    rules: {
      '@typescript-eslint/require-await': 'off',
    },
  },
  {
    // vi.mocked(obj.method) on plain method-shorthand objects (our repository/service
    // pattern) trips `unbound-method` even though nothing here ever reads `this`; and
    // vitest matchers like expect.stringContaining() commonly resolve to `any` in the
    // type-checked lint pass. Both are well-known test-file-only false positives.
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
    },
  },
  eslintConfigPrettier,
)
