"use client";

import { EventAndOrganizer, getEvents, searchEvents } from "./actions";
import { EventCard } from "./EventCard";
import { Header } from "./Header";
import { RegistrationFilter, RegistrationFilterType } from "./RegistrationFilter";
import { useEffect, useState, useCallback, useMemo } from "react";
import { Database } from "@/types/supabase";

type Registration = Database['public']['Tables']['registrations']['Row'];
import { typedClient } from "@/utils/supabase";
import { User } from "@supabase/supabase-js";
import { SearchTextField } from "@event-ease/ui";
import CoveringComponent from "./CoveringComponent";

const SEARCH_DEBOUNCE_MS = 300;

export default function EventsPage() {
  const [events, setEvents] = useState<EventAndOrganizer[]>([]);
  const [registrations, setRegistrations] = useState<Array<Registration & {
    ticket_purchases: { ticket_type_id: string } | null;
  }>>([]);
  const [user, setUser] = useState<User | null>();
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearchValue, setDebouncedSearchValue] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [registrationFilter, setRegistrationFilter] = useState<RegistrationFilterType>("all");

  const fetchEvents = useCallback(async (searchQuery: string = "") => {
    if (!user?.id) return;

    setIsSearching(true);
    try {
      const response = searchQuery.trim()
        ? await searchEvents(user.id, searchQuery)
        : await getEvents(user.id);

      setEvents(response.events);
      setRegistrations(response.registrations);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setIsSearching(false);
    }
  }, [user?.id]);

  // Debounce search value to prevent unnecessary API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue);
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const initializeUser = async () => {
      const {
        data: { user: fetchedUser },
      } = await typedClient.auth.getUser();
      setUser(fetchedUser);
    };
    
    initializeUser();
  }, []);

  // Trigger search when debouncedSearchValue changes
  useEffect(() => {
    if (user?.id) {
      fetchEvents(debouncedSearchValue);
    }
  }, [debouncedSearchValue, user?.id, fetchEvents]);

  // Filter events based on registration status
  const filteredEvents = useMemo(() => {
    if (registrationFilter === "all") {
      return events;
    }

    return events.filter((event) => {
      const isRegistered = registrations.some(
        (registration) => registration.event_id === event.id
      );

      if (registrationFilter === "registered") {
        return isRegistered;
      } else if (registrationFilter === "not-registered") {
        return !isRegistered;
      }

      return true;
    });
  }, [events, registrations, registrationFilter]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <CoveringComponent />
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Title and Search Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <h1 className="text-3xl sm:text-4xl font-semibold text-gray-900">
            Community Events
          </h1>
          <div className="w-full sm:w-80">
            <SearchTextField
              name="search"
              onSubmit={(e) => e.preventDefault()}
              controlProps={{
                placeholder: 'Search events...',
                value: searchValue,
                onChange: (e) => {
                  setSearchValue(e.target.value);
                }
              }}
            />
          </div>
        </div>
        
        {/* Registration Filter */}
        <div className="w-full flex justify-start mb-6">
          <RegistrationFilter
            value={registrationFilter}
            onChange={setRegistrationFilter}
          />
        </div>
        
        {/* Events Grid */}
        {isSearching ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-gray-600">Searching events...</div>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
              <svg 
                width="32" 
                height="32" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-gray-400"
              >
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {searchValue ? 'No events found' : 'No events available'}
            </h2>
            <p className="text-gray-600">
              {searchValue 
                ? 'Try another keyword or clear your search' 
                : registrationFilter === "all"
                  ? 'Check back later for new events'
                  : `No ${registrationFilter === "registered" ? "registered" : "unregistered"} events found`
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            <div className="space-y-6">
              {filteredEvents.filter((_, index) => index % 2 === 0).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  registration={registrations.find(
                    (registration) => registration.event_id === event.id
                  )}
                  userId={user?.id || ""}
                />
              ))}
            </div>
            <div className="space-y-6">
              {filteredEvents.filter((_, index) => index % 2 === 1).map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  registration={registrations.find(
                    (registration) => registration.event_id === event.id
                  )}
                  userId={user?.id || ""}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
