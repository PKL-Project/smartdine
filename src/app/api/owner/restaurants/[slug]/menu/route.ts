import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyRestaurantOwnershipBySlug, ErrorResponses } from "@/lib/api-middleware";

// GET /api/owner/restaurants/[slug]/menu - Get restaurant menu with categories and items
export const GET = withOwner<{ slug: string }>(async (_, session, { params }) => {
  const { slug } = await params;

  // Verify ownership
  const isOwner = await verifyRestaurantOwnershipBySlug(slug, session.user.email);
  if (!isOwner) {
    return ErrorResponses.forbidden();
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: {
        include: {
          items: {
            orderBy: { name: "asc" },
          },
        },
        orderBy: { sort: "asc" },
      },
    },
  });

  if (!restaurant) {
    return ErrorResponses.notFound("Restaurant not found");
  }

  return NextResponse.json({
    id: restaurant.id,
    name: restaurant.name,
    slug: restaurant.slug,
    categories: restaurant.categories,
  });
});
