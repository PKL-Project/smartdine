import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyRestaurantOwnershipBySlug, ErrorResponses } from "@/lib/api-middleware";

interface UpdateMenuItemBody {
  isAvailable?: boolean;
  name?: string;
  description?: string | null;
  priceCents?: number;
}

// PATCH /api/owner/restaurants/[slug]/menu/items/[id] - Update menu item
export const PATCH = withOwner(async (req, session, { params }) => {
  const slug = params.slug as string;
  const itemId = params.id as string;
  const body: UpdateMenuItemBody = await req.json();

  // Verify ownership
  const isOwner = await verifyRestaurantOwnershipBySlug(slug, session.user.email);
  if (!isOwner) {
    return ErrorResponses.forbidden();
  }

  // Verify item belongs to this restaurant
  const item = await prisma.menuItem.findFirst({
    where: {
      id: itemId,
      category: {
        restaurant: { slug },
      },
    },
  });

  if (!item) {
    return ErrorResponses.notFound("Menu item not found or does not belong to this restaurant");
  }

  const updated = await prisma.menuItem.update({
    where: { id: itemId },
    data: body,
  });

  return NextResponse.json(updated);
});

// DELETE /api/owner/restaurants/[slug]/menu/items/[id] - Delete menu item
export const DELETE = withOwner(async (req, session, { params }) => {
  const slug = params.slug as string;
  const itemId = params.id as string;

  // Verify ownership
  const isOwner = await verifyRestaurantOwnershipBySlug(slug, session.user.email);
  if (!isOwner) {
    return ErrorResponses.forbidden();
  }

  // Verify item belongs to this restaurant
  const item = await prisma.menuItem.findFirst({
    where: {
      id: itemId,
      category: {
        restaurant: { slug },
      },
    },
  });

  if (!item) {
    return ErrorResponses.notFound("Menu item not found or does not belong to this restaurant");
  }

  await prisma.menuItem.delete({
    where: { id: itemId },
  });

  return NextResponse.json({ success: true });
});
