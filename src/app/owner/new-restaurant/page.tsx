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
    <main className="max-w-xl mx-auto p-6">
      <Card className="rounded-2xl">
        <CardContent className="p-6 space-y-3">
          <h1 className="text-xl font-semibold">Nowa restauracja</h1>
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label>Nazwa</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Slug (adres)</Label>
              <Input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="np. bistro-aurora"
                required
              />
            </div>
            <div>
              <Label>Opis</Label>
              <Input value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <Button type="submit">Zapisz</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
