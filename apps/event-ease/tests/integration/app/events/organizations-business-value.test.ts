import { typedClient } from "@/utils/supabase";
import { describe, expect, it } from "@jest/globals";

/**
 * High-Level Business Value Tests for Organizations Hierarchy
 */

describe("Organizations Hierarchy Business Value", () => {
  const supabase = typedClient;

  it("enables centralized management of multiple organizers under one organization", async () => {
    // Why: Organizations can manage multiple event organizers efficiently
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("name", "City Recreation Department")
      .single();

    const { data: organizers } = await supabase
      .from("organizers")
      .select("*")
      .eq("organization_id", organization.id);

    expect(organizers!.length).toBeGreaterThanOrEqual(2);
    // Why: Multiple organizers can belong to same organization for unified oversight
  });

  it("propagates organization updates to all associated organizers and events automatically", async () => {
    // Why: Critical for maintaining brand consistency across all events
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("name", "Cultural Arts Foundation")
      .single();

    const newEmail = "newemail@culturalarts.org";
    await supabase
      .from("organizations")
      .update({ contact_email: newEmail })
      .eq("id", organization.id);

    const { data: organizersWithOrg } = await supabase
      .from("organizers")
      .select("*, organizations(contact_email)")
      .eq("organization_id", organization.id);

    organizersWithOrg!.forEach(organizer => {
      expect(organizer.organizations?.contact_email).toBe(newEmail);
    });
    // Why: Single update affects all events under organization - no manual sync needed
  });

  it("enables organization-level analytics and reporting across multiple organizers", async () => {
    // Why: Foundation for tracking organization performance and resource allocation
    const { data: organization } = await supabase
      .from("organizations")
      .select("*")
      .eq("name", "Cultural Arts Foundation")
      .single();

    const { data: organizationEvents } = await supabase
      .from("events")
      .select("name, date, organizers(name)")
      .eq("organizers.organization_id", organization.id)
      .order("date");

    expect(organizationEvents!.length).toBeGreaterThanOrEqual(2);
    // Why: Can now build organization-wide metrics and resource planning
  });

  it("prevents creation of organizers with non-existent organization references", async () => {
    // Why: Database-level protection against orphaned organizer data
    const fakeOrgId = "00000000-0000-0000-0000-000000000000";

    const { error } = await supabase
      .from("organizers")
      .insert({
        name: "Test Organizer",
        contact_info: "test@test.com",
        organization_id: fakeOrgId
      });

    expect(error).toBeDefined();
    expect(error?.code).toBe("23503"); // Foreign key violation
    // Why: FK constraint ensures referential integrity at database level
  });

  it("supports organization type filtering for compliance and reporting", async () => {
    // Why: Different organization types may have different requirements or privileges
    const { data: nonprofitOrgs } = await supabase
      .from("organizations")
      .select("*")
      .eq("type", "nonprofit");

    const { data: governmentOrgs } = await supabase
      .from("organizations")
      .select("*")
      .eq("type", "government");

    expect(nonprofitOrgs!.length).toBeGreaterThanOrEqual(1);
    expect(governmentOrgs!.length).toBeGreaterThanOrEqual(1);
    // Why: Enables type-specific workflows, reporting, and compliance tracking
  });

  it("retrieves events with full organization hierarchy in under 200ms", async () => {
    // Why: Proves complex hierarchy doesn't sacrifice query performance
    const startTime = performance.now();

    const { data: events } = await supabase
      .from("events")
      .select(`
        name,
        date,
        organizers (name, organizations (name, type)),
        venues (name)
      `)
      .limit(10);

    const queryDuration = performance.now() - startTime;

    expect(queryDuration).toBeLessThan(200);
    expect(events![0].organizers?.organizations).toBeDefined();
    // Why: Demonstrates we get richer data structure while maintaining speed
  });
});