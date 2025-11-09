import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyRestaurantOwnershipBySlug, ErrorResponses } from "@/lib/api-middleware";

interface CreateMenuItemBody {
  categoryId?: string;
  name?: string;
  description?: string | null;
  priceCents?: number;
}

// POST /api/owner/restaurants/[slug]/menu/items - Create a new menu item
export const POST = withOwner(async (req, session, { params }) => {
  const slug = params.slug as string;
  const body: CreateMenuItemBody = await req.json();
  const { categoryId, name, description, priceCents } = body;

  if (!categoryId || !name || priceCents === undefined) {
    return ErrorResponses.badRequest("categoryId, name, and priceCents are required");
  }

  // Verify ownership
  const isOwner = await verifyRestaurantOwnershipBySlug(slug, session.user.email);
  if (!isOwner) {
    return ErrorResponses.forbidden();
  }

  // Verify category belongs to this restaurant
  const category = await prisma.menuCategory.findFirst({
    where: {
      id: categoryId,
      restaurant: { slug },
    },
  });

  if (!category) {
    return ErrorResponses.notFound("Category not found or does not belong to this restaurant");
  }

  const menuItem = await prisma.menuItem.create({
    data: {
      categoryId,
      name,
      description: description ?? null,
      priceCents,
      isAvailable: true,
    },
  });

  return NextResponse.json(menuItem);
});
