"use client";

import { getRegistrations, type RegistrationWithDetails } from "./actions";
import { RegistrationCard } from "./RegistrationCard";
import { Header } from "../events/Header";
import { useEffect, useState } from "react";
import { typedClient } from "@/utils/supabase";
import { User } from "@supabase/supabase-js";

export default function RegistrationsPage() {
  const [registrations, setRegistrations] = useState<RegistrationWithDetails[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserAndRegistrations = async () => {
      try {
        console.log("🟢 Registrations page: Starting to fetch user data");
        const { data: { user } } = await typedClient.auth.getUser();
        console.log("🟢 Registrations page: Got user", user?.id);
        setUser(user);

        if (user) {
          console.log("🟢 Registrations page: Fetching registrations for user", user.id);
          const { registrations } = await getRegistrations(user.id);
          console.log("🟢 Registrations page: Got registrations", registrations.length);
          setRegistrations(registrations);
        }
      } catch (error) {
        console.error("🔴 Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndRegistrations();
  }, []);

  if (loading) {
    return (
      <div>
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-gray-500">Loading your registrations...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  return (
    <div>
      <Header />
      <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            My Registrations
          </h1>
          <p className="text-gray-600">
            View your event registrations and payment status
          </p>
        </div>

        {registrations.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No registrations yet</h3>
            <p className="text-gray-500 mb-4">Start by registering for an event!</p>
            <a
              href="/events"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
            >
              Browse Events
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {registrations.map((registration) => (
              <RegistrationCard
                key={registration.id}
                registration={registration}
              />
            ))}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}