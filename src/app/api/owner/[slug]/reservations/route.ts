import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ErrorResponses } from "@/lib/api-middleware";
import { USER_ROLES } from "@/types/roles";

export const GET = withAuth(async (req, session, { params }) => {
  const { slug } = await params;

  // Only owners can access this endpoint
  if (session.user.role !== USER_ROLES.OWNER) {
    return ErrorResponses.forbidden("Only restaurant owners can access this endpoint");
  }

  const restaurant = await prisma.restaurant.findFirst({
    where: { slug, owner: { email: session.user.email } },
    select: {
      id: true,
      name: true,
      reservations: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { email: true } } },
        take: 50,
      },
    },
  });

  if (!restaurant) {
    return ErrorResponses.notFound("Restaurant not found");
  }

  return NextResponse.json(restaurant);
});
