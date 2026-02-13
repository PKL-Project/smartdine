"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NewRestaurantPage() {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [desc, setDesc] = useState("");
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/owner/restaurants", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, slug, description: desc }),
    });
    const j = await res.json();
    if (!res.ok) {
      alert(j.error || "Błąd");
      return;
    }
    router.push("/owner");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 flex items-center justify-center p-6">
      <div className="max-w-xl w-full">
        <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                Nowa restauracja
              </h1>
              <p className="text-sm text-gray-600 mt-2">
                Utwórz swoją pierwszą restaurację w SmartDine
              </p>
            </div>
            <form onSubmit={submit} className="space-y-4">
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
                <Label className="text-gray-700">Slug (adres URL)</Label>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="np. bistro-aurora"
                  required
                  className="border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                />
                <p className="text-xs text-gray-500">
                  Będzie używany w adresie URL: smartdine.com/restaurants/{slug || "twoj-slug"}
                </p>
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
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:shadow-lg transition-shadow"
              >
                Zapisz
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
