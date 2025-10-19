/**
 * Unit tests for events/actions.ts
 * Tests server actions: getEvents, searchEvents, register, unregister
 */

import { getEvents, searchEvents, register, unregister } from '@/app/events/actions';
import { createClient } from '@/utils/server';

// Mock the server client
jest.mock('@/utils/server', () => ({
  createClient: jest.fn(),
}));

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>;

describe('actions.ts - getEvents', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch events with all relations successfully', async () => {
    const mockEvents = [
      {
        id: 'event-1',
        name: 'Test Event',
        date: '2024-02-01',
        organizers: { name: 'Organizer', contact_info: 'test@test.com', organizations: { name: 'Org', type: 'nonprofit' } },
        venues: { id: 'venue-1', name: 'Venue', address: '123 St' },
        ticket_types: [{ id: 'ticket-1', tier_name: 'General', price: 25, capacity: 100, description: 'Standard' }],
      },
    ];
    const mockRegistrations = [
      { id: 'reg-1', user_id: 'user-1', event_id: 'event-1', ticket_purchases: { ticket_type_id: 'ticket-1' } },
    ];

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await getEvents('user-1');

    expect(result.events).toEqual(mockEvents);
    expect(result.registrations).toEqual(mockRegistrations);
    expect(mockClient.from).toHaveBeenCalledWith('events');
    expect(mockClient.from).toHaveBeenCalledWith('registrations');
  });

  it('should return empty arrays when no events exist', async () => {
    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      return mockClient;
    });

    const result = await getEvents('user-1');

    expect(result.events).toEqual([]);
    expect(result.registrations).toEqual([]);
  });

  it('should throw error when events query fails', async () => {
    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        };
      }
      return mockClient;
    });

    await expect(getEvents('user-1')).rejects.toThrow('Database error');
  });

  it('should throw error when registrations query fails', async () => {
    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Registration error' } }),
        };
      }
      return mockClient;
    });

    await expect(getEvents('user-1')).rejects.toThrow('Registration error');
  });

  it('should handle null data by returning empty arrays', async () => {
    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: null }),
        };
      }
      return mockClient;
    });

    const result = await getEvents('user-1');

    expect(result.events).toEqual([]);
    expect(result.registrations).toEqual([]);
  });
});

describe('actions.ts - searchEvents', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      rpc: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      in: jest.fn().mockReturnThis(),
    };
    mockCreateClient.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should use FTS when search finds results', async () => {
    const mockFtsResults = [{ id: 'event-1' }, { id: 'event-2' }];
    const mockFullEvents = [
      {
        id: 'event-1',
        name: 'Yoga Workshop',
        organizers: null,
        venues: null,
        ticket_types: null,
      },
      {
        id: 'event-2',
        name: 'Yoga Class',
        organizers: null,
        venues: null,
        ticket_types: null,
      },
    ];
    const mockRegistrations = [];

    mockClient.rpc.mockResolvedValue({ data: mockFtsResults, error: null });
    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: mockFullEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', 'yoga');

    expect(mockClient.rpc).toHaveBeenCalledWith('search_events_with_ranking', { search_query: 'yoga' });
    expect(result.events).toHaveLength(2);
    expect(result.events[0].id).toBe('event-1');
  });

  it('should fallback to ILIKE when FTS returns no results', async () => {
    const mockIlikeEvents = [
      {
        id: 'event-3',
        name: 'Partial Match Event',
        organizers: null,
        venues: null,
        ticket_types: null,
      },
    ];
    const mockRegistrations = [];

    // FTS returns empty
    mockClient.rpc.mockResolvedValue({ data: [], error: null });

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'venues') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({ data: mockIlikeEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', 'partial');

    expect(result.events).toHaveLength(1);
    expect(result.events[0].id).toBe('event-3');
  });

  it('should fallback to getEvents when search value is empty', async () => {
    const mockEvents = [{ id: 'event-1', name: 'All Events' }];
    const mockRegistrations = [];

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', '   ');

    expect(result.events).toEqual(mockEvents);
    expect(mockClient.rpc).not.toHaveBeenCalled();
  });

  it('should handle FTS error and try ILIKE fallback', async () => {
    const mockIlikeEvents = [{ id: 'event-1', name: 'Fallback Event' }];
    const mockRegistrations = [];

    mockClient.rpc.mockResolvedValue({ data: null, error: { message: 'FTS error' } });

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'venues') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockResolvedValue({ data: [], error: null }),
        };
      }
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({ data: mockIlikeEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', 'test');

    expect(result.events).toHaveLength(1);
  });

  it('should include venue IDs in ILIKE search when venues match', async () => {
    const mockVenues = [{ id: 'venue-1' }, { id: 'venue-2' }];
    const mockIlikeEvents = [{ id: 'event-1', name: 'Event at Venue' }];
    const mockRegistrations = [];

    mockClient.rpc.mockResolvedValue({ data: [], error: null });

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'venues') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          ilike: jest.fn().mockResolvedValue({ data: mockVenues, error: null }),
        };
      }
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          or: jest.fn().mockResolvedValue({ data: mockIlikeEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', 'downtown');

    expect(result.events).toHaveLength(1);
  });

  it('should handle registrations query error gracefully', async () => {
    const mockEvents = [{ id: 'event-1' }];

    mockClient.rpc.mockResolvedValue({ data: [{ id: 'event-1' }], error: null });
    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Reg error' } }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', 'test');

    expect(result.events).toEqual(mockEvents);
    expect(result.registrations).toEqual([]);
  });

  it('should fallback to getEvents when exception is thrown', async () => {
    const mockEvents = [{ id: 'event-1' }];
    const mockRegistrations = [];

    mockClient.rpc.mockRejectedValue(new Error('Network error'));

    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockResolvedValue({ data: mockEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', 'test');

    expect(result.events).toEqual(mockEvents);
  });

  it('should preserve FTS ranking order when fetching full events', async () => {
    const mockFtsResults = [{ id: 'event-2' }, { id: 'event-1' }, { id: 'event-3' }];
    const mockFullEvents = [
      { id: 'event-1', name: 'Event 1' },
      { id: 'event-2', name: 'Event 2' },
      { id: 'event-3', name: 'Event 3' },
    ];
    const mockRegistrations = [];

    mockClient.rpc.mockResolvedValue({ data: mockFtsResults, error: null });
    mockClient.from.mockImplementation((table: string) => {
      if (table === 'events') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          in: jest.fn().mockResolvedValue({ data: mockFullEvents, error: null }),
        };
      }
      if (table === 'registrations') {
        return {
          ...mockClient,
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockRegistrations, error: null }),
        };
      }
      return mockClient;
    });

    const result = await searchEvents('user-1', 'event');

    // Results should be sorted by FTS ranking (event-2, event-1, event-3)
    expect(result.events[0].id).toBe('event-2');
    expect(result.events[1].id).toBe('event-1');
    expect(result.events[2].id).toBe('event-3');
  });
});

describe('actions.ts - register', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      rpc: jest.fn(),
    };
    mockCreateClient.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully register user for event with ticket type', async () => {
    const mockResult = {
      purchase_id: 'purchase-1',
      registration_id: 'reg-1',
      amount_paid: 25.0,
      payment_method: 'credit_card',
    };

    mockClient.rpc.mockResolvedValue({ data: mockResult, error: null });

    const result = await register('user-1', 'event-1', 'ticket-1');

    expect(mockClient.rpc).toHaveBeenCalledWith('register_user_for_event', {
      p_user_id: 'user-1',
      p_event_id: 'event-1',
      p_ticket_type_id: 'ticket-1',
    });
    expect(result.success).toBe(true);
    expect(result.purchaseId).toBe('purchase-1');
    expect(result.registrationId).toBe('reg-1');
    expect(result.amountPaid).toBe(25.0);
  });

  it('should throw error when ticket type is not provided', async () => {
    await expect(register('user-1', 'event-1', undefined)).rejects.toThrow(
      'Ticket type is required for registration'
    );

    expect(mockClient.rpc).not.toHaveBeenCalled();
  });

  it('should throw error when database function fails', async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: 'Capacity exceeded' } });

    await expect(register('user-1', 'event-1', 'ticket-1')).rejects.toThrow('Capacity exceeded');
  });

  it('should handle duplicate registration error', async () => {
    mockClient.rpc.mockResolvedValue({
      data: null,
      error: { message: 'User already registered', code: '23505' },
    });

    await expect(register('user-1', 'event-1', 'ticket-1')).rejects.toThrow('User already registered');
  });

});

describe('actions.ts - unregister', () => {
  let mockClient: any;

  beforeEach(() => {
    mockClient = {
      rpc: jest.fn(),
    };
    mockCreateClient.mockResolvedValue(mockClient);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully unregister user from event', async () => {
    const mockResult = {
      refunded_amount: 25.0,
      payment_method: 'credit_card',
      purchase_id: 'purchase-1',
    };

    mockClient.rpc.mockResolvedValue({ data: mockResult, error: null });

    const result = await unregister('user-1', 'event-1');

    expect(mockClient.rpc).toHaveBeenCalledWith('unregister_user_from_event', {
      p_user_id: 'user-1',
      p_event_id: 'event-1',
    });
    expect(result.success).toBe(true);
    expect(result.refundedAmount).toBe(25.0);
    expect(result.paymentMethod).toBe('credit_card');
  });

  it('should throw error when database function fails', async () => {
    mockClient.rpc.mockResolvedValue({ data: null, error: { message: 'Registration not found' } });

    await expect(unregister('user-1', 'event-1')).rejects.toThrow('Registration not found');
  });

  it('should handle unregistration when user not registered', async () => {
    mockClient.rpc.mockResolvedValue({
      data: null,
      error: { message: 'No registration found for this user and event' },
    });

    await expect(unregister('user-1', 'event-1')).rejects.toThrow(
      'No registration found for this user and event'
    );
  });

  it('should handle free event unregistration', async () => {
    const mockResult = {
      refunded_amount: 0,
      payment_method: 'free',
      purchase_id: 'purchase-1',
    };

    mockClient.rpc.mockResolvedValue({ data: mockResult, error: null });

    const result = await unregister('user-1', 'event-free');

    expect(result.success).toBe(true);
    expect(result.refundedAmount).toBe(0);
    expect(result.paymentMethod).toBe('free');
  });
});
