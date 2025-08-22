import { render, screen } from '@testing-library/react';
import Navbar from '../navbar';

// Mock the child components
jest.mock('../theme-toggle', () => {
  return function ThemeToggle() {
    return <button data-testid="theme-toggle">Theme</button>;
  };
});

jest.mock('../locale-switcher', () => {
  return function LocaleSwitcher() {
    return <button data-testid="locale-switcher">Language</button>;
  };
});

describe('Navbar', () => {
  it('renders brand link correctly', () => {
    render(<Navbar />);

    const brandLink = screen.getByRole('link', { name: 'Hanul' });
    expect(brandLink).toBeInTheDocument();
    expect(brandLink).toHaveAttribute('href', '/');
  });

  it('renders home link correctly', () => {
    render(<Navbar />);

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toBeInTheDocument();
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('renders sign in button correctly', () => {
    render(<Navbar />);

    const signInButton = screen.getByRole('link', { name: 'Sign In' });
    expect(signInButton).toBeInTheDocument();
    expect(signInButton).toHaveAttribute('href', '/signin');
  });

  it('renders theme toggle and locale switcher', () => {
    render(<Navbar />);

    expect(screen.getByTestId('theme-toggle')).toBeInTheDocument();
    expect(screen.getByTestId('locale-switcher')).toBeInTheDocument();
  });

  it('has proper header structure', () => {
    render(<Navbar />);

    const header = screen.getByRole('banner');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('sticky', 'top-0', 'z-40');
  });

  it('has navigation container with correct styling', () => {
    render(<Navbar />);

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('flex', 'items-center', 'gap-2');
  });
});
