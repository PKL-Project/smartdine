import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { redirect } from "next/navigation";

export default async function OwnerHome() {
  const session = await getServerSession(authOptions);

  const email = session?.user?.email;
  if (!email) {
    redirect("/login");
  }

  const me = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      restaurants: { select: { id: true, name: true, slug: true } },
    },
  });

  // If owner has no restaurant, redirect to create one
  if (!me?.restaurants.length) {
    redirect("/owner/new-restaurant");
  }

  // Get the single restaurant (we know it exists from the check above)
  const restaurant = me.restaurants[0];

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            Panel właściciela
          </h1>
          <p className="text-gray-600">
            Zarządzaj swoją restauracją w jednym miejscu
          </p>
        </div>

        {/* Restaurant Card */}
        <Card className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-xl border-2 border-orange-100">
          <CardContent className="p-8">
            <div className="space-y-6">
              {/* Restaurant Info */}
              <div className="text-center pb-4 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900">{restaurant.name}</h2>
                <p className="text-sm text-gray-500 mt-1">/{restaurant.slug}</p>
              </div>

              {/* Action Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Reservations - Primary */}
                <Link
                  href={`/owner/${restaurant.slug}/reservations`}
                  className="group col-span-1 md:col-span-2"
                >
                  <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 p-6 text-white hover:shadow-2xl transition-all duration-300 hover:scale-[1.02]">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">Rezerwacje</h3>
                        <p className="text-orange-100 text-sm">Zarządzaj rezerwacjami i stolami</p>
                      </div>
                      <svg className="w-12 h-12 opacity-80 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Menu */}
                <Link href={`/owner/${restaurant.slug}/menu`} className="group">
                  <div className="h-full rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-orange-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-orange-300">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Menu</h3>
                        <p className="text-gray-600 text-sm">Edytuj dania i kategorie</p>
                      </div>
                      <svg className="w-10 h-10 text-orange-600 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Edit Restaurant */}
                <Link href={`/owner/${restaurant.slug}/edit`} className="group">
                  <div className="h-full rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-blue-300">
                    <div className="flex items-center justify-between h-full">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Edytuj</h3>
                        <p className="text-gray-600 text-sm">Dane restauracji</p>
                      </div>
                      <svg className="w-10 h-10 text-blue-600 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                  </div>
                </Link>

                {/* Preview */}
                <Link href={`/restaurants/${restaurant.slug}`} className="group col-span-1 md:col-span-2">
                  <div className="rounded-xl bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200 p-6 hover:shadow-xl transition-all duration-300 hover:scale-[1.02] hover:border-gray-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">Podgląd restauracji</h3>
                        <p className="text-gray-600 text-sm">Zobacz jak widzą Cię klienci</p>
                      </div>
                      <svg className="w-10 h-10 text-gray-600 opacity-60 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
