"use client";

import { Database } from "@/types/supabase";

type Registration = Database['public']['Tables']['registrations']['Row'];
import { Button, CollapsibleCard } from "@event-ease/ui";
import { ChevronDown, ChevronUp, CircleUserRound, Clock, MapPin, Check } from "lucide-react";
import { useState } from "react";
import { type EventAndOrganizer, register, unregister } from "./actions";
import { formatEventDate, formatEventTimeRange } from "@/lib/date-utils";

type EventCardProps = {
  event: EventAndOrganizer;
  registration?: Registration & {
    ticket_purchases: { ticket_type_id: string } | null;
  };
  userId: string;
};

export function EventCard({ event, registration, userId }: EventCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [userRegistration, setUserRegistration] = useState<Registration & {
    ticket_purchases: { ticket_type_id: string } | null;
  } | null>(registration || null);
  const [isRegistering, setIsRegistering] = useState(false);

  // Check if user has any registration for this event
  const isRegistered = Boolean(userRegistration);

  // Get the registered ticket type if user is registered
  const getRegisteredTicketTypeId = () => {
    if (!userRegistration?.ticket_purchases?.ticket_type_id) return null;
    return userRegistration.ticket_purchases.ticket_type_id;
  };

  const handleToggleRegistration = async (ticketTypeId?: string) => {
    if (isRegistering) return;

    setIsRegistering(true);

    try {
      if (isRegistered) {
        await unregister(userId, event.id);
      } else {
        // Pass the ticketTypeId to create the appropriate purchase
        await register(userId, event.id, ticketTypeId);
      }
      // Update the registration state
      if (isRegistered) {
        setUserRegistration(null);
      } else {
        // Create a mock registration object with ticket purchase info
        setUserRegistration({
          id: 'temp-id',
          user_id: userId,
          event_id: event.id,
          registered_at: new Date().toISOString(),
          ticket_purchase_id: 'temp-purchase-id',
          ticket_purchases: {
            ticket_type_id: ticketTypeId || 'default-type'
          }
        });
      }
    } catch (error) {
      console.error('Registration toggle error:', error);
      // Don't update state if registration failed (e.g., duplicate constraint)
    } finally {
      setIsRegistering(false);
    }
  };

  // NOTE: There's a known visual flash bug when toggling registration states.
  // The button briefly shows intermediate states due to parent component re-renders
  // caused by the registrations array being updated after API calls. This causes
  // the button to flash between different visual states during the transition.

  return (
    <div className="bg-blue-50 rounded-md shadow-lg border border-blue-200" style={{ boxShadow: '0px 6px 28px rgba(0, 0, 0, 0.15)' }}>
      <CollapsibleCard open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleCard.Trigger className="w-full">
          <div className="flex items-center justify-between w-full p-4 hover:bg-blue-100 transition-colors">
            {/* Left side - Event info */}
            <div className="flex-1 text-left">
              <h3 className={`text-lg font-semibold ${isOpen ? 'text-blue-600' : 'text-gray-900'}`}>
                {event.name}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {event.location}
              </p>
            </div>
            
            {/* Right side - Date and chevron */}
            <div className="flex items-center gap-2 ml-4">
              <span className="text-sm font-semibold text-gray-900">
                {formatEventDate(event.date)}
              </span>
              <div className="text-blue-600">
                {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </div>
            </div>
          </div>
        </CollapsibleCard.Trigger>
        
        <CollapsibleCard.Content>
          <div className="px-4 pb-4 space-y-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="relative group">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Event time
                  </div>
                </div>
                <span>{formatEventTimeRange(event.start_time, event.end_time)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="relative group">
                  <MapPin className="w-4 h-4 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Venue location
                  </div>
                </div>
                <span>{event.venues?.name}</span>
                {event.venues?.address && (
                  <span className="text-xs text-gray-500">• {event.venues.address}</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="relative group">
                  <CircleUserRound className="w-4 h-4 text-gray-500" />
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                    Event organizer and organization
                  </div>
                </div>
                <span>{event?.organizers?.name}</span>
                {event?.organizers?.organizations && (
                  <span className="text-xs text-gray-500">
                    • {event.organizers.organizations.name} ({event.organizers.organizations.type})
                  </span>
                )}
              </div>
            </div>
            
            <p className="text-sm text-gray-600 leading-snug">
              {event.description}
            </p>

            {/* Ticket pricing section */}
            {event.ticket_types && event.ticket_types.length > 0 ? (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-medium text-gray-900">
                  {event.ticket_types.length === 1 && event.ticket_types[0].price === 0 ? 'Registration:' : 'Ticket Options:'}
                </h4>
                <div className="space-y-2">
                  {event.ticket_types.map((ticketType) => (
                    <div key={ticketType.id} className="flex items-center justify-between text-sm p-3 bg-gray-50 rounded border">
                      <div className="flex-1">
                        <div className="font-medium">{ticketType.tier_name}</div>
                        {ticketType.description && (
                          <div className="text-gray-500 text-xs mt-1">{ticketType.description}</div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            {ticketType.price === 0 ? 'Free' : `$${ticketType.price.toFixed(2)}`}
                          </div>
                        </div>
                        {(() => {
                          const registeredTicketTypeId = getRegisteredTicketTypeId();
                          const isThisTicketRegistered = isRegistered && registeredTicketTypeId === ticketType.id;
                          const isOtherTicketRegistered = isRegistered && registeredTicketTypeId !== ticketType.id;

                          if (isThisTicketRegistered) {
                            // User has this specific ticket type
                            return (
                              <Button
                                disabled={isRegistering}
                                onClick={() => handleToggleRegistration(ticketType.id)}
                                variant="success"
                                className="px-3 py-1 text-xs"
                              >
                                <div className="flex items-center gap-1">
                                  <Check className="w-3 h-3" />
                                  {isRegistering ? 'Canceling...' : 'Registered'}
                                </div>
                              </Button>
                            );
                          } else if (isOtherTicketRegistered) {
                            // User has a different ticket type - show they're registered elsewhere
                            return (
                              <Button
                                disabled={true}
                                variant="secondary"
                                className="px-3 py-1 text-xs opacity-50"
                              >
                                Not Selected
                              </Button>
                            );
                          } else {
                            // User is not registered - show purchase/register button
                            return (
                              <Button
                                disabled={isRegistering}
                                onClick={() => handleToggleRegistration(ticketType.id)}
                                variant="primary"
                                className="px-3 py-1 text-xs"
                              >
                                {isRegistering ? (
                                  ticketType.price === 0 ? 'Registering...' : 'Purchasing...'
                                ) : (
                                  ticketType.price === 0 ? 'Register' : 'Purchase'
                                )}
                              </Button>
                            );
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              // This should never happen due to database constraints requiring ticket types
              <div className="flex justify-end pt-3">
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  ⚠️ Data Error: Event missing required ticket types
                </div>
              </div>
            )}
          </div>
        </CollapsibleCard.Content>
      </CollapsibleCard>
    </div>
  );
}
