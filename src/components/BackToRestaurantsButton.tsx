"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BackToRestaurantsButton() {
  const router = useRouter();

  return (
    <Button
      onClick={() => router.push("/restaurants")}
      variant="outline"
      className="flex items-center gap-2 border-orange-600 text-orange-600 hover:bg-orange-50"
    >
      <ArrowLeft className="w-4 h-4" />
      <span>Wszystkie restauracje</span>
    </Button>
  );
}
