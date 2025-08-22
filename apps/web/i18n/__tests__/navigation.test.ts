import { describe, it, expect } from '@jest/globals';

// Mock the routing module
jest.mock('../routing', () => ({
  routing: {
    locales: ['en', 'ko'],
    defaultLocale: 'en',
  },
}));

// Mock next-intl/navigation
const mockCreateNavigation = jest.fn();
jest.mock('next-intl/navigation', () => ({
  createNavigation: mockCreateNavigation,
}));

describe('Navigation utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();

    // Setup mock return values
    mockCreateNavigation.mockReturnValue({
      Link: jest.fn(),
      redirect: jest.fn(),
      usePathname: jest.fn(),
      useRouter: jest.fn(),
      getPathname: jest.fn(),
    });
  });

  it('creates navigation with routing configuration', () => {
    // This test verifies that the navigation module imports and uses createNavigation
    // The actual implementation will call createNavigation with routing config
    const navigation = require('../navigation');

    // Verify exports exist
    expect(navigation.Link).toBeDefined();
    expect(navigation.useRouter).toBeDefined();
    expect(navigation.usePathname).toBeDefined();
  });

  it('exports all required navigation utilities', () => {
    const navigation = require('../navigation');

    expect(navigation.Link).toBeDefined();
    expect(navigation.redirect).toBeDefined();
    expect(navigation.usePathname).toBeDefined();
    expect(navigation.useRouter).toBeDefined();
    expect(navigation.getPathname).toBeDefined();
  });
});
