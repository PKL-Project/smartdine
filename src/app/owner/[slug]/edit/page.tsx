"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface TableConfig {
  capacity: number;
  quantity: number;
}

interface TimeSlotConfig {
  startMinutes: number;
  durationMinutes: number;
}

interface OpeningHourConfig {
  weekday: number;
  openMinutes: number;
  closeMinutes: number;
}

interface RestaurantData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  slotDurationMinutes: number;
  tableGroups: TableConfig[];
  hours: OpeningHourConfig[];
  timeSlots: TimeSlotConfig[];
}

const WEEKDAYS = ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"];

export default function EditRestaurantPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [slotDuration, setSlotDuration] = useState(90);

  const [tables, setTables] = useState<TableConfig[]>([
    { capacity: 2, quantity: 0 },
    { capacity: 4, quantity: 0 },
    { capacity: 6, quantity: 0 },
    { capacity: 8, quantity: 0 },
  ]);

  const [openingHours, setOpeningHours] = useState<OpeningHourConfig[]>([]);
  const [numSlots, setNumSlots] = useState(8);
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRestaurant() {
      try {
        const res = await fetch(`/api/owner/restaurants/${slug}`);
        if (!res.ok) {
          throw new Error("Failed to load restaurant");
        }
        const data: RestaurantData = await res.json();

        setName(data.name);
        setDesc(data.description || "");
        setSlotDuration(data.slotDurationMinutes);
        setNumSlots(data.timeSlots.length || 8);

        // Merge existing table groups with default capacities
        const mergedTables = [2, 4, 6, 8].map(capacity => {
          const existing = data.tableGroups.find(g => g.capacity === capacity);
          return { capacity, quantity: existing?.quantity || 0 };
        });
        setTables(mergedTables);

        setOpeningHours(data.hours);
      } catch (error) {
        alert("Błąd wczytywania danych restauracji");
      } finally {
        setLoading(false);
      }
    }
    loadRestaurant();
  }, [slug]);

  function minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  function timeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
  }

  function updateOpeningHour(weekday: number, field: "openMinutes" | "closeMinutes", value: number) {
    setOpeningHours((prev) =>
      prev.map((h) => (h.weekday === weekday ? { ...h, [field]: value } : h))
    );
  }

  function toggleWeekday(weekday: number) {
    setOpeningHours((prev) => {
      const exists = prev.find((h) => h.weekday === weekday);
      if (exists) {
        return prev.filter((h) => h.weekday !== weekday);
      } else {
        return [...prev, { weekday, openMinutes: 600, closeMinutes: 1320 }].sort(
          (a, b) => a.weekday - b.weekday
        );
      }
    });
  }

  function validateTimeSlots(): string | null {
    if (openingHours.length === 0) {
      return "Musisz określić przynajmniej jeden dzień otwarcia";
    }

    // Calculate the total time needed for all slots
    const totalSlotTime = numSlots * slotDuration;

    // Check if slots fit within any opening day
    let fitsInAnyDay = false;
    for (const hour of openingHours) {
      const availableMinutes = hour.closeMinutes - hour.openMinutes;
      if (totalSlotTime <= availableMinutes) {
        fitsInAnyDay = true;
        break;
      }
    }

    if (!fitsInAnyDay) {
      const hours = Math.floor(totalSlotTime / 60);
      const mins = totalSlotTime % 60;
      return `Sloty (${numSlots} × ${slotDuration} min = ${hours}h ${mins}min) nie mieszczą się w godzinach otwarcia`;
    }

    return null;
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError(null);

    // Validate time slots
    const error = validateTimeSlots();
    if (error) {
      setValidationError(error);
      return;
    }

    const timeSlots: TimeSlotConfig[] = Array.from({ length: numSlots }, (_, i) => ({
      startMinutes: i * slotDuration,
      durationMinutes: slotDuration,
    }));

    const validTables = tables.filter((t) => t.quantity > 0);

    const res = await fetch(`/api/owner/restaurants/${slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        description: desc,
        tables: validTables,
        openingHours,
        timeSlots,
        slotDurationMinutes: slotDuration,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setValidationError(j.error || "Błąd");
      return;
    }
    router.push("/owner");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center">
        <div className="text-gray-600">Ładowanie...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
      <div className="max-w-4xl mx-auto">
        <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8 space-y-8">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Edytuj restaurację
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Zaktualizuj ustawienia swojej restauracji
              </p>
            </div>
            <form onSubmit={submit} className="space-y-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-800">Podstawowe informacje</h2>
                <div className="space-y-2">
                  <Label className="text-gray-700">Nazwa</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Nazwa Twojej restauracji"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Opis</Label>
                  <Input
                    value={desc}
                    onChange={(e) => setDesc(e.target.value)}
                    className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Krótki opis Twojej restauracji"
                  />
                </div>
              </div>

              {/* Table Configuration */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800">Konfiguracja stolików</h2>
                <p className="text-sm text-gray-600">Określ ile stolików danej wielkości posiadasz</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {tables.map((table, idx) => (
                    <div key={table.capacity} className="space-y-2">
                      <Label className="text-gray-700">
                        Stolik na {table.capacity} os.
                      </Label>
                      <Input
                        type="number"
                        min={0}
                        value={table.quantity}
                        onChange={(e) =>
                          setTables((prev) =>
                            prev.map((t, i) =>
                              i === idx ? { ...t, quantity: Number(e.target.value) } : t
                            )
                          )
                        }
                        className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Opening Hours */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800">Godziny otwarcia</h2>
                <div className="space-y-3">
                  {WEEKDAYS.map((day, weekday) => {
                    const hour = openingHours.find((h) => h.weekday === weekday);
                    const isOpen = !!hour;
                    return (
                      <div key={weekday} className="flex items-center gap-4">
                        <label className="flex items-center gap-2 w-32">
                          <input
                            type="checkbox"
                            checked={isOpen}
                            onChange={() => toggleWeekday(weekday)}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm text-gray-700">{day}</span>
                        </label>
                        {isOpen && hour && (
                          <div className="flex items-center gap-2">
                            <Input
                              type="time"
                              value={minutesToTime(hour.openMinutes)}
                              onChange={(e) =>
                                updateOpeningHour(weekday, "openMinutes", timeToMinutes(e.target.value))
                              }
                              className="w-32 border-gray-300 focus:border-orange-500"
                            />
                            <span className="text-gray-500">—</span>
                            <Input
                              type="time"
                              value={minutesToTime(hour.closeMinutes)}
                              onChange={(e) =>
                                updateOpeningHour(weekday, "closeMinutes", timeToMinutes(e.target.value))
                              }
                              className="w-32 border-gray-300 focus:border-orange-500"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-4 border-t pt-6">
                <h2 className="text-xl font-semibold text-gray-800">Sloty czasowe rezerwacji</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700">Długość slotu (minuty)</Label>
                    <Input
                      type="number"
                      min={30}
                      max={240}
                      step={15}
                      value={slotDuration}
                      onChange={(e) => {
                        setSlotDuration(Number(e.target.value));
                        setValidationError(null);
                      }}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-700">Liczba slotów dziennie</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={numSlots}
                      onChange={(e) => {
                        setNumSlots(Number(e.target.value));
                        setValidationError(null);
                      }}
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-600">
                  Np. godziny otwarcia 10:00-22:00 (12h), sloty 1.5h (90 min) = 8 slotów
                </p>
                {(() => {
                  const totalSlotTime = numSlots * slotDuration;
                  const hours = Math.floor(totalSlotTime / 60);
                  const mins = totalSlotTime % 60;
                  const longestDay = openingHours.reduce((max, h) => {
                    const duration = h.closeMinutes - h.openMinutes;
                    return duration > max ? duration : max;
                  }, 0);
                  const longestHours = Math.floor(longestDay / 60);
                  const longestMins = longestDay % 60;

                  const willFit = totalSlotTime <= longestDay;

                  return (
                    <div className={`text-sm p-3 rounded-lg ${willFit ? 'bg-green-50 text-green-700' : 'bg-amber-50 text-amber-700'}`}>
                      <div>Całkowity czas slotów: <strong>{hours}h {mins}min</strong></div>
                      {openingHours.length > 0 && (
                        <div>Najdłuższy dzień otwarcia: <strong>{longestHours}h {longestMins}min</strong></div>
                      )}
                      {!willFit && openingHours.length > 0 && (
                        <div className="mt-1 font-medium">⚠️ Sloty nie mieszczą się w godzinach otwarcia</div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {validationError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {validationError}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => router.push("/owner")}
                  className="flex-1"
                >
                  Anuluj
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
                >
                  Zapisz zmiany
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
