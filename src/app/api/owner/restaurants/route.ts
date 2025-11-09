import { NextRequest, NextResponse } from "next/server";
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
