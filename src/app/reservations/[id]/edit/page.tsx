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
  partySize: number;
  tableId: string | null;
  specialRequests: string | null;
  restaurant: {
    id: string;
    name: string;
    slug: string;
    timeSlotIntervalMinutes: number;
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
  const [start, setStart] = useState("");
  const [tableId, setTableId] = useState<string>("");
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
        const localDate = new Date(j.startTime);
        setStart(
          new Date(localDate.getTime() - localDate.getTimezoneOffset() * 60000)
            .toISOString()
            .slice(0, 16)
        );
        setTableId(j.tableId || "");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !data) return;

    setSubmitting(true);
    setError(null);

    try {
      const preorderItems = Object.entries(preorder)
        .filter(([, q]) => Number(q) > 0)
        .map(([menuItemId, q]) => ({ menuItemId, quantity: Number(q) }));

      const res = await fetch(`/api/reservations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: new Date(start).toISOString(),
          partySize: Number(party),
          tableId: tableId || null,
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
                  <Label className="text-gray-700">Data i godzina</Label>
                  <Input
                    type="datetime-local"
                    value={start}
                    onChange={(e) => setStart(e.target.value)}
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
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-700">Stolik (opcjonalnie)</Label>
                  <select
                    className="border border-gray-300 rounded-md h-10 px-3 w-full focus:border-orange-500 focus:ring-orange-500 cursor-pointer"
                    value={tableId}
                    onChange={(e) => setTableId(e.target.value)}
                  >
                    <option value="">Dowolny</option>
                    {data.restaurant.tables.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} • {t.capacity} os.
                      </option>
                    ))}
                  </select>
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
                    disabled={submitting}
                    className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
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
