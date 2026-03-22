"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { money } from "@/lib/format";

type Reservation = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "EDITED";
  startTime: string;
  durationMinutes: number;
  partySize: number;
  tableId: string | null;
  specialRequests: string | null;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    slotDurationMinutes: number;
    tables: { id: string; name: string; capacity: number }[];
    categories: {
      id: string;
      name: string;
      items: { id: string; name: string; description: string | null; priceCents: number }[];
    }[];
  };
  preorderItems: {
    id: string;
    quantity: number;
    menuItem: { id: string; name: string };
  }[];
};

interface TimeSlot {
  slotIndex: number;
  startTime: string;
  endTime: string;
  available: boolean;
}

export default function EditReservationPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = useSession();
  const router = useRouter();
  const [data, setData] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [party, setParty] = useState(2);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [special, setSpecial] = useState("");
  const [preorder, setPreorder] = useState<Record<string, number>>({});

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const res = await fetch(`/api/reservations/${id}`, {
          cache: "no-store",
        });
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || "Failed");

        setData(j);

        // Initialize form with existing data
        setParty(j.partySize);
        const reservationDate = new Date(j.startTime);
        setSelectedDate(reservationDate.toISOString().split('T')[0]);
        setSpecial(j.specialRequests || "");

        // Initialize preorder
        const preorderMap: Record<string, number> = {};
        j.preorderItems?.forEach((item: { menuItem: { id: string }; quantity: number }) => {
          preorderMap[item.menuItem.id] = item.quantity;
        });
        setPreorder(preorderMap);

        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Fetch available slots when date or party size changes
  useEffect(() => {
    async function fetchSlots() {
      if (!selectedDate || !data) return;

      setLoadingSlots(true);
      try {
        const res = await fetch(
          `/api/restaurants/${data.restaurant.slug}/available-slots?date=${selectedDate}&partySize=${party}`
        );
        const slotData = await res.json();
        setAvailableSlots(slotData.availableSlots || []);

        // Auto-select current reservation slots if they match
        if (data && slotData.availableSlots) {
          const reservationStart = new Date(data.startTime);
          const numSlots = Math.ceil(data.durationMinutes / data.restaurant.slotDurationMinutes);

          // Find matching slots
          const matchingSlots: number[] = [];
          for (let i = 0; i < slotData.availableSlots.length; i++) {
            const slot = slotData.availableSlots[i];
            const slotTime = new Date(slot.startTime);
            if (Math.abs(slotTime.getTime() - reservationStart.getTime()) < 60000) {
              // Found starting slot
              for (let j = 0; j < numSlots && i + j < slotData.availableSlots.length; j++) {
                matchingSlots.push(i + j);
              }
              break;
            }
          }

          if (matchingSlots.length > 0) {
            setSelectedSlots(matchingSlots);
          }
        }
      } catch (err) {
        console.error("Failed to fetch slots:", err);
        setAvailableSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    }

    fetchSlots();
  }, [selectedDate, party, data]);

  // Handle slot selection (allow up to 2 sequential slots)
  function handleSlotClick(slotIndex: number) {
    if (selectedSlots.includes(slotIndex)) {
      setSelectedSlots(selectedSlots.filter(i => i !== slotIndex));
    } else if (selectedSlots.length === 0) {
      setSelectedSlots([slotIndex]);
    } else if (selectedSlots.length === 1) {
      const firstSlot = selectedSlots[0];
      if (slotIndex === firstSlot + 1) {
        setSelectedSlots([firstSlot, slotIndex]);
      } else if (slotIndex === firstSlot - 1) {
        setSelectedSlots([slotIndex, firstSlot]);
      } else {
        setSelectedSlots([slotIndex]);
      }
    } else {
      setSelectedSlots([slotIndex]);
    }
  }

  function isSlotSelected(slotIndex: number): boolean {
    return selectedSlots.includes(slotIndex);
  }

  function isOriginalReservationSlot(slotIndex: number): boolean {
    if (!data || !availableSlots[slotIndex]) return false;

    const slot = availableSlots[slotIndex];
    const slotTime = new Date(slot.startTime);
    const reservationStart = new Date(data.startTime);
    const reservationEnd = new Date(reservationStart.getTime() + data.durationMinutes * 60000);

    // Check if this slot is part of the original reservation
    const slotEnd = new Date(slot.endTime);
    return slotTime < reservationEnd && slotEnd > reservationStart;
  }

  function canSelectSlot(slotIndex: number): boolean {
    const slot = availableSlots[slotIndex];
    if (!slot || !slot.available) return false;

    if (selectedSlots.length === 0) return true;
    if (selectedSlots.length === 1) {
      return true;
    }
    return selectedSlots.includes(slotIndex);
  }

  function formatTime(isoString: string): string {
    const date = new Date(isoString);
    return date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !data) return;

    if (selectedSlots.length === 0) {
      setError("Proszę wybrać przynajmniej jeden slot czasowy");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const preorderItems = Object.entries(preorder)
        .filter(([, q]) => Number(q) > 0)
        .map(([menuItemId, q]) => ({ menuItemId, quantity: Number(q) }));

      // Get the start time from the first selected slot
      const firstSlotIndex = Math.min(...selectedSlots);
      const firstSlot = availableSlots[firstSlotIndex];

      // Calculate duration based on number of slots
      const totalDuration = selectedSlots.length * data.restaurant.slotDurationMinutes;

      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: firstSlot.startTime,
          durationMinutes: totalDuration,
          partySize: Number(party),
          specialRequests: special || null,
          preorderItems,
        }),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Update failed");

      router.push(`/reservations/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !data) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-5xl mx-auto p-6">
          <p className="text-gray-600">Ładowanie...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
        <div className="max-w-5xl mx-auto p-6">
          <p className="text-red-600">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <div className="space-y-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Edytuj rezerwację
          </h1>
          <p className="text-sm text-gray-600">
            Restauracja: <span className="font-medium">{data.restaurant.name}</span>
          </p>
          <p className="text-xs text-amber-600">
            Po zapisaniu zmian, rezerwacja będzie wymagała ponownej akceptacji przez właściciela.
          </p>
        </div>

        <Card className="rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="grid md:grid-cols-2 gap-6">
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
                        {selectedSlots.length} slot{selectedSlots.length > 1 ? 'y' : ''} ({selectedSlots.length * (data?.restaurant.slotDurationMinutes || 90)} min)
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
                    <div>
                      {data && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-700">
                          <strong>Obecna rezerwacja:</strong> {new Date(data.startTime).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                          {' '}({data.durationMinutes} min)
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-2 border rounded-lg">
                        {availableSlots.map((slot) => {
                          const isSelected = isSlotSelected(slot.slotIndex);
                          const isOriginal = isOriginalReservationSlot(slot.slotIndex);
                          const canSelect = canSelectSlot(slot.slotIndex);

                          return (
                            <button
                              key={slot.slotIndex}
                              type="button"
                              disabled={!canSelect}
                              onClick={() => handleSlotClick(slot.slotIndex)}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors relative ${
                                isSelected
                                  ? 'bg-orange-600 text-white ring-2 ring-orange-300'
                                  : isOriginal && !isSelected
                                  ? 'bg-blue-100 text-blue-700 border-2 border-blue-300'
                                  : canSelect && slot.available
                                  ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              }`}
                            >
                              {formatTime(slot.startTime)}
                              {isOriginal && !isSelected && (
                                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
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
                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={submitting || selectedSlots.length === 0}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow disabled:opacity-50"
                  >
                    {submitting ? "Zapisuję…" : "Zapisz zmiany"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/reservations/${id}`)}
                    className="border-gray-300"
                  >
                    Anuluj
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-lg text-gray-900">
                  Zamówienie z wyprzedzeniem (opcjonalne)
                </h3>
                {data.restaurant.categories.map((c) => (
                  <div key={c.id} className="space-y-2">
                    <div className="text-sm font-medium text-gray-700">{c.name}</div>
                    {c.items.map((it) => (
                      <div
                        key={it.id}
                        className="flex items-center justify-between gap-2"
                      >
                        <span className="text-sm text-gray-700">{it.name}</span>
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
                <p className="text-xs text-gray-600">
                  Przed-zamówienie jest przekazywane do kuchni po potwierdzeniu
                  rezerwacji.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <section className="grid sm:grid-cols-2 gap-6">
          {data.restaurant.categories.map((cat) => (
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
                      {it.description && (
                        <div className="text-xs text-gray-600">
                          {it.description}
                        </div>
                      )}
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
