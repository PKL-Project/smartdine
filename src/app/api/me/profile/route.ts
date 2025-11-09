import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, ErrorResponses } from "@/lib/api-middleware";

interface UpdateProfileBody {
  name?: string | null;
}

export const PATCH = withAuth(async (req, session) => {
  const body: UpdateProfileBody = await req.json();
  const { name } = body;

  const user = await prisma.user.update({
    where: { email: session.user.email },
    data: { name: name ?? null },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user);
});
