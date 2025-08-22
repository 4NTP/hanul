import baseConfig from '@hanul/eslint-config/base';

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...baseConfig,
  {
    ignores: [
      'apps/**',
      'packages/**',
      'node_modules',
      'dist',
      '.turbo',
      'build',
      'coverage',
      '.next',
      '.out',
      'commitlint.config.cjs',
    ],
  },
];
