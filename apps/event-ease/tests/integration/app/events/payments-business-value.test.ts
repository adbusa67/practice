import { typedClient } from "@/utils/supabase";
import { describe, expect, it } from "@jest/globals";

/**
 * High-Level Business Value Tests for Payment System
 */

describe("Payment System Business Value", () => {
  const supabase = typedClient;

  it("enables revenue tracking and financial audit trails for organizers", async () => {
    // Why: Organizers need clear financial records for tax reporting and business analytics
    const { data: purchases } = await supabase
      .from("ticket_purchases")
      .select("*, ticket_types(event_id, tier_name)")
      .eq("payment_status", "completed")
      .neq("amount_paid", 0);

    expect(purchases!.length).toBeGreaterThanOrEqual(3);

    // Calculate total revenue for a specific event
    const techConferencePurchases = purchases!.filter(
      p => p.ticket_types?.tier_name?.includes("General") ||
           p.ticket_types?.tier_name?.includes("Student") ||
           p.ticket_types?.tier_name?.includes("Premium")
    );

    const totalRevenue = techConferencePurchases.reduce((sum, p) => sum + (p.amount_paid || 0), 0);
    expect(totalRevenue).toBeGreaterThan(0);
    // Why: Enables accurate revenue reporting and financial planning for organizers
  });

  it("prevents event attendance without valid payment for paid events", async () => {
    // Why: Critical business rule - no free access to paid events without payment
    const { data: registrations } = await supabase
      .from("registrations")
      .select(`
        *,
        ticket_purchases(payment_status, amount_paid),
        events(name)
      `)
      .not("ticket_purchase_id", "is", null);

    // All paid registrations must have valid payment status (completed or refunded)
    // Refunded customers still attended the event, so they should have registrations
    registrations!.forEach(registration => {
      if (registration.ticket_purchases?.amount_paid && registration.ticket_purchases.amount_paid > 0) {
        expect(['completed', 'refunded']).toContain(registration.ticket_purchases.payment_status);
      }
    });
    // Why: Ensures financial integrity while allowing legitimate refunded attendance
  });

  it("supports mixed business models with both free and paid events seamlessly", async () => {
    // Why: Flexibility to accommodate different event types and revenue strategies
    const { data: freeTicketPurchases } = await supabase
      .from("ticket_purchases")
      .select("*, ticket_types(tier_name)")
      .eq("amount_paid", 0)
      .eq("payment_method", "free");

    const { data: paidTicketPurchases } = await supabase
      .from("ticket_purchases")
      .select("*, ticket_types(tier_name)")
      .gt("amount_paid", 0)
      .eq("payment_status", "completed");

    expect(freeTicketPurchases!.length).toBeGreaterThanOrEqual(2);
    expect(paidTicketPurchases!.length).toBeGreaterThanOrEqual(2);

    // Verify free purchases have correct properties
    freeTicketPurchases!.forEach(purchase => {
      expect(purchase.payment_method).toBe("free");
      expect(purchase.amount_paid).toBe(0);
      expect(purchase.payment_status).toBe("completed");
    });

    // Verify paid purchases have amount > 0
    paidTicketPurchases!.forEach(purchase => {
      expect(purchase.amount_paid).toBeGreaterThan(0);
    });
    // Why: Demonstrates platform flexibility for diverse event monetization strategies
  });

  it("tracks payment failures and enables recovery workflows", async () => {
    // Why: Payment failures are inevitable - system must handle gracefully and enable recovery
    const { data: failedPayments } = await supabase
      .from("ticket_purchases")
      .select("*, ticket_types(tier_name, price)")
      .eq("payment_status", "failed");

    expect(failedPayments!.length).toBeGreaterThanOrEqual(1);

    // Verify failed payments don't create registrations
    for (const failedPayment of failedPayments!) {
      const { data: registrations } = await supabase
        .from("registrations")
        .select("*")
        .eq("ticket_purchase_id", failedPayment.id);

      expect(registrations!.length).toBe(0);
    }
    // Why: Prevents invalid registrations and enables customer support to resolve payment issues
  });

  it("maintains referential integrity across payment-registration-event chain", async () => {
    // Why: Data consistency is critical for financial accuracy and customer experience
    const { data: registrations } = await supabase
      .from("registrations")
      .select(`
        *,
        ticket_purchases(
          id,
          ticket_types(
            id,
            event_id
          )
        ),
        events(id)
      `)
      .not("ticket_purchase_id", "is", null);

    registrations!.forEach(registration => {
      // Registration's event must match ticket type's event
      expect(registration.events?.id).toBe(
        registration.ticket_purchases?.ticket_types?.event_id
      );
    });
    // Why: Ensures data integrity and prevents mismatched registrations/payments
  });
});