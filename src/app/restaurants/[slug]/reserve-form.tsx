"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useSession, signIn } from "next-auth/react";

type Restaurant = {
  id: string;
  slug: string;
  slotDurationMinutes: number;
  tables: { id: string; name: string; capacity: number }[];
  categories: {
    id: string;
    name: string;
    items: { id: string; name: string; priceCents: number }[];
  }[];
};

interface TimeSlot {
  slotIndex: number;
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function ReserveForm({
  restaurant,
  isOwnerPreview = false,
}: {
  restaurant: Restaurant;
  isOwnerPreview?: boolean;
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const [party, setParty] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Default to tomorrow
    return d.toISOString().split('T')[0];
  });
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]); // Store slot indices
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [special, setSpecial] = useState("");
  const [preorder, setPreorder] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available slots when date or party size changes
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate) return;

      setLoadingSlots(true);
      setSelectedSlots([]);
      try {
        const res = await fetch(
          `/api/restaurants/${restaurant.slug}/available-slots?date=${selectedDate}&partySize=${party}`
        );
        const data = await res.json();
        setAvailableSlots(data.availableSlots || []);
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, party, restaurant.slug]);

  // Handle slot selection (allow up to 2 sequential slots)
  function handleSlotClick(slotIndex: number) {
    if (selectedSlots.includes(slotIndex)) {
      // Deselect
      setSelectedSlots(selectedSlots.filter(i => i !== slotIndex));
    } else if (selectedSlots.length === 0) {
      // First selection
      setSelectedSlots([slotIndex]);
    } else if (selectedSlots.length === 1) {
      const firstSlot = selectedSlots[0];
      // Check if sequential
      if (slotIndex === firstSlot + 1) {
        // Sequential forward
        setSelectedSlots([firstSlot, slotIndex]);
      } else if (slotIndex === firstSlot - 1) {
        // Sequential backward
        setSelectedSlots([slotIndex, firstSlot]);
      } else {
        // Not sequential, replace selection
        setSelectedSlots([slotIndex]);
      }
    } else {
      // Already have 2 slots, replace with new selection
      setSelectedSlots([slotIndex]);
    }
  }

  function isSlotSelected(slotIndex: number): boolean {
    return selectedSlots.includes(slotIndex);
  }

  function canSelectSlot(slotIndex: number): boolean {
    const slot = availableSlots[slotIndex];
    if (!slot || !slot.available) return false;

    if (selectedSlots.length === 0) return true;
    if (selectedSlots.length === 1) {
      const firstSlot = selectedSlots[0];
      // Can select if sequential
      if (slotIndex === firstSlot + 1 || slotIndex === firstSlot - 1) {
        // Check if the slot in between is also available
        return true;
      }
      // Or can start a new selection
      return true;
    }
    // Already have 2 slots
    return selectedSlots.includes(slotIndex);
  }

  async function submitReservation(e: React.FormEvent) {
    e.preventDefault();
    if (!session) {
      await signIn(undefined, { callbackUrl: window.location.href });
      return;
    }

    if (selectedSlots.length === 0) {
      setError("Proszę wybrać przynajmniej jeden slot czasowy");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const preorderItems = Object.entries(preorder)
        .filter(([, q]) => Number(q) > 0)
        .map(([menuItemId, q]) => ({ menuItemId, quantity: Number(q) }));

      // Get the start time from the first selected slot
      const firstSlotIndex = Math.min(...selectedSlots);
      const firstSlot = availableSlots[firstSlotIndex];

      // Calculate duration based on number of slots
      const totalDuration = selectedSlots.length * restaurant.slotDurationMinutes;

      const res = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId: restaurant.id,
          startTime: firstSlot.startTime,
          durationMinutes: totalDuration,
          partySize: Number(party),
          specialRequests: special || null,
          preorderItems,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Reservation failed");
      router.push(`/reservations/${data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }

  // Calculate total price
  const totalPrice = restaurant.categories.reduce((total, category) => {
    return total + category.items.reduce((catTotal, item) => {
      const quantity = preorder[item.id] || 0;
      return catTotal + (item.priceCents * quantity);
    }, 0);
  }, 0);

  const formatPrice = (priceCents: number) => {
    return (priceCents / 100).toFixed(2) + " zł";
  };

  return (
    <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
          Rezerwacja
        </h2>
        <form
          onSubmit={submitReservation}
          className="grid md:grid-cols-2 gap-6"
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-gray-700">Data</Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Liczba osób</Label>
              <Input
                type="number"
                min={1}
                max={12}
                value={party}
                onChange={(e) => setParty(Number(e.target.value))}
                required
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
              <p className="text-xs text-gray-500">
                Automatycznie dobierzemy odpowiedni stolik dla Twojej grupy
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-gray-700">Dostępne sloty czasowe</Label>
                {selectedSlots.length > 0 && (
                  <span className="text-xs text-gray-600">
                    {selectedSlots.length} slot{selectedSlots.length > 1 ? 'y' : ''} ({selectedSlots.length * restaurant.slotDurationMinutes} min)
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500">
                Możesz wybrać 1 lub 2 kolejne sloty dla dłuższego pobytu
              </p>
              {loadingSlots ? (
                <div className="text-sm text-gray-600 p-3 border rounded-lg">
                  Ładowanie dostępnych slotów...
                </div>
              ) : availableSlots.length === 0 ? (
                <div className="text-sm text-gray-600 p-3 border rounded-lg bg-gray-50">
                  Brak dostępnych slotów w tym dniu
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                  {availableSlots.map((slot) => {
                    const isSelected = isSlotSelected(slot.slotIndex);
                    const canSelect = canSelectSlot(slot.slotIndex);

                    return (
                      <button
                        key={slot.slotIndex}
                        type="button"
                        disabled={!canSelect}
                        onClick={() => handleSlotClick(slot.slotIndex)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isSelected
                            ? 'bg-orange-600 text-white ring-2 ring-orange-300'
                            : canSelect && slot.available
                            ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {formatTime(slot.startTime)}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label className="text-gray-700">Uwagi (opcjonalnie)</Label>
              <Input
                value={special}
                onChange={(e) => setSpecial(e.target.value)}
                placeholder="Np. urodziny, krzesełko dla dziecka…"
                className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-2">
              <Button
                type="submit"
                disabled={loading || selectedSlots.length === 0 || isOwnerPreview}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow disabled:opacity-50 w-full"
              >
                {loading ? "Rezerwuję…" : "Zarezerwuj"}
              </Button>
              {isOwnerPreview && (
                <p className="text-xs text-gray-600 text-center">
                  Rezerwacje są wyłączone w trybie podglądu właściciela
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-lg text-gray-900">
              Zamówienie z wyprzedzeniem (opcjonalne)
            </h3>
            {restaurant.categories.map((c) => (
              <div key={c.id} className="space-y-2">
                <div className="text-sm font-medium text-gray-700">{c.name}</div>
                {c.items.map((it) => (
                  <div
                    key={it.id}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex-1">
                      <span className="text-sm text-gray-700">{it.name}</span>
                      <span className="text-xs text-gray-500 ml-2">({formatPrice(it.priceCents)})</span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      placeholder="0"
                      className="w-20 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      value={preorder[it.id] ?? ""}
                      onChange={(e) =>
                        setPreorder((prev) => ({
                          ...prev,
                          [it.id]: e.target.value ? Number(e.target.value) : 0,
                        }))
                      }
                    />
                  </div>
                ))}
              </div>
            ))}

            {totalPrice > 0 && (
              <div className="pt-3 border-t border-gray-300">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-gray-900">Suma do zapłaty:</span>
                  <span className="text-lg font-bold text-orange-600">{formatPrice(totalPrice)}</span>
                </div>
              </div>
            )}

            <p className="text-xs text-gray-600">
              Przed-zamówienie jest przekazywane do kuchni po potwierdzeniu
              rezerwacji.
            </p>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
