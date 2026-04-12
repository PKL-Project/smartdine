"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePolling } from "@/hooks/usePolling";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { ReservationStatusBadge } from "@/components/ReservationStatusBadge";

interface Reservation {
  id: string;
  startTime: string;
  partySize: number;
  status: string;
  restaurant: {
    name: string;
    slug: string;
  };
}

export default function ClientHomePage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [reservationsTab, setReservationsTab] = useState("next");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Fetch user's reservations if authenticated
    if (session?.user) {
      try {
        const reservationsRes = await fetch("/api/me/reservations");
        const reservationsData = await reservationsRes.json();
        setReservations(reservationsData);
      } catch (err) {
        console.error("Failed to fetch reservations:", err);
      }
    }
    setLoading(false);
  }, [session]);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup polling
  const { isRefreshing, refresh, lastRefresh } = usePolling({
    enabled: true,
    onRefresh: fetchData,
  });

  // Split reservations into next and past
  const { nextReservations, pastReservations } = useMemo(() => {
    const now = new Date();
    const next: Reservation[] = [];
    const past: Reservation[] = [];

    reservations.forEach((reservation) => {
      const reservationDate = new Date(reservation.startTime);
      if (reservationDate >= now) {
        next.push(reservation);
      } else {
        past.push(reservation);
      }
    });

    return { nextReservations: next, pastReservations: past };
  }, [reservations]);

  const renderReservationList = (reservationsList: Reservation[], isPast = false) => {
    if (reservationsList.length === 0) {
      return (
        <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-12 text-center">
            <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
            <p className="text-gray-600">Brak {isPast ? "przeszłych" : "nadchodzących"} rezerwacji</p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid gap-4 md:grid-cols-2">
        {reservationsList.map((res) => (
          <Card
            key={res.id}
            className={`rounded-2xl backdrop-blur-sm shadow-lg transition-all duration-300 ${
              isPast ? "bg-gray-100/80 opacity-70" : "bg-white/80 hover:shadow-xl hover:scale-[1.02]"
            }`}
          >
            <CardContent className="p-6">
              <div className="space-y-4">
                {/* Restaurant name */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <h3 className={`text-lg font-bold ${isPast ? "text-gray-600" : "text-gray-900"}`}>
                      {res.restaurant.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <ReservationStatusBadge status={res.status} />
                    </div>
                  </div>
                  {isPast && (
                    <span className="text-xs text-gray-500 bg-gray-200 px-3 py-1 rounded-full">Zakończone</span>
                  )}
                </div>

                {/* Details */}
                <div className="space-y-2">
                  <div className={`flex items-center gap-2 text-sm ${isPast ? "text-gray-500" : "text-gray-700"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>
                      {new Date(res.startTime).toLocaleString("pl-PL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 text-sm ${isPast ? "text-gray-500" : "text-gray-700"}`}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                      />
                    </svg>
                    <span>
                      {res.partySize} {res.partySize === 1 ? "osoba" : res.partySize < 5 ? "osoby" : "osób"}
                    </span>
                  </div>
                </div>

                {/* Action button */}
                {!isPast && (
                  <Button
                    asChild
                    className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-all"
                  >
                    <Link href={`/reservations/${res.id}`}>Zobacz szczegóły</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex flex-col items-center">
      <div className="w-full max-w-6xl mx-auto p-6 space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-6 py-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 bg-clip-text text-transparent animate-gradient">
              Witaj w SmartDine
            </h1>
            <p className="text-gray-700 text-xl md:text-2xl font-light max-w-2xl mx-auto">
              Znajdź idealną restaurację i zarezerwuj stolik w kilka kliknięć
            </p>
          </div>

          {/* Quick Stats & CTA */}
          <div className="flex flex-col items-center gap-6 pt-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-600">{reservations.length}</div>
              <div className="text-sm text-gray-600">
                {reservations.length === 1 ? "Rezerwacja" : reservations.length < 5 ? "Rezerwacje" : "Rezerwacji"}
              </div>
            </div>

            <Button
              onClick={() => router.push("/restaurants")}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-all text-lg px-8 py-6 rounded-xl"
            >
              <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              Przeglądaj restauracje
            </Button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex justify-center">
              <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} lastRefresh={lastRefresh} />
            </div>

            {loading ? (
              <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-12 text-center">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mx-auto"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                  </div>
                </CardContent>
              </Card>
            ) : reservations.length === 0 ? (
              <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-12 text-center space-y-4">
                  <svg
                    className="w-16 h-16 mx-auto text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <div>
                    <p className="text-gray-900 text-lg font-semibold mb-1">Nie masz jeszcze żadnych rezerwacji</p>
                    <p className="text-gray-600">Zarezerwuj stolik w jednej z naszych restauracji</p>
                  </div>
                  <Button
                    onClick={() => router.push("/restaurants")}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-all"
                  >
                    Przeglądaj restauracje
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Tabs value={reservationsTab} onValueChange={setReservationsTab} className="space-y-4">
                <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 bg-white/80 backdrop-blur-sm shadow-md rounded-xl p-1">
                  <TabsTrigger value="next" className="rounded-lg">
                    Nadchodzące ({nextReservations.length})
                  </TabsTrigger>
                  <TabsTrigger value="past" className="rounded-lg">
                    Przeszłe ({pastReservations.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="next" className="mt-6">
                  {renderReservationList(nextReservations, false)}
                </TabsContent>

                <TabsContent value="past" className="mt-6">
                  {renderReservationList(pastReservations, true)}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
