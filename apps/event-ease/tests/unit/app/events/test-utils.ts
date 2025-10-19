import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';

// Mock Supabase client
export const createMockSupabaseClient = () => ({
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  or: jest.fn().mockReturnThis(),
  ilike: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn().mockReturnThis(),
  rpc: jest.fn().mockReturnThis(),
  auth: {
    getUser: jest.fn(),
    signOut: jest.fn(),
  },
});

// Mock event data
export const mockEvent = {
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

export const mockRegistration = {
  id: 'registration-1',
  user_id: 'user-1',
  event_id: 'event-1',
  registered_at: '2024-01-15T00:00:00Z',
  ticket_purchase_id: 'purchase-1',
  ticket_purchases: {
    ticket_type_id: 'ticket-1',
  },
};

export const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  app_metadata: {},
  user_metadata: {},
};

// Custom render function with providers if needed
const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { ...options });

export * from '@testing-library/react';
export { customRender as render };
