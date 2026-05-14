import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, verifyRestaurantOwnershipBySlug, ErrorResponses } from "@/lib/api-middleware";

// DELETE /api/owner/restaurants/[slug]/menu/categories/[id] - Delete menu category
export const DELETE = withOwner<{ slug: string; id: string }>(async (req, session, { params }) => {
  const { slug, id: categoryId } = await params;

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
    include: {
      items: { select: { id: true } },
    },
  });

  if (!category) {
    return ErrorResponses.notFound("Category not found or does not belong to this restaurant");
  }

  // Check if category has items
  if (category.items.length > 0) {
    return ErrorResponses.badRequest("Nie można usunąć kategorii zawierającej pozycje. Usuń najpierw wszystkie pozycje z tej kategorii.");
  }

  await prisma.menuCategory.delete({
    where: { id: categoryId },
  });

  return NextResponse.json({ success: true });
});
