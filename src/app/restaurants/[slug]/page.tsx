import { prisma } from "@/lib/prisma";
import { money } from "@/lib/format";
import ReserveForm from "./reserve-form";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function RestaurantPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getServerSession(authOptions);

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      owner: true,
      categories: {
        include: {
          items: { where: { isAvailable: true }, orderBy: { name: "asc" } },
        },
        orderBy: { sort: "asc" },
      },
      tables: { orderBy: { capacity: "asc" } },
    },
  });

  // Check if current user is the owner
  const isOwner = session?.user?.email === restaurant?.owner.email;

  if (!restaurant)
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50 p-6">
        <div className="text-gray-700">Nie znaleziono restauracji.</div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-amber-50">
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {isOwner && (
          <div className="bg-blue-50 border-2 border-blue-400 rounded-xl p-4 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-blue-900">Tryb podglądu właściciela</p>
                <p className="text-sm text-blue-700">Przeglądasz swoją restaurację tak, jak widzą ją klienci. Nie możesz dokonać rezerwacji w swojej restauracji.</p>
              </div>
            </div>
          </div>
        )}

        {restaurant.imageUrl && (
          <img
            src={restaurant.imageUrl}
            alt={restaurant.name}
            className="w-full h-56 object-cover rounded-2xl shadow-lg"
          />
        )}
        <div className="space-y-2 bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className="text-sm text-gray-600">
              {restaurant.description}
            </p>
          )}
          {restaurant.owner.email && (
            <p className="text-sm text-gray-600">
              <span className="font-medium">Kontakt:</span> {restaurant.owner.email}
            </p>
          )}
        </div>

        <ReserveForm restaurant={restaurant} isOwnerPreview={isOwner} />

        <section className="grid sm:grid-cols-2 gap-6">
          {restaurant.categories.map((cat) => (
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
