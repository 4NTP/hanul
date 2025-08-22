import type { Config } from 'jest';
import nextJest from 'next/jest';
import { baseConfig } from './base';

const createJestConfig = nextJest({
  dir: './',
});

export const nextConfig = createJestConfig({
  ...baseConfig,
  moduleFileExtensions: [...baseConfig.moduleFileExtensions, 'jsx', 'tsx'],
  moduleNameMapper: {
    ...baseConfig.moduleNameMapper,
    '^@/ui/(.*)$': '@hanul/ui/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(next-intl|@hanul|lucide-react)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/test/setup.js'],
} as const satisfies Config);
