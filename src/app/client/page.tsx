"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { usePolling } from "@/hooks/use-polling";
import { RefreshIndicator } from "@/components/refresh-indicator";
import { ReservationStatusBadge } from "@/components/reservation-status-badge";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

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
  const [activeTab, setActiveTab] = useState("restaurants");
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    // Fetch restaurants
    try {
      const restaurantsRes = await fetch("/api/restaurants");
      const restaurantsData = await restaurantsRes.json();
      setRestaurants(restaurantsData);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
    }

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
  const { isRefreshing, refresh } = usePolling({
    enabled: true,
    onRefresh: fetchData,
  });

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Panel klienta
            </h1>
            <p className="text-sm text-gray-600">
              Przeglądaj restauracje i zarządzaj swoimi rezerwacjami
            </p>
          </div>
          <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full bg-white/80 backdrop-blur-sm shadow-md">
            <TabsTrigger value="restaurants" className="flex-1">
              Restauracje
            </TabsTrigger>
            <TabsTrigger value="reservations" className="flex-1">
              Moje rezerwacje
            </TabsTrigger>
          </TabsList>

          <TabsContent value="restaurants" className="mt-6">
            <div className="grid sm:grid-cols-2 gap-6">
              {restaurants.map((r) => (
                <Card key={r.id} className="overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt={r.name}
                      className="w-full h-40 object-cover"
                    />
                  )}
                  <CardContent className="p-4 space-y-2">
                    <h2 className="text-lg font-semibold">{r.name}</h2>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {r.description}
                    </p>
                    <Button asChild className="mt-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow">
                      <Link href={`/restaurants/${r.slug}`}>Zobacz</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reservations" className="mt-6">
            {loading ? (
              <p className="text-center text-gray-600">Ładowanie...</p>
            ) : reservations.length === 0 ? (
              <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 text-center">
                  <p className="text-gray-600">
                    Nie masz jeszcze żadnych rezerwacji
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {reservations.map((res) => (
                  <Card key={res.id} className="bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="font-medium">{res.restaurant.name}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(res.startTime).toLocaleString("pl-PL")} •{" "}
                          {res.partySize} os.
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">Status:</span>
                          <ReservationStatusBadge status={res.status} />
                        </div>
                      </div>
                      <Button asChild className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow">
                        <Link href={`/reservations/${res.id}`}>Szczegóły</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
