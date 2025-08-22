import nextConfig from '@hanul/eslint-config/next-js';

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...nextConfig,
  {
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
        tsconfigRootDir: __dirname,
        sourceType: 'module',
      },
    },
  },
];
