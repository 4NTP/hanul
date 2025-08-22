import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '../theme-toggle';

// Mock next-themes hook
const mockSetTheme = jest.fn();
jest.mock('next-themes', () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: 'system',
  }),
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('renders theme toggle button correctly', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Theme');
  });

  it('opens dropdown when clicked', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(screen.getByText('System')).toBeInTheDocument();
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
  });

  it('calls setTheme with system when system option is clicked', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const systemOption = screen.getByText('System');
    fireEvent.click(systemOption);

    expect(mockSetTheme).toHaveBeenCalledWith('system');
  });

  it('calls setTheme with light when light option is clicked', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const lightOption = screen.getByText('Light');
    fireEvent.click(lightOption);

    expect(mockSetTheme).toHaveBeenCalledWith('light');
  });

  it('calls setTheme with dark when dark option is clicked', () => {
    render(<ThemeToggle />);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    const darkOption = screen.getByText('Dark');
    fireEvent.click(darkOption);

    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });

  it('displays sun and moon icons', () => {
    render(<ThemeToggle />);

    expect(screen.getAllByTestId('sun-icon')).toHaveLength(2); // One in button, one in dropdown
    expect(screen.getAllByTestId('moon-icon')).toHaveLength(2); // One in button, one in dropdown
  });
});
