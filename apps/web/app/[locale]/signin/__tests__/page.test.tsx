import { render, screen } from '@testing-library/react';
import SignInPage from '../page';

// Mock environment variable
const originalEnv = process.env;
beforeAll(() => {
  process.env = {
    ...originalEnv,
    NEXT_PUBLIC_SERVER_URL: 'http://localhost:3000',
  };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('SignInPage', () => {
  it('renders sign in title and subtitle', () => {
    render(<SignInPage />);

    expect(
      screen.getByRole('heading', { name: 'Welcome back' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Choose a provider to continue'),
    ).toBeInTheDocument();
  });

  it('renders all OAuth provider buttons', () => {
    render(<SignInPage />);

    const googleButton = screen.getByRole('link', {
      name: 'Continue with Google',
    });
    const xButton = screen.getByRole('link', { name: 'Continue with X' });
    const appleButton = screen.getByRole('link', {
      name: 'Continue with Apple',
    });

    expect(googleButton).toBeInTheDocument();
    expect(xButton).toBeInTheDocument();
    expect(appleButton).toBeInTheDocument();
  });

  it('has correct URLs for OAuth providers', () => {
    render(<SignInPage />);

    const googleButton = screen.getByRole('link', {
      name: 'Continue with Google',
    });
    const xButton = screen.getByRole('link', { name: 'Continue with X' });
    const appleButton = screen.getByRole('link', {
      name: 'Continue with Apple',
    });

    expect(googleButton).toHaveAttribute(
      'href',
      'http://localhost:3000/auth/google',
    );
    expect(xButton).toHaveAttribute('href', 'http://localhost:3000/auth/x');
    expect(appleButton).toHaveAttribute(
      'href',
      'http://localhost:3000/auth/apple',
    );
  });

  it('renders terms hint text', () => {
    render(<SignInPage />);

    expect(
      screen.getByText(
        'By continuing, you agree to our Terms and Privacy Policy.',
      ),
    ).toBeInTheDocument();
  });

  it('renders sign up link', () => {
    render(<SignInPage />);

    expect(screen.getByText("Don't have an account?")).toBeInTheDocument();

    const signUpLink = screen.getByRole('link', { name: 'Sign up' });
    expect(signUpLink).toBeInTheDocument();
    expect(signUpLink).toHaveAttribute('href', '/signup');
  });

  it('has proper page layout structure', () => {
    render(<SignInPage />);

    const container = screen
      .getByRole('heading', { name: 'Welcome back' })
      .closest('div')?.parentElement;
    expect(container).toHaveClass('mx-auto', 'flex', 'min-h-svh', 'max-w-md');
  });

  it('all buttons have full width styling', () => {
    render(<SignInPage />);

    const googleButton = screen.getByRole('link', {
      name: 'Continue with Google',
    });
    const xButton = screen.getByRole('link', { name: 'Continue with X' });
    const appleButton = screen.getByRole('link', {
      name: 'Continue with Apple',
    });

    expect(googleButton).toHaveClass('w-full');
    expect(xButton).toHaveClass('w-full');
    expect(appleButton).toHaveClass('w-full');
  });

  it('has proper heading structure', () => {
    render(<SignInPage />);

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-2xl', 'font-bold');
  });
});
