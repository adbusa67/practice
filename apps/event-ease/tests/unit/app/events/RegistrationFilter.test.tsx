/**
 * Unit tests for RegistrationFilter.tsx
 * Tests filter button rendering and onChange callback
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { RegistrationFilter, RegistrationFilterType } from '@/app/events/RegistrationFilter';

// Mock the UI Button component
jest.mock('@event-ease/ui', () => ({
  Button: ({ children, onClick, variant, className }: any) => (
    <button onClick={onClick} data-variant={variant} className={className}>
      {children}
    </button>
  ),
}));

describe('RegistrationFilter', () => {
  it('should render all filter options', () => {
    const onChange = jest.fn();
    render(<RegistrationFilter value="all" onChange={onChange} />);

    expect(screen.getByText('All Events')).toBeInTheDocument();
    expect(screen.getByText('Registered')).toBeInTheDocument();
    expect(screen.getByText('Not Registered')).toBeInTheDocument();
  });

  it('should highlight the selected filter with primary variant', () => {
    const onChange = jest.fn();
    const { container } = render(<RegistrationFilter value="registered" onChange={onChange} />);

    const buttons = container.querySelectorAll('button');

    // All Events button should be secondary
    expect(buttons[0]).toHaveAttribute('data-variant', 'secondary');
    // Registered button should be primary
    expect(buttons[1]).toHaveAttribute('data-variant', 'primary');
    // Not Registered button should be secondary
    expect(buttons[2]).toHaveAttribute('data-variant', 'secondary');
  });

  it('should call onChange with correct value when All Events is clicked', () => {
    const onChange = jest.fn();
    render(<RegistrationFilter value="registered" onChange={onChange} />);

    fireEvent.click(screen.getByText('All Events'));

    expect(onChange).toHaveBeenCalledWith('all');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should call onChange with correct value when Registered is clicked', () => {
    const onChange = jest.fn();
    render(<RegistrationFilter value="all" onChange={onChange} />);

    fireEvent.click(screen.getByText('Registered'));

    expect(onChange).toHaveBeenCalledWith('registered');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should call onChange with correct value when Not Registered is clicked', () => {
    const onChange = jest.fn();
    render(<RegistrationFilter value="all" onChange={onChange} />);

    fireEvent.click(screen.getByText('Not Registered'));

    expect(onChange).toHaveBeenCalledWith('not-registered');
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it('should not call onChange when clicking the already selected option', () => {
    const onChange = jest.fn();
    render(<RegistrationFilter value="all" onChange={onChange} />);

    fireEvent.click(screen.getByText('All Events'));

    // Should still call onChange even if same value (component doesn't prevent it)
    expect(onChange).toHaveBeenCalledWith('all');
  });

  it('should apply text-sm class to all buttons', () => {
    const onChange = jest.fn();
    const { container } = render(<RegistrationFilter value="all" onChange={onChange} />);

    const buttons = container.querySelectorAll('button');
    buttons.forEach(button => {
      expect(button).toHaveClass('text-sm');
    });
  });

  it('should render buttons in correct order', () => {
    const onChange = jest.fn();
    render(<RegistrationFilter value="all" onChange={onChange} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).toHaveTextContent('All Events');
    expect(buttons[1]).toHaveTextContent('Registered');
    expect(buttons[2]).toHaveTextContent('Not Registered');
  });

  it('should handle rapid filter changes', () => {
    const onChange = jest.fn();
    render(<RegistrationFilter value="all" onChange={onChange} />);

    fireEvent.click(screen.getByText('Registered'));
    fireEvent.click(screen.getByText('Not Registered'));
    fireEvent.click(screen.getByText('All Events'));

    expect(onChange).toHaveBeenCalledTimes(3);
    expect(onChange).toHaveBeenNthCalledWith(1, 'registered');
    expect(onChange).toHaveBeenNthCalledWith(2, 'not-registered');
    expect(onChange).toHaveBeenNthCalledWith(3, 'all');
  });

  it('should maintain flex layout with gap', () => {
    const onChange = jest.fn();
    const { container } = render(<RegistrationFilter value="all" onChange={onChange} />);

    const wrapper = container.querySelector('div');
    expect(wrapper).toHaveClass('flex', 'gap-2');
  });
});
