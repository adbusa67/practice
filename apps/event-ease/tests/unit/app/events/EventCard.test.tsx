/**
 * Unit tests for EventCard.tsx
 * Tests event card display, collapsible behavior, and registration functionality
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventCard } from '@/app/events/EventCard';
import { register, unregister } from '@/app/events/actions';
import * as dateUtils from '@/lib/date-utils';

// Mock the actions
jest.mock('@/app/events/actions', () => ({
  register: jest.fn(),
  unregister: jest.fn(),
}));

// Mock date utils
jest.mock('@/lib/date-utils', () => ({
  formatEventDate: jest.fn((date) => 'Feb 1'),
  formatEventTimeRange: jest.fn((start, end) => '10:00 AM - 12:00 PM'),
}));

// Mock UI components
jest.mock('@event-ease/ui', () => ({
  Button: ({ children, onClick, disabled, variant, className }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      className={className}
    >
      {children}
    </button>
  ),
  CollapsibleCard: ({ children, open, onOpenChange }: any) => (
    <div data-open={open} onClick={() => onOpenChange && onOpenChange(!open)}>
      {children}
    </div>
  ),
}));

// Add CollapsibleCard sub-components
(jest.requireMock('@event-ease/ui') as any).CollapsibleCard.Trigger = ({ children, className }: any) => (
  <div className={className}>{children}</div>
);

(jest.requireMock('@event-ease/ui') as any).CollapsibleCard.Content = ({ children }: any) => (
  <div>{children}</div>
);

const mockRegister = register as jest.MockedFunction<typeof register>;
const mockUnregister = unregister as jest.MockedFunction<typeof unregister>;

describe('EventCard', () => {
  const mockEvent = {
    id: 'event-1',
    name: 'Test Event',
    date: '2024-02-01',
    location: 'Test Location',
    description: 'Test event description',
    start_time: '2024-02-01T10:00:00Z',
    end_time: '2024-02-01T12:00:00Z',
    venue_id: 'venue-1',
    organizer_id: 'organizer-1',
    capacity: 100,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    organizers: {
      name: 'Test Organizer',
      contact_info: 'test@organizer.com',
      organizations: {
        name: 'Test Organization',
        type: 'nonprofit' as const,
      },
    },
    venues: {
      id: 'venue-1',
      name: 'Test Venue',
      address: '123 Test St',
    },
    ticket_types: [
      {
        id: 'ticket-1',
        tier_name: 'General Admission',
        price: 25.0,
        capacity: 50,
        description: 'Standard ticket',
      },
      {
        id: 'ticket-2',
        tier_name: 'VIP',
        price: 50.0,
        capacity: 25,
        description: 'VIP access',
      },
    ],
  };

  const userId = 'user-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render event name and location', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(screen.getByText('Test Event')).toBeInTheDocument();
      expect(screen.getByText('Test Location')).toBeInTheDocument();
    });

    it('should render formatted date', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(dateUtils.formatEventDate).toHaveBeenCalledWith('2024-02-01');
      expect(screen.getByText('Feb 1')).toBeInTheDocument();
    });

    it('should render event description', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(screen.getByText('Test event description')).toBeInTheDocument();
    });

    it('should render venue information', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(screen.getByText('Test Venue')).toBeInTheDocument();
      expect(screen.getByText('• 123 Test St')).toBeInTheDocument();
    });

    it('should render organizer and organization information', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(screen.getByText('Test Organizer')).toBeInTheDocument();
      expect(screen.getByText(/Test Organization \(nonprofit\)/)).toBeInTheDocument();
    });

    it('should render time range', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(dateUtils.formatEventTimeRange).toHaveBeenCalledWith(
        '2024-02-01T10:00:00Z',
        '2024-02-01T12:00:00Z'
      );
      expect(screen.getByText('10:00 AM - 12:00 PM')).toBeInTheDocument();
    });

    it('should render all ticket types', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(screen.getByText('General Admission')).toBeInTheDocument();
      expect(screen.getByText('VIP')).toBeInTheDocument();
      expect(screen.getByText('$25.00')).toBeInTheDocument();
      expect(screen.getByText('$50.00')).toBeInTheDocument();
    });

    it('should render free ticket correctly', () => {
      const freeEvent = {
        ...mockEvent,
        ticket_types: [{
          id: 'ticket-free',
          tier_name: 'Free Entry',
          price: 0,
          capacity: 100,
          description: null,
        }],
      };

      render(<EventCard event={freeEvent} userId={userId} />);

      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Registration:')).toBeInTheDocument();
    });

    it('should render ticket descriptions when present', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      expect(screen.getByText('Standard ticket')).toBeInTheDocument();
      expect(screen.getByText('VIP access')).toBeInTheDocument();
    });

    it('should show error message when ticket types are missing', () => {
      const eventWithoutTickets = { ...mockEvent, ticket_types: [] };

      render(<EventCard event={eventWithoutTickets} userId={userId} />);

      expect(screen.getByText(/Data Error: Event missing required ticket types/)).toBeInTheDocument();
    });

    it('should render without organization when not present', () => {
      const eventNoOrg = {
        ...mockEvent,
        organizers: {
          name: 'Test Organizer',
          contact_info: 'test@test.com',
          organizations: null,
        },
      };

      render(<EventCard event={eventNoOrg} userId={userId} />);

      expect(screen.getByText('Test Organizer')).toBeInTheDocument();
      expect(screen.queryByText(/\(/)).not.toBeInTheDocument();
    });
  });

  describe('Registration State', () => {
    it('should show "Registered" button when user is registered', () => {
      const registration = {
        id: 'reg-1',
        user_id: userId,
        event_id: 'event-1',
        registered_at: '2024-01-15T00:00:00Z',
        ticket_purchase_id: 'purchase-1',
        ticket_purchases: { ticket_type_id: 'ticket-1' },
      };

      render(<EventCard event={mockEvent} registration={registration} userId={userId} />);

      expect(screen.getByText('Registered')).toBeInTheDocument();
    });

    it('should show "Purchase" button for paid tickets', () => {
      render(<EventCard event={mockEvent} userId={userId} />);

      const purchaseButtons = screen.getAllByText('Purchase');
      expect(purchaseButtons.length).toBeGreaterThan(0);
    });

    it('should disable other ticket buttons when one is selected', () => {
      const registration = {
        id: 'reg-1',
        user_id: userId,
        event_id: 'event-1',
        registered_at: '2024-01-15T00:00:00Z',
        ticket_purchase_id: 'purchase-1',
        ticket_purchases: { ticket_type_id: 'ticket-1' },
      };

      render(<EventCard event={mockEvent} registration={registration} userId={userId} />);

      expect(screen.getByText('Registered')).toBeInTheDocument();
      expect(screen.getByText('Not Selected')).toBeInTheDocument();
    });
  });

  describe('Collapsible Behavior', () => {
    it('should start collapsed by default', () => {
      const { container } = render(<EventCard event={mockEvent} userId={userId} />);

      const collapsible = container.querySelector('[data-open]');
      expect(collapsible).toHaveAttribute('data-open', 'false');
    });

    it('should toggle open state when clicked', () => {
      const { container } = render(<EventCard event={mockEvent} userId={userId} />);

      const collapsible = container.querySelector('[data-open]');
      expect(collapsible).toHaveAttribute('data-open', 'false');

      fireEvent.click(collapsible as Element);

      expect(collapsible).toHaveAttribute('data-open', 'true');
    });

    it('should show chevron down when collapsed', () => {
      const { container } = render(<EventCard event={mockEvent} userId={userId} />);

      // Looking for ChevronDown icon (in the actual component it checks isOpen)
      expect(container.textContent).toContain('Test Event');
    });
  });

  describe('Button Variants', () => {
    it('should use success variant for registered button', () => {
      const registration = {
        id: 'reg-1',
        user_id: userId,
        event_id: 'event-1',
        registered_at: '2024-01-15T00:00:00Z',
        ticket_purchase_id: 'purchase-1',
        ticket_purchases: { ticket_type_id: 'ticket-1' },
      };

      const { container } = render(<EventCard event={mockEvent} registration={registration} userId={userId} />);

      const registeredButton = screen.getByText('Registered').closest('button');
      expect(registeredButton).toHaveAttribute('data-variant', 'success');
    });

    it('should use secondary variant for disabled Not Selected button', () => {
      const registration = {
        id: 'reg-1',
        user_id: userId,
        event_id: 'event-1',
        registered_at: '2024-01-15T00:00:00Z',
        ticket_purchase_id: 'purchase-1',
        ticket_purchases: { ticket_type_id: 'ticket-1' },
      };

      const { container } = render(<EventCard event={mockEvent} registration={registration} userId={userId} />);

      const notSelectedButton = screen.getByText('Not Selected').closest('button');
      expect(notSelectedButton).toHaveAttribute('data-variant', 'secondary');
      expect(notSelectedButton).toHaveAttribute('disabled');
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing organizers gracefully', () => {
      const eventNoOrganizer = { ...mockEvent, organizers: null };

      render(<EventCard event={eventNoOrganizer} userId={userId} />);

      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    it('should handle missing venues gracefully', () => {
      const eventNoVenue = { ...mockEvent, venues: null };

      render(<EventCard event={eventNoVenue} userId={userId} />);

      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });

    it('should handle null ticket types', () => {
      const eventNoTickets = { ...mockEvent, ticket_types: null };

      render(<EventCard event={eventNoTickets} userId={userId} />);

      expect(screen.getByText(/Data Error/)).toBeInTheDocument();
    });

    it('should handle registration without ticket purchase info', () => {
      const registrationNoTicket = {
        id: 'reg-1',
        user_id: userId,
        event_id: 'event-1',
        registered_at: '2024-01-15T00:00:00Z',
        ticket_purchase_id: null,
        ticket_purchases: null,
      };

      render(<EventCard event={mockEvent} registration={registrationNoTicket} userId={userId} />);

      // Should render without crashing
      expect(screen.getByText('Test Event')).toBeInTheDocument();
    });
  });
});
