"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Home } from "lucide-react";

export function ClientHomeButton() {
  const { data: session } = useSession();
  const router = useRouter();

  // Only show button if user is a client
  if (session?.user?.role !== "CLIENT") {
    return null;
  }

  return (
    <button
      onClick={() => router.push("/client")}
      className="fixed bottom-6 right-24 w-14 h-14 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110 flex items-center justify-center z-50"
      aria-label="Strona główna"
      title="Strona główna"
    >
      <Home className="w-6 h-6" />
    </button>
  );
}
