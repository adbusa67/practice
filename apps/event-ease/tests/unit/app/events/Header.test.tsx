/**
 * Unit tests for Header.tsx
 * Tests navigation links and sign out functionality
 */

import { render, screen } from '@testing-library/react';
import { Header } from '@/app/events/Header';

// Mock the UI components
jest.mock('@event-ease/ui', () => ({
  Button: ({ children, variant }: any) => (
    <button data-variant={variant}>{children}</button>
  ),
  Form: {
    Root: ({ children, action, method }: any) => (
      <form action={action} method={method}>{children}</form>
    ),
    Submit: ({ children, asChild }: any) => (
      <div data-submit="true" data-as-child={asChild}>{children}</div>
    ),
  },
}));

describe('Header', () => {
  it('should render the EventEase brand name', () => {
    render(<Header />);
    expect(screen.getByText('EventEase')).toBeInTheDocument();
  });

  it('should apply correct styling classes to header', () => {
    const { container } = render(<Header />);
    const header = container.querySelector('header');

    expect(header).toHaveClass('w-full', 'flex', 'justify-between', 'items-center');
    expect(header).toHaveClass('border-b', 'border-black', 'p-4');
  });

  it('should render sign out form with correct action', () => {
    const { container } = render(<Header />);
    const form = container.querySelector('form');

    expect(form).toHaveAttribute('action', '/api/auth/signout');
    expect(form).toHaveAttribute('method', 'post');
  });

  it('should render sign out button with text variant', () => {
    const { container } = render(<Header />);
    const signOutButton = screen.getByText('Sign out');

    // Button is wrapped by Form.Submit then Button, check the button itself
    expect(signOutButton).toHaveAttribute('data-variant', 'text');
  });

  it('should have proper navigation structure', () => {
    const { container } = render(<Header />);
    const nav = container.querySelector('nav');

    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('flex', 'items-center', 'space-x-6');
  });

  it('should render all navigation items in order', () => {
    render(<Header />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveTextContent('EventEase');
    expect(links[1]).toHaveTextContent('Events');
    expect(links[2]).toHaveTextContent('My Registrations');
  });

  it('should render sign out as a button within form', () => {
    render(<Header />);
    const signOutButton = screen.getByText('Sign out');

    expect(signOutButton).toBeInTheDocument();
    expect(signOutButton.parentElement?.parentElement?.tagName).toBe('FORM');
  });

  it('should use Form.Submit with asChild prop', () => {
    const { container } = render(<Header />);
    const submitWrapper = container.querySelector('[data-submit="true"]');

    expect(submitWrapper).toHaveAttribute('data-as-child', 'true');
  });

  it('should have accessible structure', () => {
    const { container } = render(<Header />);

    // Should have semantic header element
    expect(container.querySelector('header')).toBeInTheDocument();

    // Should have semantic nav element
    expect(container.querySelector('nav')).toBeInTheDocument();

    // All links should be focusable
    const links = screen.getAllByRole('link');
    links.forEach(link => {
      expect(link).toHaveAttribute('href');
    });
  });

  it('should maintain consistent spacing between nav items', () => {
    const { container } = render(<Header />);
    const nav = container.querySelector('nav');

    expect(nav).toHaveClass('space-x-6');
  });
});
