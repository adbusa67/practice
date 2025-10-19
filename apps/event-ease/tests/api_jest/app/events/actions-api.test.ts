/**
 * API Tests for Event Server Actions
 *
 * These tests verify the server actions (Next.js API layer) work correctly
 * with the Supabase database. They test the full request/response cycle
 * including data validation, error handling, and database interactions.
 *
 * REQUIRES: Supabase to be running (pnpm db:start)
 */

// Import setup to mock Next.js server APIs
import "../../setup";

import { getEvents, searchEvents, register, unregister } from "@/app/events/actions";
import { typedClient } from "@/utils/supabase";

describe("Event Server Actions API Tests", () => {
  const supabase = typedClient;
  let testUserId: string;

  beforeAll(async () => {
    // Get a real test user from the database
    // The seed data creates user1@example.com through user10@example.com
    const { data: authUser } = await supabase.auth.signInWithPassword({
      email: "user1@example.com",
      password: "testtest",
    });

    if (authUser.user) {
      testUserId = authUser.user.id;
    } else {
      // Fallback: try to get any existing user
      const { data: users } = await supabase
        .from("users")
        .select("id")
        .limit(1)
        .single();

      testUserId = (users as any)?.id || "00000000-0000-0000-0000-000000000001";
    }
  });

  beforeEach(async () => {
    // Clean up any existing registrations and ticket purchases for this test user
    // This ensures test isolation and prevents duplicate key constraint violations
    await supabase
      .from("ticket_purchases")
      .delete()
      .eq("user_id", testUserId);

    await supabase
      .from("registrations")
      .delete()
      .eq("user_id", testUserId);
  });

  describe("getEvents API", () => {
    it("should return events and registrations for a valid user", async () => {
      const result = await getEvents(testUserId);

      expect(result).toBeDefined();
      expect(result).toHaveProperty("events");
      expect(result).toHaveProperty("registrations");
      expect(Array.isArray(result.events)).toBe(true);
      expect(Array.isArray(result.registrations)).toBe(true);
    });

    it("should include complete event data with relationships", async () => {
      const result = await getEvents(testUserId);

      if (result.events.length > 0) {
        const event = result.events[0];
        expect(event).toHaveProperty("id");
        expect(event).toHaveProperty("name");
        expect(event).toHaveProperty("date");
        expect(event).toHaveProperty("location");
        expect(event).toHaveProperty("organizers");
        expect(event).toHaveProperty("venues");
        expect(event).toHaveProperty("ticket_types");
      }
    });

    it("should include ticket types with pricing information", async () => {
      const result = await getEvents(testUserId);

      const eventWithTickets = result.events.find(e => e.ticket_types && e.ticket_types.length > 0);
      if (eventWithTickets?.ticket_types) {
        const ticket = eventWithTickets.ticket_types[0];
        expect(ticket).toHaveProperty("id");
        expect(ticket).toHaveProperty("tier_name");
        expect(ticket).toHaveProperty("price");
        expect(typeof ticket.price).toBe("number");
      }
    });

    it("should return user registrations with ticket purchase info", async () => {
      const result = await getEvents(testUserId);

      if (result.registrations.length > 0) {
        const registration = result.registrations[0];
        expect(registration).toHaveProperty("id");
        expect(registration).toHaveProperty("user_id");
        expect(registration).toHaveProperty("event_id");
      }
    });
  });

  describe("searchEvents API", () => {
    it("should return all events when search value is empty", async () => {
      const result = await searchEvents(testUserId, "");

      expect(result).toBeDefined();
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
      expect(result.events.length).toBeGreaterThan(0);
    });

    it("should return all events when search value is whitespace", async () => {
      const result = await searchEvents(testUserId, "   ");

      expect(result).toBeDefined();
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
    });

    it("should search by event name and return matching results", async () => {
      // Get a real event name from the database
      const { data: sampleEvent } = await supabase
        .from("events")
        .select("name")
        .limit(1)
        .single();

      if ((sampleEvent as any)?.name) {
        const searchTerm = (sampleEvent as any).name.split(" ")[0];
        const result = await searchEvents(testUserId, searchTerm);

        expect(result.events).toBeDefined();
        const found = result.events.some((e: any) =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        expect(found).toBe(true);
      }
    });

    it("should include user registrations in search results", async () => {
      const result = await searchEvents(testUserId, "");

      expect(result.registrations).toBeDefined();
      expect(Array.isArray(result.registrations)).toBe(true);
    });

    it("should handle special characters in search", async () => {
      const result = await searchEvents(testUserId, "C++");

      expect(result).toBeDefined();
      expect(result.events).toBeDefined();
      expect(Array.isArray(result.events)).toBe(true);
    });
  });

  describe("register API", () => {
    it("should throw error when ticket type is not provided", async () => {
      const fakeEventId = "00000000-0000-0000-0000-000000000099";

      await expect(
        register(testUserId, fakeEventId, undefined as any)
      ).rejects.toThrow("Ticket type is required for registration");
    });

    it("should throw error when registering for non-existent event", async () => {
      const fakeEventId = "00000000-0000-0000-0000-000000000099";
      const fakeTicketId = "00000000-0000-0000-0000-000000000099";

      await expect(
        register(testUserId, fakeEventId, fakeTicketId)
      ).rejects.toThrow();
    });

    it("should successfully register user and create ticket purchase", async () => {
      // Get an available event
      const { data: availableEvent } = await supabase
        .from("events")
        .select("id, ticket_types(id)")
        .limit(1)
        .single();

      if (availableEvent && (availableEvent as any).ticket_types?.[0]) {
        const eventId = (availableEvent as any).id;
        const ticketTypeId = (availableEvent as any).ticket_types[0].id;

        const result = await register(testUserId, eventId, ticketTypeId);

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result).toHaveProperty("purchaseId");
        expect(result).toHaveProperty("registrationId");
        expect(result).toHaveProperty("amountPaid");
        expect(result).toHaveProperty("paymentMethod");

        // Clean up - unregister the user
        await unregister(testUserId, eventId);
      }
    });

    it("should handle free ticket registration", async () => {
      // Find a free ticket event
      const { data: freeTicket } = await supabase
        .from("ticket_types")
        .select("id, event_id")
        .eq("price", 0)
        .limit(1)
        .single();

      if (freeTicket) {
        const result = await register(testUserId, (freeTicket as any).event_id, (freeTicket as any).id);

        expect(result.success).toBe(true);
        expect(result.paymentMethod).toBe("free");
        expect(result.amountPaid).toBe(0);

        // Clean up
        await unregister(testUserId, (freeTicket as any).event_id);
      }
    });

    it("should handle paid ticket registration", async () => {
      // Find a paid ticket
      const { data: paidTicket } = await supabase
        .from("ticket_types")
        .select("id, event_id, price")
        .gt("price", 0)
        .limit(1)
        .single();

      if (paidTicket) {
        const result = await register(testUserId, (paidTicket as any).event_id, (paidTicket as any).id);

        expect(result.success).toBe(true);
        expect(result.paymentMethod).toBe("stripe");
        expect(result.amountPaid).toBeGreaterThan(0);
        expect(result.amountPaid).toBe((paidTicket as any).price);

        // Clean up
        await unregister(testUserId, (paidTicket as any).event_id);
      }
    });
  });

  describe("unregister API", () => {
    it("should handle unregistering from non-existent event", async () => {
      const fakeEventId = "00000000-0000-0000-0000-000000000099";

      await expect(
        unregister(testUserId, fakeEventId)
      ).rejects.toThrow();
    });

    it("should successfully unregister user from event", async () => {
      // First register the user
      const { data: event } = await supabase
        .from("events")
        .select("id, ticket_types(id)")
        .limit(1)
        .single();

      if (event && (event as any).ticket_types?.[0]) {
        const eventId = (event as any).id;
        const ticketTypeId = (event as any).ticket_types[0].id;

        // Register first
        await register(testUserId, eventId, ticketTypeId);

        // Now unregister
        const result = await unregister(testUserId, eventId);

        expect(result).toBeDefined();
        expect(result.success).toBe(true);
        expect(result).toHaveProperty("refundedAmount");
        expect(result).toHaveProperty("paymentMethod");
        expect(result).toHaveProperty("purchaseId");
      }
    });

    it("should handle refund processing for paid tickets", async () => {
      // Register for a paid event
      const { data: paidTicket } = await supabase
        .from("ticket_types")
        .select("id, event_id, price")
        .gt("price", 0)
        .limit(1)
        .single();

      if (paidTicket) {
        await register(testUserId, (paidTicket as any).event_id, (paidTicket as any).id);

        const result = await unregister(testUserId, (paidTicket as any).event_id);

        expect(result.refundedAmount).toBeDefined();
        expect(typeof result.refundedAmount).toBe("number");
        expect(result.refundedAmount).toBe((paidTicket as any).price);
      }
    });

    it("should handle free ticket unregistration with no refund", async () => {
      // Register for a free event
      const { data: freeTicket } = await supabase
        .from("ticket_types")
        .select("id, event_id")
        .eq("price", 0)
        .limit(1)
        .single();

      if (freeTicket) {
        await register(testUserId, (freeTicket as any).event_id, (freeTicket as any).id);

        const result = await unregister(testUserId, (freeTicket as any).event_id);

        expect(result.refundedAmount).toBe(0);
        expect(result.paymentMethod).toBe("free");
      }
    });
  });

  describe("Complete Registration Workflow", () => {
    it("should handle complete registration and unregistration workflow", async () => {
      // 1. Get events
      const eventsResult = await getEvents(testUserId);
      expect(eventsResult.events.length).toBeGreaterThan(0);

      // 2. Search for an event
      const searchResult = await searchEvents(testUserId, eventsResult.events[0].name.split(" ")[0]);
      expect(searchResult.events.length).toBeGreaterThan(0);

      // 3. Register for an event
      const event = searchResult.events[0];
      if (event.ticket_types && event.ticket_types.length > 0) {
        const registerResult = await register(testUserId, event.id, event.ticket_types[0].id);
        expect(registerResult.success).toBe(true);

        // 4. Verify registration appears in getEvents
        const verifyResult = await getEvents(testUserId);
        const hasRegistration = verifyResult.registrations.some((r: any) => r.event_id === event.id);
        expect(hasRegistration).toBe(true);

        // 5. Unregister
        const unregisterResult = await unregister(testUserId, event.id);
        expect(unregisterResult.success).toBe(true);

        // 6. Verify registration is removed
        const finalResult = await getEvents(testUserId);
        const stillHasRegistration = finalResult.registrations.some((r: any) => r.event_id === event.id);
        expect(stillHasRegistration).toBe(false);
      }
    });
  });
});
