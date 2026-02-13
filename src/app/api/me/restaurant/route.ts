import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ErrorResponses } from "@/lib/api-middleware";
import { USER_ROLES } from "@/types/roles";

export const GET = withAuth(async (req, session) => {
  // Only owners can access this endpoint
  if (session.user.role !== USER_ROLES.OWNER) {
    return ErrorResponses.forbidden("Only restaurant owners can access this endpoint");
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      restaurants: {
        select: {
          slug: true,
          name: true,
        },
        take: 1,
      },
    },
  });

  if (!user?.restaurants.length) {
    return NextResponse.json({ slug: null, name: null });
  }

  const restaurant = user.restaurants[0];
  return NextResponse.json({ slug: restaurant.slug, name: restaurant.name });
});
