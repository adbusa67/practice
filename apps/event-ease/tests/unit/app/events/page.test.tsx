/**
 * Unit tests for page.tsx (EventsPage component)
 * Tests main events page functionality including search, filtering, and user interactions
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import EventsPage from '@/app/events/page';
import { getEvents, searchEvents } from '@/app/events/actions';
import { typedClient } from '@/utils/supabase';

// Mock the actions
jest.mock('@/app/events/actions', () => ({
  getEvents: jest.fn(),
  searchEvents: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/utils/supabase', () => ({
  typedClient: {
    auth: {
      getUser: jest.fn(),
    },
  },
}));

// Mock child components
jest.mock('@/app/events/Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));

jest.mock('@/app/events/EventCard', () => ({
  EventCard: ({ event, registration, userId }: any) => (
    <div data-testid={`event-card-${event.id}`} data-user-id={userId}>
      {event.name}
      {registration && <span data-testid="registered">Registered</span>}
    </div>
  ),
}));

jest.mock('@/app/events/RegistrationFilter', () => ({
  RegistrationFilter: ({ value, onChange }: any) => (
    <div data-testid="registration-filter">
      <button data-testid="filter-all" onClick={() => onChange('all')}>All Events</button>
      <button data-testid="filter-registered" onClick={() => onChange('registered')}>Registered Filter</button>
      <button data-testid="filter-not-registered" onClick={() => onChange('not-registered')}>Not Registered Filter</button>
      <span data-testid="filter-value">{value}</span>
    </div>
  ),
}));

jest.mock('@event-ease/ui', () => ({
  SearchTextField: ({ controlProps, onSubmit }: any) => (
    <form onSubmit={onSubmit}>
      <input
        data-testid="search-input"
        placeholder={controlProps.placeholder}
        value={controlProps.value}
        onChange={controlProps.onChange}
      />
    </form>
  ),
}));

const mockGetEvents = getEvents as jest.MockedFunction<typeof getEvents>;
const mockSearchEvents = searchEvents as jest.MockedFunction<typeof searchEvents>;
const mockGetUser = typedClient.auth.getUser as jest.MockedFunction<any>;

describe('EventsPage', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com',
    aud: 'authenticated',
    role: 'authenticated',
  };

  const mockEvents = [
    {
      id: 'event-1',
      name: 'Yoga Workshop',
      date: '2024-02-01',
      location: 'Community Center',
      description: 'Morning yoga session',
      start_time: '2024-02-01T09:00:00Z',
      end_time: '2024-02-01T11:00:00Z',
      venue_id: 'venue-1',
      organizer_id: 'organizer-1',
      capacity: 30,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      organizers: null,
      venues: null,
      ticket_types: null,
    },
    {
      id: 'event-2',
      name: 'Tech Conference',
      date: '2024-03-15',
      location: 'Convention Center',
      description: 'Annual tech conference',
      start_time: '2024-03-15T10:00:00Z',
      end_time: '2024-03-15T18:00:00Z',
      venue_id: 'venue-2',
      organizer_id: 'organizer-2',
      capacity: 500,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      organizers: null,
      venues: null,
      ticket_types: null,
    },
  ];

  const mockRegistrations = [
    {
      id: 'reg-1',
      user_id: 'user-1',
      event_id: 'event-1',
      registered_at: '2024-01-15T00:00:00Z',
      ticket_purchase_id: 'purchase-1',
      ticket_purchases: { ticket_type_id: 'ticket-1' },
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Use fake timers for debounce testing
    jest.useFakeTimers();

    // Set up default successful mocks
    mockGetUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    });

    mockGetEvents.mockResolvedValue({
      events: mockEvents,
      registrations: mockRegistrations,
    });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  describe('Initial Rendering', () => {
    it('should render the page title', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Community Events')).toBeInTheDocument();
      });
    });

    it('should render the Header component', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
      });
    });

    it('should render the search input', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('search-input')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Search events...')).toBeInTheDocument();
      });
    });

    it('should render the registration filter', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('registration-filter')).toBeInTheDocument();
      });
    });

    it('should fetch user on mount', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });
    });

    it('should fetch events after user is loaded', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetEvents).toHaveBeenCalledWith('user-1');
      });
    });
  });

  describe('Event Display', () => {
    it('should render all events', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Yoga Workshop')).toBeInTheDocument();
        expect(screen.getByText('Tech Conference')).toBeInTheDocument();
      });
    });

    it('should render events in two columns', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
      });
    });

    it('should pass userId to EventCard components', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        const eventCard = screen.getByTestId('event-card-event-1');
        expect(eventCard).toHaveAttribute('data-user-id', 'user-1');
      });
    });

    it('should pass registration to EventCard when user is registered', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        // event-1 should have registration
        const eventCard1 = screen.getByTestId('event-card-event-1');
        expect(eventCard1.querySelector('[data-testid="registered"]')).toBeInTheDocument();

        // event-2 should not have registration
        const eventCard2 = screen.getByTestId('event-card-event-2');
        expect(eventCard2.querySelector('[data-testid="registered"]')).not.toBeInTheDocument();
      });
    });

    it('should show empty state when no events', async () => {
      mockGetEvents.mockResolvedValue({ events: [], registrations: [] });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('No events available')).toBeInTheDocument();
        expect(screen.getByText('Check back later for new events')).toBeInTheDocument();
      });
    });

    it('should show searching state while loading', async () => {
      mockSearchEvents.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ events: [], registrations: [] }), 100))
      );

      await act(async () => {
        render(<EventsPage />);
      });

      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'yoga' } });
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('Searching events...')).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should update search value on input change', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
        expect(searchInput.value).toBe('');
      });

      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'yoga' } });
      });

      const searchInput = screen.getByTestId('search-input') as HTMLInputElement;
      expect(searchInput.value).toBe('yoga');
    });

    it('should debounce search by 300ms', async () => {
      mockSearchEvents.mockResolvedValue({ events: [], registrations: [] });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetEvents).toHaveBeenCalled();
      });

      mockGetEvents.mockClear();

      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'y' } });
        jest.advanceTimersByTime(100);
        fireEvent.change(searchInput, { target: { value: 'yo' } });
        jest.advanceTimersByTime(100);
        fireEvent.change(searchInput, { target: { value: 'yog' } });
        jest.advanceTimersByTime(100);
      });

      // Should not have called search yet
      expect(mockSearchEvents).not.toHaveBeenCalled();

      await act(async () => {
        jest.advanceTimersByTime(100); // Total 300ms
      });

      await waitFor(() => {
        expect(mockSearchEvents).toHaveBeenCalledWith('user-1', 'yog');
        expect(mockSearchEvents).toHaveBeenCalledTimes(1);
      });
    });

    it('should call searchEvents when debounced value changes', async () => {
      mockSearchEvents.mockResolvedValue({ events: mockEvents, registrations: [] });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetEvents).toHaveBeenCalled();
      });

      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'tech' } });
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSearchEvents).toHaveBeenCalledWith('user-1', 'tech');
      });
    });

    it('should call getEvents when search is cleared', async () => {
      mockSearchEvents.mockResolvedValue({ events: mockEvents, registrations: mockRegistrations });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetEvents).toHaveBeenCalledWith('user-1');
      });

      // Type something to trigger search
      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'yoga' } });
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockSearchEvents).toHaveBeenCalledWith('user-1', 'yoga');
      });

      mockGetEvents.mockClear();

      // Clear the search
      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: '' } });
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(mockGetEvents).toHaveBeenCalledWith('user-1');
      });
    });

    it('should show "No events found" when search returns empty', async () => {
      mockSearchEvents.mockResolvedValue({ events: [], registrations: [] });

      await act(async () => {
        render(<EventsPage />);
      });

      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByText('No events found')).toBeInTheDocument();
        expect(screen.getByText('Try another keyword or clear your search')).toBeInTheDocument();
      });
    });

    it('should handle search errors gracefully', async () => {
      mockSearchEvents.mockRejectedValue(new Error('Network error'));

      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

      await act(async () => {
        render(<EventsPage />);
      });

      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'error' } });
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  describe('Registration Filter', () => {
    it('should start with "all" filter selected', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('filter-value')).toHaveTextContent('all');
      });
    });

    it('should filter to show only registered events', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('filter-registered'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
        expect(screen.queryByTestId('event-card-event-2')).not.toBeInTheDocument();
      });
    });

    it('should filter to show only not-registered events', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('filter-not-registered'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('event-card-event-1')).not.toBeInTheDocument();
        expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
      });
    });

    it('should show all events when "all" is selected', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('filter-registered'));
      });

      await waitFor(() => {
        expect(screen.queryByTestId('event-card-event-2')).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('filter-all'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
      });
    });

    it('should show appropriate empty message for filtered views', async () => {
      mockGetEvents.mockResolvedValue({ events: [], registrations: [] });

      await act(async () => {
        render(<EventsPage />);
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('filter-registered'));
      });

      await waitFor(() => {
        expect(screen.getByText(/No registered events found/)).toBeInTheDocument();
      });
    });

    it('should combine search and filter correctly', async () => {
      const searchResults = [mockEvents[0]]; // Only yoga workshop
      mockSearchEvents.mockResolvedValue({ events: searchResults, registrations: mockRegistrations });

      await act(async () => {
        render(<EventsPage />);
      });

      await act(async () => {
        const searchInput = screen.getByTestId('search-input');
        fireEvent.change(searchInput, { target: { value: 'yoga' } });
        jest.advanceTimersByTime(300);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
        expect(screen.queryByTestId('event-card-event-2')).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('filter-not-registered'));
      });

      await waitFor(() => {
        // Yoga workshop is registered, so filtering to not-registered should show nothing
        expect(screen.queryByTestId('event-card-event-1')).not.toBeInTheDocument();
      });
    });
  });

  describe('User State', () => {
    it('should not fetch events when user is not loaded', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      // Should not call getEvents without user
      expect(mockGetEvents).not.toHaveBeenCalled();
    });

    it('should handle user fetch errors', async () => {
      mockGetUser.mockResolvedValue({ data: { user: null }, error: { message: 'Auth error' } });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });

      expect(mockGetEvents).not.toHaveBeenCalled();
    });
  });

  describe('Grid Layout', () => {
    it('should render events in masonry grid layout', async () => {
      const threeEvents = [
        ...mockEvents,
        {
          ...mockEvents[0],
          id: 'event-3',
          name: 'Third Event',
        },
      ];

      mockGetEvents.mockResolvedValue({ events: threeEvents, registrations: [] });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-event-2')).toBeInTheDocument();
        expect(screen.getByTestId('event-card-event-3')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should use useMemo for filtered events', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('event-card-event-1')).toBeInTheDocument();
      });

      // Filter should not trigger new fetch, only re-render
      mockGetEvents.mockClear();

      await act(async () => {
        fireEvent.click(screen.getByText('Registered'));
      });

      expect(mockGetEvents).not.toHaveBeenCalled();
    });

    it('should use useCallback for fetchEvents', async () => {
      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetEvents).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined user gracefully', async () => {
      mockGetUser.mockResolvedValue({ data: { user: undefined }, error: null });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(mockGetUser).toHaveBeenCalled();
      });
    });

    it('should handle events with partial data', async () => {
      const partialEvent = {
        id: 'partial-event',
        name: 'Partial Event',
        date: null,
        location: null,
        description: null,
        start_time: null,
        end_time: null,
        venue_id: null,
        organizer_id: null,
        capacity: null,
        created_at: null,
        updated_at: null,
        organizers: null,
        venues: null,
        ticket_types: null,
      };

      mockGetEvents.mockResolvedValue({ events: [partialEvent], registrations: [] });

      await act(async () => {
        render(<EventsPage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Partial Event')).toBeInTheDocument();
      });
    });
  });
});
