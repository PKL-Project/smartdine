import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { Resend } from "resend";
import { prisma } from "./prisma";

const resend = new Resend(process.env.RESEND_API_KEY!);

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    EmailProvider({
      async sendVerificationRequest({ identifier, url }) {
        await resend.emails.send({
          from: process.env.EMAIL_FROM!,
          to: identifier,
          subject: "Sign in to Restaurant Reserve",
          html: `
            <p>Click the link below to sign in:</p>
            <p><a href="${url}">Sign in</a></p>
            <p>This link will expire soon. If you didn't request it, please ignore.</p>
          `,
          text: `Sign in to Restaurant Reserve: ${url}`,
        });
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On initial sign-in: copy data from DB
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { id: true, name: true, role: true },
        });
        token.id = dbUser?.id;
        token.name = dbUser?.name;
        token.role = dbUser?.role ?? null;
        return token;
      }

      // When the client calls session.update()
      if (trigger === "update") {
        if (session?.role) {
          token.role = session.role;
        }
        if (session?.name !== undefined) {
          token.name = session.name;
        }
        return token;
      }

      // Keep token in sync with DB (simple & reliable)
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true, name: true, role: true },
        });
        token.id = dbUser?.id;
        token.name = dbUser?.name;
        token.role = dbUser?.role ?? null;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub;
      }
      session.user.name = (token.name as string | null) ?? null;
      session.user.role = token.role ?? null;
      return session;
    },
  },
  pages: { signIn: "/login" },
};
