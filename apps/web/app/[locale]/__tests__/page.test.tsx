import { render, screen } from '@testing-library/react';
import LandingPage from '../page';

describe('LandingPage', () => {
  it('renders all main elements correctly', () => {
    render(<LandingPage />);

    expect(screen.getByText('AI-Powered Intelligence')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', {
        name: 'Hanul: Your Intelligent AI Agent Service',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Experience the future of automated assistance with our advanced AI agent platform.',
      ),
    ).toBeInTheDocument();
  });

  it('renders call-to-action buttons', () => {
    render(<LandingPage />);

    const getStartedButton = screen.getByRole('link', {
      name: 'Start with AI',
    });
    const learnMoreButton = screen.getByRole('link', {
      name: 'Explore Features',
    });

    expect(getStartedButton).toBeInTheDocument();
    expect(getStartedButton).toHaveAttribute('href', '/signin');

    expect(learnMoreButton).toBeInTheDocument();
    expect(learnMoreButton).toHaveAttribute('href', '/');
  });

  it('has proper semantic structure', () => {
    render(<LandingPage />);

    const section = document.querySelector('section');
    expect(section).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveClass('text-4xl', 'font-bold');
  });

  it('displays badge with status indicator', () => {
    render(<LandingPage />);

    const badge = screen.getByText('AI-Powered Intelligence');
    const badgeContainer = badge.closest('span');

    expect(badgeContainer).toHaveClass('rounded-full', 'border');
  });

  it('has animation classes applied', () => {
    render(<LandingPage />);

    const badge = screen.getByText('AI-Powered Intelligence').closest('span');
    const heading = screen.getByRole('heading', {
      name: 'Hanul: Your Intelligent AI Agent Service',
    });
    const subhead = screen.getByText(
      'Experience the future of automated assistance with our advanced AI agent platform.',
    );

    expect(badge).toHaveClass('animate-fade-in-up');
    expect(heading).toHaveClass('animate-fade-in-up');
    expect(subhead).toHaveClass('animate-fade-in-up');
  });

  it('button container has correct styling', () => {
    render(<LandingPage />);

    const getStartedButton = screen.getByRole('link', {
      name: 'Start with AI',
    });
    const learnMoreButton = screen.getByRole('link', {
      name: 'Explore Features',
    });

    const buttonContainer = getStartedButton.closest('div');
    expect(buttonContainer).toHaveClass(
      'animate-fade-in-up',
      'flex',
      'items-center',
      'gap-3',
    );

    expect(getStartedButton.closest('div')).toBe(
      learnMoreButton.closest('div'),
    );
  });

  it('has proper container structure', () => {
    render(<LandingPage />);

    // Use a different selector since section doesn't have role="region" by default
    const container = document.querySelector('section');
    expect(container).toBeInTheDocument();
    expect(container).toHaveClass('relative');

    const innerContainer = container?.firstChild;
    expect(innerContainer).toHaveClass(
      'mx-auto',
      'flex',
      'max-w-6xl',
      'flex-col',
    );
  });
});
