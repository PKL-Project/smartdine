"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { money } from "@/lib/format";
import ReserveForm from "./reserve-form";
import { BackToRestaurantsButton } from "@/components/BackToRestaurantsButton";
import { usePolling } from "@/hooks/usePolling";
import { RefreshIndicator } from "@/components/RefreshIndicator";
import { TimeSlot } from "@/components/TimeSlotPicker";
import Image from "next/image";

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  priceCents: number;
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
  items: MenuItem[];
}

interface Table {
  id: string;
  name: string;
  capacity: number;
}

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  slotDurationMinutes: number;
  owner: { email: string };
  categories: MenuCategory[];
  tables: Table[];
}

function getDefaultDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export default function RestaurantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: session } = useSession();

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Reservation form state - lifted up for polling
  const [selectedDate, setSelectedDate] = useState<string>(getDefaultDate);
  const [party, setParty] = useState(2);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const fetchRestaurant = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${slug}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setRestaurant(data);
      }
    } catch (err) {
      console.error("Failed to fetch restaurant:", err);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchSlots = useCallback(async () => {
    if (!selectedDate) return;

    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/restaurants/${slug}/available-slots?date=${selectedDate}&partySize=${party}`);
      const data = await res.json();
      setAvailableSlots(data.availableSlots || []);
    } catch (err) {
      console.error("Failed to fetch slots:", err);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [slug, selectedDate, party]);

  // Initial load
  useEffect(() => {
    fetchRestaurant();
  }, [fetchRestaurant]);

  // Fetch slots when date or party changes
  useEffect(() => {
    if (restaurant) {
      fetchSlots();
    }
  }, [selectedDate, party, restaurant?.slug, fetchSlots, restaurant]);

  // Setup polling - refresh all data
  const handleRefresh = useCallback(async () => {
    await Promise.all([fetchRestaurant(), fetchSlots()]);
  }, [fetchRestaurant, fetchSlots]);

  const { isRefreshing, refresh, lastRefresh } = usePolling({
    enabled: !notFound && !loading,
    onRefresh: handleRefresh,
  });

  // Check if current user is the owner
  const isOwner = session?.user?.email === restaurant?.owner.email;

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-5xl mx-auto p-6">
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </main>
    );
  }

  if (notFound || !restaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
        <div className="text-gray-700">Nie znaleziono restauracji.</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <BackToRestaurantsButton />
          <RefreshIndicator isRefreshing={isRefreshing} onRefresh={refresh} lastRefresh={lastRefresh} />
        </div>

        {isOwner && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Tryb podglądu właściciela</p>
                <p className="text-sm text-blue-700">
                  Przeglądasz swoją restaurację tak, jak widzą ją klienci. Nie możesz dokonać rezerwacji w swojej
                  restauracji.
                </p>
              </div>
            </div>
          </div>
        )}

        {restaurant.imageUrl && (
          <Image
            width={800}
            height={450}
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-56 object-cover rounded-2xl shadow-lg"
          />
        )}
        <div className="space-y-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {restaurant.name}
          </h1>
          {restaurant.description && <p className="text-sm text-gray-600">{restaurant.description}</p>}
          {restaurant.owner.email && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Kontakt:</span> {restaurant.owner.email}
            </p>
          )}
        </div>

        <ReserveForm
          restaurant={restaurant}
          isOwnerPreview={isOwner}
          availableSlots={availableSlots}
          loadingSlots={loadingSlots}
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
          party={party}
          onPartyChange={setParty}
        />

        <section className="grid sm:grid-cols-2 gap-6">
          {restaurant.categories.map((cat) => (
            <div key={cat.id} className="space-y-3 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <h2 className="text-xl font-semibold text-gray-900">{cat.name}</h2>
              <ul className="space-y-2">
                {cat.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 hover:shadow-md transition-shadow"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{it.name}</div>
                      {it.description && <div className="text-xs text-gray-600">{it.description}</div>}
                    </div>
                    <div className="text-sm font-medium text-orange-600">{money(it.priceCents)}</div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
