import { typedClient } from "@/utils/supabase";
import { describe, expect, it } from "@jest/globals";

/**
 * High-Level Business Value Tests for Database Constraints and New Features
 */

describe("Database Constraints Business Value", () => {
  const supabase = typedClient;

  it("prevents invalid data that would break business logic", async () => {
    // Why: Database constraints prevent impossible scenarios that would confuse users
    const { data: venue } = await supabase.from("venues").select("id").limit(1).single();

    // Test negative capacity constraint
    const { error: capacityError } = await supabase
      .from("events")
      .insert({
        name: "Test Event",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
        location: "Test Location",
        venue_id: venue?.id,
        capacity: -5 // Should fail
      });

    expect(capacityError).toBeDefined();
    expect(capacityError?.code).toBe("23514"); // Check constraint violation
  });

  it("enforces foreign key relationships preventing broken data", async () => {
    // Why: Orphaned data leads to broken queries and application errors
    const fakeVenueId = "00000000-0000-0000-0000-000000000000";

    const { error: fkError } = await supabase
      .from("events")
      .insert({
        name: "Test Event",
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
        location: "Test Location",
        venue_id: fakeVenueId // Should fail
      });

    expect(fkError).toBeDefined();
    expect(fkError?.code).toBe("23503"); // Foreign key violation
  });

  it("handles cascading deletes maintaining data consistency", async () => {
    // Why: When events are deleted, related event_categories should be cleaned up automatically
    const { data: venue } = await supabase.from("venues").select("id").limit(1).single();
    const { data: category } = await supabase.from("categories").select("id").limit(1).single();
    
    const { data: testEvent } = await supabase
      .from("events")
      .insert({
        name: `Test Event ${Date.now()}`,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
        location: "Test Location",
        venue_id: venue?.id
      })
      .select()
      .single();

    // Create event-category relationship
    await supabase
      .from("event_categories")
      .insert({ event_id: testEvent.id, category_id: category.id });

    // Delete event - should cascade to event_categories
    await supabase.from("events").delete().eq("id", testEvent.id);

    // Verify event_categories relationship was deleted
    const { data: orphanedRelations } = await supabase
      .from("event_categories")
      .select("*")
      .eq("event_id", testEvent.id);

    expect(orphanedRelations).toHaveLength(0);
  });

  it("supports many-to-many categories without data duplication", async () => {
    // Why: Events can have multiple categories, categories can be used by multiple events

    // First create test categories since they don't exist in seed data
    const { data: categories, error: categoriesError } = await supabase
      .from("categories")
      .insert([
        { name: `Technology ${Date.now()}`, description: "Tech events" },
        { name: `Networking ${Date.now()}`, description: "Networking events" }
      ])
      .select();

    if (categoriesError) {
      console.error("Categories creation error:", categoriesError);
    }
    expect(categories).toBeDefined();
    expect(categories).toHaveLength(2);
    expect(categoriesError).toBeNull();

    // Create a test event with unique name to avoid UNIQUE constraint violation
    const { data: event, error: eventError } = await supabase
      .from("events")
      .insert({
        name: `Test Multi-Category Conference ${Date.now()}`,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 18 * 60 * 60 * 1000).toISOString(),
        location: "Convention Center",
        venue_id: (await supabase.from("venues").select("id").limit(1).single()).data?.id,
        organizer_id: (await supabase.from("organizers").select("id").limit(1).single()).data?.id
      })
      .select()
      .single();

    if (eventError) {
      console.error("Event creation error:", eventError);
    }
    expect(event).toBeDefined();
    expect(eventError).toBeNull();

    // Associate with multiple categories
    await supabase
      .from("event_categories")
      .insert([
        { event_id: event.id, category_id: categories[0].id },
        { event_id: event.id, category_id: categories[1].id }
      ]);

    // Verify relationship works
    const { data: eventWithCategories } = await supabase
      .from("events")
      .select(`
        name,
        event_categories (categories (name))
      `)
      .eq("id", event.id)
      .single();

    expect(eventWithCategories?.event_categories).toHaveLength(2);
  });

  it("maintains performance with complex relationships and constraints", async () => {
    // Why: Constraints shouldn't significantly impact query performance
    const startTime = performance.now();

    const { data: events } = await supabase
      .from("events")
      .select(`
        name,
        venues (name),
        event_categories (categories (name, color))
      `)
      .limit(5);

    const queryDuration = performance.now() - startTime;

    expect(queryDuration).toBeLessThan(200);
    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
  });
});
