require('@testing-library/jest-dom');
const React = require('react');

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock @/i18n/navigation
jest.mock('@/i18n/navigation', () => ({
  Link: ({ children, href, ...props }) =>
    React.createElement('a', { href, ...props }, children),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => '/',
  redirect: jest.fn(),
  getPathname: jest.fn(),
}));

// Mock @/i18n/routing
jest.mock('@/i18n/routing', () => ({
  routing: {
    locales: ['en', 'ko'],
    defaultLocale: 'en',
  },
}));

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: (namespace) => (key) => {
    const translations = {
      brand: 'Hanul',
      home: 'Home',
      signIn: 'Sign In',
      theme: 'Theme',
      language: 'Language',
      system: 'System',
      light: 'Light',
      dark: 'Dark',
      'locale.en': 'English',
      'locale.ko': '한국어',
      badge: 'AI-Powered Intelligence',
      headline: 'Hanul: Your Intelligent AI Agent Service',
      subhead:
        'Experience the future of automated assistance with our advanced AI agent platform.',
      ctaPrimary: 'Start with AI',
      ctaSecondary: 'Explore Features',
      signInTitle: 'Welcome back',
      signInSub: 'Choose a provider to continue',
      withGoogle: 'Continue with Google',
      withX: 'Continue with X',
      withApple: 'Continue with Apple',
      termsHint: 'By continuing, you agree to our Terms and Privacy Policy.',
      noAccount: "Don't have an account?",
      signUpLink: 'Sign up',
    };

    return translations[key] || key;
  },
  useLocale: () => 'en',
  useFormatter: () => ({
    dateTime: (date) => date.toLocaleDateString(),
    number: (num) => num.toString(),
  }),
  NextIntlClientProvider: ({ children }) => children,
}));

// Mock next-themes
jest.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'system',
    setTheme: jest.fn(),
    themes: ['light', 'dark', 'system'],
  }),
  ThemeProvider: ({ children }) => children,
}));

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Sun: () => React.createElement('svg', { 'data-testid': 'sun-icon' }),
  Moon: () => React.createElement('svg', { 'data-testid': 'moon-icon' }),
  Monitor: () => React.createElement('svg', { 'data-testid': 'monitor-icon' }),
}));

// Mock @hanul/ui components
jest.mock('@hanul/ui/components/button', () => ({
  Button: ({ children, asChild, ...props }) => {
    if (asChild) {
      return children;
    }
    return React.createElement('button', props, children);
  },
}));

jest.mock('@hanul/ui/components/dropdown-menu', () => ({
  DropdownMenu: ({ children }) =>
    React.createElement('div', { 'data-testid': 'dropdown-menu' }, children),
  DropdownMenuTrigger: ({ children, asChild }) =>
    asChild ? children : React.createElement('div', null, children),
  DropdownMenuContent: ({ children }) =>
    React.createElement('div', { 'data-testid': 'dropdown-content' }, children),
  DropdownMenuItem: ({ children, onClick }) =>
    React.createElement('div', { onClick, role: 'menuitem' }, children),
}));
