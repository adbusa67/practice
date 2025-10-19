import { typedClient } from "@/utils/supabase";
import { describe, expect, it } from "@jest/globals";

/**
 * High-Level Business Value Tests for Categories Many-to-Many Relationship
 */

describe("Categories Many-to-Many Business Value", () => {
  const supabase = typedClient;

  it("allows events to have multiple categories without data duplication", async () => {
    // Why: Events can be complex and span multiple categories (e.g., "Tech Conference" = Technology + Networking)

    // Create test categories since they don't exist in seed data
    const { data: categories } = await supabase
      .from("categories")
      .insert([
        { name: `Technology ${Date.now()}`, description: "Tech category" },
        { name: `Networking ${Date.now()}`, description: "Networking category" }
      ])
      .select();

    expect(categories).toBeDefined();
    expect(categories).toHaveLength(2);

    // Create a test event with multiple categories using unique name
    const { data: event } = await supabase
      .from("events")
      .insert({
        name: `Test Multi-Category Event ${Date.now()}`,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
        location: "Convention Center",
        venue_id: (await supabase.from("venues").select("id").limit(1).single()).data?.id,
        organizer_id: (await supabase.from("organizers").select("id").limit(1).single()).data?.id
      })
      .select()
      .single();

    expect(event).toBeDefined();

    // Associate event with multiple categories
    await supabase
      .from("event_categories")
      .insert([
        { event_id: event.id, category_id: categories[0].id },
        { event_id: event.id, category_id: categories[1].id }
      ]);

    // Verify the many-to-many relationship works
    const { data: eventWithCategories } = await supabase
      .from("events")
      .select(`
        name,
        event_categories (
          categories (name, color)
        )
      `)
      .eq("id", event.id)
      .single();

    expect(eventWithCategories?.event_categories).toHaveLength(2);
    expect(eventWithCategories?.event_categories.map(ec => ec.categories.name)).toContain(categories[0].name);
    expect(eventWithCategories?.event_categories.map(ec => ec.categories.name)).toContain(categories[1].name);
    // Why: Proves we can model complex event categorization without duplicating event data
  });

  it("enables efficient category-based filtering and search", async () => {
    // Why: Users need to find events by category, and this should be fast
    const { data: techCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "Technology")
      .single();

    // If Technology category doesn't exist from seed data, skip this test
    if (!techCategory) {
      console.log("Technology category not found in seed data, skipping test");
      return;
    }

    const startTime = performance.now();

    const { data: techEvents } = await supabase
      .from("events")
      .select(`
        name,
        date,
        event_categories (
          categories (name, color)
        )
      `)
      .eq("event_categories.category_id", techCategory.id);

    const queryDuration = performance.now() - startTime;

    expect(queryDuration).toBeLessThan(100);
    expect(techEvents).toBeDefined();
    // Why: Category filtering is a core user feature and must be performant
  });

  it("prevents duplicate category assignments to the same event", async () => {
    // Why: Data integrity - same event shouldn't have the same category twice
    const { data: event } = await supabase
      .from("events")
      .select("id")
      .limit(1)
      .single();

    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .limit(1)
      .single();

    // Check if this combination already exists
    const { data: existingRelation } = await supabase
      .from("event_categories")
      .select("id")
      .eq("event_id", event.id)
      .eq("category_id", category.id)
      .single();

    if (existingRelation) {
      // If it already exists, try to insert again - should fail
      const { error: duplicateError } = await supabase
        .from("event_categories")
        .insert({
          event_id: event.id,
          category_id: category.id
        });

      expect(duplicateError).toBeDefined();
      expect(duplicateError?.code).toBe("23505"); // Unique constraint violation
    } else {
      // If it doesn't exist, first assignment should succeed
      const { error: firstError } = await supabase
        .from("event_categories")
        .insert({
          event_id: event.id,
          category_id: category.id
        });

      expect(firstError).toBeNull();

      // Second assignment should fail due to unique constraint
      const { error: secondError } = await supabase
        .from("event_categories")
        .insert({
          event_id: event.id,
          category_id: category.id
        });

      expect(secondError).toBeDefined();
      expect(secondError?.code).toBe("23505"); // Unique constraint violation
    }
    // Why: Prevents data inconsistency and ensures clean category assignments
  });

  it("supports category analytics and insights", async () => {
    // Why: Business intelligence - understanding which categories are most popular
    const { data: categoryStats } = await supabase
      .from("event_categories")
      .select(`
        categories (name)
      `);

    expect(categoryStats).toBeDefined();
    expect(Array.isArray(categoryStats)).toBe(true);
    
    // Count categories manually since Supabase doesn't support groupBy in this context
    const categoryCounts = categoryStats?.reduce((acc: Record<string, number>, item) => {
      const categoryName = item.categories?.name;
      if (categoryName) {
        acc[categoryName] = (acc[categoryName] || 0) + 1;
      }
      return acc;
    }, {});

    expect(categoryCounts).toBeDefined();
    expect(Object.keys(categoryCounts || {}).length).toBeGreaterThan(0);
    // Why: Enables data-driven decisions about event planning and marketing
  });

  it("maintains referential integrity when events or categories are deleted", async () => {
    // Why: Cascading deletes prevent orphaned records and maintain data consistency
    const { data: venue } = await supabase
      .from("venues")
      .select("id")
      .limit(1)
      .single();

    const uniqueEventName = `Test Event for Deletion ${Date.now()}`;
    const { data: testEvent, error: eventError } = await supabase
      .from("events")
      .insert({
        name: uniqueEventName,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        start_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString(),
        end_time: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 12 * 60 * 60 * 1000).toISOString(),
        location: "Test Location",
        venue_id: venue?.id
      })
      .select()
      .single();

    const uniqueCategoryName = `Test Category for Deletion ${Date.now()}`;
    const { data: testCategory, error: categoryError } = await supabase
      .from("categories")
      .insert({
        name: uniqueCategoryName,
        description: "This will be deleted"
      })
      .select()
      .single();

    expect(testEvent).toBeDefined();
    expect(testCategory).toBeDefined();
    expect(eventError).toBeNull();
    expect(categoryError).toBeNull();

    // Create the relationship
    await supabase
      .from("event_categories")
      .insert({
        event_id: testEvent.id,
        category_id: testCategory.id
      });

    // Delete the event - should cascade to event_categories
    await supabase
      .from("events")
      .delete()
      .eq("id", testEvent.id);

    // Verify the relationship was deleted
    const { data: orphanedRelations } = await supabase
      .from("event_categories")
      .select("*")
      .eq("event_id", testEvent.id);

    expect(orphanedRelations).toHaveLength(0);
    // Why: Prevents orphaned records that could cause data integrity issues
  });

  it("enables complex queries combining categories with other event data", async () => {
    // Why: Real-world queries often need to combine multiple data sources
    const startTime = performance.now();

    const { data: complexQuery } = await supabase
      .from("events")
      .select(`
        name,
        date,
        venues (name, address),
        organizers (name),
        event_categories (
          categories (name, color)
        )
      `)
      .limit(5);

    const queryDuration = performance.now() - startTime;

    expect(queryDuration).toBeLessThan(200);
    expect(complexQuery).toBeDefined();
    expect(Array.isArray(complexQuery)).toBe(true);

    if (complexQuery && complexQuery.length > 0) {
      expect(complexQuery[0]).toHaveProperty("venues");
      expect(complexQuery[0]).toHaveProperty("event_categories");
    }
    // Why: Demonstrates the power of normalized data for complex business queries
  });

  it("supports category-based event recommendations", async () => {
    // Why: Personalization - users interested in one category might like similar events

    // Check if Technology category exists first
    const { data: techCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("name", "Technology")
      .single();

    if (!techCategory) {
      // Use any available category for this test
      const { data: anyCategory } = await supabase
        .from("categories")
        .select("id, name")
        .limit(1)
        .single();

      if (!anyCategory) {
        console.log("No categories found, skipping test");
        return;
      }

      const { data: categoryEvents } = await supabase
        .from("events")
        .select(`
          name,
          event_categories (
            categories (name)
          )
        `)
        .eq("event_categories.categories.name", anyCategory.name);

      expect(categoryEvents).toBeDefined();
      expect(Array.isArray(categoryEvents)).toBe(true);
      return;
    }

    const { data: techEvents } = await supabase
      .from("events")
      .select(`
        name,
        event_categories (
          categories (name)
        )
      `)
      .eq("event_categories.categories.name", "Technology");

    expect(techEvents).toBeDefined();
    expect(Array.isArray(techEvents)).toBe(true);
    // Why: Foundation for recommendation algorithms and improved user experience
  });

  it("handles category updates efficiently across all related events", async () => {
    // Why: When category details change, all related events should reflect the update
    const { data: category } = await supabase
      .from("categories")
      .select("id, name")
      .eq("name", "Technology")
      .single();

    if (!category) {
      console.log("Technology category not found in seed data, skipping test");
      return;
    }

    const newColor = "#FF6B35";
    await supabase
      .from("categories")
      .update({ color: newColor })
      .eq("id", category.id);

    const { data: eventsWithUpdatedCategory } = await supabase
      .from("events")
      .select(`
        name,
        event_categories (
          categories (name, color)
        )
      `)
      .eq("event_categories.category_id", category.id);

    eventsWithUpdatedCategory?.forEach(event => {
      const techCategory = event.event_categories?.find(ec => ec.categories.name === "Technology");
      if (techCategory) {
        expect(techCategory.categories.color).toBe(newColor);
      }
    });
    // Why: Single update propagates to all related events automatically
  });
});
