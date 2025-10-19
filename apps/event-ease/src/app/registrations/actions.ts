"use server";

import { Database } from "@/types/supabase";

type Event = Database['public']['Tables']['events']['Row'];
type Organizer = Database['public']['Tables']['organizers']['Row'];
type Organization = Database['public']['Tables']['organizations']['Row'];
type Registration = Database['public']['Tables']['registrations']['Row'];
type TicketPurchase = Database['public']['Tables']['ticket_purchases']['Row'];
type TicketType = Database['public']['Tables']['ticket_types']['Row'];
type Venue = Database['public']['Tables']['venues']['Row'];
import { createClient } from "@/utils/server";

export type RegistrationWithDetails = Registration & {
  events: (Event & {
    organizers: (Pick<Organizer, "name" | "contact_info"> & {
      organizations: Pick<Organization, "name" | "type"> | null;
    }) | null;
    venues: Pick<Venue, "id" | "name" | "address"> | null;
  }) | null;
  ticket_purchases: (TicketPurchase & {
    ticket_types: Pick<TicketType, "tier_name" | "price" | "description"> | null;
  }) | null;
};

type GetRegistrationsResponse = {
  registrations: Array<RegistrationWithDetails>;
};

export async function getRegistrations(userId: string): Promise<GetRegistrationsResponse> {
  const client = await createClient();

  const { data: registrations, error } = await client
    .from("registrations")
    .select(`
      *,
      events (
        *,
        organizers (name, contact_info, organizations (name, type)),
        venues (id, name, address)
      ),
      ticket_purchases (
        *,
        ticket_types (tier_name, price, description)
      )
    `)
    .eq("user_id", userId)
    .order("registered_at", { ascending: false });

  if (error) {
    console.error("Error fetching registrations:", error);
    throw new Error(error.message);
  }

  return {
    registrations: registrations || []
  };
}