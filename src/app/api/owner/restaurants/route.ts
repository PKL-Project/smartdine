import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withOwner, getUserByEmail, ErrorResponses } from "@/lib/api-middleware";

export const POST = withOwner(async (req, session) => {
  const { name, slug, description } = await req.json();

  if (!name || !slug) {
    return ErrorResponses.badRequest("Missing required fields: name and slug");
  }

  const owner = await getUserByEmail(session.user.email);
  if (!owner) {
    return ErrorResponses.unauthorized();
  }

  // Check if owner already has a restaurant (limit: 1 per owner)
  const existingRestaurant = await prisma.restaurant.findFirst({
    where: { ownerId: owner.id },
  });

  if (existingRestaurant) {
    return ErrorResponses.conflict("You already have a restaurant. Only one restaurant per owner is allowed.");
  }

  const created = await prisma.restaurant.create({
    data: {
      name,
      slug,
      description,
      ownerId: owner.id,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(created);
});
