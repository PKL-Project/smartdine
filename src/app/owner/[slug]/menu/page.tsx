"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

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

export default function MenuManagementPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");

  const [showItemForm, setShowItemForm] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  useEffect(() => {
    fetchMenu();
  }, [slug]);

  async function fetchMenu() {
    setLoading(true);
    try {
      const res = await fetch(`/api/owner/restaurants/${slug}/menu`);
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error("Failed to fetch menu:", error);
    } finally {
      setLoading(false);
    }
  }

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/owner/restaurants/${slug}/menu/categories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });

    if (res.ok) {
      setNewCategoryName("");
      setShowCategoryForm(false);
      fetchMenu();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd");
    }
  }

  async function createMenuItem(categoryId: string, e: React.FormEvent) {
    e.preventDefault();
    const priceCents = Math.round(parseFloat(newItemPrice) * 100);

    const res = await fetch(`/api/owner/restaurants/${slug}/menu/items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        categoryId,
        name: newItemName,
        description: newItemDescription || null,
        priceCents,
      }),
    });

    if (res.ok) {
      setNewItemName("");
      setNewItemDescription("");
      setNewItemPrice("");
      setShowItemForm(null);
      fetchMenu();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd");
    }
  }

  async function toggleItemAvailability(itemId: string, isAvailable: boolean) {
    const res = await fetch(`/api/owner/restaurants/${slug}/menu/items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !isAvailable }),
    });

    if (res.ok) {
      fetchMenu();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd");
    }
  }

  async function deleteItem(itemId: string) {
    if (!confirm("Czy na pewno chcesz usunąć tę pozycję?")) return;

    const res = await fetch(`/api/owner/restaurants/${slug}/menu/items/${itemId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      fetchMenu();
    } else {
      const data = await res.json();
      alert(data.error || "Błąd");
    }
  }

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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              Zarządzanie menu
            </h1>
            <p className="text-sm text-gray-600">
              Dodaj kategorie i pozycje menu
            </p>
          </div>
          <Button
            variant="secondary"
            onClick={() => router.push("/owner")}
            className="hover:shadow-md transition-shadow"
          >
            Powrót
          </Button>
        </div>

        {/* Add Category Button */}
        <div>
          {!showCategoryForm ? (
            <Button
              onClick={() => setShowCategoryForm(true)}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
            >
              Dodaj kategorię
            </Button>
          ) : (
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg">
              <CardContent className="p-4">
                <form onSubmit={createCategory} className="space-y-3">
                  <div>
                    <Label className="text-gray-700">Nazwa kategorii</Label>
                    <Input
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="np. Przystawki"
                      required
                      className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
                    >
                      Zapisz
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setShowCategoryForm(false);
                        setNewCategoryName("");
                      }}
                    >
                      Anuluj
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Categories and Items */}
        <div className="space-y-6">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-600">
              Brak kategorii. Dodaj pierwszą kategorię, aby zacząć.
            </p>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="bg-white/80 backdrop-blur-sm shadow-lg">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">{category.name}</h2>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowItemForm(category.id)}
                      className="hover:shadow-md transition-shadow"
                    >
                      Dodaj pozycję
                    </Button>
                  </div>

                  {/* Add Item Form */}
                  {showItemForm === category.id && (
                    <div className="border border-orange-200 rounded-lg p-4 space-y-3 bg-orange-50/50">
                      <form onSubmit={(e) => createMenuItem(category.id, e)} className="space-y-3">
                        <div>
                          <Label className="text-gray-700">Nazwa dania</Label>
                          <Input
                            value={newItemName}
                            onChange={(e) => setNewItemName(e.target.value)}
                            placeholder="np. Bruschetta"
                            required
                            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">Opis (opcjonalny)</Label>
                          <Input
                            value={newItemDescription}
                            onChange={(e) => setNewItemDescription(e.target.value)}
                            placeholder="np. Pomidor, bazylia, oliwa"
                            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div>
                          <Label className="text-gray-700">Cena (PLN)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={newItemPrice}
                            onChange={(e) => setNewItemPrice(e.target.value)}
                            placeholder="np. 19.90"
                            required
                            className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            type="submit"
                            size="sm"
                            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
                          >
                            Dodaj
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setShowItemForm(null);
                              setNewItemName("");
                              setNewItemDescription("");
                              setNewItemPrice("");
                            }}
                          >
                            Anuluj
                          </Button>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Menu Items */}
                  <div className="space-y-2">
                    {category.items.length === 0 ? (
                      <p className="text-sm text-gray-600">
                        Brak pozycji w tej kategorii
                      </p>
                    ) : (
                      category.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 hover:shadow-md transition-shadow"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {item.name}
                              {!item.isAvailable && (
                                <span className="ml-2 text-xs text-gray-500">
                                  (niedostępne)
                                </span>
                              )}
                            </div>
                            {item.description && (
                              <div className="text-xs text-gray-600">
                                {item.description}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-sm font-medium text-orange-600">
                              {(item.priceCents / 100).toFixed(2)} zł
                            </div>
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  toggleItemAvailability(item.id, item.isAvailable)
                                }
                                className="hover:shadow-md transition-shadow"
                              >
                                {item.isAvailable ? "Ukryj" : "Pokaż"}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteItem(item.id)}
                                className="hover:shadow-md transition-shadow"
                              >
                                Usuń
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </main>
  );
}
