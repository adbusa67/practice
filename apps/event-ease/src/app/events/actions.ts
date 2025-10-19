"use server";

import { Database } from "@/types/supabase";

type Event = Database['public']['Tables']['events']['Row'];
type Organizer = Database['public']['Tables']['organizers']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];
type Venue = Database['public']['Tables']['venues']['Row'];
import { createClient } from "@/utils/server";

export type EventAndOrganizer = Event & {
  organizers: (Pick<Organizer, "name" | "contact_info"> & {
    organizations: Pick<Organization, "name" | "type"> | null;
  }) | null;
  venues: Pick<Venue, "id" | "name" | "address"> | null;
  ticket_types: Array<{
    id: string;
    tier_name: string;
    price: number;
    capacity: number | null;
    description: string | null;
  }> | null;
};

type GetEventsResponse = {
  events: Array<EventAndOrganizer>;
  registrations: Array<Registration & {
    ticket_purchases: { ticket_type_id: string } | null;
  }>;
};

export async function getEvents(userId: string): Promise<GetEventsResponse> {
  const client = await createClient();

  const { data: events, error: eventsError } = await client
    .from("events")
    .select("*, organizers (name, contact_info, organizations (name, type)), venues (id, name, address), ticket_types (id, tier_name, price, capacity, description)");

  if (eventsError) {
    throw new Error(eventsError.message);
  }

  const { data: registrations, error: registrationError } = await client
    .from("registrations")
    .select("*, ticket_purchases(ticket_type_id)")
    .eq("user_id", userId);
    
  if (registrationError) {
    throw new Error(registrationError.message);
  }

  return { events: events || [], registrations: registrations || [] };
}

export async function searchEvents(userId: string, searchValue: string): Promise<GetEventsResponse> {
  try {
    const client = await createClient();

    // If search value is empty, return all events
    if (!searchValue.trim()) {
      console.log("SearchEvents: Empty search value, using getEvents fallback");
      return getEvents(userId);
    }

    console.log(`SearchEvents: Starting search for "${searchValue.trim()}"`);

    // 1. Try FTS first (best ranking) as described in SIDEQUESTS.md
    // O(log n) read complexity - uses GIN index on tsvector column
    // Write complexity for data modifications: O(1) per event INSERT/UPDATE (updates search_vector via trigger + 3 trigram indexes), O(k) per venue UPDATE where k=events using venue (triggers search_vector updates), O(1) per venue INSERT/UPDATE (updates 1 trigram index)
    console.log("SearchEvents: Strategy 1 - Trying FTS search");
    const { data: ftsResults, error: ftsError } = await client
      .rpc('search_events_with_ranking', { search_query: searchValue.trim() });

    let events: EventAndOrganizer[] = [];

    if (!ftsError && ftsResults && ftsResults.length > 0) {
      console.log(`SearchEvents: FTS found ${ftsResults.length} results, fetching full event data`);
      // FTS found results, now fetch full event data with relations
      const eventIds = ftsResults.map((r: any) => r.id);
      const { data: fullEvents, error: fetchError } = await client
        .from("events")
        .select("*, organizers (name, contact_info, organizations (name, type)), venues (id, name, address), ticket_types (id, tier_name, price, capacity, description)")
        .in("id", eventIds);

      if (!fetchError && fullEvents) {
        // Sort events by the FTS ranking order
        const rankMap = new Map(ftsResults.map((r: any, idx: number) => [r.id, idx]));
        events = fullEvents.sort((a, b) => {
          const rankA = rankMap.get(a.id) ?? 999;
          const rankB = rankMap.get(b.id) ?? 999;
          return rankA - rankB;
        });
        console.log(`SearchEvents: FTS strategy successful, returning ${events.length} events`);
      } else {
        console.log("SearchEvents: FTS fetch failed, will try ILIKE fallback");
      }
    } else {
      console.log(`SearchEvents: FTS found no results (error: ${ftsError?.message || 'none'}), will try ILIKE fallback`);
    }

    // 2. If no FTS results, fallback to ILIKE (handles partial matches)
    // Description: Two-step query - first finds venues matching search term, then finds events with OR conditions
    // O(log n) read complexity - uses GIN trigram indexes on name, description, location, and venues.name columns
    // Searches: event name, description, location, and venue name (via two-step query)
    // Write complexity for data modifications: O(1) per event INSERT/UPDATE (updates search_vector via trigger + 3 trigram indexes), O(k) per venue UPDATE where k=events using venue (triggers search_vector updates), O(1) per venue INSERT/UPDATE (updates 1 trigram index)
    if (events.length === 0) {
      console.log("SearchEvents: Strategy 2 - Trying ILIKE search with two-step approach");
      
      // First, find venues that match the search term
      const { data: matchingVenues, error: venueError } = await client
        .from("venues")
        .select("id")
        .ilike("name", `%${searchValue.trim()}%`);

      // Build the OR condition for events search
      let eventOrConditions = [
        `name.ilike.%${searchValue.trim()}%`,
        `description.ilike.%${searchValue.trim()}%`,
        `location.ilike.%${searchValue.trim()}%`
      ];

      // Add venue ID conditions if we found matching venues
      if (!venueError && matchingVenues && matchingVenues.length > 0) {
        const venueIds = matchingVenues.map(v => v.id);
        eventOrConditions.push(`venue_id.in.(${venueIds.join(',')})`);
      }

      // Search events with the combined conditions
      const { data: ilikeResults, error: ilikeError } = await client
        .from("events")
        .select("*, organizers (name, contact_info, organizations (name, type)), venues (id, name, address), ticket_types (id, tier_name, price, capacity, description)")
        .or(eventOrConditions.join(','));

      if (!ilikeError && ilikeResults) {
        events = ilikeResults;
        console.log(`SearchEvents: ILIKE strategy successful, returning ${events.length} events`);
      } else {
        console.log(`SearchEvents: ILIKE found no results (error: ${ilikeError?.message || 'none'}), will try getEvents fallback`);
      }
    }

    // Get user registrations
    const { data: registrations, error: registrationError } = await client
      .from("registrations")
      .select("*, ticket_purchases(ticket_type_id)")
      .eq("user_id", userId);

    if (registrationError) {
      console.error("Registration error:", registrationError);
      return { events: events || [], registrations: [] };
    }

    console.log(`SearchEvents: Final result - returning ${events.length} events and ${registrations?.length || 0} registrations`);
    return {
      events: events || [],
      registrations: registrations || []
    };
  } catch (error) {
    console.error("SearchEvents: Search function error:", error);
    // 3. Fallback to getEvents if anything fails
    // O(n) read complexity - fetches all events with joins
    // Write complexity for data modifications: O(1) per event INSERT/UPDATE (updates search_vector via trigger + 3 trigram indexes), O(k) per venue UPDATE where k=events using venue (triggers search_vector updates), O(1) per venue INSERT/UPDATE (updates 1 trigram index)
    console.log("SearchEvents: Strategy 3 - Using getEvents fallback due to error");
    return getEvents(userId);
  }
}

export async function register(userId: string, eventId: string, ticketTypeId?: string) {
  const client = await createClient();

  // Ticket type ID is now required for all registrations
  if (!ticketTypeId) {
    throw new Error("Ticket type is required for registration");
  }

  // Use atomic database function to ensure transactional integrity
  const { data: result, error } = await client.rpc('register_user_for_event', {
    p_user_id: userId,
    p_event_id: eventId,
    p_ticket_type_id: ticketTypeId
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    purchaseId: (result as any).purchase_id,
    registrationId: (result as any).registration_id,
    amountPaid: (result as any).amount_paid,
    paymentMethod: (result as any).payment_method
  };
}

export async function unregister(userId: string, eventId: string) {
  const client = await createClient();

  // Use atomic database function to ensure proper financial handling
  const { data: result, error } = await client.rpc('unregister_user_from_event', {
    p_user_id: userId,
    p_event_id: eventId
  });

  if (error) {
    throw new Error(error.message);
  }

  return {
    success: true,
    refundedAmount: (result as any).refunded_amount,
    paymentMethod: (result as any).payment_method,
    purchaseId: (result as any).purchase_id
  };
}
