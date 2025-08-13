import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "OWNER")
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, slug, description } = await req.json();
  if (!name || !slug)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const owner = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  const created = await prisma.restaurant.create({
    data: {
      name,
      slug,
      description,
      ownerId: owner!.id,
    },
    select: { id: true, slug: true },
  });

  return NextResponse.json(created);
}
