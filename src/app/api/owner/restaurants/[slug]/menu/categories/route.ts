import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyRestaurantOwnershipBySlug, ErrorResponses } from "@/lib/api-middleware";

interface CreateCategoryBody {
  name?: string;
}

// POST /api/owner/restaurants/[slug]/menu/categories - Create a new menu category
export const POST = withOwner<{ slug: string }>(async (req, session, { params }) => {
  const { slug } = await params;
  const body: CreateCategoryBody = await req.json();
  const { name } = body;

  if (!name) {
    return ErrorResponses.badRequest("Category name is required");
  }

  // Verify ownership
  const isOwner = await verifyRestaurantOwnershipBySlug(slug, session.user.email);
  if (!isOwner) {
    return ErrorResponses.forbidden();
  }

  const restaurant = await prisma.restaurant.findUnique({
    where: { slug },
    include: {
      categories: { select: { sort: true }, orderBy: { sort: "desc" }, take: 1 },
    },
  });

  if (!restaurant) {
    return ErrorResponses.notFound("Restaurant not found");
  }

  // Get the next sort value
  const maxSort = restaurant.categories[0]?.sort ?? 0;
  const nextSort = maxSort + 1;

  const category = await prisma.menuCategory.create({
    data: {
      restaurantId: restaurant.id,
      name,
      sort: nextSort,
    },
  });

  return NextResponse.json(category);
});
