"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { Home } from "lucide-react";

export function GuestHomeButton() {
  const { status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  // Only show button if user is not authenticated and not on root page
  if (status !== "unauthenticated" || pathname === "/") {
    return null;
  }

  return (
    <button
      onClick={() => router.push("/")}
      className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-orange-600 to-amber-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
      aria-label="Strona główna"
      title="Strona główna"
    >
      <Home className="w-6 h-6" />
    </button>
  );
}
