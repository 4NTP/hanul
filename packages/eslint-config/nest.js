import base from './base';

/**
 * @type {import("eslint").Linter.Config[]}
 */
export default [
  ...base,
  {
    rules: {
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
    env: {
      node: true,
      jest: true,
    },
  },
];
