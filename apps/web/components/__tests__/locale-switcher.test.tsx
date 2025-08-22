import { render, screen, fireEvent } from '@testing-library/react';
import LocaleSwitcher from '../locale-switcher';

// Mock next-intl navigation hooks
const mockReplace = jest.fn();
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  usePathname: () => '/test-path',
}));

// Mock next-intl hooks
jest.mock('next-intl', () => ({
  useTranslations: () => (key) => {
    const translations = {
      language: 'Language',
      'locale.en': 'English',
      'locale.ko': '한국어',
    };
    return translations[key] || `Nav.${key}`;
  },
  useLocale: () => 'en',
}));

describe('LocaleSwitcher', () => {
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it('renders language switcher button correctly', () => {
    render(<LocaleSwitcher />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Language');
  });

  it('displays correct flag for English locale', () => {
    render(<LocaleSwitcher />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🇺🇸');
  });

  it('opens dropdown when clicked', () => {
    render(<LocaleSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('한국어')).toBeInTheDocument();
  });

  it('shows both locale options with correct flags', () => {
    render(<LocaleSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const menuItems = screen.getAllByRole('menuitem');
    expect(menuItems).toHaveLength(2);

    // Check for flags in dropdown options
    expect(screen.getAllByText('🇺🇸')).toHaveLength(2); // One in button, one in dropdown
    expect(screen.getByText('🇰🇷')).toBeInTheDocument();
  });

  it('calls router.replace when locale option is clicked', () => {
    render(<LocaleSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const koreanOption = screen.getByText('한국어');
    fireEvent.click(koreanOption);

    expect(mockReplace).toHaveBeenCalledWith(
      { pathname: '/test-path' },
      { locale: 'ko' },
    );
  });

  it('calls router.replace with English locale', () => {
    render(<LocaleSwitcher />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const englishOption = screen.getByText('English');
    fireEvent.click(englishOption);

    expect(mockReplace).toHaveBeenCalledWith(
      { pathname: '/test-path' },
      { locale: 'en' },
    );
  });

  it('displays correct flag function', () => {
    render(<LocaleSwitcher />);

    // Test that the button shows US flag for 'en' locale
    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('🇺🇸');
  });
});
