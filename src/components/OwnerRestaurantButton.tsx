"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Store } from "lucide-react";
import { useEffect, useState } from "react";

export function OwnerRestaurantButton() {
  const { data: session } = useSession();
  const router = useRouter();
  const [restaurantSlug, setRestaurantSlug] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch if user is an owner
    if (session?.user?.role === "OWNER") {
      fetch("/api/me/restaurant")
        .then((res) => res.json())
        .then((data) => {
          if (data.slug) {
            setRestaurantSlug(data.slug);
          }
        })
        .catch(() => {
          // Silently fail if API doesn't exist yet or errors
        });
    }
  }, [session?.user?.role]);

  // Only show button if user is an owner and has a restaurant
  if (session?.user?.role !== "OWNER" || !restaurantSlug) {
    return null;
  }

  return (
    <button
      onClick={() => router.push("/owner")}
      className="fixed bottom-6 right-24 w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
      aria-label="Przejdź do mojej restauracji"
      title="Moja restauracja"
    >
      <Store className="w-6 h-6" />
    </button>
  );
}
