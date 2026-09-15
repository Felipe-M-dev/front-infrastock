import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

const legacyEffectFiles = [
  'src/components/CredentialAssignments.tsx',
  'src/components/CredentialUsageModal.tsx',
  'src/components/ExportServersModal.tsx',
  'src/components/ServerFormModal.tsx',
  'src/components/ServerImportModal.tsx',
  'src/components/ServerValuationPanel.tsx',
  'src/layouts/AppLayout.tsx',
  'src/pages/CompaniesPage.tsx',
  'src/pages/CredentialsPage.tsx',
  'src/pages/IpManagementPage.tsx',
  'src/pages/OperatingSystemsPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/ServersPage.tsx',
  'src/pages/UsersPage.tsx',
]

const legacyDependencyFiles = [
  'src/components/AuditRevertModal.tsx',
  'src/components/ExportServersModal.tsx',
  'src/components/ServerValuationPanel.tsx',
  'src/pages/IpManagementPage.tsx',
  'src/pages/PricingPage.tsx',
  'src/pages/ServersPage.tsx',
]

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
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    files: legacyEffectFiles,
    rules: {
      'react-hooks/set-state-in-effect': 'off',
    },
  },
  {
    files: legacyDependencyFiles,
    rules: {
      'react-hooks/exhaustive-deps': 'off',
    },
  },
  {
    files: ['src/components/ToastProvider.tsx'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    files: ['src/services/credentials.service.ts'],
    rules: {
      'no-useless-assignment': 'off',
    },
  },
])
