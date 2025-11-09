import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ErrorResponses } from "@/lib/api-middleware";
import { isValidUserRole, USER_ROLES } from "@/types/roles";
import { UserRole } from "@prisma/client";

interface UpdateRoleBody {
  role?: string;
}

export const POST = withAuth(async (req, session) => {
  const body: UpdateRoleBody = await req.json();
  const { role } = body;

  // Validate role using type guard
  if (!role || !isValidUserRole(role)) {
    return ErrorResponses.badRequest(
      `Invalid role. Must be ${USER_ROLES.OWNER} or ${USER_ROLES.CLIENT}`
    );
  }

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { role: role as UserRole },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, userId: user.id });
});
