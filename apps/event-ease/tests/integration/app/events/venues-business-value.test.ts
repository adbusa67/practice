import { typedClient } from "@/utils/supabase";
import { describe, expect, it } from "@jest/globals";

/**
 * High-Level Business Value Tests for Venue Normalization
 */

describe("Venue Normalization Business Value", () => {
  const supabase = typedClient;

  it("prevents venue name variations from creating duplicate records", async () => {
    // Why: Before normalization, "Downtown Music Hall" could exist as multiple variations
    const { data: venues } = await supabase
      .from("venues")
      .select("*")
      .ilike("name", "%downtown music hall%");

    expect(venues).toHaveLength(1);

    const { data: events } = await supabase
      .from("events")
      .select("*, venues(name)")
      .eq("venue_id", venues![0].id);

    expect(events!.length).toBeGreaterThanOrEqual(2);
    // Why test this: Proves multiple events share ONE venue record
  });

  it("propagates venue updates to all associated events automatically", async () => {
    // Why: Critical for maintaining consistency when venue details change
    const { data: venue } = await supabase
      .from("venues")
      .select("*")
      .eq("name", "Community Center Main Hall")
      .single();

    const newAddress = "123 Updated Street";
    await supabase
      .from("venues")
      .update({ address: newAddress })
      .eq("id", venue.id);

    const { data: eventsAtVenue } = await supabase
      .from("events")
      .select("*, venues(address)")
      .eq("venue_id", venue.id);

    eventsAtVenue!.forEach(event => {
      expect(event.venues?.address).toBe(newAddress);
    });
    // Why: Single update affects all events - no manual sync needed
  });

  it("enables tracking of venue utilization and scheduling patterns", async () => {
    // Why: Foundation for preventing double-bookings and optimizing venue usage
    const { data: venue } = await supabase
      .from("venues")
      .select("*")
      .eq("name", "Downtown Music Hall")
      .single();

    const { data: eventsAtVenue } = await supabase
      .from("events")
      .select("name, date, time")
      .eq("venue_id", venue.id)
      .order("date");

    expect(eventsAtVenue!.length).toBeGreaterThanOrEqual(2);
    // Why: Can now build conflict detection and analytics on this data structure
  });

  it("prevents creation of events with non-existent venue references", async () => {
    // Why: Database-level protection against orphaned data
    const fakeVenueId = "00000000-0000-0000-0000-000000000000";

    const { error } = await supabase
      .from("events")
      .insert({
        name: "Test Event",
        date: new Date().toISOString(),
        time: "14:00:00",
        location: "Test",
        venue_id: fakeVenueId
      });

    expect(error).toBeDefined();
    expect(error?.code).toBe("23503"); // Foreign key violation
    // Why: FK constraint ensures referential integrity at database level
  });

  it("retrieves events with full venue details in under 200ms despite JOINs", async () => {
    // Why: Proves normalization doesn't sacrifice query performance
    const startTime = performance.now();

    const { data: events } = await supabase
      .from("events")
      .select(`
        name,
        date,
        venues (name, address),
        organizers (name)
      `)
      .limit(10);

    const queryDuration = performance.now() - startTime;

    expect(queryDuration).toBeLessThan(200);
    expect(events![0].venues).toBeDefined();
    // Why: Demonstrates we get better data structure AND maintain speed
  });

  it("supports search queries with venue JOINs without performance degradation", async () => {
    // Why: Search is critical path, must remain fast even with normalized structure
    const searchTerm = "workshop";
    const startTime = performance.now();

    const { data: searchResults } = await supabase
      .from("events")
      .select("*, venues(name, address)")
      .ilike("name", `%${searchTerm}%`);

    const queryDuration = performance.now() - startTime;

    expect(queryDuration).toBeLessThan(100);

    if (searchResults && searchResults.length > 0) {
      expect(searchResults[0].venues).toBeDefined();
    }
    // Why: Confirms search remains performant with relational data
  });
});
