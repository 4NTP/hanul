import react from '@hanul/eslint-config/react-internal';

export default [
  react,
  {
    languageOptions: {
      parserOptions: {
        project: 'tsconfig.json',
      },
    },
  },
];
