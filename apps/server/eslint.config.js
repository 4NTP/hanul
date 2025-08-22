import nestConfig from '@hanul/eslint-config/nest-js';

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...nestConfig,
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
