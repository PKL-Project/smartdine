"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { usePolling } from "@/hooks/usePolling";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { BackToHomeButton } from "@/components/BackToHomeButton";
import Image from "next/image";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
}

export default function RestaurantsPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/restaurants");
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      console.error("Failed to fetch restaurants:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Setup polling
  const { isRefreshing, refresh, lastRefresh } = usePolling({
    enabled: true,
    onRefresh: fetchData,
  });

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-4xl mx-auto p-6">
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <BackToHomeButton />

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Restauracje
            </h1>
            <p className="text-sm text-gray-600">Przeglądaj dostępne restauracje</p>
          </div>
          <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} lastRefresh={lastRefresh} />
        </div>

        {restaurants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full flex items-center justify-center mb-6">
              <span className="text-5xl">🍽️</span>
            </div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Brak dostępnych restauracji</h2>
            <p className="text-gray-600 text-center max-w-md mb-6">
              Obecnie nie ma żadnych restauracji w systemie. Sprawdź ponownie później lub skontaktuj się z nami.
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-6">
            {restaurants.map((r) => (
              <div
                key={r.id}
                className="overflow-hidden rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow border"
              >
                <Image
                  width={800}
                  height={450}
                  src={r.imageUrl || `https://source.unsplash.com/600x320/?food,restaurant&sig=${r.id}`}
                  alt={r.name}
                  className="w-full h-40 object-cover"
                />
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-semibold">{r.name}</h2>
                  <p className="text-sm text-gray-600 line-clamp-2">{r.description}</p>
                  <Button
                    asChild
                    className="mt-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
                  >
                    <Link href={`/restaurants/${r.slug}`}>Zobacz</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
